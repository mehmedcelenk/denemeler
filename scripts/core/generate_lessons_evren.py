#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN API ile paralel, doğal Türkçe + Pareto (80/20) v6 'Hocadan Öğren' soru anlatımı üreticisi.

Çıktı: data/lessons/<SUBJECT>.json (src/data/lesson.ts QuestionLesson sözleşmesine %100 uyumlu).
Kullanım:
    python3 scripts/core/generate_lessons_evren.py --all --fleet "gemma-4-31b:6"
    python3 scripts/core/generate_lessons_evren.py --batch "MAT::0,TDE::0,TAR::0" --fleet "gemma-4-31b:6"
    python3 scripts/core/generate_lessons_evren.py --subject MAT --limit 20 --qids 1046,1047
"""

import argparse
import json
import queue
import re
import sys
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT_DIR / "scripts" / "core"))
from evren_client import EvrenClient  # noqa: E402

SUBJECTS_DIR = ROOT_DIR / "data" / "subjects"
LESSONS_DIR = ROOT_DIR / "data" / "lessons"
DEFAULT_FLEET = "gemma-4-31b:6"
CURRENT_VERSION = 6

PRIORITY_SUBJECTS = [
    "MAT", "TDE", "TAR", "FIZ", "KIM", "BIO", "COG", "ING", "FEL", "INK", "SAG", "KLM",
    "TYT_TURKCE", "TYT_MAT", "TYT_TAR", "TYT_COG", "TYT_FEL", "TYT_DIN", "TYT_FIZ", "TYT_KIM", "TYT_BIO",
    "AYT_MAT", "AYT_EDB", "AYT_TAR1", "AYT_COG1", "AYT_FIZ", "AYT_KIM", "AYT_BIO",
]

SYSTEM_PROMPT = """Sen vakti çok kısıtlı 15–17 yaşındaki AÖL / AÖİHL öğrencilerine, konuyu hiç bilmiyorken bile birkaç saniyede kavratan deneyimli, samimi bir Türk öğretmenisin.

