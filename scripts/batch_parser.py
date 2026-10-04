import subprocess, re, json, os, glob, time
from collections import defaultdict
import lxml.html

def clean_filename(name):
    tr_map = str.maketrans('çğışöüÇĞİŞÖÜ –-—/\\', 'cgisouCGISOU______')
    cleaned = name.translate(tr_map)
    cleaned = re.sub(r'[^A-Za-z0-9_]', '', cleaned)
    cleaned = re.sub(r'_+', '_', cleaned)
    return cleaned.strip('_')

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
        return stem, {'A': opt_a, 'B': opt_b, 'C': opt_c, 'D': opt_d}
    else:
        return joined_text, {'A': '', 'B': '', 'C': '', 'D': ''}

def get_answer_keys(pdf_path):
    raw = subprocess.check_output(f'pdftotext -bbox-layout -f 49 -l 51 "{pdf_path}" -', shell=True)
    root = lxml.html.fromstring(raw.decode('utf-8', errors='ignore'))
    courses_list = []
    for page in root.xpath('//page'):
        p_lines = []
        for line in page.xpath('.//line'):
            words = line.xpath('.//word')
            text = ' '.join(w.text for w in words if w.text is not None).strip()
            if not text: continue
            xMin = float(line.get('xmin', 0))
            yMin = float(line.get('ymin', 0))
            if yMin < 50: continue
            p_lines.append((xMin, yMin, text))
            
        for c_idx, (x_start, x_end) in enumerate([(0, 155), (155, 280), (280, 410), (410, 600)]):
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

def match_answer_key(c_code, c_name, keys_list):
    candidates = [k for k in keys_list if k['code'] == c_code]
    if len(candidates) == 1:
        return candidates[0]['answers']
    elif len(candidates) > 1:
        for lang in ['İNGİLİZCE', 'ALMANCA', 'FRANSIZCA']:
            if lang in c_name.upper():
                for cand in candidates:
                    if lang in cand['name'].upper():
                        return cand['answers']
        return candidates[0]['answers']
    return {}

