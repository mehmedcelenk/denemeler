# Mimari ve özellik haritası

Nihai mimari sözleşmenin tek başvuru belgesi [MASTER_MIMARI_BLUEPRINT.md](MASTER_MIMARI_BLUEPRINT.md) dosyasıdır. Bu harita, sözleşmenin kod tabanındaki uygulama noktalarını gösterir. Eski analiz raporları `docs/archive/` altında yalnızca tarihsel kayıt olarak saklanır.

Bu proje Vite, ES modülleri ve kademeli TypeScript kullanır. React yoktur. Mevcut DOM tabanlı arayüz korunmuştur. TypeScript bugün soru sözleşmesini, paylaşılan durumu ve arama yardımcılarını denetler; bütün JavaScript arayüzünü henüz tip denetiminden geçirmez. JS kaynakları ESLint ile denetlenir.

## Nerede değişiklik yapacağım?

| İstek | Başlangıç dosyası |
|---|---|
| Başlangıç akışı | `src/app/bootstrap.js` |
| `data-action` kaydı ve olay delegasyonu | `src/app/actions.ts`, `src/app/events.js` & özelliklerin `init.ts` modülleri |
| Paylaşılan durum, tipler ve olay omurgası | `src/app/state.ts`, `state-types.ts` & `state-events.ts` |
| Kalıcı depolamanın merkezi kapısı | `src/app/storage.ts`; anahtar sözlüğü: `src/shared/storage-keys.ts` |
| Soru veri biçimi/doğrulama | `src/data/question.ts` |
| Dijital ders kitabı & dönemsel ıstılah şeması | `src/data/textbook.ts` |
| PDF ders kitabını Markdown/JSON'a çevirme | `scripts/core/pdf_to_book.py` & `scripts/core/evren_client.py` |
| EVREN (SSYZ) GPU & AI Entegrasyon Rehberi | `docs/EVREN_ENTEGRASYON_REHBERI.md` |
| EVREN İstemcisi | `scripts/core/evren_client.py` |
| MEB Kitap İndirme & Dönem Markdown Dilimleme | `scripts/core/download_all_courses.py` & `scripts/core/organize_course_folders.py` |
| Hassas Kavram & Formül Katalogları | `scripts/core/*_precise_catalog.py` & `data/concepts/` |
| JSON yükleme & Supabase Hibrit Fallback | `src/data/questions.js` & `src/data/supabase-client.ts` |
| Supabase DDL Şeması & Toplu Aktarım | `supabase/schema.sql` & `scripts/core/sync_to_supabase.py` |
| Ders adları/kodları | `src/data/subjects.js` |
| Arama ekranı | `src/features/search/search.js` |
| Türkçe arama eşleştirmesi | `src/shared/search.ts` |
| Ders/kademe seçimi | `src/features/subjects/selection.js` & `selection-model.ts` |
| Ortak konu anahtarı | `src/shared/topic.ts` |
| Kayıtlı cevap doğrulama | `src/shared/saved-choices.ts` |
| Konu gruplama/kesişim | `src/features/subjects/topic-model.js` |
| Konu listesi | `src/features/subjects/topics.js` |
| Kitapçığa hangi sorular girecek? | `src/features/booklet/selection.js` |
| Soru kartı, şıklar, sayfalama ve eklenti kancaları | `src/features/booklet/render.js`, `question-card.ts` & `card-hooks.ts` |
| Soru Özellik Çubuğu & Şık Eleme | `src/features/booklet/features-bar.ts` |
| Cevap işaretleme/geri alma | `src/features/answers/marking.ts` |
| Cevap ve ipucu gösterme | `src/features/answers/marking.ts` |
| Cevapların kalıcı kaydı | `src/features/answers/storage.ts` |
| Seri ve kombo bildirimleri | `src/features/gamification/combo-toast.ts` & `src/shared/combo.ts` |
| Kelime balonu | `src/features/english/vocabulary.js` |
| Kelime meali (satır arası çeviri) | `src/features/english/interlinear.ts` |
| Çeviri/röntgen/tuzak açıklaması | `src/features/english/translations.js` |
| Tema, vurgu rengi, sütun/zoom | `src/features/appearance/` |
| Yazdırma/PDF | `src/features/print/print.js` |
| Ezan sayacı | `src/features/prayer/prayer.js` |
| Sınıf oturumu & odak takibi | `src/features/classroom/room-service.ts`, `message-handlers/`, `offline-students.ts` & `teacher-view.ts` |
| Tahta görünümü & etkileşimleri | `src/features/board/board-mode.ts` & `board-view.ts` |
| CSS | `src/styles/` altında ilgili özellik dosyası; büyük stil girişleri sıralı `@import` ile bileşen parçalarını yükler |

## Çalışma akışı

