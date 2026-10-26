#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kelam 1 ve Kelam 2 Sorularını MEB Hassas Kavram Baloncukları ile Zenginleştirici."""

import html
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

KLM_JSON_PATH = ROOT_DIR / "data" / "subjects" / "KLM.json"

from scripts.catalogs.klm1_precise_catalog import PRECISE_KLM1_CONCEPTS
from scripts.catalogs.klm2_precise_catalog import PRECISE_KLM2_CONCEPTS


def build_matchers(catalog: List[Dict[str, Any]], grade: str) -> List[Dict[str, Any]]:
    matchers = []
    for c in catalog:
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
                "grade": grade,
                "regex": regex,
                "len": len(c.get("term", "")),
            })
        except re.error as e:
            print(f"Hatalı regex: {patt_str} -> {e}")

    matchers.sort(key=lambda m: m["len"], reverse=True)
    return matchers


def enrich_text_html(text: str, matchers: List[Dict[str, Any]]) -> Tuple[str, int]:
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
            note_esc = html.escape(f"{m['grade']} S.{m['sayfa']} • {m['term']}", quote=True)
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


def build_explanation(q: Dict[str, Any], matchers: List[Dict[str, Any]], course_name: str) -> Tuple[str, str]:
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
    concept_name = matched_c["term"] if matched_c else course_name

    dogru_nedeni = (
        f"MEB Kelam Ders Kitabı (Sayfa {page_ref}) '{concept_name}' konusuna göre; "
        f"doğru yanıt {correct_opt} seçeneğindeki '{correct_text}' ifadesidir."
    )
    ipucu = f"MEB Kelam S.{page_ref}: {concept_name} bilgilerini dikkate alınız."
    return dogru_nedeni, ipucu


def main() -> None:
    print("=== KELAM 1 VE 2 SORULARINI HASSAS KAVRAMLARLA ZENGİNLEŞTİRME ===")
    if not KLM_JSON_PATH.exists():
        print(f"Hata: {KLM_JSON_PATH} bulunamadı.")
        return

    questions: List[Dict[str, Any]] = json.loads(KLM_JSON_PATH.read_text(encoding="utf-8"))
    matchers_klm1 = build_matchers(PRECISE_KLM1_CONCEPTS, "Kelam 1")
    matchers_klm2 = build_matchers(PRECISE_KLM2_CONCEPTS, "Kelam 2")

    total_stem_bubbles = 0
    total_opt_bubbles = 0
    questions_enriched = 0

    for q in questions:
        ders = q.get("ders")
        if ders == "KELAM – 1":
            matchers = matchers_klm1
        elif ders == "KELAM – 2":
            matchers = matchers_klm2
        else:
            continue

        # 1. Soru Kökü
        enriched_stem, stem_count = enrich_text_html(q["soru"], matchers)
        if stem_count > 0:
            q["soru_xray"] = enriched_stem
            total_stem_bubbles += stem_count
        elif "soru_xray" in q:
            del q["soru_xray"]

        # 2. Şıklar
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

        # 3. Açıklama
        dn, ipucu = build_explanation(q, matchers, ders)
        q["dogru_nedeni"] = dn
        q["ipucu"] = ipucu
        questions_enriched += 1

    KLM_JSON_PATH.write_text(json.dumps(questions, indent=2, ensure_ascii=False), encoding="utf-8")

    # Kavram dosyalarını kaydet
    concepts_dir = ROOT_DIR / "data" / "concepts"
    concepts_dir.mkdir(parents=True, exist_ok=True)
    (concepts_dir / "KLM_1_concepts.json").write_text(json.dumps(PRECISE_KLM1_CONCEPTS, indent=2, ensure_ascii=False), encoding="utf-8")
    (concepts_dir / "KLM_2_concepts.json").write_text(json.dumps(PRECISE_KLM2_CONCEPTS, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[✓] {questions_enriched} adet KELAM sorusu işlendi.")
    print(f"[✓] Soru köklerine eklenen kavram balonu: {total_stem_bubbles}")
    print(f"[✓] ŞIKLARA eklenen kavram balonu: {total_opt_bubbles}")
    print(f"[✓] Toplam aktif kavram balonu: {total_stem_bubbles + total_opt_bubbles}")


if __name__ == "__main__":
    main()