PARETO (80/20) VE SIFIRDAN ÖĞRETİM FELSEFESİ:
- Bir ünitenin tamamını anlatma; o konudaki sınav sorularının %80'ini çözdüren en kritik %20'lik temel mantığı yakala ve berrakça öğret.
- Okuyucu konuyu HİÇ BİLMİYOR olsa bile yabancı tek bir sembol (⇒, ∨, ', ∩, ∪ vb.) veya teknik terim havada kalmamalı; soruda geçen her sembolü/terimi gündelik dille açıkla.
- SIFIR ÖN BİLGİ — HİÇBİR ARA BASAMAĞI ATLAMA: Soruyu çözmek için gereken TÜM ön-koşul alt-konuları ve temel işlemleri (ör. eksi×eksi=artı işaret kuralı, kesirle tam sayı çarpma, payda eşitleme, üslü sayı kuralı, ek-kök ayrımı, kronoloji bağı vb.) tespit et; "öğrenci bunu zaten biliyordur" diyerek HİÇBİR ara adımı atlama:
  ❌ "(-1/27)·(-81) işlemi bizi doğrudan 3 sonucuna götürür" veya "Ardından 81'i 27'ye böldüğümüzde sonuç 3 çıkar" (işaret kuralı ve/veya kesirle tam sayı çarpma atlanmış!)
  ✅ "Önce işaretlere bakalım: eksi ile eksinin çarpımı her zaman artı (+) yapar. Sonra kesirle tam sayıyı çarparken tam sayının altına gizli 1 koyup üstleri üstlerle, altları altlarla çarparız: $\\\\frac{1}{27} \\\\cdot \\\\frac{81}{1} = \\\\frac{81}{27}$; 81'i 27'ye bölünce sonuç 3 çıkar."
- ÖN-KOŞUL ENVANTERİ (`prerequisites`) ZORUNLUDUR: `explanation` yazmaya başlamadan önce, bu soruyu çözmek için gereken TÜM temel bilgileri ve ara işlemleri (ana konu + gizli alt-beceriler: kesirle tam sayı çarpma, eksi×eksi=artı işaret kuralı, payda eşitleme, sadeleştirme, üslü sayı kuralı, ek-kök, kronoloji vb. — 2, 3, 4 veya 5 madde olabilir) JSON içindeki `prerequisites` dizisine tek tek çıkar.
- Ardından `explanation` içinde, `prerequisites` listesinde saydığın HER BİR MADDEYİ istisnasız olarak, nasıl ve neden yapıldığını 1 kısa cümleyle göstererek anlat. Tek bir ara işlemi bile "ardından böleriz / doğrudan sonuca gider" diye atlama!
- Okuyucu çok bilgiyle boğulmasın; EN AZ 1 SOMUT MANTIĞI zihnine kilitleyip "meğer bu kadar basitmiş" diyerek çıksın.

DOĞAL TÜRKÇE VE EMOJİ KURALLARI (ÇOK ÖNEMLİ):
1. GOOGLE TRANSLATE ÇEVİRİSİ GİBİ KONUŞMA!
   - İngilizceden çevrilmiş gibi duran yapay kalıplar KESİNLİKLE YASAK:
     ❌ "mevcut değerin tam tersini almamız gerektiğini söyler" → ✅ "değeri direkt tersine çevirir"
     ❌ "tüm problemi çözmek için ... yeterlidir" → ✅ "işin sırrı şurada"
     ❌ "yapılan en büyük hata ... unutmaktır" → ✅ "çoğu kişi tam burada düşer"
     ❌ "kritik durum olan ... temsil eder" → ✅ "tek kilit nokta şu"
     ❌ "Bu soruda...", "Verilen soruya göre...", "Tek yapman gereken..." → YASAK!
   - Gerçek, bu toprakların canlı, akıcı, sade ve sıcak Türkiye Türkçesini kullan. Ne çocuksu/espri kasan ol ne de soğuk/resmi ders kitabı gibi.
   - Ağır üniversite notasyonu (ör. `(mod 3)`) ve "ödev" kelimesi YASAK.
2. KONUŞMA ARALARINDA EMOJİ KULLANIMI:
   - Metin kuru bir duvar gibi durmasın; konuşmanın doğal akışı içinde 2–3 tane yerinde, abartısız emoji kullan (ör. 💡, ⚡, 🎯, 👀, 🔑). Her cümleye yığma, nefes aldıracak yerlere serpiştir.
3. İKİ-ÜÇ KISA PARAGRAF ANLATIM (`explanation` — toplam ~110–210 kelime):
   - **1. Paragraf (Pareto Çekirdeği — Sıfırdan Öğret):** Sorunun sayılarına/şıklarına dalmadan önce o konunun %80 soruyu açan temel mantığını ve yabancı sembol/terimleri gündelik, duru bir Türkçeyle sıfırdan öğret.
   - **2. (ve gerekirse 3.) Paragraf (Adım Adım Uygulama + Ön-Koşullar + Cümle İçi Tuzak):** Öğrettiğin o mantığı soruya uygularken `prerequisites` listesindeki HER ara işlemin ve alt-becerinin mantığını tek tek göstererek ilerle, hiçbir adımı "biliyordur" diye atlama; doğru şık harfini (`A/B/C/D/E`) açıkça belirt ve öğrencinin en sık düşeceği çeldirici tuzağı ayrı başlık açmadan cümlenin doğal akışı içinde 1 kısa cümleyle göster.
4. METİN İÇİ KAVRAMLAR (`concepts`, 1–5 adet):
   - Ana kavramları ve soruda gereken kritik alt-becerileri kapsayan 1–5 kilit kavram seç.
   - ZORUNLU: Her kavramın `term` değeri `explanation` metni içinde BİREBİR geçmelidir (arayüz onu tıklanabilir baloncuk yapar).
   - Tanımı kitaptan kopyalama; 1–2 cümlelik kendi sıcak, duru Türkçe tanımını ve kısa bir örneğini yaz.
5. DOĞRULUK VE KATEX:
   - Matematik ifadelerini temiz KaTeX (`$...$`) ile yaz; JSON içinde ters eğik çizgileri çiftle (`\\\\frac`, `\\\\Rightarrow`, `\\\\vee`, `\\\\cap`, `\\\\cup`).
   - Verilen `dogru_cevap` şıkkına %100 doğru bilgi ve işlemle ulaş.

SADECE GEÇERLİ TEK BİR JSON NESNESİ DÖNDÜR:
{
  "title": "Kısa, akıcı Türkçe başlık (en fazla 55 karakter)",
  "prerequisites": [
    "Bu soruyu çözmek için gereken 1. temel kural/işlem",
    "2. temel kural/işlem (ör. kesirle tam sayı çarpma, işaret kuralı, payda eşitleme, ek-kök ayrımı vb.)"
  ],
  "explanation": "1. paragraf (doğal Türkçe + yerinde 1-2 emoji): Pareto çekirdeğini sıfırdan anlat.\\n\\n2. (ve gerekirse 3.) paragraf (doğal Türkçe + yerinde 1 emoji): prerequisites listesindeki HER ara işlem/alt-beceriyi atlamadan soruya uygulama, doğru şık harfi ve cümle içi 1 kısa tuzak uyarısı.",
  "concepts": [
    {
      "term": "explanation içinde aynen geçen kilit kavram",
      "definition": "Doğal, sade Türkçe tanım (1-2 cümle)",
      "example": "Kısa somut örnek",
      "emoji": "💡"
    }
  ]
}"""

AUDIT_PROMPT = """Sen titiz bir Türk eğitim editörüsün. Verilen anlatımı şu 5 ölçüte göre denetle:
1. `pareto_zero_prereq`: Konuyu hiç bilmeyen 9. sınıf öğrencisi yabancı sembol/terim havada kalmadan %80 soruyu açan öz mantığı kavrıyor mu VE çözümdeki hiçbir ara işlem veya alt-konu (işaret kuralı, kesir çarpma, payda eşitleme, üs kuralı, ek-kök ayrımı vb.) "öğrenci biliyordur" diye atlanmadan sıfırdan gösterilmiş mi?
2. `natural_turkish`: Dil akıcı ve doğal Türkiye Türkçesi mi? ("temsil eder", "almamız gerektiğini söyler", "tüm problemi çözmek için" gibi Google Translate çevirisi kokan yapay cümleler varsa false)
3. `tone_and_emoji`: Ne çocuksu ne soğuk, samimi ve sade mi; metin içinde abartısız 1–3 yerinde emoji var mı?
4. `trap_natural`: 2. paragraf doğru şık harfini açıkça belirtip çeldirici tuzağa cümle içinde doğalca değinmiş mi?
5. `factually_sound`: Konu bilgisi, işlemler ve doğru şık %100 hatasız mı?

SADECE GEÇERLİ JSON DÖNDÜR:
{
  "pareto_zero_prereq": true|false,
  "natural_turkish": true|false,
  "tone_and_emoji": true|false,
  "trap_natural": true|false,
  "factually_sound": true|false,
  "feedback": "Herhangi biri false ise tek cümlelik somut düzeltme notu, hepsi true ise boş string"
}"""

TR_CHAR_CLASSES = {
    "i": "[iİ]",
    "ı": "[ıI]",
    "ş": "[şŞ]",
    "ğ": "[ğĞ]",
    "ü": "[üÜ]",
    "ö": "[öÖ]",
    "ç": "[çÇ]",
}

DRY_OPENERS = (
    "bu soruda",
    "verilen soruda",
    "verilen soruya göre",
    "tek yapman gereken",
    "soruda bize",
    "soruya baktığımızda",
)


def build_tr_term_regex(term: str) -> Optional[re.Pattern]:
    clean = term.strip()
    if len(clean) < 2:
        return None
    lower = clean.replace("I", "ı").replace("İ", "i").lower()
    pattern = ""
    for ch in lower:
        if ch in TR_CHAR_CLASSES:
            pattern += TR_CHAR_CLASSES[ch]
        elif ch.isspace():
            pattern += r"\s+"
        else:
            pattern += re.escape(ch)
    suffix = r"(?:['’]?[a-zA-ZçğıöşüÇĞİÖŞÜ]{0,5})?" if len(clean) >= 4 else ""
    return re.compile(
        rf"(?<![A-Za-zÇĞİÖŞÜçğıöşü0-9])({pattern}{suffix})(?![A-Za-zÇĞİÖŞÜçğıöşü0-9])",
        re.IGNORECASE,
    )


def build_user_prompt(q: Dict[str, Any], retry_feedback: str = "") -> str:
    opts = "\n".join(f"  {k}) {v}" for k, v in (q.get("secenekler") or {}).items() if v)
    parts = [
        f"DERS: {q.get('ders', '')}",
        f"KONU: {q.get('ana_konu') or '-'} / {q.get('alt_konu') or '-'}",
        "",
        f"SORU:\n{q.get('soru', '').strip()}",
        "",
        f"SEÇENEKLER:\n{opts}",
        "",
        f"DOĞRU CEVAP: {q.get('dogru_cevap', '')}",
    ]
    if q.get("dogru_nedeni"):
        parts.append(f"MEVCUT KISA NOT (sadece doğruluk referansı): {q['dogru_nedeni']}")
    if retry_feedback:
        parts.append(f"\n⚠️ ÖNCEKİ DENEME ELEŞTİRİSİ (MUTLAKA DÜZELT): {retry_feedback}")
    parts.append(
        "\nLütfen önce sorunun gerektirdiği TÜM ön-koşul alt-becerileri 'prerequisites' listesine çıkar, "
        "sonra bu listedeki HER BİR adımı 'biliyordur' diye atlamadan, çeviri kokmayan doğal Türkiye Türkçesiyle, "
        "konuşma aralarında 2–3 yerinde emoji kullanarak 2–3 kısa paragrafta ve metin içi 1–5 kavramla JSON olarak üret."
    )
    return "\n".join(parts)


def extract_json_object(raw_text: str) -> Dict[str, Any]:
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        obj = json.loads(text)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        obj = json.loads(text[start : end + 1])
        if isinstance(obj, dict):
            return obj
    raise ValueError("Model çıktısından geçerli JSON nesnesi çıkarılamadı.")


def validate_and_normalize(
    raw: Dict[str, Any],
    qid: int,
    subject: str,
    model: str,
    dogru_cevap: str = "",
) -> Dict[str, Any]:
    def req_str(val: Any, name: str) -> str:
        if not isinstance(val, str) or not val.strip():
            raise ValueError(f"{name} boş veya metin değil")
        cleaned = val.strip()
        for ch in ("\x08", "\x0c", "\r", "\t"):
            if ch in cleaned:
                raise ValueError(f"{name} içinde kaçırılmamış kontrol karakteri var")
        no_dd = re.sub(r"\$\$[\s\S]+?\$\$", "", cleaned)
        if no_dd.count("$") % 2 != 0:
            raise ValueError(f"{name} içinde dengesiz '$' işareti var")
        if cleaned.count("**") % 2 != 0:
            raise ValueError(f"{name} içinde dengesiz '**' vurgusu var")
        if re.search(r"<(?:script|img|div|span|br|p|strong|em)\b", cleaned, re.IGNORECASE):
            raise ValueError(f"{name} içinde ham HTML etiketi var")
        return cleaned

    title = req_str(raw.get("title"), "title")
    if len(title) > 70:
        raise ValueError(f"title çok uzun ({len(title)} karakter)")

    raw_prereqs = raw.get("prerequisites")
    if not isinstance(raw_prereqs, list) or not any(
        isinstance(item, str) and item.strip() for item in raw_prereqs
    ):
        raise ValueError("prerequisites boş olmayan liste ve en az 1 ön-koşul adımı içermeli")

    explanation = req_str(raw.get("explanation"), "explanation")
    lower_exp = explanation.replace("I", "ı").replace("İ", "i").lower()
    for opener in DRY_OPENERS:
        if lower_exp.startswith(opener):
            raise ValueError(f"explanation kuru girişle ('{opener}') başlamamalı; önce konunun özünü öğret")
    if re.search(r"\\pmod|\(mod\s*\d", explanation, re.IGNORECASE):
        raise ValueError("explanation ağır modüler aritmetik (mod) notasyonu kullanmamalı; sade lise dili kullan")
    if re.search(r"\bödev\b", lower_exp):
        raise ValueError("explanation içinde 'ödev' kelimesi kullanılmamalı")
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", explanation) if p.strip()]
    if len(paragraphs) < 2:
        raise ValueError("explanation 2 kısa paragraf olmalı (1: Pareto çekirdeği, 2: soruya uygulama ve tuzak)")
    if dogru_cevap and not re.search(
        rf"(?<![A-Za-zÇĞİÖŞÜçğıöşü]){re.escape(dogru_cevap)}(?![A-Za-zÇĞİÖŞÜçğıöşü])",
        explanation,
    ):
        raise ValueError(f"explanation doğru şık harfini ({dogru_cevap}) içermiyor")

    raw_concepts = raw.get("concepts")
    if not isinstance(raw_concepts, list) or len(raw_concepts) < 1:
        raise ValueError("concepts en az 1 özgün kavram içermeli")
    concepts: List[Dict[str, str]] = []
    explanation_plain = re.sub(r"\$\$[\s\S]+?\$\$|\$[^$\n]+?\$", " ", explanation)
    for i, c in enumerate(raw_concepts):
        if not isinstance(c, dict):
            continue
        term = req_str(c.get("term"), f"concepts[{i}].term")
        rx = build_tr_term_regex(term)
        if not rx or not rx.search(explanation_plain):
            continue
        item: Dict[str, str] = {
            "term": term,
            "definition": req_str(c.get("definition"), f"concepts[{i}].definition"),
        }
        if isinstance(c.get("example"), str) and c["example"].strip():
            item["example"] = req_str(c["example"], f"concepts[{i}].example")
        if isinstance(c.get("emoji"), str) and c["emoji"].strip():
            item["emoji"] = c["emoji"].strip()
        concepts.append(item)
    if len(concepts) < 1:
        raise ValueError("explanation içinde birebir eşleşen en az 1 kavram bulunmalı")

    return {
        "questionId": qid,
        "subject": subject,
        "title": title,
        "explanation": explanation,
        "concepts": concepts[:5],
        "model": model,
        "version": CURRENT_VERSION,
    }


def audit_lesson(
    client: EvrenClient,
    model: str,
    q: Dict[str, Any],
    lesson: Dict[str, Any],
) -> Tuple[bool, str, Dict[str, Any]]:
    user_msg = (
        f"DERS: {q.get('ders', '')} | DOĞRU CEVAP: {q.get('dogru_cevap', '')}\n"
        f"ORİJİNAL SORU: {q.get('soru', '').strip()}\n\n"
        f"ANLATIM:\n{lesson['explanation']}"
    )
    content, usage = client.chat_completion(
        messages=[
            {"role": "system", "content": AUDIT_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        model=model,
        temperature=0.0,
        max_tokens=1024,
        response_format={"type": "json_object"},
    )
    verdict = extract_json_object(content)
    ok = (
        verdict.get("pareto_zero_prereq") is True
        and verdict.get("natural_turkish") is True
        and verdict.get("tone_and_emoji") is True
        and verdict.get("trap_natural") is True
        and verdict.get("factually_sound") is True
    )
    feedback = str(verdict.get("feedback") or "").strip()
    if not ok and not feedback:
        feedback = "Çeviri kokmayan doğal Türkiye Türkçesiyle, 2–3 yerinde emoji ekleyerek Pareto öz mantığını sıfırdan anlat."
    return ok, feedback, usage


def parse_fleet(fleet_spec: str) -> List[str]:
    worker_models: List[str] = []
    for part in fleet_spec.split(","):
        item = part.strip()
        if not item:
            continue
        if ":" in item:
            model_name, count_str = item.rsplit(":", 1)
            count = max(1, int(count_str.strip()))
        else:
            model_name, count = item, 1
        worker_models.extend([model_name.strip()] * count)
    return worker_models or ["gemma-4-31b"]


def parse_targets(args: argparse.Namespace) -> List[Tuple[str, Optional[str], int]]:
    excluded = {x.strip().upper() for x in (args.exclude or "").split(",") if x.strip()}
    if args.all:
        available = sorted(p.stem for p in SUBJECTS_DIR.glob("*.json") if p.stem.upper() not in excluded)
        prio_set = set(PRIORITY_SUBJECTS)
        ordered = [s for s in PRIORITY_SUBJECTS if s in available] + [s for s in available if s not in prio_set]
        return [(s, None, 0) for s in ordered]
    if args.batch:
        targets: List[Tuple[str, Optional[str], int]] = []
        for entry in args.batch.split(","):
            parts = [p.strip() for p in entry.split(":")]
            if not parts or not parts[0]:
                continue
            subj = parts[0].upper()
            course = parts[1] if len(parts) > 1 and parts[1] else None
            limit = int(parts[2]) if len(parts) > 2 and parts[2] else 0
            targets.append((subj, course, limit))
        return targets
    if not args.subject:
        raise SystemExit("--subject, --batch veya --all zorunludur.")
    return [(args.subject.strip().upper(), args.course, args.limit)]


def main() -> None:
    parser = argparse.ArgumentParser(description="EVREN Paralel v6 Pareto Hoca Anlatımı Üretici")
    parser.add_argument("--subject", default=None, help="Tek ders kodu (örn: MAT)")
    parser.add_argument("--course", default=None, help="Alt ders filtresi (örn: 'MATEMATİK – 1')")
    parser.add_argument("--limit", type=int, default=20, help="Soru limiti (0 = tamamı)")
    parser.add_argument("--batch", default=None, help="Çoklu hedef: 'MAT::0,TDE::0,TAR::0'")
    parser.add_argument("--all", action="store_true", help="Tüm 57 dersteki tüm şekilsiz soruları öncelik sırasıyla üret")
    parser.add_argument("--exclude", default=None, help="Hariç tutulacak ders kodları (örn: DIN)")
    parser.add_argument("--fleet", default=DEFAULT_FLEET, help=f"Model filosu (varsayılan: {DEFAULT_FLEET})")
    parser.add_argument("--overwrite", action="store_true", help="Mevcut v6 anlatımları yeniden üret")
    parser.add_argument("--qids", default=None, help="Sadece belirtilen soru ID'lerini üret (örn: 1046,969)")
    parser.add_argument("--skip-audit", action="store_true", help="2. geçit kalite denetimini atla")
    args = parser.parse_args()

    target_qids = (
        {int(x.strip()) for x in args.qids.split(",") if x.strip().isdigit()}
        if args.qids
        else None
    )

    targets = parse_targets(args)
    worker_models = parse_fleet(args.fleet)
    LESSONS_DIR.mkdir(parents=True, exist_ok=True)

    candidates_by_subject: Dict[str, List[Dict[str, Any]]] = {}
    existing_by_subject: Dict[str, Dict[int, Dict[str, Any]]] = {}
    work_queue: "queue.PriorityQueue[Tuple[int, int, str, Dict[str, Any], int, str]]" = queue.PriorityQueue()
    seq = 0
    total_todo = 0

    for subject, course, limit in targets:
        subject_path = SUBJECTS_DIR / f"{subject}.json"
        if not subject_path.exists():
            raise SystemExit(f"Ders dosyası bulunamadı: {subject_path}")
        questions = json.loads(subject_path.read_text(encoding="utf-8"))
        all_valid = [
            q for q in questions
            if not q.get("sekilli") and (not course or q.get("ders") == course)
        ]
        if target_qids is not None:
            cands = [q for q in all_valid if int(q["id"]) in target_qids]
        elif limit > 0:
            cands = all_valid[:limit]
        else:
            cands = all_valid
        candidates_by_subject[subject] = cands

        out_path = LESSONS_DIR / f"{subject}.json"
        existing: Dict[int, Dict[str, Any]] = {}
        if out_path.exists():
            try:
                for item in json.loads(out_path.read_text(encoding="utf-8")):
                    if (
                        isinstance(item, dict)
                        and isinstance(item.get("questionId"), int)
                        and item.get("version") == CURRENT_VERSION
                    ):
                        existing[item["questionId"]] = item
            except Exception:
                existing = {}
        existing_by_subject[subject] = existing

        subj_todo = 0
        for q in cands:
            qid = int(q["id"])
            if target_qids is not None:
                if qid in target_qids:
                    seq += 1
                    work_queue.put((seq, seq, subject, q, 0, ""))
                    subj_todo += 1
                    total_todo += 1
            elif args.overwrite or qid not in existing:
                seq += 1
                work_queue.put((seq, seq, subject, q, 0, ""))
                subj_todo += 1
                total_todo += 1
        if subj_todo > 0 or not args.all:
            print(f"📚 [{subject}] Hedef: {len(cands)} | Mevcut v{CURRENT_VERSION}: {len(existing)} | Üretilecek: {subj_todo}")

    if total_todo == 0:
        print(f"✅ Tüm hedef v{CURRENT_VERSION} anlatımlar zaten mevcut.")
        return

    print(f"🚀 EVREN Filosu: {args.fleet} ({len(worker_models)} paralel işçi) | Toplam kuyruk: {total_todo}")
    init_client = EvrenClient(timeout=240)
    if not init_client.is_configured:
        raise SystemExit("EVREN_API_KEY tanımlı değil.")
    init_client.ensure_terms_accepted()

    lock = threading.Lock()
    stop_event = threading.Event()
    stats = {"done": 0, "in_tokens": 0, "out_tokens": 0}
    failures: List[Tuple[str, int, str]] = []
    t0 = time.time()

    def save_subject_locked(subject: str) -> None:
        cands = candidates_by_subject[subject]
        existing = existing_by_subject[subject]
        cand_ids = {int(q["id"]) for q in cands}
        ordered = [existing[int(q["id"])] for q in cands if int(q["id"]) in existing]
        extras = [v for k, v in existing.items() if k not in cand_ids]
        (LESSONS_DIR / f"{subject}.json").write_text(
            json.dumps(ordered + extras, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    def worker(worker_id: int, model: str) -> None:
        client = EvrenClient(timeout=110)
        client._terms_verified = True  # noqa: SLF001
        while not stop_event.is_set():
            try:
                prio, item_seq, subject, q, attempt, retry_feedback = work_queue.get(timeout=2.0)
            except queue.Empty:
                return
            qid = int(q["id"])
            if stop_event.is_set():
                work_queue.task_done()
                return
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(q, retry_feedback)},
            ]
            try:
                content, usage = client.chat_completion(
                    messages=messages,
                    model=model,
                    temperature=0.65 if attempt == 0 else 0.45,
                    max_tokens=2048,
                    thinking=False if model == "qwen3.8-flash-next" else None,
                    response_format={"type": "json_object"},
                )
                parsed = extract_json_object(content)
                lesson = validate_and_normalize(
                    parsed,
                    qid,
                    subject,
                    model,
                    dogru_cevap=str(q.get("dogru_cevap") or "").strip(),
                )
                extra_in = 0
                extra_out = 0
                if not args.skip_audit:
                    quality_ok, feedback, a_usage = audit_lesson(client, model, q, lesson)
                    extra_in += int(a_usage.get("prompt_tokens", 0) or 0)
                    extra_out += int(a_usage.get("completion_tokens", 0) or 0)
                    if not quality_ok:
                        raise ValueError(f"Kalite kapısı reddetti: {feedback}")
                with lock:
                    existing_by_subject[subject][qid] = lesson
                    save_subject_locked(subject)
                    stats["done"] += 1
                    stats["in_tokens"] += int(usage.get("prompt_tokens", 0) or 0) + extra_in
                    stats["out_tokens"] += int(usage.get("completion_tokens", 0) or 0) + extra_out
                    elapsed_min = max(0.01, (time.time() - t0) / 60.0)
                    rate = stats["done"] / elapsed_min
                    rem = client.remaining_daily_tokens
                    rem_str = f" | Kalan kota: {rem:,}" if rem is not None else ""
                    print(
                        f"  ✅ [{stats['done']}/{total_todo}] {subject}#{qid} [{model}] "
                        f"— {lesson['title']} ({rate:.1f} soru/dk{rem_str})",
                        flush=True,
                    )
                    if rem is not None and rem < 50_000:
                        print("🛑 Günlük EVREN kotası sınırına yaklaşıldı; güvenli durduruluyor.", flush=True)
                        stop_event.set()
            except Exception as exc:  # noqa: BLE001
                err_msg = str(exc)
                is_daily_exhausted = "daily" in err_msg.lower() and ("limit" in err_msg.lower() or "quota" in err_msg.lower())
                if is_daily_exhausted:
                    print(f"🛑 Günlük kota doldu: {err_msg[:140]}", flush=True)
                    stop_event.set()
                else:
                    is_transient = "503" in err_msg or "429" in err_msg or "timed out" in err_msg.lower()
                    max_attempts = 8 if is_transient else 4
                    if attempt + 1 < max_attempts and not stop_event.is_set():
                        print(
                            f"  🔁 [{model}#w{worker_id}] {subject}#{qid} yeniden kuyruğa alındı (deneme {attempt + 1}): {err_msg[:110]}",
                            flush=True,
                        )
                        backoff = min(45.0, 8.0 * (attempt + 1)) if is_transient else 2.5 * (attempt + 1)
                        time.sleep(backoff)
                        work_queue.put((prio, item_seq, subject, q, attempt + 1, "" if is_transient else err_msg))
                    else:
                        with lock:
                            failures.append((subject, qid, err_msg))
                            print(f"  ❌ {subject}#{qid} [{model}] başarısız: {err_msg[:140]}", flush=True)
            finally:
                work_queue.task_done()

    threads = [
        threading.Thread(target=worker, args=(i + 1, model), daemon=True)
        for i, model in enumerate(worker_models)
    ]
    for t in threads:
        t.start()
    while any(t.is_alive() for t in threads):
        if stop_event.is_set():
            break
        time.sleep(0.5)
    for t in threads:
        t.join(timeout=5.0)

    elapsed = time.time() - t0
    print(
        f"\n🏁 Filo tamamlandı | Süre: {elapsed:.1f}s | Tamamlanan: {stats['done']}/{total_todo} | "
        f"Token: in={stats['in_tokens']:,}, out={stats['out_tokens']:,} | Hata: {len(failures)}"
    )
    if failures and not stop_event.is_set():
        sys.exit(1)


if __name__ == "__main__":
    main()
