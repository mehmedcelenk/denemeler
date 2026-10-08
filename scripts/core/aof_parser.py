#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖF İlahiyat çıkmış sınav sorularını PDF'lerden ayıklar ve mükerrer kayıtları temizler."""

import glob
import os
import re
import subprocess
import lxml.html

WATERMARK_WORDS = {
    'An', 'ad', 'ol', 'u', 'Ü', 'niv', 'Ba', 'er', 'ha', 'sit', 'esi', 'ön', 'Aç', 'em', 'Ö', 'ıkö', 'ğ', 're', 'ğr', 'ra', 'tim', 'etim', 'Sı', 'Y', 'na', 'ılı', 'Sis', 'te', 'vı',
    'AOSDESTEK', 'aosdestek', 'aosdestek.anadolu.edu.tr', 'Anadolu', 'Üniversitesi', 'Açıköğretim', 'Sistemi'
}

AOF_COURSES = [
    {
        'folder': 'HADİS TARİHİ VE USÜLÜ ARA SINAV',
        'code': 'AOF_HADIS',
        'ders': 'HADİS TARİHİ VE USÜLÜ'
    },
    {
        'folder': 'İLK DÖNEM İSLAM TARİHİ ARA SINAV',
        'code': 'AOF_ITAR',
        'ders': 'İLK DÖNEM İSLAM TARİHİ'
    },
    {
        'folder': 'İSLAM AHLAK ESASLARI ARA SINAV',
        'code': 'AOF_AHLAK',
        'ders': 'İSLAM AHLAK ESASLARI'
    },
    {
        'folder': 'İSLAM İBADET ESASLARI ARA SINAV',
        'code': 'AOF_IBADET',
        'ders': 'İSLAM İBADET ESASLARI'
    },
    {
        'folder': 'İSLAM İNANÇ ESASLARI ARA SINAV',
        'code': 'AOF_INANC',
        'ders': 'İSLAM İNANÇ ESASLARI'
    }
]

def clean_stem(stem):
    stem = re.sub(r'^\d+\.\s*', '', stem).strip()
    return stem

def normalize_text(text):
    text = text.lower()
    tr_map = str.maketrans('çğışöüİÇĞİŞÖÜ', 'cgisouicgisou')
    text = text.translate(tr_map)
    text = re.sub(r'[^\w\s]', '', text)
    return ' '.join(text.split())

