#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB COG_4 Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List

PRECISE_COG4_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": 'cog4_nufus_sicramalari',
        "term": 'Dünya Nüfusunda Sıçrama Dönemleri',
        "sayfa": 14,
        "tanim": "İnsanlık nüfusu üç büyük sıçrama yaşadı: **Paleolitik'te alet** (yırtıcıya karşı hayatta kalma), **Neolitik'te tarım** (yerleşik hayat ve besin deposu) ve **Sanayi Devrimi'nde tıp/hijyen** (ölümlerin azalması). Tıpkı bir oyunun seviye atlaması gibi: önce savunma, sonra üretim, en son sağlık kilidi açıldı.\n💡 Hile: Sıçramaların sırası **Alet → Tarım → Sanayi**; üçüncüsünün anahtarı **ölüm oranının düşmesi**dir (doğum değil!).",
        "pattern": "\\bdünya nüfusunda sıçrama\\b|\\büçüncü sıçrama dönemi\\b|\\bnüfus artış hızındaki üçüncü sıçrama\\b|\\bsanayi devrimi\\b|\\bpaleolitik çağ'da avcılık\\b|\\bneolitik\\b",
    },
    {
        "id": 'cog4_nufus_yapisi_yogunluk',
        "term": 'Nüfus Yapısı ve Aritmetik Nüfus Yoğunluğu',
        "sayfa": 22,
        "tanim": "Nüfus yaş gruplarına ayrılır: **0-14 genç**, **15-64 çalışma çağı**, **65+ yaşlı**; aritmetik yoğunluk ise **Toplam Nüfus / Yüz Ölçümü** ile bulunur. Yüz ölçümü sabitken nüfus artarsa yoğunluk da **kesinlikle artar** — tıpkı aynı odaya daha çok kişi sığdırmak gibi.\n💡 Hile: Formül **Nüfus ÷ Alan**; 'aritmetik' kelimesi geçiyorsa **alan sabit, nüfus artınca yoğunluk artar** kodlamasını unutma.",
        "pattern": '\\b0-14 yaş arasındaki\\b|\\baritmetik nüfus yoğunluğunun\\b|\\bnüfusun yapısıyla ilgili\\b|\\bçalışma çağındaki nüfus\\b',
    },
    {
        "id": 'cog4_turkiye_nufus_donemleri_goc',
        "term": "Türkiye'de Nüfusun Dönemleri ve İç Göç Faktörleri",
        "sayfa": 36,
        "tanim": "İç göçü iki yönlü düşün: kırda **itici** (makineleşmeyle işsizlik, mirasla arazi bölünmesi, erozyon), kentte **çekici** (iş, eğitim, sağlık, modern yaşam) faktörler vardır. Bu, köydeki 'kapıyı kapatıp' şehirdeki 'açık kapıya' koşmak gibidir.\n💡 Hile: **İtici = kırın sorunları** (işsizlik, erozyon, miras), **Çekici = kentin cazibesi** (iş, eğitim, sağlık). Soruda 'kaynak' mı 'hedef' mi diye bak!",
        "pattern": '\\b1980 sonrası \\(5\\. dönem\\)|\\b1927-1950 arası \\(2\\. dönem\\)|\\biç göçe neden olan çekici faktör\\b|\\biç göçe neden olan\\b|\\bgöçe neden olan\\b',
    },
    {
        "id": 'cog4_birincil_sektor',
        "term": 'Birincil Ekonomik Faaliyetler (Tarım, Maden, Hayvancılık)',
        "sayfa": 58,
        "tanim": "**Doğadan/topraktan ham madde çıkarma** işidir: tarım, hayvancılık, ormancılık, madencilik, balıkçılık. Az gelişmiş ülkelerde çalışan nüfusun büyük kısmı buradadır — tıpkı Anadolu'nun 'toprak ana' kültürü gibi.\n💡 Hile: Anahtar kelime **'ham madde / doğadan elde etme'**; fabrika yok, işleme yok, sadece **toprak ve doğa**.",
        "pattern": '\\bbirincil sektör[a-zçğıöşü]*|\\bbirincil ekonomik faaliyet\\b|\\bziraat ve hayvancılıkla\\b',
    },
    {
        "id": 'cog4_ikincil_sektor',
        "term": 'İkincil Ekonomik Faaliyetler (Sanayi ve İmalat)',
        "sayfa": 60,
        "tanim": "Birincilden gelen ham/yarı işlenmiş maddeyi **fabrikada mamul maddeye** dönüştürmektir: otomobil, tekstil, petrokimya, inşaat, enerji. Ham maddenin 'mutfaktan geçip yemeğe dönüşmesi' gibi.\n💡 Hile: Anahtar kelime **'fabrika / imalat / işleme'**; ürün artık **mamul** olur, doğadan çıkmaz.",
        "pattern": '\\bikincil ekonomik faaliyet[a-zçğıöşü]*|\\bikincil sektör\\b|\\bsanayi sektörü\\b',
    },
    {
        "id": 'cog4_ucuncul_dorduncul_besincil',
        "term": 'Üçüncül, Dördüncül ve Beşincil Sektörler',
        "sayfa": 62,
        "tanim": "**Üçüncül** hizmettir (eğitim, sağlık, ulaşım, bankacılık); **dördüncül** bilgi işidir (yazılım, Ar-Ge, grafik); **beşincil** ise üst düzey karar vericidir (CEO, stratejist, yönlendirici bilim insanı). Sırasıyla: hizmet → bilgi → karar.\n💡 Hile: **3 = hizmet**, **4 = bilgi/yazılım/Ar-Ge**, **5 = karar verici/CEO**. 'Yazılım' görürsen 4, 'CEO' görürsen 5 de!",
        "pattern": '\\büçüncül sektör\\b|\\bdördüncül sektör\\b|\\bbeşincil sektör\\b|\\bbeşincil\\b|\\bhizmet sektörü\\b',
    },
    {
        "id": 'cog4_bogazlar_ve_kanallar',
        "term": 'Küresel Boğazlar ve Kanallar',
        "sayfa": 88,
        "tanim": "Küresel ticaretin 'kilit kapıları': **Cebelitarık** (Akdeniz-Atlas), **Babülmendep** (Kızıldeniz-Hint), **Hürmüz** (Basra petrolü), **Malakka** (Güneydoğu Asya-Pasifik), **Süveyş** (Akdeniz-Kızıldeniz), **Panama** (Atlas-Pasifik), **Dover** (İngiltere-Fransa). Her biri bir kıtanın 'anahtar deliği' gibidir.\n💡 Hile: **Hürmüz = petrol**, **Süveyş = Mısır**, **Panama = Atlas-Pasifik**, **Malakka = Uzak Doğu**. Boğazı ülkeyle eşleştir!",
        "pattern": '\\bcebelitarık boğazı\\b|\\bdover boğazı\\b|\\bhürmüz boğazı\\b|\\bbabülmendep\\b|\\bsüveyş kanalı\\b|\\bpanama kanalı\\b|\\bmalakka boğazı\\b',
    },
    {
        "id": 'cog4_ulasim_sistemleri',
        "term": 'Ulaşım Sistemleri (Deniz, Hava, Demir, Kara)',
        "sayfa": 96,
        "tanim": "**Deniz yolu** en çok yükü en ucuza taşır; **hava yolu** en son gelişen ama en hızlı büyüyen sistemdir; **demir yolu** karada kitle taşımacılığında ekonomiktir. Yani: deniz 'kamyon', hava 'jet', demir 'toplu taşıma' gibi.\n💡 Hile: **En ucuz/en çok yük = deniz**, **en hızlı gelişen = hava**, **karada kitle = demir yolu**. 'Maliyet' görürsen deniz, 'hız' görürsen hava!",
        "pattern": '\\bhava yolu\\b|\\bulaşım sistemleri\\b|\\bdeniz yolu taşımacılığı\\b|\\bdemir yolları\\b',
    },
    {
        "id": 'cog4_afet_yonetimi_tsunami_sel',
        "term": 'Doğal Afetler (Tsunami, Sel, Deprem Önlemleri)',
        "sayfa": 128,
        "tanim": '**Tsunami** deniz tabanındaki şiddetli tektonik deprem/volkanizmayla oluşur (Büyük Okyanus ve Akdeniz kıyıları riskli); **selde** dere yatakları imara açılmamalı, doğal drenaj korunmalı; **deprem sonrası** elektrik, gaz ve su vanaları kapatılmalıdır.\n💡 Hile: **Tsunami = deniz tabanı depremi**, **Sel = dere yatağı imarı**, **Deprem sonrası = vanaları kapat**. Üç önlemi karıştırma!',
        "pattern": '\\btsunami\\b|\\bsel ve taşkın\\b|\\borman yangını\\b|\\bdepremin hemen sonrasında\\b|\\bdirençli şehirler\\b',
    },
    {
        "id": 'cog4_turk_dunyasi_turksoy',
        "term": 'Türk Dünyası, TÜRKSOY ve Ortak Kültür Eserleri',
        "sayfa": 154,
        "tanim": "**TÜRKSOY**, altı bağımsız Türk devletinin (Azerbaycan, Kazakistan, Kırgızistan, Özbekistan, Türkmenistan, Türkiye) kurduğu **ilk kültür iş birliği teşkilatıdır**; ortak eserler **Orhun Yazıtları** ve **Dîvânu Lugâti't-Türk**, **Tac Mahal** ise Hindistan'daki Türk-İslam mimarisinin şaheseridir.\n💡 Hile: **TÜRKSOY = 6 devlet + kültür**, **Tac Mahal = Hindistan** (Türkiye'de değil!). 'İlk kültür teşkilatı' ifadesi TÜRKSOY'un imzasıdır.",
        "pattern": '\\btürksoy\\b|\\buluslararası türk kültürü teşkilatı\\b|\\btürk dünyası\\b|\\borhun yazıtları\\b|\\btac mahal\\b|\\bkonargöçer türk kültürü\\b',
    },
]
