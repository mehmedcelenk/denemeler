#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB INK_2 Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List

PRECISE_INK2_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": 'ink2_mihver_muttefik_bloklari',
        "term": 'II. Dünya Savaşı Blokları',
        "sayfa": 105,
        "tanim": "II. Dünya Savaşı'nda **Mihver** (Almanya-İtalya-Japonya) ile **Müttefikler** (İngiltere-Fransa-SSCB-ABD) karşı karşıya geldi; Türkiye ise tıpkı bir **sınavda kenarda bekleyen öğrenci** gibi savaş dışında kalıp son anda BM'ye girebilmek için kâğıt üzerinde Mihver'e savaş ilan etti.\n💡 Hile: Mihver = **3'lü eksen** (Almanya-İtalya-Japonya); Türkiye **fiilen savaşmadı**, sadece **sembolik ilan** ile BM kurucu üyesi oldu.",
        "pattern": '\\bmihver devletler\\b|\\bmüttefik devletler\\b|\\bii\\. dünya savaşı’na mihver\\b',
    },
    {
        "id": 'ink2_normandiya_cikarmasi',
        "term": 'Normandiya Çıkarması (6 Haziran 1944)',
        "sayfa": 110,
        "tanim": "**Eisenhower** komutasındaki Müttefiklerin 6 Haziran 1944'te Fransa kıyısına yaptığı **tarihin en büyük amfibi harekâtı**; tıpkı bir filmdeki 'flashback' sahnesi gibi Batı Cephesi'ni açarak Almanya'nın sonunu başlattı.\n💡 Hile: Tarih **6 Haziran 1944** + Komutan **Eisenhower** + **amfibi** (denizden kara) + **Batı Cephesi'ni açtı** anahtar kelimeleri.",
        "pattern": '\\bnormandiya çıkarması\\b|\\bnormandiya cikarmasi\\b',
    },
    {
        "id": 'ink2_potsdam_konferansi',
        "term": 'Potsdam Konferansı (1945)',
        "sayfa": 112,
        "tanim": "1945'te **Churchill (sonra Attlee), Truman ve Stalin**'in bir araya geldiği; mağlup Almanya'nın barış şartlarını belirleyip ülkeyi **4 işgal bölgesine** bölen son savaş konferansı.\n💡 Hile: **Potsdam = Almanya'yı 4'e böldü** + katılımcılar **Truman-Stalin-Churchill** (Yalta'dan farkı: Roosevelt yerine Truman).",
        "pattern": '\\bPotsdam\\b|\\bpotsdam konferansı\\b|\\bpotsdam\\b|\\balmanya’ya kabul ettiri- lecek barış\\b',
        "option_only_pattern": '^Potsdam$',
    },
    {
        "id": 'ink2_ii_dunya_savasi_sonuclari',
        "term": "II. Dünya Savaşı'nın Sonuçları",
        "sayfa": 115,
        "tanim": "**Faşizm-Nazizm** tarihe karıştı, **Nürnberg**'de savaş suçluları yargılandı, **BM** kuruldu ve ABD-SSCB süper güç olarak **Soğuk Savaş**'ı başlattı; tıpkı bir **yazılım güncellemesi** gibi dünya 'çift kutuplu' yeni bir sisteme geçti.\n💡 Hile: **Nürnberg = savaş suçluları**, **BM = 1945**, **Soğuk Savaş = ABD vs SSCB** üçlüsünü birlikte kodla.",
        "pattern": '\\bii\\. dünya savaşı’nın sonuçları\\b|\\bnürnberg mahkemeleri\\b|\\bbirleşmiş milletler teşkilatının\\b',
    },
    {
        "id": 'ink2_dogu_bloku_orgutleri',
        "term": 'Doğu Bloku Örgütleri (Kominform, Comecon, Molotof)',
        "sayfa": 120,
        "tanim": "SSCB'nin **Doğu Bloku**'nu örgütlemek için kurduğu yapılar: **Kominform** (siyasi), **Comecon** (ekonomik), **Molotof Planı** (SSCB'nin Marshall'a karşı yardımı) ve **Varşova Paktı** (askerî); Truman Doktrini ise ABD'nin **Batı Bloku** kalkanıdır.\n💡 Hile: **K**ominform=**K**omünist siyaset, **C**omecon=**C**üzdan (ekonomi), **Molotof**=Marshall'ın rakibi, **Varşova**=ordu. Truman → **Batı**'nın.",
        "pattern": '\\bdoğu bloku\\b|\\bkominform\\b|\\bcominform\\b|\\bcomecon\\b|\\bmolotof planı\\b|\\bvarşova paktı\\b',
    },
    {
        "id": 'ink2_demokrat_parti_ve_dortlu_takrir',
        "term": 'Demokrat Parti ve Dörtlü Takrir (1946)',
        "sayfa": 125,
        "tanim": "CHP içindeki **Celal Bayar, Adnan Menderes, Refik Koraltan ve Fuat Köprülü**'nün verdiği **Dörtlü Takrir** ile doğan ve 1950'de **'Beyaz İhtilal'** denilen seçimle iktidara gelen parti; tıpkı bir **startup'ın ana şirketten ayrılıp** zirveye çıkması gibi.\n💡 Hile: **4 isim** (Bayar-Menderes-Koraltan-Köprülü) + **1946 kuruluş** + **1950 Beyaz İhtilal** = DP iktidarı.",
        "pattern": '\\bDemokrat Parti\\b|\\bdemokrat parti\\b|\\bdörtlü takrir\\b|\\bcelal bayar, adnan menderes\\b',
        "option_only_pattern": '^Demokrat Parti$',
    },
    {
        "id": 'ink2_ege_kita_sahanligi',
        "term": 'Ege Kıta Sahanlığı Sorunu',
        "sayfa": 135,
        "tanim": "Türkiye ile Yunanistan arasında **Ege'nin deniz yatağı ve maden arama hakları** yüzünden çıkan kriz; 1976'da **MTA Sismik-1** gemisinin araştırmalarıyla tıpkı bir **GPS sinyali çakışması** gibi gerilim zirveye çıktı ve **Bern Deklarasyonu** ile yatıştırıldı.\n💡 Hile: **Kıta sahanlığı = deniz yatağı/maden** + **Sismik-1 gemisi (1976)** + **Bern Deklarasyonu** = Yunanistan'la Ege krizi.",
        "pattern": '\\bkıta sahanlığı sorunu\\b|\\bkıta sahanlığı\\b|\\bege adaları krizi\\b',
    },
    {
        "id": 'ink2_iran_irak_savasi',
        "term": 'İran-Irak Savaşı (1980-1988)',
        "sayfa": 140,
        "tanim": '**Şattülarap su yolu ve Basra Körfezi** hâkimiyeti için İran ile Irak arasında **1980-1988** arası 8 yıl süren yıkıcı savaş; Türkiye tıpkı bir **dengeli tüccar** gibi **aktif tarafsızlık** izleyip iki tarafla da ticaretini sürdürdü.\n💡 Hile: **8 yıl (1980-88)** + **Şattülarap** + Türkiye **aktif tarafsız** (ticari ilişkiler devam) üçlüsü.',
        "pattern": '\\biran-ırak savaşı\\b|\\biran ırak savaşı\\b',
    },
    {
        "id": 'ink2_naim_suleymanoglu',
        "term": 'Naim Süleymanoğlu (Cep Herkülü)',
        "sayfa": 150,
        "tanim": "**'Cep Herkülü'** lakaplı efsane halterci; **1988 Seul, 1992 Barselona, 1996 Atlanta**'da üst üste **3 Olimpiyat şampiyonu** olarak Bulgaristan'ın Türklere uyguladığı **asimilasyonu** dünyaya duyurdu.\n💡 Hile: **3 Olimpiyat altın** + **Cep Herkülü** + **Bulgar asimilasyonuna tepki** = Naim Süleymanoğlu.",
        "pattern": '\\bnaim süleymanoğlu\\b|\\bnaim suleymanoglu\\b|\\bcep herkülü\\b',
    },
    {
        "id": 'ink_ataturk_ilkeleri',
        "term": 'Atatürk İlkeleri (Cumhuriyetçilik, Milliyetçilik, Halkçılık, Devletçilik, Laiklik)',
        "sayfa": 110,
        "tanim": 'Milli egemenlik Cumhuriyetçilik; bağımsızlık ve birlik Milliyetçilik; eşitlik Halkçılık; ekonomik yatırımlar Devletçilik; akıl ve din ayrımı Laikliktir.\n💡 Hile: **Seçim / meclis** = Cumhuriyetçilik. **Eşitlik / Aşar vergisinin kalkması** = Halkçılık. **Fabrika / Sümerbank / ekonomi** = Devletçilik. **Akıl / bilim** = Laiklik.',
        "pattern": '\\bcumhuriyetçilik[a-zçğıöşü]*\\b|\\bmilliyetçilik[a-zçğıöşü]*\\b|\\bhalkçılık[a-zçğıöşü]*\\b|\\bdevletçilik[a-zçğıöşü]*\\b|\\blaiklik[a-zçğıöşü]*\\b|\\bCumhuriyetçilik\\b|\\bMilliyetçilik\\b|\\bHalkçılık\\b|\\bDevletçilik\\b|\\bLaiklik\\b',
        "option_only_pattern": '^Cumhuriyetçilik$|^Milliyetçilik$|^Halkçılık$|^Devletçilik$|^Laiklik$',
    },
]
