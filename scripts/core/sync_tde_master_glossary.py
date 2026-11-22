#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TDE (Türk Dili ve Edebiyatı 1-8) Birleşik Tahribatsız Kavram Balonu Motoru (`soru_xray` & `secenekler_xray`).

Özellikler:
1. Dönem Öncelikli Kümülatif Katalog Yükleme (`data/concepts/TDE_1..8_concepts.json` + `MASTER_LITERARY_GLOSSARY`):
   - Bir `TDE N` sorusu işlenirken önce kendi döneminin (`TDE_N_concepts.json`) kavramları,
     ardından önceki/diğer dönemlerin kavramları ve evrensel edebiyat sözlüğü terim uzunluğuna göre yüklenir.
2. Tahribatsız Çok Katmanlı `soru_xray` Birleştirici (`inject_concepts_into_stem_xray`):
   - Mevcut `soru_xray` içindeki `.sound-word`, `.pos-word.has-sound` (ses olayları) ve `.xray-junction` (`|`)
     etiketlerini %100 korur.
   - Asla iç içe `<span>` üretmez; görünmez saf `.pos-word` içinde kavram yakalanırsa iç içe span açmadan
     doğrudan tıklanabilir `.vocab-word.concept-word` balonuna yükseltir.
   - `dogru_nedeni` ("Çünkü: ...") alanına asla dokunmaz.
3. Tam Kapsamlı ve Bağlamsal `secenekler_xray` Giydirici (`enrich_option_xray`):
   - Yapısal şıkları (`I ve III`, `D - Y - D`, `(,) (“) (”) (!)` vb.) deterministik filtreyle atlar.
   - İçerikli şıklarda hem genel `pattern` eşleşmelerini hem de soru kökündeki `stem_context_pattern` koşulunu
     sağlayan `option_only_pattern` eşleşmelerini `.vocab-word.concept-word` balonuyla sarar.
   - 31 şıktaki sondaki PDF sayfa numarası kalıntılarını (`"Soru işareti (?) 33"`) metin bütünlüğünü bozmadan
     yok sayarak eşleştirir.
