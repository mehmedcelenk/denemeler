# Mimari ve özellik haritası

Bu proje Vite, ES modülleri ve kademeli TypeScript kullanır. React yoktur. Mevcut DOM tabanlı arayüz korunmuştur. TypeScript bugün soru sözleşmesini, paylaşılan durumu ve arama yardımcılarını denetler; bütün JavaScript arayüzünü henüz tip denetiminden geçirmez. JS kaynakları ESLint ile denetlenir.

## Nerede değişiklik yapacağım?

| İstek | Başlangıç dosyası |
|---|---|
| Başlangıç akışı | `src/app/bootstrap.js` |
| Paylaşılan durum | `src/app/state.ts` |
| Soru veri biçimi/doğrulama | `src/data/question.ts` |
| JSON yükleme/önbellek | `src/data/questions.js` |
| Ders adları/kodları | `src/data/subjects.js` |
| Arama ekranı | `src/features/search/search.js` |
| Türkçe arama eşleştirmesi | `src/shared/search.ts` |
| Ders/kademe seçimi | `src/features/subjects/selection.js` |
| Ortak konu anahtarı | `src/shared/topic.ts` |
| Kayıtlı cevap doğrulama | `src/shared/saved-choices.ts` |
| Konu gruplama/kesişim | `src/features/subjects/topic-model.js` |
| Konu listesi | `src/features/subjects/topics.js` |
| Kitapçığa hangi sorular girecek? | `src/features/booklet/selection.js` |
| Soru kartı, şıklar, sayfalama | `src/features/booklet/render.js` |
| Cevap işaretleme/geri alma | `src/features/answers/marking.js` |
| Cevap ve ipucu gösterme | `src/features/answers/reveal.js` |
| Cevapların kalıcı kaydı | `src/features/answers/storage.js` |
| Ses/TTS | `src/features/audio/audio.js` |
| Kelime balonu | `src/features/english/vocabulary.js` |
| Çeviri/röntgen/tuzak açıklaması | `src/features/english/translations.js` |
| Tema, vurgu rengi, sütun/zoom | `src/features/appearance/` |
| Hesap makinesi | `src/features/calculator/calculator.js` |
| Yazdırma/PDF | `src/features/print/print.js` |
| Ezan sayacı | `src/features/prayer/prayer.js` |
| CSS | `src/styles/` altında ilgili özellik dosyası |

## Çalışma akışı

`index.html → src/main.js → olay bağlantıları → startApp()`.
Başlangıçta kayıtlı tercihler okunur, ilk dersin JSON'u yüklenip doğrulanır ve kitapçık çizilir. Diğer ders verileri ihtiyaç oldukça yüklenir. Tekrarlanan eşzamanlı yüklemeler aynı promise'i kullanır.

Özellikler açık `import` ifadeleriyle birbirini çağırır. Ortak değişkenlerin tek kaynağı `app/state.ts` dosyasıdır. Özellikle ses oynatıcı ve hesap makinesi geçici durumlarını kendi dosyalarında tutar. `shared` saf yardımcıları uygulamayı başlatmaz ve DOM'a bağlı değildir.

Python akışı:

`scripts/ciktilar/analiz + scripts/*_data.py → build_webapp.py → data/subjects + src/data/generated`.

Arayüz kodu Python içinde tutulmaz. Veri güncellemesi HTML/CSS/JS dosyalarını yeniden yazmaz. `data/` ve `audio/` yolları korunmuştur; Vite build bu klasörleri ve `CNAME` dosyasını `dist/` içine kopyalar.

## Bir değişikliği AI ile yaptırmak

Örnek istek:

> Arama sonuçlarına ders adına göre sıralama ekle. Önce AGENTS.md ve mimari haritasını oku. Arama modülünü ve gerekiyorsa saf arama yardımcılarını değiştir. Mevcut Türkçe eşleştirmeyi koru. İlgili testi güncelle, build ve tarayıcı kontrollerini çalıştır.

Önce davranışı ve kabul ölçütünü tarif et: örneğin “sayfa yenilenince işaretlenen cevap korunmalı”. Her değişiklikte bütün uygulamayı yeniden yazdırmak yerine ilgili özellik üzerinde çalış. Dosya sınırı otomatik denetlenir; sınırı aşınca anlamlı bir alt sorumluluğu ayrı modüle taşı.

## Kontrollerin kapsamı

- ESLint: JavaScript'teki tanımsız/değersiz değişkenler ve temel hatalar.
- TypeScript strict: `.ts` dosyalarındaki veri sözleşmeleri; mevcut `.js` dosyalarının tamamı için garanti değildir.
- Mimari kontrol: eksik import, döngüsel import, katman ihlali, 350 satır sınırı, HTML'ye gömülü JS/CSS.
- Veri testleri: tüm ders JSON'larının yapısı, benzersiz soru kimlikleri, manifest sayıları, hatalı verinin reddi ve Türkçe arama.
- Tarayıcı testleri: gerçek üretim çıktısında ders/arama, cevap kaydı ve geri alma, İngilizce araçları, görünüm ve mobil açılış.

## Mevcut sınırlar

Eski statik ve dinamik şablonlarda inline `onclick` gibi olaylar bulunur. `app/events.js` yalnızca bu isimleri `window` üzerine bağlar. Bu açık bir uyumluluk katmanıdır; yeni özelliklerde olayları `addEventListener` ile bağla. Tüm eski olayları bir seferde dönüştürmek gerekmez.

Kitapçık render fonksiyonu halen HTML şablonu üretir. Yeni bir kart türü veya daha karmaşık bölüm eklenirse ayrı renderer'a çıkar. React ihtiyacı ileride değerlendirilirken veri sözleşmeleri ve saf yardımcılar yeniden kullanılabilir.

Bu düzen AI değişikliklerini kontrol edilebilir hale getirir; otomatik kontroller her olası davranış hatasını tespit etmez. Özellikle sesin gerçekten duyulması ve fiziksel yazdırma ayrıca kullanıcı cihazında kontrol gerektirir.
