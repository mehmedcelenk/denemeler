import json, re, glob
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
        
    # Default fallbacks
    if any(w in stem for w in ['yazım', 'nokta', 'virgül']):
        return "Yazım Kuralları ve Noktalama İşaretleri"
    return "Hikâye, Roman ve Anlatım Teknikleri"

classified = defaultdict(lambda: defaultdict(list))
all_qs = []

for i in range(1, 9):
    cname = f"TDE-{i}"
    fpath = glob.glob(f"scripts/ciktilar/dersler/54{i}_*.json")[0]
    with open(fpath) as fp:
        qs = json.load(fp)
    for q in qs:
        topic = classify_tde(q)
        q_copy = dict(q)
        q_copy['konu'] = topic
        classified[topic][cname].append(q_copy)
        all_qs.append(q_copy)

print(f"{'KONU BAŞLIĞI':<44} | " + " | ".join([f"T{i}" for i in range(1, 9)]) + " | TOPLAM | KESİŞİM")
print("=" * 95)

cross_topics = []
for topic_name, _ in TDE_RULES:
    counts = [len(classified[topic_name][f"TDE-{i}"]) for i in range(1, 9)]
    tot = sum(counts)
    active = sum(1 for c in counts if c > 0)
    overlap_label = f"🔥 {active} Ders Ortak!" if active >= 4 else (f"⭐ {active} Ders Ortak" if active >= 2 else "Tek Ders")
    counts_str = " | ".join([f"{c:>2}" for c in counts])
    print(f"{topic_name:<44} | {counts_str} | {tot:>6} | {overlap_label}")
    if active >= 2:
        cross_topics.append((topic_name, active, tot))

print("=" * 95)
print(f"Toplam TDE Soru Sayısı: {len(all_qs)}")
