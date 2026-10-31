# EVREN LLM ve Temel Model Kataloğu

| Model API Adı | Kategori | Rol / Başlık | Parametre / Mimari | Bağlam (Context) | Ek Modalite |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `glm-5.3` | Akıl Yürütme · Kod · Ajan | Amiral model | 753B (~40B aktif · MoE) | 1024K | Metin |
| `deepseek-v4.1-flash` | Akıl Yürütme · Kod · Ajan | Yeni nesil kod ve ajan modeli | 763B (552B omurga + 196B Engram · ~16B aktif) | - | görsel |
| `mimo-v2.6-pro` | Akıl Yürütme · Kod · Ajan | Uzun soluklu ajan modeli | 1.020B (~42B aktif · MoE) | - | görsel, video, ses |
| `deepseek-v4-flash` | Akıl Yürütme · Kod · Ajan | Kod ve ajan uzmanı | 284B (~13B aktif · MoE) | - | Metin |
| `qwen3.8-flash-next` | Akıl Yürütme · Kod · Ajan | Yüksek hacimli sohbet | 180B (~6B aktif · MoE) | - | görsel |
| `gemma-4-31b` | Akıl Yürütme · Kod · Ajan | Hızlı sohbet ve belge okuma | 31,3B (yoğun (dense) · görsel kodlayıcı dahil) | - | görsel |
| `qwen3-vl-30b` | Görsel Anlama | Görsel akıl yürütme | 31,1B (~3B aktif · MoE) | - | görsel |
| `qwen3-embedding-8b` | Arama · Gömme · Güvenlik | Metin gömme (vektörleştirme) | 7,6B (yoğun (dense)) | - | Metin |
| `qwen3-reranker-8b` | Arama · Gömme · Güvenlik | Yeniden sıralama (rerank) | 8,8B (yoğun (dense) · Qwen3-VL-Reranker) | - | Metin |
| `qwen3-guard-4b` | Arama · Gömme · Güvenlik | İçerik güvenliği | 4,4B (yoğun (dense)) | - | Metin |
| `dots-ocr` | Belge ve Ses | İnteraktif belge OCR + SVG | 3,0B (yoğun (dense)) | - | görsel |
| `deepseek-ocr-2` | Belge ve Ses | Toplu arşiv OCR | 3,4B (yoğun (dense)) | - | görsel |
| `laya` | Karar · Sınıflandırma | Tipli karar motoru | 0,32B (mmBERT-base · EVREN Türkçe ince ayarı) | - | Metin |
| `clef` | Karar · Sınıflandırma | Görsel destekli karar modeli | 27B (Qwen3.8-27B omurga + ortak karar başlığı · Cloudflare) | - | görsel |
| `clef-flash` | Karar · Sınıflandırma | Hızlı görsel destekli karar modeli | 9B (Qwen3.5-9B omurga + ortak karar başlığı · Cloudflare) | - | görsel |
| `qwen3-asr-1.7b` | Belge ve Ses | Konuşma tanıma (ASR) | 2,3B (dil modeli 1,7B + ses kodlayıcı) | - | Metin |
| `voxcpm2` | Belge ve Ses | Metinden sese (TTS) | 2B (MiniCPM4 omurga + difüzyon ses çözücü · OpenBMB) | - | ses |

## Model Detay Açıklamaları

### `glm-5.3` — Amiral model
- **Kategori:** Akıl Yürütme · Kod · Ajan
- **Parametre:** 753B (~40B aktif · MoE)
- **Bağlam Penceresi:** 1,048,576 token
- **Açıklama:** Derin akıl yürütme, kod üretimi, çok adımlı ajan döngüsü, uzun belge analizi. Filodaki **en yetenekli** model.

