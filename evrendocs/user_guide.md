
# 1. Başlarken

*Platforma ilk giriş, hızlı başlangıç akışı, arayüz tanıtımı ve temel kavramlar.*

## 1.1. Platforma Giriş

### e-Devlet ile Giriş

Ana sayfadaki "e-Devlet ile Giriş" butonuna tıklayın. Türkiye Cumhuriyeti e-Devlet kapısına yönlendirileceksiniz. TC Kimlik No ve şifrenizle oturum açtıktan sonra otomatik olarak EVREN'e yönlendirilirsiniz. İlk girişte hesabınız otomatik oluşturulur.

> **İpucu:** e-Devlet girişi TCKN doğrulaması sağlar ve hesabınızı otomatik olarak "doğrulanmış" statüsüne getirir.

### KVKK ve Üyelik Sözleşmesi

İlk kayıt sırasında KVKK Aydınlatma Metni ve Üyelik Sözleşmesi onay adımlarını tamamlamanız gerekir. Her iki sözleşmeyi de okuyup onay kutusunu işaretledikten sonra kayıt tamamlanır.

### İlk Giriş Sonrası

Başarılı giriş sonrasında Gösterge Paneli'ne yönlendirilirsiniz. İlk girişinizde 1000 CR hoş geldin bonusu otomatik olarak hesabınıza tanımlanır. Sol menüden tüm platform özelliklerine erişebilirsiniz.

## 1.2. Hızlı Başlangıç

### Uçtan Uca İlk Model Akışı

EVREN'de ilk modelinizi yetiştirmek için şu adımları izleyin: Kayıt (e-Devlet + KVKK) → Gösterge Paneli'ne ulaşın → Yeni Veri Seti oluşturun (modalite + ad) → Görselleri yükleyin → Sınıf etiketleri ekleyin → Etiketleme çalışma alanında etiketleyin → Versiyon oluşturun → Yeni Proje açıp veri setini bağlayın → Eğitim başlatın (mimari + tier seçimi) → Sonuçları izleyin → Model detayını inceleyin → Çıkarım yapın.

> **İpucu:** Bu akışın her adımı ilerleyen bölümlerde detaylı anlatılmaktadır.

## 1.3. Arayüz Tanıtımı

### Sol Menü (Sidebar)

