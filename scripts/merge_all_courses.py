#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
merge_all_courses.py
Tüm Zorunlu Ortak Kültür Derslerini (12 Branş, 56 Kademe, 4.716 Soru)
ciktilar/analiz/tum_analizli_sorular_temiz.json içinde birleştirir ve tam doğrulama yapar.
"""

import json
from collections import Counter

def main():
    print("=" * 60)
    print("🌟 MEB ZORUNLU ORTAK KÜLTÜR DERSLERİ GENEL BİRLEŞTİRME")
    print("=" * 60)

    # 1. Mevcut 8 branşın sorularını al
    with open('ciktilar/analiz/tum_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        existing = json.load(f)

    # Temizle: İnkılap, Sağlık, Din, İngilizce varsa çıkar (zaten daha önce eklenmemişti ama idempotent olsun)
    base_questions = [
        q for q in existing
        if not any(k in q['ders'].upper() for k in ['İNKILAP', 'INKILAP', 'SAĞLIK', 'SAGLIK', 'DİN KÜLTÜRÜ', 'DIN KULTURU', 'İNGİLİZCE', 'INGILIZCE'])
    ]
    print(f"Mevcut 8 temel branş soru sayısı: {len(base_questions)}")

    # 2. Yeni 4 branşı yükle
    with open('ciktilar/analiz/inkilap_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        ink_questions = json.load(f)
    print(f"Eklenen İnkılap Tarihi: {len(ink_questions)}")

    with open('ciktilar/analiz/saglik_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        sag_questions = json.load(f)
    print(f"Eklenen Sağlık ve Trafik: {len(sag_questions)}")

    with open('ciktilar/analiz/din_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        din_questions = json.load(f)
    print(f"Eklenen Din Kültürü: {len(din_questions)}")

    with open('ciktilar/analiz/ingilizce_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        ing_questions = json.load(f)
    print(f"Eklenen İngilizce: {len(ing_questions)}")

    all_questions = base_questions + ink_questions + sag_questions + din_questions + ing_questions

    # ID'ye göre sırala
    all_questions.sort(key=lambda x: x['id'])

    # 3. KAPSAMLI VERİ DOĞRULAMA (0 Hata Garantisi)
    errors = []
    course_counts = Counter()
    subject_counts = Counter()

    for idx, q in enumerate(all_questions):
        qid = q.get('id')
        ders = q.get('ders', '')
        soru = q.get('soru_temiz', '')
        opts = q.get('secenekler_temiz', {})
        ans = q.get('dogru_cevap', '')
        ak = q.get('ana_konu', '')
        sub = q.get('alt_konu', '')

        course_counts[ders] += 1

        # Branş grubu
        if 'TÜRK DİLİ' in ders: subject_counts['Türk Dili ve Edebiyatı'] += 1
        elif 'TARİH' in ders and 'İNKILAP' not in ders: subject_counts['Tarih'] += 1
        elif 'İNKILAP' in ders: subject_counts['T.C. İnkılap Tarihi'] += 1
        elif 'COĞRAFYA' in ders: subject_counts['Coğrafya'] += 1
        elif 'MATEMATİK' in ders: subject_counts['Matematik'] += 1
        elif 'FİZİK' in ders: subject_counts['Fizik'] += 1
        elif 'KİMYA' in ders: subject_counts['Kimya'] += 1
        elif 'BİYOLOJİ' in ders: subject_counts['Biyoloji'] += 1
        elif 'FELSEFE' in ders: subject_counts['Felsefe'] += 1
        elif 'DİN KÜLTÜRÜ' in ders: subject_counts['Din Kültürü ve Ahlak Bilgisi'] += 1
        elif 'SAĞLIK' in ders: subject_counts['Sağlık Bilgisi ve Trafik Kültürü'] += 1
        elif 'İNGİLİZCE' in ders: subject_counts['İngilizce'] += 1
        else: subject_counts[ders] += 1

        if not soru or len(soru) < 5:
            errors.append(f"Soru metni çok kısa veya boş: ID {qid}")
        if ans not in ['A', 'B', 'C', 'D']:
            errors.append(f"Geçersiz doğru cevap '{ans}': ID {qid}")
        for opt_key in ['A', 'B', 'C', 'D']:
            if not opts.get(opt_key):
                errors.append(f"Eksik/boş şık {opt_key}: ID {qid}")
        if not ak or not sub or ak.strip() == 'Genel' or sub.strip() == 'Genel':
            errors.append(f"Geçersiz/Genel konu ataması: ID {qid} ({ak} -> {sub})")

    if errors:
        print(f"❌ {len(errors)} ADET HATA BULUNDU:")
        for e in errors[:20]:
            print("  ", e)
        raise SystemExit(1)

    print("\n✅ TÜM SORULAR İÇİN %100 DOĞRULAMA GEÇTİ (0 HATA).")
    print(f"Toplam Soru Sayısı: {len(all_questions)}")
    print(f"Toplam Kademe Sayısı: {len(course_counts)}")
    print(f"Toplam Branş Sayısı: {len(subject_counts)}")
    print("\nBranş Dağılımı:")
    for subj, cnt in sorted(subject_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  ► {subj:35s}: {cnt} soru")

    # Dosyaya kaydet
    out_file = 'ciktilar/analiz/tum_analizli_sorular_temiz.json'
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)

    print(f"\n🚀 {out_file} başarıyla güncellendi!")

if __name__ == '__main__':
    main()
