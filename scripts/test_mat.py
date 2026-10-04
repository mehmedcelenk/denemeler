import json, re, glob
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
        
    # Default fallbacks based on course code
    code = q['ders_kodu']
    if code == 998: return "Sayılar, Bölünebilme ve Üslü-Köklü İfadeler"
    elif code == 999: return "Üçgenler ve Düzlem Geometrisi"
    elif code == 163: return "Fonksiyonlar ve Polinomlar"
    elif code == 164: return "Çokgenler, Dörtgenler ve Katı Cisimler"
    elif code in [165, 609]: return "Üçgenler ve Düzlem Geometrisi"
    return "İleri Matematik (Trigonometri, Logaritma, Limit, Türev)"

# Analyze Core Courses: Mat 1, 2, 3, 4
courses = {
    'MAT-1': 'scripts/ciktilar/dersler/998_MATEMATIK_1.json',
    'MAT-2': 'scripts/ciktilar/dersler/999_MATEMATIK_2.json',
    'MAT-3': 'scripts/ciktilar/dersler/163_MATEMATIK_3.json',
    'MAT-4': 'scripts/ciktilar/dersler/164_MATEMATIK_4.json',
}

classified = defaultdict(lambda: defaultdict(list))
all_qs = []

for cname, cpath in courses.items():
    with open(cpath) as fp:
        qs = json.load(fp)
    for q in qs:
        topic = classify_mat(q)
        q_copy = dict(q)
        q_copy['konu'] = topic
        classified[topic][cname].append(q_copy)
        all_qs.append(q_copy)

print(f"{'KONU BAŞLIĞI':<46} | M1 | M2 | M3 | M4 | TOPLAM | KESİŞİM")
print("=" * 80)

cross_topics = []
for topic_name, _ in MAT_RULES:
    c1 = len(classified[topic_name]['MAT-1'])
    c2 = len(classified[topic_name]['MAT-2'])
    c3 = len(classified[topic_name]['MAT-3'])
    c4 = len(classified[topic_name]['MAT-4'])
    tot = c1 + c2 + c3 + c4
    active = [cn for cn, count in [('MAT-1', c1), ('MAT-2', c2), ('MAT-3', c3), ('MAT-4', c4)] if count > 0]
    overlap_label = f"🔥 {len(active)} Ders Ortak!" if len(active) >= 2 else "Tek Ders"
    print(f"{topic_name:<46} | {c1:>2} | {c2:>2} | {c3:>2} | {c4:>2} | {tot:>6} | {overlap_label}")
    if len(active) >= 2:
        cross_topics.append((topic_name, active, tot))

print("=" * 80)
print(f"Toplam Soru: {len(all_qs)}")
