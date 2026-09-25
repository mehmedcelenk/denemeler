import json, re, glob, os
from collections import defaultdict

TARIH_RULES = [
    (
        "İlk ve Orta Çağlarda Türk Dünyası & İslamiyet Öncesi",
        [
            r'\bhun\b', r'\bgöktürk', r'\buygur', r'\biskit', r'\basya hun', r'\bavrupa hun',
            r'\bmete han', r'\bteoman', r'\bistemi yabgu', r'\bkutluk', r'\bbilge kağan',
            r'\bkültigin', r'\btonyukuk', r'\bkurultay', r'\btoy\b', r'\bkağan', r'\bkut anlayış',
            r'\btöre\b', r'\bikili teşkilat', r'\bonlu teşkilat', r'\bbalbal', r'\byuğ\b',
            r'\bergenekon', r'\bkavimler göçü', r'\btürklerin ana yurdu', r'\boymak', r'\bboy\b'
        ]
    ),
    (
        "İslam Medeniyetinin Doğuşu ve İlk Türk-İslam Devletleri",
        [
            r'\bdört halife', r'\bhz\. ebubekir', r'\bhz\. ömer', r'\bhz\. osman', r'\bhz\. ali',
            r'\bemeviler', r'\babbasi', r'\bkerbela', r'\bhicret', r'\bbedir', r'\buhud', r'\bhendek',
            r'\bhudeybiye', r'\btalas savaşı', r'\bkarahanlı', r'\bgazneli', r'\bbüyük selçuklu',
            r'\btuğrul bey', r'\balparslan', r'\bmelikşah', r'\bdandanakan', r'\bmalazgirt',
            r'\bpasinler', r'\bnizamiye', r'\bnizamülmülk', r'\batabey', r'\bikta sistemi'
        ]
    ),
    (
        "Türkiye Tarihi ve Beylikler Dönemi (Anadolu Selçuklu)",
        [
            r'\banadolu selçuklu', r'\btürkiye selçuklu', r'\bmiryo kefalon', r'\bmiryokefalon',
            r'\bkösedağ', r'\byassıçemen', r'\b1\. beylikler', r'\b2\. beylikler', r'\bdanişment',
            r'\bsaltuk', r'\bmengücek', r'\bartuk', r'\bçaka bey', r'\bkareseoğulları', r'\bosmanoğulları',
            r'\bgermiyanoğulları', r'\bcandaroğulları', r'\bahilik', r'\bahi evran', r'\bkervansaray'
        ]
    ),
    (
        "Osmanlı Kuruluş ve Yükselme Dönemi (Beylikten Devlete)",
        [
            r'\bosman bey', r'\borhan bey', r'\b1\. murad', r'\byıldırım bayezid', r'\bçelebi mehmet',
            r'\b2\. murad', r'\bfatih sultan', r'\byavuz sultan', r'\bkanuni sultan',
            r'\bkoyunhisar', r'\bsırpsındığı', r'\b1\. kosova', r'\bniğbolu', r'\bankara savaşı',
            r'\bverna', r'\b2\. kosova', r'\bistanbul’un fethi', r'\bçaldıran', r'\bturnadağ',
            r'\bmercidabık', r'\bridaniye', r'\bmohaç', r'\bpreveze', r'\bdivan-ı hümayun',
            r'\bdevşirme', r'\byeniçeri', r'\btımar sistemi', r'\bkapıkulu', r'\bsancak sistemi'
        ]
    ),
    (
        "Osmanlı Duraklama, Gerileme ve Islahatlar",
        [
            r'\bkarlofça', r'\bkasr-ı şirin', r'\bpasarafça', r'\bküçük kaynarca', r'\byaş antlaşması',
            r'\blale devri', r'\b3\. selim', r'\bnizam-ı cedid', r'\b2\. mahmut', r'\bsened-i ittifak',
            r'\btanzimat fermanı', r'\bıslahat fermanı', r'\b1\. meşrutiyet', r'\b2\. meşrutiyet',
            r'\bkanun-ı esasi', r'\bgenç osmanlılar', r'\bjön türk', r'\bittihad ve terakki',
            r'\bduyun-ı umumiye', r'\bbalta limanı'
        ]
    ),
    (
        "I. Dünya Savaşı ve Millî Mücadele Hazırlık Dönemi",
        [
            r'\b1\. dünya savaşı', r'\bbirinci dünya savaşı', r'\bçanakkale cephesi', r'\bkafkas cephesi',
            r'\bkanal cephesi', r'\birak cephesi', r'\bhicaz', r'\bmondros', r'\bsevr', r'\bkuva-yı milliye',
            r'\bmustafa kemal', r'\bsamsun’a çıkış', r'\bhavza genelgesi', r'\bamasya genelgesi',
            r'\berzurum kongresi', r'\bsivas kongresi', r'\bamasyaprotokolü', r'\bmisaka-ı milli',
            r'\bmisâk-ı millî', r'\btbmm’nin açılması', r'\bhıyanet-i vataniye', r'\bistiklal mahkemeleri'
        ]
    ),
    (
        "Kurtuluş Savaşı Muharebeler ve Antlaşmalar",
        [
            r'\bdoğu cephesi', r'\bgümrü', r'\bgüney cephesi', r'\bmar’aş', r'\bantep', r'\burfa',
            r'\bfransız', r'\batina antlaşması', r'\b1\. inönü', r'\b2\. inönü', r'\blondra konferansı',
            r'\bmoskova antlaşması', r'\beskişehir-kütahya', r'\btekalif-i milliye', r'\bsakarya meydan',
            r'\bkars antlaşması', r'\bankara antlaşması', r'\bbüyük taarruz', r'\bbaşkomutanlık',
            r'\bmudanya', r'\blozan'
        ]
    ),
    (
        "Atatürk İnkılapları ve İlkeleri",
        [
            r'\bsaltanatın kaldırılması', r'\bcumhuriyetin ilanı', r'\bhalifeliğin kaldırılması',
            r'\btevhid-i tedrisat', r'\bşapka kanunu', r'\btekke ve zaviye', r'\bmedeni kanun',
            r'\bharf inkılabı', r'\btürk tarih kurumu', r'\btürk dil kurumu', r'\bsoyadı kanunu',
            r'\bcumhuriyetçilik', r'\bmilliyetçilik', r'\bhalkçılık', r'\bdevletçilik', r'\blaiklik',
            r'\binkılapçılık'
        ]
    ),
    (
        "Atatürk Dönemi Dış Politika ve II. Dünya Savaşı",
        [
            r'\bmilletler cemiyeti', r'\bbalkan antantı', r'\bmöntrö', r'\bsadabat paktı', r'\bhatay’ın anavatana',
            r'\b2\. dünya savaşı', r'\bikinci dünya savaşı', r'\bsoğuk savaş', r'\bbirleşmiş milletler',
            r'\bnato\b', r'\bvarşova paktı', r'\bkore savaşı', r'\bkıbrıs barış'
        ]
    ),
]

