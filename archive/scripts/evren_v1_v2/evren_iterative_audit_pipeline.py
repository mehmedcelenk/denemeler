#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN + MEB Ders Kitabı Destekli Öz-Denetimli (Self-Verifying) Kavram & Formül Motoru.

Üç Aşamalı Döngü ("Ne Fazla Ne Eksik"):
1. Aşama (Fazla Olmasın - Gürültü & Tekrar Temizliği):
   - Günlük dildeki kelimelerin (bağlı, bağlıdır, oranla, zamanda, türü vb.) yanlışlıkla balonlanmasını temizler.
   - Aynı soru kökünde veya aynı şıkta birebir aynı kavramın 2+ kez tekrar tekrar çizilmesini tekilleştirir.
2. Aşama (Eksik Olmasın - Dönem Bazlı Ders Kitabı + EVREN Taraması):
   - Her dersin her döneminde (MAT 1..4, FIZ 1..4, KIM 1..4, BIO 1..4, COG 1..4, FEL 1..4, DIN 1..8,
     SAG 1..2, KLM 1..2, INK 1..2, TAR 1..6, TDE 1..8, AOF_*) balonsuz kalan soruları tespit eder.
   - İlgili dönemin `docs/dersler/<ders>/<ders>_<donem>/<ders>_<donem>.md` ders kitabı bağlamıyla birlikte
     EVREN (`deepseek-v4.1-flash`) üzerinden paralel tarama yaparak eksik müfredat kavramlarını çıkarır.
   - Kısa kavramları 1-2 cümlelik düz metin; çok özellikli veya formüllü kavramları ise `\n• ` madde işaretli,
     `**kalın**` vurgulu ve `$...$` KaTeX matematik ifadeli olarak biçimlendirir.
3. Aşama (Öz-Denetim / Critic Loop):
   - Üretilen tüm balonları tekrar tarar; bozuk LaTeX (`$` dengesizliği), boş açıklama veya stopword sızıntısı
     varsa otomatik onarır ve denetim raporunu üretir.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
import html
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.core.evren_client import EvrenClient

SUBJECTS_DIR = ROOT_DIR / "data" / "subjects"
CONCEPTS_DIR = ROOT_DIR / "data" / "concepts"
DERSLER_DIR = ROOT_DIR / "docs" / "dersler"

# Günlük dilde sık geçen ve tek başına kavram balonu olmaması gereken kelimeler
STRICT_STOPWORDS: Set[str] = {
    "bağlı", "bağlıdır", "bağlantı", "bağlantılı", "bağlamda", "bağlamında",
    "oranla", "oranda", "türü", "türlü", "türden", "türlerine", "bazı", "bazıları",
    "zamanda", "zamanla", "zamanlarda", "olarak", "göre", "vardır", "yoktur",
    "içinde", "arasında", "üzerinde", "altında", "sonra", "önce", "kadar",
    "bunun", "বuna", "şekilde", "ifadelerden", "hangisidir", "hangisi",
    "doğrudur", "yanlıştır", "ulaşılır", "söylenebilir", "söylenemez",
}

SPAN_RE = re.compile(
    r'<span\s+class="vocab-word\s+concept-word"\s+data-tr="([^"]*)"(?:\s+data-ar="[^"]*")?\s+data-note="([^"]*)"\s+onclick="showVocabBubble\(this,\s*event\)">(.*?)</span>',
    re.DOTALL,
)


