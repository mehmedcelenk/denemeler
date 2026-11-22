# Misafir oturumu ve ilerleme sözleşmesi

## İnceleme ve karar

Önceki yapıda `welcome/cloud-sync.ts`, ortak `aol_user_choices` ve diğer ilerleme
anahtarlarından yüklenen state'i girişte `user_progress` ile birleştiriyordu. Çıkış
aynı anahtarları temizliyordu. Misafiri yalnızca giriş kontrolünden geçirmek, bu
verileri bir sonraki hesaba yükleyebilirdi. Oda servisi ayrı kullanıcı/oda anahtarları,
bağlantı nesli ve iptal denetleyicisi kullanıyordu; cevap kaydı giriş noktasında
etkin hesabı ayrıca denetlemiyordu.

Yeni sahiplik:

- `app/state.ts`: çalışma sahibi `progressOwner` ve asenkron işlem nesli
  `studyGeneration`. State mutasyonlarının tek otoritesi `store` olarak kalır.
- `welcome/study-session.ts`: yerel çalışma erişimi, gerçek hesap kimliği, çalışma
  alanı geçişleri ve geri yükleme. `isAuthenticated()` misafir için daima `false`;
  `canStudyLocally()` bireysel çalışmaya izin verir. Misafire kullanıcı veya token
  üretilmez; Supabase anonim giriş yapılmaz.
- `app/storage.ts`: mevcut anahtar API'sini sahibin fiziksel anahtarına çevirir.
  Sahip sağlayıcısı yalnızca merkezi state'i okur; depolama modülünde ikinci bir
  oturum state'i tutulmaz. Tema, sütun, ses tercihleri gibi cihaz tercihleri ortaktır.
- `welcome/cloud-sync.ts`: yalnızca etkin gerçek hesabın ilerlemesini eşitler.
  GET/POST işlemleri ve kuyruklar çalışma nesline bağlıdır; sahip değişince bekleyen
  zamanlayıcı iptal edilir, devam eden ilerleme istekleri abort edilir, geç dönen
  yanıtlar uygulanmaz. POST gövdesi gönderildiği hesabın bağımsız kopyasıdır.
- `classroom/room-service.ts`: katılma/geri yükleme/poll/komut sınırları gerçek hesap
  ister. Cevap kaydı ayrıca etkin kullanıcıyı oda bağlantısıyla karşılaştırır.
  Çalışma değişimi eski bağlantıyı koparır. Misafir cevapları bekleyen oda
  kayıtlarına, raporlara veya kurum istatistiklerinin kaynağına gönderilmez.

Jenga sınırı korunur: cevap çekirdeği odayı import etmez; cevap olaylarını oda
eklentisi dinler. Ders, soru ve kurum istatistiklerinin normal okuma akışı korunur.
Veritabanı şeması ve runtime bağımlılıkları değişmez.

## Kalıcı veri ve uyumluluk

Mantıksal `StorageKeys` değerleri değişmez. Cevaplar, şık elemeleri, kayıtlı/rövanş
soruları, seri, son çalışma ve mevcut yerel AI geçmişi şu ad alanlarını kullanır:

- Misafir: `aol_progress_v1:guest:<eski anahtar>`.
- Hesap: `aol_progress_v1:account%3A<kodlanmış kullanıcı kimliği>:<eski anahtar>`.
- Hesapsız giriş ekranı: çalışma verisine erişim ve yazma kapalıdır.

Eski ortak anahtarlarda kullanıcı kimliği bulunmadığından geçmiş sahip kesin
olarak tespit edilemez. `aol_legacy_progress_owner_v1`, bu kayıtları ilk gerçek
hesaba bir kez sahipler. Kayıtlar bu hesabın boş ad alanına **kopyalanır**; eski
anahtarlar silinmez veya değiştirilmez, mevcut yeni kayıtların üzerine yazılmaz.
Misafir bu kayıtlara hiçbir zaman sahiplenmez. Yeni bir hesaba veya misafire
geçerken önceki state kaydedilip başka sahibin alanına aktarılmaz; her işlem zaten
kendi alanına yazar. Hesap çıkışında kalıcı çalışma verisi korunur.

Geçiş tamamlandığında `aol_legacy_progress_complete_v1` sahip kimliğini kaydeder.
Depolama hatası geçişi yarıda keserse ilk sahip sonraki denemede eksik kayıtları
tamamlar; mevcut hedef kayıtları ve eski orijinaller korunur. Bu sırada yalnızca
ilk sahip eksik kayıtları eski anahtardan okuyabilir; ilerleme yazma ve bulut
eşitlemesi durdurulur. Daha eski sahiplik kaydı kurtarılırken temizlenmiş cevap
kilidi yeniden oluşturulmaz. Kullanıcı depolamada yer açtıktan sonra tekrar deneyebilir.

