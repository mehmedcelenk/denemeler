import json, re, os
from collections import defaultdict

TOPIC_RULES = [
    (
        "Harita Bilgisi ve İzohipsler",
        [
            r'\bharita', r'\bizohips', r'\bölçek', r'\beşyükselti', r'\bprojeksiyon',
            r'\blejant', r'\bprofil çıkarma', r'\bkroki', r'\bküçük ölçek', r'\bbüyük ölçek',
            r'\bplan\b', r'\brenklendirme yöntemi', r'\bölçekli'
        ]
    ),
    (
        "Dünya'nın Şekli, Hareketleri ve Coğrafi Konum",
        [
            r'\bdünyanın şekli', r'\bgeoit\b', r'\beksen eğikliği', r'\bmevsim', r'\bekinoks',
            r'\bgünöte', r'\bgünberi', r'\bgece-gündüz', r'\bgece ve gündüz', r'\bparalel\b',
            r'\bmeridyen\b', r'\benlem\b', r'\bboylam\b', r'\byerel saat', r'\bortak saat',
            r'\bulusal saat', r'\bçizgisel hız', r'\baçısal hız', r'\bgüneş ışınları',
            r'\bkoordinat', r'\b21 mart', r'\b23 eylül', r'\b21 haziran', r'\b21 aralık',
            r'\btarih değiştirme', r'\bgüneşlenme süresi', r'\bbaşlangıç meridyeni'
        ]
    ),
    (
        "Doğa, İnsan ve Coğrafya Bilimi",
        [
            r'\bfiziki coğrafya', r'\bbeşerî coğrafya', r'\bbeşeri coğrafya', r'\bcoğrafya bilimi',
            r'\bdoğa ve insan', r'\bjeomorfoloji', r'\bklimatoloji', r'\bhidrografya',
            r'\bbiyocoğrafya', r'\bkartografya', r'\bdoğal ortam', r'\bdoğal çevre',
            r'\bcoğrafi bilgi sistemleri', r'\bcbs\b', r'\bcoğrafyanın bölüm'
        ]
    ),
    (
        "Nüfus, Yerleşme ve Göç",
        [
            r'\bnüfus', r'\byerleşme', r'\byerleşim', r'\bgöç\b', r'\bgöçler', r'\bmesken\b',
            r'\bkerpiç\b', r'\bkırsal yerleşme', r'\bkent\b', r'\bşehir\b', r'\bköy\b',
            r'\bdemograf', r'\bdoğum oranı', r'\bölüm oranı', r'\byaş grubu', r'\bpiramit',
            r'\bmülteci', r'\bsığınmacı', r'\bçekici faktör', r'\bitici faktör', r'\bbeyin göçü',
            r'\biç göç', r'\bdış göç', r'\bkonut tipi', r'\btoplu yerleşme', r'\bdağınık yerleşme',
            r'\bilk çağ'
        ]
    ),
    (
        "İklim Bilgisi ve Atmosfer",
        [
            r'\biklim', r'\bsıcaklık', r'\bbasınç', r'\brüzgâr', r'\brüzgar', r'\byağış',
            r'\bnem\b', r'\bbağıl nem', r'\bmutlak nem', r'\batmosfer', r'\btroposfer',
            r'\bhava durumu', r'\bmeteoroloji', r'\bbarometre', r'\banemometre', r'\bhigrometre',
            r'\bmuson', r'\bakdeniz iklimi', r'\bkarasal iklim', r'\bçöl iklimi', r'\btundra',
            r'\bekvatoral', r'\bcephe yağış', r'\borografik', r'\bkonveksiyonel yağış'
        ]
    ),
    (
        "Yerin Yapısı, Kayaçlar ve İç Kuvvetler",
        [
            r'\bfay\b', r'\bfay hattı', r'\blevha\b', r'\btektonik', r'\bvolkan', r'\bvolkanizma',
            r'\bmagma', r'\blitosfer', r'\bmanto\b', r'\bçekirdek\b', r'\bkayaç', r'\bgranit\b',
            r'\bbazalt\b', r'\bkalker\b', r'\bkireç taşı', r'\btortul', r'\bbaşkalaşım',
            r'\bmetamorfik', r'\borojenez', r'\bepirojenez', r'\bjeolojik', r'\bseizma',
            r'\btsunami', r'\bkaldera', r'\bmaar\b', r'\bkrater\b'
        ]
    ),
    (
        "Dış Kuvvetler ve Yeryüzü Şekilleri",
        [
            r'\bmenderes', r'\bakarsu', r'\bvadi\b', r'\bdelta\b', r'\bkarstik', r'\blapya',
            r'\bdolin\b', r'\buvala', r'\bpolye', r'\btraverten', r'\bbuzul\b', r'\bmorfoloji',
            r'\brüzgar aşındırma', r'\bbarkan\b', r'\bmantar kaya', r'\btafoni', r'\bfalez\b',
            r'\bkıyı tipi', r'\btombo', r'\bkıyı', r'\bdenge profili', r'\başındırma',
            r'\bbiriktirme'
        ]
    ),
    (
        "Su, Toprak ve Bitki Örtüsü",
        [
            r'\bgöl\b', r'\bgöller', r'\bdeniz\b', r'\bokyanus', r'\bhidrosfer', r'\bkaynak\b',
            r'\bgayzer', r'\bartizyen', r'\byeraltı suyu', r'\btoprak\b', r'\bhumus\b',
            r'\bçernezyom', r'\bpodzol', r'\blaterit', r'\bterrarossa', r'\bbitki örtüsü',
            r'\bbozkır\b', r'\bstep\b', r'\bmaki\b', r'\borman\b', r'\btayga', r'\bsavan\b',
            r'\bçayır\b', r'\bbiyom\b', r'\bflora\b', r'\bfauna\b'
        ]
    ),
    (
        "Çevre ve Doğal Afetler",
        [
            r'\bafet', r'\bdeprem\b', r'\bfelaket', r'\bheyelan', r'\bsel\b', r'\btaşkın',
            r'\berozyon', r'\bçığ\b', r'\borman yangın', r'\bkuraklık', r'\bkirlilik',
            r'\bsera gaz', r'\bküresel ısınma', r'\biklim değişim', r'\batık\b',
            r'\bçevre kirlili', r'\bhava kirlili', r'\bsu kirlili', r'\bzehirli atık',
            r'\bdoğal afet'
        ]
    ),
    (
        "Bölgeler, Ulaşım ve Ekonomi",
        [
            r'\bbölge\b', r'\bbölgeler', r'\bşekilsel bölge', r'\bişlevsel bölge', r'\bulaşım',
            r'\bdemiryolu', r'\bkarayolu', r'\bdenizyolu', r'\bhavayolu', r'\bliman\b',
            r'\bticaret', r'\bsanayi', r'\btarım\b', r'\bhayvancılık', r'\bmaden\b',
            r'\bturizm\b', r'\bekonomik faaliyet', r'\bbirincil', r'\bikincil', r'\büçüncül',
            r'\bham madde', r'\bpazar\b', r'\bipekyolu', r'\bboğaz\b', r'\bkanal\b',
            r'\bsüveyş', r'\bpanama', r'\bhürmüz', r'\bmalakka'
        ]
    ),
]

