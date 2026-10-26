#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Coğrafya 2 (10. Sınıf) Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""

from typing import Any, Dict, List, Tuple

PRECISE_COG2_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "cog2_daginik_yerlesme",
        "term": "Dağınık Kırsal Yerleşmeler",
        "sayfa": 132,
        "tanim": "Engebeli arazide su bol olduğu için herkes kendi bahçesinin başına evini kurar; tıpkı **Karadeniz yaylalarında** komşunun sesini duyup evini göremediğin dağınık köyler gibi. **Doğu ve Batı Karadeniz** bu tipin Türkiye'deki adresidir.\n💡 Sınav Şifresi: **Engebeli arazi + bol su = dağınık**; Karadeniz'i görünce dağınık yerleşmeyi işaretle.",
        "pattern": r"dağınık kırsal yerleşme[a-zçğıöşü]*|dağınık dokulu yerleşme|dağınık yerleşme",
    },
    {
        "id": "cog2_toplu_yerlesme",
        "term": "Toplu Kırsal Yerleşmeler",
        "sayfa": 134,
        "tanim": "Düz ve kurak arazide su kıt olduğu için herkes tek çeşmenin/kuyunun etrafına üşüşür; tıpkı **çölde vaha başında toplanan kervan** gibi. **İç Anadolu ve Güneydoğu Anadolu** bu tipin kaleleridir.\n💡 Sınav Şifresi: **Düz arazi + kıt su = toplu**; İç Anadolu/GAP deyince toplu yerleşme.",
        "pattern": r"toplu kırsal yerleşme[a-zçğıöşü]*|toplu yerleşme",
    },
    {
        "id": "cog2_mesken_tipleri",
        "term": "Mesken Tipleri ve Yapı Malzemeleri",
        "sayfa": 136,
        "tanim": "Ev, doğanın sana verdiği malzemeyle yapılır: ormanda **ahşap** (Karadeniz), kurakta **kerpiç+tonoz çatı** (Güneydoğu/İç Anadolu), kalker/volkanikte **taş** (Akdeniz, İç/Doğu Anadolu). Yani mesken, toprağın aynasıdır.\n💡 Sınav Şifresi: **Ahşap=Karadeniz, Kerpiç=Güneydoğu, Taş=Akdeniz/volkanik**; malzeme ile bölgeyi eşleştir, şaşırma.",
        "pattern": r"tonoz çatı|kerpiç evler[a-zçğıöşü]*|ahşap mesken[a-zçğıöşü]*|taş mesken[a-zçğıöşü]*|yapı malzemesi ile çevre arasında",
    },
    {
        "id": "cog2_kirsal_doku_tipleri",
        "term": "Kırsal Yerleşme Dokuları",
        "sayfa": 138,
        "tanim": "Köyün 'oturma planı' vardır: **küme** (plansız iç içe), **hat boyu/çizgisel** (yol-akarsu-demiryolu boyunca dizilmiş), **dairesel** ve **ışınsal** (bir merkezden yayılan). Tıpkı bir şehrin **metro hattı boyunca uzayan mahalleleri** gibi.\n💡 Sınav Şifresi: **Yol/su boyunca sıra sıra = hat boyu**; merkezden yayılan = ışınsal; iç içe geçmiş = küme.",
        "pattern": r"küme yerleşme|hat boyu yerleşme|dairesel yerleşme|ışınsal yerleşme|çizgisel yerleşme",
    },
    {
        "id": "cog2_ilk_cag_yerlesmeleri",
        "term": "İlk Çağ Yerleşim Alanları ve Uygarlıklar",
        "sayfa": 126,
        "tanim": "İlk insan **suyun, verimli toprağın ve ılıman iklimin** peşinden gitti: Nil (Mısır), Dicle-Fırat (Mezopotamya), İndus-Ganj (Hint), Sarıırmak-Gökırmak (Çin). Anadolu'nun tapusu ise **Çatalhöyük ve Karain**'dir.\n💡 Sınav Şifresi: **Nehir = uygarlık beşiği**; Anadolu'da ilk yerleşme sorusunda **Çatalhöyük (Konya) ve Karain (Antalya)** kodla.",
        "pattern": r"ilk çağ döneminin yerleşim|hint uygarlığı|çatalhöyük|karain mağarası|ege havzası|mezopotamya",
    },
    {
        "id": "cog2_bolge_kavrami",
        "term": "Şekilsel ve İşlevsel Bölgeler",
        "sayfa": 160,
        "tanim": "**Şekilsel bölge** doğal/beşerî özelliklere göre çizilir, sınırı **kademeli** geçer (Karadeniz iklim bölgesi gibi); **işlevsel bölge** ise bir amaca hizmet eder, sınırı **kesindir** (valilik, belediye, istatistik bölgesi). Tıpkı **hava durumu haritası (şekilsel) ile il sınırı haritası (işlevsel)** farkı gibi.\n💡 Sınav Şifresi: **Kademeli sınır = şekilsel, kesin/idari sınır = işlevsel**; 'yönetim, hizmet, planlama' kelimesi geçerse işlevsel.",
        "pattern": r"şekilsel bölge[a-zçğıöşü]*|işlevsel bölge[a-zçğıöşü]*|bölge oluşturulurken|bölge sınırları[a-zçğıöşü]*",
    },
    {
        "id": "cog2_nufus_piramitleri",
        "term": "Nüfus Piramitleri ve Gelişmişlik",
        "sayfa": 172,
        "tanim": "Piramidin **tabanı daralıyorsa** doğum azalıyor, **tepesi genişliyorsa** insanlar uzun yaşıyor demektir; yani ülke **gelişmiş** demektir. Tıpkı **ters dönmüş bir piramit** gibi: taban küçük, tepe geniş = yaşlı ve gelişmiş nüfus.\n💡 Sınav Şifresi: **Taban dar + tepe geniş = gelişmiş ülke**; taban geniş + tepe sivri = gelişmekte olan ülke.",
        "pattern": r"nüfus piramidi[a-zçğıöşü]*|nüfus piramitleri[a-zçğıöşü]*|nüfus artış hızı yavaşlamıştır",
    },
    {
        "id": "cog2_nufus_politikalari",
        "term": "Nüfus Politikaları",
        "sayfa": 178,
        "tanim": "Ülkeler nüfusuna **üç farklı reçete** yazar: **artırmak** (gelişmiş, yaşlı ülkeler — teşvik/çocuk parası), **azaltmak** (aşırı kalabalık gelişmekte olanlar — Çin'in tek çocuk politikası gibi), **niteliği iyileştirmek** (eğitim-sağlık yatırımı).\n💡 Sınav Şifresi: **Gelişmiş=artır, kalabalık gelişmekte=azalt, her ikisi de nitelik**; 'tek çocuk politikası' = azaltmaya yönelik.",
        "pattern": r"nüfus artış hızını düşürme|nüfus artış hızını artırma|nüfus politikaları|nüfus politikası",
    },
    {
        "id": "cog2_turklerin_gocleri",
        "term": "Türklerin Orta Asya'dan Göç Nedenleri",
        "sayfa": 184,
        "tanim": "Türkler Orta Asya'dan **iki büyük sebeple** yürüdü: **doğal/ekonomik** (kuraklık, mera yetersizliği, hayvan hastalığı, nüfus artışı) ve **siyasi** (Çin-Moğol baskısı, boylar arası kavga). Tıpkı **kuraklıkta köyünü terk eden çoban** gibi.\n💡 Sınav Şifresi: **Kuraklık/mera = doğal-ekonomik, Çin baskısı/boy kavgası = siyasi**; 'hayvan hastalığı' doğal sebep, 'Çin' siyasi.",
        "pattern": r"türklerin, ana yurdu sayılan türkistan'dan|türkistan'dan göç|türklerin orta asya'dan göç",
    },
    {
        "id": "cog2_sanayi_devrimi_iklim",
        "term": "Sanayi Devrimi ve Küresel İklim Değişimi",
        "sayfa": 210,
        "tanim": "Sanayi Devrimi'yle **kömür-petrol-linyit** gibi fosil yakıtlar bacadan tütmeye başladı; atmosfere dolan **sera gazları** battaniye gibi dünyayı ısıttı ve **küresel iklim değişikliğini** tetikledi.\n💡 Sınav Şifresi: **Fosil yakıt + sera gazı = iklim değişikliği**; 'Sanayi Devrimi' kelimesi geçen soruda sebep **fosil yakıt kullanımı**.",
        "pattern": r"sanayi devrimi|fosil yakıt tüketimini artırarak|fosil yakıt[a-zçğıöşü]*|küresel iklim değişikliği|sanayi kirliliği",
    },
    {
        "id": "cog2_dogal_afetler",
        "term": "Doğal Afetlerin Sınıflandırılması",
        "sayfa": 224,
        "tanim": "Afetler **kaynağına göre** dörde ayrılır: **jeolojik** (deprem, tsunami, volkan, heyelan), **klimatik/hidrolojik** (sel, kuraklık, kasırga, çığ, don), **biyolojik** (salgın, böcek istilası), **teknolojik** (maden kazası, nükleer sızıntı). Tıpkı **hastanın şikayetine göre bölüm seçmesi** gibi.\n💡 Sınav Şifresi: **Yer kabuğu=jeolojik, hava/su=klimatik, canlı=biyolojik, insan yapımı=teknolojik**; 'heyelan' jeolojik, 'sel' klimatik.",
        "pattern": r"klimatik-hidrolojik|jeolojik kökenli|teknolojik afet|kütle hareketleri|afetler sınıflandırılırken",
    },
    {
        "id": "cog2_erozyon",
        "term": "Erozyon ve Çölleşme",
        "sayfa": 230,
        "tanim": "Bitki örtüsü yok edilince toprağın üst katmanı **su ve rüzgârla süpürülür**; barajlar alüvyonla dolar, tarım verimi düşer, **çölleşme** başlar. Ama dikkat: erozyon **bulaşıcı hastalık yapmaz**.\n💡 Sınav Şifresi: **Erozyon = toprak kaybı + çölleşme + baraj dolması**; 'bulaşıcı hastalık' şıkkı **yanlış** — bu tuzağa düşme.",
        "pattern": r"\\\\berozyon\\\\b|\\\\berozyonun\\\\b|çölleşme riskinin",
    },
    {
        "id": "cog2_cbs_uzaktan_algilama",
        "term": "Coğrafi Bilgi Sistemleri (CBS) ve Uzaktan Algılama",
        "sayfa": 238,
        "tanim": "**CBS**, haritayı katman katman işleyen dijital bir beyin gibi konumsal veriyi depolar ve sorgular; **uzaktan algılama** ise uydu/kamera ile temastan veri toplayan 'gözcü' teknolojisidir — ikisi birlikte afet, haritacılık ve şehir planlamada hızlı karar sağlar.\n💡 Sınav Şifresi: **CBS = depolama+işleme (bilgisayar ortamı)**, **Uzaktan Algılama = temassız veri toplama (uydu)**; soruda 'uydu/fotoğraf' geçiyorsa uzaktan algılama, 'katman/sorgu/analiz' geçiyorsa CBS.",
        "pattern": r"coğrafi bilgi sistemleri|uzaktan algılama|cbs",
    },
]
