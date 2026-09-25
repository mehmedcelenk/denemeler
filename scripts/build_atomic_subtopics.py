#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_atomic_subtopics.py
Soruları "ATOMİK KONU" (Nano-Kazanım / Soru Kalıbı) düzeyine indirger
ve her soruya öğretmenlerin/öğrencilerin 10 saniyede soruyu çözmesini sağlayan
"SPOT TAKTİK / FORMÜL İPUCU" ekler.
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
# 1. COĞRAFYA ATOMİK SÖZLÜĞÜ VE KAZANIM HARİTASI
# ==============================================================================
COGRAFYA_ATOMIC_RULES = [
    ("Vadi ve Sırt Ayrımı (V Kuralı)", "Eğrilerin 'V' yaptığı yerde sivri uç yüksekliğin arttığı yeri gösteriyorsa Vadi, azaldığı yeri gösteriyorsa Sırttır.", [r'vadi\b', r'sırt\b', r'akarsu vadisi']),
    ("Falez ve Eğim (Çizgilerin Sıklaşması)", "İzohips çizgileri deniz kıyısında birbirine yapışacak kadar sıklaşıyorsa orada eğim maksimumdur ve Falez (Yalıyar) vardır.", [r'falez', r'yalıyar', r'eğim\b', r'eğimi fazla']),
    ("Kapalı Çukur (Çanak / Krater)", "İçe doğru ok işaretlerinin başladığı yerden bittiği yere kadar yükselti eğri aralığı kadar azalır (volkanik krater veya karstik çanak).", [r'çanak\b', r'kapalı çukur', r'krater\b']),
    ("Profil Çıkarma ve Yükselti Bulma", "Profilin başladığı ve bittiği noktanın yükseltisine ve tepe sayısına bakarak şıklar 5 saniyede elenir.", [r'profil çıkarma', r'profil\b', r'eşyükselti']),
    ("Ölçekler ve Bozulma Oranı", "Ölçeğin paydası büyüdükçe ölçek küçülür; küçük ölçekte ayrıntı azdır, haritadaki bozulma ve kapsanan alan fazladır.", [r'büyük ölçek', r'küçük ölçek', r'ölçek\b', r'küçültme oranı']),
    ("Ekinoks Tarihleri (21 Mart - 23 Eylül)", "Güneş ışınları Ekvator'a dik düşer, aydınlanma çemberi kutuplardan teğet geçer; dünyanın her yerinde gece-gündüz 12 saattir.", [r'21 mart', r'23 eylül', r'ekinoks']),
    ("Gündönümü Tarihleri (21 Haziran - 21 Aralık)", "21 Haziran'da Yengeç Dönencesi'ne dik düşer (Kuzeyde en uzun gündüz), 21 Aralık'ta Oğlak Dönencesi'ne dik düşer (Güneyde en uzun gündüz).", [r'21 haziran', r'21 aralık', r'günöte', r'günberi', r'en uzun gündüz']),
    ("Geoit Şekil ve Çizgisel Hız", "Dünya kutuplardan basık, Ekvator'dan şişkindir; çizgisel hız Ekvator'da en fazla, kutuplarda sıfırdır; yerçekimi kutuplarda fazladır.", [r'geoit\b', r'dünyanın şekli', r'çizgisel hız', r'yer çekimi']),
    ("Yerel Saat ve Meridyen Farkı", "Her iki meridyen arası 4 dakikadır. Doğu'da yerel saat daima daha ileridir, Batı'da geridir.", [r'yerel saat', r'meridyen\b', r'ortak saat', r'ulusal saat', r'saat dilimi']),
    ("Basınç Kuşakları ve Rüzgâr Yönü", "Rüzgâr daima Yüksek Basınçtan (soğuk/alçalan hava) Alçak Basınca (sıcak/yükselen hava) doğru eser.", [r'alçak basınç', r'yüksek basınç', r'rüzgâr', r'rüzgar', r'barometre', r'alize', r'muson', r'sürekli rüzgâr']),
    ("Yağış Tipleri (Orografik, Konveksiyonel, Cephe)", "Dağa çarpan = Orografik (Karadeniz); Isınıp yükselen = Konveksiyonel (İç Anadolu Kırkikindi); Sıcak-soğuk karşılaşması = Cephesel (Akdeniz).", [r'orografik', r'yamaç yağış', r'konveksiyonel', r'cephe yağış', r'cephesel']),
    ("Büyük İklim Tipleri (Makroklima)", "Akdeniz iklimi yazları sıcak-kurak, kışları ılık-yağışlıdır (bitkisi maki). Ekvatoral iklim yıl boyu sıcak ve bol yağışlıdır.", [r'akdeniz iklimi', r'karasal iklim', r'ekvatoral iklim', r'çöl iklimi', r'step iklimi', r'muson']),
    ("Nem Türleri (Mutlak, Bağıl, Maksimum)", "Sıcaklık arttıkça havanın taşıyabileceği nem (maksimum nem) artar; bağıl nem %100'e ulaşınca yağış başlar.", [r'bağıl nem', r'mutlak nem', r'maksimum nem', r'su buharı', r'yoğunlaşma']),
    ("Fay Hatları ve Deprem Kuşakları", "Genç kıvrım dağları, kırıklı fay hatları, volkanlar, kaplıcalar ve deprem bölgeleri haritada birebir çakışır.", [r'fay hattı', r'fay\b', r'levha\b', r'deprem\b', r'tektonik', r'tsunami', r'kuzey anadolu']),
    ("Kayaç Türleri (Kalker, Granit, Mermer)", "Kalker/kireç taşı tortul ve karstiktir; granit magmatiktir; mermer kalkerin yüksek sıcaklık-basınçta başkalaşmasıyla oluşur.", [r'kalker', r'kireç taşı', r'granit', r'bazalt', r'kayaç', r'mermer', r'başkalaşım', r'ankara taşı']),
    ("Doğal Afetler ve Korunma (Heyelan, Sel, Deprem)", "Eğim + Bol yağış + Killi toprak = Heyelan (en çok ilkbaharda Karadeniz'de). Bitki yoksunluğu = Erozyon.", [r'heyelan', r'sel\b', r'taşkın', r'erozyon', r'çığ\b', r'afet\b', r'doğal afet', r'sel felaketi']),
    ("Akarsu Aşınım ve Birikim (Menderes & Delta)", "Eğim azaldığı yerde akarsu menderes (kıvrım) yapar; denize döküldüğü yerde taşıdığı alüvyonları biriktirerek delta ovası oluşturur.", [r'menderes', r'delta\b', r'akarsu', r'dev kazanı', r'peribacası', r'alüvyal', r'akarsu havza']),
    ("Karstik Şekiller (Lapya, Dolin, Obruk, Traverten)", "Kalkerli arazide suyun kireci eritmesiyle lapya, dolin, uvala, obruk; kirecin çökelmesiyle traverten ve sarkıt-dikit oluşur.", [r'karstik', r'lapya', r'dolin', r'obruk', r'traverten', r'polye']),
    ("Kıyı Tipleri (Fiyort, Ria, Dalmaçya, Haliç)", "Buzul vadisi sular altında kalınca Fiyort; eski akarsu vadisi batınca Ria (İstanbul/Çanakkale Boğazları); kıyıya paralel ada dizisi Dalmaçya kıyısıdır.", [r'fiyort', r'ria\b', r'dalmaçya', r'haliç', r'kıyı tipi', r'tombolo']),
    ("Göl Tipleri ve Kaynaklar (Tektonik, Karstik, Gayzer)", "Aral, Baykal, Hazar tektonik göllerdir. Karstik kaynaklar soğuk ve kireçli, fay ve gayzer kaynakları sıcaktır.", [r'göl\b', r'göller', r'tektonik göl', r'gayzer', r'artezyen', r'voklüz', r'baykal', r'hazar']),
    ("Toprak Tipleri (Terra-Rossa, Çernezyom, Podzol)", "Akdeniz iklimi kalker üzerinde kırmızı Terra-Rossa; sert karasalda dünyanın en verimli toprağı Çernezyom; soğuk nemli taygada Podzol oluşur.", [r'terra-rossa', r'terrarossa', r'çernezyom', r'podzol', r'laterit', r'alüvyal toprak', r'humus']),
    ("Bitki Formasyonları (Bozkır, Maki, Tayga)", "İç Anadolu'da ilkbahar yağışıyla yeşeren Bozkır (Step); Akdeniz'de bodur çalı Maki; Sibirya/Kanada'da iğne yapraklı Tayga ormanları.", [r'bozkır', r'step\b', r'maki\b', r'tayga', r'savan\b', r'bitki örtüsü']),
    ("Gelişmiş Ülke Nüfus Piramidi (Arı Kovanı)", "Tabanı dar (düşük doğum), tepe kısmı geniş (yaşlı nüfus oranı yüksek) piramit gelişmiş Batı ülkelerine aittir.", [r'nüfus piramidi', r'arı kovanı', r'gelişmiş ülke', r'yaşlı nüfus', r'bağımlı nüfus']),
    ("Gelişmemiş Ülke Nüfus Piramidi (Kenarları İçe Çökük)", "Tabanı aşırı geniş (yüksek doğum), çocuk ölüm oranı yüksek piramit gelişmemiş ülkelere aittir.", [r'nüfus piramitleri', r'doğum oranı', r'ölüm oranı', r'nüfus artış hızı', r'nüfus sıçrama']),
    ("Göçte İtici ve Çekici Faktörler", "İşsizlik, savaş, kuraklık 'itici'; eğitim, sağlık, iş imkânı, yüksek yaşam standardı 'çekici' faktördür.", [r'göç\b', r'mülteci', r'beyin göçü', r'itici faktör', r'çekici faktör', r'iç göç']),
    ("Kırsal Mesken Yapı Malzemeleri", "İç ve Güneydoğu Anadolu'da kuraklıktan dolayı kerpiç; Karadeniz'de bol ormandan ahşap; Akdeniz'de taş meskenler yaygındır.", [r'mesken\b', r'kerpiç\b', r'ahşap mesken', r'taş mesken', r'konut tipi', r'dağınık kırsal']),
    ("Dünya Boğazları ve Kanalları", "Süveyş (Akdeniz-Kızıldeniz), Panama (Büyük Okyanus-Atlas Okyanusu), Hürmüz (Basra Körfezi petrol çıkışı), Malakka (Uzak Doğu ticaret yolu).", [r'boğaz\b', r'kanal\b', r'süveyş', r'panama', r'hürmüz', r'malakka', r'cebelitarık', r'babülmendep']),
    ("Ekonomik Faaliyet Sektörleri (1, 2, 3)", "Birincil = Doğrudan doğadan (Tarım/Madencilik); İkincil = İmalat/Fabrika (Sanayi); Üçüncül = Hizmet (Eğitim, Ulaşım, Bankacılık).", [r'birincil', r'ikincil', r'üçüncül', r'dördüncül', r'ekonomik faaliyet', r'tarım sektörü', r'enerji kaynak']),
    ("Bölgesel Kalkınma Projeleri (GAP, DOKAP)", "GAP Fırat ve Dicle üzerinde sulama/tarım ve hidroelektrik; DOKAP Karadeniz'de yaylacılık ve balıkçılık odaklıdır.", [r'gap\b', r'dokap', r'kop\b', r'bölge sınırı', r'işlevsel bölge'])
]

