# -*- coding: utf-8 -*-
"""
topic_hints_data.py
AÖL Pedagojik Spot Taktikler ve Akıllı İpucu Motoru
MEB Açık Öğretim Lisesi sınav kazanımlarına dayalı, soru kökünü ve şıkları semantik
olarak analiz eden pedagojik ipucu sistemi.
"""

import re

TOPIC_HINTS = {
    # --- SAĞLIK BİLGİSİ VE TRAFİK KÜLTÜRÜ ---
    'Temel İlk Yardım ve Acil Müdahale Uygulamaları (Yaşam Desteği, Kanamalar, Şok)':
        'İlk yardımın ABC’si: A (Hava yolu açıklığı), B (Solunum/Bak-Dinle-Hisset), C (Dolaşım/Nabız). Kanamalarda baskılı sargı, şokta ayakları 30 cm kaldırma uygulanır.',
    'Geçiş Üstünlüğü, Takip Mesafesi, Sollama ve Hız Kuralları':
        'Geçiş üstünlüğü sırası (C-İ-P-S): Cankurtaran (Ambulans) → İtfaiye → Polis → Sivil Savunma. Güvenli takip mesafesi hızın en az yarısı kadar metredir (örn: 90 km/s -> 45 m).',
    'Trafik Levhaları, Yol Çizgileri ve Işıklı İşaretler':
        'Üçgen levhalar tehlike uyarısı, yuvarlak levhalar yasaklama/kısıtlama, kare/dikdörtgen levhalar bilgi verir. Kesik çizgi sollama serbest, devamlı çizgi sollama yasaktır.',
    'Trafikte Nezaket, Empati, Sabır ve Sürücü Davranışları':
        'Trafik adabı; kurallara sadece ceza korkusuyla değil, diğer sürücü ve yayaların can güvenliğini gözeterek saygı ve empatiyle uymaktır.',
    'Sağlık Hizmetleri, Koruyucu Sağlık ve Bulaşıcı Hastalıklardan Korunma':
        'Birincil koruma hastalık oluşmadan aşı ve hijyenle; ikincil koruma erken tanı/tarama ile; üçüncül koruma rehabilitasyon ve tedaviyle sağlanır.',
    'Beslenme, Fiziksel Aktivite, Bağımlılıkla Mücadele ve Ruh Sağlığı':
        'Yeterli ve dengeli beslenme; tüm besin gruplarından (karbonhidrat, protein, yağ, vitamin, mineral) gereksinim kadar tüketilmesi ve düzenli egzersizdir.',
    'Araç Güvenlik Donanımları, Sürüş Süreleri ve Çevre Bilinci':
        'Aktif güvenlik kaza olmasını önler (ABS, ESP, lastik); pasif güvenlik kaza anında hasarı azaltır (emniyet kemeri, hava yastığı, çocuk koltuğu).',

    # --- İNGİLİZCE ---
    'Conditionals (If Clauses Type 1, 2, 3) & Wish Clauses':
        'Type 1: If + Present Simple -> will + V1 (gerçekleşebilir). Type 2: If + Past Simple -> would + V1 (hayali/şimdiki). Type 3: If + Past Perfect -> would have + V3 (geçmiş pişmanlık).',
    'Passive Voice (Present & Past Passive)':
        'Edilgen çatıda nesne başa gelir: am/is/are + V3 (Şimdiki/Geniş) veya was/were + V3 (Geçmiş). Eylemi yapan özne belirtilecekse "by" edatı kullanılır.',
    'Modals & Semi-Modals (Can, Could, Should, Must, Have to)':
        'Must/Have to (zorunluluk), Should/Ought to (tavsiye), Can/Could (yetenek/izin), May/Might (olasılık). Olumsuzda mustn\'t yasak bildirirken don\'t have to zorunsuzluk bildirir.',
    'Relative Clauses (Who, Which, That, Where, Whose)':
        'Who (insanlar için), Which (hayvan/nesneler için), That (her ikisi için), Where (yer belirten isimler için), Whose (aitlik bildiren isimler için) kullanılır.',
    'Tenses & Time Expressions -> Present Tenses (Simple Present & Continuous) & Routines':
        'Alışkanlıklar ve genel doğrular için Simple Present (always, usually, every); şu an yapılan eylemler için Present Continuous (now, at the moment) tercih edilir.',
    'Past Tenses (Simple Past, Past Continuous, Past Perfect) & Used To':
        'Geçmişte tamamlanan eylemler için Simple Past (yesterday, ago), geçmişte devam edenler için was/were + V-ing, geçmişte terk edilen alışkanlıklar için "used to" kullanılır.',
    'Future Forms (Will, Be Going To) & Expressing Predictions':
        'Anlık kararlar ve tahminler için "will"; önceden planlanmış niyetler veya kanıta dayalı durumlar için "be going to" kullanılır.',
    'Vocabulary & Daily Functions -> Jobs, Career Goals, Skills & Personality Adjectives':
        'Kişilik sıfatlarına (generous, ambitious, reliable, outgoing) ve meslek tanımlarına (architect: binaları tasarlar, accountant: hesapları tutar) dikkat edin.',
    'Vocabulary & Daily Functions -> Food, Traditional Cuisine, Cooking & Ordering at a Restaurant':
        'Yemek pişirme fiillerine (bake, fry, boil, grill, chop) ve restoran sipariş kalıplarına ("I\'d like to have...", "Could I get the bill?") odaklanın.',
    'Vocabulary & Daily Functions -> Travel, Tourism, Transportation & Sightseeing':
        'Seyahat ve rezervasyon kalıplarına (book a room, flight ticket, departure, arrival, sightseeing) dikkat edin.',
    'Vocabulary & Daily Functions -> Environment, Social Issues, Human Rights & Technology':
        'Çevre ve sürdürülebilirlik kelimelerine (recycle, pollution, global warming, renewable energy, deforestation) odaklanın.',
    'Vocabulary & Daily Functions -> Hobbies, Sports, Music, Art & Entertainment':
        'Spor ve hobi kalıplarında fiil uyumuna dikkat edin: Play (toplu sporlar: football, tennis), Go (-ing bitenler: swimming, running), Do (bireysel: karate, yoga).',

    # --- DİN KÜLTÜRÜ VE AHLAK BİLGİSİ ---
    'Ahiret Hayatının Aşamaları (Ölüm, Berzah, Kıyamet, Haşir, Mizan)':
        'Ahiret aşamaları: Ölüm → Berzah (kabir hayatı) → Kıyamet (Sur borusu) → Ba’s (yeniden diriliş) → Haşir (toplanma) → Mahşer → Hesap/Mizan → Cennet/Cehennem.',
    'Allah’ın Sıfatları (Zati ve Subûti) ve İsimleri (Esma-i Hüsna)':
        'Zatî sıfatlar sadece Allah’a aittir (Vücud, Kıdem, Beka, Vahdaniyet, Muhalefetün lil-Havadis, Kıyam bi-Nefsihi). Subûtî sıfatlar benzeri insana da bahşedilendir (Hayat, İlim, Semî, Basar, İrade, Kudret, Kelam, Tekvin).',
    'İslam\'da Bilgi Kaynakları (Akıl, Vahiy, Duyular) ve İmanın Mahiyeti':
        'İslam’da bağlayıcı ve doğru bilgi kaynakları (selim akıl, sadık haber/vahiy, salim duyular) olmak üzere üçtür; rüya, keşif ve ilham bağlayıcı genel kaynak sayılmaz.',
    'Kur’an’da Geçen Temel Kavramlar (Hidayet, İhsan, İhlas, Takva, Cihad)':
        'İhlas (amelleri sırf Allah rızası için yapmak), İhsan (Allah’ı görüyormuş gibi kulluk etmek), Takva (günahlardan korunup Allah’ın emirlerine titizlikle sarılmak).',
    'İtikadi, Siyasi ve Fıkhi Mezhepler (Maturidilik, Eş\'arilik, Hanefilik)':
        'İtikat mezhepleri (Maturidilik, Eş’arilik) inanç esaslarını; Fıkıh mezhepleri (Hanefi, Şafii, Maliki, Hanbeli) ibadet ve hukuk kurallarını açıklar.',
    'Hz. Muhammed’in Şahsiyeti, Görevleri (Tebliğ, Tebyin, Teşri) ve Peygamberlik':
        'Peygamberin görevleri: Tebliğ (vahyi olduğu gibi iletmek), Tebyin (hükümleri açıklamak), Teşri (hüküm koymak), Temsil (örnek model olmak).',
    'İbadetlerin Anlamı, Şartları ve Hükümleri (Farz, Vacip, Sünnet)':
        'Farz (kesin delille emredilen: 5 vakit namaz, oruç), Vacip (zannî delille emredilen: kurban, vitir namazı), Sünnet (Peygamberimizin yaptığı ve öğütlediği).',
    'Anadolu’da Tasavvufi Yorumlar (Mevlevilik, Bektaşilik, Ahilik) ve Erenler':
        'Ahilik (esnaf dayanışması, ahlak ve dürüst kazanç), Mevlevilik (sema, hoşgörü, aşk), Bektaşilik (dört kapı kırk makam, insan sevgisi).',
    'İslam Ahlakının Esasları, Güzel Ahlak ve Kaçınılması Gereken Davranışlar':
        'Gıybet (arkadan çekiştirme), İftira (asılsız suçlama), Haset (kıskançlık), Riya (gösteriş) yasaklanmış; sıdk (doğruluk), adalet, emanet ve cömertlik emredilmiştir.',
    'Tevhit İnancı, Fıtrat ve Allah’ın Varlığının Delilleri':
        'Tevhit Allah’ın birliğini, eşi ve benzeri olmadığını ifade eder. Gaye ve nizam delili evrendeki kusursuz düzen ve amaçlılıktan Allah’ın varlığına ulaşır.',
    'Felsefi Yaklaşımlar (Deizm, Ateizm, Agnostisizm, Pozitivizm)':
        'Deizm yaratıcıyı kabul eder vahiy/peygamberi reddeder; Ateizm Tanrı’yı tamamen inkar eder; Agnostisizm Tanrı’nın bilinemeyeceğini savunur.',
    'İnsanın Allah ile İrtibat Yolları (Dua, İbadet, Tövbe, Zikir)':
        'Dua kulun dilek ve yakarışını doğrudan Allah’a sunmasıdır; tövbe günahtan pişmanlıkla dönüştür; ibadet ve namaz kulun Allah’a en yakın olduğu andır.',
    'Temel Değerler (Adalet, Hikmet, İffet, Şecaat) ve Gençlik':
        'Dört ana erdem: Hikmet (akıl erdemi), Şecaat (yiğitlik/cesaret), İffet (nefsi haramdan koruma), Adalet (ölçü ve hakkaniyet).',
    'İslam Medeniyetinde Bilim, Kurumlar (Rasathane, Medrese) ve Müslüman Âlimler':
        'İbn-i Sina (tıp / El-Kanun fi’t-Tıb), Harezmi (cebir / sıfır rakamı), Ali Kuşçu (astronomi/matematik), Biruni (coğrafya/fizik/dünya yarıçapı).',
    'İslam Medeniyetinin İzleri, Sanat, Mimari ve Gönül Coğrafyamız':
        'İslam sanatları: Hüsn-i Hat (güzel yazı), Tezhip (altınlama/süsleme), Ebru, Minyatür. Mimaride kubbe ve minare caminin karakteristik öğeleridir.',
    'Yahudilik ve Hristiyanlık (İnanç, İbadet ve Tarihsel Gelişim)':
        'Yahudilikte Tevrat (Tora) kutsal kitap ve Şabat kutsal gündür. Hristiyanlıkta Teslis (Baba-Oğul-Kutsal Ruh) inancı ve İncil esastır.',
    'Hint ve Doğu Asya Dinleri (Hinduizm, Budizm, Konfüçyanizm, Taoizm)':
        'Hinduizmde Reenkarnasyon (tenasüh) ve Karma yasası esastır. Budizmde aydınlanma (Nirvana) ve Dört Yüce Hakikat hedeflenir.',
    'Tıbbi, Ekonomik ve Günlük Yaşamla İlgili Güncel Dinî Meseleler (Organ Nakli, Faiz)':
        'Zaruretler haramları mübah kılar kuralınca hayat kurtarmak için meşru organ nakli caiz görülmüş; haksız kazanç ve faiz ise kesinlikle haram kılınmıştır.',
    'Hz. Muhammed\'in Örnekliği ve Genç Sahabelerin Rolü':
        'Muaz b. Cebel (Yemen valisi), Usame b. Zeyd (genç ordu komutanı), Mus’ab b. Umeyr (Medine muallimi) genç sahabelerin öncü rolleridir.',

    # --- FELSEFE ---
    'Bilginin İmkânı, Kaynağı ve Doğruluk Ölçütleri (Rasyonalizm, Empirizm)':
        'Rasyonalizm (akılcılık / Descartes, Platon), Empirizm (deneycilik / Locke, Hume), Kritisizm (akıl + deney / Kant), Entüisyonizm (sezgicilik / Gazali, Bergson).',
    'Varlık Felsefesi: Varlığın Mahiyeti ve Temel Problemleri (Ontoloji)':
        'Varlık maddedir (Materyalizm / Demokritos, Marx), varlık ideadır (İdealizm / Platon, Hegel), varlık oluştur (Herakleitos), varlık hem madde hem ruhtur (Düalizm / Descartes).',
    'Ahlak Felsefesi: Ahlaki Eylem, Özgürlük ve Evrensel Ahlak Yasası':
        'Determinizm (insan özgür değildir), İndeterminizm (insan tamamen özgürdür). Kant\'ın ödev ahlakı eylemin sonucuna değil niyet ve koşulsuz buyruğa bakar.',
    'Siyaset Felsefesi: Devletin Kaynağı, İdeal Düzen ve Ütopyalar':
        'Doğal devlet (Platon, Aristo: devlet doğanın devamıdır); Yapay devlet/Toplum Sözleşmesi (Hobbes, Locke, Rousseau: devlet insanların uzlaşmasıyla kurulur).',
    'Sanat Felsefesi: Güzellik, Taklit ve Yaratma Olarak Sanat':
        'Taklit olarak sanat (Platon, Aristo: doğanın mimesisi/yansıması); Yaratma olarak sanat (Croce: sanatçının özgün hayal gücü ve duygusu).',
    'Din Felsefesi: Tanrı’nın Varlığına İlişkin Görüşler ve Kanıtlar':
        'Teizm (Tanrı var ve müdahale eder), Deizm (Tanrı var ama müdahale etmez), Panteizm (Tanrı ve evren birdir), Agnostisizm (bilinemezcilik), Ateizm (inkar).',
    'Bilim Felsefesi: Ürün ve Etkinlik Olarak Bilim':
        'Klasik görüş bilimi doğrulanmış birikimsel ürün sayar; Kuhn bilimi paradigma değişimleri ve bilimsel devrimler etkinliği olarak görür.',
    'Akıl Yürütme ve Argümantasyon (Tümdengelim, Tümevarım, Analoji)':
        'Tümdengelim genelden özele, Tümevarım özelden genele akıl yürütmedir. Analoji ise iki benzer şeyden birinde olanı diğerine aktarmaktır.',
    'Sokrates ve Sofistler: İnsan ve Ahlak Felsefesi':
        'Sofistler (Protagoras, Gorgias) bilginin göreceli (rölativist) olduğunu savunur; Sokrates ise bilginin doğuştan geldiğini (Maiotik/doğurtma) savunur.',
    'Platon: İdealar Kuramı, Mağara Alegorisi ve İdeal Devlet':
        'Platon\'a göre asıl gerçeklik akılla kavranan "İdealar Dünyası"dır; içinde yaşadığımız duyular dünyası ise mağaradaki gölgelerden ibarettir.',
    'Aristoteles: Varlık, Madde-Form Kuramı ve Altın Orta Erdemi':
        'Madde potansiyeldir, form onu aktifleştiren özdür. Ahlakta ise her türlü aşırılıktan kaçınarak "Altın Orta"yı (dengeli ölçülülük) bulmak esastır.',
    'Kartezyen Felsefe ve Metodik Şüphe (René Descartes)':
        'Descartes doğru bilgiye ulaşmak için şüpheyi bir araç olarak kullanır: "Şüphe ediyorsam düşünüyorum, düşünüyorsam varım (Cogito ergo sum)".',
    'Rönesans Düşüncesi, Hümanizm ve Bilimsel Yöntem (Bacon, Machiavelli)':
        'Hümanizm insanı ve bu dünyayı merkeze alır. Francis Bacon doğaya egemen olmak için deney ve tümevarımı savunur ("Bilgi güçtür").',
    'Immanuel Kant: Kritisizm (Eleştirel Felsefe) ve Ödev Ahlakı':
        '"Görüsüz kavramlar boş, kavramsız görüler kördür." Bilgi duyularla başlar akılla biçimlenir. Ahlakta "Öyle davran ki eyleminin ilkesi evrensel yasa olsun" der.',
    'G.W.F. Hegel: Diyalektik İdealizm ve Mutlak Ruh (Geist)':
        'Evren zihinsel/ruhsal bir ilkenin (Geist) kendini açmasıdır. Gelişim diyalektik üç adımla ilerler: Tez → Antitez → Sentez.',
    'Felsefenin Anlamı, Özellikleri ve Düşünmenin Önemi':
        'Felsefe kümülatiftir (yığılır ama bilim gibi kesin ilerlemez), subjektiftir, refleksiftir (kendi üzerine düşünür) ve soruları cevaplarından önemlidir.',

    # --- FİZİK ---
    'Newton’ın Hareket Yasaları (Eylemsizlik, Temel Yasa, Etki-Tepki)':
        '1. Yasa: Eylemsizlik (Net kuvvet sıfırsa durur veya sabit hızla gider). 2. Yasa: F = m·a (Kuvvet ivme üretir). 3. Yasa: Etki-Tepki (Kuvvetler eşit büyüklükte ve zıt yönlüdür).',
    'İş, Güç ve Enerji Kavramı':
        'İş = Kuvvet × Yol (W = F·x). Güç = İş / Zaman (P = W/t). Kinetik enerji E_k = 1/2·m·v²; Potansiyel enerji E_p = m·g·h. Sürtünmesiz ortamda mekanik enerji korunur.',
    'Durgun Sıvı Basıncı ve Pascal Prensibi':
        'Sıvı basıncı P = h·d·g (derinlik × yoğunluk × yerçekimi). Sıvılar üzerlerine uygulanan basıncı her doğrultuda aynen iletir (Pascal prensibi / hidrolik frenler).',
    'Açık Hava ve Gaz Basıncı (Torricelli Deneyi)':
        'Deniz seviyesinde 0°C’de açık hava basıncı 76 cm-Hg cıva sütununa eşittir (1 atm). Yükseklere çıkıldıkça açık hava basıncı azalır.',
    'Kaldırma Kuvveti ve Arşimet Prensibi':
        'F_k = V_batan · d_sıvı · g. Yüzen ve askıda kalan cisimlerde kaldırma kuvveti cismin ağırlığına eşittir (F_k = G). Batan cisimde G > F_k olur.',
    'Elektrik Devreleri, Ohm Yasası ve Dirençlerin Bağlanması':
        'Ohm Yasası: V = I·R. Seri bağlı dirençlerde akımlar eşittir, dirençler toplanır (R_eş = R1+R2). Paralel bağlı dirençlerde gerilimler eşittir (1/R_eş = 1/R1 + 1/R2).',
    'Isı, Sıcaklık ve İç Enerji Kavramları':
        'Sıcaklık termometreyle ölçülen ortalama kinetik enerjinin göstergesidir (skalerdir); ısı ise sıcaklık farkından dolayı aktarılan enerjidir (kalorimetreyle ölçülür).',
    'Hal Değişimi ve Isıl Denge (Q = m·c·Δt)':
        'Sıcaklık değişimi varken Q = m·c·ΔT formülü; hal değişimi varken sıcaklık sabit kalır ve Q = m·L formülü uygulanır.',
    'Elektrostatik: Elektrik Yükleri ve Coulomb Kuvveti':
        'Aynı cins yükler birbirini iter, zıt cinsler çeker. Yükler temasla paylaşılır (toplam yük korunur). Etki ile elektriklenmede zıt yükler kutuplanır.',
    'Dalgaların Temel Değişkenleri (Periyot, Frekans, Hız, Dalga Boyu)':
        'Hız = Dalga boyu × Frekans (v = λ·f). Frekans sadece kaynağa bağlıdır; dalga hızı ise sadece yayıldığı ortama (derinlik, gerginlik, yoğunluk) bağlıdır.',
    'Düzlem Aynada Görüntü Oluşumu ve Özellikleri':
        'Düzlem aynada görüntü sanaldır (aynaya arkasında), düzdür, cisimle aynı boydadır ve simetriktir (aynaya uzaklığı cismin uzaklığına eşittir).',
    'Işığın Kırılması ve Snell Yasası':
        'Işık az yoğun ortamdan çok yoğun ortama geçerken normale yaklaşarak kırılır ve hızı azalır; çok yoğundan az yoğuna geçerken normalden uzaklaşır.',
    'Kuvvet, Sürtünme Kuvveti ve Dengelenmiş Kuvvetler':
        'Statik sürtünme cisim harekete geçene kadar uygulanan kuvvete eşittir. Kinetik sürtünme f_s = k·N formülüyle hesaplanır ve hareketi zorlaştırıcı yöndedir.',
    'Madde ve Özkütle (Yoğunluk: d = m/V)':
        'Özkütle d = m / V (Kütle / Hacim). Sabit sıcaklık ve basınçta saf maddeler için ayırt edici özelliktir.',
    'Ses Dalgaları ve Özellikleri (Tını, Şiddet, Rezonans)':
        'Ses mekanik bir dalgadır (boşlukta yayılmaz). Sesin frekansı yüksekse ince (tiz), düşükse kalın (pes) algılanır. Tını ise enstrümanın ses rengidir.',

    # --- KİMYA ---
    'Atomun Yapısı ve Temel Tanecikler (İzotop, İzoton, İzobar)':
        'İzotop: Protonları aynı nötronları farklı. İzoton: Nötronları aynı protonları farklı. İzobar: Kütle numaraları aynı protonları farklı. İzoelektronik: Elektron sayı ve dizilimleri aynı.',
    'Periyodik Sistem ve Elementlerin Yerinin Belirlenmesi':
        'Katman sayısı = Periyot numarasını; son katmandaki değerlik elektron sayısı = A grubu numarasını verir (2-8-8 kuralı).',
    'Periyodik Özelliklerin Değişimi (Yarıçap, İyonlaşma Enerjisi)':
        'Aynı periyotta soldan sağa: Atom yarıçapı küçülür, iyonlaşma enerjisi ve elektronegatiflik artar. Aynı grupta yukarıdan aşağıya: Çap büyür, iyonlaşma enerjisi azalır.',
    'İyonik Bağ ve İyonik Bileşiklerin Adlandırılması':
        'Metal + Ametal arasında elektron alışverişiyle kurulur. Katı halde elektriği iletmez; sıvı ve sulu çözelti halinde serbest iyonlarla iletir.',
    'Kovalent Bağ ve Moleküllerin Polarlığı':
        'Ametaller arasında elektron ortaklaşmasıyla kurulur. Aynı ametaller apolar kovalent (H-H, O=O), farklı ametaller polar kovalent (H-Cl) bağ oluşturur.',
    'Zayıf Etkileşimler (Hidrojen Bağı ve Van der Waals)':
        'F, O, N atomlarına doğrudan bağlı H atomu varsa "Hidrojen Bağı" oluşur (en güçlü zayıf etkileşimdir, kaynama noktasını ciddi oranda yükseltir).',
    'Asit ve Bazların Genel Özellikleri, İndikatörler ve pH Kavramı':
        'Asitler suya H+ verir, pH < 7, turnusolu kırmızıya çevirir. Bazlar suya OH- verir, pH > 7, turnusolu maviye boyar, ele kayganlık hissi verir.',
    'Asit-Baz Tepkimeleri (Nötralleşme)':
        'Asit + Baz → Tuz + Su (Nötralleşme). Net iyon denklemi suyun oluşumudur: H+(suda) + OH-(suda) → H2O(s).',
    'Homojen ve Heterojen Karışımlar (Süspansiyon, Emülsiyon, Kolloid)':
        'Homojen karışım tek fazlı çözeltidir (tuzlu su). Heterojen: Süspansiyon (katı-sıvı: ayran), Emülsiyon (sıvı-sıvı: zeytinyağı-su), Aerosol (sis, duman).',
    'Karışımları Ayırma Teknikleri (Damıtma, Süzme, Ayırma Hunisi)':
        'Ayırma hunisi: Yoğunluk farkıyla heterojen sıvı-sıvı (su-zeytinyağı). Basit damıtma: Kaynama noktası farkıyla katı-sıvı. Ayrımsal damıtma: homojen sıvı-sıvı (alkol-su).',
    'Mol Kavramı ve Avogadro Sayısı':
        '1 mol = 6,02×10²³ tanedir (Avogadro sayısı). Mol sayısı n = m / M_A (kütle / mol kütlesi). Normal koşullarda (0°C, 1 atm) 1 mol gaz 22,4 litre hacim kaplar.',
    'Kimyanın Temel Kanunları (Kütlenin Korunumu, Sabit ve Katlı Oranlar)':
        'Kütlenin Korunumu (Lavoisier), Sabit Oranlar (Proust), Katlı Oranlar (Dalton). Aynı elementlerden oluşan iki farklı bileşikte katlı oran aranır (CO ve CO2).',
    'Maddelerin Sembolik Dili (Element ve Bileşikler)':
        'Elementler tek tür atomdan oluşur ve sembollerle gösterilir (Fe, Na, O2). Bileşikler farklı tür atomların belirli oranda birleşmesidir ve formülle gösterilir (H2O, NaCl).',
    'Yaygın Tuzlar ve Kullanım Alanları (NaCl, CaCO₃, NaHCO₃, NH₄Cl)':
        'NaCl (sofra tuzu), CaCO3 (kireç taşı), NaHCO3 (yemek sodası/kabartma tozu), Na2CO3 (çamaşır sodası), NH4Cl (nişadır).',
    'Temizlik Maddeleri (Sabun, Deterjan, Çamaşır Suyu)':
        'Sabun bitkisel/hayvansal yağlardan üretilir, çevreye zararsızdır (sert sularda çöker). Deterjan petrol türevidir, sert sularda da köpürür ama çevreyi kirletir.',

    # --- BİYOLOJİ ---
    'Canlıların Temel Bileşenleri (Karbonhidrat, Yağ, Protein, Enzimler)':
        'Hücrede ilk harcanan karbonhidrat, en çok enerji veren yağ, yapıya en çok katılan proteindir. Enzimler aktivasyon enerjisini düşürerek tepkimeyi hızlandırır.',
    'Hücre Zarından Madde Geçişleri (Difüzyon, Osmoz, Aktif Taşıma)':
        'Pasif taşıma (Difüzyon, Osmoz): Çok yoğundan aza, ATP harcanmaz. Aktif taşıma: Az yoğundan çoğa, canlılık şarttır ve ATP harcanır. Büyük moleküller endositoz/ekzositozla taşınır.',
    'Hücre Organelleri ve Görevleri':
        'Mitokondri (ATP üretimi / solunum), Ribozom (protein sentezi / zarsız), Kloroplast (fotosentez), Lizozom (hücre içi sindirim), Golgi (salgı ve paketleme).',
    'Hücre Bölünmeleri: Mitoz Bölünme ve Eşeysiz Üreme':
        'Mitozda kromozom sayısı ve genetik yapı değişmez (2n → 2n iki yeni hücre). Büyüme, gelişme ve onarımı sağlar; çeşitlilik oluşturmaz.',
    'Hücre Bölünmeleri: Mayoz Bölünme ve Eşeyli Üreme':
        'Mayozda kromozom sayısı yarıya iner (2n → n dört yeni hücre). Krossing-over ve homolog kromozomların rastgele ayrılması genetik çeşitliliği sağlar.',
    'Kalıtımın Genel Esasları ve Mendel Genetiği':
        'Baskın (dominant: A) fenotipte etkisini daima gösterir; çekinik (resesif: a) sadece homozigot (aa) durumda gösterir. Monohibrit çaprazlamada (Aa x Aa) oran 3:1\'dir.',
    'Ekoloji: Besin Zinciri, Ekolojik Piramitler ve Biyolojik Birikim':
        'Besin piramidinde üreticiden son tüketiciye doğru: Biyokütle azalır, aktarılan enerji azalır (%10 kuralı), zehirli madde birikimi (biyolojik birikim) ARTAR.',
    'Canlı Alemleri: Bakteriler ve Arkeler':
        'Bakteriler ve arkeler prokaryottur (çekirdek ve zarlı organel yoktur, ribozom vardır). Arkeler ekstrem koşullarda (aşırı tuz, sıcaklık, asit) yaşayabilir.',
    'Canlı Alemleri: Hayvanlar (Omurgasız ve Omurgalılar)':
        'Omurgalılar (Balık, İkiyaşamlı, Sürüngen, Kuş, Memeli) kapalı dolaşıma sahiptir. Memelilerin ayırt edici özellikleri: Süt bezi, kıl, kaslı diyafram, olgun alyuvarların çekirdeksiz olması.',
    'Canlı Alemleri: Bitkiler':
        'Bitkiler fotosentetik ototroftur, hücre çeperi selülozdan oluşur, depo polisakkariti nişastadır. Damarsız tohumsuz (karayosunu) → Damarlı tohumsuz (eğrelti) → Tohumlu bitkiler.',
    'Nükleik Asitler (DNA, RNA) ve Protein Sentezi':
        'DNA çift zincirlidir, kendini eşler (Replikasyon), şekeri deoksiriboz, bazı timindir. RNA tek zincirlidir, protein sentezinde görev alır, şekeri riboz, bazı urasildir.',
    'Solunum: Hücresel Solunum ve Fermantasyon':
        'Glikoliz tüm canlılarda sitoplazmada ortak gerçekleşir. Oksijenli solunum mitokondride gerçekleşir ve fermantasyondan (laktik asit, etil alkol) çok daha fazla ATP üretir.',

    # --- TARİH VE T.C. İNKILAP TARİHİ ---
    'Genelgeler ve Kongreler Dönemi (Amasya, Erzurum, Sivas)':
        'Amasya Genelgesi: Kurtuluş Savaşı\'nın amacı, gerekçesi ve yöntemi ilk kez belirtildi. Erzurum Kongresi: Manda ve himaye ilk kez reddedildi. Sivas: Tüm cemiyetler birleştirildi.',
    'Atatürk İlkeleri ve Bütünleyici İlkeler':
        'Cumhuriyetçilik (milli egemenlik, seçim), Milliyetçilik (milli kültür, bağımsızlık), Halkçılık (eşitlik, ayrıcalıksızlık), Devletçilik (ekonomi, kamu yatırımı), Laiklik (akıl/bilim, din-devlet ayrımı), İnkılapçılık (çağdaşlaşma).',
    'Lozan Barış Antlaşması ve Diplomatik Zafer':
        'Kapitülasyonlar kesin olarak kaldırıldı, Ermeni yurdu talebi reddedildi, yabancı okullar Türk kanunlarına bağlandı. Boğazlar için komisyon kurulması tam egemenliğe kısıtlama getirmişti (Montrö ile çözüldü).',
    'Batı Cephesi Muharebeleri (İnönü Savaşları ve Kütahya-Eskişehir)':
        'I. ve II. İnönü savunma zaferleridir. Kütahya-Eskişehir tek yenilgidir, ordu Sakarya\'nın doğusuna çekilmiştir. Ardından Tekalif-i Milliye emirleri yayımlanmıştır.',
    'Sakarya Meydan Muharebesi, Büyük Taarruz ve Mudanya Ateşkesi':
        'Sakarya "Hattı müdafaa yoktur sathı müdafaa vardır" emriyle savunmadan taarruza geçiş dönüm noktasıdır; Mustafa Kemal\'e Mareşallik ve Gazilik unvanı verilmiştir.',
    'Doğu ve Güney Cepheleri (Gümrü ve Ankara Antlaşmaları)':
        'Doğu Cephesi (Kazım Karabekir) Gümrü Antlaşması ile kapandı (TBMM\'yi tanıyan ilk devlet Ermenistan). Güney Cephesi Fransızlarla yapılan Ankara Antlaşması ile kapandı.',
    'I. TBMM’nin Açılışı, Özellikleri ve Ayaklanmalar':
        'I. TBMM kurucu, ihtilalci, milli ve olağanüstü yetkilere sahip bir meclistir. Güçler birliği (yasama + yürütme) ve meclis hükümeti sistemi benimsenmiştir.',
    'Türk Dış Politikası (Montrö, Sadabat Paktı, Balkan Antantı, Hatay)':
        'Montrö ile Boğazlar Komisyonu kaldırılarak tam Türk egemenliği sağlandı. Hatay 1939\'da anavatana katıldı. Balkan Antantı batı sınırını, Sadabat Paktı doğu sınırını güvenceye aldı.',
    'Siyasal Alanda İnkılaplar (Cumhuriyetin İlanı, Halifeliğin Kaldırılması)':
        'Saltanatın kaldırılması (1922) laiklik yolunda ilk adımdır. Halifeliğin kaldırılması (3 Mart 1924) ile Tevhid-i Tedrisat Kanunu kabul edilmiş, Şeriye ve Evkaf Vekaleti kaldırılmıştır.',
    'İlk Türk Devletleri ve Teşkilatı':
        'Kut inancı (hükümdarlığın ilahi bağış olması), ikili teşkilat (doğu-batı yönetimi), kurultay (danışma meclisi) ve töre (yazısız hukuk kuralları) devletin temel sacayaklarıdır.',
    'Türklerin İslamiyeti Kabulü, Karahanlılar ve Gazneliler':
        'Talas Savaşı (751) dönüm noktasıdır. Karahanlılar Orta Asya\'da kurulan ilk Müslüman Türk devletidir ve Türkçeyi resmi dil ilan ederek milli kimliğini korumuştur.',
    'Türkiye Selçuklu Devleti ve Haçlı Seferleri':
        'Miryokefalon Savaşı (1176) ile Anadolu\'nun kesin Türk yurdu olduğu tescillenmiştir. Kösedağ Savaşı (1243) ile Moğol hakimiyetine girilmiş ve beylikler dönemi başlamıştır.',
    'Osmanlı Askerî Teşkilatı (Tımar ve Kapıkulu Ocakları)':
        'Tımar sistemi devlete masrafsız eyalet askeri (Tımarlı Sipahi) yetiştirir ve tarımsal sürekliliği sağlar. Kapıkulu (Yeniçeriler) ise merkezde maaşlı (ulufe) profesyonel piyadelerdir.',
    'Tanzimat ve Islahat Fermanları Dönemi':
        'Tanzimat Fermanı (1839) ile padişah ilk kez kendi gücünün üstünde kanun gücü olduğunu kabul etti. Islahat Fermanı (1856) özellikle gayrimüslimlere geniş haklar tanıdı.',
    'I. ve II. Meşrutiyet Dönemi ve Kanun-i Esasi':
        'Kanun-i Esasi (1876) Türk tarihinin ilk anayasasıdır. Meşrutiyetle halk ilk kez padişahın yanında yönetime katılmış ve parlamento kurulmuştur.'
}

