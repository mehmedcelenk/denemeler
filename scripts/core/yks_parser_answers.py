#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""YKS Kitapçıkları Cevap Anahtarı Ayrıştırıcı."""

import subprocess
import re
from typing import Dict, List, Tuple


def extract_answers_from_pages(pdf_path: str, start_page: int, end_page: int) -> Dict[str, Dict[int, str]]:
    """Cevap anahtarı sayfalarındaki cevapları branş branş ayıklar."""
    cmd = f'pdftotext -f {start_page} -l {end_page} "{pdf_path}" -'
    raw = subprocess.check_output(cmd, shell=True).decode('utf-8', errors='ignore')

    # Standart ÖSYM / MEB branş başlıkları (hem Türkçe karakterli hem ASCII varyasyonları)
    known_headers = [
        'TÜRK DİLİ VE EDEBİYATI', 'TURK DILI VE EDEBIYATI', 'TÜRKÇE', 'TURKCE',
        'TARİH-1', 'TARIH-1', 'TARİH-2', 'TARIH-2', 'TARİH', 'TARIH',
        'COĞRAFYA-1', 'COGRAFYA-1', 'COĞRAFYA-2', 'COGRAFYA-2', 'COĞRAFYA', 'COGRAFYA',
        'FELSEFE', 'PSİKOLOJİ', 'PSIKOLOJI', 'SOSYOLOJİ', 'SOSYOLOJI', 'MANTIK',
        'MATEMATİK', 'MATEMATIK', 'FİZİK', 'FIZIK', 'KİMYA', 'KIMYA',
        'BİYOLOJİ', 'BIYOLOJI', 'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ', 'DIN KULTURU VE AHLAK BILGISI',
        'DİN KÜLTÜRÜ', 'DIN KULTURU', 'DİN', 'DIN', 'İNGİLİZCE', 'INGILIZCE', 'YDT', 'VOCABULARY'
    ]

    pattern = r'(' + '|'.join(re.escape(h) for h in known_headers) + r')'
    parts = re.split(pattern, raw)

    results: Dict[str, Dict[int, str]] = {}
    current_header = 'GENEL'

    for part in parts:
        part_clean = part.strip()
        if part_clean in known_headers:
            current_header = part_clean
            if current_header not in results:
                results[current_header] = {}
        else:
            ans_pairs = re.findall(r'(\d+)\.\s*([A-E])', part)
            if ans_pairs:
                if current_header not in results:
                    results[current_header] = {}
                for num_str, choice in ans_pairs:
                    results[current_header][int(num_str)] = choice

    return results


def normalize_subject_answer_key(raw_answers: Dict[str, Dict[int, str]], target_key: str) -> Dict[int, str]:
    """Farklı isim varyasyonlarını tek bir standart başlık altında birleştirir."""
    for k, v in raw_answers.items():
        if target_key.lower() in k.lower():
            return v
    # Eğer tek bir branş varsa ve GENEL altındaysa
    if 'GENEL' in raw_answers and raw_answers['GENEL']:
        return raw_answers['GENEL']
    return {}