# ==============================================================================
# 2. TÜRK DİLİ VE EDEBİYATI ATOMİK SÖZLÜĞÜ VE KAZANIM HARİTASI
# ==============================================================================
TDE_ATOMIC_RULES = [
    ("'-ki' Eki ve Bağlacının Yazımı", "Kelimeye '-ler' takısı getir: Anlamlıysa bitişik ek (evdekiler), anlamsızsa ayrı bağlaçtır (kaldıkiler -> kaldı ki).", [r'ki’nin yazımı', r'ki/bağlaç', r'kaldıki', r'öyleki', r'demekki', r'ki yazımı', r'ki bağlacı']),
    ("'-de / -da' Eki ve Bağlacının Yazımı", "Cümleden çıkarıldığında anlam bozulmuyorsa bağlaçtır ve daima ayrı yazılır; bağlaç olan 'de' asla 'te/ta' olmaz.", [r'de’nin yazımı', r'de/da\b', r'da’nın yazımı', r'de bağlacı']),
    ("'mı / mi / mu / mü' Soru Ekinin Yazımı", "Kendisinden önceki sözcükten daima ayrı yazılır, kendisinden sonra gelen ekler ise 'mı'ya bitişir (Gelecek misin?).", [r'mı/mi', r'mi’nin yazımı', r'mı’nın yazımı', r'soru eki']),
    ("Büyük Harflerin Yazımı ve Kurum Ekleri", "Kurum, kuruluş ve kurul adlarına gelen ekler kesme işaretiyle AYRILMAZ (Türk Dil Kurumuna, TBMM'nin).", [r'büyük harf', r'kurum ve kuruluş', r'unvan', r'baş kenti', r'ankara’da']),
    ("Birleşik Sözcüklerin Yazımı (Ayrı vs Bitişik)", "Kelimelerden biri veya her ikisi anlamını yitirmişse bitişik (hanımeli, sivrisinek), ses olayı varsa bitişik (kaybolmak) yazılır.", [r'birleşik sözcük', r'ayrı yazıl', r'bitişik yazıl', r'yanı sıra', r'birçoğumuz', r'yanlızca']),
    ("Noktalı Virgül (;) Kullanımı", "Cümle içinde virgüllerle ayrılmış tür veya takımları ayırmak veya ögeleri arasında virgül olan sıralı cümleleri ayırmak için konur.", [r'noktalı virgül']),
    ("İki Nokta (:) Kullanımı", "Kendisinden sonra açıklama yapılacak veya örnekler sıralanacak cümlenin sonuna iki nokta konur.", [r'iki nokta']),
    ("Kesme İşareti (') Kullanımı", "Özel isimlere gelen çekim ekleri ayrılır; fakat yapım ekleri ve çoğul eki (-ler) kesmeyle ASLA ayrılmaz (Ahmetler, Türkçenin).", [r'kesme işareti']),
    ("İlahi (Hâkim / Tanrısal) Bakış Açısı", "Anlatıcı kahramanların aklından geçenleri, kalbindeki gizli duyguları, geçmiş ve geleceklerini bilen 3. kişidir.", [r'hâkim bakış', r'hakim bakış', r'ilahi bakış', r'tanrısal bakış']),
    ("Kahraman Bakış Açısı", "Olayı bizzat yaşayan kişi 'ben' veya 'biz' diliyle (1. tekil şahıs) anlatır.", [r'kahraman bakış', r'birinci tekil']),
    ("Gözlemci (Müşahit) Bakış Açısı", "Anlatıcı olayları bir kamera sessizliğiyle sadece dışarıdan gördüğü kadarıyla tarafsızca aktarır.", [r'gözlemci bakış', r'gözlemci anlatıcı']),
    ("Olay Hikâyesi (Maupassant) vs Durum Hikâyesi (Çehov)", "Olay hikâyesinde merak, heyecan ve serim-düğüm-çözüm vardır (Ömer Seyfettin); Durum hikâyesinde günlük hayattan bir kesit verilir (Sait Faik).", [r'olay hikâyesi', r'durum hikâyesi', r'maupassant', r'çehov']),
    ("Bilinç Akışı ve İç Konuşma", "Bilinç akışında düşünceler mantık sırası olmadan, karmaşık çağrışımlarla akar; iç konuşmada dil bilgisi kurallarına uygun düzenli monolog vardır.", [r'bilinç akışı', r'iç konuşma', r'iç çözümleme']),
    ("İlk Türk Romanları ve Edebi Akımlar", "İlk yerli roman Taaşşuk-ı Talat ve Fitnat, ilk edebi roman İntibah, ilk tarihi roman Cezmi, ilk köy romanı Karabibik'tir.", [r'ilk yerli roman', r'ilk edebî roman', r'intibah', r'taaşşuk', r'romancı', r'roman türü']),
    ("Kafiye Türleri (Yarım, Tam, Zengin, Cinaslı)", "Tek ses = Yarım; 2 ses = Tam; 3+ ses = Zengin kafiye; Eş sesli kelimeler = Cinaslı kafiyedir.", [r'yarım kafiye', r'tam kafiye', r'zengin kafiye', r'cinaslı kafiye', r'uyak\b']),
    ("Redif Bulma Kuralı", "Dize sonunda kafiyeden sonra gelen, yazılışı ve görevleri (aynı ek veya aynı kelime) birebir aynı olan seslerdir.", [r'redif\b', r'redifi']),
    ("Teşbih (Benzetme) ve İstiare (Eğretileme)", "Benzeyen ve benzetilen varsa teşbih; sadece benzetilen varsa açık istiare ('gökten inciler yağdı' = dolu), sadece benzeyen varsa kapalı istiaredir.", [r'teşbih', r'istiare', r'benzetme', r'eğretileme']),
    ("Teşhis (Kişileştirme) ve İntak (Konuşturma)", "İnsana ait özelliklerin cansız varlık veya hayvana verilmesi teşhis; onların konuşturulması intaktır (her intak teşhistir).", [r'teşhis', r'intak', r'kişileştirme', r'konuşturma']),
    ("Tezat (Zıtlık) ve Tenasüp (Uygunluk)", "Zıt anlamlı kavramların bir arada kullanılması tezat (ağlamak-gülmek); aralarında anlam ilgisi olan kelimelerin kullanılması tenasüptür (gül-bülbül).", [r'tezat', r'tenasüp', r'zıtlık']),
    ("Fiilimsiler (İsim-Fiil, Sıfat-Fiil, Zarf-Fiil)", "İsim-fiil (-ma,-ış,-mak); Sıfat-fiil (-an,-ası,-mez,-ar,-dik,-ecek,-miş); Zarf-fiil (-ken,-alı,-madan,-ince,-ip,-erek,-dıkça).", [r'fiilimsi', r'isim-fiil', r'sıfat-fiil', r'zarf-fiil']),
    ("Cümlenin Temel Ögeleri (Yüklem ve Özne)", "Önce Yüklem bulunur, sonra yükleme 'Yapan kim? / Olan ne?' soruları sorularak Özne bulunur.", [r'yüklem\b', r'özne\b', r'cümlenin ögeleri']),
    ("Nesne vs Dolaylı Tümleç", "Yükleme sorulan 'Neyi? Kimi?' soruları Belirtili Nesne; '-e, -de, -den' halindeki 'Kime? Nerede? Nereden?' Dolaylı Tümleçtir.", [r'nesne\b', r'dolaylı tümleç', r'yer tamlayıcısı']),
    ("Ek Fiil Görevleri (idi, imiş, ise, -dir)", "1. İsim soylu sözcükleri yüklem yapar. 2. Basit zamanlı fiilleri birleşik zamanlı fiil yapar.", [r'ek-fiil', r'ek eylem', r'ek fiil']),
    ("Cümle Türleri: Anlamca ve Yapıca Durumu", "İçinde fiilimsi olan cümle 'Girişik Birleşik'; virgülle bağlananlar 'Sıralı'; 've, ama' ile bağlananlar 'Bağlı' cümledir.", [r'anlamca olumlu', r'yapıca olumsuz', r'basit cümle', r'birleşik cümle', r'sıralı cümle', r'bağlı cümle']),
    ("Makale, Fıkra ve Deneme Ayrımı", "Makale kanıtlanabilir bilimsel tezdir; fıkra güncel gazete köşesidir; deneme yazarın kendisiyle sohbetidir.", [r'makale', r'deneme\b', r'fıkra\b', r'köşe yazısı', r'sohbet\b']),
    ("Biyografi, Otobiyografi ve Anı", "Biyografi başkasının hayatını (3. kişi), otobiyografi kendi hayatını (1. kişi) anlatır; anı geçmişte bizzat tanık olunan olaylardır.", [r'biyografi', r'otobiyografi', r'anı\b', r'hatıra', r'gezi yazısı']),
    ("Geleneksel Türk Tiyatrosu (Karagöz & Orta Oyunu)", "Karagöz gölge oyunudur (Hacivat münevver, Karagöz halk adamıdır). Orta oyunu meydanda oynanır (Pişekâr ve Kavuklu).", [r'karagöz', r'orta oyunu', r'hacivat', r'kavuklu', r'pişekâr', r'meddah']),
    ("Geçiş Dönemi Eserleri", "Kutadgu Bilig (İlk mesnevi / Siyasetname), Divanü Lugati't-Türk (İlk Türkçe sözlük), Atabetü'l-Hakayık (Ahlak kitabı), Divan-ı Hikmet (Tasavvuf).", [r'kutadgu bilig', r'divanü lügat', r'atabetü', r'divan-ı hikmet', r'geçiş dönemi', r'dede korkut']),
    ("Divan Edebiyatı Nazım Şekilleri (Gazel, Kaside, Mesnevi)", "Gazel aşk/şarap konulu aa, ba, ca; Kaside övgü konulu; Mesnevi her beyti kendi içinde kafiyeli (aa, bb, cc) divan romanıdır.", [r'gazel\b', r'kaside', r'mesnevi', r'rubai', r'divan edebiyatı', r'fuzuli', r'baki\b', r'nedim\b']),
    ("Tanzimat 1. Dönem vs 2. Dönem", "1. Dönem: Sanat toplum içindir, dilde sadeleşme (Şinasi, Namık Kemal). 2. Dönem: Sanat sanat içindir, ağır ve bireysel dil (Recaizade).", [r'tanzimat', r'şinasi', r'namık kemal', r'recaizade', r'abdülhak hamit']),
    ("Garipçiler (1. Yeni) vs İkinci Yeni", "Garipçiler (Orhan Veli) ölçüye, kafiyeye ve sanata karşı sokaktaki adamı yazar; İkinci Yeni (Cemal Süreya) kapalı, soyut ve imgeli yazar.", [r'garip akımı', r'orhan veli', r'ikinci yeni', r'cemal süreya', r'saf şiir', r'toplumcu gerçekçi']),
    ("Paragrafta Ana Düşünce ve Asıl Anlatılmak İstenen", "Paragrafın ilk ve son cümlelerine odaklanılır; yazarın okuyucuya vermek istediği hayat dersi / mesaj ana düşüncedir.", [r'bu parçada asıl anlatılmak istenen', r'ana düşünce', r'ana fikir', r'vurgulanmak istenen']),
    ("Paragrafta Yardımcı Düşünceler (Hangisi Çıkarılamaz?)", "Önce şıklar okunup anahtar kavramların altı çizilir, ardından metin hızlıca taranarak şıklar eşleştirilip elenir.", [r'çıkarılamaz', r'değinilmemiştir', r'ulaşılamaz', r'hangisine değinilmemiş']),
    ("Paragrafta Konu ve Başlık", "Metinde 'Yazar neyden bahsediyor / Neyi anlatıyor?' sorusunun karşılığı konudur.", [r'bu parçanın konusu', r'başlık', r'konusu nedir'])
]

