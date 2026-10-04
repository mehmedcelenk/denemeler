import json, re, os, glob
from collections import defaultdict

TDE_RULES = [
    (
        "Yazım Kuralları ve Noktalama İşaretleri",
        [
            r'\byazım', r'\byazımı', r'\byazım yanlışı', r'\bbüyük harf', r'\bnoktalama',
            r'\bvirgül', r'\bnoktalı virgül', r'\biki nokta', r'\bkesme işareti', r'\btırnak',
            r'\byay ayraç', r'\bparantez', r'\büç nokta', r'\bsoru işareti', r'\bünlem işareti',
            r'\bde’nin yazımı', r'\bki’nin yazımı', r'\bmi’nin yazımı', r'\bkesme'
        ]
    ),
    (
        "Dil Bilgisi (Sözcük Türleri ve Cümle)",
        [
            r'\bsıfat', r'\bön ad', r'\bzamir', r'\badıl', r'\bzarf', r'\bbelirteç',
            r'\bedat', r'\bilgeç', r'\bbağlaç', r'\bünlem\b', r'\bözne\b', r'\byüklem\b',
            r'\bnesne\b', r'\bdolaylı tümleç', r'\bzarf tümleci', r'\bcümlenin ögeleri',
            r'\bögelerine', r'\bfiilimsi', r'\bevemsi', r'\bisim-fiil', r'\bsıfat-fiil',
            r'\bzarf-fiil', r'\bek-fiil', r'\bek eylem', r'\bbirleşik cümle', r'\bsıralı cümle',
            r'\bbağlı cümle', r'\bhaber kipi', r'\bdilek kipi', r'\betken', r'\bedilgen'
        ]
    ),
    (
        "Şiir Bilgisi ve Edebi Sanatlar",
        [
            r'\bşiir', r'\bşair', r'\bkafiye', r'\buyak\b', r'\bredif', r'\bnazım birimi',
            r'\bdörtlük', r'\bbeyit', r'\bbent\b', r'\bhece ölçüsü', r'\baruz ölçüsü',
            r'\bserbest ölçü', r'\bteşbih', r'\bistiare', r'\bmecazımürsel', r'\bteşhis',
            r'\bintak', r'\btenasüp', r'\btezat', r'\bhüsnütalil', r'\bkinaye', r'\btariz',
            r'\bkoşma', r'\bsemai', r'\bvarsağı', r'\bmani\b', r'\btürkü', r'\bnefes\b',
            r'\bilahi', r'\bgazel', r'\bkaside', r'\bmesnevi', r'\brubai', r'\bşarkı\b'
        ]
    ),
    (
        "Tiyatro ve Geleneksel Türk Tiyatrosu",
        [
            r'\btiyatro', r'\btrajedi', r'\bkomedi', r'\bdram\b', r'\bkaragöz', r'\borta oyunu',
            r'\bmeddah', r'\bkukla', r'\bkör dövüşü', r'\bperde\b', r'\bsahne\b', r'\bdekor\b',
            r'\bkostüm', r'\bmonolog', r'\bdiyalog', r'\bpandomim', r'\btirat', r'\bkulis',
            r'\bhacivat', r'\bkavuklu', r'\bpişekâr', r'\bfasıl\b'
        ]
    ),
    (
        "Hikâye, Roman ve Anlatım Teknikleri",
        [
            r'\bhikâye', r'\bhikaye', r'\broman\b', r'\böykü\b', r'\bkurmaca', r'\banlatıcı',
            r'\bbakış açısı', r'\bhâkim bakış', r'\bilahi bakış', r'\bgözlemci', r'\bkahraman bakış',
            r'\bolay hikâyesi', r'\bdurum hikâyesi', r'\bmaupassant', r'\bçehov', r'\biç konuşma',
            r'\biç çözümleme', r'\bbilinç akışı', r'\bserim\b', r'\bdüğüm\b', r'\bçözüm\b',
            r'\bgeriye dönüş', r'\bözetleme', r'\bçatışma\b', r'\bkarakter\b', r'\btip\b'
        ]
    ),
    (
        "Öğretici Metinler ve Gazete Çevresi",
        [
            r'\bmakale', r'\bdeneme\b', r'\bfıkra\b', r'\bköşe yazısı', r'\bsohbet\b',
            r'\bsöyleşi', r'\beleştiri', r'\btenkit', r'\banı\b', r'\bhatıra', r'\bmektup',
            r'\bgünlük\b', r'\bgünce', r'\bbiyografi', r'\botobiyografi', r'\bgezi yazısı',
            r'\bseyahatname', r'\bmülakat', r'\bröportaj', r'\bhaber metni', r'\bsöylev', r'\bhutbe'
        ]
    ),
    (
        "Edebi Akımlar",
        [
            r'\bakım\b', r'\bakımı', r'\bklasisizm', r'\bromantizm', r'\brealizm', r'\bnatüralizm',
            r'\bparnasizm', r'\bsembolizm', r'\bsürrealizm', r'\bekspresyonizm', r'\begzistansiyalizm',
            r'\bmodernizm', r'\bpostmodernizm', r'\bfütürizm'
        ]
    ),
    (
        "İslamiyet Öncesi ve Geçiş Dönemi Türk Edebiyatı",
        [
            r'\bislamiyet öncesi', r'\bgöktürk', r'\borhun', r'\buygur', r'\bkoşuk', r'\bsagu\b',
            r'\bsav\b', r'\bdestan\b', r'\balper tunga', r'\boğuz kağan', r'\bergenekon',
            r'\bgeçiş dönemi', r'\bkutadgu bilig', r'\bdivanü lügati', r'\batabetü',
            r'\bdivanı hikmet', r'\byusuf has hacib', r'\bkaşgarlı', r'\bedip ahmet', r'\bahmet yesevi',
            r'\bdede korkut'
        ]
    ),
    (
        "Halk ve Divan Edebiyatı Dönemi",
        [
            r'\bhalk edebiyatı', r'\bâşık edebiyatı', r'\btasavvuf edebiyatı', r'\banonim halk',
            r'\bdivan edebiyatı', r'\bfuzuli', r'\bbaki\b', r'\bnedim', r'\bşeyh galip',
            r'\bnefi\b', r'\bnabi\b', r'\bkaracaoğlan', r'\byunus emre', r'\bdadaloğlu',
            r'\bköroğlu', r'\bpir sultan', r'\bhamse', r'\bdivan sahibi', r'\btezkire'
        ]
    ),
    (
        "Tanzimat, Servet-i Fünun ve Millî Edebiyat",
        [
            r'\btanzimat', r'\bservet-i fünun', r'\bservetifünun', r'\bfecr-i âti', r'\bmilli edebiyat',
            r'\bmillî edebiyat', r'\bgenç kalemler', r'\byeni lisan', r'\bşinasi', r'\bnamık kemal',
            r'\bziya paşa', r'\brecaizade', r'\babdülhak hamit', r'\btevfik fikret', r'\bcenap şahabettin',
            r'\bhalit ziya', r'\bmehmet rauf', r'\bömer seyfettin', r'\bziya gökalp', r'\bmehmet emin',
            r'\byakup kadri', r'\bhalide edip', r'\breşat nuri', r'\brefik halit'
        ]
    ),
    (
        "Cumhuriyet Dönemi Türk Edebiyatı",
        [
            r'\bcumhuriyet dönemi', r'\bgarip akımı', r'\bbirinci yeni', r'\bikinci yeni',
            r'\btoplumcu gerçekçi', r'\bmilli edebiyat zevk', r'\byedi meşaleciler', r'\bhisarcılar',
            r'\bmaviciler', r'\borhan veli', r'\boktay rifat', r'\bmelih cevdet', r'\bsezai karakoç',
            r'\bcemal süreya', r'\bedip cansever', r'\bilhan berk', r'\bkemal tahir', r'\borhan kemal',
            r'\byaşar kemal', r'\btarık buğra', r'\batilla ilhan', r'\bahmet hamdi', r'\bpeyami safa',
            r'\bsait faik', r'\bmemduh şevket', r'\bhaldun taner', r'\bköy enstitü'
        ]
    ),
]

