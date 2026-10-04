import json, re, os, glob
from collections import defaultdict

MAT_RULES = [
    (
        "Oran-Orantı ve Problemler",
        [
            r'\bproblem', r'\byaşları\b', r'\bkarışım', r'\byüzde\b', r'\bkar\b', r'\bzarar\b',
            r'\bfaiz\b', r'\bişçi\b', r'\bhareket\b', r'\bhız\b', r'\bkm/sa', r'\bora[nt]ı',
            r'\bmaliyet', r'\bsatış fiyatı', r'\bindirim', r'\bkesir\b', r'\bpayda\b',
            r'\btoptancı', r'\bdepodaki su', r'\bhavuz\b', r'\bkatıdır\b', r'\bfarkının'
        ]
    ),
    (
        "Üçgenler ve Düzlem Geometrisi",
        [
            r'\büçgen', r'\baçı\b', r'\baçılar', r'\bdik üçgen', r'\bpisagor', r'\bkenarortay',
            r'\baçıortay', r'\bağırlık merkezi', r'\bbenzerlik', r'\beşlik\b', r'\bhipotenüs',
            r'\bkenar uzunluğu', r'\bçevresi kaç', r'\balanı kaç', r'\biç açılar', r'\bdış açı',
            r'\btrigonometrik', r'\bsin\b', r'\bcos\b', r'\btan\b', r'\bcot\b'
        ]
    ),
    (
        "Çokgenler, Dörtgenler ve Katı Cisimler",
        [
            r'\bdörtgen', r'\bçokgen', r'\bbeşgen', r'\baltıgen', r'\byamuk\b', r'\bparalelkenar',
            r'\beşkenar dörtgen', r'\bdikdörtgen', r'\bkare\b', r'\bdeltoid', r'\bprizma',
            r'\bküp\b', r'\bpiramit', r'\bsilindir', r'\bkoni\b', r'\bküre\b', r'\bhacmi kaç',
            r'\byanal alan', r'\bcisim köşegen', r'\btaban alanı', r'\bayrıt'
        ]
    ),
    (
        "Fonksiyonlar ve Polinomlar",
        [
            r'\bfonksiyon', r'\bf\(x\)', r'\bg\(x\)', r'\bpolinom', r'\bP\(x\)', r'\bQ\(x\)',
            r'\bbire bir', r'\börten\b', r'\bbileşke', r'\btersi\b', r'\bf -1', r'\btanım kümesi',
            r'\bdeğer kümesi', r'\bgörüntü kümesi', r'\bkatsayılar toplamı', r'\bsabit terim',
            r'\bderecesi kaç', r'\bile bölümünden kalan', r'\btam bölün'
        ]
    ),
    (
        "Çarpanlara Ayırma ve Özdeşlikler",
        [
            r'\bçarpanlar', r'\bçarpanlarına ayır', r'\bözdeşlik', r'\biki kare farkı',
            r'\btam kare', r'\ben sade biçimi', r'\bsadeleştiril', r'\bifadesinin çarpan'
        ]
    ),
    (
        "İkinci Dereceden Denklemler ve Karmaşık Sayılar",
        [
            r'\bikinci derece', r'\bdenkleminin kök', r'\bkökleri\b', r'\bdiskriminant',
            r'\bdelta\b', r'\bkarmaşık sayı', r'\bi 2 = -1', r'\bsanal birim', r'\beşleniği',
            r'\bgerçel kısım', r'\bRe\(z\)', r'\bİm\(z\)', r'\bkökler toplamı', r'\bkökler çarpımı'
        ]
    ),
    (
        "Denklemler, Eşitsizlikler ve Mutlak Değer",
        [
            r'\bdenklem\b', r'\beşitsizlik', r'\bmutlak değer', r'\bçözüm kümesi',
            r'\baralık\b', r'\bbilinmeyenli', r'\bdoğrusal denklem', r'\bsağlayan x'
        ]
    ),
    (
        "Sayma, Olasılık ve İstatistik",
        [
            r'\bolasılık', r'\bolasılığı', r'\brastgele seçilen', r'\bpermütasyon',
            r'\bkombinasyon', r'\bfaktöriyel', r'\bbinom\b', r'\baçılımında', r'\bveri grubu',
            r'\baritmetik ortalama', r'\bmod\b', r'\bmedyan', r'\baçıklık', r'\bstandart sapma',
            r'\bkutu grafiği', r'\bdaire grafiği', r'\bhistogram', r'\bseçim yapıl', r'\bekip oluştur'
        ]
    ),
    (
        "Mantık ve Kümeler",
        [
            r'\bönerme', r'\bdoğruluk değeri', r'\btotoloji', r'\bçelişki', r'\bniceleyici',
            r'\bveya\b', r'\bya da\b', r'\bküme\b', r'\bkümeleri', r'\balt küme', r'\bkesişim',
            r'\bbirleşim', r'\bfark kümesi', r'\bevrensel küme', r'\bkartezyen', r's\(a∪b\)',
            r's\(a∩b\)', r's\(a\)', r's\(b\)'
        ]
    ),
    (
        "Sayılar, Bölünebilme ve Üslü-Köklü İfadeler",
        [
            r'\bdoğal sayı', r'\btam sayı', r'\basal sayı', r'\brasyonel sayı', r'\birrasyonel',
            r'\bgerçek sayı', r'\bbasamak', r'\bbölünebil', r'\bebob\b', r'\bekok\b',
            r'\büslü', r'\bköklü', r'\bkareköklü', r'\bkuvveti', r'\bçarpımı kaçtır', r'\btoplamı kaçtır'
        ]
    ),
    (
        "İleri Matematik (Trigonometri, Logaritma, Limit, Türev)",
        [
            r'\bçember\b', r'\bdaire\b', r'\blog\b', r'\bln\b', r'\blimit\b', r'\btürev\b',
            r'\bintegral', r'\büstel fonksiyon', r'\bdizi\b', r'\baritmetik dizi', r'\bgeometrik dizi'
        ]
    ),
]