def classify_question(q):
    stem = q['soru'].lower()
    options = ' '.join(q['secenekler'].values()).lower()
    
    # Stem gets 4x weight because the question stem dictates what is being tested
    scores = {}
    for topic_name, patterns in TOPIC_RULES:
        score = 0
        for pat in patterns:
            stem_matches = len(re.findall(pat, stem, re.IGNORECASE))
            opt_matches = len(re.findall(pat, options, re.IGNORECASE))
            score += (stem_matches * 4) + opt_matches
        scores[topic_name] = score
        
    best_topic = max(scores, key=scores.get)
    if scores[best_topic] > 0:
        return best_topic
        
    # Context-based default fallbacks
    c_code = q['ders_kodu']
    if c_code == 151:
        if any(w in stem for w in ['saat', 'tarih', 'derece', 'kutup', 'ekvator', 'güneş']):
            return "Dünya'nın Şekli, Hareketleri ve Coğrafi Konum"
        return "İklim Bilgisi ve Atmosfer"
    elif c_code == 152:
        return "Nüfus, Yerleşme ve Göç"
    elif c_code == 153:
        return "Dış Kuvvetler ve Yeryüzü Şekilleri"
    elif c_code == 154:
        return "Nüfus, Yerleşme ve Göç"
    return "Doğa, İnsan ve Coğrafya Bilimi"

# Run classification on all 4 courses
courses = {
    'COĞ-1': 'scripts/ciktilar/cografya/151_COGRAFYA_1.json',
    'COĞ-2': 'scripts/ciktilar/cografya/152_COGRAFYA_2.json',
    'COĞ-3': 'scripts/ciktilar/cografya/153_COGRAFYA_3.json',
    'COĞ-4': 'scripts/ciktilar/cografya/154_COGRAFYA_4.json',
}

classified = defaultdict(lambda: defaultdict(list))
all_classified_qs = []

