#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fizik (1–4) Sorularını Dönem Bazlı (Semester-Scoped) Kavram ve Formül Baloncukları ile Zenginleştirici."""

import html
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

FIZ_JSON_PATH = ROOT_DIR / "data" / "subjects" / "FIZ.json"

from scripts.catalogs.fiz_precise_catalog import PRECISE_FIZ_CONCEPTS

STOPWORDS = {
    "bağlı", "bağlıdır", "oranla", "oranda", "hızlı", "kuvvetli",
}


def get_question_semester(q: Dict[str, Any]) -> int:
    ders = q.get("ders", "")
    m = re.search(r"(\d+)", ders)
    return int(m.group(1)) if m else 1


def resolve_definition_and_page(concept: Dict[str, Any], sem: int) -> Tuple[str, int]:
    tanim_map: Dict[int, str] = concept.get("tanim_by_donem", {})
    sayfa_map: Dict[int, int] = concept.get("sayfa_by_donem", {})
    if not tanim_map:
        return concept.get("tanim", ""), concept.get("sayfa", 18)

    available_sems = sorted(k for k in tanim_map.keys() if k <= sem)
    if not available_sems:
        available_sems = [min(tanim_map.keys())]

    parts = [tanim_map[s].strip() for s in available_sems]
    active_sem = available_sems[-1]
    sayfa = sayfa_map.get(sem) or sayfa_map.get(active_sem) or 18
    return " --- ".join(parts), sayfa


def build_matchers() -> List[Dict[str, Any]]:
    matchers = []
    for c in PRECISE_FIZ_CONCEPTS:
        patt_str = c.get("pattern", "")
        if not patt_str:
            continue
        try:
            regex = re.compile(
                rf"(?<![A-Za-zÇĞİÖŞÜçğıöşü])({patt_str})(?![A-Za-zÇĞİÖŞÜçğıöşü])",
                re.IGNORECASE,
            )
            matchers.append({
                "id": c.get("id"),
                "term": c.get("term"),
                "donemler": c.get("donemler", [1]),
                "sayfa_by_donem": c.get("sayfa_by_donem", {}),
                "tanim_by_donem": c.get("tanim_by_donem", {}),
                "regex": regex,
                "len": len(c.get("term", "")),
            })
        except re.error as e:
            print(f"Hatalı regex: {patt_str} -> {e}")

    matchers.sort(key=lambda m: m["len"], reverse=True)
    return matchers


def enrich_text_html(text: str, matchers: List[Dict[str, Any]], sem: int) -> Tuple[str, int]:
    if not text:
        return "", 0

    flat_text = re.sub(r"-\n\s*", "", text)
    flat_text = re.sub(r"\n\s*", " ", flat_text).strip()

    replaced_spans: List[Tuple[int, int, str]] = []
    matched_count = 0
    seen_concept_ids: Set[str] = set()

    for m in matchers:
        cid = m["id"]
        if cid in seen_concept_ids:
            continue
        for match in m["regex"].finditer(flat_text):
            start, end = match.span()
            matched_word = match.group(0)
            if matched_word.lower().strip() in STOPWORDS:
                continue
            conflict = any(s <= start < e or s < end <= e for s, e, _ in replaced_spans)
            if conflict:
                continue

            tanim_str, sayfa_no = resolve_definition_and_page(m, sem)
            tr_esc = html.escape(tanim_str, quote=True)
            note_esc = html.escape(f"FİZ {sem} • MEB S.{sayfa_no} • {m['term']}", quote=True)
            span_html = (
                f'<span class="vocab-word concept-word" '
                f'data-tr="{tr_esc}" data-note="{note_esc}" '
                f'onclick="showVocabBubble(this, event)">{html.escape(matched_word)}</span>'
            )
            replaced_spans.append((start, end, span_html))
            matched_count += 1
            seen_concept_ids.add(cid)
            break

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


def build_explanation(q: Dict[str, Any], matchers: List[Dict[str, Any]], sem: int) -> Tuple[str, str]:
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

    if matched_c:
        _, page_ref = resolve_definition_and_page(matched_c, sem)
        concept_name = matched_c["term"]
    else:
        page_ref = 18
        concept_name = q.get("alt_konu") or "Fizik"

    dogru_nedeni = (
        f"MEB Fizik {sem} Ders Kitabı (Sayfa {page_ref}) '{concept_name}' konusuna göre; "
        f"doğru yanıt {correct_opt} seçeneğindeki '{correct_text}' ifadesidir."
    )
    ipucu = f"FİZ {sem} • S.{page_ref}: {concept_name} formül ve kurallarını göz önünde bulundurunuz."
    return dogru_nedeni, ipucu


def main() -> None:
    print("=== FİZİK (1–4) SORULARINI DÖNEM BAZLI KAVRAM & FORMÜLLERLE ZENGİNLEŞTİRME ===")
    if not FIZ_JSON_PATH.exists():
        print(f"Hata: {FIZ_JSON_PATH} bulunamadı.")
        return

    questions: List[Dict[str, Any]] = json.loads(FIZ_JSON_PATH.read_text(encoding="utf-8"))
    matchers = build_matchers()
    print(f"Aktif dönem bazlı kavram eşleştirici sayısı: {len(matchers)}")

    total_stem_bubbles = 0
    total_opt_bubbles = 0
    questions_with_bubble = 0

    for q in questions:
        sem = get_question_semester(q)
        enriched_stem, stem_count = enrich_text_html(q["soru"], matchers, sem)
        if stem_count > 0:
            q["soru_xray"] = enriched_stem
            total_stem_bubbles += stem_count
        elif "soru_xray" in q:
            del q["soru_xray"]

        secenekler_xray: Dict[str, str] = {}
        opt_total_for_q = 0
        for letter, opt_text in q.get("secenekler", {}).items():
            enriched_opt, opt_count = enrich_text_html(opt_text, matchers, sem)
            if opt_count > 0:
                secenekler_xray[letter] = enriched_opt
                total_opt_bubbles += opt_count
                opt_total_for_q += opt_count

        if secenekler_xray:
            q["secenekler_xray"] = secenekler_xray
        elif "secenekler_xray" in q:
            del q["secenekler_xray"]

        if stem_count + opt_total_for_q > 0:
            questions_with_bubble += 1

        dn, ipucu = build_explanation(q, matchers, sem)
        q["dogru_nedeni"] = dn
        q["ipucu"] = ipucu

    FIZ_JSON_PATH.write_text(json.dumps(questions, indent=2, ensure_ascii=False), encoding="utf-8")

    concepts_path = ROOT_DIR / "data" / "concepts" / "FIZ_concepts.json"
    concepts_path.parent.mkdir(parents=True, exist_ok=True)
    concepts_path.write_text(json.dumps(PRECISE_FIZ_CONCEPTS, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[✓] {len(questions)} FİZİK sorusunun {questions_with_bubble} tanesi balonlandı ({100*questions_with_bubble/len(questions):.1f}%).")
    print(f"[✓] Soru köklerine eklenen kavram balonu: {total_stem_bubbles}")
    print(f"[✓] ŞIKLARA eklenen kavram balonu: {total_opt_bubbles}")
    print(f"[✓] Toplam aktif kavram balonu: {total_stem_bubbles + total_opt_bubbles}")


if __name__ == "__main__":
    main()
