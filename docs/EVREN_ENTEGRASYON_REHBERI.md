# EVREN (SSYZ) Kapsamlı Entegrasyon ve Geliştirici Kılavuzu

T.C. Cumhurbaşkanlığı Savunma Sanayii Başkanlığı (SSB) bünyesinde çalışan yerli ve millî **EVREN Bare-Metal 64× H200 GPU** platformunun `aol-dijital-kitapcik (ortaklar)` projesine entegrasyon rehberidir.

---

## 1. Mimari Genel Bakış ve Çift Geçit (Dual Gateway) Yapısı

EVREN altyapısı tek bir API anahtarı (`evren_llm_...`) ile iki farklı amaca hizmet eden iki bağımsız geçit sunar:

| Geçit | Temel Adres | Görevi ve Yetenekleri | Kimlik Doğrulama |
| :--- | :--- | :--- | :--- |
| **1. LLM & Çıkarım Geçidi** | `https://evren-llmapi.ssyz.org.tr/v1` | OpenAI uyumlu çıkarım, Belge/Sayfa OCR (`/v1/ocr`), 1M Bağlamlı Akıl Yürütme, Stüdyo Seslendirme TTS (`/v1/audio/speech`), Konuşma Tanıma ASR, Vektör Gömme (Embedding), Yeniden Sıralama (Rerank) ve Karar Motoru (`/v1/systemone`). | `Authorization: Bearer <key>` veya `X-API-Key: <key>` |
| **2. Veri Seti & MLOps Geçidi** | `https://api.ssyz.org.tr/api/v1` | Veri seti yönetimi, doğrudan MinIO presigned URL ile dosya yükleme (`/datasets/{id}/upload/presign`), ZIP etiketli içe/dışa aktarma ve toplu etiketleme (`/annotations/bulk`). | `X-API-Key: <key>` |

---

## 2. 15 Milyon Token/Gün Kota, Limitler ve %3 Prefix-Cache Sırrı

* **1 Ocak 2027'ye Kadar Ücretsiz:** Tüm çıkarım modelleri test ve entegrasyon süresince tamamen ücretsizdir (`0.00 CR`).
* **15.000.000 Token / Gün Kotası:** Hesap başına günlük 15 milyon token tanımlanır. Her gece TSİ 03:00'te yenilenir.
* **500.000 TPM Burst & 32 Eşzamanlılık:** Dakikada 500k token'a kadar anlık patlamalar ve 32 paralel iş parçacığı (`Concurrency`) desteklenir.
* **%3 Prefix-Cache (Önbellek) Tasarrufu:**
  * Sunucu önbelleğinden okunan girdi token'ları kotaya **yalnızca %3 ağırlıkla** yazılır.
  * **Proje Taktigi:** Bir MEB ders kitabının 100 sayfasını veya ortak prompt'u sabit önbellek olarak tuttuğumuzda, 10 milyon token'lık okuma kotamıza sadece 300.000 token olarak yansır!

---

## 3. Model Filosu ve Projedeki Görev Haritası

