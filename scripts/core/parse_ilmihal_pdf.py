#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""docs/İLMİHALTEST.pdf dosyasından 15 bölümdeki tüm soruları ve cevap anahtarlarını ayrıştırır,
data/subjects/ILM_*.json ve data/subjects/ILMIHAL.json üretir.
"""

import json
import re
import sys
from pathlib import Path
import fitz

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

PDF_PATH = ROOT_DIR / 'docs' / 'İLMİHALTEST.pdf'
OUTPUT_DIR = ROOT_DIR / 'data' / 'subjects'

SECTIONS_CONFIG = [
    {
        'id': 'ILM_TEMIZLIK',
        'ders': 'TEMİZLİK SORULARI',
        'ana_konu': 'Temizlik',
        'q_pat': r'TEMİZLİK SORULARI',
        'a_pat': r'TEMİZLİK TESTİ CEVAPLARI',
        'next_pat': r'NAMAZ SORULARI',
        'exp_count': 73
    },
    {
        'id': 'ILM_NAMAZ',
        'ders': 'NAMAZ SORULARI',
        'ana_konu': 'Namaz',
        'q_pat': r'NAMAZ SORULARI',
        'a_pat': r'NAMAZ TESTİ CEVAPLARI',
        'next_pat': r'CUMA VE HUTBE SORULARI',
        'exp_count': 130
    },
    {
        'id': 'ILM_CUMA',
        'ders': 'CUMA VE HUTBE SORULARI',
        'ana_konu': 'Cuma ve Hutbe',
        'q_pat': r'CUMA VE HUTBE SORULARI',
        'a_pat': r'CUMA VE HUTBE TESTİ CEVAPLARI',
        'next_pat': r'CENAZE\b',
        'exp_count': 38
    },
    {
        'id': 'ILM_CENAZE',
        'ders': 'CENAZE SORULARI',
        'ana_konu': 'Cenaze',
        'q_pat': r'CENAZE\b',
        'a_pat': r'CENAZE TESTİ CEVAPLARI',
        'next_pat': r'ORUÇ TESTİ\b',
        'exp_count': 35
    },
    {
        'id': 'ILM_ORUC',
        'ders': 'ORUÇ SORULARI',
        'ana_konu': 'Oruç',
        'q_pat': r'ORUÇ TESTİ\b',
        'a_pat': r'ORUÇ TESTİ CEVAPLARI',
        'next_pat': r'ZEKÂT TESTİ\b',
        'exp_count': 30
    },
    {
        'id': 'ILM_ZEKAT_1',
        'target_id': 'ILM_ZEKAT',
        'ders': 'ZEKÂT TESTİ - 1',
        'ana_konu': 'Zekât',
        'q_pat': r'ZEKÂT TESTİ\b',
        'a_pat': r'ZEKAT TESTİ\s*\n\s*1\s*B',
        'next_pat': r'ZEKAT TESTİ\s*-\s*2',
        'exp_count': 114
    },
    {
        'id': 'ILM_ZEKAT_2',
        'target_id': 'ILM_ZEKAT',
        'ders': 'ZEKÂT TESTİ - 2',
        'ana_konu': 'Zekât',
        'q_pat': r'ZEKAT TESTİ\s*-\s*2',
        'a_pat': r'CEVAP ANAHTARI',
        'next_pat': r'HAC TESTİ\b',
        'exp_count': 55
    },
    {
        'id': 'ILM_HAC',
        'ders': 'HAC VE UMRE SORULARI',
        'ana_konu': 'Hac ve Umre',
        'q_pat': r'HAC TESTİ\b',
        'a_pat': r'HAC TESTİ CEVAPLARI',
        'next_pat': r'HAC FIKHI\s*-1',
        'exp_count': 84
    },
    {
        'id': 'ILM_HAC_FIKHI_1',
        'target_id': 'ILM_HAC_FIKHI',
        'ders': 'HAC FIKHI - 1',
        'ana_konu': 'Hac Fıkhı',
        'q_pat': r'HAC FIKHI\s*-1',
        'a_pat': r'CEVAP ANAHTARI',
        'next_pat': r'HAC FIKHI\s*-2',
        'exp_count': 45
    },
    {
        'id': 'ILM_HAC_FIKHI_2',
        'target_id': 'ILM_HAC_FIKHI',
        'ders': 'HAC FIKHI - 2',
        'ana_konu': 'Hac Fıkhı',
        'q_pat': r'HAC FIKHI\s*-2',
        'a_pat': r'CEVAP ANAHTARI',
        'next_pat': r'HAC FIKHI\s*-3',
        'exp_count': 45
    },
    {
        'id': 'ILM_HAC_FIKHI_3',
        'target_id': 'ILM_HAC_FIKHI',
        'ders': 'HAC FIKHI - 3',
        'ana_konu': 'Hac Fıkhı',
        'q_pat': r'HAC FIKHI\s*-3',
        'a_pat': r'CEVAP ANAHTARI',
        'next_pat': r'HAC FIKHI\s*-4',
        'exp_count': 30
    },
    {
        'id': 'ILM_HAC_FIKHI_4',
        'target_id': 'ILM_HAC_FIKHI',
        'ders': 'HAC FIKHI - 4',
        'ana_konu': 'Hac Fıkhı',
        'q_pat': r'HAC FIKHI\s*-4',
        'a_pat': r'CEVAP ANAHTARI',
        'next_pat': r'HAC FIKHI\s*-5',
        'exp_count': 20
    },
    {
        'id': 'ILM_HAC_FIKHI_5',
        'target_id': 'ILM_HAC_FIKHI',
        'ders': 'HAC FIKHI - 5',
        'ana_konu': 'Hac Fıkhı',
        'q_pat': r'HAC FIKHI\s*-5',
        'a_pat': r'Cevap anahtarı',
        'next_pat': r'YEMİN\s*-\s*KURBAN',
        'exp_count': 44
    },
    {
        'id': 'ILM_KURBAN',
        'ders': 'KURBAN VE YEMİN SORULARI',
        'ana_konu': 'Kurban ve Yemin',
        'q_pat': r'YEMİN\s*-\s*KURBAN',
        'a_pat': r'CEVAPLAR',
        'next_pat': r'DENEME SINAVI\s*-1',
        'exp_count': 13
    },
    {
        'id': 'ILM_DENEME',
        'ders': 'GENEL DENEME SINAVI',
        'ana_konu': 'Genel Deneme',
        'q_pat': r'DENEME SINAVI\s*-1',
        'a_pat': r'1\.a\s+2\.c',
        'next_pat': None,
        'exp_count': 60
    }
]

def clean_body_text(body, sec_id, qnum):
    if sec_id == 'ILM_CENAZE' and qnum == 29:
        body = body.replace('b) Hükmî şehidin cenaze namazı kılınır.', 'c) Hükmî şehidin cenaze namazı kılınır.')
        body = body.replace('c) Şâfiî, Mâlikî', 'd) Şâfiî, Mâlikî')
    elif sec_id == 'ILM_ZEKAT_1' and qnum == 59:
        body = body.replace('Ahmed b.hanbel', 'Ahmed bin Hanbel')
    elif sec_id == 'ILM_ZEKAT_1' and qnum == 98:
        body = body.replace('faaliyetleriB)Amiller', 'faaliyetleri B) Amiller')
    elif sec_id == 'ILM_ZEKAT_2' and qnum == 36:
        body = body.replace('S) Fitre', 'D) Fitre')
    elif sec_id == 'ILM_HAC_FIKHI_3' and qnum == 17:
        body = body.replace('tutmakd) Dem', 'tutmak d) Dem')
    elif sec_id == 'ILM_HAC_FIKHI_4' and qnum == 16:
        body = body.replace('Ahmed b. Hanbel', 'Ahmed bin Hanbel')
    elif sec_id == 'ILM_DENEME' and qnum == 2:
        body = body.replace('d Ganimet', 'd) Ganimet')
    elif sec_id == 'ILM_DENEME' and qnum == 23:
        body = body.replace('b Regaib', 'b) Regaib')
    return body

def parse_options(body):
    pattern = r'(?:^|\s)([a-dA-D])\s*[\.\-\)]+\s*'
    matches = list(re.finditer(pattern, body))
    for i in range(len(matches) - 3):
        letters = [m.group(1).upper() for m in matches[i:i+4]]
        if letters == ['A', 'B', 'C', 'D']:
            start_a = matches[i].start()
            if body[start_a].isspace(): start_a += 1
            stem = body[:start_a].strip()
            
            end_a = matches[i].end()
            start_b = matches[i+1].start()
            if body[start_b].isspace(): start_b += 1
            opt_a = body[end_a:matches[i+1].start()].strip()
            
            end_b = matches[i+1].end()
            start_c = matches[i+2].start()
            if body[start_c].isspace(): start_c += 1
            opt_b = body[end_b:matches[i+2].start()].strip()
            
            end_c = matches[i+2].end()
            start_d = matches[i+3].start()
            if body[start_d].isspace(): start_d += 1
            opt_c = body[end_c:matches[i+3].start()].strip()
            
            end_d = matches[i+3].end()
            opt_d = body[end_d:].strip()
            return stem, {'A': opt_a, 'B': opt_b, 'C': opt_c, 'D': opt_d}, end_d
    return None

def extract_pairs(text):
    pairs = re.findall(r'(\d+)[\.\-\s\)]*([A-Da-d])\b', text)
    result = {}
    for num_str, letter in pairs:
        result[int(num_str)] = letter.upper()
    return result

def clean_whitespace(text):
    # Normalize multiple spaces and multiple newlines
    lines = [re.sub(r'[ \t]+', ' ', l).strip() for l in text.split('\n')]
    # Join non-empty lines with a space unless intended paragraph
    return ' '.join(l for l in lines if l).strip()

def determine_subtopic(stem, default_topic):
    s = stem.lower()
    if 'abdest' in s or 'özür' in s: return 'Abdest ve Hükümleri'
    if 'gusül' in s or 'cünüp' in s: return 'Gusül ve Hükümleri'
    if 'teyemmüm' in s or 'mesh' in s or 'mest' in s: return 'Teyemmüm ve Mesh'
    if 'hayız' in s or 'nifas' in s or 'istihaze' in s: return 'Hayız, Nifas ve İstihaze'
    if 'necas' in s or 'taharet' in s or 'hades' in s: return 'Necaset ve Taharet'
    if 'ezan' in s or 'kamet' in s: return 'Ezan ve Kamet'
    if 'cemaat' in s or 'imam' in s or 'saf' in s: return 'Cemaatle Namaz'
    if 'sehiv' in s or 'tilavet' in s or 'şükür' in s: return 'Secdeler (Sehiv, Tilavet)'
    if 'sefer' in s or 'yolcu' in s or 'kasr' in s or 'cem' in s: return 'Seferîlik ve Namaz'
    if 'kaza' in s or 'tertib' in s: return 'Kaza Namazları'
    if 'nafile' in s or 'vitir' in s or 'teravih' in s or 'kuşluk' in s or 'teheccüd' in s: return 'Nafile Namazlar'
    if 'vakit' in s or 'mekruh vakit' in s: return 'Namaz Vakitleri'
    if 'cuma' in s or 'hutbe' in s: return 'Cuma ve Hutbe'
    if 'cenaze' in s or 'şehid' in s or 'kefen' in s or 'tekfin' in s or 'techiz' in s or 'mezar' in s: return 'Cenaze ve Techiz'
    if 'kefaret' in s or 'zıhar' in s or 'fidye' in s or 'ıskat' in s: return 'Keffaret, Fidye ve Iskat'
    if 'imsak' in s or 'iftar' in s or 'niyet' in s: return 'Oruç Şartları ve Niyet'
    if 'nisab' in s or 'havelan' in s or 'havaic' in s: return 'Zekât Şartları ve Nisap'
    if 'öşür' in s or 'toprak' in s or 'mahsul' in s: return 'Toprak Ürünleri (Öşür)'
    if 'koyun' in s or 'sığır' in s or 'deve' in s or 'hayvan' in s or 'saime' in s: return 'Hayvanların Zekâtı'
    if 'fitre' in s or 'fıtır' in s or 'sadaka' in s: return 'Fıtır Sadakası ve Sadaka'
    if 'tavaf' in s or 'şavt' in s or 'remel' in s or 'ıztıba' in s: return 'Tavaf ve Şavtlar'
    if 'ihram' in s or 'mikat' in s or 'telbiye' in s: return 'İhram ve Yasakları'
    if 'vakfe' in s or 'arafat' in s or 'müzdelife' in s: return 'Arafat ve Müzdelife Vakfesi'
    if 'sa’y' in s or 'say' in s or 'safa' in s or 'merve' in s: return 'Sa’y ve Hükümleri'
    if 'şeytan' in s or 'cemre' in s or 'mina' in s: return 'Mina ve Şeytan Taşlama'
    if 'yemin' in s: return 'Yemin Çeşitleri ve Keffareti'
    if 'kurban' in s or 'teşrik' in s or 'hedy' in s or 'dem' in s: return 'Kurban ve Teşrik'
    return f'{default_topic} Esasları'

def main():
    print(f"📖 PDF okunuyor: {PDF_PATH}")
    doc = fitz.open(str(PDF_PATH))
    
    clean_pages = []
    for i in range(1, len(doc)):
        page_lines = doc[i].get_text().split('\n')
        filtered = []
        first_non_empty = True
        for l in page_lines:
            s = l.strip()
            if first_non_empty and s:
                first_non_empty = False
                if s == str(i + 1):
                    continue
            filtered.append(l)
        clean_pages.append('\n'.join(filtered))

    clean_text = '\n'.join(clean_pages)
    
    pos = 0
    all_questions_by_target = {}
    master_questions = []
    global_id = 60001
    
    for sec in SECTIONS_CONFIG:
        sec_id = sec['id']
        target_id = sec.get('target_id', sec_id)
        ders = sec['ders']
        ana_konu = sec['ana_konu']
        exp_count = sec['exp_count']
        
        m_q = re.search(sec['q_pat'], clean_text[pos:], re.IGNORECASE)
        assert m_q, f"Başlangıç bulunamadı: {sec['q_pat']}"
        s_idx = pos + m_q.start()
        
        m_a = re.search(sec['a_pat'], clean_text[s_idx:])
        assert m_a, f"Cevap anahtarı bulunamadı: {sec['a_pat']}"
        a_idx = s_idx + m_a.start()
        
        if sec['next_pat']:
            m_n = re.search(sec['next_pat'], clean_text[a_idx:])
            assert m_n, f"Sonraki bölüm bulunamadı: {sec['next_pat']}"
            n_idx = a_idx + m_n.start()
        else:
            n_idx = len(clean_text)
            
        q_slice = clean_text[s_idx:a_idx]
        a_slice = clean_text[a_idx:n_idx]
        ans_map = extract_pairs(a_slice)
        if sec_id == 'ILM_ORUC' and 25 not in ans_map:
            ans_map[25] = 'B'
            
        search_pos = 0
        cur_q = 1
        sec_count = 0
        
        while cur_q <= exp_count:
            found = False
            for probe_q in range(cur_q, min(cur_q + 10, exp_count + 1)):
                pat = rf'(?:^|\n)\s*{probe_q}(?:[^\w\d\s]|\s|(?=[A-Za-zĞÜŞİÖÇğüşıöç]))\s*'
                m = re.search(pat, q_slice[search_pos:])
                if m:
                    post = q_slice[search_pos + m.end(): search_pos + m.end() + 10]
                    if probe_q == 3 and 'günü' in post:
                        continue
                    header_end = search_pos + m.end()
                    candidate_body = clean_body_text(q_slice[header_end:], sec_id, probe_q)
                    res = parse_options(candidate_body)
                    if res:
                        stem, opts, end_d_rel = res
                        abs_end_d = header_end + end_d_rel
                        
                        next_start = len(q_slice)
                        for next_probe in range(probe_q + 1, min(probe_q + 11, exp_count + 1)):
                            next_pat_str = rf'(?:^|\n)\s*{next_probe}(?:[^\w\d\s]|\s|(?=[A-Za-zĞÜŞİÖÇğüşıöç]))\s*'
                            m_next = re.search(next_pat_str, q_slice[abs_end_d:])
                            if m_next:
                                post_next = q_slice[abs_end_d + m_next.end(): abs_end_d + m_next.end() + 10]
                                if next_probe == 3 and 'günü' in post_next:
                                    continue
                                next_start = abs_end_d + m_next.start()
                                break
                                
                        full_opt_d = q_slice[abs_end_d:next_start].strip()
                        if full_opt_d:
                            opts['D'] = full_opt_d
                            
                        ans = ans_map.get(probe_q)
                        stem_clean = clean_whitespace(stem)
                        opts_clean = {k: clean_whitespace(v) for k, v in opts.items()}
                        alt_konu = determine_subtopic(stem_clean, ana_konu)
                        
                        q_obj = {
                            'id': global_id,
                            'ders': ders,
                            'soru_no': probe_q,
                            'soru': stem_clean,
                            'secenekler': opts_clean,
                            'dogru_cevap': ans,
                            'ana_konu': ana_konu,
                            'alt_konu': alt_konu,
                            'yil': '2024',
                            'donem': '1',
                            'sinav_adi': 'İlmihal Çalışma Soruları',
                            'kredi': 2,
                            'puan': 1,
                            'sekilli': False
                        }
                        
                        all_questions_by_target.setdefault(target_id, []).append(q_obj)
                        master_questions.append(q_obj)
                        
                        global_id += 1
                        sec_count += 1
                        search_pos = next_start
                        cur_q = probe_q + 1
                        found = True
                        break
            if not found:
                break
                
        print(f"  ✓ {sec_id:15} -> {target_id:15}: {sec_count} soru ayrıştırıldı.")
        pos = n_idx

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Hedef dosyalara yaz
    for target_id, q_list in all_questions_by_target.items():
        out_file = OUTPUT_DIR / f'{target_id}.json'
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(q_list, f, ensure_ascii=False, indent=2)
        print(f"💾 Kaydedildi: {out_file.name} ({len(q_list)} soru)")

if __name__ == '__main__':
    main()
