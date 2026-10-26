#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tarih 1 Sorularını MEB Hassas Kavram Baloncukları ile Zenginleştirici.

data/subjects/TAR.json içindeki 82 adet 'TARİH – 1' sorusuna:
1. soru_xray: Soru kökündeki terimleri, medeniyetleri ve arkeolojik alanları 'showVocabBubble' ile zenginleştirir.
2. secenekler_xray: Şıklarda geçen kavramları (Tarih bilimi, takvimler, ilk çağ uygarlıkları, Orta Asya Türkleri)
   tıklanabilir kavram balonuyla zenginleştirir.
3. dogru_nedeni: MEB 9. Sınıf Tarih ders kitabı sayfa ve konu referanslı net gerekçe ekler.
4. ipucu: MEB 9. Sınıf sayfa ve kural referansı ekler.
"""

import html
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

TAR_JSON_PATH = ROOT_DIR / "data" / "subjects" / "TAR.json"
DATA_CONCEPTS_PATH = ROOT_DIR / "data" / "concepts" / "TAR_1_concepts.json"
DOCS_CONCEPTS_PATH = ROOT_DIR / "docs" / "dersler" / "tar" / "tar_1" / "tar_1_kavramlar.json"

from scripts.catalogs.tar1_precise_catalog import PRECISE_TAR1_CONCEPTS


def build_matchers() -> List[Dict[str, Any]]:
    matchers = []
    for c in PRECISE_TAR1_CONCEPTS:
        patt_str = c.get("pattern", "")
        if not patt_str:
            continue
        try:
            regex = re.compile(
                rf"\b({patt_str})\b" if not patt_str.startswith("^") else rf"({patt_str})",
                re.IGNORECASE,
            )
            matchers.append({
                "id": c.get("id"),
                "term": c.get("term"),
                "sayfa": c.get("sayfa", 12),
                "tanim": c.get("tanim", ""),
                "regex": regex,
                "len": len(c.get("term", "")),
            })
        except re.error as e:
            print(f"Hatalı regex: {patt_str} -> {e}")

    matchers.sort(key=lambda m: m["len"], reverse=True)
    return matchers


def enrich_text_html(text: str, matchers: List[Dict[str, Any]]) -> Tuple[str, int]:
    """Metin içindeki kavramları tespit edip span etiketleriyle sarar."""
    if not text:
        return "", 0

    flat_text = re.sub(r"-\n\s*", "", text)
    flat_text = re.sub(r"\n\s*", " ", flat_text).strip()

    replaced_spans: List[Tuple[int, int, str]] = []
    matched_count = 0

    for m in matchers:
        for match in m["regex"].finditer(flat_text):
            start, end = match.span()
            conflict = any(s <= start < e or s < end <= e for s, e, _ in replaced_spans)
            if conflict:
                continue

            matched_word = match.group(0)
            tr_esc = html.escape(m["tanim"], quote=True)
            note_esc = html.escape(f"9. Sınıf S.{m['sayfa']} • {m['term']}", quote=True)
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


def build_explanation(q: Dict[str, Any], matchers: List[Dict[str, Any]]) -> Tuple[str, str]:
    correct_opt = q.get("dogru_cevap", "A")
    correct_text = q.get("secenekler", {}).get(correct_opt, "").replace("\n", " ").strip()
    stem = q.get("soru", "").replace("\n", " ").strip()

    matched_c = None
    for m in matchers:
        if m["regex"].search(correct_text):
            matched_c = m
            break

    if not matched_c:
        for m in matchers:
            if m["regex"].search(stem):
                matched_c = m
                break

    page_ref = matched_c["sayfa"] if matched_c else 12
    concept_name = matched_c["term"] if matched_c else "Tarih 1"

    dogru_nedeni = (
        f"MEB Tarih 9. Sınıf Ders Kitabı (Sayfa {page_ref}) '{concept_name}' konusuna göre; "
        f"doğru yanıt {correct_opt} seçeneğindeki '{correct_text}' ifadesidir."
    )
    ipucu = f"MEB Tarih 9 S.{page_ref}: {concept_name} bilgilerini göz önünde bulundurunuz."
    return dogru_nedeni, ipucu


def main() -> None:
    print("=== TARİH 1 SORULARI VE ŞIKLARINI HASSAS KAVRAMLARLA ZENGİNLEŞTİRME ===")
    if not TAR_JSON_PATH.exists():
        print(f"Hata: {TAR_JSON_PATH} bulunamadı.")
        return

    questions: List[Dict[str, Any]] = json.loads(TAR_JSON_PATH.read_text(encoding="utf-8"))
    matchers = build_matchers()
    print(f"Aktif hassas kavram eşleştirici sayısı: {len(matchers)}")

    total_stem_bubbles = 0
    total_opt_bubbles = 0
    questions_enriched = 0

    for q in questions:
        if q.get("ders") != "TARİH – 1":
            continue

        # 1. Soru Kökü Röntgeni (soru_xray)
        enriched_stem, stem_count = enrich_text_html(q["soru"], matchers)
        if stem_count > 0:
            q["soru_xray"] = enriched_stem
            total_stem_bubbles += stem_count
        elif "soru_xray" in q:
            del q["soru_xray"]

        # 2. Şıklar Röntgeni (secenekler_xray)
        secenekler_xray: Dict[str, str] = {}
        for letter, opt_text in q.get("secenekler", {}).items():
            enriched_opt, opt_count = enrich_text_html(opt_text, matchers)
            if opt_count > 0:
                secenekler_xray[letter] = enriched_opt
                total_opt_bubbles += opt_count

        if secenekler_xray:
            q["secenekler_xray"] = secenekler_xray
        elif "secenekler_xray" in q:
            del q["secenekler_xray"]

        # 3. Açıklama ve İpucu
        dn, ipucu = build_explanation(q, matchers)
        q["dogru_nedeni"] = dn
        q["ipucu"] = ipucu
        questions_enriched += 1

    TAR_JSON_PATH.write_text(json.dumps(questions, indent=2, ensure_ascii=False), encoding="utf-8")

    # Kavram kataloğunu kaydet
    DATA_CONCEPTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    DOCS_CONCEPTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_CONCEPTS_PATH.write_text(json.dumps(PRECISE_TAR1_CONCEPTS, indent=2, ensure_ascii=False), encoding="utf-8")
    DOCS_CONCEPTS_PATH.write_text(json.dumps(PRECISE_TAR1_CONCEPTS, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[✓] {questions_enriched} adet TARİH – 1 sorusu işlendi.")
    print(f"[✓] Soru köklerine eklenen kavram balonu: {total_stem_bubbles}")
    print(f"[✓] ŞIKLARA eklenen kavram balonu: {total_opt_bubbles}")
    print(f"[✓] Toplam aktif kavram balonu: {total_stem_bubbles + total_opt_bubbles}")


if __name__ == "__main__":
    main()
