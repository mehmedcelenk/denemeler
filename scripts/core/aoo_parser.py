#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Açık Öğretim Ortaokulu (AÖO) 2023-2026 Çıkmış Sınav Sorularını Ayrıştırıcı.

docs/kaynak_pdfler/aoo/ altındaki dönem ve oturum PDF'lerini okur,
data/subjects/AOO_*.json dosyalarını üretir.
"""

from collections import defaultdict
import glob
import json
from pathlib import Path
import re
import subprocess
import sys
import lxml.html

sys.path.insert(0, str(Path(__file__).resolve().parent))
from aoo_extractor import (
    SECTION_INSTRUCTION_RE,
    WATERMARK_WORDS,
    extract_stem_and_options_2d,
    get_answer_keys,
    get_aoo_credit,
    get_aoo_subject_id,
    is_visual_question,
    match_answer_key,
    normalize_course_name,
)
from aoo_math_layout import (
    apply_mm_fixes_to_word,
    extract_mm_nodes_by_page,
    group_words_into_lines,
    process_column_words,
)

ROOT_DIR = Path(__file__).resolve().parents[2]
AOO_PDF_DIR = ROOT_DIR / 'docs' / 'kaynak_pdfler' / 'aoo'
SUBJECTS_DIR = ROOT_DIR / 'data' / 'subjects'


def parse_aoo_pdf(pdf_path: str, year_str: str, donem_no: str, current_id: int):
    ans_keys_list = get_answer_keys(pdf_path)
    max_q_default = 11 if '2023-2024' in year_str else 10
    mm_by_page = extract_mm_nodes_by_page(pdf_path)

    raw = subprocess.check_output(['pdftotext', '-bbox-layout', '-f', '2', '-l', '23', pdf_path, '-'])
    root = lxml.html.fromstring(raw.decode('utf-8', errors='ignore'))

    all_col_lines = []
    for p_idx, page in enumerate(root.xpath('//page')):
        p_num = 2 + p_idx
        mm_nodes = mm_by_page.get(p_num, [])
        col_words = {1: [], 2: []}
        for line in page.xpath('.//line'):
            l_xmin, l_ymin = float(line.get('xmin', 0)), float(line.get('ymin', 0))
            if l_ymin < 38.0 or l_ymin > 780.0:
                continue
            col_idx = 1 if l_xmin < 280.0 else 2
            for w in line.xpath('.//word'):
                txt = (w.text or '').strip()
                if not txt:
                    continue
                xmin, ymin = float(w.get('xmin', 0)), float(w.get('ymin', 0))
                xmax, ymax = float(w.get('xmax', 0)), float(w.get('ymax', 0))
                if ymin < 38.0 or ymin > 780.0:
                    continue
                if ymin > 750.0 and 260.0 <= xmin <= 315.0 and txt.isdigit():
                    continue
                t_clean = txt.upper().rstrip(',')
                if t_clean in WATERMARK_WORDS or (txt.upper() == 'VE' and 270.0 <= xmin <= 315.0 and (xmax - xmin) < 15.0):
                    continue
                w_dict = {'xmin': xmin, 'ymin': ymin, 'xmax': xmax, 'ymax': ymax, 'text': txt}
                if not apply_mm_fixes_to_word(w_dict, mm_nodes):
                    continue
                col_words[col_idx].append(w_dict)

        for col_idx in (1, 2):
            processed = process_column_words(col_words[col_idx])
            for ln in group_words_into_lines(processed):
                ln['page'] = p_num
                ln['col'] = col_idx
                all_col_lines.append(ln)

    courses = []
    curr_course = None
    curr_q = None
    pending_lines = []

    for ln in all_col_lines:
        text = ln['text']
        if any(s in text.upper() for s in ('TEST BİTTİ', 'CEVAPLARINIZI KONTROL', 'SALON GÖREVLİLERİNCE', 'ADAYLARIN DİKKATİNE')):
            if ln['page'] >= 22:
                curr_q = None
                continue

        m_course = re.match(r'^\(\s*(\d{3})\s*\)\s*(.*)', text)
        if m_course:
            code = int(m_course.group(1))
            name = m_course.group(2).strip()
            c_ans = match_answer_key(code, name, ans_keys_list)
            max_q = len(c_ans) if c_ans else max_q_default
            curr_course = {
                'code': code,
                'name': name,
                'max_q': max_q,
                'questions': [],
                'visual_q_nums': set(),
            }
            courses.append(curr_course)
            curr_q = None
            pending_lines = []
            continue

        if not curr_course:
            continue

        if not curr_course['questions'] and curr_q is None:
            if not re.match(r'^1\.\s*', text) and not text.startswith(('1-', '1 -')):
                if 'ATATÜRKÇÜLÜK' in text or (text.isupper() and any(c in text for c in ('–', '-')) and len(text) < 40):
                    curr_course['name'] += ' ' + text
                    continue

        m_sec = SECTION_INSTRUCTION_RE.match(text)
        if m_sec or (curr_q and curr_q.get('PendingSec') and text.endswith('işaretleyiniz.')):
            if m_sec:
                q_start = int(m_sec.group(1))
                q_end = int(m_sec.group(2) or m_sec.group(3) or q_start)
                if 'görsele göre' in text.lower():
                    for qn in range(q_start, q_end + 1):
                        curr_course['visual_q_nums'].add(qn)
            if curr_q:
                curr_q['done_options'] = True
            continue
        if re.match(r'^\d+\s*(?:-\s*\d+|\s+ve\s+\d+)?\.\s*sorularda\b', text, re.IGNORECASE):
            if 'görsele göre' in text.lower():
                m_rng = re.match(r'^(\d+)\s*(?:-\s*(\d+)|\s+ve\s+(\d+))?', text)
                if m_rng:
                    qs = int(m_rng.group(1))
                    qe = int(m_rng.group(2) or m_rng.group(3) or qs)
                    for qn in range(qs, qe + 1):
                        curr_course['visual_q_nums'].add(qn)
            if curr_q:
                curr_q['done_options'] = True
                curr_q['PendingSec'] = True
            continue

        is_left_margin = (ln['col'] == 1 and ln['xmin'] < 65.0) or (ln['col'] == 2 and 275.0 <= ln['xmin'] <= 321.5)
        m_q = re.match(r'^([1-9]|1[0-2])\.(\s+.*)?$', text) if is_left_margin else None

        if m_q and len(curr_course['questions']) < curr_course['max_q']:
            q_num = int(m_q.group(1))
            expected = len(curr_course['questions']) + 1
            if q_num == expected:
                rest = (m_q.group(2) or '').strip()
                new_words = [w for w in ln['words'] if w['text'] != f'{q_num}.']
                if new_words and new_words[0]['text'].startswith(f'{q_num}.'):
                    new_words[0] = dict(new_words[0], text=new_words[0]['text'][len(f'{q_num}.'):].strip())
                first_ln = dict(ln, words=new_words, text=rest)
                curr_q = {
                    'num': q_num,
                    'lines': pending_lines + ([first_ln] if rest else []),
                    'seen_d': False,
                    'done_options': False,
                    'last_ymax': ln['ymax'],
                    'col': ln['col'],
                    'page': ln['page'],
                }
                curr_course['questions'].append(curr_q)
                pending_lines = []
                continue

        if curr_q is not None:
            if curr_q.get('done_options'):
                pending_lines.append(ln)
                continue
            if curr_q.get('seen_d'):
                same_col = ln['page'] == curr_q['page'] and ln['col'] == curr_q['col']
                gap = ln['ymin'] - curr_q['last_ymax']
                if not same_col or gap > 18.0:
                    curr_q['done_options'] = True
                    pending_lines.append(ln)
                    continue
            curr_q['lines'].append(ln)
            curr_q['last_ymax'] = max(curr_q['last_ymax'], ln['ymax'])
            curr_q['page'] = ln['page']
            curr_q['col'] = ln['col']
            if any(w['text'] == 'D)' or w['text'].startswith('D)') for w in ln['words']):
                curr_q['seen_d'] = True

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
            stem, opts, has_all_opts, had_v_noise = extract_stem_and_options_2d(q['lines'])
            correct_ans = c_answers.get(q['num'], 'A')
            forced_vis = had_v_noise or (q['num'] in c['visual_q_nums'])
            sekilli = is_visual_question(stem, has_all_opts, forced_vis)
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
        for sid in ('AOO_TURKCE', 'AOO_MAT', 'AOO_FEN', 'AOO_SOS', 'AOO_DIN', 'AOO_ING'):
            json_path = SUBJECTS_DIR / f'{sid}.json'
            if json_path.exists():
                res[sid] = json.loads(json_path.read_text(encoding='utf-8'))
        return dict(res)

    curr_id = base_id
    pdf_files = sorted(glob.glob(str(AOO_PDF_DIR / '*' / '*' / 'oturum*.pdf')))
    for pdf_path in pdf_files:
        parts = Path(pdf_path).parts
        year_str = parts[-3].replace('_', '-')
        donem_no = parts[-2].replace('donem', '')
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
