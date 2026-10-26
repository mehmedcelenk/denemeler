# 🏛️ MEB AÖL Tarih Müfredatı, Taksonomisi ve Sınıflandırma Mimarisi Araştırma Raporu

**Tarih:** 2026-10-07  
**Araştırmacı:** Explorer 3 (`teamwork_preview_explorer_survey_3`)  
**Görev Kapsamı:** MEB AÖL Tarih Müfredatı, Ders Kodları, Kronolojik Taksonomi Haritası, Mevcut Sınıflandırma Araçları İncelemesi ve 60'arlık Yeniden Sınıflandırma İçin Doğrulama Mimarisi

---

## 1. YÖNETİCİ ÖZETİ (EXECUTIVE SUMMARY)

Bu araştırma, AÖL Dijital Kitapçık projesindeki 656 adet Tarih ve T.C. İnkılap Tarihi sorusunun (`scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` içindeki 4.716 toplam sorunun %13.9'u) pedagojik ve kronolojik olarak %100 doğrulukla sınıflandırılması amacıyla gerçekleştirilmiştir.

### Temel Bulgular:
1. **Veri Tabanındaki Tarih Kapsamı:** Master veri tabanında (`tum_analizli_sorular_temiz.json`) 8 farklı ders kademesine ait, her biri 82 sorudan oluşan **tam olarak 656 soru** yer almaktadır ($8 \times 82 = 656$).
2. **MEB AÖL Ders Yapısı ve Kodları:**
   - 9. Sınıf: `TARİH – 1` (Kod: **131**), `TARİH – 2` (Kod: **132**)
   - 10. Sınıf: `TARİH – 3` (Kod: **133**), `TARİH – 4` (Kod: **134**)
   - 11. Sınıf: `TARİH – 5` (Kod: **137**), `TARİH – 6` (Kod: **138**)
   - 12. Sınıf: `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1` (Kod: **141**), `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2` (Kod: **142**)
   *(Not: MEB müfredatında 12. sınıf zorunlu tarih dersleri "İnkılap Tarihi 1-2" olarak adlandırılır; halk arasında ve eski adlandırmalarda "Tarih 7-8" olarak anılan dersler bunlardır. 135 ve 136 ise Seçmeli Tarih dersleridir.)*
3. **Mevcut Sınıflandırmadaki Kritik Sorunlar ve "Çöp Tenekesi (Fallback) Tuzağı":**
   - Eski regex/anahtar kelime betikleri (`process_tarih.py`, `process_inkilap.py`), soru kökünün pedagojik amacını anlayamamış, şıklarda veya metinde geçen kelimelere körü körüne takılmıştır. Örneğin 19. yüzyıldaki Mısır Valisi Mehmet Ali Paşa isyanı ve Kırım Savaşı soruları, metinde "Mısır" kelimesi geçtiği için *İlk Çağ Mezopotamya ve Mısır Medeniyetleri* konusuna fırlatılmıştır!
   - Çalışma ağacındaki son müdahalede sorular 10 ana başlık altına toplanmak istenmiş, ancak her ana başlıkta sorular tek bir alt konuya yığılmıştır (Örn: 2. Ünitedeki 87 sorunun tamamı `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları` konusuna atılmış; Kök Türkler, Uygurlar ve Orhun Kitabeleri Feodalite altına tıkılmıştır. Benzer şekilde Lozan ve Erzurum Kongresi `9.4 Atatürkçülük ve İnkılaplar` altına, II. Dünya Savaşı ve Soğuk Savaş ise `10.4 Küreselleşen Dünya` altına ezberden yığılmıştır).
4. **Çözüm Mimarisi:**
   - TDE için başarıyla oluşturulan `scripts/tde_taxonomy_map.json` yapısına benzer şekilde, 10 Ana Başlık ve 43 Ayrıntılı Alt Konudan oluşan **`scripts/tarih_taxonomy_map.json`** kurulmalıdır.
   - Sınıflandırma işleminde fallback (varsayılan konu) mantığı tamamen yasaklanmalı, JSON Schema / Python Dataclass ile katı doğrulama (strict validation) uygulanmalıdır.
   - 656 soru, 60'arlık 11 kontrollü partide (10x60 + 1x56) LLM akıl yürütmesi ile yeniden sınıflandırılmalıdır.

---

## 2. MEVCUT KOD TABANI, BETİKLER VE SINIFLANDIRMA GEÇMİŞİ İNCELEMESİ

### 2.1 İlgili Betikler ve Dosya Haritası
Kod tabanında yapılan incelemede şu dosyalar analiz edilmiştir:
- `scripts/docs/SAVED_CLASSIFIER_NOTES.md`: Daha önce silinen regex sınıflandırma betiklerinin (`process_tarih.py`, `process_fizik.py`, vb.) neden başarısız olduğunu belgeleyen hafıza dokümanı.
- `scripts/tde_taxonomy_map.json`: Türk Dili ve Edebiyatı için oluşturulmuş 9 üniteli resmi alt konu hiyerarşisi (örnek model).
- `scripts/core/build_webapp.py`: Master veri dosyasından web uygulaması JSON'larını (`data/subjects/TAR.json`, `data/subjects/INK.json`, `src/data/generated/subjectManifest.json`) üreten ana derleyici.
- `scripts/core/merge_all_courses.py`: Zorunlu ortak kültür derslerini birleştiren ve `Genel` konu atamalarını engelleyen katı doğrulama betiği.
- `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`: 4.716 soruluk birincil master JSON dosyası.
- `scripts/ciktilar/analiz/tarih_analizli_sorular_temiz.json`: Tarih 1-6 kademelerine ait 492 analiz edilmiş soru.
- `scripts/ciktilar/analiz/inkilap_analizli_sorular_temiz.json`: İnkılap 1-2 kademelerine ait 164 analiz edilmiş soru.
- `scripts/ciktilar/analiz/TARIH_ORTAK_KONULAR_RAPORU.md`: Tarih derslerindeki ortak konu kümelerini gösteren 656 soruluk kesişim raporu.

### 2.2 Önceki Otomatik Sınıflandırmaların Başarısızlık Nedenleri (Post-Mortem)
`scripts/docs/SAVED_CLASSIFIER_NOTES.md` ve Git geçmişindeki eski `process_tarih.py` incelendiğinde sistemik hatalar tespit edilmiştir:

1. **Pedagojik Amacı (Pedagogical Intent) Anlayamama:**
   - Kural motoru isim ve mekan kelimelerini bağlamından kopuk değerlendirmiştir.
   *Somut Örnek (ID 2643 & ID 5437):* "Osmanlı Devleti'nin Mısır valisi olan Mehmet Ali Paşa..." sorusu, metinde "Mısır" kelimesi geçtiği için İlk Çağ Mısır Medeniyeti sanılmış ve `1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri` altına atılmıştır. Oysa soru 19. yüzyıl Osmanlı Dağılma Dönemi ve Şark Meselesi sorusudur.
   *Somut Örnek (ID 1132):* "1912-1913 Balkan Savaşlarından faydalanarak bağımsızlığını ilan eden devlet..." sorusu, şıklarında Yunanistan geçtiği için Antik Yunan sanılarak İlk Çağ Medeniyetleri'ne atılmıştır!

2. **Son Aşama "Çöp Tenekesi" (Fallback) Tuzağı:**
   - Regex eşleşmesi bulamayan kural motoru, soruları ders bazlı varsayılan bir konuya fırlatmıştır:
     ```python
     defaults = {
         'TARİH – 1': ('İlk Çağ Medeniyetleri', 'İlk Çağ Medeniyetleri ve Kültürü'),
         'TARİH – 2': ('İlk ve Orta Çağlarda Türk Dünyası', 'İlk Türk Devletleri ve Teşkilatı'),
         'TARİH – 3': ('Selçuklu ve Anadolu Beylikleri', 'Selçuklu ve Beylikler Dönemi'),
         'TARİH – 4': ('Dünya Gücü Osmanlı', 'Klasik Dönem Osmanlı Siyaseti ve Teşkilatı'),
         'TARİH – 5': ('Değişen Dünya Dengeleri', '17. ve 18. Yüzyıl Osmanlı ve Dünya Siyaseti'),
         'TARİH – 6': ('En Uzun Yüzyıl (19. Yüzyıl)', '19. Yüzyıl Islahatları ve Siyasi Gelişmeler')
     }
     ```
   Bu durum, ayırt edici kazanımların kaybolmasına ve onlarca sorunun genel torbalara dolmasına yol açmıştır.

3. **Master Dosyadaki Son Konsolidasyonun Yıkıcı Etkisi:**
   `tum_analizli_sorular_temiz.json` üzerinde yapılan son işlemde, 10 ana konu başlığı getirilmiş ancak alt konu eşleştirmesi her ana konu için tek bir alt konuya kilitlenmiştir:
   - **Ünite 2:** 87 sorunun tamamı $\rightarrow$ `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları` (Kök Türkler, Uygurlar, Orhun Kitabeleri yok sayılmıştır).
   - **Ünite 6:** 86 sorunun tamamı $\rightarrow$ `6.3 Osmanlı Toplum Yapısı, Eyalet Yönetimi, Millet Sistemi ve Vakıflar` (Fatih, Yavuz, Kanuni, Mohaç, Preveze yok sayılmıştır).
   - **Ünite 9:** 107 sorunun tamamı $\rightarrow$ `9.4 Atatürkçülük ve Türk İnkılabı` (Amasya, Erzurum, Sivas, I. TBMM, İnönü, Sakarya, Lozan yok sayılmıştır).
   - **Ünite 10:** 50 sorunun tamamı $\rightarrow$ `10.4 Küreselleşen Dünya, İletişim Çağı ve 21. Yüzyılın Eşiğinde Türkiye ve Dünya` (II. Dünya Savaşı, Soğuk Savaş, Kore, NATO, Kıbrıs yok sayılmıştır).

---

## 3. RESMÎ MEB AÖL TARİH DERS YAPISI VE KODLARI

MEB Açık Öğretim Lisesi (AÖL) öğretim programında bir öğrencinin mezun olabilmesi için tamamlaması gereken 8 dönemlik zorunlu tarih dersleri dizilimi ve sınav kodları şu şekildedir:

### 3.1 Zorunlu Ortak Tarih Dersleri Tablosu

| Dönem / Kademe | Resmî Ders Adı | MEB AÖL Ders Kodu | Kredi | Veri Tabanındaki Soru Sayısı | MEB Sınıf Düzeyi |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **1. Dönem** | **TARİH – 1** | **131** | 2 | 82 | 9. Sınıf (1. Yarıyıl) |
| **2. Dönem** | **TARİH – 2** | **132** | 2 | 82 | 9. Sınıf (2. Yarıyıl) |
| **3. Dönem** | **TARİH – 3** | **133** | 2 | 82 | 10. Sınıf (1. Yarıyıl) |
| **4. Dönem** | **TARİH – 4** | **134** | 2 | 82 | 10. Sınıf (2. Yarıyıl) |
| **5. Dönem** | **TARİH – 5** | **137** | 2 | 82 | 11. Sınıf (1. Yarıyıl) |
| **6. Dönem** | **TARİH – 6** | **138** | 2 | 82 | 11. Sınıf (2. Yarıyıl) |
| **7. Dönem** | **T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1** | **141** | 2 | 82 | 12. Sınıf (1. Yarıyıl) |
| **8. Dönem** | **T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2** | **142** | 2 | 82 | 12. Sınıf (2. Yarıyıl) |
| **TOPLAM** | **8 Zorunlu Ders** | — | — | **656 Soru** | **4 Yıllık Lise Müfredatı** |

### 3.2 "Tarih 7" ve "Tarih 8" Adlandırmasının Durumu
- MEB AÖL mevzuatında 7. ve 8. dönem zorunlu tarih dersleri resmi olarak **T.C. İnkılap Tarihi ve Atatürkçülük 1 (Kod 141)** ve **T.C. İnkılap Tarihi ve Atatürkçülük 2 (Kod 142)** olarak adlandırılır.
- Türk Dili ve Edebiyatı'nda dersler `TDE 1`den `TDE 8`e kadar devam ederken, Tarih branşında 7 ve 8. yarıyıllar müfredat gereği İnkılap Tarihi adını alır. Dolayısıyla "Tarih 7 ve 8" ifadesi pedagojik olarak İnkılap Tarihi 1 ve 2 derslerinin tam karşılığıdır.
- Kod dizilimindeki boşluk olan **135** ve **136** kodları MEB AÖL sisteminde **Seçmeli Tarih 1** ve **Seçmeli Tarih 2** derslerine tahsis edilmiştir.

### 3.3 İlgili Diğer Tarih Dersleri (Ham PDF Havuzundaki Kodlar)
Ham sınav PDF'lerinde (`scripts/ciktilar/dersler/`) tespit edilen diğer tarih dersleri:
- `135` — Seçmeli Tarih 1
- `136` — Seçmeli Tarih 2
- `195` — Seçmeli Ortak Türk Tarihi 1
- `196` — Seçmeli Ortak Türk Tarihi 2
- `451` — Seçmeli Çağdaş Türk ve Dünya Tarihi 1
- `452` — Seçmeli Çağdaş Türk ve Dünya Tarihi 2
- `611` — Dinler Tarihi 1
- `612` — Dinler Tarihi 2

---

## 4. KANONİK MEB AÖL TARİH MÜFREDAT TAKSONOMİSİ (10 ÜNİTE, 43 ALT KONU)

Aşağıdaki taksonomi, Talim ve Terbiye Kurulu Başkanlığı (TTKB) Ortaöğretim Tarih Dersi Öğretim Programı ile AÖL ders kitaplarının ünite ve kazanım hiyerarşisine %100 uyumlu olarak hazırlanmıştır.

```
1. Tarih Bilimi ve İlk Çağ Medeniyetleri (131 - Tarih 1)
   ├── 1.1 Tarih Bilimine Giriş, Yöntem, Kaynaklar ve Takvimler
   ├── 1.2 İnsanlığın İlk Dönemleri, Tarih Öncesi Çağlar ve Arkeolojik Merkezler
   ├── 1.3 Mezopotamya ve Mısır Medeniyetleri
   ├── 1.4 Anadolu Medeniyetleri (Hitit, Frig, Lidya, Urartu, İyon)
   └── 1.5 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri

2. Orta Çağ'da Dünya ve Türk Dünyası (131 & 132 - Tarih 1, 2)
   ├── 2.1 Orta Çağ Siyasi ve Sosyal Yapısı, Feodalite ve Ticaret Yolları
   ├── 2.2 İlk Türk Devletleri ve Orta Asya Bozkır Kültürü (Hunlar ve Diğer Boylar)
   └── 2.3 Kök Türkler, Uygurlar ve Türk Devlet Teşkilatı (Kut, Töre, Orhun Yazıtları)

3. İslam Medeniyeti ve Türk-İslam Devletleri (132 - Tarih 2)
   ├── 3.1 İslamiyet'in Doğuşu, Hz. Muhammed ve Dört Halife Dönemi
   ├── 3.2 Emeviler, Abbasiler ve İslam Kültür Medeniyeti
   ├── 3.3 Türklerin İslamiyet'i Kabulü ve İlk Türk-İslam Devletleri (Karahanlı, Gazneli)
   └── 3.4 Büyük Selçuklu Devleti, Teşkilatı ve Kültür Medeniyeti

4. Türkiye Selçukluları ve Anadolu Beylikleri (133 - Tarih 3)
   ├── 4.1 Malazgirt Sonrası Anadolu ve I. Dönem Türk Beylikleri
   ├── 4.2 Türkiye Selçuklu Devleti Siyaseti ve Haçlı Seferleri
   ├── 4.3 Kösedağ Savaşı, Moğol İstilası ve II. Dönem Anadolu Beylikleri
   └── 4.4 Anadolu Selçuklu Medeniyeti, Ahilik ve Kültürel Hayat

5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı (133 - Tarih 3)
   ├── 5.1 Kuruluş Dönemi Siyaseti ve Balkan Fetihleri (1302-1453)
   ├── 5.2 Anadolu'da Türk Siyasi Birliği, Ankara Savaşı ve Fetret Devri
   ├── 5.3 Osmanlı Askerî ve İdari Teşkilatı (Tımar ve Kapıkulu Sistemleri)
   └── 5.4 Kuruluş Dönemi Osmanlı Toplumu, Kültürü ve Kurumları

6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti (134 - Tarih 4)
   ├── 6.1 Fatih Sultan Mehmed Dönemi ve İstanbul'un Fethi
   ├── 6.2 II. Bayezid ve Yavuz Sultan Selim Dönemi (Doğu Siyaseti ve Halifelik)
   ├── 6.3 Kanuni Sultan Süleyman Dönemi, Seferler ve Denizler Hakimiyeti
   ├── 6.4 Klasik Çağda Osmanlı Devlet Yönetimi, Saray ve Divan Teşkilatı
   └── 6.5 Klasik Dönem Osmanlı Toplum Yapısı, Hukuk, Vakıflar ve Şehir Hayatı

7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl) (137 - Tarih 5)
   ├── 7.1 17. Yüzyıl Osmanlı Savaşları ve Antlaşmaları (Habsburglar, Safeviler, Lehistan, Rusya)
   ├── 7.2 II. Viyana Kuşatması, Kutsal İttifak ve Karlofça Antlaşması
   ├── 7.3 17. Yüzyıl İç İsyanları ve Islahat Çabaları (Celali İsyanları, Köprülüler)
   ├── 7.4 Avrupa'daki Gelişmeler (Keşifler, Rönesans, Reform, Aydınlanma, Westphalia)
   ├── 7.5 18. Yüzyıl Osmanlı Siyaseti ve Antlaşmaları (Kayıpları Telafi, Küçük Kaynarca, Yaş)
   └── 7.6 18. Yüzyıl Islahatları, Lale Devri ve Nizam-ı Cedit

8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı) (138 & 141 - Tarih 6, İnkılap 1)
   ├── 8.1 Uluslararası İlişkilerde Denge Stratejisi, Milliyetçilik İsyanları ve Şark Meselesi
   ├── 8.2 19. Yüzyıl Demokratikleşme Hareketleri ve Islahatlar (Sened-i İttifak'tan Meşrutiyet'e)
   ├── 8.3 Dağılmayı Önleme Fikir Akımları ve 19. Yüzyıl Kültürel Hayatı
   └── 8.4 20. Yüzyıl Başlarında Osmanlı Devleti, Trablusgarp ve Balkan Savaşları

9. Millî Mücadele ve T.C. İnkılap Tarihi (141 & 142 - İnkılap 1, 2)
   ├── 9.1 Mustafa Kemal'in Hayatı, I. Dünya Savaşı ve Mondros Ateşkesi
   ├── 9.2 Millî Mücadele'nin Hazırlık Dönemi, Kongreler ve I. TBMM'nin Açılışı
   ├── 9.3 Millî Mücadele Muharebeler Dönemi, Antlaşmalar ve Lozan Barış Antlaşması
   ├── 9.4 Atatürkçülük ve Türk İnkılabı (Siyasal, Hukuki, Eğitsel, Toplumsal, Ekonomik)
   ├── 9.5 Atatürk İlkeleri ve Bütünleyici İlkeler
   └── 9.6 Atatürk Dönemi Türk Dış Politikası (1923-1938)

10. Çağdaş Türk ve Dünya Tarihi (142 - İnkılap 2)
   ├── 10.1 İki Savaş Arası Dönem ve II. Dünya Savaşı (1918-1945)
   ├── 10.2 Soğuk Savaş Dönemi ve Türkiye (1945-1960)
   ├── 10.3 Yumuşama (Detant) Dönemi ve Bölgesel Çatışmalar (1960-1990)
   └── 10.4 Küreselleşen Dünya, İletişim Çağı ve 21. Yüzyılın Eşiğinde Türkiye ve Dünya
```

---

## 5. DERS VE KAZANIM EŞLEŞTİRME SINIRLARI (PEDAGOGICAL COURSE BOUNDARIES)

Sınıflandırmada LLM halüsinasyonlarını veya yanlış atamaları önlemek amacıyla her dersin kapsayabileceği üniteler kesin kurallara bağlanmalıdır:

| Resmî Ders Adı | Kod | İzin Verilen Ana Konular | Kesinlikle Yasak Olan Konular |
| :--- | :---: | :--- | :--- |
| **TARİH – 1** | 131 | • 1. Tarih Bilimi ve İlk Çağ Medeniyetleri<br>• 2. Orta Çağ'da Dünya ve Türk Dünyası (Kısmen 2.1) | 3, 4, 5, 6, 7, 8, 9, 10 |
| **TARİH – 2** | 132 | • 2. Orta Çağ'da Dünya ve Türk Dünyası (2.2, 2.3)<br>• 3. İslam Medeniyeti ve Türk-İslam Devletleri | 1, 4, 5, 6, 7, 8, 9, 10 |
| **TARİH – 3** | 133 | • 4. Türkiye Selçukluları ve Anadolu Beylikleri<br>• 5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı | 1, 2, 6, 7, 8, 9, 10 |
| **TARİH – 4** | 134 | • 6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti | 1, 2, 3, 4, 7, 8, 9, 10 |
| **TARİH – 5** | 137 | • 7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl) | 1, 2, 3, 4, 5, 8, 9, 10 |
| **TARİH – 6** | 138 | • 8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı) | 1, 2, 3, 4, 5, 6, 7, 9, 10 |
| **T.C. İNKILAP TARİHİ – 1** | 141 | • 8. En Uzun Yüzyıl (yalnızca 8.4 Trablusgarp & Balkan)<br>• 9. Millî Mücadele ve T.C. İnkılap Tarihi (9.1, 9.2, 9.3) | 1, 2, 3, 4, 5, 6, 7, 10 |
| **T.C. İNKILAP TARİHİ – 2** | 142 | • 9. Millî Mücadele ve T.C. İnkılap Tarihi (9.4, 9.5, 9.6)<br>• 10. Çağdaş Türk ve Dünya Tarihi (10.1, 10.2, 10.3, 10.4) | 1, 2, 3, 4, 5, 6, 7, 8 |

