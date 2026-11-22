# Projeye özel agent skilleri

Bu set GitHub'daki açık kaynak skillerden AÖL Dijital Kitapçık için uyarlanmıştır.
Kurulum yeri `.agents/skills/` olduğundan proje ile birlikte sürümlenir; kişisel/global
skill ayarlarını değiştirmez. Uygulamaya çalışma zamanı bağımlılığı eklemez.
Codex'in yerel proje skill keşfi için kullandığı konum budur
([resmî belge](https://learn.chatgpt.com/docs/build-skills#where-to-save-skills)).

## Hangi işte hangisi?

| Skill | Kullanım | Örnek istek |
|---|---|---|
| [improve-codebase-architecture](../.agents/skills/improve-codebase-architecture/SKILL.md) | Mevcut mimariyi kanıtlarla inceleme, bağımlılık ve sorumluluk sorunları | `Kitapçık ile tahta arasındaki mimari sınırları incele.` |
| [codebase-design](../.agents/skills/codebase-design/SKILL.md) | Küçük arayüzler, tutarlı modüller ve test edilebilir tasarım | `Bu özelliğin modül arayüzünü mevcut kancalarla tasarla.` |
| [api-and-interface-design](../.agents/skills/api-and-interface-design/SKILL.md) | Tipler, olay payload'ları, veri doğrulama ve uyumluluk | `Yeni cevap olayının sözleşmesini ve tüketicilerini belirle.` |
| [project-architect](../.agents/skills/project-architect/SKILL.md) | Büyük özellikler için gereksinim, teknik tasarım ve sıralı görevler | `Öğretmen raporlamasını mevcut mimariye göre planla.` |
| [code-review-and-quality](../.agents/skills/code-review-and-quality/SKILL.md) | Diff üzerinde doğruluk, mimari uyum, güvenlik ve performans inceleme | `Bu değişiklikleri hata ve mimari ihlal açısından incele.` |
| [code-simplification](../.agents/skills/code-simplification/SKILL.md) | Davranışı koruyarak karmaşıklığı azaltma | `Bu render fonksiyonunu davranışı koruyarak sadeleştir.` |
| [systematic-debugging](../.agents/skills/systematic-debugging/SKILL.md) | Yeniden üretim, kök neden, odaklı düzeltme | `Ders değiştirince önceki soruların kalmasının nedenini bul ve düzelt.` |
| [security-check](../.agents/skills/security-check/SKILL.md) | Kaynak kod üzerinde kapsamlı veya odaklı güvenlik inceleme | `Soru HTML'i ile AI yanıtlarının XSS sınırlarını incele.` |
| [verification-before-completion](../.agents/skills/verification-before-completion/SKILL.md) | Tamamlanma iddialarını gerçek kontrol çıktılarıyla doğrulama | `Değişikliği gerekli proje kontrolleriyle doğrula.` |
| [frontend-design](../.agents/skills/frontend-design/SKILL.md) | Bilinçli UI/UX yönü, tipografi, renk hiyerarşisi ve AI şablonlarından kaçınma | `Hocadan Öğren panelinin görsel hiyerarşisini ve tipografisini tasarla.` |
| [web-design-guidelines](../.agents/skills/web-design-guidelines/SKILL.md) | Arayüz standartları, erişilebilirlik (a11y), mobil ergonomi, focus ve hareket denetimi | `Bu stil ve şablon değişikliklerini UI/UX ve a11y kurallarına göre denetle.` |

İlgili skill açıklaması istekle eşleştiğinde otomatik seçilebilir. İstenirse
`$improve-codebase-architecture` gibi adıyla açıkça çağrılabilir. Yalnızca ilgili
giriş dosyası ve o iş için gerekli referanslar okunur; bütün referans seti yüklenmez.
Yeni skiller sonraki turda kullanılabilir; görünmüyorsa Codex yeniden başlatılabilir.

## Projeye uyarlama sözleşmesi

- Çalışma kuralları `AGENTS.md`, güncel mimari sözleşme
  [MASTER_MIMARI_BLUEPRINT.md](MASTER_MIMARI_BLUEPRINT.md), başlangıç haritası
  [ARCHITECTURE.md](ARCHITECTURE.md) içindedir. Skiller bunları tamamlar.
- Vite, ES modülleri ve DOM tabanlı arayüz esas alınır. React, Next.js, yeni bir state
  kütüphanesi, mikroservis veya başka bir çatıya geçiş skill kullanmanın parçası değildir.
- Çekirdek/eklenti izolasyonu, merkezi state ve depolama kapısı, saf `shared` katmanı,
  soru kartlarında kapsamlı DOM sorguları ve 300 satır sınırı korunur. Küçük bir dosya
  tek başına gereksiz soyutlama kanıtı sayılmaz; mevcut sınırın amacı incelenir.
- Kullanıcı verisi, soru kimlikleri ve depolama anahtarlarının uyumluluğu değerlendirilir.
  Veri üretimi ve veritabanı eşitlemesi normal inceleme/doğrulama komutları değildir.
- Planlama, inceleme ve uygulama kapsamı kullanıcının isteğinden gelir. Mevcut uygulama
  yetkisi varsa her belge sonunda yeniden onay istenmez. Yalnızca inceleme isteği kodu
  değiştirme yetkisi vermez; deploy ayrıca istenmelidir.
- Skiller başka bir agent runtime'ına, zorunlu alt ajanlara, issue tracker'a veya ek
  skill kurulumuna bağlı değildir. Alternatifler aynı oturumda değerlendirilebilir.
- Kod incelemesinde şüpheli bir bulgu, çağıranlar ve mevcut önlemlerle doğrulanır.
  Güvenlik incelemesi varsayılan olarak kaynak kod üzerinde yapılır; canlı sisteme
  test isteği, exploit çalıştırma veya altyapı değiştirme yetkisi oluşturmaz.
- İş mantığı/veri sınırı değişince anlamlı test eklenir veya güncellenir.
  `npm run build` zorunludur; arayüz/olay/veri yükleme değişince `npm run test:e2e`
  de çalışır. Geçmiş başarılı sonuç yeni değişiklik için kanıt sayılmaz.

## Kaynak ve sürüm kaydı

Yıldız sayıları **18 Kasım 2026** tarihinde GitHub API üzerinden okunmuştur; bunlar
tek tek skillin değil kaynak deponun yıldız sayılarıdır ve kalite garantisi değildir.
Seçimde proje uyumu, bağımsız kullanılabilirlik ve örtüşmeyen sorumluluklar da gözetildi.

| Depo | Yıldız | Sabitlenen commit | Alınan skiller |
|---|---:|---|---|
| [mattpocock/skills](https://github.com/mattpocock/skills) | 327.340 | `5863806dd4e15c63174bee4e7515a4256792ecfa` | codebase-design, improve-codebase-architecture |
| [obra/superpowers](https://github.com/obra/superpowers) | 319.887 | `22f0b463e7a5e579904dd6211a520321035526f7` | systematic-debugging, verification-before-completion |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 118.888 | `39b723ceebf81474d0557c1fecd01eddab585563` | api-and-interface-design, code-review-and-quality, code-simplification |
| [ersinkoc/project-architect](https://github.com/ersinkoc/project-architect) | 259 | `220653ca9a0c47f8bf3f0c2cc35f9faf688e4169` | project-architect |
| [ersinkoc/security-check](https://github.com/ersinkoc/security-check) | 86 | `6a7d7461ab8f4e9ea823bf77c4cf05c9671a9bf6` | security-check ve ilgili web/API/AI kontrol referansları |
| [anthropics/skills](https://github.com/anthropics/skills) | 197.954 | `e4bb5d960d87126ff3b3a8af1a104b7db67560ba` | frontend-design |
| [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) | 1.223 | `434b7f91364665f2f733b310ec54809bf8f37937` | web-design-guidelines ve web interface kural referansları |

Makine tarafından okunabilir kayıt
[sources.lock.json](../.agents/skills/sources.lock.json) içindedir: kaynak depo, commit,
skill yolu, lisans ve özgün giriş dosyasının SHA-256 özeti saklanır.
Her skill kendi MIT `LICENSE` dosyasını içerir. `UPSTREAM.md` özgün girişin değişmemiş
kopyasıdır; yalnızca kaynak karşılaştırması içindir, aktif yönerge değildir. Uygulanacak
giriş `SKILL.md` dosyasıdır. Bunlar resmî upstream dağıtımın aynısı olarak sunulmaz.

Girişler kısaltılarak projeye uyarlandı: Claude'a özel araç/adres varsayımları,
zorunlu HTML raporları, mevcut projeyi baştan kurma, sürekli onay alma, bütün kataloğu
yükleme ve otomatik alt ajan kurma gereklilikleri kaldırıldı. Güvenlik referansları
gerektiğinde okunacak tekil belgeler olarak paketlendi; 51 ayrı skill etkinleştirilmedi.
Referanslardaki genel şablon ve örnekler proje sözleşmesiyle karşılaştırılarak kullanılır.

## Şimdilik eklenmeyenler

- [shadcn/ui](https://ui.shadcn.com/docs/skills): skill, shadcn bileşenlerini ve
  `components.json` yapılandırmasını yönetir. Mevcut DOM arayüzümüzde böyle bir kurulum yok.
- [wshobson/agents](https://github.com/wshobson/agents): incelenen `architecture-patterns`
  backend/DDD/mikroservis ağırlıklı; mevcut modüler tarayıcı uygulaması için seçilen
  modül tasarımı skilleri daha doğrudan uygundur.
- [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills): geniş
  katalogdan DevOps gibi ayrı bir ihtiyaç doğunca hedefli seçim yapılabilir.
- [Cody-Sims/agent-skills](https://github.com/Cody-Sims/agent-skills): taşınabilir skill
  biçimi mevcut kurulumda zaten kullanılıyor; ek bir ihtiyaç için seçim yapılmadı.
- [evanca/ai-agent-skills](https://github.com/evanca/ai-agent-skills): agent loop ve Claude
  cache teşhisi mevcut görev değil. AI öğretmenin kapsam sınır testleri ayrıca değerlendirilebilir.

## Güncelleme

Güncelleme için önce kaynak commit farkı ve lisans incelenir. Yerel `SKILL.md` ve proje
kuralları korunarak referanslar yenilenir; `UPSTREAM.md`, SHA-256 kaydı ve commit birlikte
güncellenir. Hareketli `main` dalından otomatik güncelleme yapılmaz.

Kurulumda girişlerin frontmatter/isim doğrulaması, aktif referansların bulunması,
özgün kaynak özetleri ve lisanslar kontrol edilir. Bu kontroller skill davranışının
bütün gelecek görevlerde doğru olacağını kanıtlamaz; gerçek kullanım bulgularıyla iyileştirilir.
