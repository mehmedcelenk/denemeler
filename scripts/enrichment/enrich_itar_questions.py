#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖF İlk Dönem İslâm Tarihi Sorularına Kavram Röntgeni Giydirici.

data/subjects/AOF_ITAR.json içindeki 81 çıkmış soruya alıştırma sorularını (50 adet)
ekler, data/concepts/AOF_ITAR_concepts.json sözlüğündeki kilit kavramlarla
hem soru köklerine (soru_xray) hem de seçeneklere (secenekler_xray)
kavram baloncukları giydirir ve subjectManifest.json'ı günceller.
"""

import html
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple

from scripts.enrichment.parse_itar_practice_questions import load_all_practice_questions

ROOT_DIR = Path(__file__).resolve().parents[2]
CONCEPTS_PATH = ROOT_DIR / "data" / "concepts" / "AOF_ITAR_concepts.json"
ITAR_JSON_PATH = ROOT_DIR / "data" / "subjects" / "AOF_ITAR.json"
MANIFEST_PATH = ROOT_DIR / "src" / "data" / "generated" / "subjectManifest.json"


def build_matchers() -> List[Dict[str, Any]]:
    if not CONCEPTS_PATH.exists():
        raise FileNotFoundError(f"{CONCEPTS_PATH} bulunamadı.")
    concepts = json.loads(CONCEPTS_PATH.read_text(encoding="utf-8"))
    matchers = []
    for c in concepts:
        rgx = re.compile(f"({c['pattern']})", re.IGNORECASE)
        matchers.append({"concept": c, "regex": rgx, "len": len(c["term"])})
    # Uzun ve spesifik terimleri önce eşleştir
    matchers.sort(key=lambda m: m["len"], reverse=True)
    return matchers


def enrich_stem_html(stem_text: str, matchers: List[Dict[str, Any]]) -> Tuple[str, int]:
    flat_text = stem_text
    replaced_spans: List[Tuple[int, int, str]] = []
    matched_count = 0

    for m in matchers:
        c = m["concept"]
        for match in m["regex"].finditer(flat_text):
            start, end = match.span()
            # Çakışma kontrolü
            conflict = any(s <= start < e or s < end <= e for s, e, _ in replaced_spans)
            if conflict:
                continue

            matched_word = match.group(0)
            tr_esc = html.escape(c["tanim"], quote=True)
            note_esc = html.escape(
                f"AÖF İlk Dönem İslâm Tarihi Ünite {c['unite_no']} • {c['term']}",
                quote=True,
            )
            span_html = (
                f'<span class="vocab-word concept-word" '
                f'data-tr="{tr_esc}" data-note="{note_esc}" '
                f'onclick="showVocabBubble(this, event)">{html.escape(matched_word)}</span>'
            )
            replaced_spans.append((start, end, span_html))
            matched_count += 1

    if not replaced_spans:
        return html.escape(flat_text), 0

    replaced_spans.sort(key=lambda x: x[0])
    result_parts = []
    last_idx = 0
    for start, end, span_code in replaced_spans:
        result_parts.append(html.escape(flat_text[last_idx:start]))
        result_parts.append(span_code)
        last_idx = end
    result_parts.append(html.escape(flat_text[last_idx:]))

    return "".join(result_parts), matched_count


def update_manifest(total_count: int) -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if "AOF_ITAR" not in manifest:
        manifest["AOF_ITAR"] = {"questionCount": total_count, "courseCount": 1}
    else:
        manifest["AOF_ITAR"]["questionCount"] = total_count
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"subjectManifest.json güncellendi: AOF_ITAR.questionCount = {total_count}")


def main() -> None:
    print("=== AÖF İLK DÖNEM İSLÂM TARİHİ KAVRAM VE SORU ENTEGRASYONU ===")
    raw_questions: List[Dict[str, Any]] = json.loads(
        ITAR_JSON_PATH.read_text(encoding="utf-8")
    )
    # Çıkmış sınav sorularını izole et (ilk 81 soru, id <= 20580)
    existing_questions = [
        q for q in raw_questions
        if q.get("yil") != "AÖF Alıştırma Soruları" and q["id"] <= 20580
    ]
    for q in existing_questions:
        q["yil"] = "1.1 Vizeler"
        q["donem"] = "1.1.1"
        q["sinav_kodu"] = "1.1.1"
        q["sinav_adi"] = "1. Sınıf 1. Dönem Ara Sınavı (Vize)"
    print(f"Mevcut çıkmış soru sayısı: {len(existing_questions)}")

    # 1. Alıştırma Sorularını Ekle
    practice_questions = load_all_practice_questions()
    print(f"Yeni alıştırma sorusu sayısı: {len(practice_questions)}")

    combined_questions = existing_questions + practice_questions
    print(f"Toplam birleştirilmiş soru sayısı: {len(combined_questions)}")

    # 2. Kavram Röntgenini Giydir (Kökler + Şıklar)
    matchers = build_matchers()
    print(f"Aktif kavram eşleştirici sayısı: {len(matchers)}")

    total_stem_bubbles = 0
    total_opt_bubbles = 0
    enriched_stem_questions = 0
    enriched_opt_questions = 0
    total_enriched_options = 0

    for q in combined_questions:
        # A) Soru kökü zenginleştirme
        stem = q["soru"]
        enriched_stem, stem_bubbles = enrich_stem_html(stem, matchers)
        if stem_bubbles > 0:
            q["soru_xray"] = enriched_stem
            total_stem_bubbles += stem_bubbles
            enriched_stem_questions += 1
        elif "soru_xray" in q:
            del q["soru_xray"]

        # B) Seçenekler (şıklar) zenginleştirme
        secenekler = q.get("secenekler", {})
        secenekler_xray: Dict[str, str] = {}
        for letter, opt_text in secenekler.items():
            enriched_opt, opt_bubbles = enrich_stem_html(opt_text, matchers)
            if opt_bubbles > 0:
                secenekler_xray[letter] = enriched_opt
                total_opt_bubbles += opt_bubbles
                total_enriched_options += 1

        if secenekler_xray:
            q["secenekler_xray"] = secenekler_xray
            enriched_opt_questions += 1
        elif "secenekler_xray" in q:
            del q["secenekler_xray"]

    # 3. Dosyaları Kaydet
    ITAR_JSON_PATH.write_text(
        json.dumps(combined_questions, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"AOF_ITAR.json güncellendi: {len(combined_questions)} soru.")
    print(
        f"Kökü röntgenli soru sayısı: {enriched_stem_questions} "
        f"({enriched_stem_questions/len(combined_questions)*100:.1f}%)"
    )
    print(
        f"Şıkları röntgenli soru sayısı: {enriched_opt_questions} "
        f"({enriched_opt_questions/len(combined_questions)*100:.1f}%)"
    )
    print(f"Toplam zenginleştirilmiş şık sayısı: {total_enriched_options}")
    print(f"Toplam kavram baloncuk sayısı: {total_stem_bubbles + total_opt_bubbles} (Kök: {total_stem_bubbles}, Şık: {total_opt_bubbles})")

    # 4. Manifesti Güncelle
    update_manifest(len(combined_questions))


if __name__ == "__main__":
    main()