TDE_SUBTOPIC_FALLBACK = {
    "Yazım Kuralları: Ekler ve Bağlaçlar ('de', 'ki', 'mi')": ("'-de / -da' ve '-ki' Ek-Bağlaç Yazımı", "Cümleden çıkarılınca anlam bozulmuyorsa bağlaçtır ve ayrı yazılır; 'ki' için '-ler' testi uygulanır."),
    "Yazım Kuralları: Büyük Harfler, Sayılar ve Birleşik Kelimeler": ("Birleşik Sözcüklerin Yazımı (Ayrı vs Bitişik)", "Kelimelerden biri veya her ikisi anlamını yitirmişse bitişik (hanımeli, sivrisinek), ses olayı varsa bitişik (kaybolmak) yazılır."),
    "Noktalama İşaretleri: Virgül ve Noktalı Virgül": ("Noktalı Virgül (;) Kullanımı", "Cümle içinde virgüllerle ayrılmış tür veya takımları ayırmak veya ögeleri arasında virgül olan sıralı cümleleri ayırmak için konur."),
    "Noktalama İşaretleri: İki Nokta, Nokta, Kesme ve Tırnak": ("Yay Ayraç İçine Noktalama Yerleştirme", "Tamamlanmış cümlenin sonuna nokta (.), eksiltiliye üç nokta (...), soru anlamı taşıyana (?) işareti konur."),
    "Anlatıcı ve Bakış Açıları (İlahi, Kahraman, Gözlemci)": ("İlahi (Hâkim / Tanrısal) Bakış Açısı", "Anlatıcı kahramanların aklından geçenleri, kalbindeki gizli duyguları, geçmiş ve geleceklerini bilen 3. kişidir."),
    "Hikâye Türleri ve Yapı Unsurları (Olay vs Durum)": ("Olay Hikâyesi (Maupassant) vs Durum Hikâyesi (Çehov)", "Olay hikâyesinde merak ve serim-düğüm-çözüm vardır (Ömer Seyfettin); Durum hikâyesinde günlük yaşamdan bir kesit verilir (Sait Faik)."),
    "Anlatım Teknikleri (Bilinç Akışı, İç Konuşma, Geriye Dönüş)": ("Bilinç Akışı ve İç Konuşma", "Bilinç akışında düşünceler mantık sırası olmadan, karmaşık çağrışımlarla akar; iç konuşmada dil bilgisi kurallarına uygun düzenli monolog vardır."),
    "Roman Türleri, Akımlar ve Karakter Tahlili": ("İlk Türk Romanları ve Edebi Akımlar", "İlk yerli roman Taaşşuk-ı Talat ve Fitnat, ilk edebi roman İntibah, ilk tarihi roman Cezmi, ilk köy romanı Karabibik'tir."),
    "Kafiye (Uyak) Türleri ve Redif": ("Kafiye Türleri (Yarım, Tam, Zengin, Cinaslı)", "Tek ses = Yarım; 2 ses = Tam; 3+ ses = Zengin kafiye; Eş sesli kelimeler = Cinaslı kafiyedir."),
    "Ölçü, Nazım Birimi ve Ahenk Unsurları": ("Hece Ölçüsü ve Duraklar", "Şiirde parmak hesabı ile ünlü harfler sayılır; 7'li, 8'li veya 11'li hece kalıbı ve durak yerleri tespit edilir."),
    "Söz Sanatları (Edebi Sanatlar)": ("Teşbih (Benzetme) ve İstiare (Eğretileme)", "Benzeyen ve benzetilen varsa teşbih; sadece benzetilen varsa açık istiare, sadece benzeyen varsa kapalı istiaredir."),
    "Şiir Türleri (Lirik, Epik, Didaktik, Pastoral, Satirik)": ("Şiir Türleri ve Duygu Tahlili", "Aşk ve özlem = Lirik; Savaş ve kahramanlık = Epik; Öğüt ve ahlak = Didaktik; Doğa ve çoban = Pastoral; Eleştiri = Satirik şiirdir."),
    "Sözcük Türleri: İsimler ve İsim Tamlamaları": ("İsim Tamlamaları (Belirtili, Belirtisiz, Zincirleme)", "Tamlayan ve tamlanan ek almışsa Belirtili; sadece tamlanan ek almışsa Belirtisiz; üç isim bağlıysa Zincirleme tamlamadır."),
    "Sözcük Türleri: Sıfatlar ve Sıfat Tamlamaları": ("Niteleme ve Belirtme Sıfatları", "İsme sorulan 'Nasıl?' sorusu Niteleme; işaret, sayı, belgisiz ve soru sözcükleri Belirtme sıfatıdır."),
    "Sözcük Türleri: Zamirler (Adıllar)": ("Zamir Çeşitleri (Kişi, İşaret, Belgisiz)", "İsmin yerini tutan sözcüklerdir; ben/sen/o Kişi; bu/şu/o İşaret; biri/herkes/bazıları Belgisiz zamirdir."),
    "Sözcük Türleri: Zarflar (Belirteçler)": ("Zarf Türleri (Durum, Zaman, Miktar)", "Fiile veya fiilimsiye sorulan 'Nasıl?' Durum, 'Ne zaman?' Zaman, 'Ne kadar?' Miktar zarfını verir."),
    "Sözcük Türleri: Edat, Bağlaç ve Ünlem": ("Edat ve Bağlaç Ayrımı", "İle, gibi, için, kadar, göre Edattır; ve, de, ki, ama, fakat, çünkü Bağlaçtır."),
    "Fiiller, Ek Fiil ve Fiilde Çatı": ("Ek Fiil Görevleri (idi, imiş, ise, -dir)", "1. İsim soylu sözcükleri yüklem yapar. 2. Basit zamanlı fiilleri birleşik zamanlı fiil yapar."),
    "Fiilimsiler (İsim-Fiil, Sıfat-Fiil, Zarf-Fiil)": ("Fiilimsiler (İsim-Fiil, Sıfat-Fiil, Zarf-Fiil)", "İsim-fiil (-ma,-ış,-mak); Sıfat-fiil (-an,-ası,-mez,-ar,-dik,-ecek,-miş); Zarf-fiil (-ken,-alı,-madan,-ince,-ip,-erek,-dıkça)."),
    "Cümlenin Ögeleri": ("Cümlenin Temel Ögeleri (Yüklem ve Özne)", "Önce Yüklem bulunur, sonra yükleme 'Yapan kim? / Olan ne?' soruları sorularak Özne bulunur."),
    "Cümle Türleri ve Anlatım Bozuklukları": ("Cümle Türleri: Anlamca ve Yapıca Durumu", "İçinde fiilimsi olan cümle 'Girişik Birleşik'; virgülle bağlananlar 'Sıralı'; 've, ama' ile bağlananlar 'Bağlı' cümledir."),
    "Sözcükte Anlam ve Anlatım Özellikleri": ("Sözcükte Anlam (Mecaz, Gerçek, Terim)", "Akla gelen ilk anlam Gerçek; anlam genişlemesiyle soyutlaşan Mecaz; meslek/bilim dalına ait olan Terim anlamdır."),
    "İslamiyet Öncesi ve Geçiş Dönemi Türk Edebiyatı": ("Geçiş Dönemi Eserleri", "Kutadgu Bilig (İlk mesnevi / Siyasetname), Divanü Lugati't-Türk (İlk Türkçe sözlük), Atabetü'l-Hakayık (Ahlak kitabı), Divan-ı Hikmet (Tasavvuf)."),
    "Halk Edebiyatı ve Âşık Tarzı Şiir": ("Âşık Tarzı Şiir (Koşma, Semai, Varsağı)", "11'li hece ile aşk/doğa = Koşma; 8'li hece ile ezgili = Semai; 'Bre, Hey' nidalarıyla yiğitçe = Varsağıdır."),
    "Divan Edebiyatı ve Nazım Şekilleri": ("Divan Edebiyatı Nazım Şekilleri (Gazel, Kaside, Mesnevi)", "Gazel aşk/şarap konulu aa, ba, ca; Kaside övgü konulu; Mesnevi her beyti kendi içinde kafiyeli (aa, bb, cc) divan romanıdır."),
    "Tanzimat, Servet-i Fünun ve Fecr-i Âti Edebiyatı": ("Tanzimat 1. Dönem vs 2. Dönem", "1. Dönem: Sanat toplum içindir, dilde sadeleşme (Şinasi, Namık Kemal). 2. Dönem: Sanat sanat içindir, ağır ve bireysel dil (Recaizade)."),
    "Millî Edebiyat ve Kurtuluş Savaşı Dönemi": ("Millî Edebiyat ve Genç Kalemler", "Yeni Lisan makalesi (Ömer Seyfettin), dilde Türkçülük (Ziya Gökalp) ve Anadolu insanının Kurtuluş Savaşı mücadelesi işlenir."),
    "Cumhuriyet Dönemi Türk Edebiyatı ve Türk Dünyası": ("Garipçiler (1. Yeni) vs İkinci Yeni", "Garipçiler (Orhan Veli) ölçüye, kafiyeye ve sanata karşı sokaktaki adamı yazar; İkinci Yeni (Cemal Süreya) kapalı, soyut ve imgeli yazar."),
    "Öğretici Metinler (Makale, Deneme, Fıkra, Mektup, Anı)": ("Makale, Fıkra ve Deneme Ayrımı", "Makale kanıtlanabilir bilimsel tezdir; fıkra güncel gazete köşesidir; deneme yazarın kendisiyle sohbetidir."),
    "Tiyatro Türleri ve Geleneksel Türk Tiyatrosu": ("Geleneksel Türk Tiyatrosu (Karagöz & Orta Oyunu)", "Karagöz gölge oyunudur (Hacivat münevver, Karagöz halk adamıdır). Orta oyunu meydanda oynanır (Pişekâr ve Kavuklu)."),
    "Paragrafta Ana Düşünce, Konu ve Yardımcı Düşünceler": ("Paragrafta Ana Düşünce ve Asıl Anlatılmak İstenen", "Paragrafın ilk ve son cümlelerine odaklanılır; yazarın okuyucuya vermek istediği mesaj ana düşüncedir."),
    "Anlatım Biçimleri ve Düşünceyi Geliştirme Yolları": ("Anlatım Biçimleri (Açıklama, Tartışma, Öyküleme, Betimleme)", "Bilgi verme = Açıklama; Fikri çürütme = Tartışma; Olay akışı = Öyküleme (video); Sözcüklerle resim çizme = Betimleme (fotoğraf).")
}

