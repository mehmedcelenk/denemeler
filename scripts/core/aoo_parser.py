#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Açık Öğretim Ortaokulu (AÖO) 2023-2026 Çıkmış Sınav Sorularını Ayrıştırıcı.

docs/kaynak_pdfler/aoo/ altındaki dönem ve oturum PDF'lerini okur,
data/subjects/AOO_*.json dosyalarını üretir.
"""

from collections import defaultdict
import glob
import json
import os
from pathlib import Path
import re
import subprocess
import lxml.html

ROOT_DIR = Path(__file__).resolve().parents[2]
AOO_PDF_DIR = ROOT_DIR / 'docs' / 'kaynak_pdfler' / 'aoo'
SUBJECTS_DIR = ROOT_DIR / 'data' / 'subjects'

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
    r'\bgörsel(?:de|deki)\b',
    r'\bgörsele\s+göre\b',
    r'\bgörselde\s+(?:verilen|gösterilen|numaralan|belirtilen|gibi)\b',
    r'\b(?:verilen|yukarıdaki|aşağıdaki|yandaki)\s+görsel\b',
    r'\bkroki(?:de|deki|ye)\b',
    r'\bkrokiye\s+göre\b',
    r'\btaran(?:arak|mış)\s+(?:alan|bölge|yer)\b',
    r'\bboyalı\s+(?:alan|bölge|kısım)\b',
    r'\bdevre\s+şeması\b',
    r'\bkareli\s+zeminde\b',
    r'\bmodel(?:de|deki|e\s+göre)\b',
    r'\bşema(?:da|daki|ya\s+göre)\b',
]

EXCLUDE_VISUAL_PATTERNS = [
    r'\bgeometrik\s+şekle\b',
    r'\bne\s+şekilde\b',
    r'\b(?:bu|o|şu|iyi|doğru|sağlıklı|hızlı|bilinçli|olacak|düzenli|farklı|aynı|belirli\s+bir|bir)\s+şekilde\b',
]


def is_visual_question(stem: str, has_all_options: bool) -> bool:
    if not has_all_options:
        return True
    cleaned = stem
    for exp in EXCLUDE_VISUAL_PATTERNS:
        cleaned = re.sub(exp, '', cleaned, flags=re.IGNORECASE)
    for pat in VISUAL_PATTERNS:
        if re.search(pat, cleaned, re.IGNORECASE):
            return True
    return False


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


def extract_stem_and_options(lines):
    joined_text = '\n'.join(lines).strip()
    a = re.search(r'(?:^|\s|\n)A\)', joined_text)
    b = re.search(r'(?:^|\s|\n)B\)', joined_text)
    c = re.search(r'(?:^|\s|\n)C\)', joined_text)
    d = re.search(r'(?:^|\s|\n)D\)', joined_text)

    if a and b and c and d and (a.start() < b.start() < c.start() < d.start()):
        stem = joined_text[:a.start()].strip()
        opt_a = joined_text[a.end():b.start()].strip()
        opt_b = joined_text[b.end():c.start()].strip()
        opt_c = joined_text[c.end():d.start()].strip()
        opt_d = joined_text[d.end():].strip()
        has_all = bool(opt_a and opt_b and opt_c and opt_d)
        return stem, {
            'A': opt_a or '[Görsel Seçenek A]',
            'B': opt_b or '[Görsel Seçenek B]',
            'C': opt_c or '[Görsel Seçenek C]',
            'D': opt_d or '[Görsel Seçenek D]',
        }, has_all

    return joined_text or 'Görsel soru.', {
        'A': '[Görsel Seçenek A]',
        'B': '[Görsel Seçenek B]',
        'C': '[Görsel Seçenek C]',
        'D': '[Görsel Seçenek D]',
    }, False


def get_answer_keys(pdf_path: str):
    raw = subprocess.check_output(['pdftotext', '-bbox-layout', '-f', '24', '-l', '26', pdf_path, '-'])
    root = lxml.html.fromstring(raw.decode('utf-8', errors='ignore'))
    courses_list = []
    for page in root.xpath('//page'):
        p_lines = []
        for line in page.xpath('.//line'):
            words = line.xpath('.//word')
            text = ' '.join(w.text for w in words if w.text is not None).strip()
            if not text:
                continue
            xmin = float(line.get('xmin', 0))
            ymin = float(line.get('ymin', 0))
            if ymin < 50:
                continue
            p_lines.append((xmin, ymin, text))

        for x_start, x_end in [(0, 155), (155, 285), (285, 415), (415, 600)]:
            c_lines = [l for l in p_lines if x_start <= l[0] < x_end]
            c_lines.sort(key=lambda l: l[1])
            curr = None
            for l in c_lines:
                t = l[2]
                m_code = re.match(r'^\(\s*(\d{3})\)\s*(.*)', t)
                if m_code:
                    code = int(m_code.group(1))
                    name = m_code.group(2).strip()
                    curr = {'code': code, 'name': name, 'answers': {}}
                    courses_list.append(curr)
                    continue
                if curr and len(curr['answers']) == 0:
                    if not re.match(r'^1\.\s*[A-D]', t):
                        curr['name'] += ' ' + t
                        continue
                m_ans = re.match(r'^([1-9]|1[0-2])\.\s*([A-D])', t)
                if m_ans and curr:
                    curr['answers'][int(m_ans.group(1))] = m_ans.group(2)
    return courses_list


def match_answer_key(c_code: int, c_name: str, keys_list):
    candidates = [k for k in keys_list if k['code'] == c_code]
    if len(candidates) == 1:
        return candidates[0]['answers']
    if len(candidates) > 1:
        for lang in ['İNGİLİZCE', 'ALMANCA', 'FRANSIZCA']:
            if lang in c_name.upper():
                for cand in candidates:
                    if lang in cand['name'].upper():
                        return cand['answers']
        return candidates[0]['answers']
    return {}


def parse_aoo_pdf(pdf_path: str, year_str: str, donem_no: str, current_id: int):
    ans_keys_list = get_answer_keys(pdf_path)
    max_q_default = 11 if '2023-2024' in year_str else 10

    raw = subprocess.check_output(['pdftotext', '-bbox-layout', '-f', '2', '-l', '23', pdf_path, '-'])
    root = lxml.html.fromstring(raw.decode('utf-8', errors='ignore'))

    pages_data = []
    for p_idx, page in enumerate(root.xpath('//page')):
        p_num = 2 + p_idx
        for line in page.xpath('.//line'):
            words = line.xpath('.//word')
            text = ' '.join(w.text for w in words if w.text is not None).strip()
            if not text:
                continue
            xmin = float(line.get('xmin', 0))
            ymin = float(line.get('ymin', 0))
            if ymin < 38 or ymin > 760:
                continue
            if re.match(r'^[12]\.\s*OTURUM$', text):
                continue
            if 'GENEL MÜDÜRLÜĞÜ' in text.upper():
                continue
            col_idx = 1 if xmin < 275 else 2
            pages_data.append((p_num, col_idx, ymin, xmin, text))

    pages_data.sort(key=lambda l: (l[0], l[1], round(l[2] / 3.0) * 3.0, l[3]))

    courses = []
    curr_course = None
    curr_q = None

    for l in pages_data:
        text = l[4]
        if any(stop in text.upper() for stop in ['TEST BİTTİ', 'CEVAPLARINIZI KONTROL', 'SALON GÖREVLİLERİNCE', 'ADAYLARIN DİKKATİNE']):
            if l[0] >= 22:
                curr_q = None
                continue

        m_course = re.match(r'^\(\s*(\d{3})\)\s*(.*)', text)
        if m_course:
            code = int(m_course.group(1))
            name = m_course.group(2).strip()
            c_ans = match_answer_key(code, name, ans_keys_list)
            max_q = len(c_ans) if c_ans else max_q_default
            curr_course = {'code': code, 'name': name, 'page': l[0], 'max_q': max_q, 'questions': []}
            courses.append(curr_course)
            curr_q = None
            continue

        if not curr_course:
            continue

        if len(curr_course['questions']) == 0 and curr_q is None:
            if not re.match(r'^1\.\s*', text) and not text.startswith('1-') and not text.startswith('1 -'):
                if (text.isupper() or '–' in text or '-' in text) and not any(ch in text for ch in ['$', '^', '+', '=', '*', '/', '\\', '(', ')', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', 'X']):
                    curr_course['name'] += ' ' + text
                    continue
                if re.match(r'^ATATÜRKÇÜLÜK\s*[–-]\s*\d+$', text):
                    curr_course['name'] += ' ' + text
                    continue

        m_q = re.match(r'^([1-9]|1[0-2])\.(\s+.*)?$', text)
        if m_q and len(curr_course['questions']) < curr_course['max_q']:
            q_num = int(m_q.group(1))
            expected = len(curr_course['questions']) + 1
            if q_num == expected:
                rest = m_q.group(2).strip() if m_q.group(2) else ''
                curr_q = {'num': q_num, 'lines': [rest] if rest else []}
                curr_course['questions'].append(curr_q)
            elif curr_q is not None:
                curr_q['lines'].append(text)
        elif curr_q is not None:
            curr_q['lines'].append(text)

    records = []
    for c in courses:
        upper_name = c['name'].upper()
        if 'ALMANCA' in upper_name or 'FRANSIZCA' in upper_name:
            continue
        c_answers = match_answer_key(c['code'], c['name'], ans_keys_list)
        norm_name = normalize_course_name(c['name'])
        subj_id = get_aoo_subject_id(norm_name)
        kredi = get_aoo_credit(norm_name)
        exam_q_count = len(c['questions']) or 10
        puan = round(100 / exam_q_count, 2)

        for q in c['questions']:
            stem, opts, has_all_opts = extract_stem_and_options(q['lines'])
            correct_ans = c_answers.get(q['num'], 'A')
            sekilli = is_visual_question(stem, has_all_opts)
            records.append((subj_id, {
                'id': current_id,
                'ders': norm_name,
                'ders_kodu': c['code'],
                'yil': year_str,
                'donem': str(donem_no),
                'soru_no': q['num'],
                'soru': stem,
                'secenekler': opts,
                'dogru_cevap': correct_ans,
                'ana_konu': 'Genel',
                'alt_konu': 'Genel',
                'kredi': kredi,
                'sinav_soru_sayisi': exam_q_count,
                'puan': puan,
                'sekilli': sekilli,
            }))
            current_id += 1

    return records, current_id


def extract_all_aoo_courses(base_id: int = 80001):
    res = defaultdict(list)
    if not AOO_PDF_DIR.exists():
        for sid in ['AOO_TURKCE', 'AOO_MAT', 'AOO_FEN', 'AOO_SOS', 'AOO_DIN', 'AOO_ING']:
            json_path = SUBJECTS_DIR / f'{sid}.json'
            if json_path.exists():
                res[sid] = json.loads(json_path.read_text(encoding='utf-8'))
        return dict(res)

    curr_id = base_id
    pdf_files = sorted(glob.glob(str(AOO_PDF_DIR / '*' / '*' / 'oturum*.pdf')))
    for pdf_path in pdf_files:
        parts = Path(pdf_path).parts
        year_folder = parts[-3]
        donem_folder = parts[-2]
        year_str = year_folder.replace('_', '-')
        donem_no = donem_folder.replace('donem', '')
        recs, curr_id = parse_aoo_pdf(pdf_path, year_str, donem_no, curr_id)
        for subj_id, q_dict in recs:
            res[subj_id].append(q_dict)

    return dict(res)


if __name__ == '__main__':
    data = extract_all_aoo_courses()
    SUBJECTS_DIR.mkdir(parents=True, exist_ok=True)
    for sid, qs in sorted(data.items()):
        out_path = SUBJECTS_DIR / f'{sid}.json'
        out_path.write_text(json.dumps(qs, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        print(f'✅ {sid}: {len(qs)} soru kaydedildi.')
