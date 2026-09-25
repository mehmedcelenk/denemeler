#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_atomic_markdown_reports.py
Atomik paketlerden öğretmen ve öğrenciler için:
- 10 Saniyelik Sınav Taktikleri Sözlüğü
- Mikro-Öğrenme (Micro-learning) ve Flashcard Etüt Planları
üreten Markdown raporlayıcısı.
"""

import json, os

def generate_atomic_subject_report(json_path, output_md_path, subj_title):
    with open(json_path, 'r', encoding='utf-8') as f:
        paketler = json.load(f)
        
    total_questions = sum(p['toplam_soru'] for p in paketler)
    multi_course_packets = [p for p in paketler if p['ortak_ders_sayisi'] >= 2]
    multi_q_count = sum(p['toplam_soru'] for p in multi_course_packets)
    
    md = []
    md.append(f"# ⚡ {subj_title} — Atomik Konular ve Sınav Taktikleri Rehberi\n")
    md.append(f"> **Müfredat Referansı:** MEB Talim ve Terbiye Kurulu Başkanlığı & AÖL 2023-2026 Çıkmış Soruları (8 Dönem)\n")
    md.append(f"### 📊 Genel Atomik Göstergeler")
    md.append(f"- **Toplam İncelenen Soru:** `{total_questions}` soru")
    md.append(f"- **Tespit Edilen Atomik Konu (Soru Kalıbı) Sayısı:** `{len(paketler)}` kalıp")
    md.append(f"- **Çoklu Kademe Ortak Soru Kalıpları:** `{len(multi_course_packets)}` paket (`{multi_q_count}` soru)")
    md.append(f"- **Uygulama Alanı:** 5-10 dakikalık 'Günde 1 Taktik', ders araları, spot bilgi kartları veya kısa soru kampları.\n")
    
    md.append("## 📋 Atomik Soru Kalıpları ve 10 Saniyelik Spot Taktikler\n")
    md.append("| # | Atomik Soru Kalıbı | Soru | Ortak Kademeler | 💡 10 Saniyelik Spot Sınav Taktiği |")
    md.append("| :---: | :--- | :---: | :--- | :--- |")
    
    for idx, p in enumerate(paketler, 1):
        ders_badge = f"**{p['ortak_ders_sayisi']} Kademe Ortak** ⭐" if p['ortak_ders_sayisi'] >= 3 else (f"{p['ortak_ders_sayisi']} Kademe" if p['ortak_ders_sayisi'] == 2 else "Tek Kademe")
        md.append(f"| {idx} | **{p['atomik_konu']}** | `{p['toplam_soru']}` | {ders_badge} | {p['spot_taktik']} |")
        
    md.append("\n---\n")
    md.append("## 🔍 Detaylı Taktik Kartları ve Çıkmış Soru Analizleri\n")
    
    for idx, p in enumerate(paketler[:12], 1):
        courses_str = ', '.join([f"`{c}` ({p['ders_dagilimi'][c]} soru)" for c in p['ortak_dersler']])
        md.append(f"### {idx}. {p['atomik_konu']}")
        md.append(f"- **Ana / Alt Konu:** {p['ana_konu']} $\\rightarrow$ {p['alt_konu']}")
        md.append(f"- **Soru Havuzu:** `{p['toplam_soru']} Soru`")
        md.append(f"- **Ortak Sınıflar:** {courses_str}")
        md.append(f"- **Tavsiye Edilen Format:** {p['format_tavsiyesi']}")
        md.append(f"\n> 💡 **ÖĞRENCİYE VERİLECEK SPOT TAKTİK:**\n> *\"{p['spot_taktik']}\"*\n")
        
        sample_q = p['ornek_sorular'][0] if p['ornek_sorular'] else None
        if sample_q:
            clean_q = sample_q['soru'].replace('\n', ' ')
            md.append(f"**📝 Tahtada İncelenecek Çıkmış Soru Örneği:**")
            md.append(f"> **Soru ({sample_q['ders']} - {sample_q['yil']} D.{sample_q['donem']} / No {sample_q['soru_no']}):**")
            md.append(f"> *\"{clean_q}\"*\n>")
            for opt, val in sample_q['secenekler'].items():
                is_correct = " ✅ *(Doğru Cevap)*" if opt == sample_q['dogru_cevap'] else ""
                md.append(f"> - **{opt})** {val}{is_correct}")
        md.append("\n---\n")
        
    with open(output_md_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))
    print(f"Atomik Rapor yazıldı: {output_md_path}")

def generate_master_atomic_handbook():
    path = 'ciktilar/analiz/ATOMIK_TAKTIKLER_MASTER_REHBERI.md'
    with open('ciktilar/analiz/cografya_atomik_paketleri.json') as f: cog = json.load(f)
    with open('ciktilar/analiz/tde_atomik_paketleri.json') as f: tde = json.load(f)
    with open('ciktilar/analiz/matematik_atomik_paketleri.json') as f: mat = json.load(f)
    
    md = []
    md.append("# 🚀 AÖL & AÖİHL 'Atomik Konular ve Sınav Taktikleri' Master El Kitabı\n")
    md.append("Bu rehber; **Coğrafya (1-4)**, **Türk Dili ve Edebiyatı (1-8)** ve **Matematik (1-4)** derslerinde okuyan öğrencilerinize **ders aralarında, 10-15 dakikalık spot kamplarda veya sosyal medya/web sitenizde** doğrudan sunabileceğiniz **en pratik sınav taktiklerini** içerir.\n")
    
    md.append("## 🏆 Altın Değerinde 'Top 15 Atomik Sınav Taktiği'\n")
    md.append("| # | Ders | Atomik Kalıp | Havuz | Kapsanan Kademeler | 💡 10 Saniyelik Çözüm Formülü |")
    md.append("| :---: | :--- | :--- | :---: | :--- | :--- |")
    
    # Seçkin taktikler
    top_picks = [
        ("TDE", "'-ki' Eki ve Bağlacının Yazımı", "12 Soru", "TDE 1-8 TÜMÜ", "Kelimeye '-ler' takısı getir; anlamlıysa bitişik ek (evdekiler), anlamsızsa ayrı bağlaçtır (kaldıkiler -> kaldı ki)."),
        ("TDE", "'-de / -da' Eki ve Bağlacının Yazımı", "14 Soru", "TDE 1-8 TÜMÜ", "Cümleden çıkarılınca anlam bozulmuyorsa bağlaçtır ve ayrı yazılır; bağlaç olan 'de' asla 'te/ta' olmaz."),
        ("TDE", "'mı / mi' Soru Ekinin Yazımı", "8 Soru", "TDE 1-8 TÜMÜ", "Kendisinden önceki kelimeden daima ayrı yazılır, kendisine gelen ekler 'mı'ya bitişir (Gelecek misin?)."),
        ("TDE", "Büyük Harfler ve Kurum Ekleri", "10 Soru", "TDE 1-8 TÜMÜ", "Kurum, kuruluş ve kurul adlarına gelen ekler kesme işaretiyle AYRILMAZ (Türk Dil Kurumuna, TBMM'nin)."),
        ("TDE", "İlahi (Hâkim) Bakış Açısı", "9 Soru", "TDE 1, 2, 4, 7, 8", "Anlatıcı kahramanların aklından geçenleri, duygularını, geçmiş ve geleceklerini bilen 'her şeye hâkim' 3. kişidir."),
        ("Coğrafya", "Vadi ve Sırt Ayrımı (V Kuralı)", "6 Soru", "COĞ 1, 3", "Eğrilerin 'V' yaptığı yerde sivri uç yüksekliğin arttığı yeri gösteriyorsa Vadi, azaldığı yeri gösteriyorsa Sırttır."),
        ("Coğrafya", "Falez ve Eğim (Çizgilerin Sıklaşması)", "5 Soru", "COĞ 1, 3", "İzohips çizgileri deniz kıyısında birbirine yapışacak kadar sıklaşıyorsa orada eğim maksimumdur ve Falez vardır."),
        ("Coğrafya", "Kapalı Çukur (Çanak / Krater)", "4 Soru", "COĞ 1", "İçe doğru ok işaretlerinin başladığı yerden bittiği yere kadar yükselti eğri aralığı kadar azalır."),
        ("Coğrafya", "Arı Kovanı Nüfus Piramidi", "8 Soru", "COĞ 2, 4", "Tabanı dar (düşük doğum), tepesi geniş (yaşlı nüfus fazla) piramit = Gelişmiş Ülke (Avrupa modeli)."),
        ("Coğrafya", "Dünya Boğazları ve Kanalları", "9 Soru", "COĞ 4", "Süveyş (Akdeniz-Kızıldeniz), Panama (Büyük Okyanus-Atlas Okyanusu), Hürmüz (Basra Körfezi petrol çıkışı)."),
        ("Matematik", "3-4-5 ve 5-12-13 Özel Üçgenleri", "8 Soru", "MAT 2", "Hipotenüs hesaplama; kenarları 3-4-5'in (6-8-10, 9-12-15) veya 5-12-13'ün (10-24-26) katı mı diye kontrol et."),
        ("Matematik", "Öklid Bağıntısı (h^2 = p · k)", "4 Soru", "MAT 2", "Dikten dik inmişse; yüksekliğin karesi tabanda ayırdığı parçaların çarpımına eşittir."),
        ("Matematik", "İse (⇒) Bağlacı (100 Kuralı)", "13 Soru", "MAT 1, 2, 3, 4", "p ⇒ q sadece 1 ⇒ 0 ≡ 0 iken yanlıştır (100 kuralı); diğer tüm durumlarda 1'dir."),
        ("Matematik", "Mutlak Değer Kökleri (|x - a| = b)", "68 Soru", "MAT 1, 2, 3, 4", "|x - a| = b ise x - a = b veya x - a = -b yazılır; iki kök bulunur ve toplanır."),
        ("Matematik", "Kökler Toplamı (-b/a) ve Çarpımı (c/a)", "22 Soru", "MAT 1, 3, 4", "ax^2 + bx + c = 0 denkleminde kökleri bulmadan; Kökler Toplamı = -b/a, Kökler Çarpımı = c/a formülüyle çözülür.")
    ]
    
    for idx, (d, kalip, havuz, kademe, taktik) in enumerate(top_picks, 1):
        md.append(f"| {idx} | **{d}** | **{kalip}** | `{havuz}` | {kademe} | {taktik} |")
        
    md.append("\n---\n")
    md.append("## 💡 Öğretmenler ve Kurslar İçin 'Mikro-Taktik Kampı' Kullanım Modeli\n")
    md.append("1. **Ders Başlangıcı Spotu (5 Dk):** Ders başlamadan önce tahtaya günün taktiği (örn: '-ki' için -ler testi) yazılır.\n")
    md.append("2. **Anında Soru Uygulaması (5 Dk):** 2023, 2024 ve 2025 Açık Lise sınavında çıkmış 3 soru tahtada çözülür.\n")
    md.append("3. **Dijital İçerik / Flashcard:** Bu taktikler web sitenizde veya sosyal medyada 'Açık Lise Sınav Hileleri / Taktikleri' olarak paylaşılabilir.\n")

    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))
    print(f"Master Atomik Rehber yazıldı: {path}")

if __name__ == '__main__':
    generate_atomic_subject_report('ciktilar/analiz/cografya_atomik_paketleri.json', 'ciktilar/analiz/COGRAFYA_ATOMIK_KONULAR_RAPORU.md', 'Coğrafya (1-4)')
    generate_atomic_subject_report('ciktilar/analiz/tde_atomik_paketleri.json', 'ciktilar/analiz/TDE_ATOMIK_KONULAR_RAPORU.md', 'Türk Dili ve Edebiyatı (1-8)')
    generate_atomic_subject_report('ciktilar/analiz/matematik_atomik_paketleri.json', 'ciktilar/analiz/MATEMATIK_ATOMIK_KONULAR_RAPORU.md', 'Matematik (1-4)')
    generate_master_atomic_handbook()
    print("✅ Tüm Atomik Markdown raporları başarıyla oluşturuldu!")

