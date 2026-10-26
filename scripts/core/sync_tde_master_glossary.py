#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TDE Külliyatını Otomatik Temizleyen ve Evrensel Edebiyat Sözlüğüyle Zenginleştiren Motor.

1. Gürültü Temizliği:
   - Soru kökündeki veya şıklardaki meta-yönergeleri ('yazım yanlışı', 'yazım kuralları', 'noktalama işaretleri' vb.)
     baloncuk olmaktan çıkarır ve düz metne dönüştürür.
2. Evrensel Edebiyat Istılahları ve Dönemsel Miras (Inheritance):
   - 'makale', 'hikâye', 'şiir', 'mahlas', 'tapşırma', 'beyit', 'dörtlük', 'roman', 'tiyatro', 'kaside', 'gazel',
     'mesnevi', 'koşma', 'semai', 'varsağı', 'destan', 'masal', 'fabl', 'deneme', 'sohbet', 'fıkra', 'eleştiri',
     'anı', 'günlük', 'redif', 'kafiye', 'aruz', 'hece', 'teşbih', 'istiare', 'teşhis', 'intak', 'tezat',
     'tenasüp', 'mecazımürsel' vb. tüm MEB edebiyat kavramlarını soru köklerine ve şıklara otomatik işler.
3. Çakışma ve Güvenlik:
   - Mevcut doğru kavramları korur, bozuk/çakışan span üretmez, HTML kaçışlarını (html.escape) güvenle uygular.