"""

import html
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
TDE_JSON_PATH = ROOT_DIR / "data" / "subjects" / "TDE.json"
CONCEPTS_DIR = ROOT_DIR / "data" / "concepts"

# Soru kökündeki meta-yönergeleri ve morfolojik sahte pozitifleri baloncuk olmaktan çıkaran desenler
NOISE_CONCEPT_TERMS = {
    "yazım yanlışı",
    "yazım yanlışları",
    "yazım kuralları",
    "yazım kuralı",
    "noktalama işaretleri",
    "noktalama işareti",
    "noktalama yanlışı",
    "anlatım bozukluğu",
    "anlatım bozuklukları",
    "cümlede yapı",
    "yapı bakımından",
    "ögelerine ayrılmıştır",
    "ögelerine yanlış ayrılmıştır",
    "masalar",
    "masalardan",
    "masalara",
    "masalarda",
    "masaların",
    "romanya",
    "romanyalı",
    "adil",
    "adile",
    "dekorasyonunda",
    "dekorasyonundan",
    "dekorlanıp",
    "denemek",
    "denemezse",
    "denememde",
    "eleştirilmiştir",
    "eleştirir",
    "güncel",
    "günlük",
    "koşmakta",
    "koşmalı",
    "koşmamalıyız",
    "koşmaz",
    "öykünen",
    "sohbet",
    "sohbeti",
    "sohbete",
    "sohbetlerden",
    "anısına",
    "anılmaktadır",
    "anıtkabir",
    "anılıyor",
    "anılmazdı",
    "anızların",
    "anıt",
    "anıyorum",
    "anına",
    "anılacaksınız",
    "kıta",
    "kıtaların",
    "levha tektoniği",
    "kimono",
    "halley kuyruklu yıldızı",
    "milton kasırgası",
    "müzeler",
    "internette",
    "farkında",
    "okunacak kitap sayısının sınırsız",
    "sonrasız",
    "dildeki",
    "verimine",
    "nüfusun",
    "toplumun",
    "kuramlar",
    "turunçgiller",
    "mutluluk",
    "gelgeç",
    "doğal kaynaklar",
    "doğa tahribatını",
    "tarih olayları",
    "manevi değerlere",
    "söz sanatına",
    "edebiyat tarihine",
    "gelenekçi roman",
    "tarihî olayları ele almayan",
    "karşılaştırmasıyla",
    "yargı gerekçesiyle",
}

MASTER_LITERARY_GLOSSARY: List[Dict[str, Any]] = [
    {
        "id": "tde_makale",
        "term": "Makale",
        "sayfa": 39,
        "tanim": "Bir tezi **kanıt, belge ve verilerle** savunan, nesnel ve bilimsel bir üslupla yazılan öğretici gazete/dergi yazısıdır; mahkemedeki gerekçeli savunma dosyası gibidir.\n💡 Hile: Yazar elinde istatistik ve belgeyle **mahkemede tez kanıtlıyorsa Makale**, aynaya bakıp kendi kendine konuşuyorsa **Deneme**, karşısına seni oturtup soru soruyorsa **Sohbet**tir.",
        "pattern": r"\bmakale[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_hikaye",
        "term": "Hikâye (Öykü)",
        "sayfa": 36,
        "tanim": "Yaşanmış veya yaşanabilir olayları dar bir kişi kadrosu, tek bir ana olay veya kesit etrafında anlatan **kısa** edebî türdür.\n💡 Hile: Metni okurken **'Sonunda ne oldu?'** merakı varsa **Olay (Maupassant – Ömer Seyfettin)**; hiçbir düğüm çözülmeden günlük hayattan bir fotoğraf karesi gibi bitiyorsa **Durum (Çehov – Sait Faik / Memduh Şevket)** hikâyesidir.",
        "pattern": r"\bhikâye[a-zçğıöşü]*\b|\bhikaye[a-zçğıöşü]*\b|\böykü(?!n)[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_siir",
        "term": "Şiir",
        "sayfa": 66,
        "tanim": "Duygu, hayal ve düşüncelerin **ölçü, kafiye, redif ve imge** gibi ahenk unsurlarıyla dizeler hâlinde aktarıldığı edebî türdür.\n💡 Hile: Kelimeler sözlük anlamıyla değil **çağrışım ve imgeyle** konuşuyorsa, alt alta dizelerde ritim varsa **Şiir**dir.",
        "pattern": r"\bşiir[a-zçğıöşü]*\b|\bmanzume[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_roman",
        "term": "Roman",
        "sayfa": 112,
        "tanim": "İnsanların başından geçen veya geçebilecek olayları geniş bir kişi kadrosu, çok katmanlı olay örgüsü ve ayrıntılı zaman/mekân tasvirleriyle anlatan **uzun** kurmaca anlatıdır.\n💡 Hile: **İlk çeviri:** *Telemak* (Yusuf Kâmil Paşa), **İlk yerli:** *Taaşşuk-ı Talat ve Fitnat* (Şemsettin Sami), **İlk edebî:** *İntibah* (Namık Kemal), **İlk tarihî:** *Cezmi* (Namık Kemal), **İlk realist:** *Araba Sevdası* (Recaizade), **İlk psikolojik:** *Eylül* (Mehmet Rauf).",
        "pattern": r"\broman(?!ya|larca)[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_tiyatro",
        "term": "Tiyatro",
        "sayfa": 145,
        "tanim": "Sahnede seyirciler önünde oyuncular tarafından canlandırılmak üzere yazılan, diyalog ve harekete dayalı göstermeye bağlı edebî türdür.\n💡 Hile: **Trajedi** = soylular/tanrılar + acı + üç birlik kuralı; **Komedi** = sıradan halk + güldürü + üç birlik kuralı; **Dram** = acı ve gülünç bir arada + **üç birlik kuralı YOK**.",
        "pattern": r"\btiyatro[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_beyit",
        "term": "Beyit",
        "sayfa": 69,
        "tanim": "Aynı ölçüde yazılmış, kendi içinde anlam bütünlüğü taşıyan **iki dizeden** oluşan Divan şiiri nazım birimidir.\n💡 Hile: **2 satır (dize) = Beyit = Divan şiiri** (*Gazel, Kaside, Mesnevi*); **4 satır = Dörtlük = Halk şiiri** (*Koşma, Semai, Varsağı, Mâni*).",
        "pattern": r"\bbeyit[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_dortluk",
        "term": "Dörtlük",
        "sayfa": 70,
        "tanim": "**Dört dizeden** oluşan, İslamiyet öncesi ve Halk şiirinin temel yapı taşını oluşturan millî nazım birimidir.\n💡 Hile: **Koşuk, Sagu, Koşma, Semai, Varsağı, Destan, Mâni, İlahi** dörtlükle; Divan'da ise **Rubai, Tuyuğ, Şarkı, Murabba** dörtlükle yazılır.",
        "pattern": r"\bdörtlük[a-zçğıöşü]*\b|\bdortluk[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_bent",
        "term": "Bent",
        "sayfa": 71,
        "tanim": "Bir şiirde üç, beş veya daha fazla dizeden oluşan kümelere verilen nazım birimidir.\n💡 Hile: Dize sayısı **2 (beyit)** veya **4 (dörtlük)** değilse (3'lü, 5'li veya serbest uzunluklu kümeler hâlindeyse) nazım birimi doğrudan **Bent**tir.",
        "pattern": r"\bbent[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_mahlas",
        "term": "Mahlas",
        "sayfa": 94,
        "tanim": "Divan şairlerinin şiirlerinin **son beytinde (makta)** gerçek adları yerine kullandıkları edebî takma addır.\n💡 Hile: Şairin takma adı **Divan şiirinde (son beyitte)** geçiyorsa **Mahlas** (*Fuzûlî, Bâkî, Nedîm*); **Halk şiirinde (son dörtlükte)** geçiyorsa **Tapşırma**dır (*Karacaoğlan, Köroğlu*).",
        "pattern": r"\bmahlas[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_tapsirma",
        "term": "Tapşırma",
        "sayfa": 94,
        "tanim": "Âşık edebiyatı ozanlarının şiirin **son dörtlüğünde** adlarını veya mahlaslarını söyleyerek şiire imzalarını atmasıdır.\n💡 Hile: **Hece ölçüsü + dörtlük + son dörtlükte ozan adı ('Karacaoğlan der ki...') = Tapşırma**.",
        "pattern": r"\btapşırma[a-zçğıöşü]*\b|\btapsirma[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_kaside",
        "term": "Kaside",
        "sayfa": 72,
        "tanim": "Din ve devlet büyüklerini **övmek** amacıyla aruz ölçüsü ve beyitlerle (33-99 beyit, `aa ba ca...`) yazılan Divan edebiyatı nazım biçimidir.\n💡 Hile: **5-15 beyit + aşk/şarap = Gazel**; **33-99 beyit + övgü (Methiye/Fahriye/Nesib/Girizgâh) = Kaside**.",
        "pattern": r"\bkaside[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_gazel",
        "term": "Gazel",
        "sayfa": 71,
        "tanim": "Aşk, güzellik ve ayrılık konularını işleyen, 5-15 beyitten oluşan, `aa ba ca da` kafiye düzenine sahip Divan şiiri nazım biçimidir.\n💡 Hile: İlk beyti `aa` (**Matla**), son beytinde şairin adı var (**Makta**), beyit sayısı **5-15** arası ve konusu **aşk** ise gözün kapalı **Gazel** işaretle.",
        "pattern": r"\bgazel[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_mesnevi",
        "term": "Mesnevi",
        "sayfa": 75,
        "tanim": "Her beyti kendi arasında kafiyeli (`aa bb cc dd...`), beyit sınırı olmayan, Divan edebiyatında uzun aşk, tasavvuf ve kahramanlık hikâyelerinin anlatıldığı nazım biçimidir.\n💡 Hile: Her beyti kendi içinde (`aa bb cc`) kafiyeli olduğu için binlerce beyit uzayabilir; **Divan edebiyatının romanı/hikâyesi = Mesnevi**dir. 5 mesnevisi olana **Hamse** sahibi denir.",
        "pattern": r"\bmesnevi[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_rubai",
        "term": "Rubai",
        "sayfa": 74,
        "tanim": "Tek dörtlükten oluşan, `aaxa` şeklinde kafiyelenen, kendine özgü 24 aruz kalıbıyla felsefi ve tasavvufi düşünceleri yoğun biçimde işleyen Divan nazım biçimidir.\n💡 Hile: **Tek dörtlük (`aaxa`) + aruz + felsefe/hikmet + Ömer Hayyam** = **Rubai**; Türklerin kazandırdığı tek kalıplı (`fâilâtün fâilâtün fâilün`) ikizi ise **Tuyuğ**dur (Kadı Burhaneddin).",
        "pattern": r"\brubai[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_sarki",
        "term": "Şarkı",
        "sayfa": 76,
        "tanim": "Divan edebiyatına **Türklerin kazandırdığı**, bestelenmek üzere dörtlüklerle yazılan, aşk ve eğlence konulu lirik nazım biçimidir.\n💡 Hile: **Divan şiirinde dörtlük + nakarat (tekrarlanan 4. dize) + Nedîm** = **Şarkı** (Halk şiirindeki karşılığı **Türkü**dür).",
        "pattern": r"\bşarkı\s+nazım\b",
    },
    {
        "id": "tde_kosma",
        "term": "Koşma",
        "sayfa": 82,
        "tanim": "Âşık edebiyatında **11'li hece ölçüsü** ve 3-5 dörtlükle (`abab cccb dddb`) saz eşliğinde söylenen en yaygın nazım biçimidir.\n💡 Hile: Heceyi say: **11'li hece = Koşma** (konusuna göre aşk=*Güzelleme*, yiğitlik=*Koçaklama*, eleştiri=*Taşlama*, ölüm=*Ağıt*); **8'li hece = Semai** veya **Varsağı** ('Bre/Hey!' ünlemli).",
        "pattern": r"\bkoşma(?!k|l[ıi]|m[aı]|z|y[aı])[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_semai",
        "term": "Semai",
        "sayfa": 84,
        "tanim": "Âşık edebiyatında kendine özgü bir ezgiyle ve **8'li hece ölçüsüyle** söylenen lirik nazım biçimidir.\n💡 Hile: Dizedeki ünlü harfleri say: **8 ünlü varsa** ve içinde *'Bre, hey, behey'* gibi kabadayı ünlemleri **yoksa** doğrudan **Semai**dir.",
        "pattern": r"\bsemai[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_varsagi",
        "term": "Varsağı",
        "sayfa": 85,
        "tanim": "Güney Anadolu'daki Varsak Türkmenlerine özgü, **8'li hece ölçüsü** ve yiğitçe/mertçe bir edayla söylenen âşık edebiyatı nazım biçimidir.\n💡 Hile: **8'li hece + 'Bre, hey, behey!' ünlemi** = %100 **Varsağı** (en büyük ustası Karacaoğlan ve Dadaloğlu).",
        "pattern": r"\bvarsağı[a-zçğıöşü]*\b|\bvarsagi[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_deneme",
        "term": "Deneme",
        "sayfa": 152,
        "tanim": "Yazarın özgürce seçtiği bir konuda kesin yargılara ve kanıtlama kaygısına girmeden, **kendi kendisiyle konuşuyormuş gibi** samimi bir 'ben' diliyle yazdığı düşünce yazısıdır.\n💡 Hile: Yazar **'Bana göre, ben...'** diyerek kendi iç dünyasıyla dertleşiyorsa **Deneme** (kurucusu **Montaigne**, bizde **Nurullah Ataç, Suut Kemal Yetkin**); okura soru sorup sohbet ediyorsa **Söyleşi (Sohbet)**tir.",
        "pattern": r"\bdeneme(?!k\b|z|y[eaıi]|di|miş|se|m\b|mde\b|mden\b|miz\b|n\b|nde\b|si\b|sinde\b)[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Deneme$",
    },
    {
        "id": "tde_sohbet",
        "term": "Sohbet (Söyleşi)",
        "sayfa": 154,
        "tanim": "Yazarın güncel veya genel bir konuyu, **karşısında okur varmış da onunla dertleşiyormuş gibi** soru-cevaplı ve içten bir üslupla ele aldığı düşünce yazısıdır.\n💡 Hile: Metinde **'Siz ne dersiniz bilmem?, Öyle değil mi dostlar?'** gibi okura doğrudan seslenen soru cümleleri varsa hiç düşünme **Sohbet (Söyleşi)** işaretle (ustaları **Ahmet Rasim – Ramazan Sohbetleri, Şevket Rado – Eşref Saat**).",
        "pattern": r"\bsohbet\s+türü[a-zçğıöşü]*\b|\bsöyleşi[a-zçğıöşü]*\b",
        "option_only_pattern": r"^Sohbet$|^Söyleşi$",
    },
    {
        "id": "tde_fikra",
        "term": "Fıkra (Köşe Yazısı)",
        "sayfa": 156,
        "tanim": "Gazete ve dergilerin belirli bir sütununda **güncel** siyasal, toplumsal ve kültürel olayları kanıtlama zorunluluğu olmadan, yalın ve akıcı bir dille yorumlayan günübirlik köşe yazısıdır.\n💡 Hile: **'Güncel olay + gazete köşesi + kanıtlama zorunluluğu olmadan kişisel yorum'** üçlüsü bir aradaysa **Fıkra (Köşe Yazısı)**dır; bilimsel kanıt olsaydı *Makale* olurdu.",
        "pattern": r"\bfıkra[a-zçğıöşü]*\b|\bfikra[a-zçğıöşü]*\b|\bköşe\s+yazısı[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_elestiri",
        "term": "Eleştiri (Tenkit)",
        "sayfa": 160,
        "tanim": "Bir sanat veya düşünce eserini hem olumlu hem olumsuz yönleriyle inceleyerek gerçek değerini ortaya koyan, okura ve sanatçıya kılavuzluk eden yazı türüdür.\n💡 Hile: Bir **eseri, yazarı veya edebî anlayışı teraziye koyup değerlendiriyorsa Eleştiri (Tenkit)**dir (ilk edebî eleştiri: Namık Kemal – *Tahrib-i Harabat*).",
        "pattern": r"\beleştiri(?!l|r)[a-zçğıöşü]*\b|\btenkit[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_mulakat",
        "term": "Mülakat (Görüşme)",
        "sayfa": 162,
        "tanim": "Alanında uzman veya ünlü bir kişiyle önceden hazırlanmış sorular çerçevesinde yapılan **soru-cevap** konuşmasının değiştirilmeden yazıya geçirilmesidir.\n💡 Hile: Sadece **'Soru – Cevap'** varsa ve yazar kendi gözlemini/fotoğrafını katmadan konuşmayı olduğu gibi aktarıyorsa **Mülakat** (Ruşen Eşref Ünaydın – *Diyorlar ki*); yazar o bölgeye gidip kendi gözlem, araştırma ve fotoğraflarını da katıyorsa **Röportaj**dır.",
        "pattern": r"\bmülakat[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_roportaj",
        "term": "Röportaj",
        "sayfa": 164,
        "tanim": "Bir yeri, kurumu veya toplumsal sorunu **yerinde gezip görerek**, fotoğraflar, belgeler, tanık konuşmaları ve yazarın kendi izlenimleriyle birleştirerek anlatan kapsamlı gazete/dergi yazısıdır.\n💡 Hile: **Mülakat + Gezi/Gözlem + Fotoğraf/Belge + Yazarın Yorumu = Röportaj** (en büyük ustaları **Yaşar Kemal, Fikret Otyam, Hikmet Feridun Es**).",
        "pattern": r"\bröportaj[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_ani",
        "term": "Anı (Hatıra)",
        "sayfa": 165,
        "tanim": "Yaşanmış veya tanık olunmuş önemli olayların, **üzerinden yıllar geçtikten sonra** hafızaya ve belgelere dayanılarak geçmiş zaman kipiyle kaleme alındığı türdür.\n💡 Hile: Olay yaşandığı akşam tarih atılarak yazılıyorsa **Günlük (Günce)**; **saçlar ağardıktan yıllar sonra geriye dönüp** yazılıyorsa **Anı (Hatıra)**dır (*Babürname, Tabsıra, Saray ve Ötesi, Ömer'in Çocukluğu, Falaka*).",
        "pattern": r"\bhatıra[a-zçğıöşü]*\b|\banı\s+türü\b|\banılar(?:ı|ım|ımız|ın|ınız|ını|ınızı|ından|ıyla|la|da|dan|a)?\b",
        "option_only_pattern": r"^Anı$|^Hatıra$",
    },
    {
        "id": "tde_gunluk",
        "term": "Günlük (Günce)",
        "sayfa": 167,
        "tanim": "Kişinin gün içinde yaşadığı olayları, duygu ve izlenimlerini **tarih belirterek günü gününe** birinci kişi ağzıyla yazdığı samimi metinlerdir.\n💡 Hile: Metnin sağ/sol üstünde **gün-ay-yıl tarihi** varsa ve olay **sıcağı sıcağına o gün** anlatılıyorsa kesinlikle **Günlük (Günce)**dir (Divan edebiyatındaki adı **Ruzname**dir; *Günce* adını veren **Nurullah Ataç**'tır).",
        "pattern": r"\bgünce(?!l)[a-zçğıöşü]*\b|\bgünlük\s+türü\b",
        "option_only_pattern": r"^Günlük$",
    },
    {
        "id": "tde_destan",
        "term": "Destan (Epope)",
        "sayfa": 98,
        "tanim": "Bir milletin tarih öncesi çağlarda yaşadığı göç, savaş, kıtlık gibi büyük kırılmaları **olağanüstü kahraman ve motiflerle** anlatan uzun manzum eserdir.\n💡 Hile: Halk arasında kendiliğinden doğup (*Doğuş → Yayılma → Derleme*) ozanlarca söylenmişse **Doğal Destan** (*Oğuz Kağan, Ergenekon, Manas, İlyada, Şehname*); yakın tarihteki bir olayı **tek bir şair** oturup yazmışsa **Yapma (Yapay) Destan**dır (*Üç Şehitler Destanı* – F. H. Dağlarca, *Henriade* – Voltaire).",
        "pattern": r"\bdestan[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_masal",
        "term": "Masal",
        "sayfa": 102,
        "tanim": "Genellikle halkın ortak ürünü olan, **tekerlemeyle (döşeme)** başlayan, zaman ve mekânı belirsiz, peri/dev/cin gibi olağanüstü ögelerle iyiliğin kötülüğü yenmesini anlatan eğitici türdür.\n💡 Hile: **'Bir varmış bir yokmuş' tekerlemesi (Döşeme) + belirsiz zaman/mekân + '-miş' kipi + sonunda gökten üç elma düşmesi (Dilek)** = **Masal**.",
        "pattern": r"\bmasal(?!ar\b|ar[aıi]|ara\b|arda\b|ardan\b|arın\b)[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_fabl",
        "term": "Fabl",
        "sayfa": 104,
        "tanim": "Kahramanları çoğunlukla **insan gibi düşünen ve konuşan hayvanlar veya bitkiler** olan, sonunda mutlaka bir **hayat ve ahlak dersi (öğüt)** veren alegorik anlatıdır.\n💡 Hile: **Hayvan kahramanlar + Teşhis & İntak sanatı + sonunda kıssadan hisse (Öğüt)** = **Fabl** (Türk edebiyatında ilk örneği Şeyhî'nin **Harnâme** mesnevisidir; dünyada **Beydeba, Ezop, La Fontaine**).",
        "pattern": r"\bfabl[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_redif",
        "term": "Redif",
        "sayfa": 78,
        "tanim": "Dize sonlarında **yazılışları, anlamları ve dil bilgisi görevleri birebir aynı** olan eklerin veya kelimelerin tekrarlanmasıdır.\n💡 Hile: Dize sonundaki kelimeleri kök ve eklerine ayır; en sondaki ortak eklerin **görevi aynıysa** (ikisi de çoğul *-lar*, ikisi de geçmiş zaman *-dı* ise) onları **Redif** diye çöpe at, kalan kök seslerinde **Kafiye (Uyak)** ara!",
        "pattern": r"\bredif[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_kafiye",
        "term": "Kafiye (Uyak)",
        "sayfa": 77,
        "tanim": "Dize sonlarında redif ayrıldıktan sonra kalan, **anlamları ve görevleri farklı** kelime veya eklerdeki ses benzerliğidir.\n💡 Hile: Redifi soyduktan sonra kalan ortak harfleri parmağınla say: **1 tek ünsüz = Yarım**, **2 ses = Tam** (uzun ünlü `â/î/û` tek başına 2 ses sayılır!), **3 ve daha fazla ses = Zengin**, **yazılışı aynı anlamı farklı sesteş kelime = Cinaslı** uyaktır.",
        "pattern": r"\bkafiye[a-zçğıöşü]*\b|\buyak[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_hece_olcusu",
        "term": "Hece Ölçüsü",
        "sayfa": 74,
        "tanim": "Dizelerdeki **hece (ünlü harf) sayılarının eşitliğine** dayanan, İslamiyet öncesi ve Halk şiirinde kullanılan millî şiir ölçümüzdür.\n💡 Hile: Dizedeki bütün ünsüzleri unut, **sadece sesli (ünlü: a, e, ı, i, o, ö, u, ü) harfleri say**! Kaç sesli harf varsa o kadar hece vardır (**7'li = Mâni**, **8'li = Semai/Varsağı**, **11'li = Koşma/Koşuk**).",
        "pattern": r"\bhece\s+ölçüsü[a-zçğıöşü]*\b|\bheceyle\b",
    },
    {
        "id": "tde_aruz_olcusu",
        "term": "Aruz Ölçüsü",
        "sayfa": 73,
        "tanim": "Hecelerin sayısına değil, **açık (kısa `.` - ünlüyle biten) ve kapalı (uzun `_` - ünsüzle veya uzun ünlüyle `â/î/û` biten)** ses değerlerine dayanan Divan şiiri ölçüsüdür.\n💡 Hile: Hece sayısı tutmuyorsa veya metinde **'açık-kapalı hece / fâilâtün / mefâîlün / Divan şiiri'** geçiyorsa ölçü kesinlikle **Aruz Ölçüsü**dür (Türk edebiyatında ilk kez *Kutadgu Bilig*'de kullanılmıştır).",
        "pattern": r"\baruz\s+ölçüsü[a-zçğıöşü]*\b|\baruzla\b",
    },
    {
        "id": "tde_trajedi",
        "term": "Trajedi (Facia)",
        "sayfa": 146,
        "tanim": "Seyircide acıma ve korku duyguları uyandırarak ruhu kötülüklerden arındırmayı (**katarsis**) amaçlayan, konuları tarihten ve mitolojiden alınan klasik tiyatro türüdür.\n💡 Hile: **Kahramanlar kral/kraliçe/tanrı (soylular) + üç birlik kuralı + manzum (şiir) dil + sahnede kan/cinayet ve kaba söz YASAK** = **Trajedi**.",
        "pattern": r"\btrajedi[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_komedi",
        "term": "Komedi",
        "sayfa": 147,
        "tanim": "İnsanların ve toplumun gülünç, aksayan yönlerini güldürürken düşündürmek amacıyla sahneleyen tiyatro türüdür.\n💡 Hile: **Kahramanlar sıradan halk + günlük yaşam + üç birlik kuralı + kaba söz ve şaka SERBEST** = **Komedi** (Kişi kusuru = *Karakter* [Molière - Cimri], gelenek = *Töre* [Şair Evlenmesi], merak/tesadüf = *Entrika* komedisi).",
        "pattern": r"\bkomedi[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_dram",
        "term": "Dram",
        "sayfa": 148,
        "tanim": "Hayatı hem acıklı hem gülünç yönleriyle bir arada yansıtan, Klasisizmin katı kurallarına başkaldırarak Romantizmle doğan tiyatro türüdür.\n💡 Hile: **Acı + Gülünç bir arada + Üç birlik kuralına uyma zorunluluğu YOK + Kahramanlar her sınıftan (soylu + halk) + Victor Hugo / Shakespeare** = **Dram**.",
        "pattern": r"\bdram\b|\bdramlar\b|\bdramı\b|\bdram\s+türü\b",
    },
]

# Yapısal şık kontrolü
STRUCTURAL_ROMAN_RE = re.compile(
    r"^(?:Yalnız\s+)?[IVX]+(?:\s*(?:ve|ya\s+da|,|-)\s*[IVX]+)*\.?$",
    re.IGNORECASE,
)
STRUCTURAL_DY_RE = re.compile(r"^[DY](?:\s*[-,]\s*[DY])+$")
STRUCTURAL_PUNCT_RE = re.compile(r"^(?:\([^)]*\)\s*)+$")
STRUCTURAL_PAIR_RE = re.compile(r"^[IVX]+\.\s*[a-zçğıöşü]\s*[,\s]+[IVX]+\.", re.IGNORECASE)
STRUCTURAL_NUM_RE = re.compile(r"^\d+$")

# HTML tag ve span ayrıştırıcı regexler
TOKEN_SPLIT_RE = re.compile(
    r'(<span\s+class="xray-junction"[^>]*>.*?</span>'
    r'|<span\s+class="[^"]*(?:sound-word|has-sound|concept-word)[^"]*"[^>]*>.*?</span>'
    r'|<span\s+class="[^"]*\bpos-word\b[^"]*"[^>]*>[^<]*</span>'
    r'|<[^>]+>)',
    re.DOTALL,
)
PURE_POS_SPAN_RE = re.compile(
    r'^<span\s+class="[^"]*\bpos-word\b[^"]*"[^>]*>([^<]*)</span>$',
    re.DOTALL,
)
CONCEPT_SPAN_RE = re.compile(
    r'<span\s+class="vocab-word\s+concept-word"[^>]*>(.*?)</span>',
    re.DOTALL,
)


def strip_xray_to_plain(html_str: str) -> str:
    """Röntgen HTML metnindeki kavşakları ve tüm etiketleri sökerek saf metni döndürür."""
    if not html_str:
        return ""
    s = re.sub(r'<span\s+class="xray-junction"[^>]*>.*?</span>', "", html_str, flags=re.DOTALL)
    return html.unescape(re.sub(r"<[^>]+>", "", s))


def is_structural_option(opt_text: str) -> bool:
    """Roma rakamı, D-Y-D veya salt noktalama dizisi olan yapısal şıkları tespit eder."""
    t = re.sub(r"\s+\d{1,2}$", "", opt_text.strip())
    if not t:
        return True
    if STRUCTURAL_ROMAN_RE.match(t):
        return True
    if STRUCTURAL_DY_RE.match(t):
        return True
    if STRUCTURAL_PUNCT_RE.match(t):
        return True
    if STRUCTURAL_PAIR_RE.match(t):
        return True
    if STRUCTURAL_NUM_RE.match(t):
        return True
    return False


def strip_noise_concept_spans(html_str: str) -> Tuple[str, int]:
    """Soru kökünde veya şıkta meta-yönerge ('yazım yanlışı', 'noktalama işaretleri' vb.)
    olarak sarılmış hatalı kavram balonlarını düz metne çevirir."""
    if not html_str or "concept-word" not in html_str:
        return html_str, 0

    removed = 0

    def _repl(match: re.Match) -> str:
        nonlocal removed
        full_span = match.group(0)
        inner = match.group(1)
        clean_inner = html.unescape(re.sub(r"<[^>]+>", "", inner)).strip().lower()
        if clean_inner in NOISE_CONCEPT_TERMS or any(
            clean_inner.startswith(nt) for nt in ("yazım yanlış", "yazım kural", "noktalama işaret", "anlatım bozuklu")
        ):
            # Şıkta tam olarak '^Günlük$' veya '^Sohbet$' eşleştiyse koru,
            # ancak soru kökündeki 'günlük kıyafet / sohbet ettik' ifadelerini temizle
            if inner.strip() in ("Günlük", "Sohbet") and "Sohbet sohbeti" not in html_str:
                return full_span
            removed += 1
            return inner
        return full_span

    return CONCEPT_SPAN_RE.sub(_repl, html_str), removed


def load_all_semester_catalogs() -> Dict[int, List[Dict[str, Any]]]:
    catalogs: Dict[int, List[Dict[str, Any]]] = {}
    for sem in range(1, 9):
        p = CONCEPTS_DIR / f"TDE_{sem}_concepts.json"
        if p.exists():
            catalogs[sem] = json.loads(p.read_text(encoding="utf-8"))
        else:
            catalogs[sem] = []
    return catalogs


def build_semester_matchers(
    target_sem: int,
    catalogs: Dict[int, List[Dict[str, Any]]],
) -> List[Dict[str, Any]]:
    """İlgili dönem (`target_sem`) öncelikli olmak üzere tüm TDE kavram eşleştiricilerini derler."""
    ordered_sems = [target_sem] + [s for s in range(target_sem - 1, 0, -1)] + [s for s in range(target_sem + 1, 9)]
    raw_items: List[Tuple[int, int, Dict[str, Any]]] = []

    for tier_idx, sem in enumerate(ordered_sems):
        tier = 0 if sem == target_sem else (1 if sem < target_sem else 2)
        for c in catalogs.get(sem, []):
            raw_items.append((tier, sem, c))

    for c in MASTER_LITERARY_GLOSSARY:
        raw_items.append((3, target_sem, c))

    matchers: List[Dict[str, Any]] = []
    for tier, source_sem, c in raw_items:
        gen_pat = c.get("pattern", "")
        opt_pat = c.get("option_only_pattern", "")
        ctx_pat = c.get("stem_context_pattern", "")

        gen_rx: Optional[re.Pattern] = None
        if gen_pat and "__DISABLED_META_DIRECTIVE__" not in gen_pat:
            try:
                gen_rx = re.compile(gen_pat, re.IGNORECASE)
            except re.error:
                gen_rx = None

        opt_rx: Optional[re.Pattern] = None
        if opt_pat:
            try:
                opt_rx = re.compile(opt_pat, re.IGNORECASE)
            except re.error:
                opt_rx = None

        ctx_rx: Optional[re.Pattern] = None
        if ctx_pat:
            try:
                ctx_rx = re.compile(ctx_pat, re.IGNORECASE)
            except re.error:
                ctx_rx = None

        if not gen_rx and not opt_rx:
            continue

        term = c.get("term", "")
        matchers.append({
            "id": c.get("id", term.lower()),
            "term": term,
            "term_key": re.sub(r"\s*\([^)]*\)", "", term).strip().lower(),
            "sayfa": c.get("sayfa") or 14,
            "source_sem": source_sem,
            "tanim": c.get("tanim", ""),
            "gen_rx": gen_rx,
            "opt_rx": opt_rx,
            "ctx_rx": ctx_rx,
            "tier": tier,
            "len": len(term),
        })

    # Önce uzun terimler, aynı uzunlukta ise ilgili dönemin kendi tanımı öncelikli
    matchers.sort(key=lambda m: (-m["len"], m["tier"]))
    return matchers


def format_concept_span(
    matched_surface: str,
    matcher: Dict[str, Any],
    question_sem: int,
) -> str:
    tr_esc = html.escape(matcher["tanim"], quote=True)
    note_sem = matcher["source_sem"] if matcher["tier"] == 0 else question_sem
    note_esc = html.escape(
        f"MEB TDE Dönem {note_sem} • S.{matcher['sayfa']} • {matcher['term']}",
        quote=True,
    )
    return (
        f'<span class="vocab-word concept-word" '
        f'data-tr="{tr_esc}" data-note="{note_esc}" '
        f'onclick="showVocabBubble(this, event)">'
        f"{html.escape(matched_surface, quote=False)}</span>"
    )


def enrich_plain_segment_with_concepts(
    raw_segment: str,
    question_sem: int,
    matchers: List[Dict[str, Any]],
    used_term_keys: Set[str],
    is_option: bool = False,
    stem_plain: str = "",
) -> Tuple[str, int]:
    """Düz (unescaped) bir metin parçası üzerinde çakışmasız kavram balonları oluşturur."""
    if not raw_segment or not raw_segment.strip():
        return html.escape(raw_segment, quote=False), 0

    # Şıklarda sondaki PDF sayfa numarası kalıntısını ("Soru işareti (?) 33") eşleştirme sırasında hariç tut
    search_len = len(raw_segment)
    if is_option:
        m_trail = re.search(r"\s+\d{1,2}$", raw_segment)
        if m_trail and m_trail.start() > 0:
            search_len = m_trail.start()

    search_text = raw_segment[:search_len]
    chosen_spans: List[Tuple[int, int, str]] = []

    for m in matchers:
        t_key = m["term_key"]
        if not is_option and t_key in used_term_keys:
            continue

        candidates: List[re.Match] = []
        if m["gen_rx"] is not None:
            candidates.extend(m["gen_rx"].finditer(search_text))

        if is_option and not candidates and m["opt_rx"] is not None:
            if m["ctx_rx"] is None or m["ctx_rx"].search(stem_plain):
                candidates.extend(m["opt_rx"].finditer(search_text.strip()))

        for match in candidates:
            # Eğer strip edilmiş search_text üzerinde ^...$ eşleştiyse orijinal dilimdeki indeksini bul
            if match.string is not search_text:
                lead_ws = len(search_text) - len(search_text.lstrip())
                start = lead_ws + match.start()
                end = lead_ws + match.end()
            else:
                start, end = match.span()

            if start == end:
                continue

            matched_word = raw_segment[start:end]
            mw_lower = matched_word.strip().lower()
            if mw_lower in NOISE_CONCEPT_TERMS and not (is_option and matched_word.strip() in ("Günlük", "Sohbet")):
                continue

            # Çakışma kontrolü
            if any(not (end <= s or start >= e) for s, e, _ in chosen_spans):
                continue

            span_html = format_concept_span(matched_word, m, question_sem)
            chosen_spans.append((start, end, span_html))
            used_term_keys.add(t_key)
            if not is_option:
                break  # Soru kökünde aynı kavramı 1 kez vurgula

    if not chosen_spans:
        return html.escape(raw_segment, quote=False), 0

    chosen_spans.sort(key=lambda x: x[0])
    out_parts: List[str] = []
    last_idx = 0
    for start, end, span_html in chosen_spans:
        if start > last_idx:
            out_parts.append(html.escape(raw_segment[last_idx:start], quote=False))
        out_parts.append(span_html)
        last_idx = end
    if last_idx < len(raw_segment):
        out_parts.append(html.escape(raw_segment[last_idx:], quote=False))

    return "".join(out_parts), len(chosen_spans)


def refresh_existing_concept_span_hile(span_html: str, matchers: List[Dict[str, Any]]) -> str:
    """Mevcut bir `.vocab-word.concept-word` balonunun `data-tr` açıklamasını güncel `💡 Hile:` kataloğuyla yeniler."""
    m_inner = re.search(r">(.*?)</span>$", span_html, flags=re.DOTALL)
    if not m_inner:
        return span_html
    surface_raw = html.unescape(m_inner.group(1)).strip()

    # En uygun matcher'ı bul
    best_m = None
    for m in matchers:
        if m["gen_rx"] and m["gen_rx"].fullmatch(surface_raw):
            best_m = m
            break
    if best_m is None:
        for m in matchers:
            if m["gen_rx"] and m["gen_rx"].search(surface_raw):
                best_m = m
                break

    if best_m is not None:
        new_tr = html.escape(best_m["tanim"], quote=True)
        span_html = re.sub(r'data-tr="[^"]*"', f'data-tr="{new_tr}"', span_html, count=1)
    else:
        # En azından mevcut data-tr içindeki Sınav Şifresi etiketini Hile'ye dönüştür
        def _fix_tr(m_tr: re.Match) -> str:
            raw_tr = html.unescape(m_tr.group(1))
            fixed_tr = re.sub(
                r"💡\s*(?:Sınav\s+Şifresi|Şifre|İpucu|Formül\s*/\s*Şifre|Formül)\s*:",
                "💡 Hile:",
                raw_tr,
                flags=re.IGNORECASE,
            )
            return f'data-tr="{html.escape(fixed_tr, quote=True)}"'

        span_html = re.sub(r'data-tr="([^"]*)"', _fix_tr, span_html, count=1)

    return span_html


def inject_concepts_into_stem_xray(
    stem_xray: str,
    plain_soru: str,
    question_sem: int,
    matchers: List[Dict[str, Any]],
) -> Tuple[str, int]:
    """`soru_xray` içindeki dil bilgisi ve ses olayı katmanlarını bozmadan kavram balonlarını enjekte eder.

    Çok kelimeli kavramların (örn. 'divan edebiyatı', 'hece ölçüsü', 'isim tamlaması') kelimelerinden biri
    görünmez saf `.pos-word` (ses olayı içermeyen) etiketine sahipse, ardışık düz metin + saf `.pos-word`
    bloklarını birleşik düzlemde tarar; eşleşmeyen `.pos-word` etiketlerini olduğu gibi korur, eşleşen
    kavramları ise iç içe span açmadan `.vocab-word.concept-word` balonuna yükseltir.
    """
    base_html = stem_xray if stem_xray else html.escape(plain_soru, quote=False)
    base_html, _ = strip_noise_concept_spans(base_html)

    tokens = TOKEN_SPLIT_RE.split(base_html)
    used_term_keys: Set[str] = set()

    # Önce mevcut concept-word span'larındaki terimleri kaydet ve `💡 Hile:` etiketlerini güncelle
    for idx, tok in enumerate(tokens):
        if 'class="vocab-word concept-word"' in tok:
            tokens[idx] = refresh_existing_concept_span_hile(tok, matchers)
            m_in = re.search(r">(.*?)</span>$", tokens[idx], flags=re.DOTALL)
            if m_in:
                surf = html.unescape(m_in.group(1)).strip().lower()
                for m in matchers:
                    if m["gen_rx"] and m["gen_rx"].search(surf):
                        used_term_keys.add(m["term_key"])

    added_total = 0
    new_tokens: List[str] = []

    # Ardışık (düz metin veya saf .pos-word) tokenlarını gruplayarak çok kelimeli kavramları yakala
    chunk_items: List[Tuple[str, str]] = []  # (raw_text, original_html)

    def _flush_chunk() -> None:
        nonlocal added_total, chunk_items
        if not chunk_items:
            return
        combined_raw = "".join(raw_t for raw_t, _ in chunk_items)
        if not combined_raw.strip():
            for _, orig_h in chunk_items:
                new_tokens.append(orig_h)
            chunk_items = []
            return

        # combined_raw üzerinde kavram eşleşmelerini bul
        chosen_spans: List[Tuple[int, int, str]] = []
        for m in matchers:
            t_key = m["term_key"]
            if t_key in used_term_keys or m["gen_rx"] is None:
                continue
            for match in m["gen_rx"].finditer(combined_raw):
                start, end = match.span()
                if start == end:
                    continue
                matched_word = combined_raw[start:end]
                if matched_word.strip().lower() in NOISE_CONCEPT_TERMS:
                    continue
                if any(not (end <= s or start >= e) for s, e, _ in chosen_spans):
                    continue
                span_html = format_concept_span(matched_word, m, question_sem)
                chosen_spans.append((start, end, span_html))
                used_term_keys.add(t_key)
                break

        if not chosen_spans:
            for _, orig_h in chunk_items:
                new_tokens.append(orig_h)
            chunk_items = []
            return

        chosen_spans.sort(key=lambda x: x[0])
        added_total += len(chosen_spans)

        # Her chunk parçasının başlangıç-bitiş ofsetlerini hesapla
        item_Bounds: List[Tuple[int, int, str, str]] = []
        cur = 0
        for raw_t, orig_h in chunk_items:
            nxt = cur + len(raw_t)
            item_Bounds.append((cur, nxt, raw_t, orig_h))
            cur = nxt

        # Kavram eşleşmeleriyle kesişmeyen saf .pos-word span'larını koru, kesişen yerlerde kavram balonunu bas
        out_parts: List[str] = []
        pos_cursor = 0
        for c_start, c_end, c_html in chosen_spans:
            if c_start > pos_cursor:
                # [pos_cursor, c_start) aralığındaki parçaları yaz
                for b_start, b_end, b_raw, b_orig in item_Bounds:
                    if b_end <= pos_cursor or b_start >= c_start:
                        continue
                    if b_start >= pos_cursor and b_end <= c_start:
                        out_parts.append(b_orig)
                    else:
                        sub_s = max(pos_cursor, b_start) - b_start
                        sub_e = min(c_start, b_end) - b_start
                        out_parts.append(html.escape(b_raw[sub_s:sub_e], quote=False))
            out_parts.append(c_html)
            pos_cursor = c_end

        if pos_cursor < len(combined_raw):
            for b_start, b_end, b_raw, b_orig in item_Bounds:
                if b_end <= pos_cursor:
                    continue
                if b_start >= pos_cursor:
                    out_parts.append(b_orig)
                else:
                    sub_s = pos_cursor - b_start
                    out_parts.append(html.escape(b_raw[sub_s:], quote=False))

        new_tokens.append("".join(out_parts))
        chunk_items = []

    for tok in tokens:
        if not tok:
            continue
        if tok.startswith("<"):
            m_pos = PURE_POS_SPAN_RE.match(tok)
            if m_pos:
                inner_raw = html.unescape(m_pos.group(1))
                chunk_items.append((inner_raw, tok))
            else:
                _flush_chunk()
                new_tokens.append(tok)
        else:
            raw_seg = html.unescape(tok)
            chunk_items.append((raw_seg, tok))

    _flush_chunk()
    candidate_html = "".join(new_tokens)

    # Matematiksel metin bütünlüğü ve tag dengesi güvenlik kilidi
    if (
        strip_xray_to_plain(candidate_html) == plain_soru
        and candidate_html.count("<span") == candidate_html.count("</span>")
    ):
        return candidate_html, added_total

    return base_html, 0


def enrich_option_xray(
    opt_plain: str,
    stem_plain: str,
    question_sem: int,
    matchers: List[Dict[str, Any]],
) -> Tuple[Optional[str], int]:
    """Tek bir şık metnini (`secenekler[k]`) kavram balonlarıyla zenginleştirir."""
    if not opt_plain or is_structural_option(opt_plain):
        return None, 0

    used_keys: Set[str] = set()
    enriched_html, added_count = enrich_plain_segment_with_concepts(
        opt_plain,
        question_sem,
        matchers,
        used_keys,
        is_option=True,
        stem_plain=stem_plain,
    )
    if added_count == 0:
        return None, 0

    if (
        strip_xray_to_plain(enriched_html) == opt_plain
        and enriched_html.count("<span") == enriched_html.count("</span>")
    ):
        return enriched_html, added_count

    return None, 0


def main() -> None:
    print("=== TDE 1-8 BİRLEŞİK TAHRİBATSIZ KAVRAM BALONU VE ŞIK RÖNTGENİ MOTORU ===")
    questions: List[Dict[str, Any]] = json.loads(TDE_JSON_PATH.read_text(encoding="utf-8"))
    catalogs = load_all_semester_catalogs()

    total_catalog_concepts = sum(len(v) for v in catalogs.values())
    print(f"[*] Toplam TDE Sorusu: {len(questions)} | Katalog Kavram Sayısı: {total_catalog_concepts}")

    matchers_by_sem: Dict[int, List[Dict[str, Any]]] = {
        sem: build_semester_matchers(sem, catalogs) for sem in range(1, 9)
    }

    stem_questions_with_concepts = 0
    opt_questions_with_concepts = 0
    total_stem_bubbles = 0
    total_opt_bubbles = 0

    for q in questions:
        ders_str = q.get("ders", "TÜRK DİLİ VE EDEBİYATI – 1")
        m_sem = re.search(r"(\d+)", ders_str)
        sem = int(m_sem.group(1)) if m_sem else 1
        matchers = matchers_by_sem.get(sem, matchers_by_sem[1])

        plain_soru = q["soru"]
        current_stem_xray = q.get("soru_xray") or ""

        # 1. Soru Kökü (`soru_xray`) Zenginleştirme (Tahribatsız)
        new_stem_xray, _ = inject_concepts_into_stem_xray(
            current_stem_xray,
            plain_soru,
            sem,
            matchers,
        )
        q["soru_xray"] = new_stem_xray

        stem_c_count = len(CONCEPT_SPAN_RE.findall(new_stem_xray))
        if stem_c_count > 0:
            stem_questions_with_concepts += 1
            total_stem_bubbles += stem_c_count

        # 2. Şıklar (`secenekler_xray`) Zenginleştirme
        new_sec_xray: Dict[str, str] = {}
        q_opt_bubbles = 0
        for opt_key, opt_plain in q.get("secenekler", {}).items():
            opt_html, c_count = enrich_option_xray(opt_plain, plain_soru, sem, matchers)
            if opt_html and c_count > 0:
                new_sec_xray[opt_key] = opt_html
                q_opt_bubbles += c_count

        if new_sec_xray:
            q["secenekler_xray"] = new_sec_xray
            opt_questions_with_concepts += 1
            total_opt_bubbles += q_opt_bubbles
        else:
            q.pop("secenekler_xray", None)

    TDE_JSON_PATH.write_text(
        json.dumps(questions, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("\n[✓] TDE KAVRAM BALONU ZENGİNLEŞTİRMESİ TAMAMLANDI!")
    print(f"   -> Soru kökünde kavram balonu olan soru: {stem_questions_with_concepts} / {len(questions)} ({total_stem_bubbles} balon)")
    print(f"   -> Şıklarında kavram balonu olan soru  : {opt_questions_with_concepts} / {len(questions)} ({total_opt_bubbles} balon)")


if __name__ == "__main__":
    main()