def classify_tarih(q):
    stem = q['soru'].lower()
    options = ' '.join(q['secenekler'].values()).lower()
    
    scores = {}
    for topic_name, patterns in TARIH_RULES:
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
    if code in [131, 137]: return "İlk ve Orta Çağlarda Türk Dünyası & İslamiyet Öncesi"
    elif code in [132]: return "İslam Medeniyetinin Doğuşu ve İlk Türk-İslam Devletleri"
    elif code in [133, 134]: return "Osmanlı Kuruluş ve Yükselme Dönemi (Beylikten Devlete)"
    elif code in [138]: return "Osmanlı Duraklama, Gerileme ve Islahatlar"
    elif code in [141]: return "I. Dünya Savaşı ve Millî Mücadele Hazırlık Dönemi"
    elif code in [142]: return "Atatürk İnkılapları ve İlkeleri"
    return "İlk ve Orta Çağlarda Türk Dünyası & İslamiyet Öncesi"

# Tarih 1-6 + İnkılap 1-2
tarih_codes = [131, 132, 133, 134, 137, 138, 141, 142]
with open('ciktilar/tum_sorular.json') as fp:
    all_db = json.load(fp)

tarih_qs = [r for r in all_db if r['ders_kodu'] in tarih_codes]
print(f'Total Tarih & İnkılap questions: {len(tarih_qs)}')

