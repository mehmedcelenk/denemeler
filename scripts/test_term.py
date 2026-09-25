import subprocess, re, json, os
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
        m_course = re.match(r'^\(\s*(\d{3})\)\s*(.*)', text)
        if m_course:
            code = m_course.group(1)
            name = m_course.group(2).strip()
            curr_course = {'code': int(code), 'name': name, 'page': l[0], 'questions': []}
            courses.append(curr_course)
            curr_q = None
            continue
            
        if not curr_course: continue
        
        if len(curr_course['questions']) == 0 and curr_q is None:
            if not re.match(r'^1\.\s*', text) and not text.startswith('1-') and not text.startswith('1 -'):
                if text.isupper() or '–' in text or '-' in text:
                    curr_course['name'] += ' ' + text
                    continue
        
        m_q = re.match(r'^([1-9]|1[0-2])\.(\s+.*)?$', text)
        if m_q and len(curr_course['questions']) < 12:
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

    return all_records, len(courses), current_id

print('Testing 2023-2024 Dönem 2...')
recs, nc, gid = process_pdf('/home/mehmedbaykan/codes/ortaklar/kaynak_pdfler/2023_2024/donem2/oturum1.pdf', '2023-2024', 2, 1, 1)
print(f'Done! Found {nc} courses and {len(recs)} questions.')
ans_mapped = sum(1 for r in recs if r['dogru_cevap'] is not None)
print(f'Answers mapped: {ans_mapped} / {len(recs)}')