| Model | Parametre | Bağlam | Görev & Uç Nokta | AÖL Dijital Kitapçık'taki Kullanımı |
| :--- | :--- | :--- | :--- | :--- |
| **`dots-ocr`** *(rednote/dots.mocr)* | 3B | 128K | `POST /v1/ocr` *(Adanmış)* | **PDF Kitap & Şekil OCR:** Sayfaları ve grafikleri doğrudan temiz Markdown ve SVG'ye çevirir (olmOCR: 83.9). |
| **`deepseek-ocr-2`** | 3.4B | 8K | `POST /v1/ocr` *(Adanmış)* | **Toplu Belge OCR:** Hızlı sayfa tarama. |
| **`deepseek-v4.1-flash`** | 763B (16B aktif) | **1M Token** | `POST /v1/chat/completions` | **Döneme Özel Istılah & Soru Çözümü:** 1M penceresiyle tüm PDF ders kitabını hafızaya alıp çıkmış sorulara adım adım öğretmen izahı yazar. |
| **`glm-5.3`** | 753B (40B aktif) | 512K / 1M | `POST /v1/chat/completions` | **Amiral Akıl Yürütme:** Çeldirici analizi ve sınav tuzaklarını formüle eder. |
| **`qwen3.8-flash-next`** | 180B (6B aktif) | 256K | `POST /v1/chat/completions` | **Canlı "Numûne-i Hiyel" Soru Asistanı:** Saniyede 126 token hızla öğrencilere anında Sokratik ipucu verir. |
| **`voxcpm2`** | 2B | 4K Karakter | `POST /v1/audio/speech` | **Stüdyo Kalitesinde Türkçe TTS:** %0,82 hata oranıyla 48 kHz doğal ses akışı (OpenAI TTS uyumlu). |
| **`qwen3-asr-1.7b`** | 2.3B | 32K | `POST /v1/audio/transcriptions` | **Sesle Soru Sorma (ASR):** Öğrencinin mikrofondan sorduğu soruyu metne çevirir. |
| **`qwen3-embedding-8b`** | 7.6B | 40K | `POST /v1/embeddings` | **Türkçe TR-TEB 1. Vektör Gömme:** İkiz soru eşleştirme ve ders kitabı sayfa atfı. |
| **`qwen3-reranker-8b`** | 8.8B | 4K | `POST /v1/rerank` | **Yeniden Sıralama:** Çıkmış soruya en yakın ders kitabı paragrafını bulur. |
| **`clef`** | 27B | 16K | `POST /v1/systemone` | **Olasılıklı Karar Motoru:** Şıkların çeldiricilik gücünü ve soru zorluğunu tek geçişte hesaplar. |
| **`laya`** | 0.32B | 8K | `POST /v1/systemone` | **Tipli Karar Motoru:** Türkçe ince ayarlı hızlı sınıflandırıcı. |
| **`auto`** | - | - | `POST /v1/chat/completions` | **Akıllı Yönlendirici:** İstek tipine göre filodaki en uygun modele otomatik dağıtır. |

---

## 4. Geliştirici Teknik İlkeleri & Sözleşme Kuralları