def parse_aof_folder(folder_path, course_name, global_start_id):
    pdfs = sorted(glob.glob(os.path.join(folder_path, '*.pdf')))
    raw_questions = []
    current_id = global_start_id

    for pdf_path in pdfs:
        fname = os.path.basename(pdf_path)
        try:
            raw = subprocess.check_output(f'pdftotext -bbox-layout "{pdf_path}" -', shell=True)
            root = lxml.html.fromstring(raw.decode('utf-8', errors='ignore'))
        except Exception as e:
            print(f"Error reading {pdf_path}:", e)
            continue

        # 1. Answer keys
        ans_key = {}
        for page in root.xpath('//page'):
            p_lines = []
            for line in page.xpath('.//line'):
                words = line.xpath('.//word')
                t = ' '.join(w.text for w in words if w.text is not None).strip()
                if not t:
                    continue
                x = float(line.get('xmin', 0))
                y = float(line.get('ymin', 0))
                p_lines.append((x, y, t))

            num_lines = [l for l in p_lines if 170 <= l[1] <= 220 and re.match(r'^\d+$', l[2]) and 1 <= int(l[2]) <= 25]
            ans_lines = [l for l in p_lines if 170 <= l[1] <= 220 and l[2] in ['A', 'B', 'C', 'D', 'E']]
            for n_item in num_lines:
                q_num = int(n_item[2])
                nx = n_item[0]
                closest = [a for a in ans_lines if abs(a[0] - nx) < 15]
                if closest:
                    best = min(closest, key=lambda a: abs(a[0] - nx) + abs(a[1] - (n_item[1] + 12)))
                    ans_key[q_num] = best[2]

        # 2. Extract Questions
        for page in root.xpath('//page'):
            p_lines = []
            for line in page.xpath('.//line'):
                words = line.xpath('.//word')
                clean_w = []
                for w in words:
                    wt = (w.text or '').strip()
                    if wt and wt not in WATERMARK_WORDS and not wt.startswith('aosdestek'):
                        clean_w.append(wt)
                t = ' '.join(clean_w).strip()
                if not t:
                    continue
                x = float(line.get('xmin', 0))
                y = float(line.get('ymin', 0))
                if y < 65 or y > 750:
                    continue
                if any(w in t for w in ['Cevap Anahtarı', 'Sorunun cevabı', 'BAHAR ARA', 'GÜZ ARA', 'DÖNEMİ ARA']):
                    continue
                p_lines.append({'x': x, 'y': y, 'text': t})

            col1 = [l for l in p_lines if l['x'] < 280]
            col2 = [l for l in p_lines if l['x'] >= 280]

            for col in [col1, col2]:
                if not col:
                    continue
                headers = []
                for l in col:
                    m = re.match(r'^([1-9]|1[0-9]|20)\.\s*(.*)', l['text'])
                    if m and 'Cevap' not in l['text']:
                        headers.append({'num': int(m.group(1)), 'y': l['y'], 'rest': m.group(2).strip()})

                headers.sort(key=lambda h: h['y'])
                for i, h in enumerate(headers):
                    y_start = h['y']
                    y_end = headers[i+1]['y'] if i+1 < len(headers) else 9999.0
                    box_lines = [l for l in col if y_start - 3 <= l['y'] < y_end - 3]

                    opt_letters = {}
                    for l in box_lines:
                        if l['text'] in ['A)', 'B)', 'C)', 'D)', 'E)']:
                            opt_letters[l['text'][0]] = l

                    min_opt_y = min((l['y'] for l in opt_letters.values()), default=9999.0)
                    stem_lines = []
                    for l in box_lines:
                        if l['y'] < min_opt_y - 4:
                            if l['text'].startswith(f"{h['num']}."):
                                stem_lines.append(h['rest'])
                            else:
                                stem_lines.append(l['text'])
                    stem = clean_stem(' '.join(filter(None, stem_lines)))

                    secenekler = {}
                    letters = ['A', 'B', 'C', 'D', 'E']
                    for idx, char in enumerate(letters):
                        if char in opt_letters:
                            char_y = opt_letters[char]['y']
                            next_char_y = opt_letters[letters[idx+1]]['y'] if idx+1 < len(letters) and letters[idx+1] in opt_letters else y_end
                            c_lines = [l['text'] for l in box_lines if (char_y - 4 <= l['y'] < next_char_y - 4) and l['text'] not in ['A)', 'B)', 'C)', 'D)', 'E)']]
                            secenekler[char] = ' '.join(c_lines).strip()
                        else:
                            secenekler[char] = ''

                    if stem and len(secenekler.get('A', '')) > 0:
                        raw_questions.append({
                            'num': h['num'],
                            'soru': stem,
                            'secenekler': secenekler,
                            'dogru_cevap': ans_key.get(h['num'], 'A'),
                            'pdf': fname
                        })

    # Deduplication
    unique_questions = []
    seen_stems = set()
    for q in raw_questions:
        norm = normalize_text(q['soru'])
        if len(norm) < 20:
            norm += ' ' + normalize_text(q['secenekler'].get('A', ''))
        if norm not in seen_stems:
            seen_stems.add(norm)
            q_dict = {
                'id': current_id,
                'ders': course_name,
                'ders_kodu': course_name,
                'yil': 'AÖF İlahiyat',
                'donem': 'ARA',
                'soru_no': len(unique_questions) + 1,
                'soru': q['soru'],
                'secenekler': q['secenekler'],
                'dogru_cevap': q['dogru_cevap'] or 'A',
                'ana_konu': 'Genel',
                'alt_konu': 'Genel',
                'kredi': 2,
                'sinav_soru_sayisi': 20,
                'puan': 0.1,
                'ipucu': '',
                'sekilli': False
            }
            unique_questions.append(q_dict)
            current_id += 1

    return unique_questions, current_id

def extract_all_aof_courses(base_id=20000):
    curr_id = base_id
    res = {}
    for c_info in AOF_COURSES:
        path = os.path.join('docs/kaynak_pdfler', c_info['folder'])
        if not os.path.exists(path):
            print(f"Warning: {path} directory missing")
            continue
        qs, curr_id = parse_aof_folder(path, c_info['ders'], curr_id)
        res[c_info['code']] = qs
        print(f"  {c_info['ders']}: {len(qs)} soru ayıklandı.")
    return res

