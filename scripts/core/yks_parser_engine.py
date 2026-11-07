#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""YKS PDF Soru Ayıklama Motoru."""

import subprocess
import re
from typing import Dict, List, Optional, Tuple, Any
import lxml.html


def extract_page_columns(pdf_path: str, start_page: int, end_page: int) -> List[Tuple[int, str, List[str]]]:
    """Sayfaları iki sütuna ayırarak sıralı satırlar üretir."""
    cmd = f'pdftotext -bbox-layout -f {start_page} -l {end_page} "{pdf_path}" -'
    raw = subprocess.check_output(cmd, shell=True)
    root = lxml.html.fromstring(raw.decode('utf-8', errors='ignore'))

    column_results: List[Tuple[int, str, List[str]]] = []

    for page_idx, page in enumerate(root.xpath('//page')):
        curr_page_num = start_page + page_idx
        width = float(page.get('width', 0))
        height = float(page.get('height', 0))
        mid = width / 2

        left_lines: List[Tuple[float, str]] = []
        right_lines: List[Tuple[float, str]] = []

        for line in page.xpath('.//line'):
            words = line.xpath('.//word')
            text = ' '.join(w.text for w in words if w.text).strip()
            if not text:
                continue
            xmin = float(line.get('xmin', 0))
            ymin = float(line.get('ymin', 0))

            # Header / footer filtreleri
            if ymin < 50 or ymin > height - 40:
                continue
            # YKS Çıkmış Sorular veya MEB genel ibarelerini atla
            if 'Ortaöğretim Genel' in text or 'YKS Çıkmış Sorular' in text:
                continue

            if xmin < mid:
                left_lines.append((ymin, text))
            else:
                right_lines.append((ymin, text))

        left_lines.sort(key=lambda x: x[0])
        right_lines.sort(key=lambda x: x[0])

        if left_lines:
            column_results.append((curr_page_num, 'L', [t for _, t in left_lines]))
        if right_lines:
            column_results.append((curr_page_num, 'R', [t for _, t in right_lines]))

    return column_results


def extract_stem_and_options(text: str) -> Tuple[str, Optional[Dict[str, str]], Optional[str]]:
    """Metinden soru kökünü, A-E şıklarını ve sınav yılı etiketini ayıklar."""
    pat = re.compile(r'(?:^|\s|\n)(?P<opt>[A-E])\)\s*')
    matches = list(pat.finditer(text))

    if len(matches) >= 5:
        for i in range(len(matches) - 4):
            sub = [matches[i + j].group('opt') for j in range(5)]
            if sub == ['A', 'B', 'C', 'D', 'E']:
                m_a, m_b, m_c, m_d, m_e = matches[i:i + 5]

                after_e = text[m_e.end():]
                year_match = re.search(r'\b(20\d\d-(?:TYT|AYT|YDT))\b', after_e)
                year_tag = year_match.group(1) if year_match else None

                end_e = m_e.end() + year_match.start() if year_match else len(text)

                stem = text[:m_a.start()].strip()
                opt_a = text[m_a.end():m_b.start()].strip()
                opt_b = text[m_b.end():m_c.start()].strip()
                opt_c = text[m_c.end():m_d.start()].strip()
                opt_d = text[m_d.end():m_e.start()].strip()
                opt_e = text[m_e.end():end_e].strip()

                secenekler = {'A': opt_a, 'B': opt_b, 'C': opt_c, 'D': opt_d, 'E': opt_e}
                return stem, secenekler, year_tag

    return text.strip(), None, None


def is_visual(text: str) -> bool:
    """Sorunun şekil / grafik / harita / tablo içerip içermediğini tespit eder."""
    return bool(re.search(r'\b(şekil|şekilde|şekildeki|grafik|grafikte|grafiğe|harita|haritada|tablo|tabloda)\b', text, re.I))

