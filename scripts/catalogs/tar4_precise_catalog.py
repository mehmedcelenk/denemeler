#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Tarih 4 (10. Sınıf 2. Dönem) Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List, Tuple

PRECISE_TAR4_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "tar4_fatih_sultan_mehmed",
        "term": "Fatih Sultan Mehmed (II. Mehmed)",
        "sayfa": 90,
        "tanim": "**1453'te İstanbul'u fethederek Orta Çağ'ı kapatıp Yeni Çağ'ı açan** ve Karadeniz'i adeta bir **Türk gölüne** çeviren dahi padişah; tıpkı bir satranç ustası gibi hem karada hem denizde hamle üstüne hamle yapmıştır.\n💡 Sınıf Şifresi: **'Fatih' = fetih + çağ kapatan**; Trabzon, Sinop, Kırım, Bosna, Mora → **Karadeniz Türk gölü**.",
        "pattern": r"^Fatih$|^II\\\\. Mehmet$|^II\\\\. Mehmed$|\\\\bfatih sultan mehmet\\\\b|\\\\bfatih sultan mehmed\\\\b|\\\\bfatih ünvanı\\\\b|\\\\bfatih unvanı\\\\b",
    },
    {
        "id": "tar4_istanbulun_fethi_sonuclari",
        "term": "İstanbul'un Fethi ve Sonuçları (1453)",
        "sayfa": 92,
        "tanim": "Bizans yıkıldı, **şahi toplar feodaliteyi (derebeyliği) Avrupa'da çatlattı**, İpek ve Boğazlar ticareti Osmanlı'ya geçti; İtalya'ya kaçan bilginler ise **Rönesans'ı ateşleyen kıvılcım** oldu.\n💡 Sınav Şifresi: **'Top → feodalite çöküşü'**, **'bilgin kaçışı → Rönesans'**, **'Boğazlar + İpek → Osmanlı'** üçlüsünü ezberle.",
        "pattern": r"istanbul’un fethi|istanbul'un fethi|büyük toplar ile en güçlü surların",
    },
    {
        "id": "tar4_turnadag_savasi",
        "term": "Turnadağ Savaşı (1515)",
        "sayfa": 102,
        "tanim": "Yavuz'un **Dulkadiroğulları Beyliği'ne son verdiği** savaş; böylece Anadolu Türk siyasi birliği **kesin ve tam olarak** tamamlandı, tıpkı bir yapbozun son parçasının yerine oturması gibi.\n💡 Sınav Şifresi: **'Turnadağ = son beylik = Anadolu birliği TAMAM'**; 'kesin' kelimesi görürsen Turnadağ.",
        "pattern": r"turnadağ savaşı|turnadağ|dulkadiroğulları|anadolu türk siyasi birliğinin kesin",
    },
    {
        "id": "tar4_ridaniye_ve_mercidabik",
        "term": "Mercidabık ve Ridaniye Savaşları (Memlûklerin Yıkılışı)",
        "sayfa": 104,
        "tanim": "Yavuz'un Mısır Seferi'nde **Memlûkleri yıktığı** iki zafer (1516-1517); Suriye, Filistin, Mısır, Hicaz Osmanlı'ya katıldı, **halifelik ve Kutsal Emanetler** İstanbul'a taşındı, Baharat Yolu denetim altına alındı.\n💡 Sınav Şifresi: **'Mercidabık = Suriye kapısı', 'Ridaniye = Mısır + halifelik'**; halifelik sorusunun cevabı hep Yavuz-Mısır.",
        "pattern": r"mercidabık|ridaniye|memlûk devleti|suriye, filistin, mısır ve hicaz",
    },
    {
        "id": "tar4_preveze_deniz_zaferi",
        "term": "Preveze Deniz Zaferi (1538)",
        "sayfa": 110,
        "tanim": "**Barbaros Hayreddin Paşa'nın** Andrea Doria komutasındaki Haçlı donanmasını bozguna uğrattığı (1538) ve Akdeniz'i **kesin olarak Türk gölü** yapan büyük zafer; bugün hâlâ **Donanma Günü** olarak kutlanır.\n💡 Sınav Şifresi: **'Preveze = Barbaros = Akdeniz Türk gölü'**; 'kesin' + 'Barbaros' kelimeleri bir aradaysa Preveze.",
        "pattern": r"preveze deniz savaşı|preveze deniz zaferi|preveze|barbaros hayreddin",
    },
    {
        "id": "tar4_inebahti_deniz_savasi",
        "term": "İnebahtı Deniz Muharebesi (1571)",
        "sayfa": 114,
        "tanim": "Kıbrıs'ın fethine misilleme olarak Haçlıların **Osmanlı donanmasını İnebahtı Körfezi'nde yaktığı** ağır mağlubiyet (1571); yalnızca **Kılıç Ali Paşa** filosunu kurtarmayı başarmıştır.\n💡 Sınav Şifresi: **'İnebahtı = MAĞLUBİYET + Kılıç Ali Paşa kurtardı'**; 'donanma yakıldı' ifadesi görürsen İnebahtı.",
        "pattern": r"inebahtı deniz muharebesi|inebahtı deniz savaşı|inebahtı",
    },
    {
        "id": "tar4_cografi_kesifler_ve_del_kano",
        "term": "Coğrafi Keşifler ve Macellan - Del Kano",
        "sayfa": 120,
        "tanim": "Macellan Filipinler'de ölünce seyahati tamamlayıp **Dünya'nın yuvarlaklığını fiilen kanıtlayan** denizci **Del Kano**'dur; tıpkı bir bayrak yarışında son koşucunun ipi göğüslemesi gibi.\n💡 Sınav Şifresi: **'Macellan başladı, Del Kano bitirdi'**; 'Dünya yuvarlak' sorusunun cevabı Del Kano.",
        "pattern": r"del kano|macellan ile birlikte|macellan|del cano",
    },
    {
        "id": "tar4_topkapi_sarayi_harem",
        "term": "Topkapı Sarayı ve Harem",
        "sayfa": 130,
        "tanim": "Fatih'in yaptırdığı **yönetim merkezi Topkapı Sarayı'nda** padişahın ailesinin ve cariyelerin yaşadığı, **yüksek terbiye aldığı özel bölüm**; adeta sarayın 'iç bahçesi' gibidir.\n💡 Sınav Şifresi: **'Harem = aile + cariye + terbiye'**, **'Topkapı = Fatih + yönetim merkezi'**; harem sorusu hep 'özel yaşam alanı' der.",
        "pattern": r"^Harem$|\\\\btopkapı sarayı’ndaki “harem”\\\\b|\\\\bharem bölümü\\\\b|\\\\bharem\\\\b",
    },
    {
        "id": "tar4_enderun_mektebi",
        "term": "Enderun Mektebi",
        "sayfa": 132,
        "tanim": "Saray içindeki **iç okul**; devşirme sisteminden gelen üstün yetenekli çocukların **devlet adamı, vezir, komutan ve sanatçı** olarak yetiştirildiği elit eğitim kurumu; Osmanlı'nın 'yetenek akademisi' gibidir.\n💡 Sınav Şifresi: **'Enderun = iç okul + devşirme + elit yetiştirme'**; 'saray içi okul' ifadesi görürsen Enderun.",
        "pattern": r"^Enderun Mektebi$|^Enderun$|\\\\benderun mektebi\\\\b|\\\\benderun\\\\b",
    },
    {
        "id": "tar4_reisulkuttab",
        "term": "Reisülküttâb",
        "sayfa": 136,
        "tanim": "Divan'da **kâtiplerin başı** iken zamanla devletler arası yazışmaları yürüten ve **Osmanlı'nın Hariciye (Dışişleri) Bakanı** hâline gelen bürokrat; bugünün 'dışişleri müsteşarı' gibi düşünülebilir.\n💡 Sınav Şifresi: **'Reisülküttâb = kâtiplerin başı → dışişleri'**; 'yazışma + dış ilişki' kelimeleri bir aradaysa Reisülküttâb.",
        "pattern": r"^Reisülküttâb$|^Reisülküttab$|\\\\breisülküttâb\\\\b|\\\\breisülküttab\\\\b",
    },
    {
        "id": "tar4_sadrazam",
        "term": "Sadrazam (Veziriazam)",
        "sayfa": 134,
        "tanim": "Padişahtan sonra **devletin en yetkili kişisi**; padişahın **mutlak vekili ve mührünün taşıyıcısı**, ordu başında sefere çıktığında **'Serdar-ı Ekrem'** unvanını alan hükümet başkanı.\n💡 Sınav Şifresi: **'Sadrazam = mühür + vekil + Serdar-ı Ekrem'**; 'padişah mührü' ifadesi görürsen Sadrazam.",
        "pattern": r"^Sadrazam$|^Veziriazam$|\\\\bsadrazam\\\\b|\\\\bveziriazam\\\\b|\\\\bserdar-ı ekrem\\\\b",
    },
    {
        "id": "tar4_kazasker",
        "term": "Kazasker (Kadıasker)",
        "sayfa": 135,
        "tanim": "Divan'da **adalet ve eğitim işlerine bakan**, taşradaki **kadı ve müderrislerin atama-görevden alma** işlemlerini yürüten **ilmiye sınıfı reisi**; bugünün 'adalet + eğitim bakanı' karışımı gibidir.\n💡 Sınav Şifresi: **'Kazasker = kadı + müderris atama + ilmiye reisi'**; 'adalet ve eğitim' kelimeleri bir aradaysa Kazasker.",
        "pattern": r"^Kazasker$|\\\\bkazasker\\\\b|\\\\bkadıasker\\\\b",
    },
    {
        "id": "tar4_defterdar",
        "term": "Defterdar",
        "sayfa": 135,
        "tanim": "Osmanlı'nın **maliye bakanı** gibi düşün: bütçeyi hazırlayan, gelir-gideri kaydeden ve hazineyi yöneten en üst düzey maliye bürokratıdır (bugünün Hazine ve Maliye Bakanı + Merkez Bankası başkanı karışımı).\n💡 Sınav Şifresi: **\"Bütçe + hazine + gelir-gider kaydı\"** üçlüsünü görüyorsan cevap Defterdar; Nişancı ile karıştırma, o tuğra çeker.",
        "pattern": r"^Defterdar$|\\\\bdefterdar\\\\b|\\\\bhazineyi ilgilendiren konularda\\\\b",
    },
    {
        "id": "tar4_nisanci",
        "term": "Nişancı",
        "sayfa": 136,
        "tanim": "Devletin **noter + tapu kadastro müdürü** gibi çalışır: ferman ve beratlara padişahın **tuğrasını** çeker, fethedilen toprakların **tahririni** yapıp tımar defterlerini tutar.\n💡 Sınav Şifresi: **\"Tuğra çekmek\"** ve **\"tahrir/tımar defteri\"** anahtar kelimeleri → Nişancı. Defterdar maliye, Nişancı yazı-tuğra-kayıt işi.",
        "pattern": r"^Nişancı$|\\\\bnişancı\\\\b|\\\\btuğra çeken\\\\b",
    },
    {
        "id": "tar4_dirlik_topraklari",
        "term": "Dirlik Toprakları (Has, Zeamet, Tımar)",
        "sayfa": 145,
        "tanim": "Geliri devlet görevlilerine **maaş yerine** tahsis edilen mirî topraklardır; büyükten küçüğe **Has (100 bin akçe üstü – hanedan/vezirler) → Zeamet (20-100 bin – orta kademe) → Tımar (3-20 bin – askerler)** şeklinde üç kademedir. Öşrî toprak ise mülk arazidir, dirlik değildir.\n💡 Sınav Şifresi: Akçe sıralaması **\"Has > Zeamet > Tımar\"**; en üst Has, en alt Tımar. \"Mülk arazi\" denince dirlik değil **Öşür**.",
        "pattern": r"dirlik toprakları[a-zçğıöşü]*|has, zeamet|dirlik arazisi",
    },
    {
        "id": "tar4_lonca_teskilati",
        "term": "Lonca Teşkilatı",
        "sayfa": 150,
        "tanim": "Osmanlı şehirlerindeki esnafın **Ahilik geleneğinden** gelen meslek örgütüdür: **çırak → kalfa → usta** yetiştirir, üretimi ve **narhı (fiyatı)** denetler.\n💡 Sınav Şifresi: **\"Çırak-kalfa-usta\"** ve **\"narh\"** kelimeleri → Lonca. Ahilik'in şehirli-esnaf versiyonu olarak kodla.",
        "pattern": r"^Lonca Teşkilatı$|^Lonca$|\\\\blonca teşkilatı\\\\b|\\\\blonca\\\\b",
    },
    {
        "id": "tar4_millet_kavrami",
        "term": "Osmanlı Millet Sistemi",
        "sayfa": 155,
        "tanim": "Osmanlı toplumu **ırk veya dil** esasına göre değil, **din ve mezhep** aidiyetine göre cemaatlere (Müslümanlar, Ortodoks, Ermeni, Yahudi) ayrılarak yönetilirdi; bu hoşgörü sistemi her cemaate kendi dini ve hukuki işlerinde özerklik tanırdı.\n💡 Sınav Şifresi: **\"Din/mezhep esası\"** → Millet Sistemi. \"Irk/dil esası\" şıkkı tuzaktır, Osmanlı'da millet = din demektir.",
        "pattern": r"^Millet$|\\\\bosmanlı millet sistemi\\\\b|\\\\bmillet sistemi\\\\b",
    },
]