def clean_and_deduplicate_xray(xray_html: str, upgrade_dry: bool = False) -> Tuple[str, int, int]:
    """Bir HTML metnindeki (soru_xray veya şık) gürültülü ve mükerrer balonları temizler.

    Döner: (temiz_html, kalan_balon_sayisi, silinen_balon_sayisi)
    """
    if not xray_html or "concept-word" not in xray_html:
        return xray_html, 0, 0

    seen_notes: Set[str] = set()
    kept = 0
    removed = 0

    def repl(match: re.Match) -> str:
        nonlocal kept, removed
        tr_val = html.unescape(match.group(1)).strip()
        note_val = html.unescape(match.group(2)).strip()
        inner_text = html.unescape(match.group(3)).strip()
        lower_inner = inner_text.lower()

        # 1. Stopword veya çok kısa (<2 harf) kontrolü veya eski kuru balon yükseltmesi
        if (
            lower_inner in STRICT_STOPWORDS
            or len(lower_inner) < 2
            or not tr_val
            or (upgrade_dry and "💡" not in tr_val)
        ):
            removed += 1
            return html.escape(inner_text)

        # 2. Aynı kavram (veya aynı kelime) aynı blokta ikinci kez geçiyorsa sade metne çevir
        dedup_key = note_val.split("•")[-1].strip().lower() if "•" in note_val else tr_val[:40].lower()
        if dedup_key in seen_notes or lower_inner in seen_notes:
            removed += 1
            return html.escape(inner_text)

        # 3. Dengesiz $ kontrolü (varsa düzelt)
        single_dollars = len(re.findall(r"(?<!\$)\$(?!\$)", tr_val))
        if single_dollars % 2 != 0:
            tr_val = tr_val.replace("$", "")

        seen_notes.add(dedup_key)
        seen_notes.add(lower_inner)
        kept += 1
        tr_esc = html.escape(tr_val, quote=True)
        note_esc = html.escape(note_val, quote=True)
        return (
            f'<span class="vocab-word concept-word" '
            f'data-tr="{tr_esc}" data-note="{note_esc}" '
            f'onclick="showVocabBubble(this, event)">{html.escape(inner_text)}</span>'
        )

    cleaned = SPAN_RE.sub(repl, xray_html)
    return cleaned, kept, removed


def audit_and_clean_subject_questions(
    questions: List[Dict[str, Any]],
    upgrade_dry: bool = False,
) -> Tuple[int, int]:
    """Pass 1: Mevcut sorulardaki fazla/hatalı balonları temizler."""
    total_kept = 0
    total_removed = 0
    for q in questions:
        if "soru_xray" in q:
            cleaned, kept, rem = clean_and_deduplicate_xray(q["soru_xray"], upgrade_dry=upgrade_dry)
            total_kept += kept
            total_removed += rem
            if kept > 0:
                q["soru_xray"] = cleaned
            else:
                del q["soru_xray"]

        if "secenekler_xray" in q and isinstance(q["secenekler_xray"], dict):
            new_opts: Dict[str, str] = {}
            for k, v in q["secenekler_xray"].items():
                cleaned, kept, rem = clean_and_deduplicate_xray(v, upgrade_dry=upgrade_dry)
                total_kept += kept
                total_removed += rem
                if kept > 0:
                    new_opts[k] = cleaned
            if new_opts:
                q["secenekler_xray"] = new_opts
            else:
                del q["secenekler_xray"]

    return total_kept, total_removed


def load_textbook_headings_hint(sub_code: str, sem: int) -> str:
    """İlgili dersin dönem Markdown dosyasından başlık ve anahtar özet ipuçlarını okur."""
    folder = sub_code.lower()
    md_path = DERSLER_DIR / folder / f"{folder}_{sem}" / f"{folder}_{sem}.md"
    if md_path.exists():
        try:
            text = md_path.read_text(encoding="utf-8", errors="ignore")
            lines = [ln.strip() for ln in text.splitlines() if len(ln.strip()) > 4]
            sample = "\n".join(lines[:60])
            if sample.strip():
                return sample[:2500]
        except Exception:
            pass

    # Fallback 1: docs/dersler/<folder>/<folder>_<sem>/<folder>_<sem>_kavramlar.json
    kavramlar_path = DERSLER_DIR / folder / f"{folder}_{sem}" / f"{folder}_{sem}_kavramlar.json"
    if not kavramlar_path.exists():
        # Fallback 2: data/concepts/<sub_code>_<sem>_concepts.json
        kavramlar_path = CONCEPTS_DIR / f"{sub_code.upper()}_{sem}_concepts.json"
    if not kavramlar_path.exists():
        kavramlar_path = CONCEPTS_DIR / f"{sub_code.upper()}_concepts.json"

    if kavramlar_path.exists():
        try:
            raw_c = json.loads(kavramlar_path.read_text(encoding="utf-8"))
            if isinstance(raw_c, list):
                terms = [c.get("term", "") for c in raw_c if isinstance(c, dict) and c.get("term")]
                return "Müfredat Anahtar Kavramları:\n" + ", ".join(terms[:45])
        except Exception:
            pass
    return ""


