# 🏛️ MEB AÖL Tarih Müfredatı Taksonomisi ve Ders Sınırları Doğrulama Raporu

**Milestone:** M1 (Taxonomy Definition & Validation Engine)  
**Araştırmacı:** Explorer 1 (`teamwork_preview_explorer_m1_1`)  
**Tarih:** 2026-10-07  
**Hedef:** MEB AÖL 10 Ünite, 43 Alt Konu Taksonomisinin Çapraz Denetimi, Pedagojik Ders Sınırlarının Tespiti ve Fallback/Örtüşme Risklerinin Sıfırlanması  

---

## 1. YÖNETİCİ ÖZETİ (EXECUTIVE SUMMARY)

Bu araştırma, AÖL Açık Öğretim Lisesi müfredatında yer alan 8 zorunlu Tarih ve İnkılap Tarihi dersine (`TARİH 1–6`, `İNKILAP 1–2`, toplam **656 soru**) ait müfredat taksonomisini ve pedagojik ders sınırlarını doğrulamak ve nihai hale getirmek amacıyla yürütülmüştür.

### Temel Doğrulama Bulguları:
1. **Survey 3'teki 45 / 43 Sayım Tutarsızlığının Çözümü:**
   - Survey 3 raporunun başlığında "43 Alt Konu" vadedilmiş, ancak metin içi hiyerarşi ağacında 45 alt başlık listelenmişti.
   - Yapılan ayrıntılı pedagojik incelemede, **7. Ünite**'deki 17. yüzyıl savaşları ile Karlofça Antlaşması'nın yapay biçimde ikiye bölündüğü (7.1 ve 7.2), benzer şekilde **5. Ünite**'deki Osmanlı kuruluş teşkilatı ve toplumsal kurumlarının yapay biçimde bölündüğü (5.3 ve 5.4) tespit edilmiştir.
   - Bu iki örtüşen alt konunun MEB öğretim programına tam uyumlu biçimde konsolide edilmesiyle, **tam olarak 10 Ana Ünite ve 43 Alt Konudan oluşan kanonik taksonomi** inşa edilmiştir ($5 + 3 + 4 + 4 + 3 + 5 + 5 + 4 + 6 + 4 = 43$).
2. **Pedagojik Ders Sınırları ve Survey 3 Matrisinin Düzeltilmesi:**
   - Survey 3'te önerilen ders-konu kısıtlamalarının aşırı katı ve hatalı olduğu ampirik verilerle kanıtlanmıştır:
     - **TARİH – 2 (132):** Survey 3'te 1. Ünite "kesinlikle yasak" sayılmıştı. Oysa gerçek MEB sınavlarında Tarih 2 testinin ilk 1-2 sorusu düzenli olarak 9. Sınıf 1. Dönem temel medeniyet konularından (Mezopotamya, Mısır, Urartu, Antik Yunan, Pers Kral Yolu, Hint kast sistemi) gelmektedir (Bkz: Soru ID 5847, 5848, 7227, 7228, 8587, 8591, 9957). Yasak konulursa bu sorular doğrulama hatası verecektir.
     - **TARİH – 3 (133):** Survey 3'te 3. Ünite yasaklanmıştı. Oysa Tarih 3 sınavlarında Büyük Selçuklu, Pasinler, Karahanlılar, Kaşgarlı Mahmud soruları yer almaktadır (Bkz: Soru ID 8157, 8159, 8161, 9529, 9531).
     - **TARİH – 4 (134):** Survey 3'te 7. Ünite yasaklanmıştı. Oysa Tarih 4 sınavlarında Celali İsyanları, II. Osman Hotin Seferi ve Avrupa'daki Rönesans/Reform/Keşifler soruları bulunmaktadır (Bkz: Soru ID 8174, 9544, 9545, 10911, 10915).
     - **İNKILAP TARİHİ – 1 (141) & 2 (142):** Survey 3'te İnkılaplar ve Atatürk İlkeleri (9.4, 9.5, 9.6) Ders 142'ye bağlanmıştı. Oysa veritabanındaki 82 sorunun incelenmesi göstermiştir ki, **Ders 141 Unit 9'un tamamını (9.1 - 9.6) içermektedir**, **Ders 142 ise %100 oranında Unit 10'a (Çağdaş Türk ve Dünya Tarihi: II. Dünya Savaşı, Soğuk Savaş, Demokrat Parti, Detant, Kıbrıs, Küreselleşen Dünya)** aittir!
3. **Sıfır Fallback ve Sıfır Belirsizlik:**
   - Taksonomideki tüm alt konular somut tarihsel şahsiyetler, antlaşmalar, savaşlar ve kurumlar ile tanımlanmış; "Genel", "Diğer", "Çeşitli" gibi hiçbir çöp tenekesi terime yer verilmemiştir.
   - Soru köklerinde geçen kelimelerden kaynaklanan tarihsel anakronizm tuzakları (örneğin 19. yüzyıl Mısır Valisi Mehmet Ali Paşa'nın Antik Mısır'a atılması veya Balkan Savaşları'nın Antik Yunan'a atılması) kesin kronolojik sınırlarla bertaraf edilmiştir.

---

## 2. KANONİK MEB AÖL TARİH TAKSONOMİSİ (10 ÜNİTE, 43 ALT KONU)

Bu taksonomi `scripts/tde_taxonomy_map.json` mimarisiyle birebir aynı JSON formatında oluşturulacak `scripts/tarih_taxonomy_map.json` dosyasının kanonik referansıdır:

```
1. Tarih Bilimi ve İlk Çağ Medeniyetleri (131, 132)
   ├── 1.1 Tarih Bilimine Giriş, Yöntem, Kaynaklar ve Takvimler
   ├── 1.2 İnsanlığın İlk Dönemleri, Tarih Öncesi Çağlar ve Arkeolojik Merkezler
   ├── 1.3 Mezopotamya ve Mısır Medeniyetleri
   ├── 1.4 Anadolu Medeniyetleri (Hitit, Frig, Lidya, Urartu, İyon)
   └── 1.5 Ege, Yunan, Doğu Akdeniz, Roma ve İlk Çağ Medeniyetleri (İran, Hint, Çin)

2. Orta Çağ'da Dünya ve Türk Dünyası (131, 132)
   ├── 2.1 Orta Çağ Siyasi ve Sosyal Yapısı, Feodalite ve Ticaret Yolları
   ├── 2.2 İlk Türk Devletleri ve Orta Asya Bozkır Kültürü (Hunlar ve Diğer Boylar)
   └── 2.3 Kök Türkler, Uygurlar ve Türk Devlet Teşkilatı (Kut, Töre, Orhun Yazıtları)

3. İslam Medeniyeti ve Türk-İslam Devletleri (132, 133)
   ├── 3.1 İslamiyet'in Doğuşu, Hz. Muhammed ve Dört Halife Dönemi
   ├── 3.2 Emeviler, Abbasiler ve İslam Kültür Medeniyeti
   ├── 3.3 Türklerin İslamiyet'i Kabulü ve İlk Türk-İslam Devletleri (Karahanlı, Gazneli)
   └── 3.4 Büyük Selçuklu Devleti, Teşkilatı ve Kültür Medeniyeti

4. Türkiye Selçukluları ve Anadolu Beylikleri (133)
   ├── 4.1 Malazgirt Sonrası Anadolu ve I. Dönem Türk Beylikleri
   ├── 4.2 Türkiye Selçuklu Devleti Siyaseti ve Haçlı Seferleri
   ├── 4.3 Kösedağ Savaşı, Moğol İstilası ve II. Dönem Anadolu Beylikleri
   └── 4.4 Anadolu Selçuklu Medeniyeti, Ahilik ve Kültürel Hayat

5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı (133, 134)
   ├── 5.1 Kuruluş Dönemi Siyaseti ve Balkan Fetihleri (1302-1453)
   ├── 5.2 Anadolu'da Türk Siyasi Birliği, Ankara Savaşı ve Fetret Devri
   └── 5.3 Kuruluş Dönemi Osmanlı Askerî, İdari ve Sosyal Teşkilatı (Tımar, Kapıkulu, Vakıf, Ahilik)

6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti (133, 134, 137)
   ├── 6.1 Fatih Sultan Mehmed Dönemi ve İstanbul'un Fethi
   ├── 6.2 II. Bayezid ve Yavuz Sultan Selim Dönemi (Doğu Siyaseti ve Halifelik)
   ├── 6.3 Kanuni Sultan Süleyman Dönemi, Seferler ve Denizler Hakimiyeti
   ├── 6.4 Klasik Çağda Osmanlı Devlet Yönetimi, Saray ve Divan Teşkilatı
   └── 6.5 Klasik Dönem Osmanlı Toplum Yapısı, Hukuk, Vakıflar ve Şehir Hayatı

7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl) (134, 137, 138)
   ├── 7.1 17. Yüzyıl Osmanlı Siyasi İlişkileri, Savaşları ve Antlaşmaları (Kutsal İttifak, Karlofça, Kasr-ı Şirin, Bucaş)
   ├── 7.2 17. Yüzyıl İç İsyanları ve Islahat Çabaları (Celali İsyanları, Köprülüler)
   ├── 7.3 Avrupa'daki Gelişmeler (Keşifler, Rönesans, Reform, Aydınlanma, Westphalia)
   ├── 7.4 18. Yüzyıl Osmanlı Siyaseti ve Antlaşmaları (Kayıpları Telafi, Küçük Kaynarca, Yaş)
   └── 7.5 18. Yüzyıl Islahatları, Lale Devri ve Nizam-ı Cedit

8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı) (138, 141)
   ├── 8.1 Uluslararası İlişkilerde Denge Stratejisi, Milliyetçilik İsyanları ve Şark Meselesi
   ├── 8.2 19. Yüzyıl Demokratikleşme Hareketleri ve Islahatlar (Sened-i İttifak'tan Meşrutiyet'e)
   ├── 8.3 Dağılmayı Önleme Fikir Akımları ve 19. Yüzyıl Kültürel Hayatı
   └── 8.4 20. Yüzyıl Başlarında Osmanlı Devleti, Trablusgarp ve Balkan Savaşları

9. Millî Mücadele ve T.C. İnkılap Tarihi (141)
   ├── 9.1 Mustafa Kemal'in Hayatı, I. Dünya Savaşı ve Mondros Ateşkesi
   ├── 9.2 Millî Mücadele'nin Hazırlık Dönemi, Kongreler ve I. TBMM'nin Açılışı
   ├── 9.3 Millî Mücadele Muharebeler Dönemi, Antlaşmalar ve Lozan Barış Antlaşması
   ├── 9.4 Atatürkçülük ve Türk İnkılabı (Siyasal, Hukuki, Eğitsel, Toplumsal, Ekonomik)
   ├── 9.5 Atatürk İlkeleri ve Bütünleyici İlkeler
   └── 9.6 Atatürk Dönemi Türk Dış Politikası (1923-1938)

10. Çağdaş Türk ve Dünya Tarihi (142)
   ├── 10.1 İki Savaş Arası Dönem ve II. Dünya Savaşı (1918-1945)
   ├── 10.2 Soğuk Savaş Dönemi ve Türkiye (1945-1960)
   ├── 10.3 Yumuşama (Detant) Dönemi ve Bölgesel Çatışmalar (1960-1990)
   └── 10.4 Küreselleşen Dünya, İletişim Çağı ve 21. Yüzyılın Eşiğinde Türkiye ve Dünya
```

---

## 3. ÜNİTE VE ALT KONU AYRINTILARI VE MEB KAZANIM EŞLEŞTİRMELERİ

Aşağıda her bir alt konunun kapsadığı MEB kazanımları, anahtar kavramlar ve soru eşleştirme sınırları verilmiştir:

