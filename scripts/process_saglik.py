#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_saglik.py
SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ (1 ve 2) Zorunlu Ortak Kültür Dersi Analiz ve Temizleme Scripti
- Kapsam: SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ – 1 (Kod: 221) ve 2 (Kod: 222) (164 soru)
- OCR kaynaklı boş şıklar (trafik işaretleri, ilk yardım pozisyonları vb.) MEB kaynaklarına göre metinsel açıklamayla onarılır.
- Kesişim kümeleri taranır ve raporlanır.
"""

import json
import re
from collections import defaultdict, Counter

# Repaired options dictionary for 8 visual questions
REPAIRED_OPTIONS = {
    1680: {
        'A': 'Kesikli yol çizgisi',
        'B': 'Yan yana iki çizgi (biri devamlı, biri kesikli yol çizgisi)',
        'C': 'İki devamlı (düz) yol çizgisi',
        'D': 'Tek devamlı (düz) yol çizgisi'
    },
    1681: {
        'A': 'Hız sınırlaması sonu levhası',
        'B': 'Sollama yasağı sonu levhası',
        'C': 'Bütün yasaklama ve kısıtlamaların sonu levhası',
        'D': 'Girişi olmayan yol levhası'
    },
    2233: {
        'A': 'Şok pozisyonu (Sırtüstü ayaklar 30 cm havada)',
        'B': 'Yarı oturur veya oturuş pozisyonu',
        'C': 'Koma pozisyonu (Yan yatış)',
        'D': 'Yüzüstü yatış pozisyonu'
    },
    4564: {
        'A': 'Yan yana iki devamlı (düz) yol çizgisi',
        'B': 'Kesikli yol çizgisi',
        'C': 'Kesikli ve devamlı yol çizgisi',
        'D': 'Ayrılma ve katılma yön okları'
    },
    6446: {
        'A': 'Koma pozisyonu',
        'B': 'Oturur pozisyon',
        'C': 'Yüzüstü yatış pozisyonu',
        'D': 'Şok pozisyonu (Sırtüstü ayaklar 30 cm yukarı kaldırılır)'
    },
    7320: {
        'A': 'Yaya geçidi levhası',
        'B': 'Kasisli / kaygan yol levhası',
        'C': 'Işıklı trafik işaret cihazı',
        'D': 'Kontrollü demiryolu geçidi'
    },
    8680: {
        'A': 'Gevşek şev levhası (Yamaçtan taş düşebileceğini bildiren üçgen levha)',
        'B': 'Kasisli yol levhası',
        'C': 'Gevşek malzemeli zemin levhası',
        'D': 'Kaygan yol levhası'
    },
    9186: {
        'A': 'Yaralıyı koma pozisyonuna getirmek',
        'B': 'Yaralının ayaklarını 30 cm yukarı kaldırmak',
        'C': 'Yaralıya hemen su veya içecek vermek',
        'D': 'Baş-çene pozisyonu ile hava yolunu açıp solunumu kontrol etmek'
    }
}

def clean_saglik_text(text):
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'[ \t]+', ' ', t)
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    cleaned = '\n'.join(lines)
    return cleaned

def clean_saglik_options(qid, secenekler):
    if qid in REPAIRED_OPTIONS:
        return REPAIRED_OPTIONS[qid]

    cleaned = {}
    for k in ['A', 'B', 'C', 'D']:
        val = secenekler.get(k, '')
        if isinstance(val, str):
            v = val.strip()
            v = re.sub(r'\s+', ' ', v)
            cleaned[k] = v
        else:
            cleaned[k] = str(val)
    return cleaned

def classify_saglik(soru_text, secenekler, ders_kodu):
    full = soru_text + " " + " ".join(secenekler.values())
    t = full.lower()

    # -------------------------------------------------------------
    # SAĞLIK VE İLK YARDIM (221 Odaklı)
    # -------------------------------------------------------------
    if any(k in t for k in ['ilk yardım', 'hasta/yaralı', 'kalp masajı', 'yapay solunum', 'suni solunum', 'turnike', 'kanama', 'şok pozisyonu', 'koma pozisyonu', 'heimlich', 'tam tıkanma', 'kısmi tıkanma', 'kırık', 'çıkık', 'burkulma', 'solunum yolu', 'zehirlenme', '112 acil', 'temel yaşam desteği', 'hava yolu açıklığı', 'rentck']):
        return ("İlk Yardım ve Acil Müdahale", "Temel İlk Yardım ve Acil Müdahale Uygulamaları (Yaşam Desteği, Kanamalar, Şok)")

    if any(k in t for k in ['koruyucu sağlık', 'hastane', 'hasta odası', 'bulaşıcı hastalık', 'kanatlı hayvan', 'aşı', 'bağışıklık', 'mikroorganizma', 'sağlık ocağı', 'aile hekimi', 'sağlık hizmet']):
        return ("Kişisel ve Toplumsal Sağlık", "Sağlık Hizmetleri, Koruyucu Sağlık ve Bulaşıcı Hastalıklardan Korunma")

    if any(k in t for k in ['beden kitle indeksi', 'obezite', 'fiziksel aktivite', 'beslenme', 'akran zorbalığı', 'zorba', 'alo 183', 'madde bağımlılığı', 'teknoloji bağımlılığı', 'sigara', 'alkol', 'uyku', 'hijyen', 'ergenlik', 'ruh sağlığı']):
        return ("Sağlıklı Hayat ve Yaşam Becerileri", "Beslenme, Fiziksel Aktivite, Bağımlılıkla Mücadele ve Ruh Sağlığı")

    # -------------------------------------------------------------
    # TRAFİK KÜLTÜRÜ (222 Odaklı)
    # -------------------------------------------------------------
    if any(k in t for k in ['yol çizgisi', 'yol çizgileri', 'işaret levha', 'trafik işareti', 'tehlike uyarı', 'tanzim', 'yasaklama ve kısıtlama', 'gevşek şev', 'yol işaretleme', 'ışıklı trafik']):
        return ("Trafik İşaretleri ve Yol Düzeni", "Trafik Levhaları, Yol Çizgileri ve Işıklı İşaretler")

    if any(k in t for k in ['kavşak', 'geçme', 'sollama', 'takip mesafesi', 'hız sınırı', 'hız limit', 'geçiş üstünlüğü', 'şerit izleme', 'bölünmüş yol', 'park etme', 'duraklama', 'dönüş kural']):
        return ("Trafik Kuralları ve Güvenli Sürüş", "Geçiş Üstünlüğü, Takip Mesafesi, Sollama ve Hız Kuralları")

    if any(k in t for k in ['trafik adabı', 'iletişim kural', 'saygı', 'empati', 'sabır', 'öfke', 'sürücü davranış', 'kural ihlali']):
        return ("Trafik Adabı ve İnsan İlişkileri", "Trafikte Nezaket, Empati, Sabır ve Sürücü Davranışları")

    if any(k in t for k in ['kış lastiği', 'zincir', 'antifriz', 'emniyet kemeri', 'muayene', 'çalışma ve dinlenme', 'kesintisiz 4,5 saat', 'yaş sınırı', 'çevre kirliliği', 'yakıt tasarrufu']):
        return ("Araç Donanımı ve Çevre Güvenliği", "Araç Güvenlik Donanımları, Sürüş Süreleri ve Çevre Bilinci")

    # Fallback
    if ders_kodu == 221:
        return ("Kişisel ve Toplumsal Sağlık", "Sağlık Hizmetleri, Koruyucu Sağlık ve Bulaşıcı Hastalıklardan Korunma")
    else:
        return ("Trafik Kuralları ve Güvenli Sürüş", "Geçiş Üstünlüğü, Takip Mesafesi, Sollama ve Hız Kuralları")

def main():
    print("=" * 60)
    print("🚑 SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ İŞLEME VE ANALİZ MOTORU")
    print("=" * 60)

    with open('scripts/ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
        all_raw = json.load(f)

    sag_raw = [q for q in all_raw if q.get('ders_kodu') in (221, 222)]
    print(f"Toplam seçilen Sağlık/Trafik sorusu: {len(sag_raw)}")

    processed_questions = []
    course_counts = Counter()

    for q in sag_raw:
        qid = q['id']
        dk = q.get('ders_kodu')
        ders_std = "SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ – 1" if dk == 221 else "SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ – 2"
        yil = q['yil']
        donem = q['donem']
        soru_no = q['soru_no']
        dogru_cevap = q['dogru_cevap'].strip().upper()

        course_counts[ders_std] += 1

        soru_temiz = clean_saglik_text(q.get('soru', ''))
        secenekler_temiz = clean_saglik_options(qid, q.get('secenekler', {}))

        ana_konu, alt_konu = classify_saglik(soru_temiz, secenekler_temiz, dk)

        processed_questions.append({
            'id': qid,
            'ders': ders_std,
            'ders_kodu': dk,
            'yil': yil,
            'donem': str(donem),
            'soru_no': soru_no,
            'soru_temiz': soru_temiz,
            'secenekler_temiz': secenekler_temiz,
            'dogru_cevap': dogru_cevap,
            'ana_konu': ana_konu,
            'alt_konu': alt_konu
        })

    print(f"Kademe Dağılımı: {dict(course_counts)}")

    # Kaydet
    out_path = 'scripts/ciktilar/analiz/saglik_analizli_sorular_temiz.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(processed_questions, f, ensure_ascii=False, indent=2)
    print(f"✅ {out_path} dosyasına {len(processed_questions)} temiz soru yazıldı.")

    # Kesişim Analizi
    topic_map = {}
    for q in processed_questions:
        sub = q['alt_konu']
        ak = q['ana_konu']
        if sub not in topic_map:
            topic_map[sub] = {
                'ana_konu': ak,
                'count': 0,
                'courses': Counter()
            }
        topic_map[sub]['count'] += 1
        topic_map[sub]['courses'][q['ders']] += 1

    intersections = [t for t in topic_map.values() if len(t['courses']) > 1]
    intersections.sort(key=lambda x: x['count'], reverse=True)

    print("\n" + "=" * 60)
    print(f"🎯 SAĞLIK / TRAFİK KADEMELERİ ARASI KESİŞİM KÜMELERİ ({len(intersections)} Kesişen Alt Konu)")
    print("=" * 60)

    for idx, item in enumerate(intersections, 1):
        c_details = ", ".join([f"{c.replace('SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ – ', 'SAĞ-')}: {cnt}" for c, cnt in sorted(item['courses'].items())])
        sub_name = [k for k, v in topic_map.items() if v == item][0]
        print(f"{idx}. ÜNİTE: {item['ana_konu']}")
        print(f"   ► Alt Konu: {sub_name}")
        print(f"   ► Toplam: {item['count']} soru | Dağılım: [{c_details}]")
        print()

if __name__ == '__main__':
    main()