1. **Adanmış OCR Ucu Zorunluluğu:** `dots-ocr` ve `deepseek-ocr-2` modelleri yalnızca `POST /v1/ocr` üzerinden çalışır. `/v1/chat/completions` üzerinden çağrılırsa `400 endpoint_mismatch` hatası döner.
2. **Kullanım Şartları Kapısı:** İlk çağrıdan önce tek seferlik `GET /v1/terms/status` → `POST /v1/terms/accept` onayı gerekir ([scripts/core/evren_client.py](file:///home/mehmedbaykan/Homepage/codes/ortaklar/scripts/core/evren_client.py) bunu otomatik yapar).
3. **Akıl Yürütme ve Token Bütçesi:** `deepseek-v4.1-flash` gibi düşünen modellerde `max_tokens >= 2048` (önerilen: 4096) verilmelidir; anlık hızlı sohbette düşünce istenmiyorsa `thinking: false` gönderilmelidir.
4. **Kota Sorgulama:** `GET /v1/quota` uç noktası anlık kalan günlük token ve eşzamanlılık sınırlarını döner.

---

## 5. Projemizdeki Uygulama Mimarisi

1. **Ders Kitapları Hiyerarşisi (`docs/dersler/`):** [scripts/core/organize_course_folders.py](file:///home/mehmedbaykan/Homepage/codes/ortaklar/scripts/core/organize_course_folders.py) ile tüm 50 MEB ders kitabı `docs/dersler/<ders>/<ders>_<donem>/` klasörlerinde dönem dönem dilimlenmiş `.md` formatında tutulur (örn: `docs/dersler/mat/mat_1/mat_1.md`).
2. **Döneme Özel Istılah:** Kitabın ilgili dönem üniteleri taranarak [src/data/textbook.ts](file:///home/mehmedbaykan/Homepage/codes/ortaklar/src/data/textbook.ts) sözleşmesine uygun `ScopedConceptEntry` verileri çıkarılır.
3. **Öğretmen Zihni Çözüm İzahı:** Çıkmış sorular için `deepseek-v4.1-flash` ile 4 aşamalı dikey öğretmen çözümleri üretilir.
4. **Canlı Asistan & Ses:** [functions/api/ask-ai.ts](file:///home/mehmedbaykan/Homepage/codes/ortaklar/functions/api/ask-ai.ts) üzerinden `qwen3.8-flash-next` ve [functions/api/tts.ts](file:///home/mehmedbaykan/Homepage/codes/ortaklar/functions/api/tts.ts) üzerinden `voxcpm2` çağrılır.

---

## 6. Evren İteratif Kavram & Formül Denetim Hattı (`pipeline`)

[scripts/core/evren_iterative_audit_pipeline.py](file:///home/mehmedbaykan/Homepage/codes/ortaklar/scripts/core/evren_iterative_audit_pipeline.py) betiği "fazla da olmasın, eksik de olmasın" dengesini korumak için 4 aşamalı döngü çalıştırır:

1. **Aşama 1 — Ders ve Dönem Dilimi:** Soru havuzundaki dersin (örn: MAT 1) MEB kitabı metni hafızaya alınır.
2. **Aşama 2 — Envanter & Çapraz Kontrol:** Soru kökleri ve şıklardaki kavramlar taranır; kitabın sayfa/ünite numarasıyla eşleştirilir.
3. **Aşama 3 — Evren Derin Denetimi (False Positive / Omission Filtresi):**
   * Günlük dilde geçen ama terim olmayan yanıltıcı kelimeler (örn: "bağlıdır", "kuvvet", "sıcaklık"ın günlük kullanımı) elenir.
   * Eksik kalmış sınav formülleri ve kritik kurallar (örn: De Morgan, 100 Kuralı, EBOB-EKOK) tespit edilip eklenir.
4. **Aşama 4 — Zenginleştirme & JSON Çıktısı:** Soru köklerine (`soru_xray`) ve şıklarına (`secenekler_xray`) format standardına uygun olarak işlenir.

---

## 7. Baloncuk Biçimlendirme & Markdown/KaTeX Standardı

Evren'in ürettiği kavram ve formül baloncukları aşağıdaki standarda uyar:
* **Sade Tanım:** 1–2 cümlelik kısa tanımlar düz metin olarak verilir (`Kesin olarak doğru ya da yanlış hüküm bildiren...`).
* **Maddeli Özellikler:** Birden fazla kural veya özellik varsa Markdown madde imi ve kalın başlık kullanılır (`• **Ve ($p \wedge q$):** Yalnızca her ikisi de 1 iken 1'dir.`).
* **Matematik & Formül:** KaTeX uyumlu `$formül$` ve `$$blok$$` kullanılır (`$p \Rightarrow q \equiv p' \vee q$`).
* **Hayat Kurtaran İpucu:** En altta ipucu kutusu açılır (`💡 Formül / İpucu: ...`).
* **Önemli Not:** `src/shared/math-render.ts` içerisindeki token-placeholder derleyicisi bu Markdown ve KaTeX ifadelerini çakışmasız ve güvenle derler.

---

## 8. Ortam Değişkenleri (.env)

Evren altyapısını çalıştırmak için proje kökündeki `.env` dosyasında şu anahtarlar tanımlanır:
```bash
EVREN_API_KEY=evren_llm_...
EVREN_BASE_URL=https://evren-llmapi.ssyz.org.tr/v1
```
İstemci ([scripts/core/evren_client.py](file:///home/mehmedbaykan/Homepage/codes/ortaklar/scripts/core/evren_client.py)) bu değerleri otomatik olarak yükler ve kullanım şartları onayını şeffaf biçimde gerçekleştirir.