classified = defaultdict(lambda: defaultdict(list))
topic_periods = defaultdict(lambda: defaultdict(int))
all_periods = set()
all_tagged = []

for q in tarih_qs:
    topic = classify_tarih(q)
    q_copy = dict(q)
    q_copy['konu'] = topic
    all_tagged.append(q_copy)
    cname = q['ders'].split('–')[0].strip()
    classified[topic][q['ders_kodu']].append(q_copy)
    period_key = f"{q['yil']} D{q['donem']}"
    all_periods.add(period_key)
    topic_periods[topic][period_key] += 1

sorted_periods = sorted(all_periods)
print("\n" + "=" * 95)
print(f"{'KONU BAŞLIĞI':<52} | TOPLAM | DÖNEM | KESİŞİM DURUMU")
print("=" * 95)

cross_topics = []
for topic_name, _ in TARIH_RULES:
    tot = sum(len(classified[topic_name][c]) for c in tarih_codes)
    periods_present = len(topic_periods[topic_name])
    is_every = (periods_present == len(sorted_periods))
    active_codes = [c for c in tarih_codes if len(classified[topic_name][c]) > 0]
    status = f"🔥 HER DÖNEM SORULDU! ({len(active_codes)} Ders)" if is_every else f"⭐ {periods_present}/8 Dönem ({len(active_codes)} Ders)"
    print(f"{topic_name:<52} | {tot:>6} | {periods_present}/8  | {status}")
    if len(active_codes) >= 2:
        cross_topics.append((topic_name, active_codes, tot))

print("=" * 95)

# Save Outputs
os.makedirs('ciktilar/analiz', exist_ok=True)
with open('ciktilar/analiz/tarih_sorulari_etiketli.json', 'w', encoding='utf-8') as f:
    json.dump(all_tagged, f, ensure_ascii=False, indent=2)

report_path = 'ciktilar/analiz/TARIH_ORTAK_KONULAR_RAPORU.md'
with open(report_path, 'w', encoding='utf-8') as f:
    f.write("# 🏛️ Tarih (Tarih 1-6 & T.C. İnkılap Tarihi 1-2) Ortak Konu ve Kesişim Raporu\n\n")
    f.write("> **Amaç:** Tarih ve İnkılap Tarihi derslerinde ortak konularda öğrencileri tek sınıfta toplayarak **bir taşla 8 kuş vurmak**.\n\n")
    f.write(f"## 📊 Genel Kesişim Matrisi ({len(tarih_qs)} Soru)\n\n")
    f.write("| Konu Başlığı | Toplam Soru | Dönem Frekansı | Kesişen Ders Sayısı | Kesişim Durumu |\n")
    f.write("| :--- | :---: | :---: | :---: | :--- |\n")
    for topic_name, _ in TARIH_RULES:
        tot = sum(len(classified[topic_name][c]) for c in tarih_codes)
        periods_present = len(topic_periods[topic_name])
        active_codes = [c for c in tarih_codes if len(classified[topic_name][c]) > 0]
        status = f"🔥 **HER DÖNEM SORULDU! (%100)**" if periods_present == 8 else f"⭐ **{periods_present}/8 Dönemde Çıktı**"
        f.write(f"| **{topic_name}** | **{tot}** | {periods_present}/8 Dönem | {len(active_codes)} Farklı Ders | {status} |\n")

print("Tarih analysis complete!")