Son çalışma kaydı geriye uyumlu, isteğe bağlı `programMode` alanı taşır; cevap
olayı son soruyu kaydeder. Yenileme ve tarayıcı yeniden açılışı son çalışma alanını
geri yükler. Misafirin cevapları ve çalışma kayıtları yalnızca tarayıcıdadır.

`aol_study_mode_v1` son modu cihazda, ayrıca sekmenin seçimini sekme deposunda
tutar. Böylece başka sekmede hesap açılsa bile açık misafir sekmesi, yenileme
dahil, misafir kalır. Hesap sekmeleri paylaşılan hesap değişimini izler; yazma
öncesi kimlik karşılaştırması `storage` olayı henüz gelmemiş olsa da geçerlidir.
Oturum nesli giriş yanıtları, ders/arama/kitaplık yüklemeleri, geri dönüş kaydırması
ve şık elemenin basılı tutma zamanlayıcısında da denetlenir.

## Doğrulama ve sınırlar

`tests/guest-session.test.ts` yerel kalıcılığı, eski veri geçişini, hesap ayrımını,
sekme olayından önce değişen paylaşılan kimliği, geciken GET/POST'u, debounce ve
kuyruk iptalini, eski oda bağlantısından kayıt reddini sınar.
`tests/browser/guest.spec.js` üretim çıktısında giriş, cevaplama, yenileme, yeni
sekme, oda için hesap isteme, hesap geçişleri ve geciken eşitlemeyi sınar; HTTP
yazma isteklerini kaydeder. Mevcut öğrenci ve sınıf tarayıcı senaryoları korunur.

Tarayıcı testleri kontrollü HTTP yanıtları kullanır; canlı Supabase/RLS üzerinde
uçtan uca doğrulama yapmaz. Önceden gönderilmiş bir hesap isteğinin sunucuda
işlenmesini abort ile geri almak mümkün değildir; gövdesi yalnızca eski hesabın
kopyasını içerir, misafir veya yeni sahibin verisini içermez. Geç yanıtlar yeni
çalışmaya uygulanmaz. Tarayıcı verileri temizlenirse misafir ilerlemesi silinir.

Son doğrulama (18 Kasım 2026): `npm run build` başarılı; 45/45 test dosyası,
110 modülde 0 mimari hata ve 6 bağımlılık uyarısı. `npm run test:e2e` 36/36
senaryoyla başarılı; bunların altısı misafir ve oturum geçişlerine ayrılmıştır.
Odak yarışının düzeltme öncesinde başarısız olan birim testi düzeltmeden sonra geçer.

## Değişen dosyalar

| Alan | Dosyalar |
|---|---|
| Oturum ve karşılama | `src/features/welcome/study-session.ts` (yeni), `cloud-sync.ts`, `auth-modal.ts`, `init.ts`, `welcome-view.ts` |
| Merkezi durum ve kalıcılık | `src/app/state.ts`, `state-types.ts`, `state-events.ts`, `storage.ts`, `bootstrap.js`; `src/shared/storage-keys.ts` |
| Bulut isteği iptali | `src/data/supabase-auth.ts` |
| Cevap ve son çalışma | `src/features/answers/marking.ts`, `rate-limit.ts`; `src/features/booklet/init.ts`, `resume.ts` |
| Oda kayıt sınırı | `src/features/classroom/room-service.ts` |
| Geç işlem/ara durum koruması | `src/features/subjects/selection.js`, `exam-mode.ts`; `src/features/search/search.js`; `src/features/library/library-drawer.ts`; `src/features/annotations/eliminate-choice.ts`, `highlighter.ts`; `src/features/gamification/init.ts` |
| Misafir açıklaması ve görünüm | `index.html`, `src/styles/welcome.css` |
| Testler | `tests/guest-session.test.ts`, `tests/auth-focus.test.ts`, `tests/browser/guest.spec.js` (yeni); `tests/auth-hardening.test.ts`, `auth-modal.test.ts`, `storage-keys.test.ts`; `tests/browser/app.spec.js`, `regressions.spec.js` |
| Mimari belgeler | `docs/ARCHITECTURE.md`, `MASTER_MIMARI_BLUEPRINT.md`, bu belge |

Görev başlangıcında zaten değiştirilmiş olan diğer dosyalara bu özellik kapsamında
müdahale edilmedi. Canlı veritabanına, veri üretimine veya yayına işlem yapılmadı.
