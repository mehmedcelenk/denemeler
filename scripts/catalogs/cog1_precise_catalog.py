#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB COG_1 Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List

PRECISE_COG1_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": 'cog1_fiziki_cografya',
        "term": 'Fiziki Coğrafya ve Alt Dalları',
        "sayfa": 14,
        "tanim": "Doğanın **kendi başına** yazdığı senaryoyu (yer şekilleri, iklim, sular, canlılar, haritalar) inceleyen coğrafya dalıdır; insan faktörü yoktur, sadece doğa vardır.\n💡 Hile: 'İnsan' kelimesi geçiyorsa fiziki değil; **Jeomorfoloji-Klimatoloji-Hidrografya-Biyocoğrafya-Kartografya** beşlisini ezberle, 'Karto'yu görünce harita aklına gelsin.",
        "pattern": '\\bfiziki coğrafya[a-zçğıöşü]*|\\bbiyocoğrafya\\b|\\bklimatoloji\\b|\\bjeomorfoloji\\b|\\bhidrografya\\b|\\bkartografya\\b',
    },
    {
        "id": 'cog1_beseri_cografya',
        "term": 'Beşerî ve Ekonomik Coğrafya',
        "sayfa": 16,
        "tanim": "İnsanın doğayla **kurduğu ilişkiyi** ve geçim kaygısını (nüfus, yerleşme, tarım, sanayi, turizm, ulaşım, ticaret) inceleyen daldır; yani 'insan ne yapıyor?' sorusunun cevabıdır.\n💡 Hile: İçinde **nüfus, yerleşme, ekonomi** geçen her şık beşerîdir; 'doğal ortam' vurgusu varsa fiziki coğrafyaya kayar, dikkat.",
        "pattern": '\\bbeşerî coğrafya\\b|\\bbeseri cografya\\b|\\bturizm coğrafyası\\b|\\btarım coğrafyası\\b|\\byerleşme coğrafyası\\b|\\bnüfus coğrafyası\\b',
    },
    {
        "id": 'cog1_dunyanin_sekli',
        "term": "Dünya'nın Şekli (Geoit ve Küresel)",
        "sayfa": 24,
        "tanim": "Dünya tam yuvarlak değil, **kutuplardan basık Ekvator'dan şişkin** bir 'geoit'tir; bu yüzden Güneş ışınları Ekvator'a dik, kutuplara eğik gelir ve sıcaklık kutuplara doğru azalır.\n💡 Hile: **'Ekvator'dan kutuplara gidildikçe...'** diye başlayan her soruda cevap geoit sonucudur: sıcaklık ↓, tuzluluk ↓, kalıcı kar sınırı ↓, yerçekimi ↑.",
        "pattern": "\\bdünyanın şeklinin küresel\\b|\\bdünya'nın şekli\\b|\\bgeoit\\b|\\bkalıcı kar sınırı\\b|\\bdenizlerin tuzluluk oranı\\b",
    },
    {
        "id": 'cog1_eksen_egikligi_mevsimler',
        "term": 'Eksen Eğikliği ve Yıllık Hareket',
        "sayfa": 28,
        "tanim": "Dünya'nın ekseni **23°27'** eğik olduğu için Güneş etrafında dolanırken farklı yarım küreler farklı açıyla ışın alır; işte bu yüzden **mevsimler** ve değişen gece-gündüz süreleri ortaya çıkar.\n💡 Hile: **Mevsimlerin tek sebebi eksen eğikliğidir**, Dünya'nın Güneş'e yaklaşması değil! 'Dönenceler ve aydınlanma çemberi' ifadesini görünce eksen eğikliği + yıllık hareket işaretle.",
        "pattern": '\\byıl içinde gece ve gündüz sürelerinin\\b|\\beksen eğikliği\\b|\\byıllık hareket\\b|\\bmevsimlerin oluşumu\\b|\\b21 haziran\\b|\\b21 aralık\\b|\\b21 mart\\b|\\b23 eylül\\b|\\bekinoks\\b',
    },
    {
        "id": 'cog1_ortak_saat_yerel_saat',
        "term": 'Yerel Saat ve Ortak (Ulusal) Saat',
        "sayfa": 34,
        "tanim": "Yerel saat her meridyenin kendi **gerçek** saatidir; ortak saat ise ülkenin **tek bir meridyene** göre belirlediği resmî saattir. Doğu-batı geniş ülkeler (Rusya, ABD, Kanada) çok saat dilimi kullanırken, dar ülkeler (Belçika, Hollanda) tek saatle idare eder.\n💡 Hile: **Genişlik = çok saat dilimi**, **darlık = tek saat**. 'Rusya-ABD-Kanada' üçlüsünü görünce 'çok ortak saat', 'Belçika-Hollanda' görünce 'tek ortak saat' kodla.",
        "pattern": '\\btek ortak saat kullanan\\b|\\bortak saat\\b|\\byerel saat\\b|\\buluslararası saat dilimi\\b',
    },
    {
        "id": 'cog1_kucuk_olcekli_harita',
        "term": 'Küçük Ölçekli Haritalar',
        "sayfa": 44,
        "tanim": "Paydası **büyük** (1/500.000'den küçük), yani küçültme oranı fazla olan haritalardır; Dünya ve kıta gibi dev alanları gösterir ama **ayrıntıyı kaybeder**, bozulma artar.\n💡 Hile: **'Payda büyük = ölçek küçük = alan geniş = ayrıntı az = hata çok'** zincirini kur; 'Dünya/kıta haritası' görünce küçük ölçek işaretle.",
        "pattern": '\\bküçük ölçekli harita[a-zçğıöşü]*|\\bküçük ölçekli\\b',
    },
    {
        "id": 'cog1_buyuk_olcekli_harita',
        "term": 'Büyük Ölçekli Haritalar',
        "sayfa": 42,
        "tanim": "Paydası **küçük** (1/200.000'e kadar), küçültme oranı az olan haritalardır; ilçe ve köy gibi dar alanları **ayrıntılı** gösterir, hata oranı düşüktür (plan ve topoğrafya haritaları).\n💡 Hile: **'Payda küçük = ölçek büyük = alan dar = ayrıntı çok = hata az'**; 'plan, topoğrafya, kadastro' kelimeleri büyük ölçeğin parolasıdır.",
        "pattern": '\\bbüyük ölçekli harita[a-zçğıöşü]*|\\bbüyük ölçekli\\b',
    },
    {
        "id": 'cog1_izohips_yontemi',
        "term": 'İzohips (Eş Yükselti Eğrileri)',
        "sayfa": 48,
        "tanim": "Aynı yükseltideki noktaları birleştiren **kapalı eğrilerdir**; eğriler sıklaşırsa eğim artar (falez, hızlı akarsu), seyrekleşirse eğim azalır (ova, yavaş akarsu).\n💡 Hile: **'Sık = sarp = hızlı', 'seyrek = düz = yavaş'**; eğrilerin 'V' yaptığı yer akarsu vadisi, iç içe kapalı halkalar zirve/çukurluk demektir.",
        "pattern": '\\bİzohips\\b|\\bizohips[a-zçğıöşü]*\\b|\\beş yükselti eğrisi\\b|\\bfalez\\b',
        "option_only_pattern": '^İzohips$',
    },
    {
        "id": 'cog1_atmosfer_ve_katmanlari',
        "term": 'Atmosferin Özellikleri ve Katmanları',
        "sayfa": 60,
        "tanim": "Dünya'yı saran **gaz küre**; canlıya nefes, yeryüzüne yorgan olur, zararlı ışınları süzer. Yerden yükseldikçe gaz yoğunluğu azalır: **Troposfer → Stratosfer → Mezosfer → Termosfer**.\n💡 Hile: **Hava olayları = Troposfer**, **ozon tabakası = Stratosfer**; 'gaz yoğunluğu azalır' ifadesi basıncın da azalacağının şifresidir.",
        "pattern": '\\batmosferin özellikleri[a-zçğıöşü]*|\\batmosferin katmanları\\b|\\btroposfer\\b|\\bstratosfer\\b|\\bozonosfer\\b',
    },
    {
        "id": 'cog1_guneslenme_suresi',
        "term": 'Güneşlenme Süresi (Türkiye)',
        "sayfa": 68,
        "tanim": "Günün **güneşli geçen saat** miktarıdır; Türkiye'de bulut ve yağışın bol olduğu **Karadeniz'de en kısa**, açık gökyüzünün hüküm sürdüğü **Güneydoğu Anadolu ve Akdeniz'de en uzundur**.\n💡 Hile: **'Bulut çok = güneş az'**; Karadeniz'i görünce 'en kısa', Güneydoğu-Akdeniz'i görünce 'en uzun' eşleştir, tersini yapma.",
        "pattern": '\\bgüneşlenme süresinin en kısa\\b|\\bgüneşlenme süresi\\b',
    },
    {
        "id": 'cog1_hava_basinci_faktorleri',
        "term": 'Hava Basıncını Etkileyen Faktörler',
        "sayfa": 76,
        "tanim": "Atmosferdeki gazların yeryüzüne uyguladığı ağırlıktır; **sıcaklık artınca hava genleşir ve basınç düşer** (ters orantı), yerçekimi ve gaz yoğunluğu artınca basınç artar (doğru orantı).\n💡 Hile: **'Sıcak = hafif = alçak basınç', 'soğuk = ağır = yüksek basınç'**; 'sıcaklıkla basınç ters orantılıdır' cümlesi soruların anahtarıdır.",
        "pattern": '\\bhava basıncını etkileyen\\b|\\bhava basıncı\\b|\\bbasınç merkezleri\\b|\\balçak basınç\\b|\\byüksek basınç\\b',
    },
    {
        "id": 'cog1_surekli_ruzgarlar',
        "term": 'Sürekli Rüzgârlar (Alizeler, Batı, Kutup)',
        "sayfa": 82,
        "tanim": "Sürekli basınç kuşakları arasında **yıl boyu aynı yönde** esen rüzgârlardır: 30°'den Ekvator'a **Alizeler**, 30°'den 60°'ye **Batı Rüzgârları**, kutuplardan 60°'ye **Kutup Rüzgârları**.\n💡 Hile: **'Alize Ekvator'a, Batı 60'a, Kutup 60'a'**; orta kuşak karalarının batısına yağış bırakan rüzgâr **Batı Rüzgârları**dır, bu eşleştirme sıkça sorulur.",
        "pattern": '\\bsürekli rüzgârlar[a-zçğıöşü]*|\\balizeler\\b|\\bbatı rüzgârları\\b|\\bkutup rüzgârları\\b|\\balize\\b',
    },
    {
        "id": 'cog1_ruzgar_cesitleri_meltem_muson',
        "term": 'Meltem ve Muson Rüzgârları',
        "sayfa": 84,
        "tanim": '**Meltem**, günlük ısınma farkıyla esen "günlük" rüzgâr (gündüz denizden karaya, gece karadan denize); **muson** ise kıta ile okyanus arasındaki yıllık farkla esen "mevsimlik" dev rüzgâr — tıpkı yazın serinlemek için açılan klima gibi, yaz musonu da denizden karaya nem taşıyıp bol yağış bırakır.\n💡 Hile: "Günlük = Meltem, Mevsimlik = Muson"; musonda yaz musonu = yağış, kış musonu = kuraklık.',
        "pattern": '\\bMusonlar\\b|\\bMeltemler\\b|\\bmuson rüzgârları\\b|\\bmeltem rüzgârları\\b|\\bmuson\\b|\\bmeltem\\b',
        "option_only_pattern": '^Musonlar$|^Meltemler$',
    },
    {
        "id": 'cog1_mutlak_ve_bagil_nem',
        "term": 'Mutlak Nem ve Bağıl Nem',
        "sayfa": 92,
        "tanim": '**Mutlak nem**, 1 m³ havadaki su buharının gramıdır ("ne kadar su var"); **bağıl nem** ise bu suyun havanın taşıyabileceğinin yüzdesidir ("doygunluğa ne kadar yakın") — tıpkı bir sürahinin içindeki su (mutlak) ile doluluk oranı (bağıl) gibi.\n💡 Hile: Mutlak nem = sıcaklık + kıyı (Akdeniz\'de fazla); Bağıl nem = yağış ihtimali (Karadeniz\'de en yüksek).',
        "pattern": '\\bmutlak nem\\b|\\bbağıl nem\\b|\\bmaksimum nem\\b|\\bsu buharının ağırlığına\\b',
    },
    {
        "id": 'cog_ic_ve_dis_kuvvetler',
        "term": 'Yer Şekilleri (Volkanizma, Falez, Karstik, Tombolo)',
        "sayfa": 40,
        "tanim": 'Volkanizma yer altı mağmasıyla oluşur; Karstik şekiller kalkerin erimesiyle; Falez dik kıyı uçurumu; Tombolo saplı adadır.\n💡 Hile: Kalker/kireçtaşı erimesi ve mağara/obruk = **Karstik** (Akdeniz). Dalga aşındırmasıyla uçurum = **Falez** (Karadeniz/Akdeniz). Adayı karaya bağlayan dalga kumu = **Tombolo** (Sinop, Kapıdağ).',
        "pattern": '\\bvolkanizma[a-zçğıöşü]*\\b|\\bfalez[a-zçğıöşü]*\\b|\\bkarstik\\b|\\btombolo\\b|\\bkuraklık\\b|\\bVolkanizma\\b|\\bFalez\\b|\\bKuraklık\\b|\\bTombolo\\b',
        "option_only_pattern": '^Volkanizma$|^Falez$|^Kuraklık$|^Tombolo$',
    },
    {
        "id": 'cog_iklim_ve_bitki',
        "term": 'İklim Tipleri ve Biyocoğrafya',
        "sayfa": 75,
        "tanim": "Akdeniz iklimi yazın sıcak-kurak, kışın ılık-yağışlıdır (Maki); Muson yazın aşırı yağışlıdır; Karasal iklimde sıcaklık farkı yüksektir.\n💡 Hile: 'Yazı sıcak-kurak, kışı ılık-yağışlı, bitki örtüsü zeytin/maki' = **Akdeniz İklimi**. 'Yaz yağmuruyla pirinç yetiştirilen Asya' = **Muson İklimi**.",
        "pattern": '\\bbiyocoğrafya[a-zçğıöşü]*\\b|\\bakdeniz\\s+iklimi\\b|\\bmuson\\s+iklimi\\b|\\bmaki[a-zçğıöşü]*\\b|\\bBiyocoğrafya\\b|\\bAkdeniz İklimi\\b|\\bMuson İklimi\\b',
        "option_only_pattern": '^Biyocoğrafya$|^Akdeniz İklimi$|^Muson İklimi$',
    },
]