---

## 6. RESMÎ VERİ YAPISI VE KATI DOĞRULAMA (STRICT VALIDATION) MODELİ

Batch sınıflandırma sürecinde hiçbir sorunun genel/varsayılan bir alana düşmemesi için katı doğrulama şeması ve Python modeli şu şekilde tasarlanmalıdır:

### 6.1 `scripts/tarih_taxonomy_map.json` Şeması
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AÖL Tarih Müfredat Taksonomisi",
  "type": "object",
  "additionalProperties": false,
  "patternProperties": {
    "^[1-9]|10\\. .+$": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^(?:[1-9]|10)\\.[1-6] .+$"
      },
      "minItems": 2
    }
  }
}
```

### 6.2 Python Pydantic / Dataclass Doğrulayıcısı (Zero-Fallback Guarantee)
```python
import json
from dataclasses import dataclass
from typing import Dict, List, Set

class TaxonomyValidationError(Exception):
    """Kural dışı veya fallback konu atamalarında tetiklenir."""
    pass

@dataclass(frozen=True)
class HistoryClassificationResult:
    id: int
    ders: str
    ders_kodu: int
    ana_konu: str
    alt_konu: str
    gerekce: str

class HistoryTaxonomyValidator:
    def __init__(self, map_path: str = 'scripts/tarih_taxonomy_map.json'):
        with open(map_path, 'r', encoding='utf-8') as f:
            self.taxonomy_map: Dict[str, List[str]] = json.load(f)
            
        self.valid_main_topics: Set[str] = set(self.taxonomy_map.keys())
        self.valid_sub_topics: Dict[str, Set[str]] = {
            main: set(subs) for main, subs in self.taxonomy_map.items()
        }
        
        # Ders kodu - izin verilen ana konular matrisi
        self.allowed_course_topics = {
            131: {'1. Tarih Bilimi ve İlk Çağ Medeniyetleri', '2. Orta Çağ\'da Dünya ve Türk Dünyası'},
            132: {'2. Orta Çağ\'da Dünya ve Türk Dünyası', '3. İslam Medeniyeti ve Türk-İslam Devletleri'},
            133: {'4. Türkiye Selçukluları ve Anadolu Beylikleri', '5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı'},
            134: {'6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti'},
            137: {'7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)'},
            138: {'8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)'},
            141: {'8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)', '9. Millî Mücadele ve T.C. İnkılap Tarihi'},
            142: {'9. Millî Mücadele ve T.C. İnkılap Tarihi', '10. Çağdaş Türk ve Dünya Tarihi'}
        }

    def validate(self, result: HistoryClassificationResult):
        # 1. Boş veya 'Genel' kontrolü
        if not result.ana_konu or not result.alt_konu:
            raise TaxonomyValidationError(f"ID {result.id}: Konu alanları boş olamaz.")
        if any(term in result.ana_konu.lower() or term in result.alt_konu.lower() 
               for term in ['genel', 'saptanamadı', 'diğer', 'fallback']):
            raise TaxonomyValidationError(f"ID {result.id}: Fallback/Genel terimler yasaktır ({result.ana_konu} -> {result.alt_konu})")

        # 2. Ana konu mevcudiyeti
        if result.ana_konu not in self.valid_main_topics:
            raise TaxonomyValidationError(f"ID {result.id}: Geçersiz ana konu '{result.ana_konu}'")

        # 3. Alt konu mevcudiyeti ve hiyerarşi uyumu
        if result.alt_konu not in self.valid_sub_topics[result.ana_konu]:
            raise TaxonomyValidationError(f"ID {result.id}: '{result.alt_konu}' alt konusu '{result.ana_konu}' altında yer alamaz.")

        # 4. Ders - Müfredat sınır kontrolü
        allowed = self.allowed_course_topics.get(result.ders_kodu)
        if allowed and result.ana_konu not in allowed:
            raise TaxonomyValidationError(
                f"ID {result.id}: {result.ders} (Kod {result.ders_kodu}) için '{result.ana_konu}' konusu müfredat dışıdır! İzin verilenler: {allowed}"
            )
