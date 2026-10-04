#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_matematik.py
MATEMATİK (Matematik 1 - 4) Zorunlu Ortak Dersleri Analiz ve Temizleme Scripti
- Kapsam: MATEMATİK – 1, MATEMATİK – 2, MATEMATİK – 3, MATEMATİK – 4 (328 soru)
- MEB Ortaöğretim Matematik Dersi Öğretim Programı ünite ve kazanım hiyerarşisi uygulanır.
- Geometrideki kenar uzunluk çizgileri (|AB|) mutlak değerden kesin olarak ayrıştırılır.
- Bozuk OCR formülleri ve mantık sembolleri tamir edilir.
- Kesişim kümeleri taranır ve scripts/ciktilar/analiz/MATEMATIK_KONU_DENETIM_RAPORU.md üretilir.
"""

import json
import re
from collections import defaultdict, Counter

# OCR ve Formül Tamirleri
MATEMATIK_REPAIRS = {
    518: {
        'soru_temiz': "a ve b birer tam sayı olmak üzere a / b = 3 / 5 ve a · b = 60 olduğuna göre, a’nın değeri aşağıdakilerden hangisi olabilir?",
        'secenekler_temiz': {'A': '-10', 'B': '-6', 'C': '12', 'D': '20'}
    },
    1046: {
        'soru_temiz': "p' ⇒ (q ∨ r') ≡ 0 olduğuna göre p, q ve r önermelerinin doğruluk değerleri sırasıyla aşağıdakilerden hangisidir?",
        'secenekler_temiz': {'A': '1, 0, 0', 'B': '0, 0, 1', 'C': '0, 1, 1', 'D': '0, 1, 0'}
    },
    2564: {
        'soru_temiz': "(1 ⇒ p) ∨ (q ∧ 0) bileşik önermesinin en sade biçimi aşağıdakilerden hangisidir?",
        'secenekler_temiz': {'A': '0', 'B': '1', 'C': 'p', 'D': 'q'}
    },
    2569: {
        'soru_temiz': "A = { x : 1 < x ≤ 4 , x ∈ R } kümesinin sayı doğrusu üzerinde gösterimi aşağıdakilerden hangisidir?",
    },
    9489: {
        'soru_temiz': "A = { x | -5 < x ≤ 9 , x ∈ R } kümesine karşılık gelen aralık gösterimi aşağıdakilerden hangisidir?",
        'secenekler_temiz': {'A': '(-5, 9]', 'B': '[-5, 9]', 'C': '(-5, 9)', 'D': '[-5, 9)'}
    },
    9490: {
        'soru_temiz': "A = { x | x = 3k , k ∈ Z } kümesi aşağıdaki işlemlerden hangisine göre kapalı değildir?",
        'secenekler_temiz': {'A': 'Toplama', 'B': 'Çıkarma', 'C': 'Çarpma', 'D': 'Bölme'}
    },
    9494: {
        'soru_temiz': "f : R → R , f(x) = (2/3)(x + 1) - 4 olmak üzere f(x) < 0 eşitsizliğinin çözüm aralığı aşağıdakilerden hangisidir?",
    }
}

def classify_math_question(q):
    s = q.get('soru_temiz', '').lower()
    s_raw = q.get('soru_temiz', '')
    opts = ' '.join(q.get('secenekler_temiz', {}).values()).lower()
    qid = q['id']

    # Özel manuel ground-truth eşleştirmeler
    if qid == 518:
        return ("Problemler ve Orantı", "Oran-Orantı Kavramı ve Özellikleri", "Oran ve Orantı Bağıntıları", "Orantı sabiti k diyerek a = 3k ve b = 5k yaz, çarpımı eşitle.")
    if qid == 6368:
        return ("İkinci Dereceden Denklemler ve Karmaşık Sayılar", "İkinci Dereceden Denklemler ve Kökler", "Diskriminant ve Kök Varlığı", "Gerçek kök yoksa Δ = b² - 4ac < 0 eşitsizliğini çöz.")
    if qid == 6867:
        return ("Sayma ve Olasılık", "Sayma İlkeleri, Faktöriyel ve Permütasyon", "Basamak Koşullu Sayı Yazma", "Yüzler ve birler basamağı için koşulları belirleyerek çarpma kuralını uygula.")
    if qid == 6869:
        return ("Sayma ve Olasılık", "Sayma İlkeleri, Faktöriyel ve Permütasyon", "Tekrarlı Permütasyon", "Tekrarlı permütasyon formülünü uygula, sıfırın başa gelme durumunu çıkar.")
    if qid == 6870:
        return ("Sayma ve Olasılık", "Basit Olayların Olasılığı", "Birleşim Olasılığı", "P(A ∪ B) = P(A) + P(B) - P(A ∩ B) formülünü uygula.")
    if qid == 6875:
        return ("Polinomlar ve Çarpanlara Ayırma", "Çarpanlara Ayırma ve Özdeşlikler", "Rasyonel İfadelerin Sadeleştirilmesi", "Pay ve paydayı çarpanlarına ayırarak sadeleşen terimleri bul.")
    if qid == 7756:
        return ("Sayma ve Olasılık", "Basit Olayların Olasılığı", "Olasılık Hesabı", "İstenen durum sayısı / Tüm olası durum sayısı oranını kur.")
    if qid == 8232:
        return ("Sayılar ve Bölünebilme", "Bölünebilme Kuralları, EBOB ve EKOK", "Bölünebilme Kuralları", "Önce son iki basamaktan 4 ile bölünebilmeyi, sonra rakamlar toplamından 9'u incele.")
    if qid == 9603:
        return ("Sayılar ve Bölünebilme", "Bölünebilme Kuralları, EBOB ve EKOK", "Aralarında Asal Sayılarda EKOK", "Aralarında asal iki sayının EKOK'u çarpımlarına eşittir.")
    if qid == 9604:
        return ("Sayılar ve Bölünebilme", "Bölünebilme Kuralları, EBOB ve EKOK", "Bölünebilme Kuralları", "15 = 3 x 5 olduğundan kalanın 3 ve 5 ile bölümlerini incele.")
    if qid == 10974:
        return ("Sayılar ve Bölünebilme", "Bölünebilme Kuralları, EBOB ve EKOK", "Bölünebilme Kuralları", "6 = 2 x 3 olduğundan 2 ve 3 ile bölümünden kalanları incele.")

    # Geometri kontrolü (Uzunluk çizgileri |AB| mutlak değer değildir!)
    is_geom = any(w in s for w in [
        'üçgen', 'dörtgen', 'yamuk', 'paralelkenar', 'kare', 'dikdörtgen', 'deltoid', 
        'beşgen', 'altıgen', 'çokgen', 'prizma', 'küp', 'silindir', 'piramit', 'koni', 
        'küre', 'çember', 'daire', 'açıortay', 'kenarortay', 'ağırlık merkezi',
        'pisagor', 'öklid', 'hipotenüs', 'dik koordinat', 'doğru parçası', 'öteleme dönüşümü'
    ]) or bool(re.search(r'\[[A-Z]{2}\]|m\([A-Z]{3}\)|\|[A-Z]{2}\|', s_raw))

    # 1. ANALİTİK GEOMETRİ
    if any(w in s for w in ['dik koordinat sistemi', 'koordinat düzlemi', 'noktalarından geçen doğru', 'doğrusu ile']) or (('a(-' in s or 'b(' in s) and 'doğru parçası' in s):
        return ("Analitik Geometri", "Noktanın ve Doğrunun Analitiği", "Doğrunun Analitik İncelenmesi", "Eğim formülü m = (y2 - y1) / (x2 - x1) veya iki nokta arası uzaklığı kullan.")

    # 2. KATI CİSİMLER
    if any(w in s for w in ['prizma', 'küp\b', 'silindir', 'piramit', 'koni\b', 'küre\b', 'hacmi kaç', 'cisim köşegen', 'ayrıt uzunluğu']) or 'dik prizma' in s:
        return ("Katı Cisimler", "Katı Cisimler (Prizma, Silindir, Piramit, Küp)", "Katı Cisimlerde Hacim ve Alan", "Hacim = Taban Alanı x Yükseklik formülünü uygula.")

    # 3. ÇOKGENLER VE ÖZEL DÖRTGENLER
    if any(w in s for w in ['düzgün beşgen', 'düzgün altıgen', 'çokgenin iç açısı', 'dış açısı', 'köşegen sayısı']):
        return ("Çokgenler ve Dörtgenler", "Çokgenler ve Düzgün Çokgenler", "Çokgenlerde Açı ve Köşegen", "Bir dış açı = 360° / n formülünü uygula.")
    if any(w in s for w in ['yamuk', 'paralelkenar', 'eşkenar dörtgen', 'dikdörtgen', 'deltoid']) or ('kare' in s and is_geom):
        return ("Çokgenler ve Dörtgenler", "Özel Dörtgenler (Yamuk, Paralelkenar, Kare vb.)", "Özel Dörtgen Özellikleri", "Şeklin simetri, köşegen ve açı özelliklerini kullanarak kenarları bul.")
    if 'dörtgen' in s and is_geom:
        return ("Çokgenler ve Dörtgenler", "Özel Dörtgenler (Yamuk, Paralelkenar, Kare vb.)", "Dörtgenlerde Açı ve Uzunluk", "Dörtgenin iç açılar toplamı 360 derecedir.")

    # 4. ÜÇGENLER VE GEOMETRİ
    if is_geom:
        if any(w in s for w in ['sin', 'cos', 'tan', 'cot', 'trigonometrik']):
            return ("Üçgenler ve Geometri", "Dik Üçgen, Pisagor, Öklid ve Trigonometri", "Trigonometrik Oranlar", "Dik üçgende karşı/komşu ve karşı/hipotenüs oranlarını yaz.")
        if any(w in s for w in ['alanı', 'a(abc)', 'a(aec)', 'a(abd)']) and 'üçgen' in s:
            return ("Üçgenler ve Geometri", "Üçgende Alan Bağıntıları", "Üçgende Alan Hesabı", "Taban çarpı yükseklik bölü 2 bağıntısını kullan.")
        if any(w in s for w in ['dik üçgen', 'pisagor', 'öklid', 'hipotenüs']) or '⊥' in s_raw:
            return ("Üçgenler ve Geometri", "Dik Üçgen, Pisagor, Öklid ve Trigonometri", "Pisagor ve Öklid Bağıntıları", "Dik kenarların kareleri toplamı hipotenüsün karesine eşittir.")
        if any(w in s for w in ['benzerlik', 'benzerdir', 'açıortay', 'kenarortay', 'ağırlık merkezi']) or '//' in s_raw or 'orta taban' in s:
            return ("Üçgenler ve Geometri", "Üçgende Eşlik, Benzerlik ve Yardımcı Elemanlar", "Benzerlik ve Yardımcı Elemanlar", "İç açıortay kuralını veya Thales benzerlik oranını uygula.")
        return ("Üçgenler ve Geometri", "Üçgende Açılar ve Açı-Kenar Bağıntıları", "Açı ve Kenar İlişkileri", "Büyük açı karşısında büyük kenar bulunur; üçgen eşitsizliğini kontrol et.")

    # 5. VERİ VE İSTATİSTİK
    if any(w in s for w in ['aritmetik ortalama', 'medyan', 'ortanca', 'mod\b', 'tepe değer', 'açıklık', 'standart sapma', 'daire grafiği', 'sütun grafiği', 'nokta grafiği', 'veri grubu', 'çizge']):
        return ("Veri ve İstatistik", "Merkezi Eğilim, Yayılım Ölçüleri ve Grafikler", "İstatistik ve Grafik Yorumlama", "Verileri küçükten büyüğe diz; ortanca için medyanı, en çok tekrar eden için modu bul.")

    # 6. SAYMA VE OLASILIK
    if any(w in s for w in ['olasılık', 'olasılığı', 'zar\b', 'torba', 'madenî para', 'madeni para']) or 'rastgele' in s:
        return ("Sayma ve Olasılık", "Basit Olayların Olasılığı", "Olasılık Hesabı", "İstenen durum sayısı / Tüm olası durum sayısı oranını kur.")
    if 'binom' in s or 'açılımında' in s:
        return ("Sayma ve Olasılık", "Kombinasyon ve Binom Açılımı", "Binom Açılımı", "C(n, r) katsayısıyla genel terimi yazarak üsleri eşitle.")
    if any(w in s for w in ['kombinasyon', 'seçilebilir', 'seçim yapıl', 'ekip', 'grup oluştur', 'doktor', 'hemşire']):
        return ("Sayma ve Olasılık", "Kombinasyon ve Binom Açılımı", "Kombinasyon (Seçme)", "Sıranın önemsiz olduğu seçimlerde C(n, r) formülünü kullan.")
    if any(w in s for w in ['faktöriyel', 'permütasyon', 'sıralanabilir', 'yazılabilir', 'kaç farklı', 'rakamları yerleri']) or ('kümesinin elemanları' in s and 'sayı' in s):
        return ("Sayma ve Olasılık", "Sayma İlkeleri, Faktöriyel ve Permütasyon", "Permütasyon ve Sayma", "Çarpma yoluyla sayma veya tekrarlı permütasyon formülünü uygula.")

    # 7. POLİNOMLAR VE ÇARPANLARA AYIRMA
    if any(w in s for w in ['polinom', 'p(x)', 'q(x)']):
        if any(w in s for w in ['bölümünden kalan', 'tam bölün', 'ile bölüm']):
            return ("Polinomlar ve Çarpanlara Ayırma", "Polinom Kavramı, Derece ve Kalan Bulma", "Polinomlarda Kalan Teoremi", "Böleni 0'a eşitleyen x değerini P(x)'te yerine koy.")
        return ("Polinomlar ve Çarpanlara Ayırma", "Polinom Kavramı, Derece ve Kalan Bulma", "Polinomda Katsayı ve Derece", "Katsayılar toplamı için P(1), sabit terim için P(0) değerini hesapla.")
    if any(w in s for w in ['çarpan', 'özdeşlik', 'en sade', 'sadeleştiril', 'iki kare farkı']):
        return ("Polinomlar ve Çarpanlara Ayırma", "Çarpanlara Ayırma ve Özdeşlikler", "Özdeşlikler ve Sadeleştirme", "İki kare farkı ve tam kare özdeşliklerini kullanarak pay ve paydayı sadeleştir.")

    # 8. İKİNCİ DERECEDEN DENKLEMLER VE KARMAŞIK SAYILAR
    if any(w in s for w in ['karmaşık', 'sanal birim', 'i 2 = -1', 'i² = -1', 're(z)', 'im(z)', 'eşleniği']):
        return ("İkinci Dereceden Denklemler ve Karmaşık Sayılar", "Karmaşık Sayılar ve Sanal Sayı Birimi", "Karmaşık Sayılar", "i² = -1 kuralını ve z = a + bi eşleniğini kullan.")
    if any(w in s for w in ['ikinci derece', 'denkleminin kök', 'diskriminant', 'delta', 'kökler toplamı', 'kökler çarpımı']) or 'gerçek kökü olmadığına göre' in s:
        return ("İkinci Dereceden Denklemler ve Karmaşık Sayılar", "İkinci Dereceden Denklemler ve Kökler", "İkinci Dereceden Denklem Çözümü", "Δ = b² - 4ac diskriminantını hesaplayarak kökleri incele.")

    # 9. FONKSİYONLAR
    if 'karesel' in s or 'x 2 - 4x' in s or 'tam kare formuna' in s or 'minimum noktası' in s or 'parabol' in s:
        return ("Fonksiyonlar", "İkinci Dereceden Fonksiyonlar (Parabol)", "Parabol ve Tepe Noktası", "Tepe noktası r = -b/(2a) ve k = f(r) koordinatlarını bul.")
    if any(w in s for w in ['bileşke', 'fog', '(fog)', '(f o g)', 'f -1', 'f - 1', 'tersi', 'grafiği']):
        return ("Fonksiyonlar", "Bileşke Fonksiyon, Ters Fonksiyon ve Grafikler", "Bileşke ve Ters Fonksiyon", "(fog)(x) = f(g(x)) kuralını uygula veya y = f(x)'te x'i yalnız bırak.")
    if 'fonksiyon' in s or 'f(' in s or 'f :' in s:
        return ("Fonksiyonlar", "Fonksiyon Tanımı, Değer Kümesi ve Fonksiyon Türleri", "Fonksiyon Kavramı ve Değer Bulma", "Tanım kümesindeki elemanı fonksiyonda yerine yazarak görüntüyü bul.")

    # 10. PROBLEMLER VE ORANTI
    if 'yaş' in s and not ('ortaokul' in s):
        return ("Problemler ve Orantı", "Yaş Problemleri", "Yaş Problemleri", "Kişilerin bugünkü yaşlarına x ve y diyerek yaş farkının sabitliğini kullan.")
    if any(w in s for w in ['yüzde', '%', 'kar\b', 'kâr', 'zarar', 'maliyet', 'satış fiyatı', 'indirim', 'karışım', 'tuz']):
        return ("Problemler ve Orantı", "Yüzde, Kâr-Zarar ve Karışım Problemleri", "Yüzde ve Kâr Hesabı", "Ana paraya 100x diyerek yüzde artış ve azalışlarını hesapla.")
    if any(w in s for w in ['km/sa', 'hız\b', 'hızı', 'hareket', 'işçi', 'havuz', 'saatte']):
        return ("Problemler ve Orantı", "Hareket (Hız) ve İşçi Problemleri", "Hız ve Hareket Bağıntıları", "Yol = Hız x Zaman (x = v·t) formülünü kullan.")
    if any(w in s for w in ['oranı', 'orantı', 'a/b =', 'a = 3 ve a b = 60']):
        return ("Problemler ve Orantı", "Oran-Orantı Kavramı ve Özellikleri", "Oran ve Orantı", "Orantı sabitine k diyerek bilinmeyenleri tek cinse indirge.")
    if any(w in s for w in ['katıdır', 'kesir', 'payı', 'paydası', 'depodaki su', 'kalanın']):
        return ("Problemler ve Orantı", "Sayı ve Kesir Problemleri", "Sayı ve Kesir Problemleri", "Verilen Türkçe ifadeyi adıma adım matematiksel denkleme çevir.")

    # 11. MANTIK VE KÜMELER
    if any(w in s for w in ['önerme', 'doğruluk değeri', 'totoloji', 'çelişki', 'niceleyici', 'ancak ve ancak', 'p ∧', 'p ∨', 'p ⇒', 'p ⇔', 'q ⇒', 'p l', 'q l', 'p’', 'q’']):
        return ("Mantık ve Kümeler", "Önermeler ve Bileşik Önermeler (Mantık)", "Önermeler ve Bileşik Önermeler", "Doğruluk tablosunu uygulayarak bileşik önermeyi sadeleştir.")
    if any(w in s for w in ['küme\b', 'kümeleri', 'alt küme', 'kesişim', 'birleşim', 'fark kümesi', 'evrensel küme', 's(a∪b)', 's(a∩b)', 'kartezyen', 'kapalı değildir']):
        return ("Mantık ve Kümeler", "Kümeler, Küme İşlemleri ve Kartezyen Çarpım", "Küme İşlemleri ve Kartezyen Çarpım", "Venn şeması çizerek eleman sayılarını yerleştir.")

    # 12. SAYILAR VE BÖLÜNEBİLME
    if any(w in s for w in ['ebob', 'ekok', 'aralıklarla yanmaktadır', 'nöbet']):
        return ("Sayılar ve Bölünebilme", "Bölünebilme Kuralları, EBOB ve EKOK", "EBOB-EKOK Problemleri", "Birlikte tekrarlanan periyotlar için EKOK hesapla.")
    if any(w in s for w in ['bölünebil', 'ile bölümünden kalan', 'tam bölünebil']):
        return ("Sayılar ve Bölünebilme", "Bölünebilme Kuralları, EBOB ve EKOK", "Bölünebilme Kuralları", "Bölünebilme kuralına göre son basamakları veya rakamlar toplamını incele.")

    # 13. MUTLAK DEĞER (Sadece gerçek mutlak değer!)
    if ('mutlak değer' in s or re.search(r'\|[xya0-9\s\+\-\*\/]+\|', s_raw)) and not is_geom:
        return ("Denklem ve Eşitsizlikler", "Mutlak Değerli İfadeler ve Denklemler", "Mutlak Değer Çözümü", "|x| = a ise x = a veya x = -a eşitliğini kur.")

    # 14. ÜSLÜ VE KÖKLÜ İFADELER
    if any(w in s for w in ['köklü', 'kareköklü', '√']):
        return ("Üslü ve Köklü İfadeler", "Köklü İfadeler ve Kök Dışına Çıkarma", "Köklü Sayılarda İşlemler", "Kök dışına çıkarma ve eşlenikle çarpma kurallarını uygula.")
    if any(w in s for w in ['üslü', 'kuvveti']) or re.search(r'\b\d+\^', s_raw) or '(-3)²' in s_raw:
        return ("Üslü ve Köklü İfadeler", "Üslü İfadeler ve Üslü Denklemler", "Üslü Sayı Özellikleri", "Tabanları aynı sayının kuvveti şeklinde yazarak üsleri topla veya eşitle.")

    # 15. BİRİNCİ DERECEDEN DENKLEMLER VE EŞİTSİZLİKLER
    if any(w in s for w in ['denklem', 'denklemi', 'eşitsizli', 'çözüm kümesi', 'aralık gösterimi', 'çözüm aralığı']):
        return ("Denklem ve Eşitsizlikler", "Birinci Dereceden Denklemler ve Eşitsizlikler", "Birinci Dereceden Denklem ve Eşitsizlik", "Bilinmeyenleri bir tarafa toplayarak x'i yalnız bırak.")

    # Sayı Kümeleri ve Basamak
    return ("Sayılar ve Bölünebilme", "Sayı Kümeleri, Asal Sayılar ve Basamak Kavramı", "Basamak Kavramı ve Sayı Kümeleri", "Basamak çözümlemesi yaparak istenen koşulu sağlayan değerleri bul.")

def main():
    print("=" * 60)
    print("📐 MATEMATİK DERSLERİ (MAT 1 - 4) KAZANIM VE SINIFLANDIRMA MOTORU")
    print("=" * 60)

    with open('scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json', 'r', encoding='utf-8') as f:
        all_questions = json.load(f)

    mat_questions = [q for q in all_questions if 'MATEMATİK' in q.get('ders', '')]
    print(f"Toplam {len(mat_questions)} Matematik sorusu işleniyor...")

    processed_questions = []
    repaired_count = 0

    for q in mat_questions:
        q_copy = dict(q)
        qid = q_copy['id']

        # Varsa OCR tamirlerini uygula
        if qid in MATEMATIK_REPAIRS:
            repair = MATEMATIK_REPAIRS[qid]
            if 'soru_temiz' in repair:
                q_copy['soru_temiz'] = repair['soru_temiz']
            if 'secenekler_temiz' in repair:
                q_copy['secenekler_temiz'] = repair['secenekler_temiz']
            repaired_count += 1

        # Sınıflandır
        ana_konu, alt_konu, atomik_konu, spot_taktik = classify_math_question(q_copy)
        q_copy['ana_konu'] = ana_konu
        q_copy['alt_konu'] = alt_konu
        q_copy['atomik_konu'] = atomik_konu
        q_copy['spot_taktik'] = spot_taktik

        processed_questions.append(q_copy)

    print(f"✅ {repaired_count} soru için OCR ve formül tamiri yapıldı.")

    # 1. Özel Matematik çıktısını kaydet
    out_mat_path = 'scripts/ciktilar/analiz/matematik_analizli_sorular_temiz.json'
    with open(out_mat_path, 'w', encoding='utf-8') as f:
        json.dump(processed_questions, f, ensure_ascii=False, indent=2)
    print(f"✅ {out_mat_path} kaydedildi.")

    # 2. tum_analizli_sorular_temiz.json ile birleştir
    updated_all = [q for q in all_questions if 'MATEMATİK' not in q.get('ders', '')]
    updated_all.extend(processed_questions)
    updated_all.sort(key=lambda x: x['id'])

    with open('scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json', 'w', encoding='utf-8') as f:
        json.dump(updated_all, f, ensure_ascii=False, indent=2)
    print(f"✅ scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json güncellendi.")

    # 3. Denetim Raporu Üret
    by_topic = defaultdict(list)
    for q in processed_questions:
        key = f"{q['ana_konu']} / {q['alt_konu']}"
        by_topic[key].append(q)

    report_path = 'scripts/ciktilar/analiz/MATEMATIK_KONU_DENETIM_RAPORU.md'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# 📐 MEB AÖL Matematik (MAT 1 - 4) Konu ve Soru Denetim Raporu\n\n")
        f.write("> **Tarih:** Ekim 2026  \n")
        f.write("> **Kapsam:** MATEMATİK – 1, MATEMATİK – 2, MATEMATİK – 3, MATEMATİK – 4 (Toplam 328 Soru)  \n")
        f.write("> **Amaç:** Geometri uzunluk çizgileri (`|AB|`) nedeniyle oluşan sahte mutlak değer etiketlerinin temizlenmesi ve tüm soruların MEB kazanım taksonomisine %100 uyumlu hale getirilmesi.\n\n")
        f.write("---\n\n")
        f.write("## 📊 Konu Dağılım Özeti\n\n")
        f.write("| Ana Konu / Alt Konu | Soru Sayısı | Kapsanan Dersler |\n")
        f.write("| :--- | :---: | :--- |\n")

        for key, q_list in sorted(by_topic.items(), key=lambda x: len(x[1]), reverse=True):
            courses = sorted(list({q['ders'] for q in q_list}))
            f.write(f"| **{key}** | **{len(q_list)}** | {', '.join(courses)} |\n")

        f.write("\n---\n\n")
        f.write("## 🔍 Detaylı Soru Listesi (Konu Bazında)\n\n")

        for key, q_list in sorted(by_topic.items(), key=lambda x: len(x[1]), reverse=True):
            f.write(f"### 📍 {key} ({len(q_list)} Soru)\n\n")
            for q in q_list:
                f.write(f"- **ID {q['id']}** `[{q['ders']}]` `[Yıl: {q['yil']} - D:{q['donem']} Soru {q['soru_no']}]`: {q['soru_temiz']}\n")
                f.write(f"  - *Cevap:* **{q['dogru_cevap']}** | *Püf Noktası:* {q['spot_taktik']}\n")
            f.write("\n")

    print(f"✅ {report_path} başarıyla oluşturuldu.")
    print("=" * 60)

if __name__ == '__main__':
    main()