def extract_concepts_for_unbubbled_batch(
    client: EvrenClient,
    sub_code: str,
    ders_name: str,
    sem: int,
    batch_qs: List[Dict[str, Any]],
    textbook_hint: str,
) -> List[Dict[str, Any]]:
    """Balonsuz kalmış sorular için EVREN (deepseek-v4.1-flash) üzerinden döneme uygun kavram/formül çıkarır."""
    q_lines = []
    for q in batch_qs:
        stem = re.sub(r"\s+", " ", q.get("soru", "")).strip()
        opts = " | ".join(f"{k}) {re.sub(r'\\s+', ' ', v).strip()}" for k, v in q.get("secenekler", {}).items())
        ans = q.get("dogru_cevap", "A")
        q_lines.append(f"ID:{q['id']} | Soru: {stem[:220]} | Şıklar: {opts[:180]} | Doğru:{ans}")

    questions_block = "\n".join(q_lines)

    system_prompt = (
        "Sen MEB Açık Öğretim Lisesi (AÖL) Baş Pedagoji ve Müfredat Mimarısın.\n"
        "Görevin: Verilen dönem sorularının her biri için soru kökünde veya şıklarda geçen EN ÖNEMLİ 1 veya 2 "
        "müfredat kavramını/terimini seçmek ve öğrenci o kavrama tıkladığında **konuyu 3 saniyede sıfırdan öğreneceği** "
        "yeni nesil balon açıklamasını yazmaktır.\n"
        "ALTIN ANAYASA KURALLARI:\n"
        "1. 'exact_word': Soru kökünde veya şıklarda BİREBİR geçen kavram kelimesi/ifadesi. Günlük dil kelimelerini (olarak, göre, bağlı, zaman) ASLA seçme!\n"
        "2. 'term': Kavramın tekil, kanonik başlığı (Asla başka kavramlarla birleştirilmiş ünite başlığı yazma; sadece o kelimenin öz kimliğini anlat).\n"
        "3. 'sayfa': MEB ders kitabındaki tahmini/gerçek sayfa numarası (tam sayı, örn: 42).\n"
        "4. 'tanim':\n"
        "   - İlk kısımda (1-2 akıcı cümle): Hiç bilmeyen bir öğrencinin anında kavrayacağı duru Türkçe kullan; yeri geldiğinde "
        "**Türk ve İslam tarihinin/kültürünün köklerinden** (Harezmi, El-Cezeri, İbn Haldun, Orhun, Fatih, Ahilik), yeri geldiğinde ise "
        "**modern bilim, teknoloji ve güncel yaşamdan** (yapay zekâ, mikroçipler, fiber optik, sinema kurgusu, siber güvenlik, GPS) "
        "doğal ve akılda kalıcı bir analoji/hikaye kur.\n"
        "   - Alt satırda mutlaka `\\n💡 Sınav Şifresi: ...` veya `\\n💡 Formül: $...$` satırı ekle ve soruyu doğrudan çözdüren kuralı/ipucunu yaz. Matematiksel ifadeleri `$...$` içine al.\n"
        "5. Yalnızca geçerli bir JSON dizisi döndür: "
        '[{"qid": 123, "exact_word": "...", "term": "...", "sayfa": 45, "tanim": "..."}]'
    )

    user_prompt = (
        f"Ders ve Dönem: {ders_name} (Dönem {sem})\n"
        f"Ders Kitabı Özeti:\n{textbook_hint[:1000]}\n\n"
        f"Balonsuz Sorular:\n{questions_block}\n\n"
        "Lütfen her soru için JSON dizisini üret:"
    )

    try:
        content, _ = client.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model="deepseek-v4.1-flash",
            temperature=0.1,
            max_tokens=4096,
            thinking=False,
        )
        # JSON bloğunu ayıkla
        cleaned = content.strip()
        if "```" in cleaned:
            m = re.search(r"```(?:json)?\s*([\s\S]+?)```", cleaned)
            if m:
                cleaned = m.group(1).strip()
        start_bracket = cleaned.find("[")
        end_bracket = cleaned.rfind("]")
        if start_bracket != -1 and end_bracket != -1:
            arr = json.loads(cleaned[start_bracket : end_bracket + 1])
            if isinstance(arr, list):
                return arr
    except Exception as e:
        print(f"  [!] EVREN batch hatası ({ders_name}): {e}")
    return []