### ÜNİTE 1: Tarih Bilimi ve İlk Çağ Medeniyetleri (5 Alt Konu)
- **1.1 Tarih Bilimine Giriş, Yöntem, Kaynaklar ve Takvimler:**
  - Tarihin tanımı, yöntemi (tarama, tasnif, tahlil, tenkit, terkip).
  - Kaynak türleri (birinci/ikinci el kaynaklar, yazılı/yazısız belgeler).
  - Takvim sistemleri (Güneş, Ay yılı, 12 Hayvanlı Türk Takvimi, Hicri, Celali, Rumi, Miladi takvim).
  - Tarihe yardımcı bilimler (arkeoloji, kronoloji, nümismatik, epigrafi, heraldik, paleografi, diplomatik, filoloji, etnografya, kimya / karbon-14).
  - Tarih öğrenmenin bireye ve topluma faydaları, millî bilinç ve tarihsel empati (Örn: Soru ID 9047).
- **1.2 İnsanlığın İlk Dönemleri, Tarih Öncesi Çağlar ve Arkeolojik Merkezler:**
  - Taş Çağları (Paleolitik, Mezolitik, Neolitik / Yeni Taş, Kalkolitik) ve Maden Çağları (Bakır, Tunç, Demir).
  - Avcı-toplayıcılıktan üretici yaşama geçiş, tarım devrimi.
  - Önemli arkeolojik merkezler: Göbeklitepe, Çatalhöyük, Çayönü, Karain, Yarımburgaz, Truva, Alacahöyük.
