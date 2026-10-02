#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analizli sorulardan data/subjects ve src/data/generated verilerini üretir.
Arayüzün kaynak dosyalarını değiştirmez.
"""

import json
import re
from pathlib import Path

def main():
    print("=" * 60)
    print("💎 AÖL DİJİTAL SINAV KİTAPÇIĞI DERLEYİCİSİ (SÜRÜM 3.4 - KREDİ & PUAN MOTORU)")
    print("=" * 60)

    with open('ciktilar/analiz/tum_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)

    # Resmî MEB AÖL Ders Kredileri Tablosu
    COURSE_CREDITS = {
        'MATEMATİK': 6,
        'TÜRK DİLİ': 5,
        'EDEBİYAT': 5,
        'İNGİLİZCE': 4,
        'SAĞLIK': 1,
        'TARİH': 2,
        'İNKILAP': 2,
        'COĞRAFYA': 2,
        'FELSEFE': 2,
        'FİZİK': 2,
        'KİMYA': 2,
        'BİYOLOJİ': 2,
        'DİN KÜLTÜRÜ': 2
    }

    def get_course_credit(course_name):
        for key, cred in COURSE_CREDITS.items():
            if key in course_name:
                return cred
        return 2

    def is_visual_question(q):
        stem = q.get('soru_temiz', '') or q.get('soru', '')
        
        visual_patterns = [
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
            r'\bboyalı\s+(?:alan|bölge)\b',
            r'\bdevre\s+şeması\b',
        ]

        exclude_patterns = [
            r'\bgeometrik\s+şekle\b',
            r'\bne\s+şekilde\b',
            r'\b(?:bu|o|şu|iyi|doğru|sağlıklı|hızlı|bilinçli|olacak|düzenli|farklı|aynı|belirli\s+bir|bir)\s+şekilde\b',
            r'Vinland\s+Haritası',
        ]

        cleaned_stem = stem
        for exp in exclude_patterns:
            cleaned_stem = re.sub(exp, '', cleaned_stem, flags=re.IGNORECASE)

        for pat in visual_patterns:
            if re.search(pat, cleaned_stem, re.IGNORECASE):
                return True
        return False

    try:
        from scripts.topic_hints_data import get_hint_for_question
    except ModuleNotFoundError:
        from topic_hints_data import get_hint_for_question


    try:
        from scripts.meb_traps_data import MEB_TRAPS_DICT
    except (ImportError, ModuleNotFoundError):
        from meb_traps_data import MEB_TRAPS_DICT

    try:
        from scripts.meb_vocab_data import MEB_VOCAB_DICT
    except (ImportError, ModuleNotFoundError):
        from meb_vocab_data import MEB_VOCAB_DICT

    # Bir sınav oturumundaki soru sayısını dinamik tespit et: (yil, donem, ders) -> soru adedi
    exam_counts = {}
    for q in questions:
        key = (q['yil'], str(q['donem']), q['ders'])
        exam_counts[key] = exam_counts.get(key, 0) + 1

    existing_extra_fields = {}
    ing_json_file = Path('data/subjects/ING.json')
    if ing_json_file.exists():
        try:
            with open(ing_json_file, 'r', encoding='utf-8') as f_ing:
                for item in json.load(f_ing):
                    existing_extra_fields[item['id']] = {
                        k: item[k] for k in ['soru', 'soru_tr', 'soru_ar', 'soru_xray'] if k in item
                    }
        except Exception as e:
            print("Warning reading existing ING.json:", e)

    cleaned_list = []
    for q in questions:
        key = (q['yil'], str(q['donem']), q['ders'])
        sinav_soru_sayisi = exam_counts.get(key, 10)
        kredi = get_course_credit(q['ders'])
        # Formül: kendi dersinin kredisi / o dersten bir sınavda çıkan toplam soru adedi
        puan = round(kredi / sinav_soru_sayisi, 2)
        ipucu = get_hint_for_question(q)
        sekilli = is_visual_question(q)

        q_dict = {
            'id': q['id'],
            'ders': q['ders'],
            'ders_kodu': q.get('ders_kodu', ''),
            'yil': q['yil'],
            'donem': str(q['donem']),
            'soru_no': q['soru_no'],
            'soru': q['soru_temiz'],
            'secenekler': q['secenekler_temiz'],
            'dogru_cevap': q['dogru_cevap'],
            'ana_konu': q.get('ana_konu', 'Genel'),
            'alt_konu': q.get('alt_konu', 'Genel'),
            'kredi': kredi,
            'sinav_soru_sayisi': sinav_soru_sayisi,
            'puan': puan,
            'ipucu': ipucu,
            'sekilli': sekilli
        }
        if q['id'] in existing_extra_fields:
            q_dict.update(existing_extra_fields[q['id']])
        cleaned_list.append(q_dict)

    # Tüm veriyi tek bir HTML dosyasına gömmek sınıf ağlarında uzun bağlantının
    # kesilmesine yol açabiliyor. Soruları branş bazında küçük, önbelleklenebilir
    # JSON dosyalarına ayırıyoruz; uygulama yalnızca ihtiyaç duyduğu branşı çeker.
    def subject_id_for_course(course_name):
        if 'COĞRAFYA' in course_name: return 'COG'
        if 'TÜRK DİLİ' in course_name or 'EDEBİYAT' in course_name: return 'TDE'
        if 'MATEMATİK' in course_name: return 'MAT'
        if 'İNKILAP' in course_name: return 'INK'
        if 'TARİH' in course_name: return 'TAR'
        if 'KİMYA' in course_name: return 'KIM'
        if 'FİZİK' in course_name: return 'FIZ'
        if 'BİYOLOJİ' in course_name: return 'BIO'
        if 'FELSEFE' in course_name: return 'FEL'
        if 'DİN KÜLTÜRÜ' in course_name: return 'DIN'
        if 'SAĞLIK' in course_name: return 'SAG'
        if 'İNGİLİZCE' in course_name: return 'ING'
        raise ValueError(f'Bilinmeyen ders: {course_name}')

    data_by_subject = {}
    for question in cleaned_list:
        subject_id = subject_id_for_course(question['ders'])
        data_by_subject.setdefault(subject_id, []).append(question)

    data_dir = Path('data/subjects')
    data_dir.mkdir(parents=True, exist_ok=True)
    subject_manifest = {}
    for subject_id, subject_questions in data_by_subject.items():
        with open(data_dir / f'{subject_id}.json', 'w', encoding='utf-8') as f:
            json.dump(subject_questions, f, ensure_ascii=False, separators=(',', ':'))
        subject_manifest[subject_id] = {
            'questionCount': len(subject_questions),
            'courseCount': len({q['ders'] for q in subject_questions})
        }

    # Arayüz kaynaklarına dokunma: yalnızca üretilen verileri güncelle.
    generated_dir = Path('src/data/generated')
    generated_dir.mkdir(parents=True, exist_ok=True)
    for name, value in {
        'subjectManifest': subject_manifest,
        'MEB_TRAPS_DICT': MEB_TRAPS_DICT,
        'MEB_VOCAB_DICT': MEB_VOCAB_DICT,
    }.items():
        (generated_dir / f'{name}.json').write_text(
            json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
        )
    print(f"✅ {len(cleaned_list)} soru, {len(subject_manifest)} ders grubu güncellendi.")

if __name__ == '__main__':
    import os
    os.chdir(Path(__file__).resolve().parents[1])
    main()
