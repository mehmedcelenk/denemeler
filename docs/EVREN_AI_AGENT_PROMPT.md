# EVREN (SSYZ) Yapay Zekâ ve GPU Entegrasyon Spesifikasyonu (AI Agent Master Prompt)

Bu doküman, herhangi bir kodlama veya otomasyon dosyasında **EVREN Bare-Metal 64× H200 GPU Platformu**'nu entegre edecek yapay zekâ ajanları (Cursor, Claude, Copilot, ChatGPT vb.) için hazırlanmış eksiksiz teknik kılavuz ve talimattır.

---

## 1. Kimlik ve Kimlik Doğrulama Bilgileri (Credentials)

Projeye ait aktif EVREN API anahtarı ve temel adresler:

* **EVREN API Anahtarı:** `<EVREN_API_KEY>`
* **LLM & Çıkarım Geçidi (Inference Base URL):** `https://evren-llmapi.ssyz.org.tr/v1`
* **Veri Seti & MLOps Geçidi (Dataset Base URL):** `https://api.ssyz.org.tr/api/v1`
* **Ortam Değişkenleri (.env formatı):**
  ```bash
  EVREN_API_KEY=<EVREN_API_KEY>
  EVREN_BASE_URL=https://evren-llmapi.ssyz.org.tr/v1
  ```

---

## 2. Çift Geçit (Dual Gateway) ve Yetkilendirme Kuralları

Tüm isteklerde iki yetkilendirme başlığı birlikte veya `Bearer` olarak gönderilmelidir:

```http
Authorization: Bearer <EVREN_API_KEY>
X-API-Key: <EVREN_API_KEY>
Content-Type: application/json
```

1. **LLM & Çıkarım Geçidi (`https://evren-llmapi.ssyz.org.tr/v1`):**
   * OpenAI uyumlu `/v1/chat/completions`
   * Adanmış OCR ucu `/v1/ocr`
   * Vektör Gömme `/v1/embeddings`
   * Yeniden Sıralama `/v1/rerank`
   * Stüdyo Seslendirme TTS `/v1/audio/speech`
   * Konuşma Tanıma ASR `/v1/audio/transcriptions`
   * Karar Motorları `/v1/systemone`
   * Kota Takibi `/v1/quota`

2. **Veri Seti Geçidi (`https://api.ssyz.org.tr/api/v1`):**
   * Veri seti oluşturma, presigned MinIO yüklemeleri ve bulk etiketleme.

---

## 3. Kota, Limitler ve %3 Prefix-Cache Mimarisi

* **15.000.000 Token / Gün:** Günlük hesap kotası 15 milyon tokendir. Her gece TSİ 03:00'te sıfırlanır.
* **500.000 TPM Burst & 32 Eşzamanlılık:** Dakikada 500k token patlama limiti ve maksimum 32 paralel iş parçacığı desteklenir.
* **%3 Prefix-Cache İndirimi:** Sunucu önbelleğinden okunan girdi (prompt) token'ları kotaya yalnızca **%3 ağırlıkla** yazılır. Büyük bağlamlı (100 sayfalık kitap veya sistem talimatı) tekrarlayan isteklerde devasa tasarruf sağlar.
* **Kota Başlıkları:** İstek yanıtlarında `x-evren-daily-remaining-tokens` başlığıyla anlık kalan kota takip edilebilir.

---

## 4. Kullanım Şartları (Terms Acceptance Gate) Kuralı

EVREN ile ilk iletişimde kullanım şartlarının onaylanmış olması zorunludur. Ajan istemciye mutlaka şu kontrolü eklemelidir:

1. `GET /v1/terms/status` çağrılır.
2. Eğer `accepted: false` ise:
   * `GET /v1/terms/text` okunur.
   * `POST /v1/terms/accept` gövdesinde `{"version": current_version}` gönderilerek onaylanır.

---

## 5. Model Filosu ve Doğru Uç Nokta Eşlemesi

| Model Adı | Parametre | Bağlam | Uç Nokta (Endpoint) | Kullanım Amacı / Açıklama |
| :--- | :--- | :--- | :--- | :--- |
| **`deepseek-v4.1-flash`** | 763B (16B aktif) | **1M Token** | `POST /v1/chat/completions` | **Derin Muhakeme & Müfredat Mimarisi:** 1 milyon token bağlamıyla kitap analizleri, pedagojik açıklamalar, JSON çıktıları. *(max_tokens >= 2048 olmalıdır).* |
| **`glm-5.3`** | 753B (40B aktif) | 512K / 1M | `POST /v1/chat/completions` | **Amiral Akıl Yürütme:** Çeldirici analizi ve karmaşık mantık adımları. |
| **`qwen3.8-flash-next`** | 180B (6B aktif) | 256K | `POST /v1/chat/completions` | **Ultra Hızlı İnteraktif Asistan:** 126 token/sn hız. Hızlı yanıtlarda `thinking: false` verilerek gecikme düşürülür. |
| **`dots-ocr`** | 3B | 128K | `POST /v1/ocr` *(Adanmış)* | **Görsel/PDF'ten Markdown & SVG:** Formülleri, tabloları ve şekilleri kusursuz ayrıştırır. **DİKKAT:** `/chat/completions` üzerinden çağrılamaz! |
| **`deepseek-ocr-2`** | 3.4B | 8K | `POST /v1/ocr` *(Adanmış)* | Hızlı belge OCR işlemleri. |
| **`voxcpm2`** | 2B | 4K Karakter | `POST /v1/audio/speech` | **Stüdyo Kalitesinde Türkçe TTS:** 48 kHz doğal ses akışı (OpenAI TTS standardıyla uyumlu). |
| **`qwen3-asr-1.7b`** | 2.3B | 32K | `POST /v1/audio/transcriptions` | **Konuşma Tanıma (ASR):** Ses dosyalarını yüksek doğrulukla Türkçe metne dönüştürür. |
| **`qwen3-embedding-8b`** | 7.6B | 40K | `POST /v1/embeddings` | **Türkçe TR-TEB 1. Vektör Gömme:** Anlamsal benzerlik ve RAG arama. |
| **`qwen3-reranker-8b`** | 8.8B | 4K | `POST /v1/rerank` | **Yeniden Sıralama (Reranker):** En alakalı metin parçalarını seçme. |
| **`clef`** | 27B | 16K | `POST /v1/systemone` | Olasılıklı karar motoru (zorluk ve çeldiricilik gücü). |
| **`laya`** | 0.32B | 8K | `POST /v1/systemone` | Tipli hızlı sınıflandırıcı. |
| **`auto`** | - | - | `POST /v1/chat/completions` | Akıllı yönlendirici. |

