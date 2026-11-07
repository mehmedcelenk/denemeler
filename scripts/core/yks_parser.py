#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""YKS (TYT, AYT, YDT) Çıkmış Soru Kitapları Ayrıştırıcı ve JSON Üretici.

Resmi MEB OGM Materyal PDF kitapçıklarından soruları ayıklar,
şıkları, doğru cevapları ve konuları eşleştirerek data/subjects/*.json üretir.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple

from yks_parser_answers import extract_answers_from_pages, normalize_subject_answer_key
from yks_parser_engine import extract_page_columns, extract_stem_and_options, is_visual

ROOT_DIR = Path(__file__).resolve().parents[2]
PDF_DIR = ROOT_DIR / "kaynaklar" / "yks"
OUT_DIR = ROOT_DIR / "data" / "subjects"
OUT_DIR.mkdir(parents=True, exist_ok=True)

ID_BASE = 50000
_global_id_counter = ID_BASE


def next_id() -> int:
    global _global_id_counter
    _global_id_counter += 1
    return _global_id_counter


def parse_subject_stream(
    pdf_path: str,
    start_page: int,
    end_page: int,
    ans_key: Dict[int, str],
    course_name: str,
    sinav_adi: str
) -> List[Dict[str, Any]]:
    """Belirtilen sayfa aralığındaki soruları sütun akışıyla ayıklar."""
    columns = extract_page_columns(pdf_path, start_page, end_page)

    q_blocks: List[Tuple[int, str, List[str]]] = []
    curr_q_num = None
    curr_topic = "Genel"
    curr_lines: List[str] = []

    for page_num, col, lines in columns:
        for line in lines:
            # Konu başlığı tespiti (sayı ile başlamayan kısa başlık)
            if re.match(r'^[A-ZÇĞİÖŞÜ][A-Za-zçğıöşü\s–-]{3,40}$', line) and not re.search(r'\b(hangisi|değildir|olabilir|yargı)\b', line, re.I):
                curr_topic = line.strip()
                continue

            # Soru başlangıcı: örn. "1." veya "1. Soru kökü..."
            m = re.match(r'^(\d+)\.\s*(.*)', line)
            if m:
                cand_num = int(m.group(1))
                # Mantıklı soru numarası kontrolü (sıralı veya makul yakınlıkta)
                if curr_q_num is None or (cand_num > curr_q_num and cand_num <= curr_q_num + 5) or (curr_q_num is None and cand_num == 1):
                    if curr_q_num is not None:
                        q_blocks.append((curr_q_num, curr_topic, curr_lines))
                    curr_q_num = cand_num
                    rest = m.group(2).strip()
                    curr_lines = [rest] if rest else []
                    continue

            if curr_q_num is not None:
                curr_lines.append(line)

    if curr_q_num is not None:
        q_blocks.append((curr_q_num, curr_topic, curr_lines))

    # Bloklardan Question nesnelerini üret
    parsed_questions: List[Dict[str, Any]] = []

    for q_no, topic, lines in q_blocks:
        full_text = '\n'.join(lines).strip()
        stem, secenekler, year_tag = extract_stem_and_options(full_text)

        # 5 şık da bulunamadıysa (resimli soru veya eksik parse)
        if not secenekler or not all(k in secenekler for k in ['A', 'B', 'C', 'D', 'E']):
            continue

        # Doğru cevap eşleştirmesi
        correct_answer = ans_key.get(q_no, 'A')

        # Sınav yılı
        yil = "2023"
        if year_tag:
            m_yr = re.search(r'(20\d\d)', year_tag)
            if m_yr:
                yil = m_yr.group(1)

        q_obj: Dict[str, Any] = {
            "id": next_id(),
            "ders": course_name,
            "soru_no": q_no,
            "soru": stem,
            "secenekler": secenekler,
            "dogru_cevap": correct_answer,
            "ana_konu": topic,
            "yil": yil,
            "donem": 1,
            "sinav_adi": sinav_adi,
            "sekilli": is_visual(stem),
            "puan": 1.0,
            "kredi": 1
        }
        parsed_questions.append(q_obj)

    return parsed_questions
