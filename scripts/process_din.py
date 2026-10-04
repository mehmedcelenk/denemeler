#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_din.py
DİN KÜLTÜRÜ VE AHLAK BİLGİSİ (1 - 8) Zorunlu Ortak Kültür Dersi Analiz ve Temizleme Scripti
- Kapsam: DİN KÜLTÜRÜ VE AHLAK BİLGİSİ – 1'den 8'e kadar (Kod: 111-118, 616 soru)
- İmam Hatip meslek dersleri (Akaid, Fıkıh, Kelam, Siyer vb.) KESİNLİKLE dahil edilmez.
- Boş şıklı görsel soru (ID 7676 - Yin Yang ve din sembolleri) MEB kaynaklarına uygun metinle onarılır.
- Kesişim kümeleri taranır ve raporlanır.
"""

import json
import re
from collections import defaultdict, Counter

REPAIRED_DIN_OPTIONS = {
    7676: {
        'A': 'Yin-Yang sembolü (Siyah içinde beyaz, beyaz içinde siyah nokta barındıran daire)',
        'B': 'Davut Yıldızı (Mühr-ü Süleyman / Altı köşeli yıldız)',
        'C': 'Hilal ve Yıldız',
        'D': 'Haç sembolü'
    }
}

def clean_din_text(text):
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'[ \t]+', ' ', t)
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    cleaned = '\n'.join(lines)
    return cleaned

def clean_din_options(qid, secenekler):
    if qid in REPAIRED_DIN_OPTIONS:
        return REPAIRED_DIN_OPTIONS[qid]

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

def classify_din(soru_text, secenekler, ders_kodu):
    full = soru_text + " " + " ".join(secenekler.values())
    t = full.lower()

    # 1. BİLGİ VE İNANÇ (Din 1 odaklı)
    if any(k in t for k in ['selim akıl', 'salim duyular', 'sadık haber', 'mütevatir', 'bilgi kaynak', 'bilgi ahlakı', 'iman ve ikrar', 'tasdik', 'taklidi iman', 'tahkiki iman', 'imanın mahiyeti', 'furkân suresi', 'heveslerini tanrılaştıran']):
        return ("Bilgi ve İnanç", "İslam'da Bilgi Kaynakları (Akıl, Vahiy, Duyular) ve İmanın Mahiyeti")

    if any(k in t for k in ['fıtrat', 'hanif', 'tevhit', 'şirk', 'esma-i hüsna', 'allah’ın varlığı', 'dinin tanımı', 'dinin kaynağı', 'insan ve din']):
        return ("İnanç Esasları ve Tevhit", "Tevhit İnancı, Fıtrat ve Allah’ın Varlığının Delilleri")

    # 2. İBADETLER VE İSLAM (Din 2 odaklı)
    if any(k in t for k in ['ibadetin amacı', 'namaz', 'oruç', 'hac', 'zekât', 'zekat', 'kurban', 'sadaka', 'mükellef', 'farz', 'vacip', 'sünnet', 'haram', 'helal', 'taharet', 'abdest']):
        return ("İslam ve İbadet", "İbadetlerin Anlamı, Şartları ve Hükümleri (Farz, Vacip, Sünnet)")

    if any(k in t for k in ['iffet', 'şecaat', 'hikmet', 'adalet', 'temel değerler', 'erdil', 'gençlik ve değerler', 'eshab-ı kehf']):
        return ("Gençlik ve Değerler", "Temel Değerler (Adalet, Hikmet, İffet, Şecaat) ve Gençlik")

    if any(k in t for k in ['süleymaniye camii', 'selimiye', 'mimari', 'mihrab', 'minber', 'kubbe', 'hat sanatı', 'tezhip', 'musiki', 'ebru', 'gönül coğrafyamız', 'endülüs', 'balkanlar', 'horasan']):
        return ("İslam Medeniyeti ve Sanat", "İslam Medeniyetinin İzleri, Sanat, Mimari ve Gönül Coğrafyamız")

    # 3. ALLAH İNSAN İLİŞKİSİ VE HZ. MUHAMMED (Din 3 odaklı)
    if any(k in t for k in ['zati sıfat', 'subuti sıfat', 'kıdem', 'beka', 'vahdaniyet', 'vücud', 'kıyam bi-nefsihi', 'muhalefetün', 'hayat', 'ilim', 'semi', 'basar', 'irade', 'kudret', 'kelam', 'tekvin', 'örneksiz ve modelsiz']):
        return ("Allah - İnsan İlişkisi", "Allah’ın Sıfatları (Zati ve Subûti) ve İsimleri (Esma-i Hüsna)")

    if any(k in t for k in ['dua', 'tövbe', 'istiğfar', 'kur’an okuma', 'zikir', 'münacat', 'allah ile irtibat']):
        return ("Allah - İnsan İlişkisi", "İnsanın Allah ile İrtibat Yolları (Dua, İbadet, Tövbe, Zikir)")

    if any(k in t for k in ['hilfulfudul', 'hilfu’l-füdul', 'erdemliler topluluğu', 'genç sahabe', 'ali b. ebi talib', 'üsame b. zeyd', 'mus’ab b. umeyr', 'cafer b. ebi talib', 'muaz b. cebel']):
        return ("Hz. Muhammed ve Gençlik", "Hz. Muhammed'in Örnekliği ve Genç Sahabelerin Rolü")

    # 4. AHLAK VE MEZHEPLER (Din 4 odaklı)
    if any(k in t for k in ['mezhep', 'itikadi mezhep', 'fıkhi mezhep', 'maturidilik', 'eş’arilik', 'eşarilik', 'mutezile', 'hanefilik', 'şafiilik', 'malikilik', 'hanbelilik', 'caferilik', 'ehli sünnet', 'farklı yorumlar']):
        return ("İslam Düşüncesinde Yorumlar", "İtikadi, Siyasi ve Fıkhi Mezhepler (Maturidilik, Eş'arilik, Hanefilik)")

    if any(k in t for k in ['islam ahlakı', 'gıybet', 'haset', 'kibir', 'iftira', 'yalan', 'hüsn-i zan', 'su-i zan', 'israf', 'haya', 'sabır', 'tevekkül', 'vefa', 'anne baba hakkı', 'komşu hakkı']):
        return ("Ahlaki Tutum ve Davranışlar", "İslam Ahlakının Esasları, Güzel Ahlak ve Kaçınılması Gereken Davranışlar")

    # 5. DÜNYA, AHİRET VE PEYGAMBERLİK (Din 5 odaklı)
    if any(k in t for k in ['ahiret', 'ecel', 'ömür', 'kıyamet', 'berzah', 'kabir', 'ba’s', 'haşir', 'mahşer', 'mizan', 'cennet', 'cehennem', 'ölüm', 'ahiret hayatı', 'sur']):
        return ("Dünya ve Ahiret", "Ahiret Hayatının Aşamaları (Ölüm, Berzah, Kıyamet, Haşir, Mizan)")

    if any(k in t for k in ['üsve-i hasene', 'hatemü’l-enbiya', 'tebliğ', 'tebyin', 'teşri', 'temsil', 'peygamberlerin sıfat', 'sıdk', 'emanet', 'ismet', 'fetanet']):
        return ("Peygamberlik ve Hz. Muhammed", "Hz. Muhammed’in Şahsiyeti, Görevleri (Tebliğ, Tebyin, Teşri) ve Peygamberlik")

    # 6. KUR'AN KAVRAMLARI VE DİNLER (Din 6 odaklı)
    if any(k in t for k in ['hidayet', 'dalalet', 'ihsan', 'muhsin', 'ihlas', 'takva', 'muttaki', 'sırat-ı müstakim', 'cihad', 'mücahede', 'salih amel']):
        return ("Kur’an’da Temel Kavramlar", "Kur’an’da Geçen Temel Kavramlar (Hidayet, İhsan, İhlas, Takva, Cihad)")

    if any(k in t for k in ['deizm', 'ateizm', 'agnostisizm', 'nihilizm', 'pozitivizm', 'sekülerizm', 'materyalizm', 'kötülük problemi', 'felsefi yaklaşım']):
        return ("İnançla İlgili Felsefi Yaklaşımlar", "Felsefi Yaklaşımlar (Deizm, Ateizm, Agnostisizm, Pozitivizm)")

    if any(k in t for k in ['yahudilik', 'hristiyanlık', 'sinagog', 'havra', 'kilise', 'tevrat', 'incil', 'on emir', 'teslis', 'şabat', 'paskalya', 'kudüs', 'yahudi']):
        return ("Vahye Dayalı Dinler", "Yahudilik ve Hristiyanlık (İnanç, İbadet ve Tarihsel Gelişim)")

    # 7. İSLAM VE BİLİM, ANADOLU'DA İSLAM (Din 7 odaklı)
    if any(k in t for k in ['beytü’l-hikme', 'darülhadis', 'medrese', 'rasathane', 'şifahane', 'harezmi', 'ali kuşçu', 'ibn heysem', 'ibn haldun', 'uluğ bey', 'cezeri', 'biruni', 'akşemsettin', 'islam ve bilim', 'bilim insan']):
        return ("İslam ve Bilim", "İslam Medeniyetinde Bilim, Kurumlar (Rasathane, Medrese) ve Müslüman Âlimler")

    if any(k in t for k in ['tasavvuf', 'yesevilik', 'ahmet yesevi', 'mevlevilik', 'mevlana', 'bektaşilik', 'hacı bektaş veli', 'yunus emre', 'ahilik', 'ahi evran', 'hacı bayram veli', 'sufi', 'erenler', 'anadolu’da islam']):
        return ("Anadolu’da İslam ve Tasavvuf", "Anadolu’da Tasavvufi Yorumlar (Mevlevilik, Bektaşilik, Ahilik) ve Erenler")

    # 8. GÜNCEL MESELELER VE HİNT DİNLERİ (Din 8 odaklı)
    if any(k in t for k in ['organ nakli', 'ötenazi', 'kan bağışı', 'faiz', 'şans oyunları', 'kumar', 'gıda', 'helal gıda', 'haram gıda', 'kesinlikle yasaktır', 'domuz']):
        return ("Güncel Dinî Meseleler", "Tıbbi, Ekonomik ve Günlük Yaşamla İlgili Güncel Dinî Meseleler (Organ Nakli, Faiz)")

    if any(k in t for k in ['hinduizm', 'budizm', 'konfüçyanizm', 'taoizm', 'yin-yang', 'reenkarnasyon', 'tenasüh', 'karma', 'nirvana', 'kast sistemi', 'brahma', 'vişnu', 'şiva', 'buda', 'gautama', 'avatar', 'politeist']):
        return ("Hint ve Doğu Dinleri", "Hint ve Doğu Asya Dinleri (Hinduizm, Budizm, Konfüçyanizm, Taoizm)")

    # Fallback
    c = ders_kodu - 110
    if c == 1:
        return ("Bilgi ve İnanç", "İslam'da Bilgi Kaynakları (Akıl, Vahiy, Duyular) ve İmanın Mahiyeti")
    elif c == 2:
        return ("İslam ve İbadet", "İbadetlerin Anlamı, Şartları ve Hükümleri (Farz, Vacip, Sünnet)")
    elif c == 3:
        return ("Allah - İnsan İlişkisi", "Allah’ın Sıfatları (Zati ve Subûti) ve İsimleri (Esma-i Hüsna)")
    elif c == 4:
        return ("Ahlaki Tutum ve Davranışlar", "İslam Ahlakının Esasları, Güzel Ahlak ve Kaçınılması Gereken Davranışlar")
    elif c == 5:
        return ("Dünya ve Ahiret", "Ahiret Hayatının Aşamaları (Ölüm, Berzah, Kıyamet, Haşir, Mizan)")
    elif c == 6:
        return ("Kur’an’da Temel Kavramlar", "Kur’an’da Geçen Temel Kavramlar (Hidayet, İhsan, İhlas, Takva, Cihad)")
    elif c == 7:
        return ("İslam ve Bilim", "İslam Medeniyetinde Bilim, Kurumlar (Rasathane, Medrese) ve Müslüman Âlimler")
    else:
        return ("Hint ve Doğu Dinleri", "Hint ve Doğu Asya Dinleri (Hinduizm, Budizm, Konfüçyanizm, Taoizm)")

def main():
    print("=" * 60)
    print("🕌 DİN KÜLTÜRÜ VE AHLAK BİLGİSİ İŞLEME VE ANALİZ MOTORU")
    print("=" * 60)

    with open('scripts/ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
        all_raw = json.load(f)

    # Sadece kod 111-118 arasındaki zorunlu ortak dersler (İmam hatip meslek dersleri hariç)
    din_raw = [q for q in all_raw if q.get('ders_kodu') in range(111, 119)]
    print(f"Toplam seçilen zorunlu Din Kültürü sorusu: {len(din_raw)}")

    processed_questions = []
    course_counts = Counter()

    for q in din_raw:
        qid = q['id']
        dk = q.get('ders_kodu')
        kademe_num = dk - 110
        ders_std = f"DİN KÜLTÜRÜ VE AHLAK BİLGİSİ – {kademe_num}"
        yil = q['yil']
        donem = q['donem']
        soru_no = q['soru_no']
        dogru_cevap = q['dogru_cevap'].strip().upper()

        course_counts[ders_std] += 1

        soru_temiz = clean_din_text(q.get('soru', ''))
        secenekler_temiz = clean_din_options(qid, q.get('secenekler', {}))

        ana_konu, alt_konu = classify_din(soru_temiz, secenekler_temiz, dk)

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
    out_path = 'scripts/ciktilar/analiz/din_analizli_sorular_temiz.json'
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
    print(f"🎯 DİN KÜLTÜRÜ KADEMELERİ ARASI KESİŞİM KÜMELERİ ({len(intersections)} Kesişen Alt Konu)")
    print("=" * 60)

    for idx, item in enumerate(intersections, 1):
        c_details = ", ".join([f"{c.replace('DİN KÜLTÜRÜ VE AHLAK BİLGİSİ – ', 'DİN-')}: {cnt}" for c, cnt in sorted(item['courses'].items())])
        sub_name = [k for k, v in topic_map.items() if v == item][0]
        print(f"{idx}. ÜNİTE: {item['ana_konu']}")
        print(f"   ► Alt Konu: {sub_name}")
        print(f"   ► Toplam: {item['count']} soru | Dağılım: [{c_details}]")
        print()

if __name__ == '__main__':
    main()