"""

import html
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
TDE_JSON_PATH = ROOT_DIR / "data" / "subjects" / "TDE.json"
CONCEPTS_DIR = ROOT_DIR / "data" / "concepts"

NOISE_PATTERNS = [
    re.compile(r'<span class="vocab-word concept-word"[^>]*>(yazım[a-zçğıöşü\s]*|noktalama[a-zçğıöşü\s]*)</span>', re.IGNORECASE),
]

MASTER_LITERARY_GLOSSARY = [
    {
        "id": "tde_makale",
        "term": "Makale",
        "sayfa": 39,
        "tanim": "Bir tezi **kanıt ve belgelere** dayandırarak savunan, nesnel ve bilimsel bir üslupla yazılan öğretici metindir; mahkemedeki gerekçeli savunma gibidir.\n💡 Sınav Şifresi: **Nesnellik + kanıtlama + terim kullanımı** üçlüsünü ara; fıkra veya denemedeki gibi 'öznel sohbet' havası yoktur.",
        "pattern": r"\bmakale[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_hikaye",
        "term": "Hikâye (Öykü)",
        "sayfa": 36,
        "tanim": "Yaşanmış veya yaşanabilir olayları kişi, zaman ve mekân bağlamında anlatan **kısa** edebî türdür; romandan daha dar kadrolu ve tek bir ana olaya/duruma odaklıdır.\n💡 Sınav Şifresi: İki ana türü var: **Olay (Maupassant)** hikâyesi (serim-düğüm-çözüm) ve **Durum (Çehov)** hikâyesi (günlük yaşamdan bir kesit, serim-çözüm aranmaz).",
        "pattern": r"\bhikâye[a-zçğıöşü]*\b|\bhikaye[a-zçğıöşü]*\b|\böykü[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_siir",
        "term": "Şiir",
        "sayfa": 66,
        "tanim": "Duygu, hayal ve düşüncelerin **ahenkli dizeler** hâlinde, estetik bir dille aktarıldığı edebî türdür; sözün musikiye en yakın halidir.\n💡 Sınav Şifresi: **Ölçü + kafiye + redif + imge** ahenk unsurlarıdır. Düz yazıdan ayrılan temel farkı çağrışımsal zenginlik ve ritimdir.",
        "pattern": r"\bşiir[a-zçğıöşü]*\b|\bmanzume[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_roman",
        "term": "Roman",
        "sayfa": 112,
        "tanim": "İnsanların başından geçen veya geçebilecek olayları geniş bir kişi kadrosu, ayrıntılı zaman ve mekân tasvirleriyle anlatan **uzun** edebî türdür.\n💡 Sınav Şifresi: Hikâyeye göre kişi kadrosu geniş, olay örgüsü çok katmanlı, çevre tasvirleri derinlemesine verilir. İlk yerli roman: *Taaşşuk-ı Talat ve Fitnat*.",
        "pattern": r"\broman[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_tiyatro",
        "term": "Tiyatro",
        "sayfa": 145,
        "tanim": "Sahnede seyirciler önünde canlandırılmak üzere yazılan, diyalog ve aksiyona dayalı dramatik edebî türdür.\n💡 Sınav Şifresi: 3 ana türü vardır: **Trajedi** (soylular, acı, kuralcı), **Komedi** (halk, güldürü), **Dram** (hayatın acı ve neşeli yönleri bir arada; üç birlik kuralı yıkılmıştır).",
        "pattern": r"\btiyatro[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_beyit",
        "term": "Beyit",
        "sayfa": 69,
        "tanim": "Aynı ölçüde yazılmış, kendi içinde anlam bütünlüğü taşıyan **iki dizeden** oluşan divan şiiri nazım birimidir; binayı oluşturan sağlam bir çift tuğla gibidir.\n💡 Sınav Şifresi: Divan şiirinin temel yapı birimidir. Gazel, kaside, mesnevi beyitlerle yazılır; dörtlük halk şiirine aittir.",
        "pattern": r"\bbeyit[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_dortluk",
        "term": "Dörtlük",
        "sayfa": 70,
        "tanim": "**Dört dizeden** oluşan ve genellikle halk şiirinde kullanılan temel nazım birimidir; çadırın dört ana direği gibi bütünü ayakta tutar.\n💡 Sınav Şifresi: Türklerin milli nazım birimidir. Koşma, semai, mani, varsağı ve ilahiler dörtlüklerle söylenir.",
        "pattern": r"\bdörtlük[a-zçğıöşü]*\b|\bdortluk[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_bent",
        "term": "Bent",
        "sayfa": 71,
        "tanim": "Bir şiirde ikiden veya dörtten fazla dizeden oluşan kümelere verilen addır; serbest ve divan nazmında geniş anlatım alanları açar.\n💡 Sınav Şifresi: Terkibibent, terciibent, musammatlar ve modern serbest şiir bentlerle kurulur.",
        "pattern": r"\bbent[a-zçğıöşü]*\b|\bbentler[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_mahlas",
        "term": "Mahlas",
        "sayfa": 94,
        "tanim": "Şairlerin şiirlerinde gerçek adları yerine kullandıkları **edebî takma ad / mahlas**tır; şairin dizesine bastığı telif mührüdür.\n💡 Sınav Şifresi: Divan edebiyatında kullanılır ve şiirin **son beyitinde (makta)** geçer (Örn: Fuzûlî, Bâkî, Nedîm). Âşık edebiyatındaki karşılığı 'tapşırma'dır.",
        "pattern": r"\bmahlas[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_tapsirma",
        "term": "Tapşırma",
        "sayfa": 94,
        "tanim": "Âşık edebiyatı ozanlarının şiirin **son dörtlüğünde** kendi adlarını veya takma adlarını söylemesidir; divandaki mahlasın saz şairlerindeki karşılığıdır.\n💡 Sınav Şifresi: **Halk şiiri + son dörtlük + ozan adı** (Karacaoğlan, Dadaloğlu, Âşık Veysel) = tapşırma.",
        "pattern": r"\btapşırma[a-zçğıöşü]*\b|\btapsirma[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_kaside",
        "term": "Kaside",
        "sayfa": 72,
        "tanim": "Din ve devlet büyüklerini **övmek** amacıyla aruz ölçüsü ve beyitlerle yazılan divan nazım biçimidir (31-99 beyit, kafiye: aa ba ca).\n💡 Sınav Şifresi: 31-99 beyit arasıdır. Bölümleri: **Nesib/Teşbib, Girizgâh, Methiye (övgü), Tegazzül (gazel sıkıştırma), Fahriye (şairin kendini övmesi), Dua**. İlk beyit matla, son beyit makta.",
        "pattern": r"\bkaside[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_gazel",
        "term": "Gazel",
        "sayfa": 71,
        "tanim": "Aşk, güzellik, şarap ve ayrılık acısını işleyen, 5-15 beyitten oluşan divan şiirinin en yaygın nazım biçimidir (aa ba ca da).\n💡 Sınav Şifresi: İlk beyit **matla**, son beyit **makta**, en güzel beyit **beytü'l-gazel**. Şairin mahlası maktada geçer.",
        "pattern": r"\bgazel[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_mesnevi",
        "term": "Mesnevi",
        "sayfa": 75,
        "tanim": "Her beyiti kendi arasında uyaklı (aa bb cc dd...), beyit sayısı sınırsız olan, divan edebiyatının olay anlatan **manzum romanı**dır.\n💡 Sınav Şifresi: Uyak kolaylığı nedeniyle uzun aşk, kahramanlık ve tasavvuf hikâyeleri (Mevlana - Mesnevi, Fuzuli - Leyla ile Mecnun) mesneviyle yazılır. 5 mesnevisi olana **Hamse** sahibi denir.",
        "pattern": r"\bmesnevi[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_rubai",
        "term": "Rubai",
        "sayfa": 74,
        "tanim": "Dört dizeden oluşan, kendine özgü 24 ayrı aruz kalıbıyla yazılan felsefi ve hikemi divan nazım biçimidir (aaxa).\n💡 Sınav Şifresi: Felsefe, tasavvuf ve hayat görüşü işlenir. En büyük ustası İranlı Ömer Hayyam, Türk edebiyatında Yahya Kemal ve Azmizade Haleti'dir.",
        "pattern": r"\brubai[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_sarki",
        "term": "Şarkı",
        "sayfa": 76,
        "tanim": "Divan edebiyatına **Türklerin kazandırdığı**, bestelenmek amacıyla dörtlüklerle yazılan lirik nazım biçimidir.\n💡 Sınav Şifresi: Dörtlüklerle yazılır, 3. dizeye **miyan**, 4. dizeye **nakarat** denir. En büyük ustası Lale Devri şairi Nedîm'dir.",
        "pattern": r"\bşarkı[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_kosma",
        "term": "Koşma",
        "sayfa": 82,
        "tanim": "Âşık edebiyatında 11'li hece ölçüsü ve dörtlüklerle (3-5 dörtlük) söylenen en yaygın lirik nazım biçimidir (abab cccb dddb).\n💡 Sınav Şifresi: Konularına göre: **Güzelleme** (aşk), **Koçaklama** (yiğitlik/savaş - Köroğlu/Dadaloğlu), **Taşlama** (yergi/eleştiri), **Ağıt** (ölüm).",
        "pattern": r"\bkoşma[a-zçğıöşü]*\b|\bkosma[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_semai",
        "term": "Semai",
        "sayfa": 84,
        "tanim": "Âşık edebiyatında kendine özgü bir ezgiyle ve **8'li hece ölçüsüyle** söylenen lirik nazım biçimidir.\n💡 Sınav Şifresi: Koşmadan farkı **8'li hece** olması ve kendine has bir ezgiyle söylenmesidir; koşma 11'lidir.",
        "pattern": r"\bsemai[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_varsagi",
        "term": "Varsağı",
        "sayfa": 85,
        "tanim": "Toroslardaki Varsak Türkmenlerine ait, yiğitçe ve mertçe bir edayla söylenen 8'li hece ölçülü şiirdir.\n💡 Sınav Şifresi: Dörtlüklerinde **'Bre, hey, behey'** gibi mertçe ünlemler geçer; sınavda bu nidaları görünce doğrudan Varsağı işaretlenir.",
        "pattern": r"\bvarsağı[a-zçğıöşü]*\b|\bvarsagi[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_deneme",
        "term": "Deneme",
        "sayfa": 152,
        "tanim": "Yazarın herhangi bir konuda kesin kurallara varmadan, **kendisiyle konuşur gibi** samimi ve özgürce kaleme aldığı düşünce yazısıdır.\n💡 Sınav Şifresi: Kurucusu Montaigne'dir. 'Ben' dili hâkimdir; kanıtlama ve belgeleme zorunluluğu yoktur (Makaleden farkı budur).",
        "pattern": r"\bdeneme[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_sohbet",
        "term": "Sohbet (Söyleşi)",
        "sayfa": 154,
        "tanim": "Yazarın güncel veya edebî bir konuyu **okurla karşılıklı konuşuyormuş gibi** soru-cevaplarla, samimi bir dille işlediği yazıdır.\n💡 Sınav Şifresi: 'Sizce de öyle değil mi?', 'Bilirsiniz ki...' gibi okura seslenen ifadeler varsa sohbet; kendi kendine konuşuyorsa denemedir.",
        "pattern": r"\bsohbet[a-zçğıöşü]*\b|\bsöyleşi[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_fikra",
        "term": "Fıkra (Köşe Yazısı)",
        "sayfa": 156,
        "tanim": "Gazete ve dergilerde güncel siyasi, sosyal veya kültürel konuları kanıtlama kaygısı gütmeden işleyen günübirlik yazılardır.\n💡 Sınav Şifresi: **Güncellik + gazete köşesi + günübirlik tüketim**. Mizahi fıkra (Nasreddin Hoca) ile gazete fıkrası sınavda ayrı sorulur.",
        "pattern": r"\bfıkra[a-zçğıöşü]*\b|\bfikra[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_elestiri",
        "term": "Eleştiri (Tenkit)",
        "sayfa": 160,
        "tanim": "Bir sanat veya düşünce eserinin olumlu ve olumsuz yönlerini, gerçek değerini ortaya koymak amacıyla yazılan inceleme yazısıdır.\n💡 Sınav Şifresi: İlk edebî eleştirimiz Namık Kemal'in *Tahrib-i Harabat* eseridir. Amacı esere ve okura rehberlik etmektir.",
        "pattern": r"\beleştiri[a-zçğıöşü]*\b|\btenkit[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_mulakat",
        "term": "Mülakat",
        "sayfa": 162,
        "tanim": "Alanında uzman veya tanınmış bir kişiyle önceden belirlenen bir konuda yapılan soru-cevaplı görüşme yazısıdır.\n💡 Sınav Şifresi: Muhatabın sözleri değiştirilmeden aynen aktarılır. Öncüsü Ruşen Eşref Ünaydın'dır (*Diyorlar ki*).",
        "pattern": r"\bmülakat[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_roportaj",
        "term": "Röportaj",
        "sayfa": 164,
        "tanim": "Bir gerçeği, olayı veya yeri araştırma, inceleme, fotoğraflar ve tanıklarla yerinde gözlemleyerek anlatan zengin gazete yazısıdır.\n💡 Sınav Şifresi: Yazar kendi izlenimlerini ve fotoğrafları katar; mülakattan daha geniştir. Yaşar Kemal önemli röportaj ustasıdır.",
        "pattern": r"\bröportaj[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_ani",
        "term": "Anı (Hatıra)",
        "sayfa": 165,
        "tanim": "Tanınmış kişilerin geçmişte bizzat yaşadıkları veya tanık oldukları olayları, **aradan zaman geçtikten sonra** anlattıkları edebî türdür.\n💡 Sınav Şifresi: Günlükten farkı **olayın üzerinden zaman geçmesidir** (günlük günü gününe yazılır). Tarihe ışık tutan birinci elden kaynaktır.",
        "pattern": r"\banı[a-zçğıöşü]*\b|\bhatıra[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_gunluk",
        "term": "Günlük (Günce)",
        "sayfa": 167,
        "tanim": "Yaşanan olayların, duygu ve düşüncelerin **tarih atılarak günü gününe** yazıldığı samimi ve içten kişisel metinlerdir.\n💡 Sınav Şifresi: **Tarih atılması + günü gününe yazılması + birinci kişi ağzı**. Anıdan farkı gününde yazılmasıdır.",
        "pattern": r"\bgünlük[a-zçğıöşü]*\b|\bgünce[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_destan",
        "term": "Destan (Epope)",
        "sayfa": 98,
        "tanim": "Bir ulusun varlığını derinden sarsan savaş, göç, afet gibi olayları manzum ve olağanüstü ögelerle anlatan uzun halk anlatısıdır.\n💡 Sınav Şifresi: **Doğal destan** (üç aşama: doğuş, yayılma, derleme) ve **Yapay destan** (şairi belli olan) olarak ikiye ayrılır.",
        "pattern": r"\bdestan[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_masal",
        "term": "Masal",
        "sayfa": 102,
        "tanim": "Genellikle halkın ortak malı olan, olağanüstü kahraman ve olayların anlatıldığı, zaman ve mekânı belirsiz, eğitici anlatı türüdür.\n💡 Sınav Şifresi: **Tekerlemeyle başlar**, zaman belirsizdir ('evvel zaman içinde'), -miş'li geçmiş zamanla anlatılır, sonunda iyiler kazanır.",
        "pattern": r"\bmasal[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_fabl",
        "term": "Fabl",
        "sayfa": 104,
        "tanim": "Kahramanları çoğunlukla hayvanlar, bitkiler veya cansız nesneler olan, sonunda ibretlik bir **ahlak dersi** veren manzum veya nesir türdür.\n💡 Sınav Şifresi: **Teşhis (kişileştirme) ve intak (konuşturma)** sanatlarına dayanır. Türk edebiyatında ilk fabl Şeyhî'nin *Harname* mesnevisidir.",
        "pattern": r"\bfabl[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_redif",
        "term": "Redif",
        "sayfa": 78,
        "tanim": "Dize sonlarında kafiyeden sonra gelen, **aynı görevde ve aynı anlamdaki** eklerin veya tekrarlanan sözcüklerin oluşturduğu ahenk ögesidir.\n💡 Sınav Şifresi: Kafiyeden SONRA aranır. Görevi veya anlamı aynıysa = redif; ses benziyor ama görev farklıysa = kafiye.",
        "pattern": r"\bredif[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_kafiye",
        "term": "Kafiye (Uyak)",
        "sayfa": 77,
        "tanim": "Dize sonlarındaki görevleri ve anlamları farklı olan seslerin benzerliğidir.\n💡 Sınav Şifresi: **Yarım** (1 ses), **Tam** (2 ses), **Zengin** (3+ ses), **Cinaslı** (yazılışı aynı anlamı farklı kelimelerle kurulan).",
        "pattern": r"\bkafiye[a-zçğıöşü]*\b|\buyak[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_hece_olcusu",
        "term": "Hece Ölçüsü",
        "sayfa": 74,
        "tanim": "Dizelerdeki hece sayılarının eşitliğine dayanan Türklerin milli şiir ölçüsüdür.\n💡 Sınav Şifresi: Dizelerdeki sesli harfleri sayarak bulunur. En yaygın kalıpları 7'li (mani), 8'li (semai/varsağı) ve 11'lidir (koşma).",
        "pattern": r"\bhece ölçüsü[a-zçğıöşü]*\b|\bheceyle\b",
    },
    {
        "id": "tde_aruz_olcusu",
        "term": "Aruz Ölçüsü",
        "sayfa": 73,
        "tanim": "Hecelerin **açık (kısa) ve kapalı (uzun)** değerlerine göre düzenlenen, divan edebiyatının temel ölçü sistemidir.\n💡 Sınav Şifresi: 'Açık-kapalı hece = aruz'. Kalıpları fâilâtün, mefâîlün ile adlandırılır; hece sayısı değil hecenin ses değeri esastır.",
        "pattern": r"\baruz ölçüsü[a-zçğıöşü]*\b|\baruzla\b",
    },
    {
        "id": "tde_tesbih",
        "term": "Teşbih (Benzetme)",
        "sayfa": 88,
        "tanim": "Aralarında ilgi kurulan iki şeyden nitelikçe zayıf olanın güçlü olana benzetilmesi sanatıdır.\n💡 Sınav Şifresi: 4 ögesi vardır: **Benzeyen, Kendisine Benzetilen, Benzetme Yönü, Benzetme Edatı**. Sadece benzeyen ve kendisine benzetilen varsa buna **Teşbih-i Beliğ (Güzel Benzetme)** denir.",
        "pattern": r"\bteşbih[a-zçğıöşü]*\b|\bbenzetme sanatı[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_istiare",
        "term": "İstiare (Eğretileme)",
        "sayfa": 89,
        "tanim": "Teşbihin temel ögelerinden (benzeyen veya kendisine benzetilen) yalnızca biri kullanılarak yapılan benzetme sanatıdır.\n💡 Sınav Şifresi: Sadece kendisine benzetilen varsa **Açık İstiare** (Örn: 'Şakaklarıma kar mı yağdı ne var?'), sadece benzeyen varsa **Kapalı İstiare** (Örn: 'Can kafeste durmaz uçar').",
        "pattern": r"\bistiare[a-zçğıöşü]*\b|\beğretileme[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_teshis",
        "term": "Teşhis (Kişileştirme)",
        "sayfa": 90,
        "tanim": "İnsan dışındaki canlı veya cansız varlıklara insana özgü nitelikler (duygu, hareket) yükleme sanatıdır.\n💡 Sınav Şifresi: Şahsiyet kazandırmaktan gelir (şahıs = insan). Örn: 'Ağlama karanfil, boynunu bükme.' Her teşhiste aynı zamanda kapalı istiare vardır.",
        "pattern": r"\bteşhis[a-zçğıöşü]*\b|\bkişileştirme[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_intak",
        "term": "İntak (Konuşturma)",
        "sayfa": 91,
        "tanim": "İnsan dışındaki varlıkları insan gibi konuşturma sanatıdır (nutuk = konuşmaktan gelir).\n💡 Sınav Şifresi: **Her intak bir teşhistir**, ama her teşhis intak değildir. Fabllar bütünüyle intak ve teşhis sanatına dayanır.",
        "pattern": r"\bintak[a-zçğıöşü]*\b|\bkonuşturma sanatı[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_tezat",
        "term": "Tezat (Karşıtlık)",
        "sayfa": 92,
        "tanim": "Birbirine zıt duygu, düşünce veya durumları anlamı güçlendirmek için bir arada kullanma sanatıdır.\n💡 Sınav Şifresi: Sadece zıt kelimeler değil, zıt durumlar da tezattır. Örn: 'Ağlarım hatıra geldikçe gülüştüklerimiz'.",
        "pattern": r"\btezat[a-zçğıöşü]*\b|\bkarşıtlık sanatı[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_tenasup",
        "term": "Tenasüp (Uygunluk)",
        "sayfa": 93,
        "tanim": "Aralarında zıtlık olmadan, anlamca birbiriyle ilgili sözcükleri (çiçek, bağ, bülbül, gül vb.) bir arada kullanma sanatıdır.\n💡 Sınav Şifresi: Anlamsal akrabalık arayacaksın; karşıtlık varsa tenasüp değil tezat olur.",
        "pattern": r"\btenasüp[a-zçğıöşü]*\b|\buygunluk sanatı[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_mecazimursel",
        "term": "Mecazımürsel (Ad Aktarması)",
        "sayfa": 95,
        "tanim": "Bir sözcüğün benzetme amacı güdülmeksizin, başka bir sözcük yerine parça-bütün, iç-dış, yazar-eser ilişkisiyle kullanılmasıdır.\n💡 Sınav Şifresi: Örn: 'Cemil Meriç'i okudum' (kitabını), 'Dalgalan sen de şafaklar gibi ey nazlı hilal' (bayrak).",
        "pattern": r"\bmecazımürsel[a-zçğıöşü]*\b|\bad aktarması[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_trajedi",
        "term": "Trajedi (Facia)",
        "sayfa": 146,
        "tanim": "Seyircide korku ve acıma hissi uyandırarak ruhu arındırmayı (katarsis) amaçlayan, manzum yazılan klasik tiyatro türüdür.\n💡 Sınav Şifresi: Kahramanlar **tanrılar ve soylulardır**, kaba sözlere yer verilmez, cinayet sahnede gösterilmez, **üç birlik kuralına** sıkı sıkıya uyar.",
        "pattern": r"\btrajedi[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_komedi",
        "term": "Komedi",
        "sayfa": 147,
        "tanim": "İnsanların ve toplumun gülünç, kusurlu yanlarını güldürerek düşündürmek amacıyla sahnelenen tiyatro türüdür.\n💡 Sınav Şifresi: Karakter, Töre ve Entrika komedisi olmak üzere 3 çeşidi vardır. Kahramanlar **sıradan halktır**, kaba sözler sahnede söylenebilir.",
        "pattern": r"\bkomedi[a-zçğıöşü]*\b",
    },
    {
        "id": "tde_dram",
        "term": "Dram",
        "sayfa": 148,
        "tanim": "Hayatın hem acıklı hem de gülünç yönlerini bir arada, olduğu gibi sahneye koyan modern tiyatro türüdür.\n💡 Sınav Şifresi: Romantizmle birlikte ortaya çıkmıştır (Victor Hugo - Cromwell önsözü). **Üç birlik kuralına uyma zorunluluğu yoktur**.",
        "pattern": r"\bdram\b|\bdramlar\b|\bdramı\b",
    },
]


def strip_noise_spans(text: str) -> Tuple[str, int]:
    """Metindeki 'yazım yanlışı' ve 'noktalama işaretleri' kavram balonu span'larını temizler."""
    if not text or "concept-word" not in text:
        return text, 0
    removed = 0
    new_text = text
    for np in NOISE_PATTERNS:
        matches = np.findall(new_text)
        if matches:
            removed += len(matches)
            new_text = np.sub(r"\1", new_text)
    return new_text, removed