def get_smart_stem_hint(q):
    """
    Soru kökü ve şıkları semantik olarak analiz ederek en nokta atışı ipucunu üretir.
    Cevabı doğrudan ifşa etmez; sorunun can alıcı çözüm metodunu açıklar.
    """
    stem = q.get('soru', '') or q.get('soru_temiz', '')
    stem_norm = stem.lower()
    
    opts = q.get('secenekler', {}) or q.get('secenekler_temiz', {})
    if isinstance(opts, dict):
        opts_norm = ' '.join(str(v) for v in opts.values()).lower()
    else:
        opts_norm = ''
    full_text = stem_norm + ' ' + opts_norm
    
    ders = (q.get('ders', '') or '').upper()

    # =========================================================================
    # 1. TÜRK DİLİ VE EDEBİYATI
    # =========================================================================
    if 'TÜRK DİLİ' in ders or 'EDEBİYAT' in ders:
        # Hangi sorunun cevabıdır?
        if 'hangi sorunun cevabıdır' in stem_norm or 'hangisinin cevabıdır' in stem_norm or 'sorulardan hangisine karşılık' in stem_norm:
            return 'Parçanın bütününde yazarın hangi temel soruya yanıt verdiğine dikkat edin. İlk cümleye ve metinde sıkça tekrarlanan ana temaya (farklı kitlelere/yaş gruplarına hitap etme) odaklanın.'

        # İlk hikaye
        if 'ilk hikâye' in stem_norm or 'ilk hikaye' in stem_norm or ('hikâye örneği' in stem_norm and 'ilk' in stem_norm):
            return 'Türk edebiyatında ilk yerli hikâye Ahmet Mithat Efendi\'nin Letaif-i Rivayat\'ı; Batılı ve teknik anlamda ilk hikâye ise Samipaşazade Sezai\'nin Küçük Şeyler adlı eseridir.'

        # İlk roman
        if 'ilk roman' in stem_norm or ('roman' in stem_norm and ('ilk yerli' in stem_norm or 'ilk edebi' in stem_norm or 'ilk tarihi' in stem_norm)):
            return 'İlk yerli roman Şemsettin Sami\'nin Taaşşuk-ı Talat ve Fitnat\'ı; ilk edebi roman Namık Kemal\'in İntibah\'ı; ilk tarihi roman Cezmi; ilk köy romanı Karabibik; ilk realist roman Araba Sevdası\'dır.'

        # İlk tiyatro
        if 'ilk tiyatro' in stem_norm or 'şair evlenmesi' in full_text or 'vatan yahut silistre' in full_text:
            return 'Batılı anlamda yazılan ilk tiyatro Şinasi\'nin Şair Evlenmesi; sahnelenen ilk tiyatro ise Namık Kemal\'in Vatan yahut Silistre adlı eseridir.'

        # İlk gazete
        if 'ilk gazete' in stem_norm or 'tercüman-ı ahval' in full_text or 'ceride-i havadis' in full_text:
            return 'İlk resmî gazete Takvim-i Vekayi, ilk yarı resmî Ceride-i Havadis, ilk özel Türk gazetesi ise Şinasi ve Agâh Efendi\'nin çıkardığı Tercüman-ı Ahval\'dir (1860).'

        # Şiirde takma ad / mahlas / tapşırma
        if 'takma ad' in stem_norm or 'mahlas' in stem_norm or 'tapşırma' in stem_norm:
            return 'Divan edebiyatında şairlerin kullandığı takma ada "mahlas", Halk edebiyatında ise âşıkların son dörtlükte adlarını belirtmesine "tapşırma" denir.'

        # Masalın bölümleri ve özellikleri
        if 'masal' in stem_norm and ('bölüm' in stem_norm or 'öğe' in stem_norm or 'unsur' in stem_norm or 'değildir' in stem_norm):
            return 'Masalın bölümleri: 1. Döşeme (tekerlemelerle başlar), 2. Serim (kahramanlar tanıtılır), 3. Düğüm (olaylar gelişir), 4. Çözüm, 5. Dilek (iyiler kazanır). Masallarda yer ve zaman daima belirsizdir.'

        # Olay Hikâyesi vs Durum Hikâyesi
        if 'olay hikâyesi' in full_text or 'durum hikâyesi' in full_text or 'maupassant' in full_text or 'çehov' in full_text or ('kesit' in stem_norm and 'hikâye' in full_text):
            return 'Olay hikâyesinde (Maupassant / Ömer Seyfettin) serim-düğüm-çözüm planı ve merak ögesi esastır. Durum hikâyesinde (Çehov / Sait Faik) günlük hayattan bir kesit anlatılır, merak unsuru zayıftır.'

        # Şiir türleri (lirik, epik, didaktik, pastoral, satirik)
        if 'didaktik' in full_text or 'lirik' in full_text or 'pastoral' in full_text or 'satirik' in full_text or 'epik' in full_text:
            return 'Duygu ve aşk = Lirik; Savaş ve kahramanlık = Epik; Ahlak ve öğreticilik = Didaktik; Doğa ve çoban yaşamı = Pastoral; Eleştiri ve taşlama = Satirik şiirdir.'

        # Kafiye ve Redif
        if 'kafiye' in full_text or 'uyak' in full_text or 'redif' in full_text:
            return 'Önce dize sonundaki aynı görevli ekleri/kelimeleri (redif) ayırın. Kalan kökteki ses benzerliğine bakın: 1 ses = Yarım, 2 ses = Tam, 3+ ses = Zengin, eş sesli kelimeler = Cinaslı kafiye.'

        # Hece Ölçüsü ve Duraklar
        if 'hece ölçüsü' in full_text or 'ölçü' in stem_norm or 'durak' in full_text:
            return 'Hece ölçüsünde dizelerdeki ünlü (sesli) harfler sayılarak kalıp bulunur (7\'li, 8\'li ve 11\'li kalıplar yaygındır). Duraklar kelime ortasından bölünemez.'

        # Söz Sanatları
        if 'teşbih' in full_text or 'istiare' in full_text or 'teşhis' in full_text or 'intak' in full_text or 'mecazımürsel' in full_text or 'telmih' in full_text:
            return 'Benzetme = Teşbih; Eğretileme = İstiare (açık istiarede sadece benzetilen, kapalıda benzeyen vardır); Kişileştirme = Teşhis; Cansız/hayvan konuşturma = İntak; Zıtlık = Tezat; Uygunluk = Tenasüp.'

        # Yazım Kuralları
        if 'yazım yanlışı' in stem_norm or 'yazımı yanlıştır' in stem_norm or 'yazımı doğrudur' in stem_norm:
            return '"-de" bağlacı daima ayrı yazılır ve cümleden çıkarılınca anlam bozulmaz. "-ki" için "-ler" testi uygulanır (evdekiler: bitişik). Kurum/kuruluş adlarına gelen ekler kesmeyle ayrılmaz.'

        # Noktalama İşaretleri
        if 'noktalama' in stem_norm or 'yay ayraç' in stem_norm or 'noktalı virgül' in stem_norm or 'iki nokta' in stem_norm:
            return 'Açıklama veya alıntıdan önce iki nokta (:), ögeleri arasında virgül bulunan cümleleri ayırmada noktalı virgül (;), tamamlanmış cümle sonunda nokta (.), duygu/seslenmede ünlem (!) kullanılır.'

        # Sıfatlar (Niteleme / Belirtme)
        if 'niteleme sıfatı' in stem_norm or 'belirtme sıfatı' in stem_norm or ('sıfat' in stem_norm and 'altı çizili' in stem_norm):
            return 'İsme sorulan "Nasıl?" sorusunun cevabı Niteleme sıfatıdır (renk, durum, biçim). İşaret (bu, şu), sayı, belgisiz (birkaç, bazı) ve soru sözcükleri ise Belirtme sıfatıdır.'

        # Zamirler (Adıllar)
        if 'zamir' in stem_norm or 'adıl' in stem_norm or 'kişi zamiri' in full_text or 'işaret zamiri' in full_text:
            return 'İsmin yerini tutan sözcüklerdir: ben, sen, o (Kişi); bu, şu, o (İşaret); biri, hepsi, bazıları (Belgisiz); kendi (Dönüşlülük); kim, ne (Soru zamiri).'

        # Zarflar (Belirteçler)
        if 'zarf' in stem_norm or 'belirteç' in stem_norm or 'durum zarfı' in full_text or 'zaman zarfı' in full_text:
            return 'Fiile veya fiilimsiye sorulan "Nasıl?" Durum zarfını, "Ne zaman?" Zaman zarfını, "Ne kadar?" Miktar zarfını, "Nereye?" (ek almadan: içeri, yukarı) Yer-yön zarfını verir.'

        # Sözcük Türleri / Görevleri (Edat, Bağlaç, İsim, Sıfat, Zarf)
        if 'hangi görevde' in stem_norm or ('görev' in stem_norm and 'sözcük' in stem_norm) or ('bağlaç' in opts_norm and 'edat' in opts_norm) or 'edat' in stem_norm or 'bağlaç' in stem_norm:
            return 'Cümleleri veya eş görevli sözcükleri bağlayan "ve, de, ki, ama, fakat, lakin, çünkü" Bağlaçtır. Tek başına anlamı olmayan "gibi, için, kadar, göre, doğru" Edattır. İsmi niteleyen/belirten Sıfattır.'

        # İsim Türleri
        if 'basit isim' in full_text or 'topluluk ismi' in full_text or 'türemiş isim' in full_text or 'birleşik isim' in full_text:
            return 'İsim türlerine dikkat edin: Yapım eki almamış = Basit, yapım eki almış = Türemiş, iki kelime = Birleşik, çoğul eki almadığı halde çokluk bildiren (sürü, ordu, orman) = Topluluk ismidir.'

        # Cümlenin Ögeleri
        if 'cümlenin ögeleri' in stem_norm or 'yüklem' in stem_norm or 'özne' in stem_norm or 'nesne' in stem_norm:
            return 'Önce Yüklem bulunur, sonra "Yapan kim? / Olan ne?" ile Özne bulunur. Yükleme sorulan "Neyi, kimi?" Belirtili Nesne; "-e, -de, -den" ekli sorular Dolaylı Tümleç; "nasıl, ne zaman?" Zarf Tümlecidir.'

        # Fiilimsiler
        if 'fiilimsi' in stem_norm or 'eylemsi' in stem_norm or 'sıfat-fiil' in full_text or 'zarf-fiil' in full_text or 'isim-fiil' in full_text:
            return 'İsim-fiil (-ma, -ış, -mak), Sıfat-fiil (-an, -ası, -mez, -ar, -dik, -ecek, -miş), Zarf-fiil (-ken, -alı, -madan, -ince, -ip, -erek, -dıkça, -r...-mez).'

        # Cümle Türleri
        if 'cümle türü' in stem_norm or 'biçimce' in stem_norm or 'anlamca olumsuz' in full_text or 'sıralı cümle' in full_text or 'birleşik cümle' in full_text:
            return 'İçinde fiilimsi olan cümle Girişik Birleşik; virgülle bağlanan bağımsız yüklemler Sıralı; bağlaçla bağlananlar Bağlı; tek yüklemli olanlar Basit cümledir.'

        # Paragrafta Ana Düşünce
        if 'asıl anlatılmak istenen' in stem_norm or 'ana düşünce' in stem_norm or 'ana fikir' in stem_norm or 'vurgulanmak istenen' in stem_norm:
            return 'Paragrafın ilk ve özellikle son cümlelerine odaklanın; yazarın okuyucuya aktarmak istediği temel mesaj veya hayat dersi ana düşüncedir.'

        # Paragrafta Yardımcı Düşünceler
        if 'çıkarılamaz' in stem_norm or 'değinilmemiştir' in stem_norm or 'ulaşılamaz' in stem_norm or 'hangisi yoktur' in stem_norm:
            return 'Önce seçenekleri hızlıca okuyup anahtar kelimeleri zihninizde tutun, ardından paragrafı tarayarak metinde birebir geçen şıkları teker teker eleyiniz.'

        # Anlatım Biçimleri
        if 'anlatım biçimi' in stem_norm or 'öyküleme' in full_text or 'betimleme' in full_text or 'tartışma' in full_text or 'açıklama' in full_text:
            return 'Bilgi verme = Açıklama; Okuyucunun fikrini değiştirme/çürütme = Tartışma; Olay akışı ve hareket = Öyküleme; Sözcüklerle resim çizme = Betimleme.'

    # =========================================================================
    # 2. MATEMATİK
    # =========================================================================
    elif 'MATEMATİK' in ders:
        # Mantık ve Önermeler
        if 'önerme' in full_text or 'p ∧' in full_text or 'p ∨' in full_text or 'p ⇒' in full_text or 'totoloji' in full_text or 'p l' in full_text:
            return 'p ⇒ q önermesi sadece 1 ⇒ 0 ≡ 0 iken yanlıştır (100 kuralı). "ve" (∧) işleminde her iki önerme 1 ise sonuç 1; "veya" (∨) işleminde her iki önerme 0 ise sonuç 0\'dır.'

        # Yüzde Problemleri
        if '%' in full_text or 'yüzde' in full_text:
            return 'Yüzde problemlerinde bilinmeyene 100 veya 100x demek işlemi hızlandırır. "Kalanın" ifadesi varsa önce harcananı çıkarıp kalan üzerinden yeni yüzdeyi hesaplayınız.'

        # Yaş Problemleri
        if 'yaşları' in full_text or 'yaşında' in full_text or 'yaş problemi' in full_text:
            return 'Yaş problemlerinde: Aradan geçen yıllarda herkesin yaşı aynı miktarda artar. İki kişinin yaşları farkı yıllar geçse de ASLA değişmez.'

        # Hız ve Hareket Problemleri
        if 'km/s' in full_text or 'hızla' in full_text or 'ortalama hız' in full_text:
            return 'Yol = Hız · Zaman (x = v · t). Karşılıklı hareket eden araçların hızları toplanır (x = (v₁ + v₂)·t); aynı yönde gidenlerin hızları çıkarılır.'

        # İşçi / Havuz Problemleri
        if 'işçi' in full_text or 'havuz' in full_text or 'musluk' in full_text:
            return 'Bir işi tek başına a günde bitiren işçi 1 günde 1/a\'sını yapar. İkisi birlikte t günde: (1/a + 1/b) · t = 1 denkleminden çözülür.'

        # Logaritma
        if 'log' in stem_norm or 'logaritma' in stem_norm:
            return 'log_a(b) = c ⇔ a^c = b. log(x·y) = log(x) + log(y), log(x/y) = log(x) - log(y), log_a(x^n) = n·log_a(x). Taban ve argüman daima pozitif olmalıdır (x > 0, a > 0, a ≠ 1).'

        # Trigonometri
        if 'sin' in stem_norm or 'cos' in stem_norm or 'tan' in stem_norm or 'trigonometri' in stem_norm:
            return 'sin²x + cos²x = 1, tan(x) = sin(x)/cos(x), cot(x) = cos(x)/sin(x). Dik üçgende: sin = Karşı/Hipotenüs, cos = Komşu/Hipotenüs, tan = Karşı/Komşu. Açının bulunduğu bölgedeki işaretine dikkat edin.'

        # İkinci Dereceden Denklem / Parabol
        if 'ikinci derece' in full_text or 'kökler toplamı' in full_text or 'parabol' in full_text or 'tepe noktası' in full_text or 'denkleminin kök' in full_text:
            return 'ax² + bx + c = 0 için Δ = b² - 4ac. Kökler toplamı x₁ + x₂ = -b/a, kökler çarpımı x₁·x₂ = c/a. Parabolün tepe noktası T(r, k): r = -b/(2a), k = f(r).'

        # Mutlak Değer
        if 'mutlak değer' in full_text or '|x' in stem_norm or '|a' in stem_norm:
            return '|x - a| = b (b ≥ 0) ise x - a = b veya x - a = -b olur. |x| < b ise -b < x < b eşitsizliği; |x| > b ise x > b veya x < -b eşitsizliği çözülür.'

        # Kümeler
        if 'küme' in full_text or 'alt küme' in full_text or 'kesişim' in full_text or 'birleşim' in full_text:
            return 's(A ∪ B) = s(A) + s(B) - s(A ∩ B). n elemanlı kümenin alt küme sayısı 2^n, kendisi hariç öz alt küme sayısı 2^n - 1\'dir.'

        # Bölünebilme Kuralları
        if 'bölünebilme' in full_text or 'bölümünden kalan' in full_text or 'tam bölün' in full_text:
            return '3 ve 9 için rakamlar toplamı; 4 için son iki basamak; 5 için son basamak (0 veya 5); 11 için sağdan sola +-+- kuralı uygulanır.'

        # EBOB - EKOK
        if 'ebob' in full_text or 'ekok' in full_text:
            return 'a · b = EBOB(a, b) · EKOK(a, b). Parçalama/paylaştırma sorularında EBOB, nöbet/zaman/katlanma sorularında EKOK kullanılır.'

        # Fonksiyonlar
        if 'f(' in stem_norm or 'fonksiyon' in full_text:
            return 'f(a) sorulduğunda fonksiyonda x yerine a yazılır. Birim fonksiyon f(x) = x, sabit fonksiyon f(x) = c, ters fonksiyon y = f(x) ⇔ x = f⁻¹(y) ile bulunur.'

        # Üslü Sayılar
        if 'üslü' in full_text or '^' in stem_norm or 'kuvveti' in stem_norm:
            return 'Tabanlar aynıysa çarpımda üsler toplanır: a^x · a^y = a^(x+y). Bölümde üsler çıkarılır: a^x / a^y = a^(x-y). Üssün üssü çarpılır: (a^x)^y = a^(x·y).'

        # Köklü Sayılar
        if 'köklü' in full_text or 'karekök' in full_text or '√' in stem_norm:
            return 'Kök derecesi aynı ise çarpma/bölme tek kök içinde yapılabilir. √a² = |a|\'dır. Paydadaki kökü yok etmek için kesir eşlenikle genişletilir.'

        # Olasılık & Permütasyon / Kombinasyon
        if 'olasılık' in full_text or 'olasılığı' in full_text or 'kombinasyon' in full_text or 'permütasyon' in full_text:
            return 'Olasılık = (İstenen Durum Sayısı) / (Tüm Olası Durumların Sayısı). Sıralama Permütasyon P(n,r), grup seçimi Kombinasyon C(n,r) ile hesaplanır.'

        # Geometri: Üçgenler ve Açılar
        if 'üçgen' in full_text or 'açı' in full_text or 'pisagor' in full_text or 'hipotenüs' in full_text:
            return 'Üçgenin iç açıları toplamı 180°, dış açıları 360°\'dir. Dik üçgende Pisagor: a² + b² = c² (özel üçgenler: 3-4-5, 5-12-13, 8-15-17). Alan = (taban · yükseklik) / 2.'

        # Çember ve Daire
        if 'çember' in full_text or 'daire' in full_text or 'yarıçap' in full_text:
            return 'Çemberin çevresi = 2πr, Dairenin alanı = πr². Merkez açı gördüğü yayın ölçüsüne eşittir; çevre açı gördüğü yayın yarısına eşittir.'

    # =========================================================================
    # 3. COĞRAFYA
    # =========================================================================
    elif 'COĞRAFYA' in ders:
        if 'fiziki coğrafya' in full_text or 'beşerî coğrafya' in full_text:
            return 'Fiziki coğrafya: Jeomorfoloji (yer şekilleri), Klimatoloji (iklim), Hidrografya (sular), Biyocoğrafya (canlılar), Kartografya (harita). Beşerî coğrafya: Nüfus, yerleşme, tarım, sanayi, ulaşım, turizm.'
        if 'dünyanın şekli' in full_text or 'geoit' in full_text or 'küresel' in full_text:
            return 'Dünya\'nın küresel şeklinin sonuçları: Ekvator\'dan kutuplara güneş ışınlarının açısı küçülür, sıcaklık azalır, çizgisel hız azalır, kutup yıldızı görünüm açısı enlemi verir.'
        if 'izohips' in full_text or 'eşyükselti' in full_text or 'profil' in full_text:
            return 'İzohips çizgilerinin sıklaştığı yerde eğim fazladır (falez oluşur). Vadi eğrilerinde "V"nin ucu yükseltinin arttığı yeri, sırtta ise azaldığı yeri gösterir.'
        if 'yerel saat' in full_text or 'meridyen' in full_text or 'saat dilimi' in full_text:
            return 'Her iki meridyen arası 4 dakikadır. Doğu\'da yerel saat daima daha ileridir. Aynı yarımkürede meridyenler çıkarılır, farklı yarımkürede toplanarak zaman farkı bulunur.'
        if 'iklim' in full_text or 'yağış' in full_text or 'muson' in full_text or 'maki' in full_text:
            return 'Akdeniz iklimi yazları sıcak-kurak, kışları ılık-yağışlıdır (bitki örtüsü maki). Karadeniz her mevsim yağışlıdır. İç Anadolu ilkbaharda konveksiyonel (kırkikindi) yağış alır.'
        if 'deprem' in full_text or 'fay hattı' in full_text or 'volkan' in full_text or 'heyelan' in full_text:
            return 'Fay hatları, volkanlar, kaplıcalar ve deprem kuşakları haritada paralel uzanır. Heyelan için eğim + bol yağış + killi toprak gerekir (en çok Karadeniz).'
        if 'boğaz' in full_text or 'kanal' in full_text or 'süveyş' in full_text or 'panama' in full_text or 'hürmüz' in full_text:
            return 'Süveyş Kanalı Akdeniz-Kızıldeniz, Panama Kanalı Atlas-Büyük Okyanus bağlantısıdır. Hürmüz Boğazı petrol çıkışıdır; Malakka Boğazı Uzak Doğu ticaret yoludur.'
        if 'nüfus piramidi' in full_text or 'doğum oranı' in full_text or 'gelişmiş ülke' in full_text:
            return 'Nüfus piramidinde taban darsa doğum oranı düşük ve ülke gelişmiştir (arı kovanı). Taban çok genişse doğum oranı yüksek ve ülke gelişmemiştir.'

    # =========================================================================
    # 4. TARİH VE İNKILAP TARİHİ
    # =========================================================================
    elif 'TARİH' in ders or 'İNKILAP' in ders:
        if 'asur' in full_text or 'kültepe' in full_text or 'çivi yazısı' in full_text:
            return 'Asurlular Mezopotamya uygarlığıdır; Anadolu\'ya (Kayseri Kültepe Kaniş Karumu) çivi yazısını getirerek Anadolu\'da Tarih Çağları\'nı başlatmışlardır.'
        if 'takvim' in full_text:
            return 'Türklerin kullandığı takvimler: 12 Hayvanlı Türk Takvimi (Güneş), Hicri Takvim (Ay), Celali Takvim (Selçuklu), Rumi Takvim (Osmanlı mali), Miladi Takvim (1 Ocak 1926\'dan itibaren).'
        if 'uygur' in full_text or 'göktürk' in full_text or 'hun' in full_text or 'orhun' in full_text:
            return 'Uygurlar yerleşik hayata geçen, tarım yapan ve mimari eser bırakan ilk Türk devletidir. Göktürkler Türk adıyla kurulan ve Orhun Abideleri\'ni yazan ilk devlettir.'
        if 'tımar' in full_text or 'yeniçeri' in full_text or 'kapıkulu' in full_text or 'divan-ı hümayun' in full_text:
            return 'Tımar sistemi devlete masrafsız tımarlı sipahi yetiştirir ve tarımsal üretimi denetler. Kapıkulu (Yeniçeriler) ise maaşlı (ulufe) profesyonel merkez ordusudur.'
        if 'mondros' in full_text or 'sevr' in full_text or 'lozan' in full_text or 'mudanya' in full_text:
            return 'Mondros\'un 7. maddesi İtilaf Devletleri\'ne her yeri işgal hakkı tanımıştır. Sevr hukuken geçersiz ölü bir antlaşmadır; Türkiye\'nin bağımsızlığı Lozan Antlaşması ile tescillenmiştir.'
        if 'ilke' in full_text or 'cumhuriyetçilik' in full_text or 'laiklik' in full_text or 'halkçılık' in full_text or 'devletçilik' in full_text:
            return 'Milli egemenlik ve seçim = Cumhuriyetçilik; Bağımsızlık ve milli birlik = Milliyetçilik; Eşitlik ve ayrıcalıksız toplum = Halkçılık; Akıl ve bilim = Laiklik; Devlet yatırımı = Devletçilik; Yenilik = İnkılapçılık.'

    # =========================================================================
    # 5. DİN KÜLTÜRÜ VE AHLAK BİLGİSİ
    # =========================================================================
    elif 'DİN' in ders:
        if 'ahiret' in full_text or 'mizan' in full_text or 'kıyamet' in full_text or 'berzah' in full_text:
            return 'Ahiret aşamaları: Ölüm → Berzah (kabir) → Kıyamet (Sur borusu) → Ba\'s (yeniden diriliş) → Haşir (toplanma) → Mahşer → Mizan (hesap) → Cennet / Cehennem.'
        if 'sıfat' in full_text and ('zati' in full_text or 'subuti' in full_text or 'vücud' in full_text or 'kıdem' in full_text):
            return 'Zatî sıfatlar yalnızca Allah\'a mahsustur (Vücud, Kıdem, Beka, Vahdaniyet, Muhalefetün lil-havadis, Kıyam bi-nefsihi). Subûtî sıfatlar benzeri insana da bahşedilendir (Hayat, İlim, Semî, Basar, İrade, Kudret, Kelam, Tekvin).'
        if 'bilgi kaynağı' in full_text or 'selim akıl' in full_text or 'sadık haber' in full_text:
            return 'İslam\'da bağlayıcı doğru bilgi kaynakları üçtür: Selim akıl, Sadık haber (vahiy ve sahih sünnet) ve Salim duyular. Rüya, keşif ve ilham bağlayıcı genel kaynak sayılmaz.'

    # =========================================================================
    # 6. İNGİLİZCE
    # =========================================================================
    elif 'İNGİLİZCE' in ders:
        if 'if ' in full_text or 'unless' in full_text:
            return 'If Clauses: Type 1 (If + Present Simple → will + V1), Type 2 (If + Past Simple → would + V1 / hayali), Type 3 (If + Past Perfect → would have + V3 / geçmiş pişmanlık).'
        if 'passive' in full_text or 'by ' in full_text or 'was ' in full_text or 'were ' in full_text:
            return 'Passive Voice: am/is/are + V3 (Geniş/Şimdiki Zaman Edilgen), was/were + V3 (Geçmiş Zaman Edilgen). Eylemi yapan özne belirtilecekse "by" edatı kullanılır.'
        if 'who' in full_text or 'which' in full_text or 'where' in full_text or 'whose' in full_text:
            return 'Relative Clauses: İnsanlar için "who", hayvan ve nesneler için "which", yerler için "where", aitlik bildiren isimler için "whose" kullanılır.'

    return None

