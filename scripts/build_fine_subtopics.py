#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_fine_subtopics.py
MEB Talim Terbiye ve Açık Öğretim Lisesi (AÖL) en güncel müfredatına ve soru dağılımına göre:
- Coğrafya (COĞ 1, 2, 3, 4)
- Türk Dili ve Edebiyatı (TDE 1, 2, 3, 4, 5, 6, 7, 8)
- Matematik (MAT 1, 2, 3, 4)
derslerindeki soruları en ince "ALT KONU" (mikro-kazanım) seviyesine kadar sınıflandırır,
kurslarda 40-50 dakikalık ortak derslerde çözülebilecek "HAP ETÜT PAKETLERİ" üretir.
"""

import json, re, os
from collections import defaultdict

def normalize_text(text):
    if not text:
        return ""
    text = re.sub(r'-\s*\n\s*', '', text)  # Satır sonu tirelerini birleştir
    text = re.sub(r'\s+', ' ', text)       # Boşlukları düzenle
    return text.lower()

# ==============================================================================
# 1. COĞRAFYA KAZANIM TANIMLARI
# ==============================================================================
COGRAFYA_SUBTOPICS = [
    # Doğa ve İnsan
    ("Doğa, İnsan ve Coğrafya", "Coğrafyanın Bölümleri ve İlkeleri", [
        r'fiziki coğrafya', r'beşerî coğrafya', r'beşeri coğrafya', r'jeomorfoloji',
        r'klimatoloji', r'hidrografya', r'biyocoğrafya', r'kartografya', r'dağılış ilkesi',
        r'nedensellik', r'ilgi ilkesi', r'cbs\b', r'coğrafi bilgi'
    ]),
    ("Doğa, İnsan ve Coğrafya", "Doğa ve İnsan Etkileşimi", [
        r'doğa ve insan', r'doğanın insan', r'insanın doğa', r'doğal çevre', r'doğal ortam',
        r'ekolojik denge', r'doğal faktörler'
    ]),
    
    # Dünya ve Coğrafi Konum
    ("Dünya ve Coğrafi Konum", "Dünya'nın Şekli ve Geoit Olmasının Sonuçları", [
        r'geoit\b', r'dünyanın şekli', r'yer çekimi', r'kutuplardan basık', r'ekvatordan şişkin',
        r'çizgisel hız', r'açısal hız'
    ]),
    ("Dünya ve Coğrafi Konum", "Dünya'nın Hareketleri, Eksen Eğikliği ve Mevsimler", [
        r'eksen eğikliği', r'günlük hareket', r'yıllık hareket', r'mevsim', r'ekinoks',
        r'21 mart', r'23 eylül', r'21 haziran', r'21 aralık', r'günöte', r'günberi',
        r'aydınlanma çemberi', r'gece ve gündüz', r'gece-gündüz', r'gölge boyu'
    ]),
    ("Dünya ve Coğrafi Konum", "Koordinat Sistemi ve Yerel Saat Hesaplamaları", [
        r'paralel\b', r'meridyen', r'enlem\b', r'boylam\b', r'yerel saat', r'ortak saat',
        r'ulusal saat', r'saat dilimi', r'başlangıç meridyeni', r'koordinat', r'tarih değiştirme'
    ]),

    # Harita Bilgisi ve İzohipsler
    ("Harita Bilgisi ve İzohipsler", "Ölçekler, Harita Elemanları ve Projeksiyonlar", [
        r'ölçek\b', r'ölçekli', r'büyük ölçek', r'küçük ölçek', r'projeksiyon',
        r'silindirik projeksiyon', r'konik projeksiyon', r'düzlem projeksiyon',
        r'lejant', r'bozulma oranı', r'kroki'
    ]),
    ("Harita Bilgisi ve İzohipsler", "İzohipsler ve Yeryüzü Şekilleri (Profil Çıkarma)", [
        r'izohips', r'eşyükselti', r'sırt\b', r'vadi\b', r'boyun\b', r'çanak\b',
        r'kapalı çukur', r'falez', r'tepe\b', r'doruk\b', r'profil çıkarma', r'profil',
        r'eğim\b', r'renklendirme yöntemi'
    ]),

    # İklim Bilgisi ve Atmosfer
    ("İklim Bilgisi ve Atmosfer", "Atmosferin Katmanları ve Gazlar", [
        r'atmosfer', r'troposfer', r'stratosfer', r'mezosfer', r'termosfer', r'ozon\b',
        r'hava durumu', r'meteoroloji'
    ]),
    ("İklim Bilgisi ve Atmosfer", "Sıcaklık ve Sıcaklığı Etkileyen Faktörler", [
        r'sıcaklık\b', r'izoterm', r'güneşlenme', r'bakı\b', r'yükselti.*sıcaklık',
        r'denizellik', r'karasallık', r'sıcaklık terselmesi'
    ]),
    ("İklim Bilgisi ve Atmosfer", "Basınç Kuşakları ve Rüzgârlar", [
        r'basınç\b', r'alçak basınç', r'yüksek basınç', r'barometre', r'rüzgâr', r'rüzgar',
        r'alize', r'batı rüzgâr', r'kutup rüzgâr', r'muson', r'meltem', r'fön\b'
    ]),
    ("İklim Bilgisi ve Atmosfer", "Nem, Yoğunlaşma ve Yağış Tipleri", [
        r'bağıl nem', r'mutlak nem', r'maksimum nem', r'yoğunlaşma', r'sis\b', r'bulut\b',
        r'orografik', r'yamaç yağış', r'konveksiyonel', r'yükselim yağış', r'cephe yağış', r'cephesel'
    ]),
    ("İklim Bilgisi ve Atmosfer", "Büyük İklim Tipleri ve Dağılışı (Makroklima)", [
        r'akdeniz iklimi', r'karasal iklim', r'ekvatoral iklim', r'çöl iklimi',
        r'tundra iklimi', r'step iklimi', r'muson iklimi', r'okyanusal iklim',
        r'savana iklimi', r'iklim tipi', r'makroklima'
    ]),

    # Yerin Yapısı, Kayaçlar ve İç Kuvvetler
    ("Yerin Yapısı ve İç Kuvvetler", "Yerin Katmanları ve Kayaç Türleri", [
        r'litosfer', r'manto\b', r'çekirdek\b', r'kayaç', r'püskürük', r'magmatik',
        r'granit', r'bazalt', r'tortul', r'kalker', r'kireç taşı', r'başkalaşım',
        r'metamorfik', r'mermer', r'jeolojik zaman'
    ]),
    ("Yerin Yapısı ve İç Kuvvetler", "İç Kuvvetler: Orojenez, Epirojenez, Volkanizma ve Depremler", [
        r'orojenez', r'epirojenez', r'levha\b', r'fay\b', r'fay hattı', r'tektonik',
        r'deprem', r'volkan', r'magma', r'kaldera', r'krater', r'maar\b', r'tsunami',
        r'kıta oluşumu', r'dağ oluşumu'
    ]),

    # Dış Kuvvetler ve Yeryüzü Şekilleri
    ("Dış Kuvvetler", "Akarsu Aşınım ve Birikim Şekilleri", [
        r'akarsu', r'vadi\b', r'delta\b', r'menderes', r'dev kazanı', r'kırgıbayır',
        r'peribacası', r'peneplen', r'birikinti konisi', r'denge profili', r'taban seviyesi', r'havza'
    ]),
    ("Dış Kuvvetler", "Karstik, Rüzgâr, Buzul ve Dalga-Kıyı Şekilleri", [
        r'karstik', r'lapya', r'dolin', r'uvala', r'polye', r'obruk', r'traverten',
        r'mantar kaya', r'tafoni', r'barkan', r'lös\b', r'buzul\b', r'moren', r'hörgüç',
        r'falez', r'tombolo', r'kıyı tipi', r'fiyort', r'ria\b', r'dalmaçya', r'lagün'
    ]),

    # Su, Toprak ve Bitki Varlığı
    ("Su, Toprak ve Bitki Varlığı", "Su Kaynakları (Denizler, Göller ve Kaynaklar)", [
        r'göl\b', r'göller', r'deniz\b', r'okyanus', r'hidrosfer', r'kaynak\b',
        r'gayzer', r'artezyen', r'voklüz', r'yeraltı suyu', r'tektonik göl', r'karstik göl'
    ]),
    ("Su, Toprak ve Bitki Varlığı", "Toprak Türleri ve Oluşum Süreçleri", [
        r'toprak\b', r'humus\b', r'çernezyom', r'podzol', r'laterit', r'terrarossa',
        r'terra rossa', r'alüvyal', r'zonal toprak', r'intrazonal', r'azonal'
    ]),
    ("Su, Toprak ve Bitki Varlığı", "Bitki Toplulukları ve Biyomlar", [
        r'bitki örtüsü', r'biyom\b', r'flora\b', r'fauna\b', r'bozkır\b', r'step\b',
        r'maki\b', r'orman\b', r'tayga', r'savan\b', r'çayır\b', r'ot topluluğu'
    ]),

    # Nüfus, Yerleşme ve Göç
    ("Nüfus, Yerleşme ve Göç", "Nüfus Piramitleri ve Demografik Özellikler", [
        r'nüfus piramidi', r'nüfus piramitleri', r'piramit', r'yaş grubu', r'bağımlı nüfus',
        r'nüfus artış hızı', r'nüfus yoğunluğu', r'demograf', r'doğum oranı', r'ölüm oranı',
        r'nüfus sayımı', r'nüfus artışı', r'nüfus patlaması', r'nüfus sıçraması', r'nüfus politikası'
    ]),
    ("Nüfus, Yerleşme ve Göç", "Göç Türleri, Nedenleri ve Sonuçları", [
        r'göç\b', r'göçler', r'mülteci', r'sığınmacı', r'beyin göçü', r'mevsimlik göç',
        r'iç göç', r'dış göç', r'itici faktör', r'çekici faktör', r'işçi göçü'
    ]),
    ("Nüfus, Yerleşme ve Göç", "Kırsal ve Kentsel Yerleşme Dokuları (Mesken Tipleri)", [
        r'yerleşme', r'yerleşim', r'kırsal yerleşme', r'toplu yerleşme', r'dağınık yerleşme',
        r'mesken\b', r'kerpiç\b', r'ahşap mesken', r'taş mesken', r'konut tipi', r'köy altı',
        r'ilk çağ.*yerleş'
    ]),
    ("Nüfus, Yerleşme ve Göç", "Şehirlerin Fonksiyonları ve Etki Alanları", [
        r'şehir\b', r'kent\b', r'fonksiyon', r'idari şehir', r'dini şehir', r'sanayi şehri',
        r'liman şehri', r'maden şehri', r'küresel etki', r'bölgesel etki'
    ]),

    # Bölgeler, Ulaşım ve Ekonomi
    ("Bölgeler, Ulaşım ve Ekonomi", "Bölge Türleri ve Kalkınma Projeleri", [
        r'bölge\b', r'bölgeler', r'şekilsel bölge', r'işlevsel bölge', r'doğal bölge',
        r'beşerî bölge', r'bölge sınırı', r'gap\b', r'dokap', r'kop\b', r'zbk\b'
    ]),
    ("Bölgeler, Ulaşım ve Ekonomi", "Ulaşım Ağları, Boğazlar ve Kanallar", [
        r'ulaşım', r'demiryolu', r'karayolu', r'denizyolu', r'havayolu', r'liman\b',
        r'boğaz\b', r'kanal\b', r'süveyş', r'panama', r'hürmüz', r'malakka', r'cebelitarık',
        r'babülmendep', r'korint', r'kiel\b'
    ]),
    ("Bölgeler, Ulaşım ve Ekonomi", "Ekonomik Sektörler, Tarım, Sanayi ve Madenler", [
        r'ekonomik faaliyet', r'birincil', r'ikincil', r'üçüncül', r'dördüncül', r'beşincil',
        r'tarım\b', r'hayvancılık', r'maden\b', r'sanayi\b', r'enerji kaynak', r'petrol',
        r'doğalgaz', r'kömür', r'linyit', r'demir\b', r'bor\b', r'bakır\b'
    ]),
    ("Bölgeler, Ulaşım ve Ekonomi", "Uluslararası Ticaret ve Turizm", [
        r'ticaret', r'ihracat', r'ithalat', r'dış ticaret', r'turizm\b', r'ham madde', r'pazar\b'
    ]),

    # Çevre ve Doğal Afetler
    ("Çevre, Afetler ve Jeopolitik", "Doğal Afetler ve Korunma Yolları", [
        r'doğal afet', r'afet\b', r'heyelan', r'sel\b', r'taşkın', r'erozyon', r'çığ\b',
        r'orman yangın', r'kuraklık', r'deprem zararı', r'afet yönetimi'
    ]),
    ("Çevre, Afetler ve Jeopolitik", "Küresel Çevre Sorunları ve İklim Değişikliği", [
        r'çevre kirlili', r'hava kirlili', r'su kirlili', r'sera gaz', r'küresel ısınma',
        r'iklim değişim', r'atık\b', r'zehirli', r'ozon tabakası', r'asit yağmuru',
        r'karbon ayak izi', r'sürdürülebilirlik'
    ]),
    ("Çevre, Afetler ve Jeopolitik", "Uluslararası Örgütler ve Küresel Jeopolitik", [
        r'uluslararası örgüt', r'küresel örgüt', r'birleşmiş milletler', r'bm\b', r'nato\b',
        r'avrupa birliği', r'jeopolitik', r'oecd', r'opec', r'islam işbirliği', r'd-8', r'g-20'
    ])
]

# ==============================================================================
# 2. TÜRK DİLİ VE EDEBİYATI KAZANIM TANIMLARI
# ==============================================================================
TDE_SUBTOPICS = [
    # Yazım ve Noktalama
    ("Yazım ve Noktalama", "Yazım Kuralları: Ekler ve Bağlaçlar ('de', 'ki', 'mi')", [
        r'\bde’nin yazımı', r'\bki’nin yazımı', r'\bmi’nin yazımı', r'\bde/da\b', r'\bki/bağlaç',
        r'\byazımı yanlıştır', r'\byazım yanlışı', r'altı çizili sözcüklerden hangisinin yazımı',
        r'yazım kuralı'
    ]),
    ("Yazım ve Noktalama", "Yazım Kuralları: Büyük Harfler, Sayılar ve Birleşik Kelimeler", [
        r'büyük harf', r'birleşik sözcük', r'birleşik kelime', r'ayrı yazıl', r'bitişik yazıl',
        r'kısaltma', r'sayıların yazımı', r'tarihlerin yazımı', r'kurum ve kuruluş'
    ]),
    ("Yazım ve Noktalama", "Noktalama İşaretleri: Virgül ve Noktalı Virgül", [
        r'virgül\b', r'noktalı virgül', r'virgülün kullanımı', r'noktalı virgülün kullanımı'
    ]),
    ("Yazım ve Noktalama", "Noktalama İşaretleri: İki Nokta, Nokta, Kesme ve Tırnak", [
        r'iki nokta', r'üç nokta', r'kesme işareti', r'tırnak işareti', r'yay ayraç',
        r'parantez', r'noktalama işareti', r'ayraçla belirtilen yerlere', r'soru işareti', r'ünlem işareti'
    ]),

    # Hikâye, Roman ve Anlatım
    ("Hikâye ve Roman", "Anlatıcı ve Bakış Açıları (İlahi, Kahraman, Gözlemci)", [
        r'bakış açısı', r'hâkim bakış', r'hakim bakış', r'ilahi bakış', r'tanrısal bakış',
        r'kahraman bakış', r'gözlemci bakış', r'anlatıcı\b', r'birinci tekil', r'üçüncü tekil',
        r'anlatıcının bakış'
    ]),
    ("Hikâye ve Roman", "Hikâye Türleri ve Yapı Unsurları (Olay vs Durum)", [
        r'olay hikâyesi', r'durum hikâyesi', r'maupassant', r'çehov', r'serim\b', r'düğüm\b',
        r'çözüm\b', r'çatışma\b', r'mekân\b', r'zaman\b', r'olay örgüsü', r'küçürek hikâye', r'minimal hikâye'
    ]),
    ("Hikâye ve Roman", "Anlatım Teknikleri (Bilinç Akışı, İç Konuşma, Geriye Dönüş)", [
        r'iç konuşma', r'iç çözümleme', r'bilinç akışı', r'geriye dönüş', r'özetleme',
        r'pastiş', r'parodi', r'diyalog\b', r'monolog', r'montaj tekniği'
    ]),
    ("Hikâye ve Roman", "Roman Türleri, Akımlar ve Karakter Tahlili", [
        r'roman\b', r'romancı', r'tip ve karakter', r'psikolojik roman', r'tarihî roman',
        r'macera romanı', r'sosyal roman', r'klasisizm', r'romantizm', r'realizm', r'natüralizm'
    ]),

    # Şiir Bilgisi ve Edebi Sanatlar
    ("Şiir Bilgisi", "Kafiye (Uyak) Türleri ve Redif", [
        r'kafiye', r'uyak\b', r'redif', r'yarım kafiye', r'tam kafiye', r'zengin kafiye',
        r'cinaslı kafiye', r'düz kafiye', r'çapraz kafiye', r'sarma kafiye', r'mani tipi',
        r'kafiye şeması', r'kafiye örgüsü'
    ]),
    ("Şiir Bilgisi", "Ölçü, Nazım Birimi ve Ahenk Unsurları", [
        r'hece ölçüsü', r'aruz ölçüsü', r'serbest ölçü', r'durak\b', r'tef\'ile',
        r'nazım birimi', r'dörtlük', r'beyit', r'bent\b', r'aliterasyon', r'asonans'
    ]),
    ("Şiir Bilgisi", "Söz Sanatları (Edebi Sanatlar)", [
        r'teşbih', r'benzetme', r'istiare', r'eğretileme', r'teşhis', r'kişileştirme',
        r'intak', r'konuşturma', r'tezat', r'zıtlık', r'tenasüp', r'uygunluk',
        r'mecazımürsel', r'ad aktarması', r'hüsnütalil', r'kinaye', r'tariz',
        r'mübalağa', r'tecahülüarif', r'telmih'
    ]),
    ("Şiir Bilgisi", "Şiir Türleri (Lirik, Epik, Didaktik, Pastoral, Satirik)", [
        r'lirik', r'epik', r'didaktik', r'pastoral', r'satirik', r'dramatik şiir'
    ]),

    # Dil Bilgisi
    ("Dil Bilgisi", "Sözcük Türleri: İsimler ve İsim Tamlamaları", [
        r'isim tamlaması', r'belirtili isim', r'belirtisiz isim', r'zincirleme',
        r'somut isim', r'soyut isim', r'çoğul isim', r'ad tamlaması'
    ]),
    ("Dil Bilgisi", "Sözcük Türleri: Sıfatlar ve Sıfat Tamlamaları", [
        r'sıfat tamlaması', r'niteleme sıfatı', r'belirtme sıfatı', r'işaret sıfatı',
        r'belgisiz sıfat', r'sayı sıfatı', r'ön ad\b', r'sıfat görevinde'
    ]),
    ("Dil Bilgisi", "Sözcük Türleri: Zamirler (Adıllar)", [
        r'zamir\b', r'adıl\b', r'kişi zamiri', r'işaret zamiri', r'belgisiz zamir',
        r'soru zamiri', r'dönüşlülük zamiri', r'zamir türü'
    ]),
    ("Dil Bilgisi", "Sözcük Türleri: Zarflar (Belirteçler)", [
        r'zarf\b', r'belirteç', r'durum zarfı', r'zaman zarfı', r'miktar zarfı',
        r'yer-yön zarfı', r'soru zarfı', r'zarf görevinde'
    ]),
    ("Dil Bilgisi", "Sözcük Türleri: Edat, Bağlaç ve Ünlem", [
        r'edat\b', r'ilgeç', r'bağlaç\b', r'ünlem\b', r'edat öbeği'
    ]),
    ("Dil Bilgisi", "Fiiller, Ek Fiil ve Fiilde Çatı", [
        r'haber kipi', r'dilek kipi', r'kip kayması', r'ek-fiil', r'ek eylem',
        r'etken', r'edilgen', r'geçişli', r'geçişsiz', r'fiilde çatı', r'çekimli fiil'
    ]),
    ("Dil Bilgisi", "Fiilimsiler (İsim-Fiil, Sıfat-Fiil, Zarf-Fiil)", [
        r'fiilimsi', r'eylemsi', r'isim-fiil', r'sıfat-fiil', r'zarf-fiil',
        r'ortaç\b', r'ulaç\b', r'bağ-fiil'
    ]),
    ("Dil Bilgisi", "Cümlenin Ögeleri", [
        r'cümlenin ögeleri', r'ögelerine ayrıl', r'yüklem\b', r'özne\b', r'nesne\b',
        r'dolaylı tümleç', r'zarf tümleci', r'yer tamlayıcısı', r'ara söz'
    ]),
    ("Dil Bilgisi", "Cümle Türleri ve Anlatım Bozuklukları", [
        r'cümle türü', r'basit cümle', r'birleşik cümle', r'sıralı cümle', r'bağlı cümle',
        r'isim cümlesi', r'fiil cümlesi', r'kurallı cümle', r'devrik cümle',
        r'anlatım bozukluğu', r'anlamca olumlu', r'yapıca olumsuz'
    ]),
    ("Dil Bilgisi", "Sözcükte Anlam ve Anlatım Özellikleri", [
        r'eş sesli', r'sesteş', r'gerçek anlam', r'mecaz anlam', r'terim anlam',
        r'yan anlam', r'zıt anlam', r'yakın anlam', r'öznel anlatım', r'nesnel anlatım'
    ]),

    # Edebi Dönemler ve Türler
    ("Edebi Dönemler", "İslamiyet Öncesi ve Geçiş Dönemi Türk Edebiyatı", [
        r'islamiyet öncesi', r'göktürk', r'orhun', r'uygur', r'koşuk', r'sagu\b',
        r'sav\b', r'destan\b', r'geçiş dönemi', r'kutadgu bilig', r'divanü lügat',
        r'atabetü', r'divan-ı hikmet', r'dede korkut', r'alper tunga', r'oğuz kağan'
    ]),
    ("Edebi Dönemler", "Halk Edebiyatı ve Âşık Tarzı Şiir", [
        r'halk edebiyatı', r'âşık edebiyatı', r'aşık edebiyatı', r'koşma', r'semai',
        r'varsağı', r'mani\b', r'türkü\b', r'ağıt\b', r'ilahi\b', r'nefes\b',
        r'karacaoğlan', r'dadaloğlu', r'köroğlu', r'yunus emre', r'âşık veysel', r'pir sultan'
    ]),
    ("Edebi Dönemler", "Divan Edebiyatı ve Nazım Şekilleri", [
        r'divan edebiyatı', r'gazel\b', r'kaside', r'mesnevi', r'rubai', r'şarkı\b',
        r'fuzuli', r'baki\b', r'nedim\b', r'şeyh galip', r'nabi\b', r'nefi\b',
        r'hamse', r'tezkire', r'şair tezkiresi'
    ]),
    ("Edebi Dönemler", "Tanzimat, Servet-i Fünun ve Fecr-i Âti Edebiyatı", [
        r'tanzimat', r'servet-i fünun', r'servetifünun', r'fecr-i âti', r'şinasi',
        r'namık kemal', r'ziya paşa', r'recaizade', r'abdülhak hamit', r'samipaşazade',
        r'tevfik fikret', r'cenap şahabettin', r'halit ziya', r'mehmet rauf', r'ahmet haşim'
    ]),
    ("Edebi Dönemler", "Millî Edebiyat ve Kurtuluş Savaşı Dönemi", [
        r'milli edebiyat', r'millî edebiyat', r'genç kalemler', r'yeni lisan',
        r'ömer seyfettin', r'ziya gökalp', r'yakup kadri', r'halide edip', r'reşat nuri',
        r'mehmet akif', r'yahya kemal', r'refik halit'
    ]),
    ("Edebi Dönemler", "Cumhuriyet Dönemi Türk Edebiyatı ve Türk Dünyası", [
        r'cumhuriyet dönemi', r'saf şiir', r'garip akımı', r'ikinci yeni', r'toplumcu gerçekçi',
        r'bireyin iç dünyası', r'necip fazıl', r'ahmet hamdi', r'cahit sıtkı', r'tarık buğra',
        r'kemal tahir', r'yaşar kemal', r'orhan kemal', r'orhan veli', r'sezaikarakoç',
        r'cemal süreya', r'türk dünyası', r'cengiz aytmatov', r'şehriyar', r'bahtiyar vahapzade'
    ]),

    # Öğretici Metinler, Tiyatro ve Paragraf
    ("Öğretici Metinler ve Tiyatro", "Öğretici Metinler (Makale, Deneme, Fıkra, Mektup, Anı)", [
        r'makale', r'deneme\b', r'fıkra\b', r'köşe yazısı', r'sohbet\b', r'söyleşi',
        r'eleştiri', r'tenkit', r'anı\b', r'hatıra', r'mektup', r'günlük\b', r'biyografi',
        r'otobiyografi', r'gezi yazısı', r'röportaj', r'mülakat', r'söylev', r'nutuk\b'
    ]),
    ("Öğretici Metinler ve Tiyatro", "Tiyatro Türleri ve Geleneksel Türk Tiyatrosu", [
        r'tiyatro', r'trajedi', r'komedi', r'dram\b', r'karagöz', r'orta oyunu',
        r'meddah', r'hacivat', r'kavuklu', r'pişekâr', r'dekor\b', r'kostüm',
        r'tirad', r'suflör', r'modern tiyatro', r'epik tiyatro', r'absürt tiyatro'
    ]),
    ("Paragrafta Anlam ve Anlatım", "Paragrafta Ana Düşünce, Konu ve Yardımcı Düşünceler", [
        r'bu parçada asıl anlatılmak istenen', r'bu parçanın konusu', r'ana düşünce',
        r'ana fikir', r'bu parçadan hangisi çıkarılamaz', r'değinilmemiştir', r'hangisine ulaşılamaz'
    ]),
    ("Paragrafta Anlam ve Anlatım", "Anlatım Biçimleri ve Düşünceyi Geliştirme Yolları", [
        r'anlatım biçimi', r'açıklama', r'tartışma', r'öyküleme', r'betimleme',
        r'tanımlama', r'örneklendirme', r'karşılaştırma', r'tanık gösterme',
        r'sayısal verilerden yararlanma'
    ])
]

# ==============================================================================
# 3. MATEMATİK KAZANIM TANIMLARI (ÖZEL AYIKLANMIŞ VE GÜÇLENDİRİLMİŞ)
# ==============================================================================
MAT_SUBTOPICS = [
    # Mantık ve Kümeler
    ("Mantık ve Kümeler", "Önermeler ve Bileşik Önermeler (Mantık)", [
        r'önerme', r'doğruluk değeri', r'totoloji', r'çelişki', r'niceleyici',
        r'\bveya\b', r'\bya da\b', r'ise\b', r'ancak ve ancak', r'p ∧', r'p ∨',
        r'p ⇒', r'p ⇔', r'q ⇒', r'p l', r'q l', r'önermesinin değili'
    ]),
    ("Mantık ve Kümeler", "Kümeler, Küme İşlemleri ve Kartezyen Çarpım", [
        r'küme\b', r'kümeleri', r'alt küme', r'kesişim', r'birleşim', r'fark kümesi',
        r'kartezyen', r'evrensel küme', r's\(a∪b\)', r's\(a∩b\)', r's\(a\)', r's\(b\)',
        r'kümesinin eleman', r'küme problemi'
    ]),

    # Sayılar ve Bölünebilme
    ("Sayılar ve Bölünebilme", "Sayı Kümeleri, Asal Sayılar ve Basamak Kavramı", [
        r'doğal sayı', r'tam sayı', r'asal sayı', r'rasyonel sayı', r'irrasyonel',
        r'gerçek sayı', r'ardışık', r'basamak\b', r'basamaklı', r'rakamları toplamı'
    ]),
    ("Sayılar ve Bölünebilme", "Bölünebilme Kuralları, EBOB ve EKOK", [
        r'bölünebil', r'ebob\b', r'ekok\b', r'kalansız bölünen', r'kalan kaçtır',
        r'ile bölümünden kalan', r'periyodik durum', r'lamba sırasıyla'
    ]),

    # İkinci Dereceden Denklemler (ÖNCE TARANMALI Kİ 1. DERECENİN İÇİNE DÜŞMESİN)
    ("İkinci Dereceden Denklemler", "İkinci Dereceden Denklemler, Kökler ve Karmaşık Sayılar", [
        r'ikinci derece', r'denkleminin kökleri', r'köklerinden biri', r'diskriminant',
        r'delta\b', r'karmaşık sayı', r'sanal birim', r'i 2 = -1', r'i\^2', r'eşleniği',
        r'kökler toplamı', r'kökler çarpımı', r'x 2 \+', r'x 2 -', r'kökleri -\d+'
    ]),

    # Birinci Dereceden Denklem ve Eşitsizlikler
    ("Denklem ve Eşitsizlikler", "Birinci Dereceden Denklemler ve Eşitsizlikler", [
        r'birinci derece', r'denklemini sağlayan x', r'eşitsizlik', r'çözüm kümesi',
        r'sağlayan x kaçtır', r'aralık\b', r'eşitsizliğini sağlayan', r'denklem sisteminin çözüm'
    ]),
    ("Denklem ve Eşitsizlikler", "Mutlak Değerli İfadeler ve Denklemler", [
        r'mutlak değer', r'\| y - x \|', r'\| - y \|', r'\|x', r'\| y', r'\|a', r'\|b',
        r'\| -', r'ifadesinin değeri kaçtır'
    ]),

    # Üslü ve Köklü İfadeler
    ("Üslü ve Köklü İfadeler", "Üslü İfadeler ve Üslü Denklemler", [
        r'üslü', r'kuvveti', r'\^', r'2\^', r'3\^', r'5\^', r'9 x\+2', r'3 x\+1',
        r'üs alma', r'üslü denklem'
    ]),
    ("Üslü ve Köklü İfadeler", "Köklü İfadeler ve Kök Dışına Çıkarma", [
        r'köklü', r'kareköklü', r'√', r'kökten kurtar', r'paydayı rasyonel',
        r'karekök', r'küpkök'
    ]),

    # Oran-Orantı ve Problemler
    ("Problemler", "Oran-Orantı ve Sayı-Kesir Problemleri", [
        r'oranı kaçtır', r'orantı', r'doğru orantı', r'ters orantı', r'kesir\b',
        r'pay\b', r'payda\b', r'katıdır\b', r'farkının katı', r'depodaki su'
    ]),
    ("Problemler", "Yaş, Yüzde, Kâr-Zarar ve Karışım Problemleri", [
        r'yaşları', r'yaş farkı', r'yüzde', r'%\d+', r'kar\b', r'kâr\b', r'zarar\b',
        r'maliyet', r'satış fiyatı', r'indirim', r'karışım', r'tuz oranı', r'şeker oranı'
    ]),
    ("Problemler", "Hareket (Hız) ve İşçi Problemleri", [
        r'km/sa', r'hız\b', r'hızları', r'hareket\b', r'işçi\b', r'havuz\b', r'birlikte iş'
    ]),

    # Geometri
    ("Üçgenler ve Geometri", "Üçgende Açılar ve Açı-Kenar Bağıntıları", [
        r'üçgende açı', r'iç açılar', r'dış açı', r'ikizkenar', r'eşkenar',
        r'en kısa kenar', r'en uzun kenar', r'açı-kenar', r'm\(', r'm \(', r'°'
    ]),
    ("Üçgenler ve Geometri", "Dik Üçgen, Pisagor, Öklid ve Trigonometri", [
        r'dik üçgen', r'pisagor', r'hipotenüs', r'öklid', r'3-4-5', r'5-12-13',
        r'trigonometri', r'sin\b', r'cos\b', r'tan\b', r'cot\b', r'dar açı'
    ]),
    ("Üçgenler ve Geometri", "Üçgende Eşlik, Benzerlik ve Alan", [
        r'benzerlik', r'benzerlik oranı', r'üçgenin alanı', r'alanı kaç',
        r'çevresi kaç', r'ağırlık merkezi', r'kenarortay', r'açıortay'
    ]),

    # Veri ve Olasılık
    ("Veri ve Olasılık", "Merkezi Eğilim, Yayılım Ölçüleri ve Grafikler", [
        r'aritmetik ortalama', r'medyan', r'mod\b', r'tepe değer', r'ortanca',
        r'açıklık', r'standart sapma', r'daire grafiği', r'sütun grafiği',
        r'çizgi grafiği', r'veri grubu'
    ]),
    ("Veri ve Olasılık", "Sayma, Permütasyon, Kombinasyon ve Binom", [
        r'faktöriyel', r'permütasyon', r'kombinasyon', r'seçilebilir',
        r'sıralanabilir', r'binom', r'açılımında ortadaki', r'sağlık ekibi'
    ]),
    ("Veri ve Olasılık", "Basit Olayların Olasılığı", [
        r'olasılık', r'olasılığı', r'rastgele seçilen', r'torba', r'zar\b',
        r'madeni para', r'olayının olasılığı'
    ]),

    # Fonksiyonlar ve Polinomlar
    ("Fonksiyonlar ve Polinomlar", "Fonksiyon Kavramı, Tanım-Değer Kümesi ve Türleri", [
        r'tanım kümesi', r'değer kümesi', r'görüntü kümesi',
        r'bire bir', r'örten\b', r'sabit fonksiyon', r'birim fonksiyon',
        r'doğrusal fonksiyon', r'f\(x\)', r'g\(x\)'
    ]),
    ("Fonksiyonlar ve Polinomlar", "Fonksiyon Grafikleri, Bileşke ve Ters Fonksiyon", [
        r'fonksiyonunun grafiği', r'grafikte f\(', r'bileşke', r'\(fog\)',
        r'f -1', r'tersi\b', r'f -1 \(5\)'
    ]),
    ("Fonksiyonlar ve Polinomlar", "Polinomlar, Derece ve Kalan Bulma", [
        r'polinom', r'P\(x\)', r'Q\(x\)', r'polinomunun derecesi',
        r'ile bölümünden kalan', r'sabit terimi kaçtır', r'katsayılar toplamı kaçtır',
        r'P\(2x - 5\)'
    ]),
    ("Fonksiyonlar ve Polinomlar", "Çarpanlara Ayırma ve Özdeşlikler", [
        r'çarpan', r'çarpanlarına ayır', r'iki kare farkı', r'tam kare',
        r'en sade biçimi', r'sadeleştirilmiş', r'ortak çarpan'
    ]),

    # Çokgenler, Dörtgenler ve Katı Cisimler
    ("Çokgenler, Dörtgenler ve Katı Cisimler", "Çokgenler ve Özel Dörtgenler (Yamuk, Paralelkenar, Kare vb.)", [
        r'çokgen', r'düzgün altıgen', r'düzgün beşgen', r'dörtgen', r'yamuk\b',
        r'paralelkenar', r'eşkenar dörtgen', r'dikdörtgen', r'kare\b', r'deltoid'
    ]),
    ("Çokgenler, Dörtgenler ve Katı Cisimler", "Katı Cisimler (Prizma, Silindir, Piramit, Küp)", [
        r'prizma', r'küp\b', r'piramit', r'silindir', r'koni\b', r'küre\b',
        r'hacmi kaç', r'yanal alan', r'cisim köşegen', r'yüzey alanı', r'ayrıt'
    ])
]

# ==============================================================================
# 4. MEB SORU NO MÜFREDAT BLUEPRINT EŞLEŞTİRMESİ (FALLBACK / TIE-BREAKER)
# ==============================================================================
def get_meb_blueprint_subtopic(course_code, q_no):
    # Matematik Dersleri Soru Dizilimi
    if course_code == 998: # MAT-1
        if q_no == 1: return ("Mantık ve Kümeler", "Önermeler ve Bileşik Önermeler (Mantık)")
        if q_no in [2, 3]: return ("Mantık ve Kümeler", "Kümeler, Küme İşlemleri ve Kartezyen Çarpım")
        if q_no == 4: return ("Sayılar ve Bölünebilme", "Sayı Kümeleri, Asal Sayılar ve Basamak Kavramı")
        if q_no in [5, 6]: return ("Sayılar ve Bölünebilme", "Bölünebilme Kuralları, EBOB ve EKOK")
        if q_no in [7, 9]: return ("Denklem ve Eşitsizlikler", "Birinci Dereceden Denklemler ve Eşitsizlikler")
        if q_no == 8: return ("Denklem ve Eşitsizlikler", "Mutlak Değerli İfadeler ve Denklemler")
        if q_no == 10: return ("Üslü ve Köklü İfadeler", "Üslü İfadeler ve Üslü Denklemler")
        if q_no == 11: return ("Üslü ve Köklü İfadeler", "Köklü İfadeler ve Kök Dışına Çıkarma")
    elif course_code == 999: # MAT-2
        if q_no == 1: return ("Problemler", "Oran-Orantı ve Sayı-Kesir Problemleri")
        if q_no == 2: return ("Problemler", "Yaş, Yüzde, Kâr-Zarar ve Karışım Problemleri")
        if q_no == 3: return ("Problemler", "Yaş, Yüzde, Kâr-Zarar ve Karışım Problemleri")
        if q_no == 4: return ("Problemler", "Hareket (Hız) ve İşçi Problemleri")
        if q_no == 5: return ("Üçgenler ve Geometri", "Üçgende Açılar ve Açı-Kenar Bağıntıları")
        if q_no in [6, 7, 8]: return ("Üçgenler ve Geometri", "Üçgende Eşlik, Benzerlik ve Alan")
        if q_no == 9: return ("Üçgenler ve Geometri", "Dik Üçgen, Pisagor, Öklid ve Trigonometri")
        if q_no == 10: return ("Üçgenler ve Geometri", "Üçgende Eşlik, Benzerlik ve Alan")
        if q_no == 11: return ("Veri ve Olasılık", "Merkezi Eğilim, Yayılım Ölçüleri ve Grafikler")
    elif course_code == 163: # MAT-3
        if q_no == 1: return ("Veri ve Olasılık", "Sayma, Permütasyon, Kombinasyon ve Binom")
        if q_no == 2: return ("Veri ve Olasılık", "Sayma, Permütasyon, Kombinasyon ve Binom")
        if q_no == 3: return ("Veri ve Olasılık", "Basit Olayların Olasılığı")
        if q_no == 4: return ("Veri ve Olasılık", "Sayma, Permütasyon, Kombinasyon ve Binom")
        if q_no == 5: return ("Fonksiyonlar ve Polinomlar", "Fonksiyon Kavramı, Tanım-Değer Kümesi ve Türleri")
        if q_no in [6, 7]: return ("Fonksiyonlar ve Polinomlar", "Fonksiyon Grafikleri, Bileşke ve Ters Fonksiyon")
        if q_no in [8, 9]: return ("Fonksiyonlar ve Polinomlar", "Polinomlar, Derece ve Kalan Bulma")
        if q_no in [10, 11]: return ("Fonksiyonlar ve Polinomlar", "Çarpanlara Ayırma ve Özdeşlikler")
    elif course_code == 164: # MAT-4
        if q_no in [1, 2]: return ("İkinci Dereceden Denklemler", "İkinci Dereceden Denklemler, Kökler ve Karmaşık Sayılar")
        if q_no == 3: return ("Çokgenler, Dörtgenler ve Katı Cisimler", "Çokgenler ve Özel Dörtgenler (Yamuk, Paralelkenar, Kare vb.)")
        if q_no in [4, 5, 6, 7, 8]: return ("Çokgenler, Dörtgenler ve Katı Cisimler", "Çokgenler ve Özel Dörtgenler (Yamuk, Paralelkenar, Kare vb.)")
        if q_no in [9, 10, 11]: return ("Çokgenler, Dörtgenler ve Katı Cisimler", "Katı Cisimler (Prizma, Silindir, Piramit, Küp)")
    return None

def classify_question(q, taxonomy, default_tuple):
    stem = normalize_text(q['soru'])
    opts = normalize_text(' '.join(q['secenekler'].values()))
    
    # 1. Özel İkinci Dereceden Denklem koruması
    if 'ikinci derece' in stem or 'ikinci derece' in opts or 'denkleminin kök' in stem:
        for m, s, _ in taxonomy:
            if 'İkinci Dereceden' in m:
                return m, s
                
    best_score = 0
    best_main = None
    best_sub = None
    
    for main_top, sub_top, pats in taxonomy:
        score = 0
        for pat in pats:
            s_matches = len(re.findall(pat, stem, re.IGNORECASE))
            o_matches = len(re.findall(pat, opts, re.IGNORECASE))
            score += (s_matches * 4) + o_matches
        if score > best_score:
            best_score = score
            best_main = main_top
            best_sub = sub_top
            
    if best_score > 0:
        return best_main, best_sub
        
    # Fallback: MEB soru numarası blueprint'i
    blueprint = get_meb_blueprint_subtopic(q['ders_kodu'], q['soru_no'])
    if blueprint:
        return blueprint
        
    return default_tuple[0], default_tuple[1]

def run_subject_analysis(subj_name, course_codes, taxonomy, default_tuple):
    with open('ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
        all_qs = json.load(f)
        
    qs = [q for q in all_qs if q['ders_kodu'] in course_codes]
    print(f"\n=======================================================")
    print(f"📊 {subj_name} ANALİZİ BAŞLATILIYOR (Toplam {len(qs)} Soru)")
    print(f"=======================================================")
    
    tagged_qs = []
    subtopic_clusters = defaultdict(lambda: {
        'ana_konu': '',
        'alt_konu': '',
        'toplam_soru': 0,
        'dersler': defaultdict(int),
        'donemler': set(),
        'sorular': []
    })
    
    for q in qs:
        main_t, sub_t = classify_question(q, taxonomy, default_tuple)
        q_tagged = dict(q)
        q_tagged['ana_konu'] = main_t
        q_tagged['alt_konu'] = sub_t
        tagged_qs.append(q_tagged)
        
        c = subtopic_clusters[sub_t]
        c['ana_konu'] = main_t
        c['alt_konu'] = sub_t
        c['toplam_soru'] += 1
        c['dersler'][q['ders']] += 1
        c['donemler'].add(f"{q['yil']} D.{q['donem']}")
        c['sorular'].append({
            'id': q['id'],
            'ders_kodu': q['ders_kodu'],
            'ders': q['ders'],
            'yil': q['yil'],
            'donem': q['donem'],
            'soru_no': q['soru_no'],
            'soru': q['soru'],
            'secenekler': q['secenekler'],
            'dogru_cevap': q['dogru_cevap']
        })
        
    # Soru sayılarına göre sırala
    sorted_clusters = sorted(subtopic_clusters.values(), key=lambda x: -x['toplam_soru'])
    
    # Etüt paketleri formatı
    etut_paketleri = []
    for sc in sorted_clusters:
        courses_involved = list(sc['dersler'].keys())
        tot = sc['toplam_soru']
        
        # Etüt Tavsiyesi
        if tot <= 15:
            seviye = "1 Derslik Kompakt Etüt (30-40 Dk)"
        elif tot <= 30:
            seviye = "1-2 Derslik İdeal Etüt Paketi (40-60 Dk)"
        elif tot <= 50:
            seviye = "2 Derslik Kapsamlı Soru Kampı (80 Dk)"
        else:
            seviye = "3+ Derslik Geniş Modül"
            
        paket = {
            'alt_konu': sc['alt_konu'],
            'ana_konu': sc['ana_konu'],
            'toplam_soru': tot,
            'ortak_ders_sayisi': len(courses_involved),
            'ortak_dersler': sorted(courses_involved),
            'ders_dagilimi': dict(sc['dersler']),
            'etut_onerisi': seviye,
            'donem_kapsami': sorted(list(sc['donemler'])),
            'ornek_sorular': sc['sorular'][:3],
            'tum_sorular': sc['sorular']
        }
        etut_paketleri.append(paket)
        
    return tagged_qs, etut_paketleri

if __name__ == '__main__':
    os.makedirs('ciktilar/analiz', exist_ok=True)
    
    # 1. Coğrafya
    cog_tagged, cog_paketler = run_subject_analysis(
        "COĞRAFYA (1-4)",
        [151, 152, 153, 154],
        COGRAFYA_SUBTOPICS,
        ("Genel Coğrafya", "Doğa ve İnsan Etkileşimi")
    )
    with open('ciktilar/analiz/cografya_alt_konular_etiketli.json', 'w', encoding='utf-8') as f:
        json.dump(cog_tagged, f, ensure_ascii=False, indent=2)
    with open('ciktilar/analiz/cografya_hap_etut_paketleri.json', 'w', encoding='utf-8') as f:
        json.dump(cog_paketler, f, ensure_ascii=False, indent=2)

    # 2. TDE
    tde_tagged, tde_paketler = run_subject_analysis(
        "TÜRK DİLİ VE EDEBİYATI (1-8)",
        [541, 542, 543, 544, 545, 546, 547, 548],
        TDE_SUBTOPICS,
        ("Paragrafta Anlam ve Anlatım", "Paragrafta Ana Düşünce, Konu ve Yardımcı Düşünceler")
    )
    with open('ciktilar/analiz/tde_alt_konular_etiketli.json', 'w', encoding='utf-8') as f:
        json.dump(tde_tagged, f, ensure_ascii=False, indent=2)
    with open('ciktilar/analiz/tde_hap_etut_paketleri.json', 'w', encoding='utf-8') as f:
        json.dump(tde_paketler, f, ensure_ascii=False, indent=2)

    # 3. Matematik
    mat_tagged, mat_paketler = run_subject_analysis(
        "MATEMATİK (1-4)",
        [998, 999, 163, 164],
        MAT_SUBTOPICS,
        ("Denklem ve Eşitsizlikler", "Birinci Dereceden Denklemler ve Eşitsizlikler")
    )
    with open('ciktilar/analiz/matematik_alt_konular_etiketli.json', 'w', encoding='utf-8') as f:
        json.dump(mat_tagged, f, ensure_ascii=False, indent=2)
    with open('ciktilar/analiz/matematik_hap_etut_paketleri.json', 'w', encoding='utf-8') as f:
        json.dump(mat_paketler, f, ensure_ascii=False, indent=2)

    print("\n✅ Tüm 3 ders için Alt Konu ve Hap Etüt Paketleri başarıyla güncellendi!")