def classify_tde(q):
    stem = q['soru'].lower()
    options = ' '.join(q['secenekler'].values()).lower()
    
    scores = {}
    for topic_name, patterns in TDE_RULES:
        score = 0
        for pat in patterns:
            stem_matches = len(re.findall(pat, stem, re.IGNORECASE))
            opt_matches = len(re.findall(pat, options, re.IGNORECASE))
            score += (stem_matches * 4) + opt_matches
        scores[topic_name] = score
        
    best_topic = max(scores, key=scores.get)
    if scores[best_topic] > 0:
        return best_topic
        
    if any(w in stem for w in ['yazım', 'nokta', 'virgül']):
        return "Yazım Kuralları ve Noktalama İşaretleri"
    return "Hikâye, Roman ve Anlatım Teknikleri"

classified = defaultdict(lambda: defaultdict(list))
all_qs = []

for i in range(1, 9):
    cname = f"TDE-{i}"
    fpath = glob.glob(f"scripts/ciktilar/dersler/54{i}_*.json")[0]
    with open(fpath, encoding='utf-8') as fp:
        qs = json.load(fp)
    for q in qs:
        topic = classify_tde(q)
        q_copy = dict(q)
        q_copy['konu'] = topic
        classified[topic][cname].append(q_copy)
        all_qs.append(q_copy)