def get_hint_for_question(q, spot_map=None):
    """
    Soru için en uygun taktik/ipucu metnini döndürür.
    Öncelik Sırası:
    1. Soru kökü ve şıkları semantik olarak analiz eden Akıllı Motor (Zero-Hallucination)
    2. TOPIC_HINTS içerisindeki alt_konu eşleşmesi
    3. TOPIC_HINTS içerisindeki ana_konu eşleşmesi
    4. Ders bazlı pedagojik yönlendirme
    """
    # 1. Aşama: Soru metnine dayalı akıllı tespit
    smart_hint = get_smart_stem_hint(q)
    if smart_hint:
        return smart_hint

    # 2. Aşama: Alt konu sözlüğü eşleşmesi
    sub = q.get('alt_konu', '')
    if sub in TOPIC_HINTS:
        return TOPIC_HINTS[sub]

    # Kısmi alt konu eşleşmesi
    for k, hint in TOPIC_HINTS.items():
        if k in sub or sub in k:
            return hint

    # 3. Aşama: Ana konu eşleşmesi
    ak = q.get('ana_konu', '')
    if ak in TOPIC_HINTS:
        return TOPIC_HINTS[ak]

    # 4. Aşama: Ders bazlı pedagojik yönlendirme
    ders = (q.get('ders', '') or '').upper()
    if 'MATEMATİK' in ders:
        return 'Soruda verilen bağıntıyı adım adım sadeleştirin; formülü, işlem sırasını ve işaretleri dikkatle kontrol edin.'
    elif 'TÜRK DİLİ' in ders or 'EDEBİYAT' in ders:
        return 'Paragrafın ana düşüncesine ve soru kökündeki olumsuz ifadelere (değinilmemiştir, çıkarılamaz) dikkat edin.'
    elif 'TARİH' in ders or 'İNKILAP' in ders:
        return 'Olayların neden-sonuç bağlamına ve dönemin siyasi/toplumsal şartlarına dikkat edin.'
    elif 'DİN' in ders:
        return 'Kavramların terim anlamlarına ve ayet/hadislerde vurgulanan asıl mesaja odaklanın.'
    elif 'FELSEFE' in ders:
        return 'Düşünürün savunduğu temel akıma ve varlığın/bilginin kaynağına ilişkin tezine odaklanın.'
    elif 'COĞRAFYA' in ders:
        return 'Harita üzerindeki yer şekillerine, iklim özelliklerine ve ölçek hesaplama kurallarına dikkat edin.'
    elif 'FİZİK' in ders:
        return 'Temel büyüklükleri ve yönleri belirleyin; formüldeki birim uyumuna dikkat edin.'
    elif 'KİMYA' in ders:
        return 'Maddelerin sembollerini, bileşik adlandırma kurallarını ve periyodik özelliklerin yönünü hatırlayın.'
    elif 'BİYOLOJİ' in ders:
        return 'Hücre yapılarının görevlerini ve canlıların temel sınıflandırma basamaklarını göz önünde bulundurun.'
    elif 'İNGİLİZCE' in ders:
        return 'Zaman uyumuna (tense agreement) ve özne-yüklem arasındaki tekillik/çoğulluk ilişkisine dikkat edin.'
    elif 'SAĞLIK' in ders:
        return 'İlk yardımda can güvenliği önceliğini ve hayati tehlike sıralamasını anımsayın.'

    return 'Soru kökünü ve verilen ipuçlarını dikkatle analiz ederek seçenekleri eleyiniz.'
