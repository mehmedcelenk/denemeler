# MEB Açık Öğretim Lisesi (AÖL) Çıkmış Soru Veritabanı ve Pipeline

Bu proje, Millî Eğitim Bakanlığı Açık Öğretim Lisesi sınav kitapçıklarındaki tüm soruları ve cevap anahtarlarını ayrıştırarak web uygulamaları, soru bankaları ve konu bazlı soru analizi için yapılandırılmış JSON veritabanına dönüştürür.

---

## 📁 Proje Dizin Yapısı

```text
ortaklar/
├── kaynak_pdfler/            # Orijinal MEB AÖL sınav kitapçıkları (24 PDF)
│   ├── 2023_2024/
│   │   ├── donem1/ (oturum1.pdf, oturum2.pdf, oturum3.pdf)
│   │   └── donem2/ (oturum1.pdf, oturum2.pdf, oturum3.pdf)
│   ├── 2024_2025/
│   │   ├── donem1/ (oturum1.pdf, oturum2.pdf, oturum3.pdf)
│   │   ├── donem2/ (oturum1.pdf, oturum2.pdf, oturum3.pdf)
│   │   └── donem3/ (oturum1.pdf, oturum2.pdf, oturum3.pdf)
│   └── 2025_2026/
│       ├── donem1/ (oturum1.pdf, oturum2.pdf, oturum3.pdf)
│       ├── donem2/ (oturum1.pdf, oturum2.pdf, oturum3.pdf)
│       └── donem3/ (oturum1.pdf, oturum2.pdf, oturum3.pdf)
│
├── ciktilar/                 # Nihai JSON Çıktıları
│   ├── tum_sorular.json      # Master DB: 11.276 sorunun tamamı (Tüm dersler, tüm dönemler)
│   │
│   ├── cografya/             # Coğrafya dersleri özel veri seti (656 soru)
│   │   ├── tum_cografya_sorulari.json
│   │   ├── 151_COGRAFYA_1.json
│   │   ├── 152_COGRAFYA_2.json
│   │   ├── 153_COGRAFYA_3.json
│   │   ├── 154_COGRAFYA_4.json
│   │   ├── 155_SECMELI_COGRAFYA_1.json
│   │   ├── 156_SECMELI_COGRAFYA_2.json
│   │   ├── 157_SECMELI_COGRAFYA_3.json
│   │   └── 158_SECMELI_COGRAFYA_4.json
│   │
│   ├── dersler/              # 122 dersin her biri için tüm dönemlerin toplu soruları
│   │   ├── 111_DIN_KULTURU_VE_AHLAK_BILGISI_1.json
│   │   ├── 151_COGRAFYA_1.json
│   │   ├── 421_FIZIK_1.json
│   │   └── ... (toplam 122 ders dosyası)
│   │
│   └── donemler/             # Sınav dönemi bazlı tüm derslerin birleşik listesi
│       ├── 2023_2024_donem1_tum_dersler.json (1.518 soru)
│       ├── 2023_2024_donem2_tum_dersler.json (1.518 soru)
│       ├── 2024_2025_donem1_tum_dersler.json (1.380 soru)
│       ├── 2024_2025_donem2_tum_dersler.json (1.380 soru)
│       ├── 2024_2025_donem3_tum_dersler.json (1.380 soru)
│       ├── 2025_2026_donem1_tum_dersler.json (1.360 soru)
│       ├── 2025_2026_donem2_tum_dersler.json (1.370 soru)
│       └── 2025_2026_donem3_tum_dersler.json (1.370 soru)
│
├── scripts/                  # Veri çıkarma ve otomasyon scriptleri
│   ├── batch_parser.py       # Toplu PDF -> JSON dönüştürücü pipeline
│   └── test_term.py          # Hızlı doğrulama ve birim test scripti
│
├── arsiv/                    # İlk aşama ara çıktıları ve ham dosyalar (silinmeden taşındı)
│   ├── ham_2324_pdfler/      # Başlangıçta indirilen ilk 3 PDF
│   └── ilk_cikti_denemeleri/ # İlk 1. Dönem oturum bazlı ara JSON'lar
│
└── README.md
```

---

## 📊 İstatistikler

- **İşlenen Toplam PDF:** 24 Kitapçık (8 Dönem × 3 Oturum, 1.224 sayfa)
- **Toplam Çıkarılan Soru:** 11.276 Soru
- **Cevap Anahtarı Doğruluk Oranı:** 11.276 / 11.276 (%100.00 Eşleşme)
- **Ders Sayısı:** 122 Tekil Ders
- **Toplam Coğrafya Sorusu:** 656 Soru (8 Seviyenin her birinden 82'şer soru)

---

## 📝 JSON Soru Veri Şeması

Her soru objesi aşağıdaki standart şemaya uygundur:

```json
{
  "id": 78,
  "ders_kodu": 151,
  "ders": "COĞRAFYA – 1",
  "yil": "2023-2024",
  "donem": 1,
  "oturum": 1,
  "soru_no": 1,
  "soru": "Aşağıdakilerden hangisi fiziki coğrafyanın bölümlerinden biridir?",
  "secenekler": {
    "A": "Biyocoğrafya",
    "B": "Turizm coğrafyası",
    "C": "Tarım coğrafyası",
    "D": "Yerleşme coğrafyası"
  },
  "dogru_cevap": "A",
  "gorsel": null,
  "kaynak_pdf": "oturum1.pdf",
  "sayfa": 9,
  "kontrol_gerekli": false
}
```

---

## 🚀 Pipeline'ı Yeniden Çalıştırma

Tüm PDF'leri baştan sona yeniden işlemek ve tüm JSON'ları güncellemek için:

```bash
python3 scripts/batch_parser.py
```