def get_existing_span_ranges(text: str) -> List[Tuple[int, int]]:
    """Mevcut HTML span aralıklarını bulur."""
    ranges = []
    for m in re.finditer(r'<span\s+class="vocab-word\s+concept-word"[^>]*>.*?</span>', text, re.DOTALL):
        ranges.append((m.start(), m.end()))
    return ranges


def inject_glossary_concepts(text: str, sem: int, matchers: List[Dict[str, Any]]) -> Tuple[str, int]:
    """Mevcut span'ları bozmadan metne evrensel edebiyat kavramlarını enjekte eder."""
    if not text:
        return text, 0

    added = 0
    # Matcher'lar uzun terimden kısaya doğru sıralı
    for m in matchers:
        # Metindeki mevcut HTML etiketlerinin dışındaki düz metin parçalarını tara
        pattern: re.Pattern = m["regex"]
        term = m["term"]
        sayfa = m["sayfa"]
        tanim = m["tanim"]

        # Her seferinde güncel span'ları yeniden hesapla
        existing_spans = get_existing_span_ranges(text)

        # Kelime eşleşmesi ara
        for match in list(pattern.finditer(text)):
            start, end = match.span()

            # Zaten başka bir span'ın içinde mi?
            in_span = any(s <= start and end <= e for s, e in existing_spans)
            if in_span:
                continue

            # HTML etiketinin içinde mi? (<...>)
            left_tag_open = text.rfind("<", 0, start)
            left_tag_close = text.rfind(">", 0, start)
            if left_tag_open > left_tag_close:
                # Bir HTML etiketinin parametrelerindeyiz (örn data-tr="...")
                continue

            matched_word = match.group(0)
            tr_esc = html.escape(tanim, quote=True)
            note_esc = html.escape(f"MEB TDE Dönem {sem} • S.{sayfa} • {term}", quote=True)
            span_html = (
                f'<span class="vocab-word concept-word" '
                f'data-tr="{tr_esc}" data-note="{note_esc}" '
                f'onclick="showVocabBubble(this, event)">{html.escape(matched_word)}</span>'
            )

            # Metne yerleştir ve döngüyü güncelle
            text = text[:start] + span_html + text[end:]
            added += 1
            break  # Aynı terimi aynı blokta 1 kez eklemek yeterli

    return text, added