### `deepseek-v4.1-flash` — Yeni nesil kod ve ajan modeli
- **Kategori:** Akıl Yürütme · Kod · Ajan
- **Parametre:** 763B (552B omurga + 196B Engram · ~16B aktif)
- **Modaliteler:** görsel
- **Sürüm / Revizyon:** 1017 (17 Ekim 2026 sürümü — 18 Ekim 2026'dan beri hizmette)
- **Açıklama:** DeepSWE 77,0 ve Terminal-Bench 4.0 42,3 ile ajan görevlerinde **en güçlü DeepSeek**. Görevleri daha kısa çıktılarla tamamlar. **1M bağlam**, görsel girdi ve 1-100 arası ayarlanabilir düşünme bütçesi.

### `mimo-v2.6-pro` — Uzun soluklu ajan modeli
- **Kategori:** Akıl Yürütme · Kod · Ajan
- **Parametre:** 1.020B (~42B aktif · MoE)
- **Modaliteler:** görsel, video, ses
- **Açıklama:** Filonun **en büyük** modeli: DeepSWE 71,9, Terminal-Bench 2.1 89,9, OSWorld-Verified 82,0. **1M bağlam**, araç çağırma ve düşünme modu; görsel, video ve ses girdisini de anlar (base64 olarak gömülü).

### `deepseek-v4-flash` — Kod ve ajan uzmanı
- **Kategori:** Akıl Yürütme · Kod · Ajan
- **Parametre:** 284B (~13B aktif · MoE)
- **Açıklama:** Yarışma seviyesi kod üretimi, 1M bağlam, ayarlanabilir düşünme bütçesi. Emekliye ayrıldı; **1 Ocak 2027** tarihine kadar eski ad **deepseek-v4.1-flash** modeline yönlenir.

### `qwen3.8-flash-next` — Yüksek hacimli sohbet
- **Kategori:** Akıl Yürütme · Kod · Ajan
- **Parametre:** 180B (~6B aktif · MoE)
- **Modaliteler:** görsel
- **Açıklama:** Vibe coding ve uzun bağlam ajan görevleri. Aktif parametresi düşük olduğu için **en yüksek eşzamanlılık**; görsel yetenek ikincil.

### `gemma-4-31b` — Hızlı sohbet ve belge okuma
- **Kategori:** Akıl Yürütme · Kod · Ajan
- **Parametre:** 31,3B (yoğun (dense) · görsel kodlayıcı dahil)
- **Modaliteler:** görsel
- **Açıklama:** Görüntü anlama, nesne tespiti (bbox), ekran/arayüz yorumlama, grafik okuma, el yazısı çözümleme. Düşük gecikmeli günlük iş modeli.

### `qwen3-vl-30b` — Görsel akıl yürütme
- **Kategori:** Görsel Anlama
- **Parametre:** 31,1B (~3B aktif · MoE)
- **Modaliteler:** görsel
- **Açıklama:** Belge, grafik, ekran görüntüsü ve birden çok görseli birlikte yorumlar. Görseller base64 olarak gömülü gönderilir. Model video da anlayabilir, ancak geçitte **video girdisi şu an kapalı**.

### `qwen3-embedding-8b` — Metin gömme (vektörleştirme)
- **Kategori:** Arama · Gömme · Güvenlik
- **Parametre:** 7,6B (yoğun (dense))
- **Açıklama:** Türkçe gömme ölçütü TR-TEB'de **birinci** (64,58). Matryoshka ile 32-4096 arası ayarlanabilir vektör boyutu.

### `qwen3-reranker-8b` — Yeniden sıralama (rerank)
- **Kategori:** Arama · Gömme · Güvenlik
- **Parametre:** 8,8B (yoğun (dense) · Qwen3-VL-Reranker)
- **Açıklama:** Arama sonuçlarını sorguya göre alaka düzeyine dizer (**POST /v1/rerank**). Model çok modlu bir sıralayıcıdır; geçitteki uç şu an **yalnızca metin** belge kabul eder.

### `qwen3-guard-4b` — İçerik güvenliği
- **Kategori:** Arama · Gömme · Güvenlik
- **Parametre:** 4,4B (yoğun (dense))
- **Açıklama:** Metinleri **güvenli**, **tartışmalı** veya **güvensiz** olarak sınıflandırır ve tespit edilen risk kategorilerini bildirir. OpenAI moderasyon biçimi için **POST /v1/moderations** (ücretsiz), ham model çıktısı için sohbet ucu kullanılır.

### `dots-ocr` — İnteraktif belge OCR + SVG
- **Kategori:** Belge ve Ses
- **Parametre:** 3,0B (yoğun (dense))
- **Modaliteler:** görsel
- **Açıklama:** Grafik, tablo, bilimsel şekil ve kimyasal diyagramı doğrudan **SVG koduna** çevirir. olmOCR ölçütü 83,9.

### `deepseek-ocr-2` — Toplu arşiv OCR
- **Kategori:** Belge ve Ses
- **Parametre:** 3,4B (yoğun (dense))
- **Modaliteler:** görsel
- **Açıklama:** Yüksek hacimli belge dijitalleştirme. Toplu iş kuyruğunda çalışır, maliyeti en düşük OCR yolu.

### `laya` — Tipli karar motoru
- **Kategori:** Karar · Sınıflandırma
- **Parametre:** 0,32B (mmBERT-base · EVREN Türkçe ince ayarı)
- **Açıklama:** Metin üretmez: bir metin için tanımladığınız **choice**, **score** ve **noul** (evet/hayır) sorularını **tek geçişte** olasılıklarıyla yanıtlar. Talep yönlendirme, aciliyet, şikâyet ve iptal riski, içerik denetimi. Yalnızca **POST /v1/systemone** ucundan çağrılır.

### `clef` — Görsel destekli karar modeli
- **Kategori:** Karar · Sınıflandırma
- **Parametre:** 27B (Qwen3.8-27B omurga + ortak karar başlığı · Cloudflare)
- **Modaliteler:** görsel
- **Açıklama:** Metin üretmez: **choice**, **score** ve **noul** sorularını **tek geçişte** olasılıklarıyla yanıtlar; metnin yanında **en fazla 4 görsel** de okur. Uzun belge, sözleşme ve çok alanlı JSON kayıtlarında Laya'dan belirgin şekilde daha isabetli. Yalnızca **POST /v1/systemone** ucundan çağrılır.

### `clef-flash` — Hızlı görsel destekli karar modeli
- **Kategori:** Karar · Sınıflandırma
- **Parametre:** 9B (Qwen3.5-9B omurga + ortak karar başlığı · Cloudflare)
- **Modaliteler:** görsel
- **Açıklama:** Clef ailesinin hızlı üyesi: **choice**, **score** ve **noul** sorularını **tek geçişte** yanıtlar, metnin yanında **en fazla 4 görsel** okur. Yalnızca **POST /v1/systemone** ucundan çağrılır.

### `qwen3-asr-1.7b` — Konuşma tanıma (ASR)
- **Kategori:** Belge ve Ses
- **Parametre:** 2,3B (dil modeli 1,7B + ses kodlayıcı)
- **Açıklama:** Ses kaydını metne çevirir. 30 dil desteği; **Türkçe teyitli**. Toplantı, çağrı merkezi ve altyazı akışları için.

### `voxcpm2` — Metinden sese (TTS)
- **Kategori:** Belge ve Ses
- **Parametre:** 2B (MiniCPM4 omurga + difüzyon ses çözücü · OpenBMB)
- **Modaliteler:** ses
- **Açıklama:** Metni **48 kHz** stüdyo kalitesinde doğal sese çevirir. Çok dilli testte Türkçe kelime hata oranı **%0,82**; sayı, tarih ve kısaltmaları Türkçe okur. Dört hazır ses sunar (**deniz**, **ece**, **emre**, **kaan**); aynı ses seçilen ayrı istekler de aynı konuşmacıyla okunur. Dilerseniz sesi İngilizce bir tarifle de belirleyebilirsiniz (**instructions**); uzun metinler baştan sona aynı sesle okunur. Gerçek zamanın ~8 katı hızla üretir, akışlı yanıtta ilk ses yaklaşık 1 saniyede gelir. **POST /v1/audio/speech** ucundan çağrılır.

