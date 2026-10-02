# AÖL Dijital Kitapçık — çalışma kuralları

Önce `docs/ARCHITECTURE.md` dosyasındaki özellik haritasını oku. İstenen özelliğin modülünü aç; bütün projeyi okumak gerekmez.

## Komutlar
- `npm ci`: kilitli bağımlılıkları kur.
- `npm run dev`: yerel geliştirme.
- `npm run check`: lint, TypeScript, mimari ve veri/arama testleri.
- `npm run build`: kontrolleri çalıştırıp `dist/` üret.
- `npm run test:e2e`: build sonrası tarayıcı akışlarını kontrol et.
- `npm run data:build`: Python kaynaklarından soru verilerini yeniden üret. Yalnızca veri güncellemesi isteniyorsa çalıştır.

## Değişiklik sınırları
- Bir özellik `src/features/<özellik>/` altında yaşar. Saf ortak fonksiyonlar `src/shared/`, veri yükleme ve sözleşmeler `src/data/` içindedir.
- Mevcut modül JavaScript olabilir. Yeni veri/iş mantığını strict TypeScript ile yaz. Dokunulan JS modülünü TypeScript'e taşımak, ancak görev kapsamına uyuyorsa uygundur. `any`, `@ts-ignore` veya denetimleri kapatarak hataları gizleme.
- Kaynak JS/TS/CSS dosyası en fazla 350 satır. Satırları sıkıştırarak sınırı aşma; sorumluluklarına göre böl. Üretilen JSON bu sınırın dışındadır.
- Döngüsel import ekleme. `shared` katmanı `features` veya `app` katmanına bağımlı olamaz.
- Paylaşılan state yalnızca `src/app/state.ts` içinde tanımlanır. Geçici, özelliğe özel durum ilgili modülde kalır. Yeni global değişken ekleme.
- `src/app/events.js` mevcut inline HTML olayları için uyumluluk sınırıdır. Yeni arayüz olaylarında `addEventListener` kullan. Mevcut inline fonksiyonların isimlerini değiştirirken bu dosyayı da güncelle.
- `index.html` uygulama kabuğudur. Buraya script/style blokları veya veri gömme.
- `scripts/build_webapp.py` yalnızca `data/subjects/` ve `src/data/generated/` üretir; arayüz kaynaklarını üretmez.
- Üretilen veriyi elle düzeltmek yerine veri üretim kaynağını bul. Kullanıcının mevcut JSON/ses değişikliklerini koru.
- Soru metinlerini HTML'e koyarken `escapeHtml` kullan. Röntgen HTML'i mevcut üretim zincirinden gelir; dış kaynaklı HTML için bu güveni varsayma.
- `aol_*` localStorage anahtarlarını ve soru kimliklerini değiştirirken eski kullanıcı verisine geçiş planı yap.

## Tamamlama
- İş mantığı/veri sınırı değişirse ilgili anlamlı testi ekle veya güncelle.
- `npm run build` çalıştır. Arayüz/olay/veri yükleme değişirse `npm run test:e2e` de çalıştır.
- Bir özellik taşınırsa mimari haritasını güncelle.
- Kontrol çalışamıyorsa bunu sonuçta açıkça belirt; çalışmış gibi yazma.
- Yayın çıktısı `dist/` klasörüdür. Kullanıcı yayın istemedikçe deploy etme.
