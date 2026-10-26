#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Coğrafya 3 Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List, Tuple

PRECISE_COG3_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "cog3_orojenez_dag_olusumu",
        "term": "Orojenez (Dağ Oluşumu: Kıvrılma ve Kırılma)",
        "sayfa": 28,
        "tanim": "Yer kabuğundaki tortul tabakalar yanlardan sıkışınca **esnek olanlar kıvrılır** (yükselen tepe = **Antiklinal**, çöken çanak = **Senklinal**), **sert olanlar ise kırılır** (yükselen blok = **Horst**, çöken hendek = **Graben**). Tıpkı iki elin arasında sıkılan bir hamurun kıvrılması, dondurulmuş hamurun ise çatlaması gibi düşün.\n💡 Sınav Şifresi: **Esnek = KIVRILMA (Antiklinal-Senklinal), Sert = KIRILMA (Horst-Graben)**. Ege'deki çöküntü ovaları = Graben; Batı Anadolu'daki kırılma = sert tabaka işareti.",
        "pattern": r"orojenez|antiklinal senklinal|antiklinal|senklinal|\\\\bhorst\\\\b|\\\\bgraben\\\\b",
    },
    {
        "id": "cog3_epirojenez_kita_olusumu",
        "term": "Epirojenez (Kıta Oluşumu ve İzostatik Denge)",
        "sayfa": 32,
        "tanim": "Geniş kara kütlelerinin **izostatik denge** bozulunca yavaşça alçalıp yükselmesidir; kara yükselip deniz çekilirse **Regresyon**, kara çöküp deniz ilerlerse **Transgresyon** olur. Tıpkı bir geminin yük alınca batması, yük atınca yükselmesi gibi düşün.\n💡 Sınav Şifresi: **Re = Geri (deniz geri çekilir), Trans = İleri (deniz karaya ilerler)**. İskandinavya = yükseliyor (Regresyon), Venedik = çöküyor (Transgresyon).",
        "pattern": r"epirojenez|iskandinavya'nın yükselmesi|venedik'te deniz seviyesinin|transgresyon|regresyon|izostatik denge",
    },
    {
        "id": "cog3_levha_tektonigi_fay",
        "term": "Levha Tektoniği ve Fay Hatları (KAF, DAF, BAF)",
        "sayfa": 38,
        "tanim": "Mantonun **konveksiyonel akımlarıyla** hareket eden litosfer parçalarıdır; Türkiye, **Avrasya-Afrika-Arabistan** levhaları arasında sıkıştığı için **KAF, DAF ve BAF** boyunca genç ve aktif bir deprem kuşağındadır. Tıpkı üç arabanın bir kavşakta sıkışıp sürekli birbirini itmesi gibi.\n💡 Sınav Şifresi: **KAF = Kuzey (İstanbul-Samsun hattı), DAF = Doğu (Hatay-Bingöl), BAF = Batı (Ege grabenleri)**. Türkiye'nin deprem kuşağında olmasının sebebi = üç levha arasında sıkışması.",
        "pattern": r"kuzey anadolu fay hattı|levha tektoniği|aktif fay hatları|fay hatları|levhalar",
    },
    {
        "id": "cog3_magmatik_kayaclar",
        "term": "Magmatik (Püskürük) Kayaçlar",
        "sayfa": 46,
        "tanim": "Magmanın soğumasıyla oluşur; **derinde yavaş soğuyan iri kristalli** (Granit, siyenit, gabro) **iç püskürük**, **yüzeyde hızlı soğuyan ince taneli** (Andezit/Ankara taşı, bazalt, obsidiyen, tüf) **dış püskürüktür**. Tıpkı buzdolabında yavaş donan suyun iri kristalli, dondurucuda hızlı donanın ince kristalli olması gibi.\n💡 Sınav Şifresi: **İç = İri kristal (Granit), Dış = İnce taneli (Bazalt/Andezit)**. Ankara taşı = Andezit = dış püskürük; Tor topoğrafyası = Granit = iç püskürük.",
        "pattern": r"andezit|granit|obsidiyen|bazalt|volkanik kayaç|iç püskürük|dış püskürük|tor topoğrafyası",
    },
    {
        "id": "cog3_tortul_ve_baskalasim_kayaclar",
        "term": "Tortul ve Başkalaşım (Metamorfik) Kayaçlar",
        "sayfa": 48,
        "tanim": "**Tortul kayaçlar tabakalıdır ve fosil barındırır** (kalker, jips, kömür, kumtaşı); **başkalaşım kayaçları ise yüksek sıcaklık-basınçla** başkalaşır (Kalker→Mermer, Granit→Gnays, Kiltaşı→Şist, Kömür→Elmas). Tıpkı bir belgenin fotokopiyle katman katman çoğalması (tortul) ve yüksek baskı altında elmasa dönüşmesi (başkalaşım) gibi.\n💡 Sınav Şifresi: **Fosil + Tabaka = Tortul** (sadece tortulda fosil var!). **Kalker→Mermer, Kömür→Elmas** dönüşümleri en çok sorulan başkalaşım eşleştirmeleridir.",
        "pattern": r"tortul kayaç[a-zçğıöşü]*|başkalaşım kayaç[a-zçğıöşü]*|metamorfik|içerisinde hayvan fosilleri|fosil",
    },
    {
        "id": "cog3_akarsu_yer_sekilleri",
        "term": "Akarsu Aşındırma ve Biriktirme Şekilleri",
        "sayfa": 64,
        "tanim": "Akarsu eğimi azalan tabanlı vadilerde **salınım yaparak menderes** oluşturur, taşıdığı alüvyonu denize döküldüğü yerde biriktirerek **delta ovası** (Çukurova, Bafra, Çarşamba) yapar; iki komşu havzayı ayıran çizgi ise **su bölümü çizgisidir**. Tıpkı bir yılanın kıvrılarak ilerlemesi ve sonunda denize ulaşıp yükünü boşaltması gibi.\n💡 Sınav Şifresi: **Menderes = kıvrım, Delta = denize dökülen yerde birikim**. Türkiye'nin en büyük delta ovaları: **Çukurova (Seyhan-Ceyhan), Bafra (Kızılırmak), Çarşamba (Yeşilırmak)**.",
        "pattern": r"\\\\bmenderes\\\\b|\\\\bdelta ovaları\\\\b|\\\\bdelta ovası\\\\b|\\\\bdelta\\\\b|\\\\bsu bölümü çizgisi\\\\b|\\\\bakım grafiği\\\\b|\\\\bakış rejimi\\\\b",
    },
    {
        "id": "cog3_karstik_sekiller",
        "term": "Karstik Aşındırma ve Biriktirme Şekilleri",
        "sayfa": 74,
        "tanim": "**Kalker ve jips** gibi suda kolay çözünen kayaçların oluşturduğu şekillerdir; küçükten büyüğe **Lapya→Dolin→Uvala→Polye** sıralanır, mağara tavanının çökmesiyle oluşan derin kuyuya **Obruk** denir (Konya-Tuz Gölü güneyi). Tıpkı bir küp şekerin suda yavaş yavaş eriyip oyuklar bırakması gibi.\n💡 Sınav Şifresi: **Lapya en küçük, Polye en büyük** karstik şekil. **Obruk = tavan çökmesi** (Konya). Traverten = Pamukkale = karstik birikim.",
        "pattern": r"karstik şekiller|karstik araziler|kanyon vadi|\\\\bobruk\\\\b|\\\\blapya\\\\b|\\\\bpolye\\\\b|\\\\btraverten\\\\b",
    },
    {
        "id": "cog3_kiyi_tipleri",
        "term": "Kıyı Tipleri ve Kıyı Topoğrafyası",
        "sayfa": 86,
        "tanim": "**Falez (yalıyar)** dalga aşındırmasıyla oluşan dik uçurumdur; **Fiyort ve Skyer** buzul kökenli kıyılardır ve **Türkiye Orta Kuşak'ta olduğundan fiyort görülmez**; **Haliç ve Vat** ise gelgit genliği yüksek okyanus kıyılarında oluşur. Tıpkı bir uçurumun dalgalarla kemirilmesi (falez) ve bir buzul vadinin denizle dolması (fiyort) gibi.\n💡 Sınav Şifresi: **Fiyort = buzul + yüksek enlem → Türkiye'de YOK** (en klasik tuzak!). **Haliç/Vat = gelgit** (okyanus kıyısı). Falez = dalga aşındırması.",
        "pattern": r"\\\\bfalez\\\\b|fiyort kıyı tipi|haliç kıyı tipi|kıyı topoğrafyası|dalga aşındırması",
    },
    {
        "id": "cog3_ruzgar_ve_buzul_sekilleri",
        "term": "Rüzgâr ve Buzul Şekilleri",
        "sayfa": 94,
        "tanim": "**Rüzgâr şekilleri** kurak, bitki örtüsüz yörelerde etkilidir (mantar kaya, barkan, lös); **buzul şekilleri** yüksek dağ ve kutuplarda oluşur ve buzulun biriktirmesiyle **sander düzlüğü** ile **moren setleri** meydana gelir. Tıpkı çölde rüzgârın kumları şekillendirmesi, kutupta buzulun toprağı sürüklemesi gibi.\n💡 Sınav Şifresi: **Rüzgâr = kurak iklim (mantar kaya, barkan, lös)**, **Buzul = yüksek dağ/kutup (sander, moren)**. Lös = rüzgâr biriktirmesi; Moren = buzul biriktirmesi.",
        "pattern": r"sander düzlüğü|buzul biriktirme|rüzgâr aşındırma|barkan|hörgüç kaya|kalıcı kar sınırı",
    },
    {
        "id": "cog3_toprak_tipleri",
        "term": "Toprak Tipleri (Zonal, İntrazonal, Azonal)",
        "sayfa": 112,
        "tanim": "**Zonal** iklime bağlı yerli topraklardır (Terra-rossa = Akdeniz kırmızısı, Çernozyom = karanlık çayır, Podzol); **İntrazonal** yerel koşullara bağlıdır (Hidromorfik = bataklık, Halomorfik = tuzlu, Vertisol = kepir); **Azonal** ise taşınmış verimli topraktır (Alüvyal). Tıpkı bir bahçede iklime göre yetişen (zonal), suya göre bataklıklaşan (intrazonal) ve selin taşıdığı verimli çamur (azonal) gibi.\n💡 Sınav Şifresi: **Terra-rossa = Akdeniz kalker üzeri kırmızı**, **Çernozyom = en verimli karanlık toprak**, **Alüvyal = taşınmış = Azonal**. Kepir/Vertisol = dönen toprak = İntrazonal.",
        "pattern": r"terra-rossa|hidromorfik|çernozyom|alüvyal|vertisol|toprak tipleri|zonal toprak",
    },
    {
        "id": "cog3_bitki_formasyonlari",
        "term": "Bitki Formasyonları (Ağaç, Çalı, Ot)",
        "sayfa": 124,
        "tanim": "Bitki örtüsünü boy sırasına göre üç katmana ayır: **ağaç** (orman: Ekvatoral, Muson, Tayga, geniş yapraklı kayın-meşe), **çalı** (maki: zeytin-defne-mersin; garig; psödomaki) ve **ot** (bozkır/step: geven-yavşan-üzerlik; çayır; savan; tundra). Tıpkı bir apartmanın katları gibi düşün: en üst kat ağaçlar, orta kat çalılar, zemin kat otlar.\n💡 Sınav Şifresi: **Maki = Akdeniz'in zeytin-defne-mersin üçlüsü**; **Bozkır = geven-yavşan-üzerlik**; **Tayga = Sibirya iğne yapraklı**; **Tundra = kutup otları**. 'Zeytin' görürsen maki, 'geven' görürsen bozkır, 'iğne yaprak' görürsen tayga de!",
        "pattern": r"orman formasyonuna|bozkır \\\\(step\\\\) bitki örtüsü|bozkır|step|dağ çayırları|\\\\bmaki\\\\b|\\\\bkayın\\\\b|\\\\bkaktüs\\\\b",
    },
]
