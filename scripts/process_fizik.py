#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_fizik.py
FİZİK (Fizik 1 - 4) Zorunlu Ortak Dersleri Analiz ve Temizleme Scripti
- Kapsam: FİZİK – 1, FİZİK – 2, FİZİK – 3, FİZİK – 4 (328 soru)
- Seçmeli dersler dahil edilmez (yalnızca zorunlu ortak kültür dersleri).
- MEB Fizik Dersi Öğretim Programı ünite ve kazanım hiyerarşisi uygulanır.
- Kesişim kümeleri taranır ve raporlanır.
"""

import json
import re
from collections import defaultdict, Counter

# Tamir edilecek soru sözlüğü (OCR tablosundan / görselinden dolayı seçenekleri eksik kalmış sorular)
FIZIK_REPAIRS = {
    205: {
        'soru_temiz': "Katı bir cisme ait kütle-hacim değerleri tablodaki gibidir:\n• Kütle (g): 21, 42, 84\n• Hacim (cm³): 3, 6, 12\n\nBuna göre cisme ait özkütle-hacim grafiği aşağıdakilerden hangisidir?",
        'secenekler_temiz': {
            'A': 'Özkütlesi 0\'dan 7\'ye doğru doğrusal artan grafik',
            'B': 'Hacim arttıkça özkütlesi 7 g/cm³\'te sabit kalan yatay doğru grafiği',
            'C': 'Özkütlesi 7\'den 0\'a doğru azalan grafik',
            'D': 'Özkütlesi hacimle parabolik değişen eğri grafik'
        }
    },
    2267: {
        'soru_temiz': "Aşağıdakilerden hangisi iş birimi olan joule’e eşittir?",
        'secenekler_temiz': {
            'A': 'N · m',
            'B': 'm/s²',
            'C': 'kg',
            'D': 'J/m'
        }
    },
    2290: {
        'soru_temiz': "Periyot ve frekans kavramları arasında T · f = 1 ilişkisi vardır.\n\nBuna göre, frekansı 3 s⁻¹ olan dalganın periyodu kaç saniyedir?",
        'secenekler_temiz': {
            'A': '1/3',
            'B': '1/2',
            'C': '2',
            'D': '3'
        }
    },
    3224: {
        'soru_temiz': "Eşit bölmelendirilmiş düzlemde K ve L vektörleri verilmiştir:\n• K vektörü: Sağa doğru 2 birim, yukarı doğru 1 birim (2, 1)\n• L vektörü: Sağa doğru 1 birim, aşağı doğru 2 birim (1, -2)\n\nBuna göre, K + L vektörlerinin bileşkesi aşağıdakilerden hangisidir?",
        'secenekler_temiz': {
            'A': 'Sola doğru 1 birim, yukarı 1 birim',
            'B': 'Sağa doğru 1 birim, yukarı 3 birim',
            'C': 'Sola doğru 2 birim, aşağı 1 birim',
            'D': 'Sağa doğru 3 birim, aşağı doğru 1 birim'
        }
    },
    3731: {
        'soru_temiz': "Şekildeki elektrik devresinde ampuller özdeş olup her birinin direnci R’dir. Devrede 6 adet özdeş direnç birbirine seri bağlanmıştır.\n\nBuna göre, devrenin eşdeğer direnci kaç R’dir?",
        'secenekler_temiz': {
            'A': '6',
            'B': '3',
            'C': '4/3',
            'D': '3/4'
        }
    },
    5111: {
        'soru_temiz': "Özdeş piller ve özdeş lambalarla kurulan elektrik devrelerinin hangisinde lamba en parlak yanar?",
        'secenekler_temiz': {
            'A': '1 adet pile bağlı tek lamba',
            'B': 'Paralel bağlı 2 pile bağlı lamba',
            'C': 'Birbirine ters bağlı 2 pilli devre',
            'D': 'Seri ve düz bağlı 4 pilli devredeki lamba'
        }
    },
    5982: {
        'soru_temiz': "Birim karelere bölünmüş düzlemde yukarı doğru 2 birim büyüklüğünde K vektörü verilmiştir.\n\nBuna göre, 3/2 · K vektörü aşağıdakilerden hangisidir?",
        'secenekler_temiz': {
            'A': 'Yukarı doğru 1 birim',
            'B': 'Yukarı doğru 2 birim',
            'C': 'Yukarı doğru 3 birim',
            'D': 'Aşağı doğru 3 birim'
        }
    },
    6506: {
        'soru_temiz': "Odak noktası f olan yakınsak (ince kenarlı) merceğe asal eksene paralel bir ışık ışını gönderiliyor.\n\nBuna göre, ışığın mercekte kırıldıktan sonra izlediği yol aşağıdakilerin hangisinde doğru verilmiştir?",
        'secenekler_temiz': {
            'A': 'Kendi üzerinden geri yansır.',
            'B': 'Merceğin merkezinden kırılmadan geçer.',
            'C': 'Asal eksene paralel yoluna devam eder.',
            'D': 'Diğer taraftaki odak noktasından (f) geçecek şekilde kırılır.'
        }
    },
    7867: {
        'soru_temiz': "Aynı referans noktasından yatay doğrultuda hareket eden K, L ve M araçlarının ardışık 1., 2. ve 3. saniyelerdeki aldıkları yollar tabloda verilmiştir:\n• K: 1. sn 10 m, 2. sn 20 m, 3. sn 30 m\n• L: 1. sn 3 m, 2. sn 6 m, 3. sn 10 m\n\nBuna göre, eşit zaman aralıklarında eşit yollar alarak sabit hızlı hareket yapan araç hangisidir?",
        'secenekler_temiz': {
            'A': 'Yalnız K',
            'B': 'Yalnız L',
            'C': 'K ve L',
            'D': 'L ve M'
        }
    },
    7868: {
        'soru_temiz': "K noktasından N noktasına giden bir oyuncak araba, K noktasından harekete başlayıp L noktasına kadar belirli bir hız değerine ulaşıyor. Araba bu hızla L noktası ile M noktası arasını gittikten sonra M noktasından itibaren yavaşlayarak N noktasında duruyor.\n\nBuna göre oyuncak arabayla ilgili,\nI. K ve L arasında hız değişimi sıfırdan farklıdır.\nII. L ve M arasında hız değişiminin büyüklüğü sıfırdır.\nIII. M ve N arasında ivme sıfırdır.\n\nyargılarından hangileri doğrudur?",
        'secenekler_temiz': {
            'A': 'Yalnız I',
            'B': 'I ve II',
            'C': 'II ve III',
            'D': 'I, II ve III'
        }
    },
    7869: {
        'soru_temiz': "Yatay doğrultuda düzgün hızlanan bir araca ait hız-zaman değerleri tablosunda hız 1. saniyede 2 m/s, 2. saniyede 4 m/s, 3. saniyede 6 m/s olarak kaydedilmiştir.\n\nBuna göre ivmesi sabit olan bu aracın 7. saniyedeki hızı kaç m/s'dir?",
        'secenekler_temiz': {
            'A': '12',
            'B': '14',
            'C': '16',
            'D': '18'
        }
    },
    9227: {
        'soru_temiz': "Doğrusal bir yolda birbirine doğru sabit hızlarla hareket eden Ayşe (+3 m/s) ve Oya (-2 m/s) t = 0 anında karşılaşıp aynı hızla yollarına devam etmektedir.\n\nBuna göre, karşılaşma anından itibaren 5 s’lik hareketlerine ait v-t (hız-zaman) grafiği aşağıdakilerden hangisidir?",
        'secenekler_temiz': {
            'A': 'Her iki hareketlinin hızı pozitif bölgede sabit grafik',
            'B': 'Her iki hareketlinin hızı zamanla artan grafik',
            'C': 'Karşılaşmadan sonra sıfıra inen hız grafiği',
            'D': 'Ayşe için v = +3 m/s sabit, Oya için v = -2 m/s sabit yatay doğru grafiği'
        }
    },
    10615: {
        'soru_temiz': "Derinliği her yerinde aynı olan bir dalga leğeninde KL doğrusal su dalgası t sürede 1. engele çarparak ilerlemektedir.\n\nBuna göre 6t süre sonra su dalgasının konumu ve uçlarının durumu aşağıdakilerden hangisidir?",
        'secenekler_temiz': {
            'A': 'K ucu önde yansıyan doğrusal dalga',
            'B': 'L ucu önde yansıyan doğrusal dalga',
            'C': 'Dairesel yayılan dalga',
            'D': 'Engeli aşamayan durgun su'
        }
    }
}

def clean_fizik_text(text):
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'[ \t]+', ' ', t)
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    cleaned = '\n'.join(lines)
    return cleaned

def clean_fizik_options(secenekler):
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

def classify_fizik(soru_text, secenekler, ders):
    """
    MEB Fizik müfredatına göre ana_konu ve alt_konu atar.
    """
    full_text = soru_text + " " + " ".join(secenekler.values())
    t = full_text.lower()
    
    # -------------------------------------------------------------
    # 1. FİZİK BİLİMİNE GİRİŞ
    # -------------------------------------------------------------
    if any(k in t for k in ['fizik biliminin çalışma', 'fiziğin alt dal', 'mekanik', 'termodinamik', 'elektromanyetizma', 'optik', 'katıhal fiziği', 'atom ve molekül fiziği', 'nükleer fizik', 'yüksek enerji ve plazma']):
        if 'ayna' not in t and 'mercek' not in t and 'dalga' not in t:
            return ("Fizik Bilimine Giriş", "Fiziğin Tanımı ve Alt Dalları (Mekanik, Optik, Termodinamik)")

    if any(k in t for k in ['temel büyüklük', 'türetilmiş büyüklük', 'skaler', 'vektörel', 'kütle, ışık şiddeti', 'sıcaklık, akım', 'si birim sistemi', 'kamyonet', 'kısa muz']):
        return ("Fizik Bilimine Giriş", "Fiziksel Büyüklükler (Temel ve Türetilmiş, Skaler ve Vektörel)")

    if any(k in t for k in ['vektör', 'bileşke vektör', 'vektörlerin toplanması', 'k ve l vektör']):
        return ("Fizik Bilimine Giriş", "Vektörler ve Bileşke Vektör Hesaplamaları")

    if any(k in t for k in ['tübitak', 'cern', 'nasa', 'aselsan', 'taek', 'esa', 'bilimsel araştırma merkez']):
        return ("Fizik Bilimine Giriş", "Bilimsel Araştırma Merkezleri (TÜBİTAK, CERN, NASA, ASELSAN)")

    # -------------------------------------------------------------
    # 2. MADDE VE ÖZELLİKLERİ
    # -------------------------------------------------------------
    if any(k in t for k in ['özkütle', 'yoğunluk', 'kütle-hacim', 'd = m/v', 'taşırma kabı', 'dereceli silindir']):
        return ("Madde ve Özellikleri", "Kütle, Hacim ve Özkütle (d = m/V)")

    if any(k in t for k in ['dayanıklılık', 'boyutlar arasındaki ilişki', 'kesit alanı/hacim']):
        return ("Madde ve Özellikleri", "Katılarda Dayanıklılık ve Boyut İlişkileri")

    if any(k in t for k in ['adezyon', 'kohezyon', 'yüzey gerilimi', 'kılcallık', 'ıslatma', 'su damlası', 'böceğin su üstünde', 'kumaşın suyu emmesi', 'civa damlası']):
        return ("Madde ve Özellikleri", "Sıvılarda Adezyon, Kohezyon, Yüzey Gerilimi ve Kılcallık")

    # -------------------------------------------------------------
    # 3. HAREKET VE KUVVET
    # -------------------------------------------------------------
    if any(k in t for k in ['konum', 'alınan yol', 'yer değiştirme', 'hız', 'sürat', 'ortalama hız', 'ortalama sürat', 'sabit hızlı']):
        if 'grafiği' not in t and 'ivme' not in t:
            return ("Hareket ve Kuvvet", "Konum, Alınan Yol, Yer Değiştirme, Sürat ve Hız")

    if any(k in t for k in ['ivme', 'hız-zaman', 'konum-zaman', 'ivme-zaman', 'v-t grafiği', 'x-t grafiği', 'düzgün hızlanan', 'düzgün yavaşlayan']):
        return ("Hareket ve Kuvvet", "Doğrusal Hareket Grafikleri (Hız-Zaman ve İvme)")

    if any(k in t for k in ['kuvvet', 'temas gerektiren', 'temas gerektirmeyen', 'etki-tepki', 'eylemsizlik', 'f = m.a', 'net kuvvet', 'newton’ın hareket']):
        return ("Hareket ve Kuvvet", "Newton’ın Hareket Yasaları (Eylemsizlik, Temel Yasa, Etki-Tepki)")

    if any(k in t for k in ['sürtünme kuvveti', 'statik sürtünme', 'kinetik sürtünme', 'sürtünme katsayısı', 'fs = k.n']):
        return ("Hareket ve Kuvvet", "Sürtünme Kuvveti ve Etkileri")

    # -------------------------------------------------------------
    # 4. ENERJİ
    # -------------------------------------------------------------
    if any(k in t for k in ['yapılan iş', 'iş birimi', 'joule', 'fiziksel anlamda iş', 'w = f.x', 'güç', 'watt', 'p = w/t']):
        return ("Enerji", "İş, Güç ve Enerji Kavramı")

    if any(k in t for k in ['kinetik enerji', 'potansiyel enerji', 'mekanik enerji', 'yerçekimi potansiyel', 'esneklik potansiyel', 'enerjinin korunumu']):
        return ("Enerji", "Mekanik Enerji, Kinetik ve Potansiyel Enerji Dönüşümleri")

    if any(k in t for k in ['verim', 'enerji verimliliği', 'harcanan enerji', 'yapılan yararlı iş']):
        return ("Enerji", "Enerji Verimliliği ve Verim Hesaplamaları")

    if any(k in t for k in ['yenilenebilir', 'yenilenemeyen', 'fosil yakıt', 'güneş enerjisi', 'rüzgar enerjisi', 'jeotermal', 'biyokütle', 'hidroelektrik', 'nükleer santral']):
        return ("Enerji", "Yenilenebilir ve Yenilenemeyen Enerji Kaynakları")

    # -------------------------------------------------------------
    # 5. ISI VE SICAKLIK
    # -------------------------------------------------------------
    if any(k in t for k in ['ısı ve sıcaklık', 'termometre', 'celcius', 'kelvin', 'fahrenheit', 'iç enerji', 'öz ısı', 'ısı sığası', 'q = m.c.δt']):
        return ("Isı ve Sıcaklık", "Isı, Sıcaklık, İç Enerji ve Termometreler")

    if any(k in t for k in ['hal değişimi', 'erime ısısı', 'buharlaşma ısısı', 'erime noktası', 'kaynama noktası', 'q = m.l', 'ısıl denge']):
        return ("Isı ve Sıcaklık", "Hal Değişimi, Isıl Denge ve Isı Alışverişi")

    if any(k in t for k in ['ısı iletim hızı', 'iletim', 'konveksiyon', 'ışıma', 'radyasyon', 'yalıtım', 'termos']):
        return ("Isı ve Sıcaklık", "Isının Yayılma Yolları (İletim, Konveksiyon, Işıma)")

    if any(k in t for k in ['genleşme', 'büzülme', 'boyca genleşme', 'alan ca genleşme', 'hacimce genleşme', 'metal çifti']):
        return ("Isı ve Sıcaklık", "Katı, Sıvı ve Gazlarda Genleşme")

    # -------------------------------------------------------------
    # 6. ELEKTROSTATİK & ELEKTRİK DEVRELERİ & MANYETİZMA
    # -------------------------------------------------------------
    if any(k in t for k in ['elektroskop', 'sürtünme ile elektriklenme', 'dokunma ile elektriklenme', 'etki ile elektriklenme', 'coulomb', 'yüklü iletken küre', 'topraklama', 'nötr cisim']):
        return ("Elektrostatik", "Elektrik Yükleri, Yüklenme Çeşitleri ve Elektroskop")

    if any(k in t for k in ['elektrik akımı', 'potansiyel fark', 'voltmetre', 'ampermetre', 'direnç', 'ohm kanunu', 'v = i.r', 'reosta']):
        return ("Elektrik ve Manyetizma", "Elektrik Akımı, Direnç ve Ohm Kanunu (V = I·R)")

    if any(k in t for k in ['eşdeğer direnç', 'seri bağlama', 'paralel bağlama', 'lamba parlaklığı', 'özdeş lamba', 'üreteçlerin bağlanması']):
        return ("Elektrik ve Manyetizma", "Dirençlerin ve Üreteçlerin Bağlanması, Devre Çözümleri")

    if any(k in t for k in ['elektriksel güç', 'elektriksel enerji', 'e = v.i.t', 'p = i^2.r', 'kilovatsaat', 'fatura']):
        return ("Elektrik ve Manyetizma", "Elektriksel Enerji ve Güç")

    if any(k in t for k in ['mıknatıs', 'manyetik alan', 'manyetik kutup', 'pusula', 'akım geçen tel', 'manyetik kuvvet', 'n ve s kutbu']):
        return ("Elektrik ve Manyetizma", "Mıknatıslar ve Manyetik Alan Özellikleri")

    # -------------------------------------------------------------
    # 7. BASINÇ VE KALDIRMA KUVVETİ
    # -------------------------------------------------------------
    if any(k in t for k in ['katı basıncı', 'p = g/s', 'yüzey alanı ve basınç', 'piezoelektrik']):
        return ("Basınç ve Kaldırma Kuvveti", "Katı Basıncı ve Özellikleri")

    if any(k in t for k in ['sıvı basıncı', 'p = h.d.g', 'pascal prensibi', 'su cenderesi', 'u borusu', 'bileşik kap']):
        return ("Basınç ve Kaldırma Kuvveti", "Durgun Sıvı Basıncı ve Pascal Prensibi")

    if any(k in t for k in ['gaz basıncı', 'açık hava basıncı', 'torricelli', 'barometre', 'manometre', 'kapalı kap gaz basıncı']):
        return ("Basınç ve Kaldırma Kuvveti", "Açık Hava ve Gaz Basıncı (Torricelli Deneyi)")

    if any(k in t for k in ['kaldırma kuvveti', 'arşimet', 'fk = v_batan . d_sıvı', 'batan hacim', 'yüzen cisim', 'askıda kalan', 'batan cisim']):
        return ("Basınç ve Kaldırma Kuvveti", "Sıvıların Kaldırma Kuvveti ve Yüzme Şartları")

    # -------------------------------------------------------------
    # 8. DALGALAR
    # -------------------------------------------------------------
    if any(k in t for k in ['dalga boyu', 'frekans', 'periyot', 't.f = 1', 'v = λ.f', 'enine dalga', 'boyuna dalga', 'mekanik dalga', 'elektromanyetik dalga']):
        return ("Dalgalar", "Dalgaların Temel Değişkenleri (Periyot, Frekans, Hız, Dalga Boyu)")

    if any(k in t for k in ['yay dalgaları', 'atmanın yansıması', 'sabit uç', 'serbest uç', 'ince yay', 'kalın yay', 'iletim ve yansıma']):
        return ("Dalgalar", "Yay Dalgaları ve Atmaların İlerlemesi")

    if any(k in t for k in ['su dalgaları', 'dalga leğeni', 'stroboskop', 'düzlem engelden yansıma', 'parabolik engel', 'derin ve sığ ortam']):
        return ("Dalgalar", "Su Dalgaları, Yansıma ve Ortam Değişimi (Derin/Sığ)")

    if any(k in t for k in ['ses dalgaları', 'sesin yüksekliği', 'sesin şiddeti', 'tını', 'rezonans', 'yankı', 'ultrason', 'sonar', 'doppler']):
        return ("Dalgalar", "Ses Dalgaları ve Özellikleri (Tını, Şiddet, Rezonans)")

    if any(k in t for k in ['deprem dalgaları', 'fay hattı', 'sismograf', 'richter', 'tsunami']):
        return ("Dalgalar", "Deprem Dalgaları ve Korunma Yolları")

    # -------------------------------------------------------------
    # 9. OPTİK
    # -------------------------------------------------------------
    if any(k in t for k in ['aydınlanma şiddeti', 'ışık akısı', 'fotometre', 'noktasal ışık kaynağı', 'lamba ışığı']):
        return ("Optik", "Aydınlanma, Işık Şiddeti ve Işık Akısı")

    if any(k in t for k in ['gölge', 'yarı gölge', 'noktasal kaynak', 'küresel ışık', 'güneş tutulması', 'ay tutulması']):
        return ("Optik", "Gölge ve Yarı Gölge Oluşumu")

    if any(k in t for k in ['düzlem ayna', 'aynada görüntü', 'görüş alanı', 'simetrik görüntü', 'yansıma kanunları']):
        return ("Optik", "Düzlem Aynalar, Yansıma ve Görüş Alanı")

    if any(k in t for k in ['küresel ayna', 'çukur ayna', 'tümsek ayna', 'odak uzaklığı', 'asal eksen', 'merkez noktası']):
        return ("Optik", "Küresel Aynalar (Çukur ve Tümsek Aynada Görüntü)")

    if any(k in t for k in ['ışığın kırılması', 'snell', 'kırılma indisi', 'sınır açısı', 'tam yansıma', 'serap olayı', 'fiber optik']):
        return ("Optik", "Işığın Kırılması, Kırılma İndisi ve Tam Yansıma")

    if any(k in t for k in ['mercek', 'ince kenarlı mercek', 'kalın kenarlı mercek', 'yakınsak', 'ıraksak', 'göz kusurları', 'miyop', 'hipermetrop']):
        return ("Optik", "Mercekler ve Merceklerde Işığın Kırılması")

    if any(k in t for k in ['prizma', 'ışığın renklerine ayrılması', 'ana renkler', 'ara renkler', 'kırmızı, yeşil, mavi', 'filtreler']):
        return ("Optik", "Prizmalar ve Işıkta Renk Olayları")

    # Fallbacks based on course
    if ders == 'FİZİK – 1':
        return ("Fizik Bilimine Giriş", "Fiziksel Büyüklükler (Temel ve Türetilmiş, Skaler ve Vektörel)")
    elif ders == 'FİZİK – 2':
        return ("Enerji", "İş, Güç ve Enerji Kavramı")
    elif ders == 'FİZİK – 3':
        return ("Elektrik ve Manyetizma", "Elektrik Akımı, Direnç ve Ohm Kanunu (V = I·R)")
    else:
        return ("Dalgalar", "Dalgaların Temel Değişkenleri (Periyot, Frekans, Hız, Dalga Boyu)")


def main():
    print("=" * 60)
    print("⚡ FİZİK (Fizik 1 - 4) ÇIKMIŞ SORU VE KESİŞİM İŞLEME MOTORU")
    print("=" * 60)

    with open('ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
        all_raw_questions = json.load(f)

    # Filtrele: Sadece zorunlu Fizik dersleri (FİZİK – 1, 2, 3, 4)
    fizik_raw = [
        q for q in all_raw_questions 
        if 'FİZİK' in q['ders'] and 'SEÇMELİ' not in q['ders']
    ]
    print(f"Toplam seçilen zorunlu Fizik sorusu: {len(fizik_raw)}")

    processed_questions = []
    course_counts = Counter()

    for q in fizik_raw:
        qid = q['id']
        ders = q['ders']
        yil = q['yil']
        donem = q['donem']
        soru_no = q['soru_no']
        dogru_cevap = q['dogru_cevap'].strip().upper()

        course_counts[ders] += 1

        # Tamir kontrolü
        if qid in FIZIK_REPAIRS:
            rep = FIZIK_REPAIRS[qid]
            soru_temiz = rep['soru_temiz']
            secenekler_temiz = rep['secenekler_temiz']
        else:
            soru_temiz = clean_fizik_text(q.get('soru', ''))
            secenekler_temiz = clean_fizik_options(q.get('secenekler', {}))

        # Sınıflandır
        ana_konu, alt_konu = classify_fizik(soru_temiz, secenekler_temiz, ders)

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
    out_path = 'ciktilar/analiz/fizik_analizli_sorular_temiz.json'
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
    print(f"🎯 FİZİK KADEMELERİ ARASI ORTAK KESİŞİM KÜMELERİ ({len(intersections)} Kesişen Alt Konu)")
    print("=" * 60)

    for idx, item in enumerate(intersections, 1):
        c_details = ", ".join([f"{c.replace('FİZİK – ', 'FİZ-')}: {cnt}" for c, cnt in sorted(item['courses'].items())])
        sub_name = [k for k, v in topic_map.items() if v == item][0]
        print(f"{idx}. ÜNİTE: {item['ana_konu']}")
        print(f"   ► Alt Konu: {sub_name}")
        print(f"   ► Toplam: {item['count']} soru | Dağılım: [{c_details}]")
        print()

    # Şimdi tum_analizli_sorular_temiz.json ile birleştir
    with open('ciktilar/analiz/tum_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        existing_tum = json.load(f)

    # Varsa eski Fizik sorularını temizle, yenilerini ekle
    existing_tum = [q for q in existing_tum if 'FİZİK' not in q['ders']]
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
        else: total_by_subject[d] += 1

    print("=" * 60)
    print(f"🚀 GÜNCEL GENEL SORU HAVUZU: Toplam {len(existing_tum)} Soru!")
    print(f"Dağılım: {dict(total_by_subject)}")
    print("=" * 60)

if __name__ == '__main__':
    main()