def classify_mat(q):
    stem = q['soru'].lower()
    options = ' '.join(q['secenekler'].values()).lower()
    
    scores = {}
    for topic_name, patterns in MAT_RULES:
        score = 0
        for pat in patterns:
            stem_matches = len(re.findall(pat, stem, re.IGNORECASE))
            opt_matches = len(re.findall(pat, options, re.IGNORECASE))
            score += (stem_matches * 4) + opt_matches
        scores[topic_name] = score
        
    best_topic = max(scores, key=scores.get)
    if scores[best_topic] > 0:
        return best_topic
        
    code = q['ders_kodu']
    if code == 998: return "Sayılar, Bölünebilme ve Üslü-Köklü İfadeler"
    elif code == 999: return "Üçgenler ve Düzlem Geometrisi"
    elif code == 163: return "Fonksiyonlar ve Polinomlar"
    elif code == 164: return "Çokgenler, Dörtgenler ve Katı Cisimler"
    elif code in [165, 609]: return "Üçgenler ve Düzlem Geometrisi"
    return "İleri Matematik (Trigonometri, Logaritma, Limit, Türev)"

courses = {
    'MAT-1': 'scripts/ciktilar/dersler/998_MATEMATIK_1.json',
    'MAT-2': 'scripts/ciktilar/dersler/999_MATEMATIK_2.json',
    'MAT-3': 'scripts/ciktilar/dersler/163_MATEMATIK_3.json',
    'MAT-4': 'scripts/ciktilar/dersler/164_MATEMATIK_4.json',
    'S.MAT-1': 'scripts/ciktilar/dersler/165_SECMELI_MATEMATIK_1.json',
    'S.MAT-2': 'scripts/ciktilar/dersler/609_SECMELI_MATEMATIK_2_B.json',
    'S.MAT-3': 'scripts/ciktilar/dersler/467_SECMELI_MATEMATIK_3.json',
    'S.MAT-4': 'scripts/ciktilar/dersler/468_SECMELI_MATEMATIK_4.json',
}

classified = defaultdict(lambda: defaultdict(list))
all_qs = []

