# Branş Sınıflandırma Betikleri ve Otomasyon Dersleri (Saved Classifier Notes)

Bu doküman, silinen branş bazlı otomatik sınıflandırma script'lerinin (`process_tarih.py`, `process_fizik.py`, `process_kimya.py`, `process_biyoloji.py`, `process_felsefe.py`, `process_din.py`, `process_saglik.py`, `process_ingilizce.py`, `reclassify_tde_master.py` vb.) ortak mantığını, yapılan hataları ve gelecekte kullanılabilecek kıymetli örüntüleri (patterns) belgelemektedir.

---

### 1. Otomatik Sınıflandırıcıların Ortak Çalışma Mantığı (Core Patterns)

Silinen tüm `process_*.py` betikleri temel olarak şu 4 aşamalı mimariyi kullanıyordu:

1. **Ham Veri Çekme (Ingestion):**  
   `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` master dosyasından ilgili dersin sorularını (`ders == 'TARİH 1'`, `ders == 'FİZİK 2'` vb.) süzme.

2. **Metin & Şık Birleştirme (Context Extraction):**  
   Sadece soru metnini değil, seçenekleri de küçük harfe çevirip birleştirme (`stem_low + ' ' + sec_str`).

3. **Anahtar Kelime ve Regex Eşleştirme (Keyword & Boundary Matching):**  
   Ders bazlı konu kütüphanesindeki anahtar kelimeleri arama (örn: `\b(parabol|türev)\b` ➔ Matematik, `\b(hücre|mitoz)\b` ➔ Biyoloji, `\b(tanzimat|servet-i fünun)\b` ➔ Edebiyat).

4. **Kural İçi Önceliklendirme ve Fallback (Sığınak):**  
   Kuralları sırayla çalıştırma; hiçbir kurala uymayan soruları varsayılan genel bir konuya (`Paragraf` veya `Genel Kavramlar`) atma.

---

### 2. Neden Sınıfta Kaldılar? (Sistemik Hatalar ve Dersler)

Otomatik sınıflandırma script'lerinin yetersiz kalmasının 3 ana nedeni:

1. **Fallback (Çöp Tenekesi) Tuzağı:**  
   Her script'in en sonunda "hiçbir şeye uymadıysa X konusuna at" mantığı vardı. TDE'de bu mantık **250'den fazla edebiyat/gramer/tiyatro sorusunun** haksız yere "Paragrafta Ana Düşünce" konusuna yığılmasına yol açtı.

2. **Soru Amacını (Pedagogical Intent) Anlayamama:**  
   Soru metninde geçen isimler ile sorunun sorduğu şey arasındaki farkı kural motoru anlayamıyor.  
   - *Örnek:* Metinde Falih Rıfkı Atay anlatılıyor ama soru kökü *"Bu parçada hangisine değinilmemiştir?"* diyor. Kural motoru "Falih Rıfkı" kelimesini görünce Anı/Edebiyat sanıyor, oysa soru bir okuduğunu anlama (paragraf) sorusu.

3. **Çoklu Şık ve Bağlam İnceltmesi:**  
   Seçeneklerdeki terimlerin (örn: *Dekameron*, *Tirat*, *Döşeme*, *Mahlas*, *Suflör*) pedagojik ağırlığını tekil regex şartlarıyla %100 kapsamak imkansızdı.

---

### 3. Gelecekte Kullanılabilecek Branş Bazlı Anahtar Kelime Haritası

İleride manuel denetimlerde referans olması için betiklerden kurtarılan temel anahtar kelimeler:

- **Tarih & İnkılap:** `TBMM`, `Mondros`, `Lozan`, `Kongre`, `Kuvayımilliye`, `Sivas`, `Erzurum`, `Selçuklu`, `Osmanlı`, `Tanzimat`, `Feodalite`.
- **Fen Bilimleri (Fizik/Kimya/Biyo):** `Hız`, `Kuvvet`, `Vektör`, `Elektrik`, `Mol`, `Asit`, `Baz`, `Periyodik Cetvel`, `Hücre`, `Mitoz`, `Mayoz`, `DNA`, `Ekosistem`.
- **Felsefe & Din:** `Epistemoloji`, `Etik`, `Varoluşçuluk`, `Rasyonalizm`, `İnanç`, `Akaid`, `Siyer`, `Fıkıh`, `Tefsir`, `İbadet`.
- **İngilizce:** Grammar rules, tenses, reading passages, dialogue completion.

---

> **Not:** Tüm sınıflandırma işlemleri artık birebir kontrollü soru denetimiyle ve doğrudan `data/subjects/` müfredat verileri üzerinde yapılacaktır.