# ==============================================================================
# 3. MATEMATİK ATOMİK SÖZLÜĞÜ VE KAZANIM HARİTASI
# ==============================================================================
MATEMATIK_ATOMIC_RULES = [
    ("İse (⇒) Bağlacı ve 100 Kuralı", "p ⇒ q önermesi sadece 1 ⇒ 0 ≡ 0 iken yanlıştır (100 kuralı); diğer tüm durumlarda doğruluk değeri 1'dir.", [r'p ⇒', r'p l &', r'ise\b', r'önerme', r'totoloji', r'çelişki']),
    ("Kümelerde Alt Küme Sayısı (2^n)", "n elemanlı kümenin alt küme sayısı 2^n, kendisi hariç öz alt küme sayısı 2^n - 1'dir.", [r'alt küme', r'öz alt küme', r'2\^n']),
    ("Küme Birleşim Eleman Sayısı: s(A∪B)", "s(A ∪ B) = s(A) + s(B) - s(A ∩ B); kesişim iki defa sayılmasın diye bir defa çıkarılır.", [r's\(a∪b\)', r's\(a∩b\)', r'fark kümesi', r'kesişim', r'birleşim']),
    ("Bölünebilme Kuralları (3, 4, 9, 11)", "3 ve 9 için rakamlar toplamı; 4 için son iki basamak; 5 için son basamak (0 veya 5); 11 için +-+- kuralı uygulanır.", [r'bölünebil', r'kalansız bölünen', r'ile bölümünden kalan', r'basamaklı.*sayısı.*bölün']),
    ("Basamak Çözümleme ve Rakamlar Toplamı", "ab = 10a + b ve ab - ba = 9(a - b); iki basamaklı sayıların farkı daima 9'un katıdır.", [r'basamak', r'rakamları toplamı', r'ardışık']),
    ("EBOB-EKOK ve Periyodik Problemler", "İki sayının çarpımı EBOB'u ile EKOK'unun çarpımına eşittir: a · b = EBOB(a,b) · EKOK(a,b). Nöbet/lamba soruları EKOK ile çözülür.", [r'ebob\b', r'ekok\b', r'lamba sırasıyla', r'periyodik']),
    ("Mutlak Değer Kök Bulma: |x - a| = b", "|x - a| = b ise x - a = b veya x - a = -b yazılır; iki kök bulunur ve toplanır.", [r'mutlak değer', r'\| y - x \|', r'\|x', r'\|a', r'\|b']),
    ("Eşitsizliklerde Eksiyle Çarpma Kuralı", "Eşitsizliğin her iki tarafı negatif bir sayıyla çarpılır veya bölünürse eşitsizlik yön değiştirir (< ise > olur).", [r'eşitsizlik', r'eşitsizliğini sağlayan', r'çözüm kümesi.*aralık']),
    ("İki Bilinmeyenli Denklem Sisteminde Yok Etme", "Bilinmeyenlerden birinin katsayıları zıt işaretle eşitlenerek taraf tarafa toplanır ve tek değişkene indirgenir.", [r'denklem sisteminin', r'sağlayan x kaçtır', r'denklemini sağlayan x']),
    ("Üslü Sayılarda Taban Değiştirme (Kuvvetin Kuvveti)", "9^(x+2) = (3^2)^(x+2) = 3^(2x+4); üslü denklemlerde tabanlar eşitlenip üsler birbirine eşitlenir.", [r'üslü', r'kuvveti', r'9 x\+2', r'3 x\+1', r'üs alma']),
    ("Köklü İfadelerde Eşlenikle Çarpma", "Paydada karekök varsa pay ve payda eşleniğiyle çarpılarak payda iki kare farkıyla kökten kurtarılır.", [r'köklü', r'kareköklü', r'√', r'kökten kurtar', r'paydayı rasyonel']),
    ("Yaş Problemlerinde Sabit Yaş Farkı", "İki kişi arasındaki yaş farkı yıllar geçse de ASLA değişmez; geçen yıllar herkesin yaşına eşit eklenir.", [r'yaşları', r'yaş farkı', r'bugünkü yaşları']),
    ("Yüzde ve Kâr-Zarar Problemlerinde 100x Kuralı", "Maliyete daima 100x denir; %20 kâr = 120x, %15 indirim/zarar = 85x yazılarak tek denklemle çözülür.", [r'yüzde', r'%\d+', r'kar\b', r'kâr\b', r'zarar\b', r'maliyet', r'satış fiyatı']),
    ("Hız-Hareket Problemi (x = v · t)", "Yol = Hız x Zaman. Karşılıklı gelen araçlar hızlarını toplar (v1+v2), aynı yöne gidenler hızlarını çıkarır (v1-v2).", [r'km/sa', r'hız\b', r'hızları', r'mesafe bulunan iki']),
    ("Özel Dik Üçgenler (3-4-5 ve 5-12-13 Katları)", "Hipotenüs formülü yapmadan kenar katlarına bak: 3-4-5 (6-8-10, 9-12-15) veya 5-12-13 (10-24-26) katıysa doğrudan işaretle.", [r'3-4-5', r'5-12-13', r'dik üçgen', r'pisagor', r'hipotenüs']),
    ("Öklid Bağıntısı (h^2 = p · k)", "Dikten dik inmişse (dik açıdan yükseklik); yüksekliğin karesi tabanda ayırdığı parçaların çarpımına eşittir.", [r'öklid', r'dikten dik']),
    ("Üçgende Açıortay ve Kenarortay Bağıntıları", "İç açıortayda kolların oranı taban parçalarının oranına eşittir. Ağırlık merkezi kenara 1, köşeye 2 birim uzaklıktadır.", [r'açıortay', r'kenarortay', r'ağırlık merkezi']),
    ("Üçgende İç ve Dış Açılar Toplamı", "Üçgenin iç açıları toplamı 180°, dış açıları toplamı 360°'dir. İki iç açının toplamı kendilerine komşu olmayan bir dış açıya eşittir.", [r'üçgende açı', r'iç açılar', r'dış açı', r'ikizkenar', r'açı-kenar']),
    ("Grafikten Fonksiyon Değeri Okuma: f(a) = b", "x eksenindeki 'a' noktasından dikey çıkıp grafiğe değdiğin yerdeki y ekseni değeri f(a)'dır. Eksenleri kestiği noktalarda biri sıfırdır.", [r'fonksiyonunun grafiği', r'grafikte f\(', r'f\(a\) =']),
    ("Bileşke Fonksiyon Kuralı: (f o g)(x)", "Sağdakini al, soldakinin içine yaz: f(g(x)). Önce içerideki g(x) hesaplanır, çıkan sayı f'de yerine konur.", [r'bileşke', r'\(fog\)', r'\(f o g\)']),
    ("Polinomda Bölme ve Kalan Bulma", "P(x)'in (x - a) ile bölümünden kalanı bulmak için bölen sıfıra eşitlenir (x = a) ve polinomda yerine konur: Kalan = P(a).", [r'polinomunun derecesi', r'ile bölümünden kalan', r'sabit terimi kaçtır', r'katsayılar toplamı kaçtır', r'P\(2x - 5\)']),
    ("Çarpanlara Ayırma: İki Kare Farkı (a^2 - b^2)", "a^2 - b^2 = (a - b)(a + b) özdeşliği sadeleştirme sorularında en çok kullanılan kuraldır.", [r'çarpan', r'iki kare farkı', r'tam kare', r'en sade biçimi']),
    ("Kökler Toplamı (-b/a) ve Kökler Çarpımı (c/a)", "ax^2 + bx + c = 0 denkleminde kökleri bulma; Kökler Toplamı = -b/a, Kökler Çarpımı = c/a formülüyle doğrudan çöz.", [r'ikinci derece', r'denkleminin kökleri', r'kökler toplamı', r'kökler çarpımı', r'köklerinden biri', r'x 2 \+']),
    ("Düzgün Çokgen Dış Açı Formülü (360/n)", "Tüm düzgün çokgenlerde bir dış açı = 360 / n'dir. Bir iç açı = 180 - (360/n) formülüyle 5 saniyede bulunur.", [r'düzgün altıgen', r'düzgün beşgen', r'çokgen']),
    ("Özel Dörtgenlerde Alan (Köşegen Bağıntısı)", "Köşegenleri dik kesişen dörtgenlerde (Eşkenar Dörtgen, Deltoid, Kare) Alan = (e · f) / 2 (köşegenlerin çarpımının yarısıdır).", [r'eşkenar dörtgen', r'paralelkenar', r'dikdörtgen', r'kare\b', r'deltoid', r'yamuk\b']),
    ("Katı Cisimlerde Hacim: Taban Alanı x Yükseklik", "Tüm prizma ve silindirlerin hacmi V = Taban Alanı x Yükseklik'tir. Piramit ve konilerde ise üçe bölünür: (Taban x Yükseklik) / 3.", [r'prizma', r'küp\b', r'piramit', r'silindir', r'cisim köşegen', r'hacmi kaç'])
]

