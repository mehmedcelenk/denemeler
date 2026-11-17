# Sınıf oturumu kurulumu ve doğrulaması

`20261117000428_classroom_rooms.sql` ve Türkçe oda adı düzeltmesi `20261117145017_classroom_turkish_room_names.sql` 17 Kasım 2026'da `cenks` Supabase projesine uygulandı. Bu uygulamada kullanıcı isteğiyle yedek adımı atlandı. 61 hesapla 90 saniyelik ön yük denemesi başarılı oldu; iki saatlik kabul denemesi tamamlanmadı. Yeni ortamlarda önce mevcut veritabanını yedekleyin ve ayrı, atılabilir bir Supabase projesinde `supabase/schema.sql` ardından iki migration'ı sırasıyla uygulayın. Mevcut kullanıcı hesaplarını veya ilerlemeyi sıfırlamayın. Yeni uygulama eski sınıf protokolüyle uyumlu değildir; yayınlanan uygulama bu iki migration'ı gerektirir.

Eski `aol_classroom_session` korunur ve yeni yetki kaynağı olarak kullanılmaz. Yeni oturum sekme depolamasına bağlıdır; bekleyen cevaplar kullanıcı ve oda kimliği altında saklanır. Oda sahibi veya öğrenci yeniden katıldığında yetki sunucudan doğrulanır. Web Locks desteği olmayan tarayıcılarda yinelenen sekmelerin aynı bağlantıyı devralmasını önlemek için yenilemeden sonra eski bağlantının 15 saniyelik zaman aşımı beklenip yeniden giriş yapılması gerekebilir. Aynı oda adına ilk giren hesap öğretmen olur; sınıf başlamadan öğretmen önce odayı açmalıdır. Odayı yalnız sahibi bitirebilir.

Öğretmen ilk girişte son 100 olayı görür; eski kayıtlar yeniden bildirilmez. İki güncelleme arasında 100'den fazla yeni olay oluşursa sistem sayfaları son görülen olaydan başlayarak sırayla çeker; görüntülenen liste son 100 kayıtla sınırlıdır.

## Doğrulama

`supabase/tests/classroom.sql` yalnız izole veritabanında, `PGOPTIONS='-c classroom.test_confirm=isolated-test' psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/classroom.sql` ile çalıştırılır. Test hesapları işlem sonunda geri alınır. İki geçici gerçek hesapla tarayıcı girişi, kur/katıl, duyuru, öğretmen ve öğrenci yenilemesi ve odanın bitirilmesi 17 Kasım 2026'da doğrulandı. Doğrudan tablo erişimi ve host yetkileri ayrıca kontrol edildi; test hesapları ve odaları temizlendi.

Aynı komutta dosya olarak `supabase/tests/classroom_61.sql` verilerek 61 hesabın oda, yanıt ve olay bütünlüğü de kontrol edilir. Bu test istekleri sırayla yürütür; eşzamanlı bağlantı veya gecikme testi değildir.

`supabase/tests/classroom_turkish_names.sql`, noktalı ve noktasız I harflerinin farklı oda oluşturduğunu ve her birinin kendi küçük harfleriyle eşleştiğini doğrular.

Önceki üç tarayıcı hatasından ikisi, yavaş/başarısız yerel ders yüklemesi senaryolarında canlı Supabase verisinin test akışına karışmasından kaynaklanıyordu; ilgili testler yerel veriye yalıtıldı. Meal testi ise ders seçimi tamamlanmadan önceki kitapçığa işlem yapıyordu; yeni dersin yüklenmesini bekleyecek şekilde düzeltildi. Bu senaryolar devre dışı bırakılmadan çalışmaya devam eder.

Gerçek yük testi için ayrı projede 61 farklı test hesabı oluşturun. Gizli hesap dosyasını repo dışında tutun: `{"projectUrl":"https://TEST-PROJECT.supabase.co","accounts":[{"email":"...","password":"..."}]}`. Kullanıcı hesabı sayısı tam 61 olmalıdır. Açıkça `CLASSROOM_TEST_CONFIRM=isolated-test`, `CLASSROOM_TEST_URL`, `CLASSROOM_TEST_ANON_KEY` ve `CLASSROOM_TEST_ACCOUNTS_FILE` ortam değişkenlerini ayarlayarak `npm run test:chaos` çalıştırın. Varsayılan süre 7200 saniyedir. Daha kısa `CLASSROOM_TEST_DURATION_SECONDS` yalnız ön denemedir, pilot kabulü değildir. Araç oda oluşturup test bitiminde kapatır; başarısız temizlikte oda elle kapatılmalıdır.

Kullanıcı canlı projede test edilmesini açıkça seçerse, önce veritabanının ve hesapların geri yüklenebilir yedeği doğrulanır. Canlı çalıştırmada `CLASSROOM_TEST_CONFIRM=production-approved` ve hedef URL ile tam eşleşen `CLASSROOM_PRODUCTION_REF` ayrıca gerekir; yalnız `pilot-` ile başlayan, bu test için ayrılmış 61 test hesabı kabul edilir. Test trafiği gerçek kullanıcıları ve servis sınırlarını etkileyebilir. Tamamlanan testin yalnızca kendisine ait hesapları ve odaları temizlenir; gerçek hesaplar değiştirilmez.

Pilot kabulü gerçek sunucu üzerinde iki saatlik testin hatasız, görünürlük bildirimi en fazla 3 saniye ve kopma tespiti en fazla 20 saniye sonuçlanmasını gerektirir. Yerel sahte HTTP veya PGlite kontrolleri Supabase yapılandırması, ağ ve yük kapasitesi doğrulaması değildir.

Yük aracı hesap girişlerini beşli gruplar halinde zamana yayar; oda girişlerini eşzamanlı başlatır. Kurulum sırasında aldığı HTTP 429 yanıtlarının sayısı sonuçta gösterilir. Bu nedenle sınıf yük testi, tüm öğrencilerin aynı ağdan aynı anda hesap girişini ayrıca doğrulamaz; bu senaryo ayrıca sınanmalıdır.

Canlı projedeki hızlı, tek IP üzerinden toplu giriş denemesinde 429 yanıtları görüldü. Girişlerin birkaç dakikaya yayılması riski azaltabilir; uygulamada bu sınırı ortadan kaldıran ayrı bir değişiklik yapılmadı. Kademeli girişten sonraki 90 saniyelik 61 hesaplık ön denemede 1.187 istek, sıfır istek hatası, en fazla 1.499 ms görünürlük bildirimi ve 16.990 ms kopma tespiti ölçüldü.

## Geri dönüş

Uygulamayı önceki sürüme geri alırken yeni odayı bitirin. İzole ortamda denenmiş `supabase/rollback/202611170001_classroom.sql` sınıf RPC erişimini kapatır; tabloları ve verileri korur. Önce odayı bitirip verileri yedekleyin. Erişimi açmak için ileri migration sonundaki GRANT bölümünü tekrar uygulayın. Bu betik hesapları ve kişisel ilerlemeyi değiştirmez.