for cname, cpath in courses.items():
    with open(cpath) as f:
        qs = json.load(f)
    for q in qs:
        topic = classify_question(q)
        q_copy = dict(q)
        q_copy['konu'] = topic
        classified[topic][cname].append(q_copy)
        all_classified_qs.append(q_copy)

# Print Summary Table
print("=========================================================================================")
print(f"{'KONU BAŞLIĞI':<44} | {'COĞ-1':<6} | {'COĞ-2':<6} | {'COĞ-3':<6} | {'COĞ-4':<6} | {'TOPLAM':<6} | KESİŞİM")
print("=========================================================================================")

cross_topics = []
for topic_name, _ in TOPIC_RULES:
    c1 = len(classified[topic_name]['COĞ-1'])
    c2 = len(classified[topic_name]['COĞ-2'])
    c3 = len(classified[topic_name]['COĞ-3'])
    c4 = len(classified[topic_name]['COĞ-4'])
    tot = c1 + c2 + c3 + c4
    active_courses = [cn for cn, count in [('COĞ-1', c1), ('COĞ-2', c2), ('COĞ-3', c3), ('COĞ-4', c4)] if count > 0]
    overlap_label = f"{len(active_courses)} Ders Ortak! ⭐" if len(active_courses) >= 2 else "Tek Ders"
    print(f"{topic_name:<44} | {c1:<6} | {c2:<6} | {c3:<6} | {c4:<6} | {tot:<6} | {overlap_label}")
    if len(active_courses) >= 2:
        cross_topics.append((topic_name, active_courses, tot))

print("=========================================================================================")
print(f"Toplam Soru Sayısı: {len(all_classified_qs)}")

# Save Outputs
os.makedirs('scripts/ciktilar/analiz', exist_ok=True)

with open('scripts/ciktilar/analiz/cografya_sorulari_etiketli.json', 'w', encoding='utf-8') as f:
    json.dump(all_classified_qs, f, ensure_ascii=False, indent=2)

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

with open('scripts/ciktilar/analiz/cografya_ortak_konu_kumeleri.json', 'w', encoding='utf-8') as f:
    json.dump(grouped_output, f, ensure_ascii=False, indent=2)

report_path = 'scripts/ciktilar/analiz/COGRAFYA_ORTAK_KONULAR_RAPORU.md'
with open(report_path, 'w', encoding='utf-8') as f:
    f.write("# 🎯 Coğrafya 1, 2, 3, 4 Sınavları Ortak Konu ve Kesişim Raporu\n\n")
    f.write("> **Amaç:** Farklı dönem ve seviyedeki (Coğ 1-4) öğrencileri aynı derslikte toplayıp ortak konuları anlatarak **bir taşla 4 kuş vurmak**.\n\n")
    f.write("## 📊 Genel Kesişim Matrisi (328 Soru)\n\n")
    f.write("| Konu Başlığı | COĞ-1 | COĞ-2 | COĞ-3 | COĞ-4 | Toplam Soru | Kesişim Durumu |\n")
    f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :--- |\n")
    for topic_name, _ in TOPIC_RULES:
        c1 = len(classified[topic_name]['COĞ-1'])
        c2 = len(classified[topic_name]['COĞ-2'])
        c3 = len(classified[topic_name]['COĞ-3'])
        c4 = len(classified[topic_name]['COĞ-4'])
        tot = c1 + c2 + c3 + c4
        active_courses = [cn for cn, count in [('COĞ-1', c1), ('COĞ-2', c2), ('COĞ-3', c3), ('COĞ-4', c4)] if count > 0]
        status = f"🔥 **{len(active_courses)} Ders Ortak!**" if len(active_courses) >= 2 else "Tek Ders"
        f.write(f"| **{topic_name}** | {c1} | {c2} | {c3} | {c4} | **{tot}** | {status} |\n")

    f.write("\n---\n\n")
    f.write("## 💡 Ders Birleştirme ve Hızlı Kazanım Stratejisi\n\n")
    for top, courses_list, tot in sorted(cross_topics, key=lambda x: -x[2]):
        dist_str = ', '.join([f"{c}: {len(classified[top][c])} soru" for c in courses_list])
        f.write(f"### 📍 {top} (Toplam {tot} Soru)\n")
        f.write(f"- **Ortak Dersler:** {', '.join(courses_list)}\n")
        f.write(f"- **Soru Dağılımı:** {dist_str}\n")
        f.write(f"- **Strateji:** Kurstaki **{', '.join(courses_list)}** öğrencilerini aynı anda toplayıp bu konuyu işlediğinde, öğrencilerin sınavdaki toplam **{tot}** sorusunu tek seferde çözmüş olursun.\n\n")

print("\nAnalysis complete and files saved successfully!")