# ==============================================================================
# HİYERARŞİK ATOMİK SINIFLANDIRICI
# ==============================================================================
def find_atomic_match_with_context(q, atomic_rules, subtopic_fallback_dict, default_tuple):
    stem = normalize_text(q['soru'])
    opts = normalize_text(' '.join(q['secenekler'].values()))
    
    best_score = 0
    best_atomic = None
    best_tip = None
    
    for atom_title, atom_tip, pats in atomic_rules:
        score = 0
        for pat in pats:
            s_matches = len(re.findall(pat, stem, re.IGNORECASE))
            o_matches = len(re.findall(pat, opts, re.IGNORECASE))
            score += (s_matches * 4) + o_matches
        if score > best_score:
            best_score = score
            best_atomic = atom_title
            best_tip = atom_tip
            
    if best_score > 0:
        return best_atomic, best_tip
        
    # Alt konu bazlı bağlamsal fallback
    alt_k = q.get('alt_konu', '')
    if subtopic_fallback_dict and alt_k in subtopic_fallback_dict:
        return subtopic_fallback_dict[alt_k]
        
    return default_tuple[0], default_tuple[1]

def process_subject_atomics(input_json_path, atomic_rules, subtopic_fallback_dict, output_tagged_path, output_packages_path, default_tuple):
    with open(input_json_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
        
    tagged_questions = []
    atomic_clusters = defaultdict(lambda: {
        'atomik_konu': '',
        'spot_taktik': '',
        'ana_konu': '',
        'alt_konu': '',
        'toplam_soru': 0,
        'dersler': defaultdict(int),
        'donemler': set(),
        'sorular': []
    })
    
    for q in questions:
        at_title, at_tip = find_atomic_match_with_context(q, atomic_rules, subtopic_fallback_dict, default_tuple)
        q_copy = dict(q)
        q_copy['atomik_konu'] = at_title
        q_copy['spot_taktik'] = at_tip
        tagged_questions.append(q_copy)
        
        c = atomic_clusters[at_title]
        c['atomik_konu'] = at_title
        c['spot_taktik'] = at_tip
        c['ana_konu'] = q['ana_konu']
        c['alt_konu'] = q['alt_konu']
        c['toplam_soru'] += 1
        c['dersler'][q['ders']] += 1
        c['donemler'].add(f"{q['yil']} D.{q['donem']}")
        c['sorular'].append(q_copy)
        
    sorted_packages = []
    for c in sorted(atomic_clusters.values(), key=lambda x: -x['toplam_soru']):
        courses = list(c['dersler'].keys())
        tot = c['toplam_soru']
        
        if tot <= 6:
            format_tavsiyesi = "5-10 Dakikalık Spot Taktik / Flashcard (3-6 Soru)"
        elif tot <= 15:
            format_tavsiyesi = "15-20 Dakikalık Mini Taktik Kampı (7-15 Soru)"
        else:
            format_tavsiyesi = "25-35 Dakikalık Odak Soru Paketi (16+ Soru)"
            
        pkg = {
            'atomik_konu': c['atomik_konu'],
            'spot_taktik': c['spot_taktik'],
            'ana_konu': c['ana_konu'],
            'alt_konu': c['alt_konu'],
            'toplam_soru': tot,
            'ortak_ders_sayisi': len(courses),
            'ortak_dersler': sorted(courses),
            'ders_dagilimi': dict(c['dersler']),
            'format_tavsiyesi': format_tavsiyesi,
            'donem_kapsami': sorted(list(c['donemler'])),
            'ornek_sorular': c['sorular'][:2],
            'tum_sorular': c['sorular']
        }
        sorted_packages.append(pkg)
        
    with open(output_tagged_path, 'w', encoding='utf-8') as f:
        json.dump(tagged_questions, f, ensure_ascii=False, indent=2)
        
    with open(output_packages_path, 'w', encoding='utf-8') as f:
        json.dump(sorted_packages, f, ensure_ascii=False, indent=2)
        
    print(f"✅ {len(tagged_questions)} soru etiketlendi -> {len(sorted_packages)} Atomik Paket oluşturuldu: {output_packages_path}")
    return sorted_packages

if __name__ == '__main__':
    # 1. Coğrafya
    process_subject_atomics(
        'ciktilar/analiz/cografya_alt_konular_etiketli.json',
        COGRAFYA_ATOMIC_RULES,
        None,
        'ciktilar/analiz/cografya_atomik_etiketli.json',
        'ciktilar/analiz/cografya_atomik_paketleri.json',
        ("Genel Coğrafya Soru Tipi", "Soru kökündeki anahtar kelimeye ve coğrafi ilkelere dikkat edilerek şıklar elenir.")
    )
    
    # 2. TDE
    process_subject_atomics(
        'ciktilar/analiz/tde_alt_konular_etiketli.json',
        TDE_ATOMIC_RULES,
        TDE_SUBTOPIC_FALLBACK,
        'ciktilar/analiz/tde_atomik_etiketli.json',
        'ciktilar/analiz/tde_atomik_paketleri.json',
        ("Paragrafta Ana Düşünce ve Asıl Anlatılmak İstenen", "Paragrafın ilk ve son cümlelerine odaklanılır; yazarın vermek istediği mesaj ana düşüncedir.")
    )
    
    # 3. Matematik
    process_subject_atomics(
        'ciktilar/analiz/matematik_alt_konular_etiketli.json',
        MATEMATIK_ATOMIC_RULES,
        None,
        'ciktilar/analiz/matematik_atomik_etiketli.json',
        'ciktilar/analiz/matematik_atomik_paketleri.json',
        ("Birinci Dereceden Denklem ve Sadeleştirme", "Bilinmeyenler bir tarafa, bilinenler diğer tarafa toplanarak x yalnız bırakılır.")
    )
    print("\n🚀 Tüm dersler için Hiyerarşik Atomik Konular başarıyla işlendi!")

