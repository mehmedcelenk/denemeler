#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_felsefe.py
FELSEFE (Felsefe 1 - 4) Zorunlu Ortak Kültür Dersleri Analiz ve Temizleme Scripti
- Kapsam: FELSEFE – 1, FELSEFE – 2, FELSEFE – 3, FELSEFE – 4 (328 soru)
- Seçmeli felsefe, mantık, psikoloji veya sosyoloji dersleri dahil edilmez.
- MEB Felsefe Dersi Öğretim Programı ünite ve kazanım hiyerarşisi uygulanır.
- Kesişim kümeleri taranır ve raporlanır.
"""

import json
import re
from collections import defaultdict, Counter

def clean_felsefe_text(text):
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'[ \t]+', ' ', t)
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    cleaned = '\n'.join(lines)
    return cleaned

def clean_felsefe_options(secenekler):
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

def classify_felsefe(soru_text, secenekler, ders):
    """
    MEB Felsefe müfredatına göre ana_konu ve alt_konu atar.
    """
    full_text = soru_text + " " + " ".join(secenekler.values())
    t = full_text.lower()
    
    # -------------------------------------------------------------
    # 1. FELSEFEYİ TANIMA VE DÜŞÜNME (Felsefe 1 Odaklı)
    # -------------------------------------------------------------
    if any(k in t for k in ['hikmet', 'philosophia', 'bilgelik sevgisi', 'felsefenin anlamı', 'felsefenin tanımı', 'hayret etme', 'merak etme', 'felsefenin doğuşu', 'iyonya', 'milet']):
        return ("Felsefeyi Tanıma", "Felsefenin Anlamı, Doğuşu ve Bilgelik Arayışı (Hikmet)")

    if any(k in t for k in ['refleksif', 'yığılımlı', 'kümülatif', 'rasyonel', 'tutarlı', 'öznel', 'evrensel olma', 'eleştirel ve sorgulayıcı', 'sistemli olma', 'felsefi düşüncenin özellik']):
        return ("Felsefeyi Tanıma", "Felsefi Düşüncenin Temel Özellikleri (Refleksif, Rasyonel, Kümülatif)")

    if any(k in t for k in ['felsefenin bireysel', 'felsefenin toplumsal', 'felsefenin işlevi', 'felsefenin yararı', 'ön yargılardan']):
        return ("Felsefeyi Tanıma", "Felsefenin Bireysel ve Toplumsal İşlevleri")

    if any(k in t for k in ['tümdengelim', 'dedüksiyon', 'tümevarım', 'endüksiyon', 'analoji', 'argüman', 'önerme', 'akıl yürütme', 'karşıt sav', 'tutarlılık ve çelişiklik']):
        return ("Felsefe ile Düşünme", "Akıl Yürütme ve Argümantasyon (Tümdengelim, Tümevarım, Analoji)")

    if any(k in t for k in ['özdeşlik', 'çelişmezlik', 'üçüncü durumun imkânsızlığı', 'yeter sebep', 'akıl ilkeleri']):
        return ("Felsefe ile Düşünme", "Mantık İlkeleri (Özdeşlik, Çelişmezlik, Yeter-Sebep)")

    if any(k in t for k in ['dil ve felsefe', 'kavram yanılgısı', 'anlam ve hakikat', 'terim']):
        return ("Felsefe ile Düşünme", "Dil ve Düşünce İlişkisi")

    # -------------------------------------------------------------
    # 2. FELSEFENİN TEMEL ALANLARI / PROBLEMLERİ (Felsefe 2 Odaklı)
    # -------------------------------------------------------------
    # VARLIK FELSEFESİ (ONTOLOJİ)
    if any(k in t for k in ['ontoloji', 'varlık felsefesi', 'varlığın mahiyeti', 'varlık var mıdır', 'nihilizm', 'varlık oluştur', 'varlık maddedir', 'varlık ideadır', 'varlık hem madde hem', 'düalizm', 'materyalizm', 'idealizm', 'oluş']):
        return ("Varlık Felsefesi (Ontoloji)", "Varlığın Mahiyeti ve Temel Varlık Yaklaşımları (İdealizm, Materyalizm, Düalizm)")

    # BİLGİ FELSEFESİ (EPİSTEMOLOJİ)
    if any(k in t for k in ['epistemoloji', 'bilgi felsefesi', 'septisizm', 'şüphecilik', 'doğru bilgi mümkün', 'rasyonalizm', 'akılcılık', 'empirizm', 'deneycilik', 'kritisizm', 'eleştiricilik', 'entüisyonizm', 'sezgicilik', 'pozitivizm', 'olguculuk', 'pragmatizm', 'faydacılık', 'apaçıklık', 'tümel uzlaşım', 'uygunluk']):
        if 'platon' not in t and 'aristoteles' not in t and 'descartes' not in t and 'kant' not in t and 'locke' not in t:
            return ("Bilgi Felsefesi (Epistemoloji)", "Bilginin İmkânı, Kaynağı ve Doğruluk Ölçütleri (Rasyonalizm, Empirizm)")

    # BİLİM FELSEFESİ
    if any(k in t for k in ['bilim felsefesi', 'etkinlik olarak bilim', 'ürün olarak bilim', 'paradigma', 'thomas kuhn', 'yanlışlanabilirlik', 'karl popper', 'doğrulanabilirlik', 'neopozitivizm']):
        return ("Bilim Felsefesi", "Bilim Felsefesi ve Paradigma Kavramı (Kuhn, Popper)")

    # AHLAK FELSEFESİ (ETİK)
    if any(k in t for k in ['etik', 'ahlak felsefesi', 'ahlaki eylemin amacı', 'özgürlük problemi', 'determinizm', 'indeterminizm', 'otodeterminizm', 'fatalizm', 'liberteryanizm', 'evrensel ahlak yasası', 'ödev ahlakı', 'haz ahlakı', 'hedonizm', 'faydacı ahlak', 'bencillik', 'egoizm']):
        if 'kant' not in t and 'sokrates' not in t and 'epiküros' not in t and 'bentham' not in t:
            return ("Ahlak Felsefesi (Etik)", "Ahlak Felsefesi: Ahlaki Eylem, Özgürlük ve Evrensel Ahlak Yasası")

    # DİN FELSEFESİ
    if any(k in t for k in ['din felsefesi', 'teizm', 'deizm', 'panteizm', 'panenteizm', 'agnostisizm', 'ateizm', 'tanrı’nın varlığı', 'kötülük problemi', 'teodise', 'ontolojik kanıt', 'kozmolojik kanıt']):
        return ("Din Felsefesi", "Din Felsefesi ve Tanrı’nın Varlığına İlişkin Görüşler (Teizm, Deizm, Panteizm)")

    # SİYASET FELSEFESİ
    if any(k in t for k in ['siyaset felsefesi', 'devletin kökeni', 'toplumsal sözleşme', 'doğal devlet', 'yapay devlet', 'ütopya', 'distopya', 'korku ütopyası', 'ideal devlet düzeni', 'egemenlik']):
        if 'platon' not in t and 'farabi' not in t and 'hobbes' not in t and 'locke' not in t and 'rousseau' not in t:
            return ("Siyaset Felsefesi", "Siyaset Felsefesi: Devletin Doğuşu, Toplum Sözleşmesi ve Ütopyalar")

    # SANAT FELSEFESİ (ESTETİK)
    if any(k in t for k in ['estetik', 'sanat felsefesi', 'mimesis', 'taklit olarak sanat', 'yaratma olarak sanat', 'oyun olarak sanat', 'estetik haz', 'estetik yargı', 'güzel nedir', 'güzellik']):
        return ("Sanat Felsefesi (Estetik)", "Sanat Felsefesi: Sanat Kuramları (Taklit, Yaratma, Oyun) ve Estetik")

    # -------------------------------------------------------------
    # 3. İLK ÇAĞ FELSEFESİ (MÖ 6. YY - MS 2. YY) (Felsefe 3 Odaklı)
    # -------------------------------------------------------------
    if any(k in t for k in ['arkhe', 'ilk neden', 'ana madde', 'thales', 'anaksimandros', 'anaksimenes', 'empedokles', 'demokritos', 'herakleitos', 'parmenides', 'oluş ve değişim', 'panta rhei']):
        return ("İlk Çağ Felsefesi", "Doğa Felsefesi ve Arkhe (İlk Neden) Problemi")

    if any(k in t for k in ['sofist', 'protagoras', 'gorgias', 'insan her şeyin ölçüsüdür', 'hiçbir şey var olamaz', 'görelilik', 'rölativizm']):
        return ("İlk Çağ Felsefesi", "İnsan Merkezli Felsefe: Sofistler ve Rölativizm")

    if any(k in t for k in ['sokrates', 'sokratik yöntem', 'maiotik', 'doğurtma', 'ironi', 'alay', 'bilgi erdemdir', 'kimse bilerek kötülük']):
        return ("İlk Çağ Felsefesi", "Sokrates ve Ahlak Felsefesi (Sokratik Yöntem, Bilgi-Erdem)")

    if any(k in t for k in ['platon', 'eflatun', 'idealar kuramı', 'idealar dünyası', 'nesneler dünyası', 'mağara alegorisi', 'ruhun ölümsüzlüğü', 'devlet']):
        return ("İlk Çağ Felsefesi", "Platon: İdealar Kuramı, Epistemoloji ve İdeal Devlet")

    if any(k in t for k in ['aristoteles', 'dört neden', 'maddi neden', 'formel neden', 'fail neden', 'ereksel neden', 'altın orta', 'madde-form', 'akıllı canlı']):
        return ("İlk Çağ Felsefesi", "Aristoteles: Varlık, Madde-Form Kuramı ve Altın Orta Erdemi")

    if any(k in t for k in ['epiküros', 'ataraksia', 'zenon', 'stoa', 'stoacılık', 'kuşkuculuk', 'pyrrhon', 'timon', 'epokhe']):
        return ("İlk Çağ Felsefesi", "Helenistik Felsefe (Epikürosçuluk, Stoacılık, Şüphecilik)")

    # -------------------------------------------------------------
    # 4. ORTA ÇAĞ FELSEFESİ (MS 2. YY - MS 15. YY) (Felsefe 3 Odaklı)
    # -------------------------------------------------------------
    if any(k in t for k in ['skolastik', 'patristik', 'augustinus', 'thomas aquinas', 'anselmus', 'anlamak için inanıyorum', 'tümeller problemi', 'kavram realizmi', 'konseptüalizm', 'nominalizm', 'adcılık']):
        return ("Orta Çağ Felsefesi", "Hristiyan Felsefesi: Akıl-İnanç İlişkisi ve Tümeller Problemi")

    if any(k in t for k in ['islam felsefesi', 'farabi', 'el-medinetü’l fazıla', 'sudûr', 'ibn sina', 'eş-şifa', 'gazali', 'tehâfüt', 'kalp gözü', 'ibn rüşd', 'kindi', 'beytü’l-hikme', 'çeviri faaliyet']):
        return ("Orta Çağ Felsefesi", "İslam Felsefesi: Akıl-İnanç Uzlaşısı, Çeviriler ve Filozoflar (Farabi, İbn Sina, Gazali)")

    # -------------------------------------------------------------
    # 5. 15. - 17. YY RÖNESANS VE MODERN FELSEFE (Felsefe 4 Odaklı)
    # -------------------------------------------------------------
    if any(k in t for k in ['rönesans', 'hümanizm', 'francesco petrarca', 'francis bacon', 'bilgi güçtür', 'idoller', 'tümevarım yöntemi', 'niccolo machiavelli', 'prens', 'hükümdar', 'thomas more']):
        return ("15.-17. Yüzyıl Felsefesi", "Rönesans Düşüncesi, Hümanizm ve Bilimsel Yöntem (Bacon, Machiavelli)")

    if any(k in t for k in ['descartes', 'kartezyen', 'metodik şüphe', 'düşünüyorum o halde varım', 'cogito ergo sum', 'ruh ve beden', 'res cogitans', 'res extensa']):
        return ("15.-17. Yüzyıl Felsefesi", "Kartezyen Felsefe ve Metodik Şüphe (René Descartes)")

    if any(k in t for k in ['thomas hobbes', 'leviathan', 'insan insanın kurdudur', 'homo homini lupus', 'toplum sözleşmesi']):
        return ("15.-17. Yüzyıl Felsefesi", "Siyaset Felsefesi ve Toplum Sözleşmesi (Hobbes)")

    # -------------------------------------------------------------
    # 6. 18. - 19. YY AYDINLANMA FELSEFESİ (Felsefe 4 Odaklı)
    # -------------------------------------------------------------
    if any(k in t for k in ['immanuel kant', 'sapere aude', 'aklını kullanma cesareti', 'kritisizm', 'apriori', 'aposteriori', 'numen', 'fenomen', 'ödev ahlakı', 'kategorik imperatif', 'koşulsuz buyruk']):
        return ("18.-19. Yüzyıl Aydınlanma Felsefesi", "Immanuel Kant: Kritisizm (Eleştirel Felsefe) ve Ödev Ahlakı")

    if any(k in t for k in ['john locke', 'tabula rasa', 'boş levha', 'deneycilik', 'doğuştan fikir yoktur']):
        return ("18.-19. Yüzyıl Aydınlanma Felsefesi", "John Locke ve Empirizm (Tabula Rasa)")

    if any(k in t for k in ['david hume', 'nedensellik eleştirisi', 'izlenimler ve fikirler', 'alışkanlık']):
        return ("18.-19. Yüzyıl Aydınlanma Felsefesi", "David Hume: Nedensellik İlkesinin Eleştirisi")

    if any(k in t for k in ['jean jacques rousseau', 'doğa durumu', 'toplum sözleşmesi', 'genel irade']):
        return ("18.-19. Yüzyıl Aydınlanma Felsefesi", "J.J. Rousseau: Doğa Durumu ve Toplum Sözleşmesi")

    if any(k in t for k in ['hegel', 'diyalektik idealizm', 'geis', 'tin', 'mutlak akıl', 'tez-antitez-sentez', 'akli olan gerçek, gerçek olan aklidir']):
        return ("18.-19. Yüzyıl Aydınlanma Felsefesi", "G.W.F. Hegel: Diyalektik İdealizm ve Mutlak Ruh (Geist)")

    # -------------------------------------------------------------
    # 7. 20. YÜZYIL FELSEFESİ (ÇAĞDAŞ FELSEFE) (Felsefe 4 Odaklı)
    # -------------------------------------------------------------
    if any(k in t for k in ['fenomenoloji', 'edmund husserl', 'paranteze alma', 'öz', 'varoluşçuluk', 'egzistansiyalizm', 'jean paul sartre', 'varoluş özden önce gelir', 'kierkegaard', 'nietzsche', 'üstinsan', 'böyle buyurdu zerdüşt']):
        return ("20. Yüzyıl Çağdaş Felsefesi", "Varoluşçuluk (Sartre, Nietzsche) ve Fenomenoloji (Husserl)")

    if any(k in t for k in ['hermeneutik', 'yorumbilim', 'dilthey', 'gadamer', 'mantıkçı pozitivizm', 'moritz schlick', 'rudolf carnap', 'doğrulanabilirlik', 'karl marx', 'tarihsel materyalizm', 'diyalektik materyalizm']):
        return ("20. Yüzyıl Çağdaş Felsefesi", "Hermeneutik, Mantıkçı Pozitivizm ve Diyalektik Materyalizm")

    # Fallbacks based on course levels
    if ders == 'FELSEFE – 1':
        return ("Felsefeyi Tanıma", "Felsefenin Anlamı, Doğuşu ve Bilgelik Arayışı (Hikmet)")
    elif ders == 'FELSEFE – 2':
        return ("Varlık Felsefesi (Ontoloji)", "Varlığın Mahiyeti ve Temel Varlık Yaklaşımları (İdealizm, Materyalizm, Düalizm)")
    elif ders == 'FELSEFE – 3':
        return ("İlk Çağ Felsefesi", "Doğa Felsefesi ve Arkhe (İlk Neden) Problemi")
    else:
        return ("18.-19. Yüzyıl Aydınlanma Felsefesi", "Immanuel Kant: Kritisizm (Eleştirel Felsefe) ve Ödev Ahlakı")


def main():
    print("=" * 60)
    print("🏛️ FELSEFE (Felsefe 1 - 4) ÇIKMIŞ SORU VE KESİŞİM İŞLEME MOTORU")
    print("=" * 60)

    with open('ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
        all_raw_questions = json.load(f)

    # Filtrele: Sadece zorunlu Felsefe dersleri (FELSEFE – 1, 2, 3, 4)
    felsefe_raw = [
        q for q in all_raw_questions 
        if 'FELSEFE' in q['ders'] and 'SEÇMELİ' not in q['ders']
    ]
    print(f"Toplam seçilen zorunlu Felsefe sorusu: {len(felsefe_raw)}")

    processed_questions = []
    course_counts = Counter()

    for q in felsefe_raw:
        qid = q['id']
        ders = q['ders']
        yil = q['yil']
        donem = q['donem']
        soru_no = q['soru_no']
        dogru_cevap = q['dogru_cevap'].strip().upper()

        course_counts[ders] += 1

        soru_temiz = clean_felsefe_text(q.get('soru', ''))
        secenekler_temiz = clean_felsefe_options(q.get('secenekler', {}))

        # Sınıflandır
        ana_konu, alt_konu = classify_felsefe(soru_temiz, secenekler_temiz, ders)

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
    out_path = 'ciktilar/analiz/felsefe_analizli_sorular_temiz.json'
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
    print(f"🎯 FELSEFE KADEMELERİ ARASI ORTAK KESİŞİM KÜMELERİ ({len(intersections)} Kesişen Alt Konu)")
    print("=" * 60)

    for idx, item in enumerate(intersections, 1):
        c_details = ", ".join([f"{c.replace('FELSEFE – ', 'FEL-')}: {cnt}" for c, cnt in sorted(item['courses'].items())])
        sub_name = [k for k, v in topic_map.items() if v == item][0]
        print(f"{idx}. ÜNİTE: {item['ana_konu']}")
        print(f"   ► Alt Konu: {sub_name}")
        print(f"   ► Toplam: {item['count']} soru | Dağılım: [{c_details}]")
        print()

    # Şimdi tum_analizli_sorular_temiz.json ile birleştir
    with open('ciktilar/analiz/tum_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        existing_tum = json.load(f)

    # Varsa eski Felsefe sorularını temizle, yenilerini ekle
    existing_tum = [q for q in existing_tum if 'FELSEFE' not in q['ders']]
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
        elif 'FELSEFE' in d: total_by_subject['Felsefe'] += 1
        else: total_by_subject[d] += 1

    print("=" * 60)
    print(f"🚀 GÜNCEL GENEL SORU HAVUZU: Toplam {len(existing_tum)} Soru!")
    print(f"Dağılım: {dict(total_by_subject)}")
    print("=" * 60)

if __name__ == '__main__':
    main()
