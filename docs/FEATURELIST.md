# Ortaklar AÖL - Özellik Haritası & Yol Haritası (Feature List & Backlog)

Bu belge, **Ortaklar Açık Öğretim Lisesi (AÖL) Dijital Soru Bankası ve Çalışma Platformu**'nun mevcut çekirdek özelliklerini, cebe atılan fikirleri, oyunlaştırma mekaniklerini ve gelecek sürümler için planlanan modülleri içerir.

---

## 📌 1. Mevcut ve Aktif Çekirdek Özellikler (Sürüm 3.6)

### 1.1. Sınav Kitapçığı & Tipografi Deneyimi
- **MEB Orijinal Kitapçık Hissi:** Resmi sınav kitapçığı ciddiyetinde, temiz ve dikkat dağıtmayan serif/sans-serif tipografi.
- **Dinamik Sütun Düzeni (1-4 Sütun):**
  - Tek tıkla 1, 2, 3 ve 4 sütunlu mizanpaj geçişi.
  - Geniş ekranlarda (masaüstü/tablet) çift veya üç sütun, mobilde tek sütun adaptasyonu.
- **Koyu / Mat Gri Tema (Dark Mode):**
  - Gece veya uzun süreli çalışmalarda göz yormayan özel mat kurşun-gri (#18181b / #27272a) palet.
  - Canlı tema anahtarı (Güneş/Ay ikonlu toggle).
- **Kişiselleştirilebilir Vurgu Renkleri:**
  - 6 taktil renk seçeneği: Okyanus Mavisi, Zümrüt Yeşili, Gece İndigosu, Kehribar Sarısı, Gül Kırmızısı, Kurşuni Taş.
  - Kufi amblemi, optik kabarcıklar, puan etiketleri ve buton vurgularında anında canlı değişim ve `localStorage` kalıcılığı.

### 1.2. Külli / Doğal Kapsamlı Soru ve Cevap Arama Motoru 🔍
- **Alan Seçiminden Hemen Sonra En Tepede:**
  - Sayısal / Sözel / Kültür / Tüm Branşlar filtrelemesinden hemen sonra yer alır.
- **Doğal Kapsam Mantığı (Butonsuz & Zahmetsiz):**
  - Ekstra "Bağımsız" veya "Seçili Derste" buton karmaşası tamamen kaldırılmıştır.
  - Öğrenci bir ders kartı seçmişse arama doğrudan o derste ve seçili kademelerinde yapılır; ders seçilmemişse 4.716 sorunun tamamında külli olarak arama yapılır.
  - Aktif ders kartına tekrar tıklanarak seçim tek hamlede kaldırılabilir.
- **Soru Kökü ve Şıklardan Eşleşme (Soru & Cevap):**
  - Arama terimi yalnızca konu adında değil, doğrudan soru metninde veya **A, B, C, D seçeneklerinde** eşleşse dahi tespit edilir.
  - Çekmecede bulunan her sorunun kökü ve eşleşen şıkkı (`💡 Şıkta Geçiyor: B) ...`) sarı fosforlu `<mark>` etiketi ile canlı önizlenir.
- **Tek Tıkla Arama Testini Başlatma:**
  - Eşleşen sorular doğrudan deneme kitapçığına aktarılır veya listedeki soruya tıklanarak o soruya odaklanılır.

### 1.3. Sürüklenebilir Şekil Değiştiren (Morphing) Mikro-Numpad 🧮
- **Ultra Minimalist Boyut & Auto-Sizing Pill:**
  - Ekranda boş ve gereksiz çerçeve alanı kaplamaz.
  - Sayı göstergesi yalnızca yazılan rakamların uzunluğu kadar (`fit-content`) arka plana sahiptir ve aynı zamanda sürükleme tutamacıdır.
- **Şekil Değiştiren (Morphing) 3x4 Tuş Takımı:**
  - **Sayı Modu (Varsayılan):** Ekranda yalnızca 3 sütun x 4 satır numpad bulunur: `7, 8, 9 / 4, 5, 6 / 1, 2, 3 / 0, ,, ⇄`.
  - **İşlem Modu:** Sağ alttaki `⇄` (Change) tuşuna basıldığında tuşlar işlem paneline dönüşür: `+, −, × / ÷, √ (karekök), % / ± (işaret), ⌫ (sil), C (tamamen temizle) / =, ✕ (kırmızı kapatma tuşu), ⇄`.
  - İşlem seçildiğinde otomatik olarak sayı tuşlarına dönerek kesintisiz hesaplama akışı sunar.
- **Klavye & Dokunmatik Entegrasyonu:**
  - Fiziksel klavye desteği (`0-9`, `+`, `-`, `*`, `/`, `Enter`, `Backspace`, `Escape`, `Tab`).

### 1.4. Müfredat, Kredi ve Puan Motoru
- **Resmi MEB AÖL Kredi Entegrasyonu:**
  - Matematik: **6 Kredi**
  - Türk Dili ve Edebiyatı: **5 Kredi**
  - Yabancı Dil (İngilizce): **4 Kredi**
  - Tarih, İnkılap, Coğrafya, Felsefe, Fizik, Kimya, Biyoloji, Din Kültürü: **2 Kredi**
  - Sağlık Bilgisi ve Trafik: **1 Kredi**
- **Dinamik Soru Başına Puan Hesabı:**
  $$\text{Soru Puanı} = \frac{\text{Ders Kredisi}}{\text{Sınavdaki Toplam Soru Adedi}}$$
  *(Örnek: 10 soruluk Matematik testinde 1 doğru = +0.60 Puan; 11 sorulukta = +0.55 Puan).*
- **Her Soru Kartında Canlı Puan Göstergesi:** `.q-point-pill` etiketi ile her sorunun getireceği net puan şeffaf biçimde sunulur.

### 1.5. Akıllı Optik Form & Yan Panel
- **Çift Yönlü Mikro-Senkronizasyon:** Soru kartından şık işaretlendiğinde optik forma, optik formdan işaretlendiğinde soru kartına milisaniyelik yansıma.
- **Puan Tablosu:** Doğru, yanlış, boş ve toplam kazanılan MEB kredi puanı anlık hesaplanır.
- **Geri Al & Sıfırla:** Tek hamlede son işaretlemeyi geri alma ve tüm şıkları temizleme.

### 1.6. Ruh ve Odaklanma Modülü
- **Kufî "El-Alîm" (العليم) Hat Sanatı Amblemi:** Sonsuz ilim sahibi manasında, zarif SVG kufi hat motifi.
- **Canlı Ezan & Vakit Sayacı:** Diyanet hesaplama standartlarında, bulunduğunuz konuma göre bir sonraki namaz vaktine kalan süreyi gösteren minimalist sayaç.

---

## 🚀 2. Gelecek Sürüm Yol Haritası & Cebe Atılan Fikirler

### 2.1. Pusula (İpucu) Sistemi 🧭
- **Doğrudan Cevap Vermeyen Rehber:** Öğrenci tıkandığında doğru şıkkı söylemek yerine sorunun can alıcı püf noktasını (formül, kural, tarihi ipucu) fısıldayan sistem.
- **Oyunlaştırma Dengesi:**
  - İpucu kullanıldığında sorudan kazanılan puan %50'ye düşer veya sınırlı sayıda "Pusula Taşı/Hakkı" harcanır.
  - Soru çözüm kütüphanesi regex/kural tabanlı ipucu çekirdeği ile çalışır.

### 2.2. Yanlış ve Boş Havuzu ("Eksiklerim Kitapçığı") 🎯
- **Kişiselleştirilmiş Eksik Kütüphanesi:** Öğrencinin yanlış yaptığı veya boş bıraktığı sorular otomatik olarak yerel veritabanında (`IndexedDB/localStorage`) toplanır.
- **Telafi Denemesi (Remediation Test):** "Eksiklerimi Çöz" butonu ile sadece geçmişte çözülememiş sorulardan oluşan 10'luk veya 20'lik hedefe yönelik deneme oluşturulur.
- **Öğrenme Döngüsü:** Yanlış yapılan soru sonraki denemelerde doğru çözülene kadar havuzda kalır; doğru çözüldüğünde havuzdan düşer.

---

## 🏆 3. Rekabetçi Oyunlaştırma: Oda, Kupa & Puan Sistemi

### 3.1. Oda Kur & Odaya Katıl (Dershane / Kurs / Arkadaş Grubu)
- **6 Haneli Oda Kodu:** Öğretmen veya bir öğrenci belirli ders ve konulardan (örn. "TDE-3 + TDE-4 Karışık 20 Soru") bir oda oluşturur.
- **Senkronize veya Asenkron Yarış:**
  - *Canlı Sınav:* Herkes aynı anda başlar, süre eşzamanlı akar.
  - *Açık Oda:* 24 saat boyunca odaya katılan herkes testi çözer, liderlik tablosu dinamik güncellenir.
- **Dershane & Kurs Paneli:** Kurs yöneticileri öğrencilerini takip edebilir, sınıfın ortalama doğru/yanlış ve konu başarı oranlarını görür.

### 3.2. Cevap Anahtarı Güvenliği ve Şeffaflık Dengesi ⚖️
- **Problem:** Öğrenciler kaynak koddan veya yerel JSON'dan cevap anahtarını görüp haksız puan/kupa toplayabilir.
- **Çözüm Mimarisi:**
  1. **Yarışma Anında Cevapların Gizlenmesi:** Oda sınavlarında doğru cevaplar istemciye (tarayıcıya) başlangıçta gönderilmez; yalnızca soru kökleri ve şıklar gelir.
  2. **Zaman Damgalı Hash Doğrulama (HMAC / Salted Hash):** Kullanıcı sınavı bitirip "Sınavı Tamamla" butonuna bastığında cevapları sunucuya gönderilir, puanlama sunucuda yapılarak kilit açılır.
  3. **Serbest Çalışma vs. Dereceli Sınav Ayrımı:**
     - *Serbest Antrenman:* Cevaplar ve çözümler anında görünür (puan genel sıralamaya etki etmez).
     - *Dereceli (Ranked) Deneme:* Cevaplar sınav süresi bitene kadar kilitlidir, hile korumalıdır.

### 3.3. Kupa, Kredi & Lig Sistemi (Trophy Road)
- **Bronz → Gümüş → Altın → Platin → Mezun:**
  - Toplanan krediler ve sınav başarıları ile lig atlama.
  - MEB mezuniyet hedefi olan **170 Kredi** hedefine ulaşıldığında sanal "Mezuniyet Diploması ve Rozeti" açılır.
- **Başarı Rozetleri (Badges):**
  - *Matematik Bükücü:* Matematikten art arda 3 denemede %90 üzeri başarı.
  - *Gece Kuşu:* Gece 23:00 - 04:00 arasında odaklanarak test bitirme.
  - *Seri Çözücü:* 7 gün üst üste her gün en az 1 test çözme.

---

## 🧭 4. Stratejik Öğrenci Araçları (Temel Altyapı)

### 4.1. Mezuniyet GPS'i & Kredi Kumbarası (Kredi Optimizasyonu)
- AÖL'de en büyük kafa karışıklığı: *"Kaç kredim var, kaç zorunlu dersim kaldı, hangi dersleri seçersem en hızlı mezun olurum?"*
- Öğrenci mevcut kredi durumunu ve geçtiği dersleri sisteme bir kez girer.
- Algoritma, öğrenciye en yüksek krediyi getirecek ve mezuniyeti en hızlı tamamlatacak **35 Kredilik İdeal Ders Seçim Sepeti**'ni otomatik önerir.
- *(Not: Muafiyet düşme karmaşasına gerek duyulmamıştır; öğrenci muaf olduğu dersi zaten seçmeyecektir).*

### 4.2. 25 Dakika Sınav Kronometresi (Resmi Sınav Simülatörü)
- MEB Açık Lise e-Sınavında her ders için standart **25 dakika** süre verilir.
- Ekranın üst köşesinde geriye sayan, son 5 dakikada hafifçe renk değiştiren resmi sınav sayacı.

### 4.3. Tam Çevrimdışı (Offline PWA) Desteği
- İnternet bağlantısı kesildiğinde dahi 4,716 sorunun tamamına, optik forma ve çözümlere kesintisiz erişim (Service Worker + Cache Storage).

---

## 🗑️ 5. Kullanıcı Geri Bildirimiyle Elenen Fikirler (Discarded)
- ❌ **Soru Üzerine Parmakla Çizim / Scratchpad:** Kullanıcı deneyimi açısından telefon ve tablette parmakla küçük alanda işlem çizimi pratik ve ergonomik bulunmadığı için elendi. Yerine **Sürüklenebilir Minnacık Hesap Makinesi** entegre edildi.
- ❌ **Otomatik Muafiyet Düşürme Algoritması:** Öğrencinin zaten başarısız olduğu ve muaf kaldığı dersi kendisinin seçmeyeceği gerekçesiyle gereksiz sistem yükü ve karmaşasından kaçınılarak elendi.
