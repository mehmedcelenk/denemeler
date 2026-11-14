#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖO Soru Kökü, Seçenek 2B Ayrıştırma ve Görsel Tespiti."""

import re
import subprocess
import sys
from pathlib import Path
import lxml.html

sys.path.insert(0, str(Path(__file__).resolve().parent))
from aoo_math_layout import apply_sqrt_fixes, group_words_into_lines

AOO_SUBJECT_MAP = {
    'TÜRKÇE': 'AOO_TURKCE',
    'MATEMATİK': 'AOO_MAT',
    'FEN BİLİMLERİ': 'AOO_FEN',
    'SOSYAL BİLGİLER': 'AOO_SOS',
    'İNKILAP': 'AOO_SOS',
    'DİN KÜL': 'AOO_DIN',
    'DİN KÜLTÜRÜ': 'AOO_DIN',
    'İNGİLİZCE': 'AOO_ING',
}

AOO_CREDITS = {
    'TÜRKÇE': 6,
    'MATEMATİK': 5,
    'FEN BİLİMLERİ': 4,
    'SOSYAL BİLGİLER': 3,
    'İNKILAP': 2,
    'DİN KÜL': 2,
    'İNGİLİZCE': 3,
}

WATERMARK_WORDS = {'ÖLÇME', 'DEĞERLENDİRME', 'SINAV', 'HİZMETLERİ', 'GENEL', 'MÜDÜRLÜĞÜ'}
SECTION_INSTRUCTION_RE = re.compile(
    r'^(\d+)\s*(?:-\s*(\d+)|\s+ve\s+(\d+))?\.\s*sorularda\b.*işaretleyiniz\.?$',
    re.IGNORECASE,
)
VERTEX_NOISE_RE = re.compile(r'^(?:[A-HJ-UW-ZÇĞİÖŞÜ](?:\s+[A-HJ-UW-ZÇĞİÖŞÜ])*|(?:\d+\s*birim\s*)+)$')


def normalize_course_name(raw_name: str) -> str:
    name = ' '.join(raw_name.split()).upper()
    name = re.sub(r'\s*[–-]\s*', ' – ', name)
    name = name.replace('DİN KÜL. VE AHLAK BİLGİSİ', 'DİN KÜLTÜRÜ VE AHLAK BİLGİSİ')
    return f'AÖO {name}'


def get_aoo_subject_id(course_name: str) -> str:
    upper = course_name.upper()
    for key, sid in AOO_SUBJECT_MAP.items():
        if key in upper:
            return sid
    raise ValueError(f'Bilinmeyen AÖO dersi: {course_name}')


def get_aoo_credit(course_name: str) -> int:
    upper = course_name.upper()
    for key, cred in AOO_CREDITS.items():
        if key in upper:
            return cred
    return 2


def get_answer_keys(pdf_path: str):
    raw = subprocess.check_output(['pdftotext', '-bbox-layout', '-f', '24', '-l', '26', pdf_path, '-'])
    root = lxml.html.fromstring(raw.decode('utf-8', errors='ignore'))
    courses_list = []
    for page in root.xpath('//page'):
        p_lines = []
        for line in page.xpath('.//line'):
            words = line.xpath('.//word')
            text = ' '.join(w.text for w in words if w.text is not None).strip()
            if not text or float(line.get('ymin', 0)) < 50:
                continue
            p_lines.append((float(line.get('xmin', 0)), float(line.get('ymin', 0)), text))

        for x_start, x_end in [(0, 155), (155, 285), (285, 415), (415, 600)]:
            c_lines = sorted([l for l in p_lines if x_start <= l[0] < x_end], key=lambda l: l[1])
            curr = None
            for _, _, t in c_lines:
                m_code = re.match(r'^\(\s*(\d{3})\)\s*(.*)', t)
                if m_code:
                    curr = {'code': int(m_code.group(1)), 'name': m_code.group(2).strip(), 'answers': {}}
                    courses_list.append(curr)
                    continue
                if curr and not curr['answers'] and not re.match(r'^1\.\s*[A-D]', t):
                    curr['name'] += ' ' + t
                    continue
                m_ans = re.match(r'^([1-9]|1[0-2])\.\s*([A-D])', t)
                if m_ans and curr:
                    curr['answers'][int(m_ans.group(1))] = m_ans.group(2)
    return courses_list