def process_pdf(pdf_path, year_str, donem_no, oturum_no, global_start_id):
    ans_keys_list = get_answer_keys(pdf_path)
    
    # expected max questions for this year
    max_q_default = 11 if '2023-2024' in year_str else 10
    
    raw = subprocess.check_output(f'pdftotext -bbox-layout -f 3 -l 48 "{pdf_path}" -', shell=True)
    root = lxml.html.fromstring(raw.decode('utf-8', errors='ignore'))

    pages_data = []
    for p_idx, page in enumerate(root.xpath('//page')):
        p_num = 3 + p_idx
        for line in page.xpath('.//line'):
            words = line.xpath('.//word')
            text = ' '.join(w.text for w in words if w.text is not None).strip()
            if not text: continue
            xMin = float(line.get('xmin', 0))
            yMin = float(line.get('ymin', 0))
            if yMin < 40 or yMin > 750: continue
            col_idx = 1 if xMin < 195 else (2 if xMin < 365 else 3)
            pages_data.append((p_num, col_idx, yMin, xMin, text))
            
    pages_data.sort(key=lambda l: (l[0], l[1], round(l[2] / 3.0) * 3.0, l[3]))

    courses = []
    curr_course = None
    curr_q = None

    for l in pages_data:
        text = l[4]
        
        # Stop if exam instructions / end of exam reached on last page
        if any(stop_phrase in text.upper() for stop_phrase in ['TEST BİTTİ', 'SALON GÖREVLİLERİNCE', 'ADAYLARIN DİKKATİNE']):
            if l[0] >= 47:
                curr_q = None
                continue

        m_course = re.match(r'^\(\s*(\d{3})\)\s*(.*)', text)
        if m_course:
            code = int(m_course.group(1))
            name = m_course.group(2).strip()
            # check answer key to get exact question count if available
            c_ans = match_answer_key(code, name, ans_keys_list)
            max_q = len(c_ans) if c_ans else max_q_default
            curr_course = {'code': code, 'name': name, 'page': l[0], 'max_q': max_q, 'questions': []}
            courses.append(curr_course)
            curr_q = None
            continue
            
        if not curr_course: continue
        
        # Course name continuation before question 1
        if len(curr_course['questions']) == 0 and curr_q is None:
            if not re.match(r'^1\.\s*', text) and not text.startswith('1-') and not text.startswith('1 -'):
                # Only append if it's purely uppercase letters/dashes and NOT a math formula
                if (text.isupper() or '–' in text or '-' in text) and not any(ch in text for ch in ['$','^','+','=','*','/','\\','(',')','0','1','2','3','4','5','6','7','8','9','x','X']):
                    curr_course['name'] += ' ' + text
                    continue
        
        m_q = re.match(r'^([1-9]|1[0-2])\.(\s+.*)?$', text)
        if m_q and len(curr_course['questions']) < curr_course['max_q']:
            q_num = int(m_q.group(1))
            expected = len(curr_course['questions']) + 1
            if q_num == expected:
                rest = m_q.group(2).strip() if m_q.group(2) else ''
                curr_q = {'num': q_num, 'lines': [rest] if rest else [], 'page': l[0], 'col': l[1]}
                curr_course['questions'].append(curr_q)
            elif curr_q is not None:
                curr_q['lines'].append(text)
        elif curr_q is not None:
            curr_q['lines'].append(text)

    all_records = []
    current_id = global_start_id
    pdf_filename = os.path.basename(pdf_path)

    for c in courses:
        c_answers = match_answer_key(c['code'], c['name'], ans_keys_list)
        for q in c['questions']:
            stem, opts = extract_stem_and_options(q['lines'])
            has_opts = bool(opts['A'] and opts['B'] and opts['C'] and opts['D'])
            correct_ans = c_answers.get(q['num'], None)
            rec = {
                'id': current_id,
                'ders_kodu': c['code'],
                'ders': c['name'],
                'yil': year_str,
                'donem': donem_no,
                'oturum': oturum_no,
                'soru_no': q['num'],
                'soru': stem,
                'secenekler': opts,
                'dogru_cevap': correct_ans,
                'gorsel': None,
                'kaynak_pdf': pdf_filename,
                'sayfa': q['page'],
                'kontrol_gerekli': not has_opts or (correct_ans is None)
            }
            all_records.append(rec)
            current_id += 1

    return all_records, courses, ans_keys_list, current_id

