#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_inkilap.py
T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK (1 ve 2) Zorunlu Ortak Kültür Dersi Analiz ve Temizleme Scripti
- Kapsam: T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1 (Kod: 141) ve 2 (Kod: 142) (164 soru)
- MEB Öğretim Programı ünite ve kazanım hiyerarşisi uygulanır.
- Kesişim kümeleri taranır ve raporlanır.
"""

import json
import re
from collections import defaultdict, Counter

def clean_inkilap_text(text):
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'[ \t]+', ' ', t)
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    cleaned = '\n'.join(lines)
    return cleaned

def clean_inkilap_options(secenekler):
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

def classify_inkilap(soru_text, secenekler, ders_kodu):
    full = soru_text + " " + " ".join(secenekler.values())
    t = full.lower()

    # -------------------------------------------------------------
    # 1. 20. YÜZYIL BAŞLARINDA OSMANLI VE DÜNYA (İnkılap 1)
    # -------------------------------------------------------------
    if any(k in t for k in ['manastır askerî idadisi', 'selanik mülkiye', 'harp akademisi', 'şemsi efendi', 'namık kemal', 'tevfik fikret', 'ziya gökalp', 'fikir hayatı', 'eğitim almak amacıyla bulunduğu şehir', 'makedonya', 'kolağası']):
        return ("20. Yüzyıl Başlarında Osmanlı Devleti", "Mustafa Kemal'in Öğrenim Hayatı ve Fikir Dünyası")

    if any(k in t for k in ['trablusgarp', 'uşi antlaşması', 'derne', 'tobruk', 'balkan savaş', 'bâb-ı âli baskını', 'londra antlaşması', 'otuz bir mart', '31 mart', 'hareket ordusu', 'picardie manevraları']):
        return ("20. Yüzyıl Başlarında Osmanlı Devleti", "Trablusgarp Savaşı, Balkan Savaşları ve 31 Mart Vakası")

    if any(k in t for k in ['çanakkale cephesi', 'kafkas cephesi', 'kanal cephesi', 'hicaz-yemen', 'ırak cephesi', 'kutü’l-amare', 'sarıkamış', 'tehcir kanunu', 'sevk ve iskan', 'brest-litovsk', 'mondros ateﬂkes', 'mondros mütarekesi', 'mondros ateşkes', 'wilson ilkeleri', 'paris barış konferansı', 'itilaf devletleri', 'ittifak devletleri', 'bolşevik']):
        return ("I. Dünya Savaşı ve Mondros", "I. Dünya Savaşı'nda Cepheler ve Mondros Ateşkesi")

    # -------------------------------------------------------------
    # 2. MİLLİ MÜCADELE HAZIRLIK DÖNEMİ (İnkılap 1)
    # -------------------------------------------------------------
    if any(k in t for k in ['kuvâ-yı millîye', 'kuva-yı milliye', 'yararlı cemiyet', 'zararlı cemiyet', 'mavri mira', 'pontus rum', 'hınçak', 'taşnak', 'reddi ilhak', 'trakya paşaeli', 'kilikyalılar', 'millî kongre', 'inebolu', 'şerife bacı', 'kastamonu', 'albay rafet']):
        return ("Millî Mücadele'nin Hazırlık Dönemi", "Kuvâ-yı Millîye ve Millî/Zararlı Cemiyetler")

    if any(k in t for k in ['amasya genelgesi', 'havza genelgesi', 'erzurum kongresi', 'sivas kongresi', 'amasya görüşmeleri', 'temsil heyeti', 'milletin bağımsızlığını yine milletin', 'manda ve himaye kabul edilemez', 'irade-i milliye', 'hâkimiyet-i milliye', 'sivas’ta toplanan']):
        return ("Millî Mücadele'nin Hazırlık Dönemi", "Genelgeler ve Kongreler Dönemi (Amasya, Erzurum, Sivas)")

    if any(k in t for k in ['misak-ı millî', 'misakımilli', 'son osmanlı mebusan', 'istanbul’un işgali', 'sevr antlaşması', 'saltanat şurası']):
        return ("Millî Mücadele'nin Hazırlık Dönemi", "Misak-ı Millî ve Sevr Antlaşması")

    if any(k in t for k in ['tbmm’nin açıl', 'i. tbmm', 'hıyanet-i vataniye', 'istiklal mahkemeleri', 'tbmm’ye karşı çıkan ayaklanmalar', 'ahmet anzavur', 'kuva-yı inzibatiye', 'çerkez ethem', 'demirci mehmet']):
        return ("Millî Mücadele'nin Hazırlık Dönemi", "I. TBMM’nin Açılışı, Özellikleri ve Ayaklanmalar")

    # -------------------------------------------------------------
    # 3. MİLLİ MÜCADELE MUHAREBELER DÖNEMİ (İnkılap 1)
    # -------------------------------------------------------------
    if any(k in t for k in ['doğu cephesi', 'güney cephesi', 'gümrü antlaşması', 'kâzım karabekir', 'maraş', 'antep', 'urfa', 'sütçü imam', 'şahin bey', 'fransız işgali', 'ankara antlaşması']):
        return ("Millî Mücadele Muharebeler Dönemi", "Doğu ve Güney Cepheleri (Gümrü ve Ankara Antlaşmaları)")

    if any(k in t for k in ['i. inönü', 'ii. inönü', 'kütahya-eskişehir', 'tekalif-i milliye', 'tekâlif-i milliye', 'londra konferansı', 'afganistan dostluk', 'moskova antlaşması']):
        return ("Millî Mücadele Muharebeler Dönemi", "Batı Cephesi Muharebeleri (İnönü Savaşları ve Kütahya-Eskişehir)")

    if any(k in t for k in ['sakarya meydan', 'hattı müdafaa yoktur', 'gazilik unvanı ve mareşallik', 'büyük taarruz', 'başkomutanlık meydan', 'dumlupınar', 'ordular ilk hedefiniz', 'mudanya ateşkes']):
        return ("Millî Mücadele Muharebeler Dönemi", "Sakarya Meydan Muharebesi, Büyük Taarruz ve Mudanya Ateşkesi")

    if any(k in t for k in ['lozan barış antlaşması', 'lozan konferansı', 'kapitülasyonların kaldırılması', 'ismet inönü', 'boğazlar komisyonu', 'patrikhane']):
        return ("Millî Mücadele Muharebeler Dönemi", "Lozan Barış Antlaşması ve Diplomatik Zafer")

    # -------------------------------------------------------------
    # 4. ATATÜRKÇÜLÜK VE İNKILAPLAR (İnkılap 1 & 2 Kesişimi)
    # -------------------------------------------------------------
    if any(k in t for k in ['saltanatın kaldırılması', 'ankara’nın başkent', 'cumhuriyetin ilanı', 'halifeliğin kaldırılması', 'şeriye ve evkaf', 'erkân-ı harbiye', '1921 anayasası', '1924 anayasası', 'teşkilat-ı esasiye']):
        return ("Atatürkçülük ve Türk İnkılabı", "Siyasal Alanda İnkılaplar (Cumhuriyetin İlanı, Halifeliğin Kaldırılması)")

    if any(k in t for k in ['tevhid-i tedrisat', 'harf inkılabı', 'millet mektepleri', 'türk tarih kurumu', 'türk dil kurumu', 'üniversite reformu', 'darülfünun', 'yeni türk harfleri']):
        return ("Atatürkçülük ve Türk İnkılabı", "Eğitim ve Kültür Alanında İnkılaplar (Tevhid-i Tedrisat, Harf İnkılabı)")

    if any(k in t for k in ['türk medeni kanunu', 'medeni kanun', 'kadınlara seçme ve seçilme', 'hukuk alanında']):
        return ("Atatürkçülük ve Türk İnkılabı", "Hukuk Alanında İnkılaplar (Türk Medeni Kanunu ve Kadın Hakları)")

    if any(k in t for k in ['şapka kanunu', 'kılık kıyafet', 'tekke, zaviye', 'soyadı kanunu', 'saat ve ölçü', 'miladi takvim', 'unvan ve lakap']):
        return ("Atatürkçülük ve Türk İnkılabı", "Toplumsal Alanda İnkılaplar (Kılık-Kıyafet, Soyadı Kanunu, Takvim)")

    if any(k in t for k in ['izmir iktisat kongresi', 'misak-ı iktisadi', 'aşar vergisi', 'kabotaj kanunu', 'teşvik-i sanayi', 'merkez bankası', 'sümerbank', 'etibank', 'demiryolu', 'atatürk orman çiftliği', 'zirai kredi']):
        return ("Atatürkçülük ve Türk İnkılabı", "Ekonomi ve Kalkınma Alanındaki Hamleler (İzmir İktisat, Kabotaj)")

    # -------------------------------------------------------------
    # 5. ATATÜRK İLKELERİ (İnkılap 1 & 2 Kesişimi)
    # -------------------------------------------------------------
    if any(k in t for k in ['cumhuriyetçilik', 'milliyetçilik', 'halkçılık', 'devletçilik', 'laiklik', 'inkılapçılık', 'atatürk ilke']):
        return ("Atatürk İlkeleri", "Atatürk İlkeleri ve Bütünleyici İlkeler")

    # -------------------------------------------------------------
    # 6. DEMOKRATİKLEŞME VE ÇOK PARTİLİ HAYAT (İnkılap 2)
    # -------------------------------------------------------------
    if any(k in t for k in ['cumhuriyet halk fırkası', 'terakkiperver cumhuriyet', 'serbest cumhuriyet fırkası', 'şeyh sait isyanı', 'takrir-i sükûn', 'izmir suikastı', 'menemen olayı', 'kubilay', 'çok partili']):
        return ("Demokratikleşme Çabaları", "Çok Partili Hayata Geçiş Denemeleri ve Rejime Tepkiler")

    # -------------------------------------------------------------
    # 7. ATATÜRK DÖNEMİ DIŞ POLİTİKA (İnkılap 2)
    # -------------------------------------------------------------
    if any(k in t for k in ['yurtta sulh cihanda sulh', 'musul sorunu', 'nüfus mübadelesi', 'etablis', 'milletler cemiyeti', 'balkan antantı', 'sadabat paktı', 'montrö boğazlar', 'hatay’ın anavatana', 'tayfur sökmen']):
        return ("Atatürk Dönemi Dış Politika", "Türk Dış Politikası (Montrö, Sadabat Paktı, Balkan Antantı, Hatay)")

    # -------------------------------------------------------------
    # 8. ÇAĞDAŞ TÜRK VE DÜNYA TARİHİ (İnkılap 2 Odaklı)
    # -------------------------------------------------------------
    if any(k in t for k in ['ikinci dünya savaşı', 'ii. dünya savaşı', 'kahire konferansı', 'adana görüşmesi', 'varlık vergisi', 'millî korunma kanunu', 'mihver devletler', 'müttefik devletler', 'normandiya', 'pearl harbour', 'stalingrad', 'faşizm', 'nasyonal sosyalizm', 'mussolini', 'hitler']):
        return ("II. Dünya Savaşı ve Türkiye", "II. Dünya Savaşı Süreci, Mihver-Müttefik Blokları ve Türkiye")

    if any(k in t for k in ['soğuk savaş', 'doğu bloku', 'batı bloku', 'varşova paktı', 'nato', 'truman doktrini', 'marshall planı', 'kore savaşı', 'kominform', 'comecon']):
        return ("Soğuk Savaş Dönemi", "Soğuk Savaş Dönemi: Doğu-Batı Blokları ve Türkiye'nin NATO'ya Girişi")

    if any(k in t for k in ['kıbrıs sorunu', 'kıbrıs barış', 'enosis', 'eoka', 'kıta sahanlığı', 'ege adaları', 'iran-ırak savaşı', 'yumuşama dönemi', 'detant', 'küba krizi', 'asala', 'bağlantısızlar']):
        return ("Yumuşama Dönemi ve Çatışmalar", "Yumuşama Dönemi, Kıbrıs Meselesi ve Bölgesel Çatışmalar")

    if any(k in t for k in ['sscb’nin dağılması', 'türk cumhuriyetleri', 'tika', 'bosna savaşı', 'aliya izzetbegoviç', 'naim süleymanoğlu', 'aziz sancar', 'nobel kimya', 'küreselleşen dünya', 'avrupa birliği', 'türk dilli']):
        return ("Küreselleşen Dünya ve 21. Yüzyıl", "21. Yüzyılın Eşiğinde Türkiye ve Dünya (Bilim, Kültür ve Dış İlişkiler)")

    # Fallback
    if ders_kodu == 141:
        return ("Millî Mücadele Muharebeler Dönemi", "Batı Cephesi Muharebeleri (İnönü Savaşları ve Kütahya-Eskişehir)")
    else:
        return ("Atatürkçülük ve Türk İnkılabı", "Siyasal Alanda İnkılaplar (Cumhuriyetin İlanı, Halifeliğin Kaldırılması)")

def main():
    print("=" * 60)
    print("🇹🇷 T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK İŞLEME VE ANALİZ MOTORU")
    print("=" * 60)

    with open('scripts/ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
        all_raw = json.load(f)

    ink_raw = [q for q in all_raw if q.get('ders_kodu') in (141, 142)]
    print(f"Toplam seçilen İnkılap Tarihi sorusu: {len(ink_raw)}")

    processed_questions = []
    course_counts = Counter()

    for q in ink_raw:
        qid = q['id']
        dk = q.get('ders_kodu')
        ders_std = "T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1" if dk == 141 else "T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2"
        yil = q['yil']
        donem = q['donem']
        soru_no = q['soru_no']
        dogru_cevap = q['dogru_cevap'].strip().upper()

        course_counts[ders_std] += 1

        soru_temiz = clean_inkilap_text(q.get('soru', ''))
        secenekler_temiz = clean_inkilap_options(q.get('secenekler', {}))

        ana_konu, alt_konu = classify_inkilap(soru_temiz, secenekler_temiz, dk)

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
    out_path = 'scripts/ciktilar/analiz/inkilap_analizli_sorular_temiz.json'
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
    print(f"🎯 İNKILAP TARİHİ KADEMELERİ ARASI KESİŞİM KÜMELERİ ({len(intersections)} Kesişen Alt Konu)")
    print("=" * 60)

    for idx, item in enumerate(intersections, 1):
        c_details = ", ".join([f"{c.replace('T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – ', 'İNK-')}: {cnt}" for c, cnt in sorted(item['courses'].items())])
        sub_name = [k for k, v in topic_map.items() if v == item][0]
        print(f"{idx}. ÜNİTE: {item['ana_konu']}")
        print(f"   ► Alt Konu: {sub_name}")
        print(f"   ► Toplam: {item['count']} soru | Dağılım: [{c_details}]")
        print()

if __name__ == '__main__':
    main()