def match_answer_key(c_code: int, c_name: str, keys_list: list) -> dict:
    candidates = [k for k in keys_list if k['code'] == c_code]
    if len(candidates) == 1:
        return candidates[0]['answers']
    if len(candidates) > 1:
        for lang in ('İNGİLİZCE', 'ALMANCA', 'FRANSIZCA'):
            if lang in c_name.upper():
                for cand in candidates:
                    if lang in cand['name'].upper():
                        return cand['answers']
        return candidates[0]['answers']
    return {}

VISUAL_PATTERNS = [
    r'\bşekildeki\b',
    r'\bşekle\s+göre\b',
    r'\bşekil\s+(?:I|II|III|IV|1|2|3|4)\b',
    r'\b(?:verilen|yukarıdaki|aşağıdaki|yandaki)\s+şek(?:il|le|ilde)\b',
    r'\bşekil(?:de)?\s+(?:verilen|gösterilen|belirtilen|numaralan|yer\s+alan|gibi)\b',
    r'\bharitada\s+(?:verilen|gösterilen|numaralan|belirtilen|koyu|taran|işaret|renk)',
    r'\bharitadaki\b',
    r'\bharitaya\s+göre\b',
    r'\bgrafik(?:te|teki)\s+(?:verilen|gösterilen|belirtilen|gibi|hareketle)',
    r'\bgrafikteki\b',
    r'\bgrafiğe\s+göre\b',
    r'\b(?:verilen|yukarıdaki|aşağıdaki|yandaki)\s+grafi(?:k|ğe|kte)\b',
    r'\bgörsel(?:de|deki|e|i|in)\b',
    r'\bgörsele\s+göre\b',
    r'\bgörselde\s+(?:verilen|gösterilen|numaralan|belirtilen|gibi)\b',
    r'\b(?:verilen|yukarıdaki|aşağıdaki|yandaki)\s+görsel\b',
    r'\bkroki(?:de|deki|ye)\b',
    r'\bkrokiye\s+göre\b',
    r'\btaran(?:arak|mış)\s+(?:alan|bölge|yer)\b',
    r'\bboyalı\s+(?:alan|bölge|kısım)\b',
    r'\bdevre\s+şeması\b',
    r'\b(?:kareli|noktalı|eş\s+kareli)\s+zemin(?:de|deki|e|üzerinde|\s+üzerinde)\b',
    r'\bsayı\s+doğrusu(?:nda|ndaki|üzerinde|\s+üzerinde)\b',
    r'\bkoordinat\s+sisteminde\b',
    r'\baçınımı\b',
    r'\bmodel(?:de|deki|e\s+göre)\b',
    r'\bşema(?:da|daki|ya\s+göre)\b',
    r'\btablo(?:da|daki|ya|yu|ya\s+göre)\b',
    r'\btabloda\s+(?:verilen|gösterilen|belirtilen|yer\s+alan|numaralan)\b',
    r'\b(?:verilen|yukarıdaki|aşağıdaki|yandaki)\s+tablo\b',
    r'\bin\s+the\s+picture\b',
]

EXCLUDE_VISUAL_PATTERNS = [
    r'\bgeometrik\s+şekle\b',
    r'\bne\s+şekilde\b',
    r'\b(?:bu|o|şu|iyi|doğru|sağlıklı|hızlı|bilinçli|olacak|düzenli|farklı|aynı|belirli\s+bir|bir)\s+şekilde\b',
]

VERTEX_NOISE_RE = re.compile(r'^(?:[A-HJ-UW-ZÇĞİÖŞÜ](?:\s+[A-HJ-UW-ZÇĞİÖŞÜ])*|(?:\d+\s*birim\s*)+)$')


def is_visual_question(stem: str, has_all_options: bool, forced_visual: bool = False) -> bool:
    if not has_all_options or forced_visual:
        return True
    cleaned = stem
    for exp in EXCLUDE_VISUAL_PATTERNS:
        cleaned = re.sub(exp, '', cleaned, flags=re.IGNORECASE)
    return any(re.search(pat, cleaned, re.IGNORECASE) for pat in VISUAL_PATTERNS)