# Save Outputs
os.makedirs('scripts/ciktilar/analiz', exist_ok=True)

# 1. Tagged questions
with open('scripts/ciktilar/analiz/tde_sorulari_etiketli.json', 'w', encoding='utf-8') as f:
    json.dump(all_qs, f, ensure_ascii=False, indent=2)

# 2. Topic clusters
cross_topics = []
for topic_name, _ in TDE_RULES:
    active_courses = [f"TDE-{i}" for i in range(1, 9) if len(classified[topic_name][f"TDE-{i}"]) > 0]
    tot = sum(len(classified[topic_name][f"TDE-{i}"]) for i in range(1, 9))
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

with open('scripts/ciktilar/analiz/tde_ortak_konu_kumeleri.json', 'w', encoding='utf-8') as f:
    json.dump(grouped_output, f, ensure_ascii=False, indent=2)

# 3. Report
report_path = 'scripts/ciktilar/analiz/TDE_ORTAK_KONULAR_RAPORU.md'
with open(report_path, 'w', encoding='utf-8') as f:
    f.write("# 📚 Türk Dili ve Edebiyatı (TDE 1 - 8) Ortak Konu ve Kesişim Raporu\n\n")
    f.write("> **Amaç:** TDE-1'den TDE-8'e kadar farklı sınıflardaki öğrencileri ortak konularda tek sınıfta toplayarak **bir taşla 8 kuş vurmak**.\n\n")
    f.write("## 📊 Genel Kesişim Matrisi (656 Soru)\n\n")
    f.write("| Konu Başlığı | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | Toplam Soru | Kesişim Durumu |\n")
    f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n")
    
    for topic_name, _ in TDE_RULES:
        counts = [len(classified[topic_name][f"TDE-{i}"]) for i in range(1, 9)]
        tot = sum(counts)
        active = sum(1 for c in counts if c > 0)
        status = f"🔥 **{active} Ders Ortak!**" if active >= 4 else (f"⭐ **{active} Ders Ortak**" if active >= 2 else "Tek Ders")
        counts_str = " | ".join([f"{c}" for c in counts])
        f.write(f"| **{topic_name}** | {counts_str} | **{tot}** | {status} |\n")

    f.write("\n---\n\n")
    f.write("## 💡 TDE İçin Bir Taşla Çok Kuş Vurma Stratejisi\n\n")
    for top, courses_list, tot in sorted(cross_topics, key=lambda x: -x[2]):
        dist_str = ', '.join([f"{c}: {len(classified[top][c])} soru" for c in courses_list])
        f.write(f"### 📍 {top} (Toplam {tot} Soru)\n")
        f.write(f"- **Ortak Seviyeler:** {', '.join(courses_list)} ({len(courses_list)} Farklı Ders)\n")
        f.write(f"- **Soru Dağılımı:** {dist_str}\n")
        f.write(f"- **Strateji:** Kurstaki **{', '.join(courses_list)}** öğrencilerini tek bir etütte topladığında sınavdaki toplam **{tot}** soruyu aynı anda çözmüş olursun.\n\n")

print("TDE Analysis complete and files saved successfully!")