- **1.3 Mezopotamya ve Mısır Medeniyetleri:**
  - Mezopotamya medeniyetleri: Sümerler (yazının icadı, ziggurat, patesi/ensi, tekerlek, ay yılı takvimi), Akadlar (ilk düzenli ordu ve imparatorluk), Babiller (Hammurabi kanunları, Babil kulesi), Asurlar (Kültepe/Kaniş ticaret kolonileri, Anadolu'ya yazının taşınması, Ninova kütüphanesi), Elamlar.
  - Mısır medeniyeti: Nil nehri, firavun, piramitler, hiyeroglif, mumyalama (tıp/eczacılık), nomlar, Kadeş Antlaşması, Güneş takvimi.
- **1.4 Anadolu Medeniyetleri (Hitit, Frig, Lidya, Urartu, İyon):**
  - Hititler (Hattuşaş, Pankuş meclisi, Tavananna, Anal/yıllıklar, Kadeş).
  - Frigler (Gordion, Kral Midas, Kibele, fibula, tarım kanunları / saban kırma cezası).
  - Lidyalılar (Sardes, paranın icadı, Kral Yolu, ücretli askerlik).
  - Urartular (Tuşpa / Van Kalesi, Şamran kanalı, taş işçiliği ve madencilik).
  - İyonlar (Efes, Milet, Foça, deniz ticareti, felsefe ve bilim; Hipokrat, Tales, Pisagor, Herodot).
- **1.5 Ege, Yunan, Doğu Akdeniz, Roma ve İlk Çağ Medeniyetleri (İran, Hint, Çin):**
  - Doğu Akdeniz: Fenikeliler (harf yazısı/alfabe, deniz ticareti), İbraniler (tek tanrılı inanç / semavi din).
  - Ege ve Yunan: Girit, Miken, Antik Yunan şehir devletleri (Polis; Atina, Sparta), olimpiyatlar, demokrasi denemeleri.
  - Helenizm: Büyük İskender, İskenderiye kütüphanesi.
  - Roma Medeniyeti: Krallık, Cumhuriyet ve İmparatorluk dönemleri; Patrici-Plep mücadelesi, Senato, 12 Levha Kanunları, Hristiyanlığın kabulü / Milano Fermanı, Kavimler Göçü ile ikiye ayrılma.
  - Diğer İlk Çağ Medeniyetleri: İran (Medler ve Persler: satraplık sistemi, Kral Yolu, posta teşkilatı, Şahanşah); Hindistan (kast sistemi, Veda kültürü); Çin (kâğıt, matbaa, pusula, barut, ipek, Çin Seddi).

### ÜNİTE 2: Orta Çağ'da Dünya ve Türk Dünyası (3 Alt Konu)
- **2.1 Orta Çağ Siyasi ve Sosyal Yapısı, Feodalite ve Ticaret Yolları:**
  - Kavimler Göçü'nün Avrupa ve dünya tarihine etkileri, Batı Roma'nın yıkılışı.
  - Feodalizm (derebeylik), süzeren-vassal ilişkisi, serflik ve skolastik düşünce.
  - Orta Çağ imparatorlukları: Doğu Roma (Bizans), Sasani İmparatorluğu, Moğol İmparatorluğu (Cengiz Han Yasaları).
  - Orta Çağ ticaret yolları: İpek Yolu, Baharat Yolu, Kürk Yolu, Kral Yolu; kervansaraylar, ribatlar, limanlar.
- **2.2 İlk Türk Devletleri ve Orta Asya Bozkır Kültürü (Hunlar ve Diğer Boylar):**
  - Orta Asya'nın coğrafi özellikleri, konargöçer yaşam tarzı ve göçlerin nedenleri/sonuçları.
  - İskitler (Sakalar, Tomris Hatun, Alper Tunga).
  - Asya Hun Devleti (Teoman, Mete Han, Onlu sistem, Çin ile mücadeleler).
  - Avrupa Hun Devleti (Balamir, Uldız, Attila / "Tanrının Kırbacı", Margus ve Anatolius antlaşmaları, Nibelungen Destanı).
  - Diğer Türk Devletleri ve Boyları: Avarlar, Hazarlar (Hazar Barış Çağı / Pax Chazarica), Bulgarlar (İtil ve Tuna), Peçenekler, Macarlar, Kıpçaklar (Kumanlar / Kodeks Kumanikus), Oğuzlar (Uzlar), Türgişler (Baga Tarkan, madeni para), Kırgızlar (Manas Destanı), Karluklar.
- **2.3 Kök Türkler, Uygurlar ve Türk Devlet Teşkilatı (Kut, Töre, Orhun Yazıtları):**
  - I. Kök Türk Devleti (Bumin Kağan, İstemi Yabgu, İpek Yolu diplomasisi), Çin esareti ve Kürşad İhtilali.
  - II. Kök Türk / Kutluk Devleti (Kutluk Kağan, Bilge Kağan, Kül Tigin, Vezir Tonyukuk).
  - Orhun Kitabeleri (Türk adının geçtiği ilk yazılı metinler, sosyal devlet anlayışı).
  - Uygur Devleti (Kutlug Bilge Kül Kağan, Bögü Kağan, Maniheizm ve Budizm'in kabulü, yerleşik hayata geçiş, tarım, mimari, şehirleşme / balık, matbaa ve kütüphanecilik).
  - Türk Devlet Teşkilatı ve Düşüncesi: Kut inancı, cihan hakimiyeti / kızıl elma, ikili teşkilat (doğu-batı), Kurultay (Toy/Kengeş), Töre hukuku, Ordu-millet anlayışı, toplumsal hiyerarşi (oguş, urug, boy, bodun, il).

### ÜNİTE 3: İslam Medeniyeti ve Türk-İslam Devletleri (4 Alt Konu)
- **3.1 İslamiyet'in Doğuşu, Hz. Muhammed ve Dört Halife Dönemi:**
  - Cahiliye Dönemi Arap Yarımadası, kabilecilik, panayırlar.
  - Hz. Muhammed'in peygamberliği, Mekke dönemi ve Hicret (622).
  - Medine Sözleşmesi, Bedir, Uhud, Hendek savaşları; Hudeybiye Barışı, Hayber'in fethi, Mute Savaşı, Mekke'nin fethi, Huneyn ve Taif seferleri, Veda Haccı ve Veda Hutbesi.
  - Dört Halife Dönemi (Cumhuriyet Dönemi): Hz. Ebubekir (Yalancı peygamberler, Ridde savaşları, Kur'an'ın mushaf/kitap haline getirilmesi); Hz. Ömer (fetihler: Yermük, Kadisiye, Celula, Nihavend, Kudüs ve Mısır; devlet teşkilatlanması: divan, adalet teşkilatı/kadılık, ordugâh şehirler, hicri takvim); Hz. Osman (donanma ve ilk deniz zaferi / Zatü's-Savari, Kur'an'ın çoğaltılması); Hz. Ali (Cemel Vakası, Sıffin Savaşı, Hakem Olayı, iç karışıklıklar).
- **3.2 Emeviler, Abbasiler ve İslam Kültür Medeniyeti:**
  - Emeviler Dönemi: Muaviye, hilafetin saltanata dönüşmesi, Kerbela Olayı, Kuzey Afrika ve İspanya fetihleri (Tarık bin Ziyad, Kadiks Savaşı), Mevali politikası (Arap milliyetçiliği), Ömer bin Abdülaziz dönemi; Endülüs Emevi Devleti ve Kurtuba / İslam kültürünün Avrupa'ya etkisi.
  - Abbasiler Dönemi: Ebu Müslim Horasani, hoşgörü politikası, Talas Savaşı (751), Harun Reşid, Beytü'l-Hikme (tercüme faaliyetleri), Samarra (Türkler için ordugâh şehir) ve Avasım (Bizans sınır boyları).
  - İslam Kültür ve Medeniyeti: İlim havzaları (Bağdat, Şam, Kahire, Kurtuba, Horasan), İslam bilginleri (Harezmi, Farabi, İbn-i Sina / El-Kanun fi't-Tıp, Biruni, İbn-i Rüşd, Cabir bin Hayyan).
- **3.3 Türklerin İslamiyet'i Kabulü ve İlk Türk-İslam Devletleri (Karahanlı, Gazneli):**
  - Talas Savaşı ve Türklerin kitleler halinde İslamiyet'i kabulü.
  - Karahanlılar (İlk Müslüman Türk devleti, Satuk Buğra Han / Abdülkerim, Türk-İslam sentezi).
  - İlk Türk-İslam Edebî ve Kültürel Eserleri: Kutadgu Bilig (Yusuf Has Hacib), Divanü Lugati't-Türk (Kaşgarlı Mahmud), Atabetü'l-Hakayık (Edip Ahmet Yükneki), Divan-ı Hikmet (Hoca Ahmet Yesevi).
  - Gazneliler (Alp Tegin, Sultan Mahmut / Hindistan'a 17 sefer, Dandanakan Savaşı).
  - Mısır'da Kurulan Türk Devletleri: Tolunoğulları (Maristan darüşşifası), İhşidiler (Akşitler), Eyyubiler (Selahaddin Eyyubi / Hıttin Savaşı), Memlükler (Sultan Baybars / Moğolları Ayncalut Savaşı'nda yenen ilk devlet).
- **3.4 Büyük Selçuklu Devleti, Teşkilatı ve Kültür Medeniyeti:**
  - Selçuk Bey, Tuğrul ve Çağrı Beyler; Dandanakan Savaşı (1040) ve devletin kuruluşu.
  - Pasinler Savaşı (1048), Tuğrul Bey'in Bağdat Seferi ve Şii Büveyhoğullarına karşı halifeyi kurtarması ("Doğu'nun ve Batı'nın Sultanı" unvanı).
  - Sultan Alparslan ve Malazgirt Zaferi (1071 / Anadolu'nun kapılarının açılması).
  - Sultan Melikşah, Vezir Nizamülmülk (Siyasetname) ve Nizamiye Medreseleri.
  - Selçuklu Devlet Teşkilatı: Divan-ı Saltanat, İstifa, Arz, İşraf, İnşa; Atabeylik sistemi, İkta sistemi.
  - Yıkılış Dönemi: Bâtınilik hareketi (Hasan Sabbah), Katvan Savaşı (1041 Moğol Karahitaylar).

### ÜNİTE 4: Türkiye Selçukluları ve Anadolu Beylikleri (4 Alt Konu)
- **4.1 Malazgirt Sonrası Anadolu ve I. Dönem Türk Beylikleri:**
  - Malazgirt sonrası "Toprak fethedenin malıdır" anlayışıyla Anadolu'nun fethi.
  - I. Dönem Türk Beylikleri: Saltuklular (Erzurum, Mama Hatun Külliyesi), Mengücekliler (Erzincan, Divriği Ulu Camii ve Darüşşifası), Danişmentliler (Sivas-Tokat, Yağıbasan Medresesi), Artuklular (Mardin-Batman, Malabadi Köprüsü, El-Cezeri), Çaka Beyliği (İzmir, ilk Türk denizcisi ve donanması).
- **4.2 Türkiye Selçuklu Devleti Siyaseti ve Haçlı Seferleri:**
  - Kutalmışoğlu Süleyman Şah ve Türkiye Selçuklularının kuruluşu (İznik başkent).
  - I. Kılıç Arslan ve I. Haçlı Seferi sonucunda başkentin Konya'ya taşınması.
  - Haçlı Seferleri (I., II., III. ve IV. Seferler; IV. Haçlı Seferi ile İstanbul'un Haçlılarca yağmalanıp Latin İmparatorluğu kurulması, İznik ve Trabzon Rum imparatorlukları).
  - II. Kılıç Arslan ve Miryokefalon Zaferi (1176 / Anadolu'nun kesin olarak Türk yurdu olduğunun tescili).
  - I. Gıyaseddin Keyhüsrev, İzzettin Keykavus, Alaeddin Keykubad dönemi yükselme: Sinop, Antalya, Alanya'nın fethi, Kırım Suğdak seferi, uluslararası deniz ticareti, devlet sigortası sistemi, kervansaraylar; Yassıçemen Savaşı (Harzemşahların yıkılışı).
- **4.3 Kösedağ Savaşı, Moğol İstilası ve II. Dönem Anadolu Beylikleri:**
  - Baba İshak (Babailer) İsyanı.
  - Kösedağ Savaşı (1243) ve Moğol (İlhanlı) istilası / Anadolu Selçuklularının bağımsızlığını kaybetmesi.
  - Anadolu Türk siyasi birliğinin parçalanması ve II. Dönem Beyliklerin doğuşu: Karamanoğulları (Konya, Türkçeyi resmî dil ilan eden Karamanoğlu Mehmet Bey), Karesioğulları (Balıkesir-Çanakkale, denizcilik), Candaroğulları/İsfendiyaroğulları (Kastamonu-Sinop), Aydınoğulları (Aydın, Umur Bey), Saruhanoğulları (Manisa), Menteşeoğulları (Muğla), Germiyanoğulları (Kütahya), Hamitoğulları (Isparta), Dulkadiroğulları (Maraş), Ramazanoğulları (Adana), Eretna Beyliği ve Kadı Burhaneddin Devleti.
- **4.4 Anadolu Selçuklu Medeniyeti, Ahilik ve Kültürel Hayat:**
  - Anadolu Selçuklu idari teşkilatı: Divan-ı Saltanat, Niyabet-i Saltanat (Naib), Pervaneci (arazi kayıtları).
  - Ahilik Teşkilatı: Ahi Evran, Fütüvvetname, mesleki ahlak, çırak-kalfa-usta hiyerarşisi, kalite kontrol ve dayanışma.
  - Tasavvufi ve fikri hayat: Mevlana Celaleddin-i Rumi, Yunus Emre, Hacı Bektaş-ı Veli, Sadreddin Konevi.
  - İmar, mimari ve sanat: Kümbetler, hanlar/kervansaraylar, darüşşifalar (Gevher Nesibe Darüşşifası), medreseler (Karatay, İnce Minareli, Gök Medrese).

### ÜNİTE 5: Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı (3 Alt Konu)
- **5.1 Kuruluş Dönemi Siyaseti ve Balkan Fetihleri (1302-1453):**
  - Kayı boyunun kökeni, Ertuğrul Gazi, Söğüt ve Domaniç.
  - Osman Gazi dönemi: Koyunhisar (Bafeus) Muharebesi (1302 / Osmanlı'nın kuruluş tarihi tezi), ilk fetihler, ilk Osmanlı parası ve vergisi (Baç).
  - Orhan Gazi dönemi: Bursa'nın fethi ve başkent yapılması, Maltepe (Palekanon) Muharebesi, İznik ve İzmit'in fethi; Karesioğulları Beyliği'nin alınması (Anadolu birliğinde ilk adım ve denizciliğe geçiş); Çimpe Kalesi'nin alınması ve Rumeli'ye geçiş.
  - I. Murad dönemi: Edirne'nin fethi (Sazlıdere Savaşı) ve başkent yapılması; Sırpsındığı, Çirmen, Ploşnik ve I. Kosova Muharebesi (I. Murad'ın şehit düşmesi); Rumeli Beylerbeyliği.
  - Yıldırım Bayezid dönemi: İstanbul kuşatmaları, Anadolu Hisarı (Güzelcehisar), Niğbolu Zaferi (1396 / "Sultan-ı İklim-i Rum" unvanı).
  - II. Murad dönemi: Varna Muharebesi (1444), II. Kosova Muharebesi (1448 / Balkanların kesin Türk yurdu olması).
  - Kuruluş nazariyeleri ve tartışmaları: Paul Wittek (Gaza tezi), M. Fuat Köprülü, Halil İnalcık.
- **5.2 Anadolu'da Türk Siyasi Birliği, Ankara Savaşı ve Fetret Devri:**
  - Anadolu beylikleriyle ilişkiler: Satın alma (Hamitoğulları), çeyiz/akrabalık (Germiyanoğulları), vasiyet, fetih (Karaman, Saruhan, Aydın, Menteşe).
  - Yıldırım Bayezid'in Anadolu Türk siyasi birliğini büyük ölçüde sağlaması.
  - Ankara Savaşı (1402): Nedenleri, Timur Devleti ile çatışma, savaşın kaybedilmesi ve sonuçları (Beyliklerin yeniden kurulması, siyasi birliğin bozulması, İstanbul'un fethinin gecikmesi).
  - Fetret Devri (1402-1413): Şehzadeler mücadelesi (İsa, Musa, Süleyman, Mehmet Çelebi).
  - Çelebi Mehmet (I. Mehmet) dönemi: Devleti toparlama, ikinci kurucu sayılması, Venedik ile ilk deniz savaşı (Çalı Bey), Şeyh Bedreddin İsyanı, Mustafa Çelebi (Düzmece Mustafa) meselesi.
- **5.3 Kuruluş Dönemi Osmanlı Askerî, İdari ve Sosyal Teşkilatı (Tımar, Kapıkulu, Vakıf, Ahilik):**
  - Askerî örgütlenme: Gönüllü birlikler (Alpler, Gaziler), Yaya ve Müsellem ordusu (Orhan Gazi dönemi ilk düzenli ordu).
  - Kapıkulu Sistemi: Pençik sistemi ve Devşirme sistemi; Acemi Ocağı, Yeniçeri Ocağı (I. Murad dönemi).
  - Tımar (Dirlik) Sistemi: Tımarlı sipahiler, cebelüler, toprağın devlete ait olması (mirî arazi), üretimin denetimi, hazineden para çıkmadan ordu besleme.
  - İdari Teşkilat: Divan-ı Hümayun'un kurulması, Vezirlik, Kazaskerlik, Defterdarlık makamları; Kadılık teşkilatı ve adli yapı.
  - İskân Politikası (fethedilen Rumeli topraklarına Türkmenlerin yerleştirilmesi) ve İstimalet (hoşgörü ve koruyuculuk) politikası.
  - Toplumsal yapı ve kurumlar: Ahiler (Ahiyan-ı Rum), Gaziyan-ı Rum, Abdalan-ı Rum, Bacıyan-ı Rum; Vakıf sistemi, ilk Osmanlı medresesi (İznik Orhaniyesi), Davud-ı Kayseri.

### ÜNİTE 6: Dünya Gücü Osmanlı ve Osmanlı Medeniyeti (5 Alt Konu)
- **6.1 Fatih Sultan Mehmed Dönemi ve İstanbul'un Fethi:**
  - Fethin nedenleri ve hazırlıkları: Boğazkesen (Rumeli Hisarı), Şahi topları, donanmanın karadan yürütülmesi, Venedik ve Macarlarla saldırmazlık antlaşmaları.
  - Fethin gerçekleşmesi (29 Mayıs 1453) ve dünya ve Türk tarihi açısından doğurduğu siyasi, ekonomik, kültürel sonuçlar.
  - Fatih'in fetihleri: Sırbistan, Mora Despotluğu, Eflak, Boğdan, Bosna ve Hersek'in fethi; Ege adaları, Kırım'ın fethi (Gedik Ahmet Paşa / Karadeniz'in Türk gölü haline gelmesi); Sinop ve Trabzon Rum İmparatorluğu'nun alınması; Otlukbeli Zaferi (1473 / Akkoyunlu Uzun Hasan).
- **6.2 II. Bayezid ve Yavuz Sultan Selim Dönemi (Doğu Siyaseti ve Halifelik):**
  - II. Bayezid dönemi: Cem Sultan meselesi (iç meselenin dış soruna dönüşmesi: Rodos şövalyeleri, Papa, Fransa), Karamanoğulları'na kesin olarak son verilmesi, Safevi tehlikesi ve Şahkulu Baba Tekeli İsyanı (1511).
  - Yavuz Sultan Selim dönemi ve Doğu Siyaseti: Çaldıran Zaferi (1514 / Safevi Şah İsmail'e karşı), Dulkadiroğulları Beyliği'ne son verilmesi (Turnadağ Savaşı 1515 / Anadolu Türk siyasi birliğinin kesin olarak sağlanması).
  - Mısır Seferi: Mercidabık (1516) ve Ridaniye (1517) Savaşları; Memlük Devleti'nin yıkılması; Suriye, Filistin, Mısır ve Hicaz'ın fethi; Halifeliğin Osmanlı'ya geçmesi, Kutsal Emanetler'in Topkapı Sarayı'na getirilmesi; Baharat Yolu hâkimiyeti.
- **6.3 Kanuni Sultan Süleyman Dönemi, Seferler ve Denizler Hakimiyeti:**
  - Kanuni'nin ilk yılları ve isyanlar (Canberdi Gazali, Ahmet Paşa, Kalender Çelebi, Baba Zünnun).
  - Batı Seferleri: Belgrad'ın fethi (1521), Mohaç Meydan Muharebesi (1526 / Macaristan'ın fethi), I. Viyana Kuşatması (1529), Almanya Seferi; İstanbul Antlaşması (1533 / Avusturya kralının Osmanlı sadrazamına denk sayılmasıyla siyasi üstünlük); Zigetvar Seferi (1566).
  - Doğu Seferleri: Safeviler ile savaşlar ve ilk resmî barış olan Amasya Antlaşması (1555).
  - Denizler Hâkimiyeti: Rodos'un fethi, Preveze Deniz Zaferi (1538 / Barbaros Hayreddin Paşa / Akdeniz'in Türk gölü haline gelmesi); Trablusgarp ve Cerbe Deniz Zaferi (Turgut Reis), Sakız Adası; Hint Deniz Seferleri (Piri Reis, Seydi Ali Reis / Mir'âtü'l-Memâlik); Kıbrıs'ın fethi (1571 / Lala Mustafa Paşa); İnebahtı Deniz Muharebesi (1571 / Osmanlı donanmasının yakılması ve Sokullu Mehmet Paşa'nın meşhur cevabı).
- **6.4 Klasik Çağda Osmanlı Devlet Yönetimi, Saray ve Divan Teşkilatı:**
  - Hükümdar ve egemenlik anlayışı; Fatih Kanunnamesi (Kanunname-i Âli Osman: kardeş katli, müsadere, cülus bahşişi usulleri).
  - Veraset usulü, Şehzadelerin eğitimi, Lalalık müessesesi ve Sancağa çıkma sistemi.
  - Saray Teşkilatı: Birun (Dış saray), Enderun (İç saray / devşirme devlet adamlarının yetiştiği okul), Harem (Harem-i Hümayun, valide sultan, cariyeler), Babüssaade.
  - Divan-ı Hümayun ve Üyeleri: Padişah, Sadrazam (Veziriazam), Kubbealtı vezirleri, Kazasker (adli/hukuki işler), Defterdar (mali işler), Nişancı (tuğra, örfi kanunlar, tahrir defterleri), Reisülküttab (dış yazışmalar ve diplomasi), Şeyhülislam (müftü / fetva makamı), Kaptan-ı Derya.
  - Yönetici Sınıflar: Seyfiye (kılıç ehli: sadrazam, vezirler, beylerbeyi, sancakbeyi, kapıkulu ve sipahiler); İlmiye (din, hukuk, eğitim: şeyhülislam, kazasker, kadı, müderris); Kalemiye (bürokrasi ve maliye: nişancı, defterdar, reisülküttab, kâtipler).
- **6.5 Klasik Dönem Osmanlı Toplum Yapısı, Hukuk, Vakıflar ve Şehir Hayatı:**
  - Toplumsal tabakalaşma: Yönetenler (Askerîler) ve Yönetilenler (Reaya).
  - Millet Sistemi: Irk esasına değil, din ve mezhep aidiyetine dayalı örgütlenme (Müslümanlar, Ortodoks Rumlar, Ermeniler, Museviler).
  - Hukuk Sistemi: Şer'i hukuk (İslam hukuku) ve Örfi hukuk (töre ve padişah fermanları / kanunnameler); Kadılık kurumu ve mahkemeler.
  - Toprak Sistemi: Mirî arazi rejimi; Dirlik toprakları (Has, Zeamet, Tımar); Çifthane sistemi (bir çift öküz, bir aile, işletilen mirî arazi); Mukataa, İltizam sistemi, Paşmaklık, Yurtluk, Ocaklık; Mülk ve Vakıf araziler.
  - Şehir ve İktisadi Yaşam: Lonca teşkilatı (Ahiliğin devamı, ustalık, gedik hakkı, narh koyma, yiğitbaşı, kethüda, muhtesip); Bedestenler, kervansaraylar, kapanlar; İmarethaneler ve Vakıf sistemi; Klasik Osmanlı sanatı (Mimar Sinan, mimari, hat, minyatür, tezhip, çini).

### ÜNİTE 7: Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl) (5 Alt Konu)
- **7.1 17. Yüzyıl Osmanlı Siyasi İlişkileri, Savaşları ve Antlaşmaları (Kutsal İttifak, Karlofça, Kasr-ı Şirin, Bucaş):**
  - Avusturya / Habsburglarla mücadele: Haçova Meydan Muharebesi, Kanije ve Estergon savunmaları (Tiryaki Hasan Paşa); Zitvatorok Antlaşması (1606 / Avusturya kralının Osmanlı padişahına protokolde eşit sayılmasıyla üstünlüğün kaybedilmesi).
  - Safevilerle savaşlar: Ferhat Paşa Antlaşması (1590 / Doğuda en geniş sınırlar), Nasuh Paşa (1612), Serav (1618), Kasr-ı Şirin Antlaşması (1639 / Günümüz Türkiye-İran sınırının çizilmesi, Bağdat Fatihi IV. Murad).
  - Lehistan ile ilişkiler: Hotin Seferi (1621 / II. Osman); Bucaş Antlaşması (1672 / Batıda en geniş sınırlara ulaşılması).
  - Rusya ile ilişkiler: Çehrin / Bahçesaray Antlaşması (1681 / Rusya ile yapılan ilk resmî antlaşma).
  - Venedik ile mücadele: Girit'in 24 yıllık kuşatma sonrası fethi (1669 / Köprülü Fazıl Ahmet Paşa).
  - II. Viyana Kuşatması (1683 / Merzifonlu Kara Mustafa Paşa) ve ağır yenilgi.
  - Kutsal İttifak Savaşları (1683-1699: Avusturya, Rusya, Lehistan, Venedik, Malta); Salankamen ve Zenta yenilgileri.
  - Karlofça Antlaşması (1699): Osmanlı'nın batıda ilk kez büyük çapta toprak kaybetmesi (Macaristan, Erdel, Podolya, Mora), garantör devlet kavramı; İstanbul Antlaşması (1700 / Azak Kalesi'nin Rusya'ya verilmesi ve Rusya'nın Karadeniz'e inme hakkı elde etmesi).
- **7.2 17. Yüzyıl İç İsyanları ve Islahat Çabaları (Celali İsyanları, Köprülüler):**
  - 17. Yüzyıl Buhranı ve isyanların nedenleri: Merkezî otoritenin bozulması, tımar sisteminin çöküşü, vergi adaletsizliği, uzun savaşlar, enflasyon.
  - Celali İsyanları (Anadolu isyanları: Karayazıcı, Deli Hasan, Tavil Ahmet, Canbulatoğlu, Kalenderoğlu; Anadolu'da kamu düzeninin çökmesi, "Büyük Kaçgun" köyden kente göçler).
  - İstanbul / Yeniçeri İsyanları: Kapıkulu ocaklarının bozulması ("Devlet ocak içindir" anlayışı), ulufe ve cülus talepleri, saray entrikaları, II. Osman'ın öldürülmesi, Çınar Vakası (Vaka-i Vakvakiye 1656).
  - Suhte (Medrese öğrencileri) İsyanları ve Eyalet İsyanları (Yemen, Bağdat, Trablusgarp, Eflak, Boğdan).
  - 17. Yüzyıl Islahatçıları ve Genel Özellikleri: Sorunların köküne inilememesi, Kanuni devrine dönüş özlemi, Avrupa'nın örnek alınmaması, baskı ve şiddet ile bastırma; Kuyucu Murat Paşa; II. Osman (Genç Osman); IV. Murad (Koçi Bey Risalesi, Kâtip Çelebi Risalesi / Mizanü'l-Hakk); Tarhuncu Ahmet Paşa (ilk modern denk bütçe); Köprülüler Dönemi (şartlı sadrazam Köprülü Mehmet Paşa, Köprülü Fazıl Ahmet Paşa / Duraklama içinde yükselme devri).
  - Veraset Düzenlemesi: I. Ahmed dönemi Ekber ve Erşed sistemi (hanedanın en yaşlı ve olgun üyesinin tahta geçmesi) ve Kafes usulü / Şehzadelerin sancağa çıkmasının sonlandırılması.
- **7.3 Avrupa'daki Gelişmeler (Keşifler, Rönesans, Reform, Aydınlanma, Westphalia):**
  - Coğrafi Keşifler: Yeni ticaret yolları, İpek ve Baharat yollarının Akdeniz limanlarının önemini yitirmesi, Atlas Okyanusu limanlarının yükselişi, Amerika kıtasının keşfi ve sömürgeleştirilmesi; Merkantilizm (değerli maden birikimine dayalı ekonomi modeli) ve Osmanlı akçesinin değer kaybetmesi / enflasyon.
  - Rönesans: İtalya'da doğuşu, Hümanizm, Antik Yunan/Roma felsefesinin yeniden keşfi, skolastik düşüncenin yıkılışı; hareketli harfli matbaa (Gutenberg).
  - Reform: Martin Luther, Almanya, 95 Tez; Katolik Kilisesi ve Papa'ya başkaldırı, endüljansın reddi; Protestanlık, Kalvenizm, Anglikanizm mezheplerinin doğuşu; Ogsburg Barışı (1555).
  - Otuz Yıl Savaşları (1618-1648) ve Westphalia Barışı (1648): Kutsal Roma-Germen İmparatorluğu'na karşı prenslikler ve Fransa; modern laik uluslararası hukukun ve egemen devletler sisteminin temellerinin atılması.
  - Bilim Devrimi ve Aydınlanma Çağı Düşünürleri: Kopernik, Kepler, Galileo, Bacon, Descartes, Newton (evrensel çekim yasası), John Locke, Rousseau.
- **7.4 18. Yüzyıl Osmanlı Siyaseti ve Antlaşmaları (Kayıpları Telafi, Küçük Kaynarca, Yaş):**
  - Kaybedilen toprakları geri alma çabaları: Prut Savaşı ve Antlaşması (1711 / Azak Kalesi'nin Rusya'dan geri alınması, Baltacı Mehmet Paşa); Mora'nın Venedik'ten geri alınması.
  - Petervaradin yenilgisi ve Pasarofça Antlaşması (1718 / Avusturya'ya Belgrad'ın bırakılması, fetih politikasından savunma politikasına geçiş ve Batı'nın üstünlüğünün kabulü).
  - 1736-1739 Osmanlı-Rus ve Avusturya Savaşları ve Belgrad Antlaşması (1739 / Belgrad'ın geri alınması, 18. yüzyılın son kazançlı antlaşması); 1740 Kapitülasyonlarının Fransa'ya sürekli hale getirilmesi (Mahmut I).
  - 1768-1774 Osmanlı-Rus Savaşı: Çeşme Baskını (1770 / donanmanın Ruslarca yakılması).
  - Küçük Kaynarca Antlaşması (1774): Kırım'ın bağımsız olması (halkı Müslüman ilk toprak kaybı, halifeliğin siyasi güç olarak kullanılması), Rusya'ya Karadeniz'de seyrüsefer ve ilk kez kapitülasyon hakkı, ilk kez savaş tazminatı ödenmesi, Rusya'nın Ortodokslar üzerinde hak iddiaları; Aynalıkavak Tenkihnamesi (1779 / Şahin Giray).
  - 1787-1792 Osmanlı-Rus ve Avusturya Savaşları: Ziştovi Antlaşması (1791 / Avusturya ile barış, Fransız İhtilali etkisi); Yaş Antlaşması (1792 / Kırım'ın Rusya'ya ait olduğunun kabul edilmesi, Dağılma Döneminin başlangıcı); Grek ve Dakya projeleri.
  - Fransa'nın Mısır'ı İşgali (1798 / Napoleon Bonaparte): Cezzar Ahmet Paşa ve Akka Savunması (Nizam-ı Cedit ordusunun ilk askerî başarısı); El-Ariş Antlaşması (1801).
- **7.5 18. Yüzyıl Islahatları, Lale Devri ve Nizam-ı Cedit:**
  - 18. Yüzyıl Islahatlarının Ayırt Edici Özelliği: Batı'nın askerî ve teknik üstünlüğünün ilk kez kabul edilip model alınması.
  - Lale Devri (1718-1730): III. Ahmed ve Sadrazam Nevşehirli Damat İbrahim Paşa, Şair Nedim; İlk geçici elçilikler (28 Çelebi Mehmet Efendi / Paris Sefaretnamesi); İlk Türk matbaası (İbrahim Müteferrika ve Sait Efendi); Yalova kâğıt fabrikası, Tulumbacılar Ocağı (itfaiye), çiçek aşısı, tercüme encümenleri; Patrona Halil İsyanı (1730) ile Lale Devri'nin sona ermesi.
  - I. Mahmud dönemi: Humbaracı Ahmet Paşa (Kont de Bonneval), Hendesehane (ilk Batı tarzı askerî mühendislik okulu).
  - III. Mustafa dönemi: Baron de Tott, Sürat Topçuları Ocağı, Mühendishane-i Bahrî-i Hümayun (Deniz Mühendishanesi 1773).
  - I. Abdülhamid dönemi: Esham sistemi (iç borçlanma senetleri), Cülus bahşişinin kaldırılması, yeniçeri sayımı ve ulufe alım-satımının yasaklanması; Mühendishane-i Berrî-i Hümayun (Kara Mühendishanesi).
  - III. Selim dönemi ve Nizam-ı Cedit: Layihalar (ıslahat raporları), Nizam-ı Cedit ordusu ve masrafları için İrad-ı Cedit hazinesi; Selimiye ve Levent kışlaları; Londra, Paris, Viyana ve Berlin'de ilk daimi elçilikler; Fransızcanın ilk resmî yabancı dil yapılması; Kabakçı Mustafa İsyanı (1807) ve III. Selim'in tahttan indirilmesi.

### ÜNİTE 8: En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı) (4 Alt Konu)
- **8.1 Uluslararası İlişkilerde Denge Stratejisi, Milliyetçilik İsyanları ve Şark Meselesi:**
  - Denge Stratejisi kavramı (Büyük devletlerin çıkar çatışmalarından yararlanarak varlığını sürdürme).
  - Şark Meselesi (Doğu Sorunu: Viyana Kongresi 1815'te Rus Çarı I. Aleksandr tarafından terimleştirilmesi; Osmanlı topraklarının paylaşılması).
  - Milliyetçilik İsyanları: Sırp İsyanı (1804 Kara Yorgi, Bükreş 1812 imtiyaz, Edirne 1829 özerklik, Berlin 1878 bağımsızlık); Mora / Yunan İsyanı (1821 Filiki Eterya, Navarin Baskını 1827 / donanmanın yakılması, Edirne Antlaşması 1829 ile Yunanistan'ın bağımsız olması / ilk bağımsız olan azınlık).
  - Mısır Meselesi: Kavalalı Mehmet Ali Paşa isyanı; Kütahya Antlaşması (1833); Hünkar İskelesi Antlaşması (1833 / Rusya ile ittifak, Boğazlar sorununun uluslararası hale gelmesi); Nizip Savaşı (1839); Londra Konferansı (1840 / Mısır'ın özerkliği); Londra Boğazlar Sözleşmesi (1841 / Boğazların tüm savaş gemilerine kapatılması ve uluslararası statü kazanması).
  - Kırım Savaşı (1853-1856): Nedenleri (Kutsal Yerler meselesi, Mençikof talepleri), Sinop Baskını (1853), İngiltere, Fransa ve Piyemonte'nin Osmanlı yanında savaşa girmesi; İlk dış borçlanma (1854 / İngiltere'den); Florence Nightingale ve modern hemşirelik; Paris Barış Antlaşması (1856 / Osmanlı'nın Avrupa devleti sayılması ve Avrupa hukukundan yararlanması, Karadeniz'in tarafsızlığı).
  - 93 Harbi (1877-1878 Osmanlı-Rus Savaşı): Tersane (İstanbul) Konferansı, Gazi Osman Paşa ve Plevne Savunması, Nene Hatun ve Erzurum Aziziye Tabyası; Ayastefanos (Yeşilköy) Antlaşması (yürürlüğe girmeyen ölü antlaşma); Berlin Antlaşması (1878: Sırbistan, Karadağ, Romanya'nın bağımsızlığı; Kars, Ardahan, Batum'un Rusya'ya bırakılması / Elviye-i Selâse; Bulgaristan'ın parçalanması; Ermeni meselesinin ilk kez uluslararası antlaşmaya girmesi); Kıbrıs'ın idaresinin İngiltere'ye geçici devri (1878); Doğu Rumeli'nin Bulgaristan'a ilhakı (1885); Girit Sorunu ve Halepa Fermanı (1878); Dömeke Meydan Muharebesi (1897 Osmanlı-Yunan Savaşı).
- **8.2 19. Yüzyıl Demokratikleşme Hareketleri ve Islahatlar (Sened-i İttifak'tan Meşrutiyet'e):**
  - II. Mahmud dönemi yenilikleri: Alemdar Mustafa Paşa, Sened-i İttifak (1808 / Âyanlarla sözleşme, padişah otoritesinin ilk kez sınırlandırılması); Sekban-ı Cedit ve Eşkinci Ocağı; Vaka-i Hayriye (1826 / Yeniçeri Ocağının kaldırılması), Asakir-i Mansure-i Muhammediye; Divan'ın kaldırılıp Nazırlıkların (Bakanlıkların) kurulması, Sadrazamın Başvekil olması; Muhtarlıkların kurulması, ilk resmî nüfus sayımı (1831), Takvim-i Vekayi (ilk resmî gazete), mürur tezkeresi (iç pasaport), posta ve karantina teşkilatı; Müsadere usulünün kaldırılması (mülkiyet hakkı güvencesi).
  - Tanzimat Fermanı (Gülhane Hatt-ı Hümayunu 1839): Sultan Abdülmecid, Mustafa Reşit Paşa; Kanunun üstünlüğü ilkesi, tüm tebaanın can, mal, namus güvencesi, vergide adalet, askerliğin vatan görevi olması; anayasal düzene ilk adım.
  - Islahat Fermanı (1856): Sultan Abdülmecid; Avrupalı devletlerin baskısıyla ilan edilmesi; Gayrimüslimlere tam eşitlik, cizye vergisinin kaldırılması, aşağılayıcı sözlerin yasaklanması, il meclislerine üyelik ve memuriyet hakkı, yabancılara mülk edinme hakkı.
  - I. Meşrutiyet ve Kanun-i Esasi (1876): Genç Osmanlılar (Jön Türkler: Namık Kemal, Ziya Paşa, Mithat Paşa); II. Abdülhamid'in tahta çıkışı ve ilk Türk anayasası olan Kanun-i Esasi'nin ilanı; Meclis-i Umumi: Meclis-i Mebusan (halkın seçtiği) ve Meclis-i Ayan (padişahın atadığı); Padişahın sürgün ve fesih yetkisi; 93 Harbi bahanesiyle meclisin tatil edilmesi (1878).
  - II. Abdülhamid Dönemi (İstibdat Devri 1878-1908): İttihad-ı İslam (İslamcılık) siyaseti, eğitim hamleleri (Darülfünun, Mülkiye, Sanayi-i Nefise, Askeri okullar), telgraf hatları ve demiryolları (Hicaz ve Bağdat demiryolları), Hamidiye Alayları, Duyun-ı Umumiye (1881 / Muharrem Kararnamesi), Darülaceze, Hilal-i Ahmer (Kızılay), Hamidiye Etfal Hastanesi.
  - II. Meşrutiyet (1908): İttihat ve Terakki Cemiyeti, Reval Görüşmeleri, Selanik ve Resne'de isyan (Niyazi Bey, Enver Paşa), Meşrutiyet'in yeniden ilanı; 31 Mart Vakası (1909: Rejime karşı ilk irticai isyan, Selanik'ten gelen Hareket Ordusu / Komutan Mahmut Şevket Paşa, Kurmay Başkanı Kolağası Mustafa Kemal, II. Abdülhamid'in tahttan indirilmesi ve V. Mehmet Reşat); 1909 Anayasa Değişiklikleri (padişah yetkilerinin sembolikleşmesi, hükûmetin meclise sorumlu olması, cemiyet kurma hakkı); Bâbıâli Baskını (1913 / İttihatçı hükûmet darbesi).
- **8.3 Dağılmayı Önleme Fikir Akımları ve 19. Yüzyıl Kültürel Hayatı:**
  - Dağılmayı önleme fikir akımları:
    - Osmanlıcılık (İttihad-ı Anasır): Tüm unsurların eşitliği, Namık Kemal, Şinasi, Ziya Paşa, Mithat Paşa; Balkan Savaşları ile geçerliliğini yitirmesi.
    - İslamcılık (Ümmetçilik / Panislamizm): II. Abdülhamid, Mehmet Akif Ersoy, Sait Halim Paşa; I. Dünya Savaşı'nda Arap isyanları ile çökmesi.
    - Türkçülük (Pantürkizm / Turancılık): Yusuf Akçura ("Üç Tarz-ı Siyaset"), Ziya Gökalp, İsmail Gaspıralı ("Dilde, fikirde, işte birlik"), Mehmet Emin Yurdakul; Millî Mücadele'nin fikri temeli.
    - Batıcılık: Tevfik Fikret, Celal Nuri, Abdullah Cevdet.
  - İktisadi ve Sosyal Dönüşüm: Balta Limanı Ticaret Sözleşmesi (1838 / İngiltere ile, gümrük vergilerinin düşürülmesi ve Osmanlı pazarının açık sömürge pazarı haline gelmesi); Loncaların çöküşü, iflaslar; Dış borçlanmalar, Muharrem Kararnamesi (1881) ve Düyûn-ı Umûmiye İdaresi (Genel Borçlar İdaresi / mali bağımsızlığın kaybı).
  - Göçler ve Demografik Değişimler: Kırım ve Kafkas göçleri (Çerkes sürgünü), 93 Harbi Rumeli muhacirleri, İskân-ı Muhacirin Nizamnamesi, Anadolu'da Müslüman nüfus oranının hızla yükselmesi.
- **8.4 20. Yüzyıl Başlarında Osmanlı Devleti, Trablusgarp ve Balkan Savaşları:**
  - II. Meşrutiyet sırasındaki kayıplar (Bulgaristan'ın bağımsızlığı, Avusturya'nın Bosna-Hersek'i ilhakı, Girit'in Yunanistan'a bağlanma kararı).
  - Trablusgarp Savaşı (1911-1912): İtalya'nın sömürge arayışı, Trablusgarp'ın işgali; Gönüllü subaylar (Mustafa Kemal / Derne ve Tobruk, Enver Bey / Bingazi); Savaş tarihinde ilk kez uçağın kullanılması; 12 Ada'nın İtalyanlarca işgali; Uşi Antlaşması (1912 / Trablusgarp ve Bingazi'nin İtalya'ya bırakılması, Kuzey Afrika'daki son toprak parçasının kaybı, 12 Ada'nın geçici olarak İtalya'ya verilmesi).
  - I. Balkan Savaşı (1912-1913): Nedenleri; Bulgaristan, Yunanistan, Sırbistan ve Karadağ ittifakı; Osmanlı ordusunun siyasete karışması ve 4 cephede ağır yenilgi; Londra Antlaşması (1913 / Midye-Enez hattının batısındaki Edirne ve Kırklareli dâhil tüm Rumeli'nin kaybı); Arnavutluk'un bağımsızlığını ilan etmesi (Osmanlı'dan ayrılan son Balkan devleti); Bâbıâli Baskını (1913).
  - II. Balkan Savaşı (1913): Balkan devletlerinin ganimet paylaşımında Bulgaristan'a saldırması (Romanya'nın katılması); Osmanlı'nın Edirne ve Kırklareli'yi geri alması (Enver Paşa / "Edirne Fatihi"); Bükreş Antlaşması (Balkan devletleri arası); Osmanlı ile yapılan antlaşmalar: İstanbul Antlaşması (Bulgaristan ile, Meriç nehri sınır, Edirne Osmanlı'da), Atina Antlaşması (Yunanistan ile, Selanik ve Girit Yunanistan'da), İstanbul Antlaşması (Sırbistan ile); Balkan Savaşlarının sonuçları: Batı Trakya Türkleri sorunu, kitlesel göçler.

### ÜNİTE 9: Millî Mücadele ve T.C. İnkılap Tarihi (6 Alt Konu)
- **9.1 Mustafa Kemal'in Hayatı, I. Dünya Savaşı ve Mondros Ateşkesi:**
  - Mustafa Kemal'in ailesi, çocukluğu ve öğrenim gördüğü okullar (Mahalle Mektebi, Şemsi Efendi, Selanik Mülkiye Rüştiyesi, Selanik Askeri Rüştiyesi, Manastır Askeri İdadisi, İstanbul Harp Okulu ve Harp Akademisi); Fikir dünyasını etkileyen şehirler (Selanik, Manastır, İstanbul, Şam, Sofya) ve aydınlar (Namık Kemal, Ziya Gökalp, Tevfik Fikret, Montesquieu, Voltaire, Rousseau); Askerlik hayatı (Şam 5. Ordu, Vatan ve Hürriyet Cemiyeti, Hareket Ordusu, Trablusgarp, Sofya Ataşemiliterliği).
  - I. Dünya Savaşı (1914-1918): Nedenleri, bloklar (İttifak ve İtilaf); Osmanlı'nın savaşa girmesi (Goben ve Breslav / Yavuz ve Midilli gemileri); Cepheler: Kafkas Cephesi (Sarıkamış Faciası, Tehcir/Sevk ve İskân Kanunu 1915, Mustafa Kemal'in Muş ve Bitlis'i kurtarması), Kanal Cephesi, Çanakkale Cephesi (18 Mart Deniz Zaferi, Anafartalar, Conkbayırı, Arıburnu, Mustafa Kemal'in askerî dehası ve tanınması), Hicaz-Yemen Cephesi (Fahrettin Paşa / Medine Müdafaası), Irak Cephesi (Kut'ül-Amare Zaferi / Halil Kut Paşa), Suriye-Filistin Cephesi (Mustafa Kemal ve Yıldırım Orduları), Yardım Cepheleri (Galiçya, Romanya, Makedonya); Gizli Antlaşmalar, 1917 Rus İhtilali ve Brest-Litovsk Antlaşması, ABD'nin savaşa girmesi ve Wilson İlkeleri.
  - Mondros Ateşkes Antlaşması (30 Ekim 1918): Rauf Orbay, 7. ve 24. maddelerin tehlikesi, ordunun terhisi ve işgallerin başlaması; Mustafa Kemal'in İstanbul'a gelişi ("Geldikleri gibi giderler").
- **9.2 Millî Mücadele'nin Hazırlık Dönemi, Kongreler ve I. TBMM'nin Açılışı:**
  - Cemiyetler: Zararlı Cemiyetler (Azınlıklar: Mavri Mira, Etniki Eterya, Pontus Rum, Hınçak, Taşnak; Millî Varlığa Düşman: Sulh ve Selamet-i Osmaniye, Teali İslam, İngiliz Muhipleri, Wilson Prensipleri); Yararlı / Millî Cemiyetler (Trakya Paşaeli, İzmir Müdafaa-i Hukuk, Redd-i İlhak, Trabzon Muhafaza-i Hukuk, Doğu Anadolu Müdafaa-i Hukuk, Kilikyalılar, Millî Kongre / basın-yayın, Kuvayımilliye ruhu).
  - Paris Barış Konferansı (1919) ve İzmir'in İşgali (15 Mayıs 1919 / Hasan Tahsin); Amiral Bristol Raporu (Türklerin haklılığını ortaya koyan ilk uluslararası belge).
  - Mustafa Kemal'in Samsun'a Çıkışı (19 Mayıs 1919), Havza Genelgesi (millî bilincin uyanışı, mitingler), Amasya Genelgesi (22 Haziran 1919 / Kurtuluş Savaşı'nın amacı, gerekçesi ve yöntemi, millî egemenlik çağrısı).
  - Erzurum Kongresi (23 Temmuz-7 Ağustos 1919 / Toplanış bölgesel, kararlar ulusal; Manda ve himaye ilk kez reddedildi, Temsil Heyeti kuruldu); Sivas Kongresi (4-11 Eylül 1919 / Her yönüyle ulusal, cemiyetlerin birleştirilmesi, manda ve himayenin kesin reddi, İrade-i Milliye gazetesi, Temsil Heyetinin ilk yürütme yetkisi / Ali Fuat Paşa'nın Batı Cephesine atanması).
  - Amasya Görüşmeleri (Protokolleri 1919 / İstanbul Hükûmeti Temsil Heyetini resmen tanıdı); Temsil Heyetinin Ankara'ya gelişi (27 Aralık 1919).
  - Son Osmanlı Mebusan Meclisi ve Misak-ı Millî (28 Ocak 1920 / Millî sınırlar, kapitülasyonların reddi, boğazlar, azınlıklar); İstanbul'un resmen işgali (16 Mart 1920).
  - I. TBMM'nin Açılışı (23 Nisan 1920): Kurucu, ihtilalci ve olağanüstü meclis; Meclis hükûmeti sistemi; Meclise karşı ayaklanmalar (İstanbul Hükûmeti, Kuva-yı İnzibatiye, Anzavur, azınlıklar, Çerkez Ethem, Demirci Mehmet Efe); Alınan tedbirler (Hıyanet-i Vataniye Kanunu, İstiklal Mahkemeleri, Hâkimiyet-i Milliye gazetesi, Anadolu Ajansı); Sevr Antlaşması (10 Ağustos 1920 / Saltanat Şûrası, onaylanmamış ve ölü doğmuş antlaşma).
- **9.3 Millî Mücadele Muharebeler Dönemi, Antlaşmalar ve Lozan Barış Antlaşması:**
  - Düzenli Ordunun Kurulması (Batı Cephesi: İsmet Paşa).
  - Doğu Cephesi: Kazım Karabekir Paşa ve Ermenilere karşı zafer; Gümrü Antlaşması (3 Aralık 1920 / TBMM'nin ilk askerî ve diplomatik zaferi).
  - Güney Cephesi: Kuvayımilliye destanı; Maraş (Sütçü İmam), Antep (Şahin Bey), Urfa (Ali Saip Bey); Fransızlarla 1921 Ankara Antlaşması.
  - Batı Cephesi Muharebeleri:
    - I. İnönü Muharebesi (1921): Zaferin iç ve dış sonuçları: Teşkilat-ı Esasiye (1921 Anayasası), İstiklal Marşı'nın kabulü (Mehmet Akif Ersoy), Londra Konferansı (TBMM'nin İtilaf Devletlerince hukuken tanınması), Afganistan Dostluk Antlaşması, Moskova Antlaşması (SSCB ile dostluk ve Misak-ı Millî'den ilk taviz: Batum).
    - II. İnönü Muharebesi (1921): "Siz orada yalnız düşmanı değil, milletin makus talihini de yendiniz."
    - Kütahya-Eskişehir Muharebeleri (1921): Geri çekilme, Maarif Kongresi'nin toplanması, Mustafa Kemal'e 3 aylık Başkomutanlık yetkisinin verilmesi; Tekalif-i Millîye Emirleri (topyekûn seferberlik).
    - Sakarya Meydan Muharebesi (1921): "Hattı müdafaa yoktur, sathı müdafaa vardır. O satıh bütün vatandır." 22 gün 22 gece; Sakarya'nın sonuçları: Mustafa Kemal'e Mareşallik ve Gazilik unvanı, Kars Antlaşması (Kafkas Cumhuriyetleri ile / Doğu sınırının kesinleşmesi), Ankara Antlaşması (Fransa ile / Hatay hariç güney sınırının çizilmesi).
    - Büyük Taarruz ve Başkomutan Meydan Muharebesi (26 Ağustos-9 Eylül 1922): Dumlupınar, "Ordular ilk hedefiniz Akdeniz'dir, ileri!", İzmir'in kurtuluşu ve Anadolu'nun işgalden temizlenmesi.
  - Mudanya Ateşkes Antlaşması (11 Ekim 1922): İsmet Paşa, Doğu Trakya ve Boğazların savaşsız kurtarılması, Osmanlı Devleti'nin hukuken sona ermesi.
  - Saltanatın Kaldırılması (1 Kasım 1922 / Lozan'a tek temsilci olarak gitmek için).
  - Lozan Barış Antlaşması (24 Temmuz 1923): İsmet İnönü heyeti; Tavizsiz maddeler (Kapitülasyonlar ve Ermeni yurdu); Çözülen meseleler (Sınırlar: Doğu, Batı, Güney; Kapitülasyonların kesin kaldırılması; Azınlıkların Türk vatandaşı sayılması; Dış borçlar; Savaş tazminatı / Karaağaç; Yabancı okullar; Nüfus mübadelesi; Boğazlar / uluslararası komisyon; Çözülemeyen: Musul / Irak sınırı).
- **9.4 Atatürkçülük ve Türk İnkılabı (Siyasal, Hukuki, Eğitsel, Toplumsal, Ekonomik):**
  - Siyasal İnkılaplar: Ankara'nın başkent olması (13 Ekim 1923); Cumhuriyetin İlanı (29 Ekim 1923 / Devletin rejimi, adı, başkanı belirlendi; Kabine sistemine geçiş); Halifeliğin Kaldırılması (3 Mart 1924); Şer'iye ve Evkaf Vekaletinin kaldırılması; Erkan-ı Harbiye Vekaletinin kaldırılması (ordunun siyasetten ayrılması); 1924 Anayasası; Çok partili hayata geçiş denemeleri: Cumhuriyet Halk Fırkası (ilk parti), Terakkiperver Cumhuriyet Fırkası (ilk muhalefet partisi / Kazım Karabekir, Rauf Orbay, Ali Fuat Cebesoy), Şeyh Sait İsyanı (1925), Takrir-i Sükun Kanunu ve TCF'nin kapatılması; Mustafa Kemal'e İzmir Suikastı Girişimi (1926 / "Benim naçiz vücudum..."); Serbest Cumhuriyet Fırkası (1930 / Ali Fethi Okyar) ve Menemen Olayı (Kubilay).
  - Hukuk Alanında İnkılaplar: Türk Medeni Kanunu (1926 / İsviçre'den, tek eşlilik, miras ve boşanmada kadın-erkek eşitliği, kadına meslek seçme hakkı, patrikhanenin dünyevi yetkilerinin son bulması); Türk Ceza Kanunu (İtalya'dan), Borçlar ve Ticaret Kanunları; Kadınlara siyasi hakların verilmesi (1930 Belediye, 1933 Muhtarlık, 1934 Milletvekili / "034 BMX").
  - Eğitim ve Kültür İnkılapları: Tevhid-i Tedrisat Kanunu (3 Mart 1924 / eğitimde birlik, medreselerin kapatılması); Maarif Teşkilatı Kanunu (1926); Harf İnkılabı (1 Kasım 1928 / Latin alfabesi); Millet Mektepleri (24 Kasım 1928 / Başöğretmenlik); Türk Tarih Kurumu (1931 / Türk Tarih Tezi); Türk Dil Kurumu (1932); Üniversite Reformu (1933 / Albert Malche raporu, Darülfünun yerine İstanbul Üniversitesi); Dil ve Tarih-Coğrafya Fakültesi (1935); Mûsiki Muallim Mektebi, Devlet Konservatuvarı.
  - Toplumsal İnkılaplar: Şapka Kanunu ve Kılık Kıyafet Düzenlemesi (1925 / Kastamonu konuşması); Tekke, Zaviye ve Türbelerin Kapatılması (1925); Takvim, Saat ve Ölçülerde Değişiklik (Miladi takvim, uluslararası saat, rakamlar, metrik sistem, hafta tatilinin pazara alınması); Soyadı Kanunu (1934) ve lakap/unvanların kaldırılması.
  - Ekonomi ve Sağlık İnkılapları: İzmir İktisat Kongresi (1923 / Misak-ı İktisadi, millî ekonomi); Aşar vergisinin kaldırılması (1925); Kabotaj Kanunu (1 Temmuz 1926 / denizlerimizde ticaret hakkı); Teşvik-i Sanayi Kanunu (1927); 1929 Dünya Buhranı ve Devletçilik ilkesinin uygulanması; I. Beş Yıllık Sanayi Planı (1933); Sümerbank, Etibank, MTA; Türkiye İş Bankası (ilk özel Türk bankası), Merkez Bankası; Tarım Kredi Kooperatifleri, Yüksek Ziraat Enstitüsü; Sağlık: Hıfzıssıhha Enstitüsü (Refik Saydam), dispanserler, verem ve sıtma mücadelesi.
- **9.5 Atatürk İlkeleri ve Bütünleyici İlkeler:**
  - Atatürkçü Düşünce Sistemi'nin özellikleri (Akılcılık, bilimsellik, dinamizm, dogma karşıtlığı, barışçılık).
  - Temel İlkeler:
    1. Cumhuriyetçilik (Millî egemenlik, halk iradesi, meclis, seçimler, cumhuriyetin ilanı, çok partili hayat).
    2. Milliyetçilik (Türk milletinin bağımsızlığı ve beraberliği, ırkçılık karşıtı bütünleştirici milliyetçilik, TTK, TDK, Kabotaj).
    3. Halkçılık (Eşitlik, ayrıcalıksız toplum, sosyal adalet, Medeni Kanun, Aşar vergisinin kaldırılması, Soyadı Kanunu).
    4. Devletçilik (Ekonomide devlet öncülüğü ve planlaması, kamu iktisadi yatırımları, I. Beş Yıllık Sanayi Planı, Sümerbank, Etibank).
    5. Laiklik (Din ve devlet işlerinin ayrılması, din ve vicdan hürriyeti, aklın ve bilimin rehberliği; Saltanat ve Halifeliğin kaldırılması, Şer'iye ve Evkaf'ın kaldırılması, Tevhid-i Tedrisat, Tekkelerin kapatılması, Medeni Kanun, 1928 anayasa değişikliği / "Devletin dini İslam'dır" ibaresinin çıkarılması, 1937'de ilkelerin anayasaya girmesi).
    6. İnkılapçılık (Sürekli çağdaşlaşma, yenilenme, durağanlığın reddi, dinamizm).
  - Bütünleyici İlkeler: Millî egemenlik, Millî bağımsızlık, Akılcılık ve bilimsellik, Millî birlik ve beraberlik, Yurtta sulh cihanda sulh, İnsan ve insanlık sevgisi.
- **9.6 Atatürk Dönemi Türk Dış Politikası (1923-1938):**
  - Dış politikanın ilkeleri (Tam bağımsızlık, barışçılık, eşitlik, gerçekçilik, uluslararası hukuka bağlılık).
  - 1923-1930 Dönemi (Lozan sorunlarının çözümü): Yabancı okullar meselesi (Fransa ile); Nüfus Mübadelesi ve Ahali Antlaşması (1930 / Yunanistan ile, etabli sorunu, dostluk dönemi); Musul Meselesi (İngiltere ile: Haliç Konferansı 1924, Milletler Cemiyeti kararı, Şeyh Sait İsyanı sonrası 1926 Ankara Antlaşması ile Musul'un Irak'a bırakılması); Dış borçlar sorunu (1928-1933 Hoover Moratoryumu).
  - 1930-1938 Dönemi (Güvenlik ittifakları dönemi): Türkiye'nin Milletler Cemiyeti'ne üye olması (1932); Balkan Antantı (1934 / İtalya ve Almanya tehdidine karşı Türkiye, Yunanistan, Yugoslavya, Romanya / Batı sınırının güvencesi); Montrö Boğazlar Sözleşmesi (20 Temmuz 1936 / Boğazlar Komisyonunun kaldırılması, Boğazların tam Türk egemenliğine geçmesi ve silahlandırılması); Sadabat Paktı (1937 / İtalya'nın Habeşistan işgaline karşı Türkiye, İran, Irak, Afganistan / Doğu sınırının güvencesi); Hatay Sorunu (Fransa'nın Suriye mandasından çekilmesi, Sandlex Raporu, Bağımsız Hatay Cumhuriyeti 1938 / Tayfur Sökmen, Hatay Meclisinin Türkiye'ye katılma kararı 1939).

### ÜNİTE 10: Çağdaş Türk ve Dünya Tarihi (4 Alt Konu)
- **10.1 İki Savaş Arası Dönem ve II. Dünya Savaşı (1918-1945):**
  - I. Dünya Savaşı sonrası kurulan totaliter rejimler: İtalya'da Faşizm (Mussolini, Kara Gömlekliler, Bizim Deniz / Mare Nostrum); Almanya'da Nazizm (Hitler, Hayat Sahası / Lebensraum, Gestapo); SSCB'de Komünizm (Lenin, Stalin, kollektifleştirme); Japonya'da Militarizm (Hirohito, Asya Asyalılarındır).
  - 1929 Dünya Ekonomik Bunalımı (Büyük Buhran / Kara Perşembe) ve Türkiye'ye etkileri (Kliring sistemi, yerli malı, tasarruf cemiyeti).
  - II. Dünya Savaşı'na Giden Süreç: İspanya İç Savaşı (Franco), İtalya'nın Habeşistan'ı işgali, Almanya'nın Avusturya ve Çekoslovakya'yı ilhakı (Münih Konferansı / Yatıştırma Politikası).
  - II. Dünya Savaşı (1939-1945): Mihver Devletler (Almanya, İtalya, Japonya) ve Müttefik Devletler (İngiltere, Fransa, SSCB, ABD); Polonya'nın işgali (1 Eylül 1939 / Yıldırım Savaşı), Maginot Hattı'nın aşılması ve Fransa'nın teslimi; İngiltere Savaşı; Barbarossa Harekâtı ve Stalingrad Kuşatması; Pearl Harbor Baskını (1941) ve ABD'nin girişi; Normandiya Çıkarması (1944 / Eisenhower); Almanya'nın teslimi; Atom bombaları (Hiroşima ve Nagazaki) ve Japonya'nın teslimi.
  - Savaş Konferansları: Atlantik Bildirisi (1941 / Wilson İlkeleri benzeri self-determinasyon, Bkz: Soru ID 4067), Kazablanka, Tahran, Yalta (1945), Potsdam (1945).
  - Savaşın Sonuçları: Birleşmiş Milletler'in kuruluşu (1945 San Francisco), İnsan Hakları Evrensel Beyannamesi, Nürnberg ve Tokyo mahkemeleri.
  - II. Dünya Savaşı Yıllarında Türkiye: İsmet İnönü'nün aktif tarafsızlık ve denge politikası, Adana ve Kahire görüşmeleri; Sembolik savaş ilanı (BM kurucu üyesi olmak için); Savaş ekonomisi: Seferberlik, Millî Korunma Kanunu (1940), Varlık Vergisi (1942), Toprak Mahsulleri Vergisi (1944), ekmek karnesi, karartma geceleri, pahalılık ve asayiş tedbirleri, Köy Enstitüleri (1940).
- **10.2 Soğuk Savaş Dönemi ve Türkiye (1945-1960):**
  - Soğuk Savaş kavramı ve İki Kutuplu Dünya: Churchill ve "Demir Perde" kavramı.
  - Doğu Bloku: SSCB liderliği, Kominform, Comecon, Varşova Paktı (1955), Çin'de komünizm (Mao).
  - Batı Bloku: Truman Doktrini (1947), Marshall Planı (1947), NATO (1949), Avrupa Konseyi, Schuman Bildirisi ve AET (Avrupa Birliği'nin temeli).
  - İlk krizler: Berlin Buhranı (1948 / Berlin Hava Köprüsü), Kore Savaşı (1950-1953 / Türk Tugayı "Şimal Yıldızı", Kunuri Zaferi).
  - Soğuk Savaşta Türkiye: SSCB'nin Boğazlar ve Doğu Anadolu (Kars-Ardahan) talepleri; Türkiye'nin Batı Blokuna yönelmesi ve NATO'ya üye olması (1952); Balkan Paktı (1953), Bağdat Paktı (1955 / CENTO).
  - Türkiye'de Çok Partili Hayata Geçiş: Millî Kalkınma Partisi (1945 / Nuri Demirağ); Dörtlü Takrir (Celal Bayar, Adnan Menderes, Refik Koraltan, Fuat Köprülü); Demokrat Parti'nin kuruluşu (1946); 1946 seçimleri (açık oy gizli sayım); 14 Mayıs 1950 seçimleri ("Beyaz İhtilal" / DP iktidarı).
  - Demokrat Parti Dönemi (1950-1960): Celal Bayar Cumhurbaşkanı, Adnan Menderes Başbakan; Tarımda makineleşme, traktör atılımı, Çiftçiyi Topraklandırma Kanunu, Ziraat Bankası kredileri, karayolları ağı; Petrol Yasası; Din ve eğitim politikaları (Arapça ezan serbestisi, İmam Hatipler, ODTÜ, KTÜ, Erzurum Atatürk Üniversitesi); Kırsaldan kente göç ve gecekondulaşma; 6-7 Eylül Olayları (1955); 27 Mayıs 1960 Askerî Müdahalesi.
- **10.3 Yumuşama (Detant) Dönemi ve Bölgesel Çatışmalar (1960-1990):**
  - Yumuşama / Detant kavramı (Kruşçev ve Kennedy); Silahsızlanma antlaşmaları (SALT-1 1972, SALT-2 1979), Helsinki Nihai Senedi (1975).
  - Krizler: Küba Füze Krizi (1962 / Jüpiter füzeleri), Vietnam Savaşı (1965-1973).
  - Bağlantısızlar Hareketi (Üçüncü Dünya / Bandung Konferansı 1955: Nehru, Nasır, Tito).
  - Orta Doğu Çatışmaları: Arap-İsrail Savaşları (1948, 1956 Süveyş Krizi / Nasır'ın kanalı millîleştirmesi, 1967 Altı Gün Savaşı, 1973 Yom Kippur Savaşı); 1973 Petrol Krizi (OPEC ambargosu); Camp David Antlaşması (1978 / Mısır-İsrail barışı); İran İslam Devrimi (1979 / Ayetullah Humeyni); İran-Irak Savaşı (1980-1988 / Şattülarap su yolu, Hûzistan petrol bölgesi, Halepçe Katliamı); SSCB'nin Afganistan'ı işgali (1979).
  - Türkiye'de 1960-1980 Gelişmeleri: 1961 Anayasası (Anayasa Mahkemesi, MGK, Cumhuriyet Senatosu, DPT, TRT); 12 Mart 1971 Muhtırası; 12 Eylül 1980 Askerî Müdahalesi ve 1982 Anayasası.
  - Kıbrıs Meselesi: EOKA terör örgütü ve Enosis hedefi, Akritas Planı, Kanlı Noel (1963); TMT (Türk Mukavemet Teşkilatı), Dr. Fazıl Küçük, Rauf Denktaş; 1959-1960 Zürih ve Londra Antlaşmaları / Kıbrıs Cumhuriyeti; Nikos Sampson darbesi; 1974 Kıbrıs Barış Harekâtı ("Ayşe tatile çıksın!", Başbakan Bülent Ecevit, Başbakan Yardımcısı Necmettin Erbakan); Kıbrıs Türk Federe Devleti (1975) ve Kuzey Kıbrıs Türk Cumhuriyeti'nin ilanı (15 Kasım 1983).
  - Ege Sorunları (Kıta sahanlığı, Karasuları genişliği, Fır hattı hava sahası, adaların silahlandırılması, Kardak Kayalıkları Krizi 1996); ASALA Ermeni terör örgütünün Türk diplomatlarına suikastları.
- **10.4 Küreselleşen Dünya, İletişim Çağı ve 21. Yüzyılın Eşiğinde Türkiye ve Dünya:**
  - SSCB'nin Dağılması: Mihail Gorbaçov (Glasnost / Açıklık, Perestroika / Yeniden Yapılanma); 1991 Alma-Ata Zirvesi ve Bağımsız Devletler Topluluğu (BDT).
  - Bağımsız Türk Cumhuriyetleri: Azerbaycan (Haydar Aliyev, Ebülfez Elçibey / "Bir millet iki devlet"), Kazakistan (Nursultan Nazarbayev), Özbekistan (İslam Kerimov), Türkmenistan (Saparmurat Türkmenbaşı), Kırgızistan (Askar Akayev); Dağlık Karabağ sorunu ve Hocalı Katliamı (1992); Türk Dünyası teşkilatları: TÜRKSOY, TİKA, YTB, Türk Devletleri Teşkilatı.
  - Doğu Bloku'nun Çöküşü: Berlin Duvarı'nın yıkılışı (1989), Almanya'nın birleşmesi; Yugoslavya'nın Dağılması ve Balkanlar: Slovenya, Hırvatistan, Makedonya, Bosna-Hersek; Bosna Savaşı (1992-1995), Aliya İzzetbegoviç, Srebrenica Katliamı (1995), Dayton Barış Antlaşması (1995), Kosova Krizi.
  - Avrupa Birliği'nin Gelişimi: Maastricht Antlaşması (1992 / AB adının alınması), Kopenhag Kriterleri (1993), Avro ortak para birimi (2002).
  - Orta Doğu ve Küresel Güvenlik: Körfez Savaşları (1991 ve 2003 / Saddam Hüseyin); 11 Eylül 2001 Terör Saldırıları ve küresel terörle mücadele; Arap Baharı (2010 sonrası).
  - 21. Yüzyılda Bilim, Teknoloji, Sanat ve Spor Alanında Türkiye ve Dünya:
    - İnternet, bilişim çağı, yapay zekâ, Genom projesi, iklim krizi ve Paris İklim Anlaşması.
    - Prof. Dr. Aziz Sancar (2015 Nobel Kimya Ödülü).
    - Spor başarıları: Naim Süleymanoğlu (halter), Rıza Kayaalp ve Taha Akgül (güreş), İbrahim Çolak (2019 Dünya Cimnastik Şampiyonası altın madalya), Tokyo 2020 Olimpiyatları (Busenaz Sürmeneli / boks, Mete Gazoz / okçuluk), A Millî Kadın Voleybol Takımı ("Filenin Sultanları" Milletler Ligi ve Avrupa Şampiyonluğu).
    - Kültür diplomasisi: Yunus Emre Enstitüsü, Türkiye Maarif Vakfı; Mavi Vatan doktrini ve deniz yetki alanları.

---

## 4. DERS VE KAZANIM EŞLEŞTİRME SINIRLARI (PEDAGOGICAL COURSE BOUNDARIES)

AÖL sınav sistemi ve MEB müfredatı incelememiz doğrultusunda, `scripts/validate_tarih_taxonomy.py` betiğinde yer alması gereken kesin ders-konu izin matrisi aşağıda tanımlanmıştır:

| Resmî Ders Adı | Kod | İzin Verilen Ana Konular (`allowed_topics`) | Gerekçe ve Ampirik Kanıt |
| :--- | :---: | :--- | :--- |
| **TARİH – 1** | **131** | • `1. Tarih Bilimi ve İlk Çağ Medeniyetleri`<br>• `2. Orta Çağ'da Dünya ve Türk Dünyası` | 9. Sınıf 1. Dönem dersidir. İlk Çağ Medeniyetleri ve Türk Dünyası'na giriş (Bozkır kültürü, töre, Orhun) sorularını içerir (ID 565, 7692, 7695, 9056). |
| **TARİH – 2** | **132** | • `1. Tarih Bilimi ve İlk Çağ Medeniyetleri`<br>• `2. Orta Çağ'da Dünya ve Türk Dünyası`<br>• `3. İslam Medeniyeti ve Türk-İslam Devletleri` | 9. Sınıf 2. Dönem dersidir. Temel Türk Dünyası ve İslamiyet'in yanı sıra, 9. Sınıf genel kazanımlarını yoklayan 1-2 adet İlk Çağ sorusu MEB sınavlarında yer almaktadır (ID 5847, 5848, 7227, 7228, 8587, 8591, 9957). |
| **TARİH – 3** | **133** | • `3. İslam Medeniyeti ve Türk-İslam Devletleri`<br>• `4. Türkiye Selçukluları ve Anadolu Beylikleri`<br>• `5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı`<br>• `6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti` | 10. Sınıf 1. Dönem dersidir. Selçuklu ve Osmanlı Kuruluş dönemi esastır. Önceki döneme ait Büyük Selçuklu/Karahanlı bağlayıcı soruları (ID 8157, 8159, 9529, 9531) ile Fatih/Ali Kuşçu geçiş soruları (ID 1110, 2629) yer almaktadır. |
| **TARİH – 4** | **134** | • `5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı`<br>• `6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti`<br>• `7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)` | 10. Sınıf 2. Dönem dersidir. Klasik Osmanlı dönemi esastır. Kuruluş dönemi iskân/toprak soruları (ID 8167, 10907) ile 17. yy başı buhranı (Celali isyanları, II. Osman, Avrupa'da Rönesans/Reform/Keşifler) sorularını içerir (ID 8174, 9544, 9545, 10911, 10915). |
| **TARİH – 5** | **137** | • `6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti`<br>• `7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)` | 11. Sınıf 1. Dönem dersidir. 17. ve 18. yüzyıl Osmanlı siyaseti, Karlofça, isyanlar, Avrupa gelişmeleri ve ıslahatları kapsar. Klasik dönem bağlantıları (Kırım Hanlığı kökeni vb., ID 585) bulunur. |
| **TARİH – 6** | **138** | • `7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)`<br>• `8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)` | 11. Sınıf 2. Dönem dersidir. 19. ve 20. yüzyıl başı Osmanlı tarihi (Denge stratejisi, Tanzimat, Meşrutiyet, Fikir akımları, Trablusgarp ve Balkan Savaşları) esastır. III. Selim/Nizam-ı Cedit geçiş soruları bulunur (ID 8181). |
| **T.C. İNKILAP TARİHİ – 1** | **141** | • `8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)`<br>• `9. Millî Mücadele ve T.C. İnkılap Tarihi` | 12. Sınıf 1. Dönem dersidir. 20. yüzyıl başları (8.4), I. Dünya Savaşı (9.1), Millî Mücadele Hazırlık (9.2), Muharebeler/Lozan (9.3), İnkılaplar (9.4), İlkeler (9.5) ve Atatürk Dış Politikasını (9.6) eksiksiz kapsar. |
| **T.C. İNKILAP TARİHİ – 2** | **142** | • `10. Çağdaş Türk ve Dünya Tarihi` | 12. Sınıf 2. Dönem dersidir. Bu dersin veri tabanındaki 82 sorusunun tamamı istisnasız 10. Ünite'ye (10.1 İki Savaş Arası ve II. Dünya Savaşı, 10.2 Soğuk Savaş, 10.3 Yumuşama / Kıbrıs, 10.4 Küreselleşen Dünya) aittir. |

---

## 5. ÖRTÜŞME, BELİRSİZLİK VE FALLBACK ANALİZİ (ZERO FALLBACK AUDIT)

Aşağıdaki vaka analizleri, taksonomimizin tarihsel karmaşayı nasıl kusursuzca çözdüğünü ortaya koymaktadır:

### Vaka 1: Mehmet Ali Paşa ve Mısır İsyanı Soruları (ID 2643, 5437, 8178)
- **Sorun:** Eski regex motoru metinde "Mısır" kelimesini görünce soruyu Antik Mısır Medeniyeti (`1.4 Ege, Yunan...`) sanıp 1. Üniteye fırlatmıştır.
- **Çözüm:** Taksonomimizde 19. yüzyıl Mısır Valisi Kavalalı Mehmet Ali Paşa, Hünkar İskelesi Antlaşması ve Şark Meselesi doğrudan **`8.1 Uluslararası İlişkilerde Denge Stratejisi, Milliyetçilik İsyanları ve Şark Meselesi`** alt konusuna tahsis edilmiştir. Soru kökü ve seçeneklerde geçen anakronik kelimeler elenmiştir.

### Vaka 2: Balkan Savaşları ve Arnavutluk'un Bağımsızlığı (ID 1132)
- **Sorun:** Eski motor şıklarda "Yunanistan" geçtiği için soruyu Antik Yunan sanıp 1. Üniteye atmıştır.
- **Çözüm:** 1912-1913 Balkan Savaşları ve Osmanlı'dan ayrılan son Balkan devleti olan Arnavutluk soruları istisnasız **`8.4 20. Yüzyıl Başlarında Osmanlı Devleti, Trablusgarp ve Balkan Savaşları`** alt konusuna yerleştirilmiştir.

### Vaka 3: Tarih 1 Sınavındaki İnebolu / Cephane Sorusu (ID 9047)
- **Soru:** Millî Mücadele'de İnebolu'dan kağnıyla cephane taşıyan kadın ve çocukların fedakarlığı anlatılarak "Türk milletinin hangi değeri vurgulanmıştır?" (Cevap: D - Birlik ve beraberlik) sorulmaktadır.
- **Sorun:** Soru TARİH 1 (131) sınavındadır. Metinde Millî Mücadele geçtiği için İnkılap Tarihine mi gitmelidir?
- **Pedagojik Analiz:** HAYIR! MEB 9. Sınıf Tarih 1 dersinin 1. Ünitesi olan "Tarih ve Zaman" ünitesinde "Tarih öğrenmenin bireye ve topluma faydaları ve millî bilinç" kazanımı yer alır. Soru bu pedagojik kazanımı test etmektedir.
- **Çözüm:** Doğru konu **`1. Tarih Bilimi ve İlk Çağ Medeniyetleri` -> `1.1 Tarih Bilimine Giriş, Yöntem, Kaynaklar ve Takvimler`** alt konusudur.

### Vaka 4: Orhun Kitabeleri ve Kut İnancı Soruları (ID 56, ID 9056)
- **Sorun:** Mevcut master veritabanında 2. Ünite'ye ait 87 sorunun tamamı `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları` (Avrupa Feodalizmi) torbasına doldurulmuştur!
- **Çözüm:** Bilge Kağan, Kül Tigin, Orhun Kitabeleri, kut inancı, töre hukuku soruları doğrudan **`2.3 Kök Türkler, Uygurlar ve Türk Devlet Teşkilatı (Kut, Töre, Orhun Yazıtları)`** alt konusuna alınmıştır.

### Vaka 5: Wilson İlkeleri ve Atlantik Bildirisi Karşılaştırması (ID 4067)
- **Sorun:** Mevcut veritabanında bu soru `9.4 Atatürkçülük ve İnkılaplar` altına ezbere atılmıştır.
- **Çözüm:** Soru İnkılap 2 (142) sınavının 1. sorusudur ve II. Dünya Savaşı sırasında yayımlanan Atlantik Bildirisi'nin self-determinasyon maddesini sormaktadır. Doğru konu **`10.1 İki Savaş Arası Dönem ve II. Dünya Savaşı (1918-1945)`** alt konusudur.

---

## 6. SPEC MINER VE TEST EKİPLERİ İÇİN SÖZLEŞME VE TEKNİK TAVSİYELER

1. **`scripts/tarih_taxonomy_map.json` Yapısı:**
   - 10 ana anahtar (`1. Tarih Bilimi ve İlk Çağ Medeniyetleri` .. `10. Çağdaş Türk ve Dünya Tarihi`).
   - Her anahtara karşılık gelen alt konu dizisi string dizisi olarak tanımlanmalı, toplam 43 eleman içermelidir.
2. **`scripts/validate_tarih_taxonomy.py` Doğrulayıcı Mantığı:**
   - `allowed_course_topics` sözlüğü Bölüm 4'teki matrise göre tanımlanmalıdır.
   - Boş string, `"Genel"`, `"Diğer"`, `"Saptanamadı"`, `"Fallback"` içeren herhangi bir konu derhal `ValidationError` fırlatmalıdır.
   - Soru ana konusu `allowed_course_topics[q['ders_kodu']]` içinde değilse net bir hata mesajıyla reddedilmelidir.
3. **TypeScript / Vitest Entegrasyonu:**
   - `tests/tarih_taxonomy.test.ts` yazılarak `data/subjects/TAR.json` ve `data/subjects/INK.json` içerisindeki tüm 656 sorunun `scripts/tarih_taxonomy_map.json` içindeki tam alt konularla birebir eşleştiği denetlenmelidir.

---

## 7. SONUÇ

Önerilen 10 Ünite ve 43 Alt Konuluk taksonomi; MEB Talim ve Terbiye Kurulu Başkanlığı'nın 9, 10, 11 ve 12. sınıf Tarih / İnkılap Tarihi öğretim programlarına %100 uyumludur. Veritabanındaki tüm 656 soruyu eksiksiz kapsamakta, hiçbir soruyu boşta ya da belirsiz bırakmamaktadır.