def dehyphenate(text: str) -> str:
    text = re.sub(r'([a-zçğıöşüA-ZÇĞİÖŞÜ]{2,})-\s*\n\s*([a-zçğıöşü]{2,})', r'\1\2', text)
    text = re.sub(r'([a-zçğıöşüA-ZÇĞİÖŞÜ]{2,})-\s+([a-zçğıöşü]{2,})', r'\1\2', text)
    return apply_sqrt_fixes(text.strip())


def extract_stem_and_options_2d(q_lines: list):
    all_words = [w for ln in q_lines for w in ln['words']]
    markers = {}
    for w in all_words:
        for opt_char in ('A', 'B', 'C', 'D'):
            if w['text'] == f'{opt_char})' or w['text'].startswith(f'{opt_char})'):
                markers[opt_char] = w

    if len(markers) == 4:
        opt_top_yc = min((m['ymin'] + m['ymax']) / 2.0 for m in markers.values()) - 5.5
        stem_lines = []
        had_vertex_noise = False
        for ln in q_lines:
            if ln['yc'] < opt_top_yc:
                t = ln['text'].strip()
                if VERTEX_NOISE_RE.match(t):
                    had_vertex_noise = True
                    continue
                stem_lines.append(t)

        opt_words = {'A': [], 'B': [], 'C': [], 'D': []}
        m_info = {}
        for k, m in markers.items():
            myc = (m['ymin'] + m['ymax']) / 2.0
            right_bounds = [
                m2['xmin'] - 3.0
                for k2, m2 in markers.items()
                if k2 != k and abs(((m2['ymin'] + m2['ymax']) / 2.0) - myc) <= 8.0 and m2['xmin'] > m['xmin']
            ]
            bot_bounds = [
                ((m2['ymin'] + m2['ymax']) / 2.0) - 5.5
                for k2, m2 in markers.items()
                if k2 != k and abs(m2['xmin'] - m['xmin']) <= 35.0 and ((m2['ymin'] + m2['ymax']) / 2.0) > myc + 8.0
            ]
            m_info[k] = {
                'xmin': m['xmin'] - 6.0,
                'xmax': min(right_bounds) if right_bounds else 999.0,
                'ymin': myc - 5.5,
                'ymax': min(bot_bounds) if bot_bounds else 999.0,
                'myc': myc,
                'mx': m['xmin'],
            }

        for w in all_words:
            wyc = (w['ymin'] + w['ymax']) / 2.0
            if wyc < opt_top_yc:
                continue
            wt = w['text']
            matched_marker = False
            for k in ('A', 'B', 'C', 'D'):
                if wt == f'{k})':
                    matched_marker = True
                    break
                if wt.startswith(f'{k})') and len(wt) > 2:
                    w = dict(w, text=wt[2:].strip())
                    opt_words[k].append(w)
                    matched_marker = True
                    break
            if matched_marker:
                continue

            best_k = None
            for k, box in m_info.items():
                if box['xmin'] <= w['xmin'] <= box['xmax'] and box['ymin'] <= wyc <= box['ymax']:
                    best_k = k
                    break
            if best_k is None:
                best_k = min(
                    ('A', 'B', 'C', 'D'),
                    key=lambda k: abs(wyc - m_info[k]['myc']) * 3.0 + max(0.0, m_info[k]['mx'] - w['xmin']),
                )
            opt_words[best_k].append(w)

        opts = {}
        has_all = True
        for k in ('A', 'B', 'C', 'D'):
            lns = group_words_into_lines(opt_words[k])
            raw_opt = '\n'.join(l['text'] for l in lns).strip()
            clean_opt = ' '.join(dehyphenate(raw_opt).split())
            if not clean_opt:
                has_all = False
                opts[k] = f'[Görsel Seçenek {k}]'
            else:
                opts[k] = clean_opt

        stem_text = dehyphenate('\n'.join(stem_lines)) or 'Görsel soru.'
        return stem_text, opts, has_all, had_vertex_noise

    stem_lines = [ln['text'].strip() for ln in q_lines if not VERTEX_NOISE_RE.match(ln['text'].strip())]
    stem_text = dehyphenate('\n'.join(stem_lines)) or 'Görsel soru.'
    return stem_text, {
        'A': '[Görsel Seçenek A]',
        'B': '[Görsel Seçenek B]',
        'C': '[Görsel Seçenek C]',
        'D': '[Görsel Seçenek D]',
    }, False, True