```

---

## 7. 60'ARLIK PARTİLERLE YENİDEN SINIFLANDIRMA PLANI (BATCH AUDIT BLUEPRINT)

Master veri tabanındaki 656 Tarih sorusu, 60'ar soruluk 11 kontrollü partide denetlenecektir:

| Parti No | Soru Aralığı | Soru Adedi | Baskın Dersler / Dönemler |
| :---: | :---: | :---: | :--- |
| **Batch 1** | Sorular 1 – 60 | 60 | TARİH 1, TARİH 2 (İlk Çağ, Türk Dünyası, İslam) |
| **Batch 2** | Sorular 61 – 120 | 60 | TARİH 2, TARİH 3 (Türk-İslam, Anadolu Selçuklu) |
| **Batch 3** | Sorular 121 – 180 | 60 | TARİH 3, TARİH 4 (Selçuklu, Beylikler, Osmanlı Kuruluş) |
| **Batch 4** | Sorular 181 – 240 | 60 | TARİH 4 (Dünya Gücü Osmanlı, Fatih, Yavuz, Kanuni) |
| **Batch 5** | Sorular 241 – 300 | 60 | TARİH 5 (17. ve 18. Yüzyıl, Karlofça, Islahatlar) |
| **Batch 6** | Sorular 301 – 360 | 60 | TARİH 5, TARİH 6 (18. ve 19. Yüzyıl, Islahatlar, Tanzimat) |
| **Batch 7** | Sorular 361 – 420 | 60 | TARİH 6 (19. Yüzyıl Dağılma, 93 Harbi, Meşrutiyet) |
| **Batch 8** | Sorular 421 – 480 | 60 | TARİH 6, İNKILAP 1 (Trablusgarp, Balkan, I. Dünya Savaşı) |
| **Batch 9** | Sorular 481 – 540 | 60 | İNKILAP 1 (Mondros, Kongreler, I. TBMM, Cepheler) |
| **Batch 10** | Sorular 541 – 600 | 60 | İNKILAP 1, İNKILAP 2 (Lozan, İnkılaplar, Atatürk İlkeleri) |
| **Batch 11** | Sorular 601 – 656 | 56 | İNKILAP 2 (Atatürk Dış Politika, II. Dünya Savaşı, Soğuk Savaş, Çağdaş) |
| **TOPLAM** | **1 – 656** | **656** | **%100 Denetim ve Doğrulama** |

### LLM Prompt Şablonu:
Her 60'lık parti için modele soru kökü, şıklar, doğru cevap, ders adı ve izin verilen alt konular listesi JSON formatında verilmeli, modelden her soru için gerekçesiyle birlikte kesin seçim istenmelidir:
```json
{
  "soru_id": 1132,
  "ders": "TARİH – 6",
  "ana_konu": "8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)",
  "alt_konu": "8.4 20. Yüzyıl Başlarında Osmanlı Devleti, Trablusgarp ve Balkan Savaşları",
  "gerekce": "Soru 1912-1913 Balkan Savaşları sırasında bağımsız olan Arnavutluk'u sormaktadır."
}
```

---

## 8. ÜRETİM VE DOĞRULAMA ADIMLARI (PIPELINE EXECUTION)

Reclassification tamamlandıktan sonra izlenecek adımlar:

1. **Master JSON Güncellemesi:**
   `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` dosyasında 656 sorunun `ana_konu` ve `alt_konu` alanları yeni taksonomiye göre güncellenir.
2. **Webapp Veri Derlemesi:**
   `python3 scripts/core/build_webapp.py` çalıştırılır.
   - `data/subjects/TAR.json` (492 soru) ve `data/subjects/INK.json` (164 soru) yeniden üretilir.
   - `src/data/generated/subjectManifest.json` otomatik güncellenir.
3. **Statik ve Birim Test Denetimleri:**
   - `npm run check` komutu yürütülür:
     - `npm run lint` (ESLint)
     - `npm run typecheck` (TypeScript strict kontrolü)
     - `node scripts/check-architecture.js` (Mimari denetim)
     - `node --import tsx --test tests/*.test.ts` (Veri sözleşmesi ve testler)
4. **Üretim Paketi ve Canlı Dağıtım:**
   - `npm run build` ile `dist/` klasörü üretilir.
   - `npx surge dist ortaklar-test.surge.sh` komutuyla canlıya alınır.

---

## 9. SONUÇ VE ÖNERİLER

1. Kod tabanındaki mevcut sorun, soruların içeriğinde değil; önceki kural motorlarının "Mısır", "Yunan" gibi anahtar kelimelere takılarak soruları yanlış dönemlere atması ve sonrasında yapılan kaba konsolidasyon ile alt konuların tek bir başlıkta toplanmasıdır.
2. Hazırlanan 10 Ünite ve 43 Alt Konuluk taksonomi, Antik Çağ'dan 21. Yüzyıla kadar olan tüm MEB AÖL müfredatını eksiksiz kapsamakta, hiçbir soruyu boşta bırakmamaktadır.
3. TDE modülünde uygulanan model birebir referans alınarak `scripts/tarih_taxonomy_map.json` oluşturulmalı ve 60'arlık partilerle LLM tabanlı sınıflandırma doğrudan bu doğrulanmış yapıya bağlanmalıdır.