def inject_exact_word_bubble(
    text: str,
    exact_word: str,
    tanim: str,
    note: str,
) -> Tuple[str, bool]:
    """Düz metin içinde exact_word'ü bulup ilk geçtiği yeri güvenli kavram balonuna dönüştürür."""
    if not text or not exact_word:
        return html.escape(text), False

    w = exact_word.strip().strip("'\"").strip(".,;:").strip()
    if len(w) < 2 or w.lower() in STRICT_STOPWORDS:
        return html.escape(text), False

    flat_text = re.sub(r"-\n\s*", "", text)
    flat_text = re.sub(r"\n\s*", " ", flat_text).strip()

    # Kök kontrolü (çoğul -ler/-lar durumunda tekil kökü de yakalayabilmek için)
    stem_w = w[:-3] if (w.lower().endswith("ler") or w.lower().endswith("lar")) and len(w) > 5 else w

    pattern = re.compile(
        rf"(?<![A-Za-zÇĞİÖŞÜçğıöşü])({re.escape(stem_w)}[a-zçğıöşü]*)(?![A-Za-zÇĞİÖŞÜçğıöşü])",
        re.IGNORECASE,
    )
    m = pattern.search(flat_text)
    if not m:
        # Kök ile bulunamadıysa tam sözcükle son bir deneme yap
        pattern_full = re.compile(
            rf"(?<![A-Za-zÇĞİÖŞÜçğıöşü])({re.escape(w)}[a-zçğıöşü]*)(?![A-Za-zÇĞİÖŞÜçğıöşü])",
            re.IGNORECASE,
        )
        m = pattern_full.search(flat_text)
        if not m:
            return html.escape(flat_text), False

    start, end = m.span()
    matched_surface = m.group(0)
    if matched_surface.lower() in STRICT_STOPWORDS or len(matched_surface.strip()) < 2:
        return html.escape(flat_text), False

    # Dengesiz $ kontrolü
    if len(re.findall(r"(?<!\$)\$(?!\$)", tanim)) % 2 != 0:
        tanim = tanim.replace("$", "")

    tr_esc = html.escape(tanim.strip(), quote=True)
    note_esc = html.escape(note.strip(), quote=True)
    span_html = (
        f'<span class="vocab-word concept-word" '
        f'data-tr="{tr_esc}" data-note="{note_esc}" '
        f'onclick="showVocabBubble(this, event)">{html.escape(matched_surface)}</span>'
    )
    out = html.escape(flat_text[:start]) + span_html + html.escape(flat_text[end:])
    return out, True