def main():
    start_time = time.time()
    
    # Base directory (project root)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ciktilar_dir = os.path.join(base_dir, 'ciktilar')
    kaynak_dir = os.path.join(base_dir, 'docs/kaynak_pdfler')
    
    # Directory setup
    os.makedirs(os.path.join(ciktilar_dir, 'donemler'), exist_ok=True)
    os.makedirs(os.path.join(ciktilar_dir, 'dersler'), exist_ok=True)
    os.makedirs(os.path.join(ciktilar_dir, 'cografya'), exist_ok=True)
    
    # Discover all periods
    term_dirs = sorted(glob.glob(os.path.join(kaynak_dir, '*/*')))
    print(f"Found {len(term_dirs)} exam terms.")
    
    global_id = 1
    master_all_records = []
    course_records_map = defaultdict(list)
    cografya_records = []
    
    # Stats
    total_pdfs_processed = 0
    total_questions = 0
    total_answers_mapped = 0
    
    for t_dir in term_dirs:
        # e.g. docs/kaynak_pdfler/2023_2024/donem1
        parts = t_dir.replace('\\', '/').split('/')
        year_folder = parts[-2] # 2023_2024
        donem_folder = parts[-1] # donem1
        year_str = year_folder.replace('_', '-')
        donem_no = int(donem_folder.replace('donem', ''))
        
        term_records = []
        print(f"\n==================================================")
        print(f"Processing: {year_str} - {donem_no}. Dönem")
        print(f"==================================================")
        
        for oturum_no in [1, 2, 3]:
            pdf_path = os.path.join(t_dir, f"oturum{oturum_no}.pdf")
            if not os.path.exists(pdf_path):
                print(f"Warning: {pdf_path} not found!")
                continue
                
            t0 = time.time()
            recs, courses, ans_keys, global_id = process_pdf(pdf_path, year_str, donem_no, oturum_no, global_id)
            elapsed = time.time() - t0
            
            term_records.extend(recs)
            total_pdfs_processed += 1
            
            ans_count = sum(1 for r in recs if r['dogru_cevap'] is not None)
            print(f"  Oturum {oturum_no}: {len(courses)} ders, {len(recs)} soru (Cevap eşleşen: {ans_count}/{len(recs)}) [{elapsed:.1f}s]")
            
        # Save term file
        term_out_file = os.path.join(ciktilar_dir, 'donemler', f"{year_folder}_donem{donem_no}_tum_dersler.json")
        with open(term_out_file, 'w', encoding='utf-8') as f:
            json.dump(term_records, f, ensure_ascii=False, indent=2)
        print(f"  -> Dönem kaydedildi: {term_out_file} ({len(term_records)} soru)")
        
        # Accumulate
        master_all_records.extend(term_records)
        for r in term_records:
            c_key = (r['ders_kodu'], r['ders'])
            course_records_map[c_key].append(r)
            if 'COĞRAFYA' in r['ders'].upper():
                cografya_records.append(r)
                
    # Save course-specific files
    print("\n--------------------------------------------------")
    print(f"Saving aggregated courses to scripts/ciktilar/dersler/ ...")
    # Group by course code
    code_to_recs = defaultdict(list)
    code_to_name = {}
    for (c_code, c_name), q_list in course_records_map.items():
        code_to_recs[c_code].extend(q_list)
        code_to_name[c_code] = c_name
        
    for c_code, q_list in code_to_recs.items():
        c_name = code_to_name[c_code]
        clean_name = clean_filename(c_name)
        out_path = os.path.join(ciktilar_dir, 'dersler', f"{c_code}_{clean_name}.json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(q_list, f, ensure_ascii=False, indent=2)
            
    print(f"Total unique courses saved: {len(code_to_recs)}")
    
    # Save Coğrafya-specific outputs
    print("\n--------------------------------------------------")
    print("Saving Coğrafya specific datasets to scripts/ciktilar/cografya/ ...")
    with open(os.path.join(ciktilar_dir, 'cografya', 'tum_cografya_sorulari.json'), 'w', encoding='utf-8') as f:
        json.dump(cografya_records, f, ensure_ascii=False, indent=2)
        
    # Split by Coğrafya course
    cog_by_code = defaultdict(list)
    for r in cografya_records:
        cog_by_code[r['ders_kodu']].append(r)
        
    for code, recs in sorted(cog_by_code.items()):
        name = recs[0]['ders']
        clean_name = clean_filename(name)
        with open(os.path.join(ciktilar_dir, 'cografya', f"{code}_{clean_name}.json"), 'w', encoding='utf-8') as f:
            json.dump(recs, f, ensure_ascii=False, indent=2)
        print(f"  {code} - {name}: {len(recs)} soru")

    # Save Master JSON
    print("\n--------------------------------------------------")
    print("Saving Master Database (tum_sorular.json)...")
    with open(os.path.join(ciktilar_dir, 'tum_sorular.json'), 'w', encoding='utf-8') as f:
        json.dump(master_all_records, f, ensure_ascii=False, indent=2)
        
    total_answers = sum(1 for r in master_all_records if r['dogru_cevap'] is not None)
    total_time = time.time() - start_time
    
    print("\n==================================================")
    print("BATCH EXTRACTION COMPLETED SUCCESSFULLY!")
    print(f"Total PDFs processed: {total_pdfs_processed} / 24")
    print(f"Total questions extracted: {len(master_all_records)}")
    print(f"Questions with correct answer: {total_answers} / {len(master_all_records)} (%{total_answers*100/len(master_all_records):.2f})")
    print(f"Total Coğrafya questions: {len(cografya_records)}")
    print(f"Total execution time: {total_time:.1f} seconds")
    print("==================================================")

if __name__ == '__main__':
    main()
