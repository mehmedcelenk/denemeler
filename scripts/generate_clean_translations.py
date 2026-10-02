# -*- coding: utf-8 -*-
"""
AÖL İngilizce Doğal Türkçe & Arapça Çeviri Motoru (Idempotent & Hata Dayanıklı)
656 MEB sorusunu cümle bazlı olarak doğal Türkçe (soru_tr) ve Arapça'ya (soru_ar) çevirir.
Daha önce başarıyla çevrilmiş soruları atlar, sadece eksik kalanları tamamlar.
"""

import json
import re
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

try:
    from scripts.generate_sentence_xray import clean_stem, is_turkish_prompt_line, generate_xray_html
except (ImportError, ModuleNotFoundError):
    from generate_sentence_xray import clean_stem, is_turkish_prompt_line, generate_xray_html

def translate_api(text, sl='en', tl='tr'):
    t = text.strip()
    if not t:
        return ''

    has_blank = '- - - -' in t
    if has_blank:
        t = t.replace('- - - -', 'XYZ')

    url = f'https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q=' + urllib.parse.quote(t)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'})

    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                res = ''.join(part[0] for part in data[0] if part[0]).strip()
                if has_blank:
                    res = re.sub(r'\bXYZ\b|XYZ', '- - - -', res)
                return res
        except Exception as e:
            if attempt == 3:
                print(f"Error ({sl}->{tl}): {e}")
                return text
            time.sleep(0.5 * (attempt + 1))
    return text

def translate_question_blocks(cleaned_stem):
    lines = cleaned_stem.split('\n')
    tr_lines = []
    ar_lines = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # 1. Türkçe Soru / Yönerge Kökü
        if is_turkish_prompt_line(line):
            tr_lines.append(line)
            ar_prompt = translate_api(line, sl='tr', tl='ar')
            ar_lines.append(ar_prompt)
            continue

        # 2. Diyalog Satırı (Konuşmacı : Söz)
        m_spk = re.match(r'^([A-Z][a-zA-Z\s\.\'\-]{0,20})\s*:\s*(.*)', line)
        if m_spk:
            speaker = m_spk.group(1).strip()
            utterance = m_spk.group(2).strip()

            ar_speaker = translate_api(speaker, sl='en', tl='ar')
            tr_utt = translate_api(utterance, sl='en', tl='tr')
            ar_utt = translate_api(utterance, sl='en', tl='ar')

            tr_lines.append(f"{speaker} : {tr_utt}")
            ar_lines.append(f"{ar_speaker} : {ar_utt}")
            continue

        # 3. Madde İmi (Bullet Point)
        m_bullet = re.match(r'^([•\-\*]\s*)(.*)', line)
        if m_bullet:
            bullet = m_bullet.group(1)
            content = m_bullet.group(2).strip()
            tr_c = translate_api(content, sl='en', tl='tr')
            ar_c = translate_api(content, sl='en', tl='ar')
            tr_lines.append(f"{bullet}{tr_c}")
            ar_lines.append(f"{bullet}{ar_c}")
            continue

        # 4. Standart İngilizce Paragraf / Cümle
        tr_narr = translate_api(line, sl='en', tl='tr')
        ar_narr = translate_api(line, sl='en', tl='ar')
        tr_lines.append(tr_narr)
        ar_lines.append(ar_narr)

    return '\n'.join(tr_lines), '\n'.join(ar_lines)

def is_valid_translation(trans, original):
    if not trans or not trans.strip():
        return False
    t = trans.strip()
    o = original.strip()
    # If translation is identical to original english and longer than 15 chars, it likely failed
    if t == o and len(o) > 15:
        return False
    return True

def process_question(q):
    stem = q.get('soru', '')
    c_stem = clean_stem(stem)
    q['soru'] = c_stem
    q['soru_xray'] = generate_xray_html(c_stem)

    curr_tr = q.get('soru_tr', '')
    curr_ar = q.get('soru_ar', '')

    need_tr = not is_valid_translation(curr_tr, c_stem)
    need_ar = not is_valid_translation(curr_ar, c_stem)

    if need_tr or need_ar:
        tr_res, ar_res = translate_question_blocks(c_stem)
        if need_tr and is_valid_translation(tr_res, c_stem):
            q['soru_tr'] = tr_res
        if need_ar and is_valid_translation(ar_res, c_stem):
            q['soru_ar'] = ar_res

    return q

def main():
    ing_path = Path('data/subjects/ING.json')
    if not ing_path.exists():
        print('Error: data/subjects/ING.json not found.')
        return

    with open(ing_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    # Filter questions needing translation
    to_translate = []
    for q in questions:
        c_stem = clean_stem(q.get('soru', ''))
        need_tr = not is_valid_translation(q.get('soru_tr', ''), c_stem)
        need_ar = not is_valid_translation(q.get('soru_ar', ''), c_stem)
        if need_tr or need_ar:
            to_translate.append(q)

    print(f"Total questions: {len(questions)}")
    print(f"Questions needing translation: {len(to_translate)}")

    if not to_translate:
        print("All questions already have valid translations!")
        # Still update soru and soru_xray
        for q in questions:
            q['soru'] = clean_stem(q.get('soru', ''))
            q['soru_xray'] = generate_xray_html(q['soru'])
        with open(ing_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        return

    start_time = time.time()
    completed = 0

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(process_question, q): q for q in to_translate}
        for future in as_completed(futures):
            completed += 1
            if completed % 25 == 0 or completed == len(to_translate):
                elapsed = time.time() - start_time
                print(f"Progress: {completed}/{len(to_translate)} ({completed/len(to_translate)*100:.1f}%) in {elapsed:.1f}s")

    # Update all questions' clean stem and xray
    for q in questions:
        q['soru'] = clean_stem(q.get('soru', ''))
        q['soru_xray'] = generate_xray_html(q['soru'])

    with open(ing_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    total_elapsed = time.time() - start_time
    print(f"All done in {total_elapsed:.2f}s! Successfully updated data/subjects/ING.json")

if __name__ == '__main__':
    main()
