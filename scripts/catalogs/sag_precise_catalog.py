#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB SAG Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List

PRECISE_SAG_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": 'sag_saglik_basamaklari',
        "term": 'Koruyucu ve Tedavi Edici Sağlık Hizmetleri Basamakları (1., 2., 3. Basamak)',
        "sayfa": 16,
        "tanim": "Hastalanmadan önce yapılan aşı ve temiz su denetimi **Koruyucu Sağlık**; sakatlık sonrası uyum **Rehabilitasyon**'dur. Tedavi basamakları:\n• **1. Basamak:** Mahallemizdeki **Aile Sağlığı Merkezleri (Aile Hekimi)**.\n• **2. Basamak:** Yataklı **Devlet ve Özel Hastaneler**.\n• **3. Basamak:** İleri teknoloji **Eğitim ve Araştırma Hastaneleri, Üniversite ve Kanser (Onkoloji) Hastaneleri**.\n💡 Hile: İlk başvurulan yer **1. Basamak (Aile Hekimi)**; en üst uzmanlık ve araştırma merkezi **3. Basamak**'tır!",
        "pattern": '\\bkoruyucu sağlık[a-zçğıöşü]*|\\btedavi edici[a-zçğıöşü]*|\\brehabilitasyon[a-zçğıöşü]*|\\baile sağlığı merkez[a-zçğıöşü]*|\\baile hekim[a-zçğıöşü]*|\\bbirinci basamak\\b|\\bikinci basamak\\b|\\büçüncü basamak\\b|\\bsağlık hakkı[a-zçğıöşü]*|\\berişilebilirlik\\b|\\bkabul edilebilirlik\\b|\\bvektör[a-zçğıöşü]*|\\bzoonoz\\b|\\bkuş gribi\\b|\\bkuduz\\b|\\bbulaşıcı hastalı[kğ][a-zçğıöşü]*|\\bhijyen[a-zçğıöşü]*|\\bdiş ipi\\b|\\bağız ve diş\\b',
    },
    {
        "id": 'sag_bki_ve_beslenme',
        "term": 'Beden Kitle İndeksi (BKİ) ve Obezite',
        "sayfa": 42,
        "tanim": 'Kişinin kilosunun boyuna göre sağlıklı aralıkta olup olmadığını gösteren ölçüttür.\n💡 Hile: $\\text{BKİ} = \\frac{\\text{Kilo (kg)}}{\\text{Boyun Karesi (m}^2\\text{)}}$ — Sonuç $18,5\\text{–}24,9$ arası **Normal**, $25\\text{–}29,9$ **Fazla Kilolu**, **$30$ ve üzeri ise Obez (Şişman)** kabul edilir!',
        "pattern": '\\bbeden kitle indeksi\\b|\\bbki\\b|\\bobezite[a-zçğıöşü]*|\\bşişmanlı[kğ][a-zçğıöşü]*|\\bfiziksel aktivite[a-zçğıöşü]*|\\bergenlik[a-zçğıöşü]*',
    },
    {
        "id": 'sag_zorbalik_ve_destek_hatlari',
        "term": 'Akran/Siber Zorbalık, Bağımlılık ve Resmi Destek Hatları',
        "sayfa": 58,
        "tanim": 'Güçlü olanın zayıf olana **kasıtlı ve sürekli** zarar vermesine **Akran Zorbalığı** (dijital ortamda yapılırsa **Siber Zorbalık**) denir.\n💡 Hile: **Alo 183** $\\to$ Aile, Kadın, Çocuk ve **Şiddet Mağdurları** Destek Hattı; **Alo 171** $\\to$ Sigara Bırakma; **Alo 191** $\\to$ Uyuşturucu ile Mücadele; **Alo 114** $\\to$ Zehir Danışma (**Yeşilay** bağımlılıkla savaşır).',
        "pattern": '\\bakran zorbalı[kğ][a-zçğıöşü]*|\\bsiber zorbalı[kğ][a-zçğıöşü]*|\\bzorbalı[kğ][a-zçğıöşü]*|\\bbağımlılı[kğ][a-zçğıöşü]*|\\bteknoloji bağımlılı[kğ][a-zçğıöşü]*|\\byeşilay\\b|\\balo 183\\b|\\balo 171\\b|\\balo 191\\b|\\balo 114\\b|\\bşiddet mağdur[a-zçğıöşü]*',
    },
    {
        "id": 'sag_ilk_yardim_ve_heimlich',
        "term": 'İlk Yardım (KBK), Heimlich Manevrası, Koma ve Turnike',
        "sayfa": 76,
        "tanim": 'Olay yerinde **ilaçsız** yapılan hayat kurtarıcı müdahaledir (**KBK:** **K**oruma $\\to$ **B**ildirme $112$ $\\to$ **K**urtarma).\n• **Heimlich Manevrası:** Boğazı **tam tıkanan** (nefes alamayan, konuşamayan, ellerini boynuna götüren) kişiye arkadan sarılarak karına bası uygulanmasıdır.\n• **Koma Pozisyonu:** Bilinci kapalı ama **nefes ve nabzı olan** hastanın **yarı yüzükoyun-yan** yatırılmasıdır.\n💡 Hile: Yetişkinde kalp masajı: **$30$ Kalp Basısı / $2$ Suni Solunum**; Uzuv kopmasında **Turnike**; Şok pozisyonunda bacaklar **$30\\text{ cm}$ yukarı** kaldırılır!',
        "pattern": '\\bilk yardım[a-zçğıöşü]*|\\bkalp masajı\\b|\\byapay solunum\\b|\\bsuni solunum\\b|\\btemel yaşam desteği\\b|\\bkoma pozisyonu\\b|\\bşok pozisyonu\\b|\\bheimlich manevrası\\b|\\btam tıkanma\\b|\\bkısmi tıkanma\\b|\\bturnike\\b|\\batardamar kanama[a-zçğıöşü]*|\\bburkulma\\b|\\bkırık\\b|\\bçıkık\\b|\\b112 acil\\b',
    },
    {
        "id": 'sag_trafik_gecis_ve_kurallar',
        "term": 'Trafik Adabı, Geçiş Üstünlüğü, Takip Mesafesi ve Şerit Kuralları',
        "sayfa": 106,
        "tanim": 'Trafikte kendimizi karşıdaki sürücü veya yayanın yerine koymaya **Empati** denir.\n• **Geçiş Üstünlüğü Sırası:** **1) Cankurtaran (Ambulans) $\\to$ 2) İtfaiye $\\to$ 3) Polis $\\to$ 4) Sivil Savunma** (**CİPS** şifresi!).\n• **Takip Mesafesi:** Hızın ($\\text{km/sa}$) **yarısı** kadar metredir ($2$ saniye / $88\\text{-}89$ kuralı).\n💡 Hile: Köprü, tünel, tepe üstü, dönemeç, yaya ve okul geçitlerinde **öndeki araç sollanmaz**! Ağır vasıtalar (**çekici**, kamyon) en sağ şeritten gider; ticari sürücüler kesintisiz en fazla **$4,5$ saat** araç kullanabilir!',
        "pattern": '\\btrafik[a-zçğıöşü]*|\\bempati\\b|\\bfahri trafik\\b|\\bşeri[td][a-zçğıöşü]*|\\bbölünmüş yol[a-zçğıöşü]*|\\bönündeki aracı geçme[a-zçğıöşü]*|\\bdönemeç[a-zçğıöşü]*|\\byaya geçi[td][a-zçğıöşü]*|\\bokul geçi[td][a-zçğıöşü]*|\\bhemzemin geçi[td]\\b|\\bkavşa[kğ][a-zçğıöşü]*|\\btakip mesafesi\\b|\\bgeçiş üstünlüğü\\b|\\bgeçiş hakkı\\b|\\bemniyet kemeri\\b|\\bhava yastığı\\b|\\bçekici\\b|\\bkamyonet\\b|\\b4,5 saat\\b|\\bkesintisiz.*araç kullanan\\b|\\bdeniz yolu\\b|\\bdemir yolu\\b|\\bhava yolu\\b|\\bkara yolu\\b',
    },
    {
        "id": 'sag_brusella',
        "term": 'Brusella (Malta Humması)',
        "sayfa": 45,
        "tanim": "Kaynatılmamış çiğ süt ve taze peynir tüketimiyle hayvanlardan insanlara bulaşan dalgalı ateşli bakteriyel zoonoz hastalıktır.\n💡 Hile: 'Kaynatılmamış süt, taze köy peyniri, dalgalı ateş' üçlüsü doğrudan BRUSELLA'dır. Taze peyniri en az 3 ay salamurada bekletmek korur.",
        "pattern": '\\bbrusella[a-zçğıöşü]*\\b|\\bmalta\\s+humması\\b|\\bBrusella\\b',
        "option_only_pattern": '^Brusella$',
    },
    {
        "id": 'sag_kırım_kongo',
        "term": 'Kırım-Kongo Kanamalı Ateşi (KKKA)',
        "sayfa": 48,
        "tanim": "Kenelerin vücuda tutunmasıyla bulaşan, yüksek ateş, kas ağrısı ve iç organ kanamalarıyla ölümcül seyreden viral enfeksiyondur.\n💡 Hile: 'Kene tutunması' görürsen KKKA. Asla keneyi çıplak elle ezme, üzerine kolonya/sigara basma; cımbızla ezmeden çek veya sağlık kuruluşuna git!",
        "pattern": '\\bkırım[- ]kongo[a-zçğıöşü]*\\b|\\bkkka\\b|\\bkene\\s+tutunması\\b|\\bKırım-Kongo Kanamalı Ateşi\\b|\\bKırım-Kongo\\b',
        "option_only_pattern": '^Kırım-Kongo Kanamalı Ateşi$|^Kırım-Kongo$',
    },
    {
        "id": 'sag_koma_ve_sok',
        "term": 'Koma ve Şok Pozisyonu',
        "sayfa": 28,
        "tanim": 'Şokta hasta sırtüstü yatırılıp bacakları 30 cm yukarı kaldırılır; komada ise soluk borusunun tıkanmaması için yarı yüzükoyun yan yatış pozisyonu verilir.\n💡 Hile: Beyne kan gitmiyorsa (tansiyon düşmüşse) ayakları 30 cm kaldır = **ŞOK**. Bilinç tamamen kapalı ama nefes alıyorsa yan yatır = **KOMA** (kusmukla boğulmayı önler).',
        "pattern": '\\bkoma\\s+pozisyonu\\b|\\bşok\\s+pozisyonu\\b|\\byarı\\s+yüzükoyun\\s+yan\\b|\\bKoma pozisyonu\\b|\\bŞok pozisyonu\\b',
        "option_only_pattern": '^Koma pozisyonu$|^Şok pozisyonu$',
    },
    {
        "id": 'sag_turnike',
        "term": 'Turnike (Boğucu Sargı)',
        "sayfa": 34,
        "tanim": 'Uzuv kopması veya baskı noktalarıyla durdurulamayan fışkırır tarzdaki şiddetli atardamar kanamalarında uygulanan sıkma yöntemidir.\n💡 Hile: Her kanamaya turnike YAPILMAZ! Sadece tek kemikli bölgeye (kol/uyluk) ve fışkıran kanamada uygulanır; en geç 15-20 dakikada bir gevşetilmelidir.',
        "pattern": '\\bturnike[a-zçğıöşü]*\\b|\\bboğucu\\s+sargı[a-zçğıöşü]*\\b|\\bTurnike\\b',
        "option_only_pattern": '^Turnike$',
    },
    {
        "id": 'sag_temel_yasam_destegi',
        "term": 'Temel Yaşam Desteği (30:2)',
        "sayfa": 22,
        "tanim": 'Solunumu ve dolaşımı durmuş kişiye göğüs kemiği 5 cm çökecek şekilde 30 kalp masajı ve ardından 2 kurtarıcı soluk verilmesidir.\n💡 Hile: Formül **30 : 2**. Dakikada 100-120 bası temposuyla, göğüs 5 cm çökecek. Yetişkinde önce kalp masajı, bebek ve boğulmalarda önce solunum başlar.',
        "pattern": '\\bkalp\\s+masajı\\b|\\bsuni\\s+solunum\\b|\\btemel\\s+yaşam\\s+desteği\\b|\\bheimlich\\b|\\bKalp masajı\\b|\\bSuni solunum\\b|\\bTemel Yaşam Desteği\\b',
        "option_only_pattern": '^Kalp masajı$|^Suni solunum$|^Temel Yaşam Desteği$',
    },
]