for cname, cpath in courses.items():
    with open(cpath, encoding='utf-8') as fp:
        qs = json.load(fp)
    for q in qs:
        topic = classify_mat(q)
        q_copy = dict(q)
        q_copy['konu'] = topic
        classified[topic][cname].append(q_copy)
        all_qs.append(q_copy)

# Save Outputs
os.makedirs('scripts/ciktilar/analiz', exist_ok=True)

with open('scripts/ciktilar/analiz/matematik_sorulari_etiketli.json', 'w', encoding='utf-8') as f:
    json.dump(all_qs, f, ensure_ascii=False, indent=2)

cross_topics = []
for topic_name, _ in MAT_RULES:
    active_courses = [cname for cname in courses.keys() if len(classified[topic_name][cname]) > 0]
    tot = sum(len(classified[topic_name][cname]) for cname in courses.keys())
    if len(active_courses) >= 2:
        cross_topics.append((topic_name, active_courses, tot))

grouped_output = []
for top, courses_list, tot in sorted(cross_topics, key=lambda x: -x[2]):
    topic_data = {
        'konu': top,
        'toplam_soru': tot,
        'ortak_dersler': courses_list,
        'ders_dagilimi': {c: len(classified[top][c]) for c in courses_list},
        'sorular': []
    }
    for c in courses_list:
        for q in classified[top][c]:
            topic_data['sorular'].append({
                'id': q['id'],
                'ders': c,
                'yil': q['yil'],
                'donem': q['donem'],
                'oturum': q['oturum'],
                'soru_no': q['soru_no'],
                'soru': q['soru'],
                'secenekler': q['secenekler'],
                'dogru_cevap': q['dogru_cevap']
            })
    grouped_output.append(topic_data)

with open('scripts/ciktilar/analiz/matematik_ortak_konu_kumeleri.json', 'w', encoding='utf-8') as f:
    json.dump(grouped_output, f, ensure_ascii=False, indent=2)

report_path = 'scripts/ciktilar/analiz/MATEMATIK_ORTAK_KONULAR_RAPORU.md'
with open(report_path, 'w', encoding='utf-8') as f:
    f.write("# 📐 Matematik (MAT 1 - 4 & Seçmeli MAT 1 - 4) Ortak Konu ve Kesişim Raporu\n\n")
    f.write("> **Amaç:** Matematik 1, 2, 3, 4 ve Seçmeli Matematik derslerini alan öğrencileri ortak konularda tek sınıfta toplayarak **bir taşla birden fazla kuş vurmak**.\n\n")
    f.write("## 📊 Genel Kesişim Matrisi (656 Soru)\n\n")
    f.write("| Konu Başlığı | M1 | M2 | M3 | M4 | SM1 | SM2 | SM3 | SM4 | Toplam Soru | Kesişim Durumu |\n")
    f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n")
    
    for topic_name, _ in MAT_RULES:
        counts = [len(classified[topic_name][cname]) for cname in courses.keys()]
        tot = sum(counts)
        active = sum(1 for c in counts if c > 0)
        status = f"🔥 **{active} Ders Ortak!**" if active >= 4 else (f"⭐ **{active} Ders Ortak**" if active >= 2 else "Tek Ders")
        counts_str = " | ".join([f"{c}" for c in counts])
        f.write(f"| **{topic_name}** | {counts_str} | **{tot}** | {status} |\n")

    f.write("\n---\n\n")
    f.write("## 💡 Matematik İçin Bir Taşla Çok Kuş Vurma Stratejisi\n\n")
    for top, courses_list, tot in sorted(cross_topics, key=lambda x: -x[2]):
        dist_str = ', '.join([f"{c}: {len(classified[top][c])} soru" for c in courses_list])
        f.write(f"### 📍 {top} (Toplam {tot} Soru)\n")
        f.write(f"- **Ortak Dersler:** {', '.join(courses_list)} ({len(courses_list)} Farklı Ders)\n")
        f.write(f"- **Soru Dağılımı:** {dist_str}\n")
        f.write(f"- **Strateji:** Kurstaki **{', '.join(courses_list)}** öğrencilerini tek bir derste topladığında sınavdaki toplam **{tot}** soruyu aynı anda çözmüş olursun.\n\n")

print("Matematik Analysis complete and files saved successfully!")
