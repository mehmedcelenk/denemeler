#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_biyoloji.py
BİYOLOJİ (Biyoloji 1 - 4) Zorunlu Ortak Dersleri Analiz ve Temizleme Scripti
- Kapsam: BİYOLOJİ – 1, BİYOLOJİ – 2, BİYOLOJİ – 3, BİYOLOJİ – 4 (328 soru)
- Seçmeli dersler dahil edilmez (yalnızca zorunlu ortak kültür dersleri).
- MEB Biyoloji Dersi Öğretim Programı ünite ve kazanım hiyerarşisi uygulanır.
- Kesişim kümeleri taranır ve raporlanır.
"""

import json
import re
from collections import defaultdict, Counter

# Tamir edilecek soru sözlüğü (OCR tablosundan / görselinden dolayı seçenekleri eksik kalmış sorular)
BIYOLOJI_REPAIRS = {
    6030: {
        'soru_temiz': "Aşağıdakilerden hangisi 2n = 4 kromozomlu bir hücrenin mayoz bölünmesindeki Metafaz II evresini gösterir?",
        'secenekler_temiz': {
            'A': '4 kromozomun ekvatoral düzlemde yan yana dizilmesi (Mitoz Metafaz)',
            'B': '2 tetratın (homolog kromozom çiftlerinin) ekvatoral düzlemde dizilmesi (Metafaz I)',
            'C': 'n = 2 kromozomun (iki kromatitli) hücrenin ekvatoral düzleminde tek sıra dizilmesi (Metafaz II)',
            'D': 'Kardeş kromatitlerin zıt kutuplara çekilmesi (Anafaz II)'
        }
    }
}

def clean_biyo_text(text):
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'[ \t]+', ' ', t)
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    cleaned = '\n'.join(lines)
    return cleaned

def clean_biyo_options(secenekler):
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

def classify_biyoloji(soru_text, secenekler, ders):
    """
    MEB Biyoloji müfredatına göre ana_konu ve alt_konu atar.
    """
    full_text = soru_text + " " + " ".join(secenekler.values())
    t = full_text.lower()
    
    # -------------------------------------------------------------
    # 1. YAŞAM BİLİMİ BİYOLOJİ & CANLILARIN ORTAK ÖZELLİKLERİ
    # -------------------------------------------------------------
    if any(k in t for k in ['tüm canlılarda ortak', 'canlıların ortak özelliği', 'hücresel yapı', 'uyarılara tepki', 'homeostazi', 'iç denge', 'adaptasyon', 'boşaltım', 'anabolizma', 'katabolizma', 'metabolizma']):
        return ("Yaşam Bilimi Biyoloji", "Canlıların Ortak Özellikleri (Hücresel Yapı, Beslenme, Homeostazi)")

    # -------------------------------------------------------------
    # 2. TEMEL BİLEŞİKLER (İNORGANİK & ORGANİK)
    # -------------------------------------------------------------
    if any(k in t for k in ['inorganik', 'su molekülü', 'özgül ısı', 'mineraller', 'kalsiyum', 'demir minerali', 'iyot', 'asitler ve bazlar']):
        return ("Yaşam Bilimi Biyoloji", "İnorganik Bileşikler (Su ve Mineraller)")

    if any(k in t for k in ['karbonhidrat', 'monosakkarit', 'disakkarit', 'polisakkarit', 'glikoz', 'fruktoz', 'galaktoz', 'maltoz', 'sükroz', 'laktoz', 'nişasta', 'glikojen', 'selüloz', 'kitin', 'glikozit bağı']):
        return ("Yaşam Bilimi Biyoloji", "Organik Bileşikler: Karbonhidratlar (Monosakkarit, Disakkarit, Polisakkarit)")

    if any(k in t for k in ['lipit', 'yağ asidi', 'gliserol', 'trigliserit', 'nötr yağ', 'fosfolipit', 'steroit', 'kolesterol', 'ester bağı']):
        return ("Yaşam Bilimi Biyoloji", "Organik Bileşikler: Lipitler (Trigliserit, Fosfolipit, Steroit)")

    if any(k in t for k in ['protein', 'aminoasit', 'amino asit', 'peptit bağı', 'denatürasyon', 'primer yapı', 'albümin', 'hemoglobin']):
        if 'enzim' not in t:
            return ("Yaşam Bilimi Biyoloji", "Organik Bileşikler: Proteinler ve Yapı Taşları")

    if any(k in t for k in ['enzim', 'substrat', 'apoenzim', 'koenzim', 'kofaktör', 'aktif merkez', 'aktivasyon enerjisi', 'inhibitör', 'aktivatör', 'denatüre']):
        return ("Yaşam Bilimi Biyoloji", "Organik Bileşikler: Enzimler ve Enzimatik Reaksiyonlar")

    if any(k in t for k in ['nükleik asit', 'nükleotid', 'dna', 'rna', 'deoksiriboz', 'riboz', 'adenin', 'timin', 'guanin', 'sitozin', 'urasil', 'çift sarmal', 'atp', 'fosforilasyon']):
        if 'kalıtım' not in t and 'çaprazlama' not in t and 'soyağacı' not in t:
            return ("Yaşam Bilimi Biyoloji", "Nükleik Asitler (DNA, RNA) ve ATP")

    if any(k in t for k in ['vitamin', 'a vitamini', 'b vitamini', 'c vitamini', 'd vitamini', 'e vitamini', 'k vitamini', 'yağda çözünen', 'suda çözünen', 'skorbüt', 'raşitizm', 'gece körlüğü', 'hormon']):
        return ("Yaşam Bilimi Biyoloji", "Vitaminler ve Hormonlar")

    # -------------------------------------------------------------
    # 3. HÜCRE VE ORGANELLER
    # -------------------------------------------------------------
    if any(k in t for k in ['prokaryot', 'ökaryot', 'çekirdek zarı', 'halka biçimli dna', 'hücre teorisi']):
        return ("Hücre", "Hücre Teorisi, Prokaryot ve Ökaryot Hücre Yapısı")

    if any(k in t for k in ['hücre zarı', 'akıcı mozaik zar', 'difüzyon', 'kolaylaştırılmış difüzyon', 'osmoz', 'turgor', 'plazmoliz', 'deplazmoliz', 'aktif taşıma', 'endositoz', 'fagositoz', 'pinositoz', 'ekzositoz']):
        return ("Hücre", "Hücre Zarı ve Madde Geçişleri (Difüzyon, Osmoz, Aktif Taşıma)")

    if any(k in t for k in ['organel', 'ribozom', 'endoplazmik retikulum', 'golgi', 'lizozom', 'mitokondri', 'kloroplast', 'plastit', 'koful', 'sentrozom', 'peroksizom', 'hücre iskeleti', 'kristas']):
        return ("Hücre", "Sitoplazma ve Organeller (Mitokondri, Kloroplast, Ribozom)")

    if any(k in t for k in ['çekirdek', 'nükleus', 'çekirdekçik', 'kromatin iplik', 'çekirdek poru']):
        return ("Hücre", "Hücre Çekirdeği ve Yapısı")

    # -------------------------------------------------------------
    # 4. CANLILAR DÜNYASI VE SINIFLANDIRMA
    # -------------------------------------------------------------
    if any(k in t for k in ['sınıflandırma', 'ikili adlandırma', 'binomial', 'tür', 'cins', 'familya', 'takım', 'sınıf', 'şube', 'alem', 'filogenetik', 'homolog organ', 'analog organ']):
        return ("Canlılar Dünyası", "Canlıların Çeşitliliği ve Sınıflandırılması (Taksonomi)")

    if any(k in t for k in ['bakteri', 'arke', 'peptidoglikan', 'arkebakteri', 'metanojen', 'halofil', 'termofil', 'konjugasyon', 'endospor']):
        return ("Canlılar Dünyası", "Canlı Alemleri: Bakteriler ve Arkeler")

    if any(k in t for k in ['protista', 'amip', 'öglena', 'paramesyum', 'algler', 'cıvık mantar', 'mantarlar alemi', 'fungi', 'maya', 'küf mantarı', 'şapkalı mantar', 'hif', 'miselyum']):
        return ("Canlılar Dünyası", "Canlı Alemleri: Protistler ve Mantarlar")

    if any(k in t for k in ['bitkiler alemi', 'damarsız tohumsuz', 'damarlı tohumsuz', 'açık tohumlu', 'kapalı tohumlu', 'klorofil', 'çiçekli bitki', 'otsu', 'odunsu']):
        return ("Canlılar Dünyası", "Canlı Alemleri: Bitkiler")

    if any(k in t for k in ['hayvanlar alemi', 'omurgasız', 'omurgalı', 'süngerler', 'sölenterler', 'solucanlar', 'yumuşakçalar', 'eklem bacaklılar', 'derisi dikenliler', 'balıklar', 'iki yaşamlılar', 'kurbağa', 'sürüngenler', 'kuşlar', 'memeliler']):
        return ("Canlılar Dünyası", "Canlı Alemleri: Hayvanlar (Omurgasız ve Omurgalılar)")

    if any(k in t for k in ['virüs', 'kapsit', 'bakteriyofaj', 'kapsid', 'konak hücre', 'dna virüsü', 'rna virüsü', 'antibiyotik etkisiz']):
        return ("Canlılar Dünyası", "Virüsler ve Sağlığımız")

    # -------------------------------------------------------------
    # 5. HÜCRE BÖLÜNMELERİ
    # -------------------------------------------------------------
    if any(k in t for k in ['eşeysiz üreme', 'bölünerek üreme', 'tomurcuklanma', 'sporla üreme', 'rejenerasyon', 'vejetatif üreme', 'çelikle', 'doku kültürü']):
        return ("Hücre Bölünmeleri", "Eşeysiz Üreme Çeşitleri (Rejenerasyon, Vejetatif, Tomurcuklanma)")

    if any(k in t for k in ['mitoz', 'interfaz', 'karyokinez', 'profaz', 'metafaz', 'anafaz', 'telofaz', 'sitokinez', 'iğ iplikleri', 'kardeş kromatit', 'hücre döngüsü']):
        if 'mayoz' not in t and 'krossing' not in t and 'tetrat' not in t:
            return ("Hücre Bölünmeleri", "Mitoz Bölünme ve Hücre Döngüsü Evreleri")

    if any(k in t for k in ['mayoz', 'krossing-over', 'krossing over', 'tetrat', 'sinapsis', 'homolog kromozom', 'mayoz i', 'mayoz ii', 'gamet', 'eşeyli üreme', 'sperm', 'yumurta', 'döllenme']):
        return ("Hücre Bölünmeleri", "Mayoz Bölünme ve Eşeyli Üreme (Mayoz I, Mayoz II, Krossing-over)")

    # -------------------------------------------------------------
    # 6. KALITIMIN GENEL ESASLARI
    # -------------------------------------------------------------
    if any(k in t for k in ['mendel', 'genotip', 'fenotip', 'alel gen', 'homozigot', 'heterozigot', 'dominant', 'resesif', 'baskın', 'çekinik', 'monohibrit', 'dihibrit', 'çaprazlama']):
        if 'kan grubu' not in t and 'hemofili' not in t and 'renk körlüğü' not in t:
            return ("Kalıtımın Genel Esasları", "Mendel İlkeleri ve Çaprazlamalar (Monohibrit, Dihibrit)")

    if any(k in t for k in ['kan grubu', 'ab0 sistemi', 'rh faktörü', 'eritroblastozis', 'kan uyuşmazlığı', 'eş baskınlık', 'çok alellilik']):
        return ("Kalıtımın Genel Esasları", "Eş Baskınlık ve Kan Grupları (AB0 ve Rh Sistemi)")

    if any(k in t for k in ['soyağacı', 'soyağacında', 'x kromozomu', 'y kromozomu', 'renk körlüğü', 'hemofili', 'eşeye bağlı kalıtım', 'daltonizm']):
        return ("Kalıtımın Genel Esasları", "Eşeye Bağlı Kalıtım (Renk Körlüğü, Hemofili) ve Soyağaçları")

    if any(k in t for k in ['mutasyon', 'modifikasyon', 'varyasyon', 'rekombinasyon', 'genetik çeşitlilik']):
        return ("Kalıtımın Genel Esasları", "Genetik Varyasyonlar ve Mutasyonlar")

    # -------------------------------------------------------------
    # 7. EKOSİSTEM EKOLOJİSİ VE GÜNCEL ÇEVRE SORUNLARI
    # -------------------------------------------------------------
    if any(k in t for k in ['abiyotik', 'biyotik', 'ekosistem', 'üretici', 'tüketici', 'ayrıştırıcı', 'saprofit', 'ototrof', 'heterotrof', 'popülasyon', 'komünite', 'biyosfer', 'habitat', 'ekolojik niş']):
        if 'piramit' not in t and 'besin zinciri' not in t and 'döngü' not in t:
            return ("Ekosistem Ekolojisi", "Ekosistemin Yapısı ve Faktörleri (Abiyotik ve Biyotik)")

    if any(k in t for k in ['besin zinciri', 'besin ağı', 'besin piramidi', 'ekolojik piramit', 'trofik düzey', 'biyokütle', 'biyolojik birikim', 'enerji akışı']):
        return ("Ekosistem Ekolojisi", "Besin Zinciri, Ekolojik Piramitler ve Biyolojik Birikim")

    if any(k in t for k in ['madde döngüsü', 'azot döngüsü', 'karbon döngüsü', 'su döngüsü', 'nitrifikasyon', 'denitrifikasyon', 'azot bağlayıcı']):
        return ("Ekosistem Ekolojisi", "Madde Döngüleri (Azot, Karbon, Su Döngüsü)")

    if any(k in t for k in ['çevre kirliliği', 'hava kirliliği', 'su kirliliği', 'toprak kirliliği', 'asit yağmurları', 'sera etkisi', 'küresel iklim', 'ötrofikasyon', 'karbon ayak izi', 'ozon tabakası']):
        return ("Ekosistem Ekolojisi", "Güncel Çevre Sorunları (Sera Etkisi, Kirlilik, Ötrofikasyon)")

    if any(k in t for k in ['biyoçeşitlilik', 'endemik tür', 'doğal kaynaklar', 'sürdürülebilirlik', 'gen bankası', 'korunan alan']):
        return ("Ekosistem Ekolojisi", "Doğal Kaynaklar ve Biyolojik Çeşitliliğin Korunması")

    # Fallbacks based on course levels
    if ders == 'BİYOLOJİ – 1':
        return ("Yaşam Bilimi Biyoloji", "Canlıların Ortak Özellikleri (Hücresel Yapı, Beslenme, Homeostazi)")
    elif ders == 'BİYOLOJİ – 2':
        return ("Hücre", "Sitoplazma ve Organeller (Mitokondri, Kloroplast, Ribozom)")
    elif ders == 'BİYOLOJİ – 3':
        return ("Hücre Bölünmeleri", "Mitoz Bölünme ve Hücre Döngüsü Evreleri")
    else:
        return ("Ekosistem Ekolojisi", "Ekosistemin Yapısı ve Faktörleri (Abiyotik ve Biyotik)")


def main():
    print("=" * 60)
    print("🧬 BİYOLOJİ (Biyoloji 1 - 4) ÇIKMIŞ SORU VE KESİŞİM İŞLEME MOTORU")
    print("=" * 60)

    with open('ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
        all_raw_questions = json.load(f)

    # Filtrele: Sadece zorunlu Biyoloji dersleri (BİYOLOJİ – 1, 2, 3, 4)
    biyo_raw = [
        q for q in all_raw_questions 
        if 'BİYOLOJİ' in q['ders'] and 'SEÇMELİ' not in q['ders']
    ]
    print(f"Toplam seçilen zorunlu Biyoloji sorusu: {len(biyo_raw)}")

    processed_questions = []
    course_counts = Counter()

    for q in biyo_raw:
        qid = q['id']
        ders = q['ders']
        yil = q['yil']
        donem = q['donem']
        soru_no = q['soru_no']
        dogru_cevap = q['dogru_cevap'].strip().upper()

        course_counts[ders] += 1

        # Tamir kontrolü
        if qid in BIYOLOJI_REPAIRS:
            rep = BIYOLOJI_REPAIRS[qid]
            soru_temiz = rep['soru_temiz']
            secenekler_temiz = rep['secenekler_temiz']
        else:
            soru_temiz = clean_biyo_text(q.get('soru', ''))
            secenekler_temiz = clean_biyo_options(q.get('secenekler', {}))

        # Sınıflandır
        ana_konu, alt_konu = classify_biyoloji(soru_temiz, secenekler_temiz, ders)

        processed_questions.append({
            'id': qid,
            'ders': ders,
            'ders_kodu': q.get('ders_kodu', ''),
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

    # Çıktıyı kaydet
    out_path = 'ciktilar/analiz/biyoloji_analizli_sorular_temiz.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(processed_questions, f, ensure_ascii=False, indent=2)
    print(f"✅ {out_path} dosyasına {len(processed_questions)} temiz soru yazıldı.")

    # Kesişim analizleri
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
    print(f"🎯 BİYOLOJİ KADEMELERİ ARASI ORTAK KESİŞİM KÜMELERİ ({len(intersections)} Kesişen Alt Konu)")
    print("=" * 60)

    for idx, item in enumerate(intersections, 1):
        c_details = ", ".join([f"{c.replace('BİYOLOJİ – ', 'BİY-')}: {cnt}" for c, cnt in sorted(item['courses'].items())])
        sub_name = [k for k, v in topic_map.items() if v == item][0]
        print(f"{idx}. ÜNİTE: {item['ana_konu']}")
        print(f"   ► Alt Konu: {sub_name}")
        print(f"   ► Toplam: {item['count']} soru | Dağılım: [{c_details}]")
        print()

    # Şimdi tum_analizli_sorular_temiz.json ile birleştir
    with open('ciktilar/analiz/tum_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        existing_tum = json.load(f)

    # Varsa eski Biyoloji sorularını temizle, yenilerini ekle
    existing_tum = [q for q in existing_tum if 'BİYOLOJİ' not in q['ders']]
    existing_tum.extend(processed_questions)

    # ID'ye göre sırala
    existing_tum.sort(key=lambda x: x['id'])

    with open('ciktilar/analiz/tum_analizli_sorular_temiz.json', 'w', encoding='utf-8') as f:
        json.dump(existing_tum, f, ensure_ascii=False, indent=2)

    total_by_subject = Counter()
    for q in existing_tum:
        d = q['ders']
        if 'COĞRAFYA' in d: total_by_subject['Coğrafya'] += 1
        elif 'TÜRK DİLİ' in d: total_by_subject['Türk Dili ve Ed.'] += 1
        elif 'MATEMATİK' in d: total_by_subject['Matematik'] += 1
        elif 'TARİH' in d: total_by_subject['Tarih'] += 1
        elif 'KİMYA' in d: total_by_subject['Kimya'] += 1
        elif 'FİZİK' in d: total_by_subject['Fizik'] += 1
        elif 'BİYOLOJİ' in d: total_by_subject['Biyoloji'] += 1
        else: total_by_subject[d] += 1

    print("=" * 60)
    print(f"🚀 GÜNCEL GENEL SORU HAVUZU: Toplam {len(existing_tum)} Soru!")
    print(f"Dağılım: {dict(total_by_subject)}")
    print("=" * 60)

if __name__ == '__main__':
    main()