def main():
    print("=== TDE KÜLLİYATI OTOMATİK GÜRÜLTÜ TEMİZLİĞİ VE EVRENSEL EDEBİYAT SÖZLÜĞÜ ===")
    questions = json.loads(TDE_JSON_PATH.read_text(encoding="utf-8"))
    print(f"[*] Toplam TDE Sorusu: {len(questions)}")

    # Matcher'ları derle
    matchers = []
    for item in MASTER_LITERARY_GLOSSARY:
        regex = re.compile(item["pattern"], re.IGNORECASE)
        matchers.append({
            "term": item["term"],
            "sayfa": item["sayfa"],
            "tanim": item["tanim"],
            "regex": regex,
            "len": len(item["term"]),
        })
    # Uzun terimleri önce eşle
    matchers.sort(key=lambda x: x["len"], reverse=True)

    total_noise_removed = 0
    total_concepts_added = 0
    modified_questions = 0

    for q in questions:
        q_mod = False
        ders_str = q.get("ders", "TDE 1")
        m_sem = re.search(r"(\d+)", ders_str)
        sem = int(m_sem.group(1)) if m_sem else 1

        # 1. Gürültü Temizliği (soru_xray ve secenekler_xray)
        stem_xray = q.get("soru_xray") or ""
        clean_stem, r_count = strip_noise_spans(stem_xray)
        if r_count > 0:
            total_noise_removed += r_count
            q["soru_xray"] = clean_stem
            q_mod = True

        sec_xray = q.get("secenekler_xray") or {}
        for opt_key, opt_html in list(sec_xray.items()):
            clean_opt, opt_r = strip_noise_spans(opt_html)
            if opt_r > 0:
                total_noise_removed += opt_r
                sec_xray[opt_key] = clean_opt
                q_mod = True

        # 2. Evrensel Edebiyat Kavramı Zenginleştirmesi
        # A) Soru kökünde dene
        current_stem = q.get("soru_xray") or q.get("soru", "")
        new_stem, a_count = inject_glossary_concepts(current_stem, sem, matchers)
        if a_count > 0:
            total_concepts_added += a_count
            q["soru_xray"] = new_stem
            q_mod = True

        # B) Şıklarda dene
        for opt_key, opt_text in q.get("secenekler", {}).items():
            curr_opt = sec_xray.get(opt_key, opt_text)
            new_opt, opt_added = inject_glossary_concepts(curr_opt, sem, matchers)
            if opt_added > 0:
                total_concepts_added += opt_added
                sec_xray[opt_key] = new_opt
                q_mod = True

        if sec_xray:
            q["secenekler_xray"] = sec_xray

        if q_mod:
            modified_questions += 1

    TDE_JSON_PATH.write_text(json.dumps(questions, ensure_ascii=False, separators=(',', ':')), encoding="utf-8")

    print("\n[✓] İŞLEM TAMAMLANDI!")
    print(f"   -> Temizlenen gürültü balonu: {total_noise_removed}")
    print(f"   -> Eklenen yeni edebiyat balonu: {total_concepts_added}")
    print(f"   -> Güncellenen soru sayısı: {modified_questions}")


if __name__ == "__main__":
    main()