---

## 6. Kritik Tuzaklar ve Ajan Kuralları (Edge Cases)

1. **OCR Modellerini Chat Uç Noktasına Gönderme:** `dots-ocr` veya `deepseek-ocr-2` modelleri `/v1/chat/completions`'a gönderilirse sunucu `400 endpoint_mismatch` hatası fırlatır. Mutlaka `POST /v1/ocr` kullanılmalıdır.
2. **`max_tokens` Sınırı:** Düşünme yeteneği olan modellerde (`deepseek-v4.1-flash`) `max_tokens` değeri en az 2048 (önerilen: 4096) olmalıdır; aksi takdirde düşünce zinciri token limitine takılıp yanıt boş gelebilir.
3. **429 Hız Sınırı (Rate Limiting) Yönetimi:** Yanıt başlığındaki `Retry-After` süresine ve üstel geri çekilmeye (exponential backoff with jitter) uyulmalıdır.
4. **JSON Modu:** Yapılandırılmış çıktılarda `"response_format": {"type": "json_object"}` kullanılabilir veya prompt'ta katı JSON şeması talep edilebilir.

---

## 7. Referans Kod Şablonları

### Python Entegrasyon Şablonu

```python
import base64
import json
import time
from pathlib import Path
import requests

EVREN_API_KEY = "<EVREN_API_KEY>"
EVREN_BASE_URL = "https://evren-llmapi.ssyz.org.tr/v1"

HEADERS = {
    "Authorization": f"Bearer {EVREN_API_KEY}",
    "X-API-Key": EVREN_API_KEY,
    "Content-Type": "application/json",
}

def ensure_terms():
    """Kullanım şartlarını onaylar."""
    st = requests.get(f"{EVREN_BASE_URL}/terms/status", headers=HEADERS, timeout=15).json()
    if not st.get("accepted"):
        ver = st.get("current_version", 1)
        requests.get(f"{EVREN_BASE_URL}/terms/text", headers=HEADERS, timeout=15)
        requests.post(f"{EVREN_BASE_URL}/terms/accept", headers=HEADERS, json={"version": ver}, timeout=15)

def call_evren_chat(prompt: str, system: str = "", model: str = "deepseek-v4.1-flash") -> str:
    """EVREN LLM çağrısı."""
    ensure_terms()
    payload = {
        "model": model,
        "messages": [
            *([{"role": "system", "content": system}] if system else []),
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 4096,
    }
    resp = requests.post(f"{EVREN_BASE_URL}/chat/completions", headers=HEADERS, json=payload, timeout=120)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]

def call_evren_ocr(image_path: Path) -> str:
    """EVREN adanmış OCR ucu çağrısı."""
    ensure_terms()
    b64 = base64.b64encode(image_path.read_bytes()).decode("ascii")
    mime = "image/png" if image_path.suffix.lower() == ".png" else "image/jpeg"
    payload = {
        "model": "dots-ocr",
        "image": f"data:{mime};base64,{b64}",
    }
    resp = requests.post(f"{EVREN_BASE_URL}/ocr", headers=HEADERS, json=payload, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    return data.get("markdown") or data.get("text") or str(data)
```

### TypeScript / JavaScript (Node / Cloudflare Pages / Fetch) Şablonu

```typescript
const EVREN_API_KEY = "<EVREN_API_KEY>";
const EVREN_BASE_URL = "https://evren-llmapi.ssyz.org.tr/v1";

export async function askEvren(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch(`${EVREN_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${EVREN_API_KEY}`,
      "X-API-Key": EVREN_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-v4.1-flash", // Hızlı yanıt için 'qwen3.8-flash-next'
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      thinking: false, // İnteraktif modda false yapılabilir
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EVREN Hatası (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
```

---

## 8. Test Komutu (cURL ile Anında Doğrulama)

Terminalden hızlıca test etmek için:

```bash
curl -X POST https://evren-llmapi.ssyz.org.tr/v1/chat/completions \
  -H "Authorization: Bearer <EVREN_API_KEY>" \
  -H "X-API-Key: <EVREN_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4.1-flash",
    "messages": [{"role": "user", "content": "Merhaba EVREN, entegrasyon testi başarılı mı?"}],
    "max_tokens": 2048
  }'
```