Sol taraftaki menü tüm platform özelliklerine erişim sağlar. 5 grup altında düzenlenmiştir: Ana Menu (Gösterge Paneli, Veri Setleri, Modeller, Projeler), Atölye (Eğitim, Çıkarım, Deneyler), Keşfet (Keşif Merkezi, Liderlik Tablosu), Araçlar (Katkılarım, Sorun Panosu, Koleksiyonlar, Webhook'lar), Yönetim (Mesajlar, Bildirimler, Organizasyon, Kredi Merkezi, API Anahtarları, Ayarlar).

### Üst Çubuk (Header)

Üst çubukta breadcrumb navigasyonu (bulunduğunuz sayfa yolu), kredi bakiyeniz (100 CR altında kırmızıya döner), mesaj çanı (Chat Drawer), bildirim zili (kırmızı rozet ile okunmamış sayısı) ve kullanıcı menüsü bulunur. Kredi rozeti tıklanarak Kredi Merkezi'ne gidilir.

### Komut Paleti (Ctrl+K)

Herhangi bir sayfadayken Ctrl+K tuşuna basarak Komut Paleti'ni açabilirsiniz. Hızlıca sayfa navigasyonu yapabilir ve platform içi işlemleri arayabilirsiniz. Arama sonuçları anlık güncellenir.

> **İpucu:** Komut Paleti sadece sayfa navigasyonu sağlar; veri seti/model arama için Keşif Merkezi'ni kullanın.

### Tema Değiştirme

Sağ üstteki kullanıcı menüsünden veya Ayarlar sayfasının Görünüm sekmesinden açık/koyu tema arasında geçiş yapabilirsiniz. Tema tercihiniz kaydedilir ve sonraki girişlerde korunur.

## 1.4. Temel Kavramlar

### 3 Temel Varlık

EVREN üç bağımsız varlık etrafında döner: Veri Seti (verileriniz, etiketleriniz, versiyonlarınız), Model (eğitilmiş yapay zeka modelleri) ve Proje (veri setlerini ve modelleri birleştiren çalışma alanı). Veri setleri ve modeller bağımsızdır — bir projeye bağlamadan da kullanılabilir.

### Kredi Sistemi Özeti

GPU eğitimi ve çıkarım işlemleri kredi (CR) ile ücretlendirilir. Kademeli GPU fiyatlandırması uygulanır; güncel kademeler ve saatlik fiyatlar Kredi Merkezi'ndeki Hesaplayıcı sekmesinde gösterilir. Platform kullanımıyla (etiketleme, paylaşım, katkı) kredi kazanılır. Detaylar Kredi Sistemi bölümünde anlatılmaktadır.

### Slug ve Erişim

Her veri seti ve model benzersiz bir slug'a sahiptir (ör: kullanici-adi/veri-seti-adi). Public varlıklar herkes tarafından görüntülenebilir; private varlıklar yalnızca sahibi ve üyeleri tarafından erişilebilir.

### Versiyon → Eğitim → Model Akışı

Eğitim başlatmak için veri setinizde dondurulmuş bir versiyon gerekir. Versiyon oluşturmak mevcut verilerin anlık görüntüsünü alır ve otomatik olarak dondurulur. Eğitim tamamlandığında model otomatik olarak oluşturulur — manuel model oluşturma desteklenmez.


# 2. Gösterge Paneli

*Platformdaki tüm aktivitelerinizin ve altyapı durumunun özeti.*

## 2.1. Genel Bakış Kartları

### İstatistik Kartları

Sayfanın üstünde 6 kart bulunur: Veri Setleri (toplam sayı), Veri Ögeleri (yüklenen dosyalar), Etiketler (oluşturulan anotasyonlar), Modeller (eğitilen modeller), Projeler (açılan projeler), Kredi (mevcut bakiyeniz). Her kart animasyonlu sayaç ile güncellenir.

### Etiketleme İlerlemesi

Tüm veri setlerinizdeki etiketlenmiş öge oranını gösteren ilerleme çubuğu. Yeşilden başlayan gradient bar ile görsel olarak ilerlemenizi takip edebilirsiniz.

## 2.2. GPU ve Kuyruk Durumu

### Eğitim GPU Kümesi

64 adet H200 GPU'nun canlı durumunu gösterir. Her GPU bir kare ile temsil edilir: kırmızı (>%80 kullanım), turuncu (%40-80), yeşil (<%40), gri (boş). 8 düğümün her biri 8 GPU barındırır. Meşgul GPU sayısı, boş GPU sayısı, aktif iş sayısı ve kuyruk uzunluğu üst kartlarda gösterilir.

### Eğitim Kuyruk Durumu

Aktif eğitim işlerinin ilerleme çubukları ile gösterildiği panel. Her iş için mimari adı (YOLOv8, YOLO26 vb.), GPU sayısı, geçen süre, tamamlanma yüzdesi, epoch ilerlemesi ve tahmini kalan süre görüntülenir. Kuyrukta bekleyen işler sıra numarası, bekleme süresi ve tahmini başlangıç zamanı ile listelenir.

> **İpucu:** "Şimdi iş gönderirsen" göstergesi, yeni bir eğitim başlatırsanız tahmini ne kadar bekleyeceğinizi gösterir.

### Çıkarım Sunucusu

8 adet A6000 GPU'nun çıkarım sunucusu durumunu gösterir. Yüklü model sayısı, toplam çıkarım sayısı ve GPU kullanım durumları gerçek zamanlı izlenir.

## 2.3. Bildirimler ve Aktivite

### Son Bildirimler

En son 8 bildiriminiz gösterilir. Okunmamış bildirimler kırmızı rozet ile sayısal olarak işaretlenir. Tüm bildirimleri görmek için Bildirimler sayfasına gidin.

### Aktivite Akışı

Son aktiviteleriniz kronolojik sırada listelenir: veri seti oluşturma, etiketleme, model eğitimi, fork işlemleri vb.


# 3. Veri Setleri

*Veri seti oluşturma, dosya yükleme, sınıf yönetimi, versiyonlama, sağlık skoru ve dışa aktarım.*

## 3.1. Veri Seti Oluşturma

### Yeni Veri Seti — 2 Adımlı Sihirbaz

Sol menüden "Veri Setleri" sayfasına gidin. Sağ üstteki "Yeni Veri Seti" butonuna tıklayın. İlk adımda modalite seçimi yapın: VISION (görüntü/video), AUDIO (ses), NLP (metin) veya MULTIMODAL (karma). İkinci adımda isim, açıklama, görünürlük (Public/Private), lisans (CC-BY-4.0, MIT, Apache-2.0 vb.) ve etiketler (tags, max 10) girin. Slug otomatik oluşturulur.

> **İpucu:** Public veri setleri keşif merkezinde görünür ve paylaşım kredi kazandırır (+5 CR).

### Görünürlük Ayarları

Private: Yalnızca siz ve eklediğiniz üyeler görebilir. Public: Herkes görüntüleyebilir, sadece siz ve üyeler düzenleyebilir. Görünürlük daha sonra veri seti ayarlarından değiştirilebilir.

## 3.2. Dosya Yükleme

### Sürükle-Bırak Yükleme

Veri seti detay sayfasında "Yükle" butonuna tıklayın veya dosyaları doğrudan sürükleyip bırakın. Desteklenen formatlar modaliteye göre değişir: VISION — jpg, jpeg, png, webp, bmp, tiff, gif, mp4, avi, mov, webm, mkv; AUDIO — wav, mp3, flac, ogg, aac; NLP — txt, json, csv, pdf; MULTIMODAL — tüm formatlar. Maksimum dosya boyutu: 500 MB/dosya.

### Yükleme Detayları

Dosyalar presigned URL ile doğrudan MinIO depolamaya yüklenir. Eş zamanlı 4 dosya paralel yüklenir (büyük dosyalar için 2). Yükleme sırasında hız (MB/s), geçen süre ve ilerleme çubuğu gösterilir. Küçük resimler (thumbnail) yükleme tamamlandığında otomatik oluşturulur.

### Yinelenen Kontrolü

Yükleme modalında "Yinelenen Kontrolü" seçeneği bulunur (varsayılan kapalı). Açıldığında tarayıcıda SHA-256 hash hesaplanır ve sunucuda mevcut eşleşme kontrol edilir. Toplu yükleme içinde aynı dosyanın birden fazla olması durumunda kullanıcı uyarılır; veri setinde zaten var olan dosyalar sessizce atlanır.

## 3.3. İçe Aktarım

### Desteklenen İçe Aktarım Formatları

"İçe Aktar" butonuyla etiketli veri setlerini ZIP dosyası olarak yükleyebilirsiniz. Format otomatik algılanır: YOLO Detection, YOLO Segmentation, YOLO OBB, COCO JSON (poligon ve RLE maskeler poligona çevrilir), Pascal VOC XML (labelImg, CVAT), sınıf klasörleri (sınıflandırma), DICOM seri ve etiketsiz düz dosyalar. Maksimum ZIP boyutu: 30 GB.

### Pascal VOC (labelImg) ZIP Yapısı

Her görsel için bir XML dosyası bulunmalıdır (ör. img001.jpg ve img001.xml). Görseller ve XML'ler aynı klasörde ya da JPEGImages/Annotations gibi ayrı klasörlerde olabilir; eşleşme XML'deki <filename> değeri ile ZIP'teki görsel adı üzerinden yapılır (büyük/küçük harf duyarsız), eşleşmeyen görsel atlanır. Kutular <size> içindeki width/height değerlerine göre ölçeklendiği için bu alan dolu olmalıdır. <object> içindeki <name> sınıf olarak, <bndbox> sınırlayıcı kutu olarak aktarılır; sınıflar yoksa otomatik oluşturulur. İsteğe bağlı ImageSets/Main/train.txt, val.txt ve test.txt dosyaları küme atamasında kullanılır. Nesnesi olmayan XML, görseli "etiketsiz (boş)" olarak işaretler.

```
veri.zip
├── JPEGImages/
│   ├── img001.jpg
│   └── img002.jpg
├── Annotations/
│   ├── img001.xml
│   └── img002.xml
└── ImageSets/Main/   (isteğe bağlı)
    ├── train.txt
    └── val.txt
```

### İçe Aktarım Süreci

NDJSON ile akış tabanlı ilerleme gösterilir: işlenen dosya sayısı, oluşturulan etiket sayısı, atlanan duplikat sayısı gerçek zamanlı güncellenir. İşlem tamamlandığında detaylı sonuç özeti sunulur.

## 3.4. Sınıf Etiketleri

### Sınıf Ekleme

Veri seti detay sayfasında "Sınıflar" sekmesine gidin. "Sınıf Ekle" butonuyla yeni sınıf oluşturun. Her sınıfa isim ve renk atayın. Renkler etiketleme aracında görsel ayrım sağlar.

### Sınıf Sıralama

Sınıfları sürükle-bırak ile yeniden sıralayabilirsiniz. Sıralama, dışa aktarımda ve yeni eğitimlerde sınıf indekslerini belirler (YOLO formatında 0, 1, 2...). Daha önce eğitilmiş modeller etkilenmez.

### Sınıf Düzenleme ve Silme

Sınıf adını veya rengini değiştirmek için sınıf kartındaki düzenleme ikonuna tıklayın. Silmek için çöp kutusu ikonunu kullanın. Silinen sınıfa ait etiketler de silinir.

## 3.5. Veri Ögeleri Yönetimi

### Listeleme ve Filtreleme

Veri ögeleri galeri veya liste görünümünde gösterilir. Filtreler: etiketli/etiketsiz, split (train/val/test), sınıf adı, atanmış kullanıcı, durum (UNASSIGNED, LABELING, IN_REVIEW, APPROVED, REJECTED).

### Veri Ögesi Önizleme

Bir ögeye tıkladığınızda önizleme modalı açılır. Zoom ve pan ile detaylı inceleme yapabilir, mevcut etiketlerin overlay'ini görebilirsiniz.

### Split Yönetimi

Her veri ögesi train, val veya test split'ine atanır. Seçili ögelerin split'ini toplu olarak değiştirebilirsiniz. "Otomatik Split" butonu ile oranlar ayarlanabilir slider'lar üzerinden dağıtım yapılır (varsayılan %70/%20/%10, ancak dilediğiniz gibi değiştirebilirsiniz).

### Toplu İşlemler

Birden fazla öge seçip toplu silme, toplu split değiştirme veya toplu durum değiştirme yapabilirsiniz. Silme işlemi soft-delete uygular.

## 3.6. Sağlık Skoru

### Sağlık Değerlendirmesi

Her veri setinin A-F arası bir sağlık notu vardır. Sağlık skoru 3 bileşenden hesaplanır: Tamamlanma oranı (%40 ağırlık — etiketli öge oranı), Etiket dengesi (%30 ağırlık — sınıflar arası dağılım), Kalite (%30 ağırlık — onay/ret oranı). Veri seti kartlarında sağlık rozeti görünür.

## 3.7. Duplikat Tespiti

### Duplikat Tarama

"Duplikatlar" sekmesinden SHA-256 hash (birebir eşleşme) ve perceptual hash (benzer görüntü) ile duplikat tarama başlatabilirsiniz. Sonuçlar öncelik skoruna göre sıralanır. Tespit edilen grupları toplu olarak temizleyebilirsiniz.

## 3.8. Versiyonlama

### Versiyon Oluşturma

"Versiyonlar" sekmesinde "Yeni Versiyon" butonuna tıklayın. Versiyon etiketi girin (ör: v1.0). Versiyon, mevcut veri ögelerinin ve etiketlerin anlık görüntüsünü alır ve otomatik olarak dondurulur (frozen). Eğitim başlatmak için dondurulmuş bir versiyon zorunludur.

> **İpucu:** Her eğitim işi bir dondurulmuş versiyona bağlıdır. Versiyon oluşturmadan eğitim başlatılamaz.

### Versiyon Karşılaştırma

İki versiyonu karşılaştırarak eklenen/çıkarılan ögeleri ve etiket değişikliklerini görebilirsiniz.

### Versiyona Geri Dönme

Önceki bir versiyona geri dönmek için "Rollback" butonunu kullanın. Bu işlem mevcut durumu seçili versiyonun anlık görüntüsüne döndürür.

## 3.9. Dışa Aktarım

### Desteklenen Dışa Aktarım Formatları

10 desteklenen format: YOLO TXT (Detection), YOLO Segmentation, YOLO OBB, YOLO Pose, YOLO PyTorch (dataset.yaml + images + labels), COCO JSON, Pascal VOC XML, Darknet TXT, CreateML JSON, CSV. Dışa aktarım belirli bir versiyon üzerinden yapılır.

### Dışa Aktarım Başlatma

Versiyonlar sekmesinden ilgili versiyonun "Dışa Aktar" butonuna tıklayın. Format ve görev tipini seçin. ZIP dosyası arka planda hazırlanır ve hazır olduğunda indirme bağlantısı sunulur. Dışa aktarım maliyeti: 0.50 CR/çağrı.

## 3.10. İşbirliği

### Üye Ekleme

Veri seti ayarlarından "Üyeler" sekmesine gidin. Kullanıcı adı veya e-posta ile arama yaparak üye ekleyin. Roller: Viewer (salt okunur), Labeler (etiketleme), Editor (düzenleme), Admin (tam yetki).

### Fork (Çatallama)

Başka birinin public veri setini fork'layarak kendi kopyanızı oluşturabilirsiniz. Fork işlemi tüm veri ögelerini ve etiketleri kopyalar.

### Birleştirme Talebi (Merge Request)

Fork'ladığınız veri setindeki değişiklikleri orijinal veri setine geri göndermek için birleştirme talebi oluşturun. Orijinal sahibi talebi inceleyip onaylayabilir veya reddedebilir. Onaylanan değişiklikler otomatik birleştirilir ve katkıda bulunan (fork gönderen) +2.00 CR kazanır.

### Modeller Paneli

Veri seti detay sayfasında "Modeller" sekmesinden bu veri seti ile eğitilmiş tüm modelleri görebilirsiniz.

### Yorumlar

Public veri setlerinin yorum bölümünde geri bildirim bırakabilirsiniz. Faydalı yorumlar +0.20 CR kazandırır.


# 4. Etiketleme

*Veri etiketleme araçları, iş akışı, otomatik ön etiketleme ve inceleme süreci.*

## 4.1. Etiketleme Çalışma Alanı

### Çalışma Alanına Giriş

Veri seti detay sayfasından herhangi bir veri ögesine tıklayarak etiketleme çalışma alanını açın. Çalışma alanı tam ekran açılır. Sol panelde sınıf seçici ve öge listesi, ortada tuval (canvas), sağ panelde Outliner (etiket listesi, görünürlük toggle, kilit) bulunur.

### Ögeler Arası Geçiş

Sol paneldeki öge listesinden tıklayarak veya klavye kısayollarıyla (ArrowLeft: önceki, ArrowRight: sonraki) ögeler arasında geçiş yapın. Sol panelden split filtreleme (train/val/test) yapılabilir.

### Zoom ve Pan

Mouse scroll ile yakınlaştır/uzaklaştır (%10 — %1000 arası). H tuşuna basarak pan aracını etkinleştirin ve tuvali sürükleyerek kaydırın.

### Katkı Modu

Başka birinin veri setinde etiketleme yapıyorsanız "Katkı modu" etkindir. Bu durumda etiketlemeleriniz inceleme onayına tabi tutulur. Kredi yalnızca veri seti sahibi onayladığında (+0.50 CR) kazanılır; sadece göndermek kazanım sağlamaz.

## 4.2. Etiketleme Araçları

### Sınırlayıcı Kutu (BBox)

Araç çubuğundan kutu aracını seçin (kısayol: B). Görüntü üzerinde sol tıklayıp sürükleyerek dikdörtgen çizin. Bıraktığınızda etiket oluşturulur. Köşe ve kenar tutamaçlarından boyutlandırma yapılabilir.

### Poligon

Poligon aracını seçin (kısayol: P). Görüntü üzerinde tıklayarak köşe noktaları ekleyin. Son noktayı ilk noktaya 12 piksel yakınlıkta tıklayarak veya Enter tuşuna basarak poligonu kapatın. Segmentasyon etiketlemesi için kullanılır.

> **İpucu:** Karmaşık şekiller için çok sayıda köşe noktası kullanın. Backspace ile son noktayı geri alabilirsiniz.

### Yönlendirilmiş Kutu (OBB)

OBB aracını seçin (kısayol: R). İlk iki tıklama kutunun taban kenarını, üçüncü tıklama yüksekliğini belirler. Döndürülmüş nesneleri (uydu görüntüleri, havadan çekim) etiketlemek için idealdir.

### İskelet / Poz (Keypoint)

İskelet şablonu seçtikten sonra görüntü üzerinde anahtar noktaları (eklem noktaları) tek tek yerleştirin. İnsan pozu, hayvan anatomisi gibi yapıları etiketlemek için kullanılır.

### Fırça Aracı

Fırça aracını seçin (kısayol: F). Piksel düzeyinde serbest çizim yaparak segmentasyon maskeleri oluşturabilirsiniz. Çizim tamamlandığında fırça izleri otomatik olarak poligon etiketine dönüştürülür.

> **İpucu:** Fırça aracı karmaşık, düzensiz şekilleri hızlıca etiketlemek için idealdir.

## 4.3. Outliner Paneli

### Etiket Yönetimi

Sağ paneldeki Outliner'da tüm etiketler listelenir. Her etiket için görünürlük toggle (göz ikonu), kilit (düzenleme engeli) ve sınıf rengi gösterilir. Gruplama: sınıf adına veya etiket tipine göre yapılabilir. Etiketleri tıklayarak seçebilir ve düzenleyebilirsiniz.

### Otomatik Kayıt

Etiketlemeleriniz 30 saniyede bir otomatik kaydedilir. Manuel kayıt için Ctrl+S kullanın.

## 4.4. Otomatik Ön Etiketleme

### Ön Etiketleme Başlatma

Veri seti detay sayfasında "Otomatik Etiketle" butonuna tıklayın. YOLO veya SAM-2 modeli seçerek toplu ön etiketleme başlatılır. İşlem arka planda çalışır (Celery task) ve tamamlandığında bildirim alırsınız.

> **İpucu:** Ön etiketleme sonuçlarını çalışma alanında inceleyip onaylayın veya düzeltin.

### Negatif (Arka Plan) Örnek İşaretleme

Hiç nesne içermeyen görselleri eğitime bilinçli olarak arka plan örneği diye dahil etmek için etiketleme ekranının sağ panelindeki "Negatif Örnek" butonunu kullanın. Birden çok görsel için galeride seçim yapıp "Negatif Örnek → Negatif olarak işaretle" menüsünü seçin. Etiketi olan görseller negatif işaretlenemez; negatif görsele etiket çizerseniz işaret kendiliğinden kalkar.

> **İpucu:** Negatif örnekler yanlış pozitifleri azaltır; veri setinin %5-15'i kadar tutmak genellikle yeterlidir.

### Sınıflandırmada Toplu Sınıf Atama

Sınıflandırma veri setlerinde görselleri tek tek etiketlemeniz gerekmez. Galeride "Seç" ile görselleri işaretleyin (ya da filtreleyip "Tümünü Seç"), ardından "Sınıf Ata" menüsünden sınıfı seçin. Görselin mevcut sınıfı yenisiyle değiştirilir; kutu veya poligon etiketi olan görseller atlanır.

> **İpucu:** Veriyi hiç etiketlemeden de yükleyebilirsiniz: ZIP içinde görselleri sınıf adıyla adlandırılmış klasörlere koyun (örn. hasarli/, saglam/) — içe aktarmada her görsel klasörünün sınıfıyla otomatik etiketlenir.

### Önerileri İnceleme

Oluşturulan öneriler otomatik olarak etiket listesine eklenir. Her öneriyi tek tek kabul edebilir, düzenleyebilir veya silebilirsiniz.

## 4.5. İş Akışı ve İnceleme

### Durum Geçişleri

Her veri ögesi bir durum akışı izler: UNASSIGNED (atanmamış) → LABELING (etiketleniyor) → IN_REVIEW (incelemede) → APPROVED (onaylandı) veya REJECTED (reddedildi). Reddedilen ögeler yeniden etiketleme için LABELING durumuna döner.

### İş Atama

Veri seti sahibi veya yöneticisi, etiketçilere ögeleri toplu veya otomatik olarak atayabilir. Otomatik atama, ögeleri etiketçiler arasında eşit dağıtır.

### İnceleme Süreci

İncelemeci (reviewer), etiketlenen ögeleri kontrol ederek onaylar veya ret nedeni belirterek reddeder. İncelemeci kendi etiketlerini onaylayamaz. Onay başına +0.10 CR kazanılır.

## 4.6. Geri Alma ve Sınırları

### Geri Alma (Undo/Redo)

Ctrl+Z ile son etiket ekleme işlemini geri alabilirsiniz. Ctrl+Y veya Ctrl+Shift+Z ile ileri alabilirsiniz. Undo yalnızca ekleme işlemlerini destekler — silme ve düzenleme geri alınamaz.

## 4.7. Klavye Kısayolları

### Navigasyon Kısayolları

ArrowLeft: Önceki öge, ArrowRight: Sonraki öge, Ctrl+S: Etiketleri kaydet, Ctrl+Enter: Kaydet ve sonrakine geç, Ctrl+Space: Ögeyi atla, Ctrl+Z: Geri al, Ctrl+Y / Ctrl+Shift+Z: İleri al, Delete: Seçili etiketi sil.

### Araç Kısayolları

V: Seçim aracı (imleç), B: Sınırlayıcı kutu, P: Poligon, R: Yönlendirilmiş kutu (OBB), K: Keypoint, F: Fırça, H: Pan (tuval kaydırma), Escape: Çizimi iptal et, 1-9: Sınıf hızlı seçim (sıra numarasına göre).

### Tuval ve Genel Kısayollar

Scroll: Yakınlaştır/Uzaklaştır, ?: Kısayol penceresini aç, Ctrl+K: Komut paleti.


# 5. Projeler

*Proje oluşturma, veri seti bağlama, üye yönetimi ve organizasyon seçimi.*

## 5.1. Proje Oluşturma ve Yönetim

### Yeni Proje

Sol menüden "Projeler"e gidin, "Yeni Proje" butonuna tıklayın. Proje adı, açıklama ve organizasyon seçimi yapın. Organizasyon seçimi, projenin kredi havuzunu belirler — eğitim maliyetleri seçilen organizasyonun bakiyesinden düşülür.

> **İpucu:** Organizasyon seçmezseniz, proje kişisel hesabınıza bağlanır ve maliyetler kişisel kredinizden düşülür.

### Veri Seti Bağlama

Proje detay sayfasında "Veri Setleri" sekmesinden veri seti bağlayın. Bir projeye birden fazla veri seti bağlanabilir. Eğitim başlatırken bağlı veri setlerinden birini seçersiniz.

### Üye Yönetimi

"Üyeler" sekmesinden projeye kullanıcı ekleyin. Roller: Yönetici (tam yetki, ayarlar, üye ekleme), Mühendis (eğitim başlatabilir, veri seti bağlayabilir), Gözden Geçiren (etiket inceleme, onay/ret), Etiketçi (yalnızca etiketleme). Proje sahibi otomatik Yönetici'dir.


# 6. Eğitim

*Model eğitimi başlatma, GPU tier seçimi, hiper-parametre ayarları, canlı metrik izleme ve kredi akışı.*

## 6.1. Eğitim Başlatma

### Eğitim Sayfası

Sol menüden "Eğitim" sayfasına gidin. Sayfanın üstünde istatistik çubuğu (StatsBar) bulunur: Toplam İş, Aktif, Kuyrukta, Başarılı, Başarısız, İptal ve Müsait GPU sayıları gösterilir. Eğitim işleri liste veya kart görünümünde gösterilebilir — sağ üstteki toggle ile geçiş yapın.

### Yeni Eğitim Modalı

"Yeni Eğitim" butonuna tıklayın. Açılan modalda önce proje ve veri seti versiyonu seçin. Seçilen veri setinin dondurulmuş bir versiyonu olmalıdır. İsteğe bağlı olarak bir deney seçebilirsiniz.

### Model Mimarisi Seçimi

Desteklenen mimariler: YOLO26 (en yeni), YOLO11, YOLOv10, YOLOv9, YOLOv8, RT-DETR. Her mimari için boyut varyantları mevcuttur (nano, small, medium, large, xlarge). Mimari kartları önerilen kullanım alanlarını ve tahmini eğitim süresini gösterir.

> **İpucu:** Hızlı denemeler için nano/small, en iyi performans için large/xlarge seçin.

### Görev Tipi Seçimi

Eğitim görev tipini seçin: Detection (nesne tespiti), Segmentation (piksel düzeyinde segmentasyon), OBB (yönlendirilmiş kutu), Pose (poz tahmini), Classification (sınıflandırma). Görev tipi, veri setinizdeki etiket türüyle uyumlu olmalıdır.

## 6.2. Hesaplama Katmanı (GPU Tier)

### 14 Kademeli GPU Tier Sistemi

1'den 48'e kadar 14 farklı GPU konfigürasyonu. Tier kartları grid halinde gösterilir, her kartta GPU sayısı, CR/saat maliyeti ve önerilen kullanım alanı yer alır. Seçtiğiniz tier'e göre tahmini eğitim süresi ve toplam maliyet otomatik hesaplanır.

## 6.3. Hiper-Parametre Ayarları

### Temel Parametreler

Epochs: Eğitim döngü sayısı (varsayılan: 100, maks: 1000). Batch Size: Her iterasyondaki örnek sayısı (varsayılan: 16, -1 ile otomatik). Image Size: Giriş görüntü boyutu (varsayılan: 640, 32'nin katı, maks: 2048). Patience: Erken durdurma sabır sayısı (varsayılan: 50).

### Öğrenme Hızı Parametreleri

lr0 (başlangıç öğrenme hızı, varsayılan: 0.01), lrf (son öğrenme hızı oranı), momentum (SGD momentum), weight_decay (ağırlık sönümleme). Bu değerler deneyimli kullanıcılar için ayarlanabilir; genellikle varsayılanlar iyi çalışır.

## 6.4. Veri Artırma (Augmentation)

### Preset Seçimi

4 hazır veri artırma preseti: Dengeli (balanced, varsayılan), Hızlı (minimal artırma), Hassas (ağır artırma), Özel (custom — tüm parametreler serbest). Preset seçtikten sonra her parametreyi ayrı ayrı ayarlayabilirsiniz.

### Artırma Parametreleri

HSV (renk tonu, doygunluk, parlaklık), translate (kaydırma), scale (ölçekleme), fliplr/flipud (yatay/dikey yansıma), mosaic (mozaik birleştirme), mixup (karıştırma), erasing (rastgele silme), degrees (döndürme). Her parametre 0.0–1.0 arasında yoğunluk değeri alır.

## 6.5. Eğitim İzleme

### Eğitim Durumları

Bir eğitim işi şu durumlardan geçer: PENDING (kuyrukta bekliyor) → EXPORTING (veri hazırlanıyor, Slurm'a gönderiliyor) → RUNNING (eğitim çalışıyor) → COMPLETED (başarılı) veya FAILED (başarısız) veya CANCELLED (iptal edildi).

### Canlı Metrikler

Eğitim başladıktan sonra detay sayfasında WebSocket üzerinden gerçek zamanlı metrikler izlenir: loss (kayıp değeri), mAP50, mAP50-95, precision, recall. Metrikler her epoch sonunda güncellenir ve çizgi grafikleri ile gösterilir.

### GPU Kullanım Bilgileri

GPU bellek kullanımı (VRAM MB), GPU sıcaklığı ve güç tüketimi eğitim sırasında izlenebilir.

### Eğitim Log'ları

Detay sayfasındaki "Log" sekmesinde Slurm iş çıktısı ve hata mesajları terminal benzeri arayüzde görüntülenir.

### Confusion Matrix ve Eğriler

Eğitim tamamlandıktan sonra confusion matrix (karışıklık matrisi), Precision-Recall eğrisi ve ROC eğrisi görüntülenir. Sınıf bazlı metrik tablosu ile her sınıfın performansı ayrı ayrı incelenebilir.

## 6.6. Eğitim İşlemleri

### Eğitimi Durdurma

Çalışan bir eğitimi durdurmak için "Durdur" butonuna tıklayın. Slurm işi iptal edilir ve kullanılmayan kredi iade edilir (RELEASE).

### Başarısız Eğitimi Tekrar Deneme

FAILED durumundaki bir eğitimin detay sayfasında "Tekrar Dene" butonu görünür. Bu buton son checkpoint'ten yeni bir eğitim işi başlatır.

### Öncelikli Kuyruk

"Öncelikli" seçeneğini işaretleyerek eğitiminizi kuyrukta öne alabilirsiniz. Öncelikli işler %50 ek ücret taşır ancak kuyrukta bekleyen diğer işlerin önüne geçer.

## 6.7. Eğitim Kredi Akışı

### Hold → Settle / Release

Eğitim başlatıldığında tahmini maliyet hesaplanır ve bakiyenizden bloke edilir (HOLD). Eğitim başarıyla tamamlandığında gerçek maliyet kesinleşir (SETTLE) — tahmin ile fark varsa iade veya ek tahsilat yapılır. Eğitim iptal veya başarısız olursa bloke tutar iade edilir (RELEASE).


# 7. Deneyler

*Deney oluşturma, hipotez tanımlama, eğitim çalıştırmalarını karşılaştırma ve analiz.*

## 7.1. Deney Oluşturma ve Yönetim

### Yeni Deney Oluşturma

Proje detay sayfasında "Deneyler" sekmesine gidin. "Yeni Deney" butonuyla deney oluşturun. Deney adı, açıklama, hipotez ve etiketler (tags) girin.

> **İpucu:** Hipotez alanı isteğe bağlıdır ancak deneylerinizi organize etmek ve sonuçları yorumlamak için kullanmanız önerilir.

### Deneye Eğitim Bağlama

Eğitim başlatırken "Deney" seçici ile mevcut bir deney seçin. Eğitim tamamlandığında sonuçlar otomatik olarak deneyle ilişkilendirilir. Bir deneye birden fazla eğitim bağlanabilir.

## 7.2. Karşılaştırma ve Analiz

### Çalıştırma Karşılaştırma

Deney detay sayfasında çalıştırmaları (runs) onay kutusuyla seçin (2-5 arası). "Karşılaştır" butonuna tıklayın. Karşılaştırma 4 bölüm içerir: Hiper-parametre fark tablosu (yalnızca farklı değerler vurgulanır), epoch bazlı mAP50 grafik üst üste bindirilmesi, final metrik tablosu ve radar grafiği (precision/recall/mAP karşılaştırması).

### En İyi Çalıştırma

Deney özet kartlarında en yüksek mAP50 değerine sahip çalıştırma otomatik olarak "En İyi" olarak işaretlenir.


# 8. Modeller

*Eğitilmiş model yönetimi, versiyonlar, stage sistemi, dışa aktarım ve platform paylaşımı.*

## 8.1. Model Listesi

### Model Görüntüleme

Sol menüden "Modeller" sayfasına gidin. Tüm modelleriniz kartlar halinde listelenir. Her kart model adı, mimari, versiyon sayısı, yıldız sayısı ve son güncelleme tarihini gösterir.

### Model Nasıl Oluşturulur

Modeller yalnızca eğitim sonucu otomatik oluşturulur. Eğitim başarıyla tamamlandığında yeni model (veya mevcut modelin yeni versiyonu) otomatik olarak kaydedilir. Manuel model oluşturma desteklenmez.

## 8.2. Model Detayları

### Model Kartı

Model detay sayfasında model kartı (README) salt okunur olarak görüntülenir. Model kartı eğitim sırasında otomatik oluşturulur ve modelin ne yaptığını, performans metriklerini özetler.

### Stage Sistemi

Her model versiyonu bir stage'e sahiptir: EXPERIMENTAL (deneysel, varsayılan), STAGING (test aşaması), PRODUCTION (üretim), ARCHIVED (arşivlenmiş). Stage geçişleri model detay sayfasından yönetilir.

### Versiyonlar

Her eğitim çalıştırması yeni bir model versiyonu üretir. Versiyonlar listesinde her versiyon için mAP50, mAP50-95, precision, recall metrikleri ve dosya boyutu gösterilir.

### Versiyon Karşılaştırma

"Karşılaştır" sekmesinde iki model versiyonunu yan yana karşılaştırabilirsiniz: metrik tablosu, eğitim parametreleri ve performans grafikleri.

### Metrik Görselleştirme

"Metrikler" sekmesinde versiyonların performansını çizgi grafikleri (LineChart), radar grafikleri ve sınıf bazlı bar grafikleri ile inceleyebilirsiniz.

## 8.3. Dışa Aktarım ve İndirme

### Ağırlık İndirme

Model versiyonunun ağırlık dosyasını (.pt) indirmek için versiyonun yanındaki indirme butonuna tıklayın.

### Format Dışa Aktarım

Eğitilmiş modeli farklı formatlara dışa aktarabilirsiniz: PyTorch (.pt), ONNX, TensorRT, TFLite. "Dışa Aktar" butonuna tıklayıp hedef formatı seçin.

### API Snippet'leri

"API" sekmesinde modeli programatik olarak kullanmak için hazır kod örnekleri sunulur: Python, cURL ve JavaScript.

## 8.4. Pipeline Görünümü

### Kaynak Takibi

Model detay sayfasında pipeline görünümü bulunur: Kaynak Veri Seti → Eğitim Konfigürasyonu → Sonuç Metrikleri. Bu görünüm modelin hangi veriden, hangi parametrelerle eğitildiğini izlemeyi kolaylaştırır.

## 8.5. Paylaşım ve Fork

### Model Fork'lama

Başka birinin public modelini fork'layarak kendi kopyanızı oluşturun. Fork işlemi tüm versiyonları ve ağırlıkları kopyalar.

### Yıldızlama

Beğendiğiniz modelleri yıldızlayarak işaretleyin. Yıldız sayısı modelin popülerliğini gösterir ve liderlik tablosunda sıralamayı etkiler. Yıldız alan model sahibi +0.50 CR kazanır.


# 9. Görüntü Çıkarımı

*Eğitilmiş modelle tahmin yapma: görsel, video, kamera, N-model karşılaştırma ve API.*

## 9.1. Çıkarım Modları

### 5 Üst Sekme

Çıkarım sayfasında 5 üst sekme bulunur: Görsel (tekli/toplu görüntü tahmini), Video (video üzerinde kare-kare tahmin), Kamera (webcam ile canlı tahmin), Karşılaştır (N-model paralel karşılaştırma), API (programatik erişim snippet'leri).

## 9.2. Görsel Modu

### Model Seçimi

Sol panelde model arama kutusuyla eğitilmiş modelinizi bulun ve seçin. Model versiyonu ve güven eşiği (confidence), IoU eşiği, JPEG kalitesi gibi parametreleri ayarlayın.

### Tekli Tahmin

"Yükle" alanına görüntü sürükleyin veya tıklayarak seçin. Alternatif olarak URL sekmesinden bir görüntü URL'si yapıştırabilirsiniz. Model yüklendikten sonra tahmin sonuçları görüntünün üzerine çizilir. Sınıf filtresi ile belirli sınıfları gösterebilir/gizleyebilirsiniz.

### Toplu Tahmin

"Toplu" alt sekmesinden birden fazla görüntü yükleyin. Tüm görüntüler sırayla işlenir ve sonuçlar tablo halinde gösterilir. Her tahmin 0.001 CR maliyetindedir (görüntü başına).

## 9.3. Video Modu

### Video Çıkarım

"Video" sekmesinde bir video dosyası yükleyin. Frame atlama (her N. kare) ve adaptif kalite seçenekleri mevcuttur. Video kareler halinde işlenir ve sonuçlar üst üste bindirilmiş olarak oynatılabilir.

## 9.4. Kamera Modu

### Webcam ile Canlı Tahmin

"Kamera" sekmesine geçip kamera erişimine izin verin. Gerçek zamanlı olarak webcam görüntüsü üzerinde nesne tespiti/segmentasyon yapılır.

## 9.5. Model Karşılaştırma

### N-Model Karşılaştırma

"Karşılaştır" sekmesinde 2-6 model slotu ekleyerek aynı görüntüyü birden fazla modelle eş zamanlı test edebilirsiniz. Her slot için ayrı model ve parametreler seçilir. Sonuçlar yan yana gösterilir ve metrik karşılaştırma tablosu sunulur.

> **İpucu:** Her model slotu ayrı bir çıkarım çağrısı sayılır (slot başına 0.001 CR).

## 9.6. API Sekmesi

### API Entegrasyonu

"API" üst sekmesinde seçili model için cURL, Python ve JavaScript kod örnekleri gösterilir. Bu snippet'leri kendi uygulamanıza kopyalayarak modeli programatik olarak kullanabilirsiniz.

> **İpucu:** API anahtarı oluşturmayı unutmayın. API çağrıları Bearer token ile kimlik doğrulaması gerektirir.


# 10. Kredi Sistemi

*Bakiye yönetimi, 4 sekmeli kredi merkezi, kazanım yolları, tier sistemi ve fiyatlandırma.*

## 10.1. Kredi Merkezi Sekmeleri

### 4 Sekmeli Yapı

Kredi Merkezi sayfası 4 sekmeden oluşur: Kazanım (kredi kazanma yolları ve geçmiş), Bakiye (mevcut bakiye, hareketler, bloke tutar), Hesaplayıcı (GPU maliyet hesaplama aracı), Talep (ek kredi talebi).

## 10.2. Bakiye ve Hareketler

### Bakiye Görüntüleme

Bakiye sekmesinde mevcut bakiyeniz, bloke edilen (HOLD) miktar, toplam kazanılan ve toplam harcanan tutarlar gösterilir. Üst çubuktaki kredi rozeti de anlık bakiyenizi gösterir (100 CR altında kırmızıya döner).

### Kredi Hareketleri (Ledger)

Tüm kredi işlemleriniz kronolojik sırada listelenir: kazanımlar, harcamalar, transferler, iadeler. Her hareket tipi, tutarı, referans kaynağı ve tarihi gösterilir.

### Bloke Tutar (HOLD)

Eğitim başlatıldığında tahmini maliyet bakiyenizden bloke edilir (HOLD). Bu tutar bakiyenizde görünür ancak kullanılamaz. Eğitim tamamlandığında kesinleşir (SETTLE) veya iptal/başarısızlık durumunda iade edilir (RELEASE).

## 10.3. Kredi Kazanım Yolları

### Kazanım Tablosu

İlk giriş bonusu: 1000 CR. Veri seti public paylaşma: +5 CR. 1000 veri yükleme milestone: +15 CR. Kendi veri setinde etiket kayıt başına: +0.05 CR. Etiket onay başına: +0.10 CR. İnceleme tamamlama: +0.25 CR. Model public paylaşma: +10 CR. Yıldız alma: +0.50 CR. Yararlı yorum: +0.20 CR. Model indirme milestone: +1.00 CR. Birleştirme talebi kabul: +2.00 CR. Topluluk katkısı onaylanma: +0.50 CR. Günlük giriş serisi (streak): +10 CR.

### Kazanım Seviye Sistemi

Seviyeniz Katkı Puanınıza göre otomatik belirlenir; seviye çarpanı uygulanan kazanımlar bu oranda artar: Başlangıç (0 puan, 1x), Araştırmacı (500 puan, 1.2x), Uzman (5.000 puan, 1.5x), Kıdemli (20.000 puan, 2x), Elit (50.000 puan, 2.5x). Profilinizdeki Seviye Puanı ile liderlik tablosundaki Katkı Puanı aynı değerdir.

### Katkı Puanı Nasıl Kazanılır

Veri seti oluşturma 5, veri seti yayımlama 10 (her veri seti için bir kez), model oluşturma 10, model yayımlama 20 (her model için bir kez), tamamlanan eğitim 15, kendi veri setinizde etiket kaydetme 1 (kayıt işlemi başına), etiketinizin onaylanması 2, topluluk katkınızın onaylanması 2, birleştirme isteğinizin kabulü 5, veri setinize ya da modelinize verilen yıldız 3, yararlı bulunan yorumunuz 1, tamamladığınız inceleme 1 puan. Onay, birleştirme ve yıldız puanları katkı sahibine yazılır. Etiket içe aktarımı ve yükleme kilometre taşları kredi kazandırır ama puan kazandırmaz. Puan genellikle bir dakika içinde, en geç gece güncellemesinde yansır.

### Kazanım Geçmişi

Kazanım sekmesinde son 30 günlük kazanım grafiği ve kategorilere göre kazanım dağılımı gösterilir.

### Adil Kullanım Politikası

Günlük kazanım tavanı 100 CR'dir; veri yükleme, etiketleme, veri seti ve model yayınlama ödülleri bu tavana dahildir. Her yeni günün (TSİ) ilk girişinde verilen 10 CR günlük giriş ödülü ise tavana dahil değildir. Azalan getiri kuralı uygulanır (aynı etkinliğin tekrar kazancı düşer). Kalite kapısı: düşük kalite etiketlemeler kazanım sağlamaz. Hız kontrolü: otomatik araçlarla sahte kazanım engellenir.

## 10.4. GPU Hesaplayıcı

### Maliyet Hesaplama

Hesaplayıcı sekmesinde GPU tier'i seçin ve tahmini eğitim süresini girin. Toplam maliyet otomatik hesaplanır. Kademe listesi ve saatlik fiyatlar sistemdeki güncel tablodan okunur. Öncelikli kuyruk seçildiğinde %50 ek ücret eklenir.

## 10.5. Kredi Talebi

### Talep Gönderme

Talep sekmesinde "Talep Gönder" butonuyla ek kredi talebinde bulunabilirsiniz. Talep nedeninizi açıklayın, isteğe bağlı olarak hedef organizasyonu belirtin. Admin onayı sonrası krediler hesabınıza eklenir.

## 10.6. Fiyatlandırma Özeti

### Çıkarım Fiyatlandırması

Tüm çıkarım modları (görsel, video, kamera, karşılaştır) aynı fiyatı kullanır: her çıkarım çağrısı 0.001 CR. Toplu tahmin: görüntü sayısı × 0.001 CR. N-model karşılaştırma: slot sayısı × 0.001 CR.

### Dışa Aktarım Fiyatlandırması

Veri seti dışa aktarım: 0.50 CR/çağrı.


# 11. Keşfet ve Platform

*Public veri setleri ve modeller, liderlik tablosu, koleksiyonlar, yorum ve yıldız.*

## 11.1. Keşif Merkezi

### Public İçerikleri Keşfetme

"Keşif Merkezi" sayfasında tüm public veri setleri ve modeller listelenir. Arama, filtre (mimari, görev tipi, modalite, etiket sayısı) ve sıralama (popülerlik, tarih, yıldız) seçenekleri mevcuttur.

### Yıldızlama ve Yorum

Beğendiğiniz içerikleri yıldızlayın. Public veri setleri ve modellere yorum yazabilirsiniz. Faydalı yorumları "Faydalı" butonuyla işaretleyebilirsiniz.

## 11.2. Liderlik Tablosu

### Sıralamalar

Liderlik tablosu üç kategoride sıralama sunar: Veri Setleri (en çok yıldız alan), Modeller (en yüksek performans metrikleri), Kullanıcılar (en aktif katkı yapan). Sıralama tüm zamanları kapsar.

## 11.3. Koleksiyonlar

### Koleksiyon Oluşturma

Birden fazla veri setini veya modeli bir koleksiyon altında gruplayın. Koleksiyona isim ve açıklama verin. "Öge Ekle" ile veri seti veya model arayarak koleksiyona ekleyin.


# 12. Organizasyon

*Takım oluşturma, plan tipleri, kredi havuzu yönetimi ve üye rolleri.*

## 12.1. Organizasyon Yönetimi

### Organizasyon Oluşturma

Sol menüden "Organizasyon" sayfasına gidin. "Yeni Organizasyon" butonuyla takımınızı oluşturun. İsim, slug ve plan tipi (Free, Pro, Enterprise) seçin.

### Üye Ekleme

Organizasyon detay sayfasında "Üyeler" sekmesinden kullanıcı arayarak ekleyin. Roller: Member (üye), Admin (yönetici), Owner (sahip — organizasyon başına bir).

### Kredi Havuzu

"Kredi Aktar" butonuyla kişisel kredi bakiyenizden organizasyona kredi aktarın. Aktarılan krediler organizasyonun havuzuna eklenir ve organizasyona bağlı projelerin eğitim maliyetleri bu havuzdan karşılanır.

> **İpucu:** Birden fazla üye organizasyona kredi aktararak ortak havuzu büyütebilir.

### Organizasyon Ayarları

Organizasyon ayarlarından isim, açıklama ve plan tipini güncelleyebilirsiniz.


# 13. İletişim

*Doğrudan mesajlaşma, bildirimler, SSE push ve bildirim tercihleri.*

## 13.1. Mesajlaşma

### Konuşma Başlatma

Sol menüden "Mesajlar" sayfasına gidin veya üst çubuktaki mesaj çanına tıklayarak Chat Drawer'ı açın. "Yeni Konuşma" butonuyla kullanıcı arayın ve konuşma başlatın. Alternatif olarak, herhangi bir kullanıcının profil sayfasından veya veri seti kartındaki DM butonundan mesaj gönderebilirsiniz.

### Mesaj Yazma ve Gönderme

Konuşma açıldığında alt kısımdaki metin kutusuna mesajınızı yazıp Enter veya gönder butonuyla iletin. Mesajlar WebSocket üzerinden gerçek zamanlı olarak iletilir. Karakter sınırı: 5000. Okundu işaretleme desteklenir.

### Okunmadı Bildirimleri

Okunmamış mesajlar üst çubuktaki mesaj ikonunda ve sidebar'daki Mesajlar ögesinde sayı rozeti ile gösterilir.

## 13.2. Bildirimler

### Bildirim Türleri

Eğitim tamamlandı/başarısız, model fork'landı, veri seti fork'landı, yeni yorum, birleştirme talebi, katkı onaylandı/reddedildi, kredi kazanıldı, yeni takipçi, yeni mesaj. Her tür farklı ikon ve renkle gösterilir.

### Bildirim Zili

Üst çubuktaki bildirim zili en son 8 bildirimi gösterir. Okunmamış bildirimler kırmızı rozet ile sayısal olarak işaretlenir. Bildirimler SSE (Server-Sent Events) ile gerçek zamanlı push edilir ve toast bildirimi ile ekranda gösterilir.

### Bildirim Yönetimi

Bildirimler sayfasında tüm bildirimleriniz zaman damgası ile birlikte listelenir. Tek tek kaldırabilir veya "Tümünü Temizle" ile toplu temizleyebilirsiniz. Bildirime tıklayarak ilgili kaynağa gidebilirsiniz.

### Bildirim Tercihleri

Ayarlar > Bildirimler sekmesinden 13 bildirim türünün her birini ayrı ayrı açıp kapatabilirsiniz: eğitim bildirimleri, model bildirimleri, veri seti bildirimleri, yorum, fork, yıldız, takipçi, kredi, birleştirme talebi vb.


# 14. Araçlar

*API anahtarları, webhook'lar, sorun panosu, katkılarım ve koleksiyonlar.*

## 14.1. API Anahtarları

### Anahtar Oluşturma

"API Anahtarları" sayfasında "Yeni Anahtar" butonuyla API anahtarı oluşturun. Anahtar adı ve scope (yetki kapsamı) seçin. Oluşturulan anahtar yalnızca bir kez gösterilir — kopyalayıp güvenli bir yerde saklayın.

> **İpucu:** Anahtarla veri setlerinize nasıl erişeceğiniz bir sonraki "Platform API ile Veri Seti Entegrasyonu" bölümünde örneklerle anlatılır.

### Anahtar İptali

Kullanmadığınız veya güvenlik riski olan anahtarları "İptal Et" butonuyla devre dışı bırakın. İptal edilen anahtarlar artık API çağrılarında kullanılamaz.

## 14.2. Platform API ile Veri Seti Entegrasyonu

### Adres ve Kimlik Doğrulama

Tüm istekler https://api.ssyz.org.tr/api/v1 adresine gönderilir. Kimlik doğrulama için API anahtarınızı X-API-Key başlığında iletin; anahtarlar evren_ önekiyle başlar. Çoğu yanıt { success, data, message } biçimindedir ve asıl içerik data alanındadır; bazı uç noktalar nesneyi doğrudan döndürür.

```
export EVREN_KEY=evren_...
curl -H "X-API-Key: $EVREN_KEY" \
  https://api.ssyz.org.tr/api/v1/datasets/<kullanici>/<veri-seti-slug>
```

### Veri Seti Kimliğini Bulma

Diğer uç noktalar veri setinin kimliğini (UUID) ister. Veri seti adresindeki kullanıcı adı ve slug ile GET /datasets/{kullanici}/{slug} çağrısı yapın; yanıttaki id alanı veri seti kimliğidir.

### Veri Ögelerini Listeleme

GET /datasets/{id}/items ögeleri sayfalı döndürür (limit en fazla 200). Yanıttaki next_cursor değerini bir sonraki istekte cursor parametresiyle gönderin; next_cursor boş geldiğinde son sayfadasınız.

```
curl -H "X-API-Key: $EVREN_KEY" \
  "https://api.ssyz.org.tr/api/v1/datasets/<id>/items?limit=100"
```

### Görsel Yükleme (3 adım)

Yükleme üç adımdır: (1) POST /datasets/{id}/upload/presign ile dosya adı, SHA-256 özeti ve boyutunu gönderip yükleme adresini alın — aynı özete sahip dosya veri setinde varsa duplicates listesinde döner ve tekrar yüklenmez; (2) dönen upload_url adresine dosyayı PUT ile gönderin; (3) POST /datasets/{id}/upload/confirm ile yüklemeyi onaylayın. Onaylanmayan dosyalar veri setine eklenmez.

```
# 1) yükleme adresi
curl -X POST -H "X-API-Key: $EVREN_KEY" -H "Content-Type: application/json" \
  -d '{"files":[{"filename":"a.jpg","sha256_hash":"<sha256>","file_size":123456}]}' \
  https://api.ssyz.org.tr/api/v1/datasets/<id>/upload/presign

# 2) dosyayı gönder (upload_url yanıttan)
curl -X PUT -H "X-API-Key: $EVREN_KEY" -H "Content-Type: image/jpeg" \
  --data-binary @a.jpg "https://api.ssyz.org.tr/api/v1<upload_url>"

# 3) onayla
curl -X POST -H "X-API-Key: $EVREN_KEY" -H "Content-Type: application/json" \
  -d '{"items":[{"object_key":"<object_key>","sha256_hash":"<sha256>","filename":"a.jpg","file_size":123456}]}' \
  https://api.ssyz.org.tr/api/v1/datasets/<id>/upload/confirm
```

### Python SDK ile Yükleme

evren-sdk paketi bu üç adımı tek çağrıda yapar. Kurulum: pip install evren-sdk.

> **İpucu:** Çok sayıda dosyayı tek tek yüklemek yerine etiketli ZIP'i aşağıdaki içe aktarma uç noktasıyla tek seferde gönderebilirsiniz.

```
from evren_sdk import EvrenClient

with EvrenClient(api_key="evren_...") as client:
    result = client.upload_to_dataset("<veri-seti-id>", "a.jpg")
    print(result)
```

### Etiketli ZIP İçe Aktarma

YOLO, COCO veya Pascal VOC etiketli bir ZIP'i POST /datasets/{id}/import ile multipart olarak gönderin (alan adı file). Format otomatik algılanır, sınıflar yoksa oluşturulur. Yanıt satır satır JSON (NDJSON) akışıdır: "t":"p" satırları ilerlemeyi, "t":"d" satırı sonucu (format, oluşturulan görsel ve etiket sayısı), "t":"e" satırı hatayı bildirir; "t":"h" satırları yalnız bağlantıyı canlı tutar. deduplicate=true aynı içerikli görseli tekrar eklemez.

> **İpucu:** Çok büyük ZIP'lerde bağlantı kopmalarına karşı parçalı akışı kullanın: POST /datasets/{id}/import/init, her parça için PUT /datasets/{id}/import/{import_id}/chunk/{n}, ardından POST .../complete ve ilerleme için GET .../status.

```
curl -N -X POST -H "X-API-Key: $EVREN_KEY" \
  -F file=@etiketli.zip -F deduplicate=true \
  https://api.ssyz.org.tr/api/v1/datasets/<id>/import
```

### Etiketleri Programatik Yazma

Görseller zaten yüklüyse etiketleri POST /annotations/bulk ile toplu yazabilirsiniz (istek başına en fazla 500 etiket). Sınıf kimliklerini GET /datasets/{id}/classes, görsel kimliklerini GET /datasets/{id}/items ile alın. Koordinatlar görsel boyutuna oranlanmış 0-1 aralığında olmalıdır: sınırlayıcı kutu için {"x1","y1","x2","y2"}, poligon için {"vertices": [[x, y], ...]}.

```
curl -X POST -H "X-API-Key: $EVREN_KEY" -H "Content-Type: application/json" \
  -d '{"dataset_id":"<id>","annotations":[{"data_item_id":"<oge-id>","class_id":"<sinif-id>","annotation_type":"BOUNDING_BOX","points":{"x1":0.12,"y1":0.20,"x2":0.48,"y2":0.66}}]}' \
  https://api.ssyz.org.tr/api/v1/annotations/bulk
```

### Versiyonlar ve Dışa Aktarma

GET /datasets/{id}/versions veri setinin versiyonlarını listeler. Etiketleri bir versiyondan ZIP olarak indirmek için GET /datasets/{id}/export/download çağrısında format (ör. YOLO_TXT, COCO_JSON, VOC_XML, CSV) ve isteğe bağlı version_tag parametresini kullanın. Desteklenen biçimler GET /datasets/{id}/export/formats ile listelenir.

```
curl -H "X-API-Key: $EVREN_KEY" -o export.zip \
  "https://api.ssyz.org.tr/api/v1/datasets/<id>/export/download?format=YOLO_TXT&version_tag=v1.0"
```

## 14.3. Webhook Yönetimi

### Webhook Oluşturma

"Webhook'lar" sayfasında "Yeni Webhook" butonuyla kural oluşturun. 5 tetikleyici türü mevcuttur: eğitim tamamlandı, model oluşturuldu, veri seti güncellendi, yorum eklendi, birleştirme talebi. 4 aksiyon türü: HTTP POST, e-posta, SMS, Slack. Hedef URL ve isteğe bağlı secret key girin.

### Webhook Yönetimi

Oluşturulan webhook'ları aktif/pasif toggle ile kontrol edin. Her webhook'un tetiklenme sayısı gösterilir. Düzenleme ve silme işlemleri yapılabilir.

## 14.4. Sorun Panosu

### Sorun Bildirme

"Sorun Panosu" sayfasında "Yeni Sorun" butonuyla sorun oluşturun. 4 öncelik seviyesi (düşük, orta, yüksek, kritik), 4 sorun tipi (hata, iyileştirme, soru, görev) ve 4 durum (açık, devam ediyor, çözüldü, kapatıldı) mevcuttur.

### Sorun Takibi ve Yorumlar

Her soruna yorum eklenebilir. Sorunlar durum, öncelik ve tipe göre filtrelenebilir. Sorunlar veri seti, model veya genel platform ile ilişkilendirilebilir.

## 14.5. Katkılarım

### Katkı Özeti

"Katkılarım" sayfasının üstünde istatistik kartları bulunur: toplam katkı, onaylanan, reddedilen, bekleyen sayıları ve ilerleme çubuğu. Filtre sekmeleri ile duruma göre filtreleme yapılabilir.

### Katkı Detayları

Her katkı için veri seti adı, etiketlenen öge sayısı, onay durumu ve kazanılan kredi gösterilir. Reddedilen katkılarda ret nedeni görüntülenir.


# 15. Profil ve Ayarlar

*Profil sayfası, hesap ayarları, tema, bildirim tercihleri ve güvenlik.*

## 15.1. Profil Sayfası

### Profil Görüntüleme

Profil sayfanızda ad, kullanıcı adı, tier rozeti, katılım tarihi, takipçi/takip sayıları gösterilir. Katkı grafiği (GitHub benzeri ısı haritası) son 1 yıllık aktivitenizi gösterir.

### Sabitlenmiş Ögeler

Profilinize en fazla 6 veri seti veya model sabitleyebilirsiniz. Sabitlenen ögeler profil sayfanızın üst kısmında görünür.

### Takip Sistemi

Diğer kullanıcıları takip edebilir ve takipçilerinizi görebilirsiniz. Takip ettiğiniz kullanıcıların yeni içerikleri aktivite akışınızda görünür.

## 15.2. Hesap Ayarları

### Profil Düzenleme

Ayarlar sayfasında ad, soyad, kullanıcı adı, biyografi, kurum, GitHub kullanıcı adı, Twitter kullanıcı adı ve web sitesi bilgilerinizi düzenleyin.

### E-posta Değiştirme

E-posta adresinizi değiştirmek için yeni adresinize gönderilen OTP kodunu doğrulamanız gerekir.

### Telefon Ekleme/Değiştirme

Telefon numarası eklemek veya değiştirmek için SMS ile gönderilen OTP kodunu doğrulamanız gerekir.

### Avatar Yükleme

Profil fotoğrafınızı yükleyin veya değiştirin. Desteklenen formatlar: JPEG, PNG. Maksimum boyut: 2 MB.

## 15.3. Görünüm ve Tercihler

### Görünüm Sekmesi

Açık (light) ve koyu (dark) tema arasında geçiş yapın. Seçiminiz tarayıcıda saklanır ve sonraki girişlerde korunur.

### Bildirim Tercihleri

Bildirimler sekmesinden 13 bildirim türünün her birini (eğitim, model, veri seti, yorum, fork, yıldız, takipçi, kredi, birleştirme talebi, sistem, güvenlik, duyuru, haftalık özet) ayrı ayrı etkinleştirebilir veya devre dışı bırakabilirsiniz.

