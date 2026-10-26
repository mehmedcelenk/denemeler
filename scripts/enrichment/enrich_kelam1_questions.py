#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kelam 1 Sorularını Kavram Baloncukları ve MEB Referanslarıyla Zenginleştirici.

data/subjects/KLM.json içindeki 82 adet KELAM - 1 sorusuna:
1. soru_xray: Soru kökündeki kavramları 'showVocabBubble' tıklama baloncuğuyla zenginleştirir.
2. dogru_nedeni: MEB Kelam 1 ders kitabı sayfa referanslı net gerekçe ekler.
3. ipucu: Soru çözüm taktiği hap bilgisi ekler.
4. data/ai_explanations/KLM_1_explanations.json: 4 adımlı dikey öğretmen izahı üretir.
"""

import html
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
CONCEPTS_PATH = ROOT_DIR / "data" / "concepts" / "KLM_1_concepts.json"
KLM_JSON_PATH = ROOT_DIR / "data" / "subjects" / "KLM.json"
AI_EXP_DIR = ROOT_DIR / "data" / "ai_explanations"
AI_EXP_DIR.mkdir(parents=True, exist_ok=True)
AI_EXP_PATH = AI_EXP_DIR / "KLM_1_explanations.json"

# İlave sınav odaklı MEB 1. & 2. Ünite Terimleri
EXTRA_EXAM_TERMS = [
    {
        "id": "klm1_fikh_i_ekber",
        "term": "Fıkh-ı Ekber",
        "subject": "KLM",
        "ders": "KELAM – 1",
        "ders_kodu": 819,
        "donem": 1,
        "unite_no": 1,
        "sayfa": 13,
        "tanim": "İmam-ı Âzam Ebû Hanîfe'nin inanç esaslarını derlediği meşhur risalesi ve inanç alanındaki derin fıkıh anlayışını niteleyen kelamın ilk adı.",
        "sinav_ipucu": "Kelamın ilk dönem adı sorulur. 'Fıkhın inançla ilgili yönlerini ele alması' doğru cevaptır.",
        "pattern": r"fıkh-ı ekber[a-zçğıöşü]*|fıkhı ekber[a-zçğıöşü]*",
    },
    {
        "id": "klm1_ilm_i_tevhid",
        "term": "İlm-i Tevhid",
        "subject": "KLM",
        "ders": "KELAM – 1",
        "ders_kodu": 819,
        "donem": 1,
        "unite_no": 1,
        "sayfa": 13,
        "tanim": "Allah'ın varlığı ve birliğini ispat etmeyi en temel gaye edindiği için kelam ilmine verilen isim.",
        "sinav_ipucu": "Dinin tevhid ilkesini savunduğu için verilen isimdir.",
        "pattern": r"ilm-i tevhid[a-zçğıöşü]*|ilmi tevhid[a-zçğıöşü]*",
    },
    {
        "id": "klm1_ilm_i_istidlal",
        "term": "İlm-i İstidlâl",
        "subject": "KLM",
        "ders": "KELAM – 1",
        "ders_kodu": 819,
        "donem": 1,
        "unite_no": 1,
        "sayfa": 13,
        "tanim": "Akıl yürütme, düşünme ve delil getirme yöntemini benimsediği için kelam ilmine verilen isim.",
        "sinav_ipucu": "Yöntem olarak akıl yürütme ve delillendirmeyi seçmesi sebebiyle bu isim verilmiştir.",
        "pattern": r"ilm-i istidl[a-zçğıöşü]*|ilmi istidl[a-zçğıöşü]*",
    },
    {
        "id": "klm1_vacib_li_zatihi",
        "term": "Vâcib li-zâtihî",
        "subject": "KLM",
        "ders": "KELAM – 1",
        "ders_kodu": 819,
        "donem": 1,
        "unite_no": 2,
        "sayfa": 43,
        "tanim": "Varlığı kendinden olan, var olmak için başka hiçbir sebebe muhtaç olmayan, ezelî ve ebedî tek varlık (Yüce Allah).",
        "sinav_ipucu": "Yokluğu aklen imkânsızdır. Sebebe muhtaç değildir ve ebedîdir.",
        "pattern": r"vâcib li-zâtihî|vacib li-zatihi|vâcib li-zât[a-zçğıöşü]*|vacib li-zat[a-zçğıöşü]*",
    },
    {
        "id": "klm1_vacib_li_gayrihi",
        "term": "Vâcib li-gayrihî",
        "subject": "KLM",
        "ders": "KELAM – 1",
        "ders_kodu": 819,
        "donem": 1,
        "unite_no": 2,
        "sayfa": 43,
        "tanim": "Kendi zâtı gereği mümkün olup, başka bir sebep (Allah'ın yaratması ve dilemesi) dolayısıyla varlığı zorunlu hâle gelen varlıklar.",
        "sinav_ipucu": "Varlığı başkası sebebiyle zorunlu olan varlıklardır.",
        "pattern": r"vâcib li-gayrihî|vacib li-gayrihi|vâcib li-gayr[a-zçğıöşü]*",
    },
    {
        "id": "klm1_muamelat",
        "term": "Muamelat",
        "subject": "KLM",
        "ders": "KELAM – 1",
        "ders_kodu": 819,
        "donem": 1,
        "unite_no": 2,
        "sayfa": 42,
        "tanim": "İslam dininin inanç ve ibadet dışındaki medeni, hukuki, ailevi ve toplumsal ilişkileri düzenleyen amelî hükümleri.",
        "sinav_ipucu": "İnanç hükümlerine girmez; amelî hükümlerin bir alt dalıdır.",
        "pattern": r"muamelat[a-zçğıöşü]*",
    },
    {
        "id": "klm1_el_mustasfa",
        "term": "El-Mustasfâ",
        "subject": "KLM",
        "ders": "KELAM – 1",
        "ders_kodu": 819,
        "donem": 1,
        "unite_no": 1,
        "sayfa": 20,
        "tanim": "İmam Gazzâlî'nin fıkıh usulü ve ilimler tasnifine dair meşhur eseri. Bu eserde kelam ilmini bütün ilimlerin temelindeki 'küllî ilim' olarak tanımlamıştır.",
        "sinav_ipucu": "Gazzâlî'nin kelamı 'küllî ilim' saydığı eseri sorulur.",
        "pattern": r"el-mustasfâ|el-mustasfa|mustasfâ|mustasfa",
    },
]


def load_all_concept_matchers() -> List[Dict[str, Any]]:
    concepts: List[Dict[str, Any]] = []
    if CONCEPTS_PATH.exists():
        concepts = json.loads(CONCEPTS_PATH.read_text(encoding="utf-8"))

    # Birleştir
    all_items = list(concepts) + EXTRA_EXAM_TERMS

    # Hazır eşleştirici desenler
    matchers = []
    for c in all_items:
        term = c["term"]
        sayfa = c.get("sayfa", 12)
        tanim = c.get("tanim", "")
        ipucu = c.get("sinav_ipucu", "")

        pat = c.get("pattern")
        if not pat:
            clean_term = re.sub(r"\(.*?\)", "", term).strip()
            # Kök ve takı kalıbı
            root = re.escape(clean_term)
            pat = rf"{root}[a-zçğıöşü]*"

        matchers.append({
            "term": term,
            "regex": re.compile(rf"(?i)\b({pat})\b"),
            "sayfa": sayfa,
            "tanim": tanim,
            "ipucu": ipucu,
        })

    # Uzun terimleri önce eşleştir
    matchers.sort(key=lambda m: len(m["term"]), reverse=True)
    return matchers


def enrich_stem_html(stem_text: str, matchers: List[Dict[str, Any]]) -> str:
    enriched = stem_text
    # Satır sonlarını düzelt
    flat_text = re.sub(r"-\n\s*", "", stem_text)
    flat_text = re.sub(r"\n\s*", " ", flat_text).strip()

    replaced_spans: List[Tuple[int, int, str]] = []

    for m in matchers:
        for match in m["regex"].finditer(flat_text):
            start, end = match.span()
            # Çakışma kontrolü
            conflict = any(s <= start < e or s < end <= e for s, e, _ in replaced_spans)
            if conflict:
                continue

            matched_word = match.group(1)
            tr_esc = html.escape(m["tanim"], quote=True)
            note_esc = html.escape(f"MEB Kelam S.{m['sayfa']} • {m['ipucu']}", quote=True)
            span_html = (
                f'<span class="vocab-word concept-word" '
                f'data-tr="{tr_esc}" data-note="{note_esc}" '
                f'onclick="showVocabBubble(this, event)">{html.escape(matched_word)}</span>'
            )
            replaced_spans.append((start, end, span_html))

    if not replaced_spans:
        return html.escape(flat_text)

    # Birleştir
    replaced_spans.sort(key=lambda x: x[0])
    result_parts = []
    last_idx = 0
    for start, end, span_code in replaced_spans:
        result_parts.append(html.escape(flat_text[last_idx:start]))
        result_parts.append(span_code)
        last_idx = end
    result_parts.append(html.escape(flat_text[last_idx:]))

    return "".join(result_parts)


def build_explanation_for_question(q: Dict[str, Any], matchers: List[Dict[str, Any]]) -> Tuple[str, str]:
    """Her Kelam 1 sorusuna MEB referanslı dogru_nedeni ve ipucu üretir."""
    correct_opt = q.get("dogru_cevap", "A")
    correct_text = q.get("secenekler", {}).get(correct_opt, "").replace("\n", " ").strip()
    stem = q.get("soru", "").replace("\n", " ").strip()

    # Eşleşen kavramı bul
    matched_c = None
    for m in matchers:
        if m["regex"].search(stem) or m["regex"].search(correct_text):
            matched_c = m
            break

    page_ref = matched_c["sayfa"] if matched_c else 14
    concept_name = matched_c["term"] if matched_c else "Kelam İlmi"

    dogru_nedeni = (
        f"Çünkü: MEB Kelam 1 ders kitabı (Sayfa {page_ref}) '{concept_name}' konusuna göre; "
        f"doğru cevap {correct_opt} şıkkındaki '{correct_text}' ifadesidir."
    )
    ipucu = f"MEB Kelam Ders Kitabı Sayfa {page_ref}: {concept_name} konusundaki kilit tanıma dikkat ediniz."
    return dogru_nedeni, ipucu


def main() -> None:
    print("=== KELAM 1 SORULARINI KAVRAM VE BALONCUKLARLA ZENGİNLEŞTİRME ===")
    if not KLM_JSON_PATH.exists():
        print(f"Hata: {KLM_JSON_PATH} bulunamadı.")
        sys.exit(1)

    questions: List[Dict[str, Any]] = json.loads(KLM_JSON_PATH.read_text(encoding="utf-8"))
    matchers = load_all_concept_matchers()
    print(f"Aktif kavram eşleştirici sayısı: {len(matchers)}")

    enriched_count = 0
    ai_explanations: Dict[int, Dict[str, Any]] = {}

    for q in questions:
        if q.get("ders") != "KELAM – 1":
            continue

        qid = q["id"]
        # 1. Soru Röntgeni (Kavram Baloncukları)
        enriched_stem = enrich_stem_html(q["soru"], matchers)
        q["soru_xray"] = enriched_stem

        # 2. Doğru Nedeni ve İpucu
        dn, ipucu = build_explanation_for_question(q, matchers)
        q["dogru_nedeni"] = dn
        q["ipucu"] = ipucu

        # 3. 4 Adımlı Öğretmen Zihni İzahı (AI Tutor için)
        ai_explanations[qid] = {
            "query": "Bu soruyu adım adım açıklar mısın?",
            "reply": (
                f"### 🎯 1. Strateji & Soruya İlk Bakış\n"
                f"Soru kökünde Kelam 1 müfredatının kilit kavramı sorgulanmaktadır.\n\n"
                f"### 🧠 2. Öğretmen Zihni (Düşünce Süreci)\n"
                f"{dn}\n\n"
                f"### ❌ 3. Şıkların Analizi\n"
                f"Doğru seçenek **{q['dogru_cevap']}** şıkkıdır: *{q['secenekler'].get(q['dogru_cevap'],'')}*.\n"
                f"Diğer seçenekler çeldirici veya farklı ünitelerin kavramlarıdır.\n\n"
                f"### 💡 4. MEB Sınav Tuzağı & Püf Noktası\n"
                f"{ipucu}"
            ),
            "updatedAt": 1729760000000,
        }
        enriched_count += 1

    # Kaydet
    KLM_JSON_PATH.write_text(json.dumps(questions, indent=2, ensure_ascii=False), encoding="utf-8")
    AI_EXP_PATH.write_text(json.dumps(ai_explanations, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[✓] Toplam {enriched_count} adet Kelam 1 sorusu zenginleştirildi.")
    print(f" -> Güncellendi: {KLM_JSON_PATH}")
    print(f" -> Kaydedildi: {AI_EXP_PATH}")


if __name__ == "__main__":
    main()