`index.html → src/main.js → olay bağlantıları → startApp()`.
Başlangıçta kayıtlı tercihler okunur, ilk dersin JSON'u yüklenip doğrulanır ve kitapçık çizilir. `src/data/questions.js` yalnızca doğrulanmış soruları döndürür; çağıran uygulama/özellik modülü bunları `store.appendQuestions` ile state'e ekler. Diğer ders verileri ihtiyaç oldukça yüklenir. Tekrarlanan eşzamanlı yüklemeler aynı promise'i kullanır.

Çekirdek özellikler (`answers`, `booklet`, `subjects`, `appearance`) silinebilir eklentileri doğrudan import etmez. Cevap yan etkileri `app/state-events.ts` olaylarıyla, soru kartı uzantıları `booklet/card-hooks.ts` kancalarıyla bağlanır; eklentiler kayıtlarını `app/bootstrap.js` içindeki kendi `init*` fonksiyonlarında yapar. Ortak değişkenlerin tek kaynağı `app/state.ts` dosyasıdır. Ses oynatıcının geçici durumu kendi modülünde tutulur. Kalıcılık işlemleri yalnızca `app/storage.ts` üzerinden yürür; `shared` saf yardımcıları uygulamayı başlatmaz ve DOM'a bağlı değildir.

Python akışı:

`data/raw_pipeline/ + scripts/*_data.py → build_webapp.py → data/subjects + src/data/generated`.

Arayüz kodu Python içinde tutulmaz. Veri güncellemesi HTML/CSS/JS dosyalarını yeniden yazmaz. `data/` ve `audio/` yolları korunmuştur; Vite build çalışma anında gereken verileri ve varlıkları `dist/` içine kopyalar.

## Bir değişikliği AI ile yaptırmak

Örnek istek:

> Arama sonuçlarına ders adına göre sıralama ekle. Önce AGENTS.md ve mimari haritasını oku. Arama modülünü ve gerekiyorsa saf arama yardımcılarını değiştir. Mevcut Türkçe eşleştirmeyi koru. İlgili testi güncelle, build ve tarayıcı kontrollerini çalıştır.

Önce davranışı ve kabul ölçütünü tarif et: örneğin “sayfa yenilenince işaretlenen cevap korunmalı”. Her değişiklikte bütün uygulamayı yeniden yazdırmak yerine ilgili özellik üzerinde çalış. Dosya sınırı otomatik denetlenir; sınırı aşınca anlamlı bir alt sorumluluğu ayrı modüle taşı.

## Kontrollerin kapsamı

- ESLint: JavaScript'teki tanımsız/değersiz değişkenler ve temel hatalar.
- TypeScript strict: `.ts` dosyalarındaki veri sözleşmeleri; mevcut `.js` dosyalarının tamamı için garanti değildir.
- Mimari kontrol: eksik import, döngüsel import, katman/Jenga izolasyonu ihlali, 300 satır sınırı, HTML'ye gömülü JS/CSS. Satır sınırı `src/`, `functions/`, `edge/`, testler, bakım betikleri ve kök yapılandırma kaynakları için geçerlidir.
- Veri testleri: tüm ders JSON'larının yapısı, benzersiz soru kimlikleri, manifest sayıları, hatalı verinin reddi ve Türkçe arama.
- Tarayıcı testleri: gerçek üretim çıktısında ders/arama, cevap kaydı ve geri alma, İngilizce araçları, görünüm ve mobil açılış.

## Mevcut sınırlar

Özellikler `data-action` işleyicilerini kendi `init` fonksiyonlarında `app/actions.ts` ile kaydeder. `app/events.js` click/change olaylarını tek noktadan bu kayıtlara yönlendirir; eklenti import etmez. `change` kontrolleri `data-action-event="change"`, yalnızca arka plana tıklamayla kapanan katmanlar `data-action-self="true"` kullanır. Eski dinamik şablonlarda inline `onclick` gibi olaylar bulunur. Bunların çekirdek isimleri `registerLegacyHandlers()` içinde, eklenti isimleri ilgili eklentinin `init` modülünde `window` üzerine bağlanır. Yeni özelliklerde registry veya `addEventListener` kullanılır.

Kitapçık render fonksiyonu halen HTML şablonu üretir. Yeni bir kart türü veya daha karmaşık bölüm eklenirse ayrı renderer'a çıkar. React ihtiyacı ileride değerlendirilirken veri sözleşmeleri ve saf yardımcılar yeniden kullanılabilir.

Bu düzen AI değişikliklerini kontrol edilebilir hale getirir; otomatik kontroller her olası davranış hatasını tespit etmez. Özellikle sesin gerçekten duyulması ve fiziksel yazdırma ayrıca kullanıcı cihazında kontrol gerektirir.