def process_subject_with_evren(
    client: EvrenClient,
    sub_code: str,
    json_path: Path,
    upgrade_dry: bool = False,
) -> Dict[str, Any]:
    questions: List[Dict[str, Any]] = json.loads(json_path.read_text(encoding="utf-8"))

    # Pass 1: Gürültü ve tekrar temizliği (veya eski balonları yenilemek için sıfırlama)
    kept_before, removed_noise = audit_and_clean_subject_questions(questions, upgrade_dry=upgrade_dry)

    # Balonsuz soruları tespit et
    unbubbled_by_ders: Dict[str, List[Dict[str, Any]]] = {}
    for q in questions:
        # Salt sayısal işlem soruları (MAT içinde hiç kavram kelimesi olmayanlar) hariç
        has_stem = "concept-word" in q.get("soru_xray", "")
        has_opt = any("concept-word" in v for v in q.get("secenekler_xray", {}).values())
        if not has_stem and not has_opt:
            ders = q.get("ders", sub_code)
            unbubbled_by_ders.setdefault(ders, []).append(q)

    # Görevleri oluştur (her batch 10 soru)
    tasks = []
    for ders_name, d_qs in unbubbled_by_ders.items():
        m = re.search(r"(\d+)", ders_name)
        sem = int(m.group(1)) if m else 1
        hint = load_textbook_headings_hint(sub_code, sem)
        for i in range(0, len(d_qs), 10):
            batch = d_qs[i : i + 10]
            tasks.append((ders_name, sem, batch, hint))

    q_map: Dict[int, Dict[str, Any]] = {q["id"]: q for q in questions}
    bubbled_qids: Set[int] = set()

    if tasks and client.is_configured:
        with ThreadPoolExecutor(max_workers=6) as pool:
            future_map = {
                pool.submit(
                    extract_concepts_for_unbubbled_batch,
                    client,
                    sub_code,
                    ders_name,
                    sem,
                    batch,
                    hint,
                ): (ders_name, sem)
                for ders_name, sem, batch, hint in tasks
            }
            for fut in as_completed(future_map):
                ders_name, sem = future_map[fut]
                items = fut.result()
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    qid = item.get("qid")
                    exact_w = str(item.get("exact_word") or "").strip()
                    term = str(item.get("term") or exact_w).strip()
                    sayfa = item.get("sayfa") or 24
                    tanim = str(item.get("tanim") or "").strip()
                    if not qid or not exact_w or not tanim or qid not in q_map:
                        continue

                    q = q_map[qid]
                    note_label = f"{sub_code} {sem} • MEB S.{sayfa} • {term}"

                    # Önce soru kökünde dene
                    if "concept-word" not in q.get("soru_xray", ""):
                        new_stem, ok = inject_exact_word_bubble(q["soru"], exact_w, tanim, note_label)
                        if ok:
                            q["soru_xray"] = new_stem
                            bubbled_qids.add(qid)
                            continue

                    # Soru kökünde yoksa şıklarda dene
                    sec_xray = q.get("secenekler_xray", {})
                    matched_in_opt = False
                    for letter, opt_txt in q.get("secenekler", {}).items():
                        if letter in sec_xray and "concept-word" in sec_xray[letter]:
                            continue
                        new_opt, ok = inject_exact_word_bubble(opt_txt, exact_w, tanim, note_label)
                        if ok:
                            sec_xray[letter] = new_opt
                            matched_in_opt = True
                            break
                    if matched_in_opt:
                        q["secenekler_xray"] = sec_xray
                        bubbled_qids.add(qid)

    # Pass 3: Son Öz-Denetim (Self-Critic)
    final_bubbles, final_removed = audit_and_clean_subject_questions(questions)
    questions_with_bubble = sum(
        1
        for q in questions
        if "concept-word" in q.get("soru_xray", "")
        or any("concept-word" in v for v in q.get("secenekler_xray", {}).values())
    )

    json_path.write_text(json.dumps(questions, indent=2, ensure_ascii=False), encoding="utf-8")

    return {
        "subject": sub_code,
        "total_questions": len(questions),
        "questions_with_bubble": questions_with_bubble,
        "coverage_pct": round(100.0 * questions_with_bubble / len(questions), 1) if questions else 0.0,
        "total_bubbles": final_bubbles,
        "removed_noise_bubbles": removed_noise + final_removed,
        "evren_newly_enriched": len(bubbled_qids),
    }


def main() -> None:
    print("=== EVREN ÖZ-DENETİMLİ KAVRAM VE FORMÜL TARAMA MOTORU ===")
    client = EvrenClient()

    verbal_defaults = ["TAR", "TDE", "DIN", "COG", "FEL", "INK", "KLM", "SAG", "AOF_ITAR", "AOF_AHLAK"]
    if len(sys.argv) > 1:
        if "--all" in sys.argv:
            target_files = sorted(p for p in SUBJECTS_DIR.glob("*.json") if p.stem != "ING")
        else:
            args = [a.upper() for a in sys.argv[1:] if not a.startswith("-")]
            target_files = [SUBJECTS_DIR / f"{a}.json" for a in args if (SUBJECTS_DIR / f"{a}.json").exists()]
    else:
        target_files = [SUBJECTS_DIR / f"{s}.json" for s in verbal_defaults if (SUBJECTS_DIR / f"{s}.json").exists()]

    upgrade_dry = "--upgrade-dry" in sys.argv
    report: List[Dict[str, Any]] = []
    for p in target_files:
        sub_code = p.stem
        print(f"[*] İşleniyor ve denetleniyor: {sub_code} (upgrade_dry={upgrade_dry})...")
        stats = process_subject_with_evren(client, sub_code, p, upgrade_dry=upgrade_dry)
        report.append(stats)
        print(
            f"    -> {sub_code}: {stats['questions_with_bubble']}/{stats['total_questions']} soru balonlu "
            f"(%{stats['coverage_pct']}) | Toplam Balon: {stats['total_bubbles']} | "
            f"Temizlenen Gürültü: {stats['removed_noise_bubbles']} | EVREN Eklenen: {stats['evren_newly_enriched']}"
        )

    CONCEPTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = CONCEPTS_DIR / "audit_report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[✓] Öz-denetim raporu kaydedildi: {report_path}")


if __name__ == "__main__":
    main()

