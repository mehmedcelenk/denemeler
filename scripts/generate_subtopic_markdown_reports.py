#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_subtopic_markdown_reports.py
Üretilen alt konu etüt paketlerinden öğretmen ve kurs yöneticilerine yönelik
zengin, pratik ve doğrudan uygulanabilir Markdown rehber raporları üretir.
"""

import json, os

def generate_subject_report(json_path, output_md_path, subj_title):
    with open(json_path, 'r', encoding='utf-8') as f:
        paketler = json.load(f)
        
    total_questions = sum(p['toplam_soru'] for p in paketler)
    multi_course_packets = [p for p in paketler if p['ortak_ders_sayisi'] >= 2]
    multi_q_count = sum(p['toplam_soru'] for p in multi_course_packets)
    
    md = []
    md.append(f"# 🎯 {subj_title} — Alt Konular ve Ortak Hap Etüt Rehberi\n")
    md.append(f"> **Müfredat Referansı:** MEB Talim ve Terbiye Kurulu Başkanlığı (TTKB) Ortaöğretim Müfredatı & Açık Öğretim Lisesi (AÖL) Çıkmış Soruları (2023-2026 / 8 Dönem)\n")
    md.append(f"### 📊 Genel Özet Göstergeleri")
    md.append(f"- **Toplam İncelenen Soru:** `{total_questions}` soru")
    md.append(f"- **Tespit Edilen Alt Konu (Mikro Kazanım) Sayısı:** `{len(paketler)}` alt konu")
    md.append(f"- **Çoklu Sınıf/Kademe Ortak Alt Konuları:** `{len(multi_course_packets)}` paket (`{multi_q_count}` soru — Toplam soruların %{multi_q_count/total_questions*100:.1f}'i)")
    md.append(f"- **Temel Kurs Stratejisi:** Farklı kademedeki öğrencileri aynı sınıfta toplayıp 40-50 dakikada 15-25 ortak soru çözerek tek oturumda çok kademeyi hedeflemek.\n")
    
    md.append("## 📋 Alt Konu Bazlı Etüt Paketleri (Öncelik Sırasına Göre)\n")
    md.append("| # | Alt Konu (Mikro Kazanım) | Ana Ünite | Toplam Soru | Ortak Kademeler | Etüt Süre Tavsiyesi |")
    md.append("| :---: | :--- | :--- | :---: | :--- | :--- |")
    
    for idx, p in enumerate(paketler, 1):
        ders_badge = f"**{p['ortak_ders_sayisi']} Kademe Ortak** ⭐" if p['ortak_ders_sayisi'] >= 3 else (f"{p['ortak_ders_sayisi']} Kademe" if p['ortak_ders_sayisi'] == 2 else "Tek Kademe")
        md.append(f"| {idx} | **{p['alt_konu']}** | {p['ana_konu']} | `{p['toplam_soru']}` | {ders_badge} | {p['etut_onerisi']} |")
        
    md.append("\n---\n")
    md.append("## 🔍 Detaylı Etüt Paketleri ve Örnek Çıkmış Sorular\n")
    
    for idx, p in enumerate(paketler[:12], 1): # En yüksek hacimli ilk 12 alt konu
        courses_str = ', '.join([f"`{c}` ({p['ders_dagilimi'][c]} soru)" for c in p['ortak_dersler']])
        md.append(f"### {idx}. {p['alt_konu']}")
        md.append(f"- **Bağlı Olduğu Ana Ünite:** {p['ana_konu']}")
        md.append(f"- **Toplam Soru Hacmi:** `{p['toplam_soru']} Soru`")
        md.append(f"- **Bu Etütte Bir Araya Gelecek Öğrenciler:** {courses_str}")
        md.append(f"- **Önerilen Oturum Planı:** {p['etut_onerisi']}")
        md.append(f"- **Kapsanan Sınav Dönemleri:** {len(p['donem_kapsami'])} dönem ({', '.join(p['donem_kapsami'][:4])}...)")
        
        md.append("\n**📝 Tahtada Çözülebilecek Örnek Çıkmış Soru:**\n")
        sample_q = p['ornek_sorular'][0] if p['ornek_sorular'] else None
        if sample_q:
            clean_q = sample_q['soru'].replace('\n', ' ')
            md.append(f"> **Soru ({sample_q['ders']} - {sample_q['yil']} Dönem {sample_q['donem']} / Soru {sample_q['soru_no']}):**")
            md.append(f"> *\"{clean_q}\"*\n>")
            for opt, val in sample_q['secenekler'].items():
                is_correct = " ✅ *(Doğru Cevap)*" if opt == sample_q['dogru_cevap'] else ""
                md.append(f"> - **{opt})** {val}{is_correct}")
        md.append("\n---\n")
        
    with open(output_md_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))
    print(f"Rapor yazıldı: {output_md_path}")

def generate_master_handbook():
    path = 'ciktilar/analiz/HAP_ETUTLER_MASTER_REHBERI.md'
    with open('ciktilar/analiz/cografya_hap_etut_paketleri.json') as f: cog = json.load(f)
    with open('ciktilar/analiz/tde_hap_etut_paketleri.json') as f: tde = json.load(f)
    with open('ciktilar/analiz/matematik_hap_etut_paketleri.json') as f: mat = json.load(f)
    
    md = []
    md.append("# 🏆 AÖL & AÖİHL Ortak Alt Konulu 'Hap Etüt' Master El Kitabı\n")
    md.append("Bu rehber; **Coğrafya (1-4)**, **Türk Dili ve Edebiyatı (1-8)** ve **Matematik (1-4)** derslerinde okuyan öğrencileri tek bir etüt salonunda toplayıp, **çıkmış sorular üzerinden 40-50 dakikalık nokta atışı soru çözüm kampları** düzenlemek amacıyla hazırlanmıştır.\n")
    
    md.append("## 🌟 En Yüksek Verimli 'Top 10 Ortak Etüt' Listesi\n")
    md.append("*(Farklı sınıflardan en çok öğrenciyi tek seferde yakalayan ve soru havuzu en ideal 15-30 bandındaki etütler)*\n")
    md.append("| # | Ders | Alt Konu Başlığı | Havuz | Kapsanan Dersler | Tek Oturumda Kazanılacak Fayda |")
    md.append("| :---: | :--- | :--- | :---: | :--- | :--- |")
    md.append("| 1 | **TDE** | **Yazım Kuralları: 'de', 'ki', 'mi' Ekleri** | `46` | TDE 1'den 8'e TÜMÜ | Sınavda her kademede garanti 1-2 soru çıkar. |")
    md.append("| 2 | **TDE** | **Noktalama: İki Nokta, Nokta, Kesme, Tırnak** | `57` | TDE 1'den 8'e TÜMÜ | Tüm kademelerin ortak garanti soru başlığı. |")
    md.append("| 3 | **TDE** | **Hikâye Yapı Unsurları (Olay vs Durum)** | `50` | TDE 1'den 8'e TÜMÜ | Edebiyat temel kavramları tüm sınavlarda ortaktır. |")
    md.append("| 4 | **TDE** | **Tiyatro Türleri ve Geleneksel Tiyatro** | `31` | TDE 1, 2, 3, 4, 6, 7, 8 | 7 kademe öğrencisi aynı anda tek derste bitirir. |")
    md.append("| 5 | **Coğrafya** | **Doğal Afetler ve Korunma Yolları** | `26` | COĞ 1, 2, 3, 4 TÜMÜ | 4 coğrafya kademesinin tamamında ortak çıkar. |")
    md.append("| 6 | **Coğrafya** | **Doğa ve İnsan Etkileşimi** | `25` | COĞ 1, 2, 3, 4 TÜMÜ | Sınavların 1. ünitesi tüm kademelerde tekrar eder. |")
    md.append("| 7 | **Coğrafya** | **Nüfus Piramitleri ve Demografi** | `21` | COĞ 2, COĞ 4 | Grafik yorumlama soruları her iki kademede birebirdir. |")
    md.append("| 8 | **Coğrafya** | **Su Kaynakları (Denizler, Göller, Kaynaklar)** | `18` | COĞ 1, COĞ 3, COĞ 4 | 3 kademe öğrencisi 40 dakikada gölleri/kaynakları bitirir. |")
    md.append("| 9 | **Matematik**| **Üçgende Açılar ve Açı-Kenar Bağıntıları** | `26` | MAT 1, 2, 3, 4 TÜMÜ | Geometrinin temeli 4 kademede de ortak sorulur. |")
    md.append("| 10| **Matematik**| **Sayı Kümeleri, Asal Sayılar, Basamak** | `24` | MAT 1, 2, 3, 4 TÜMÜ | Temel matematik sorusu her kademede yer alır. |")
    
    md.append("\n---\n")
    md.append("## 💡 Kurs Yöneticileri ve Öğretmenler İçin Haftalık Uygulama Takvimi Önerisi\n")
    md.append("1. **Pazartesi (TDE Ortak Dil Bilgisi):** Yazım Kuralları ('de/ki/mi') + Noktalama İşaretleri (Tüm TDE öğrencileri davetli).\n")
    md.append("2. **Çarşamba (Coğrafya Ortak Konu):** Doğal Afetler + Nüfus Piramitleri (Coğ 1, 2, 3, 4 öğrencileri davetli).\n")
    md.append("3. **Cuma (Matematik Ortak Geometri/Sayılar):** Üçgende Açılar + Sayı Kümeleri (Mat 1, 2, 3, 4 öğrencileri davetli).\n")
    md.append("4. **Cumartesi (Hap Soru Kampı):** İlgili alt konudan 2023-2026 çıkmış 20 soruluk deneme testi dağıtılır, 40 dakikada çözülüp tahtada analiz edilir.\n")

    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))
    print(f"Master rehber yazıldı: {path}")

if __name__ == '__main__':
    generate_subject_report('ciktilar/analiz/cografya_hap_etut_paketleri.json', 'ciktilar/analiz/COGRAFYA_ALT_KONULAR_RAPORU.md', 'Coğrafya (1-4)')
    generate_subject_report('ciktilar/analiz/tde_hap_etut_paketleri.json', 'ciktilar/analiz/TDE_ALT_KONULAR_RAPORU.md', 'Türk Dili ve Edebiyatı (1-8)')
    generate_subject_report('ciktilar/analiz/matematik_hap_etut_paketleri.json', 'ciktilar/analiz/MATEMATIK_ALT_KONULAR_RAPORU.md', 'Matematik (1-4)')
    generate_master_handbook()
    print("✅ Tüm Markdown raporları başarıyla oluşturuldu!")

