import json, re, glob, os
from collections import defaultdict

with open('scripts/ciktilar/tum_sorular.json', encoding='utf-8') as f:
    all_questions = json.load(f)

# Helper function
def run_topic_analysis(group_name, course_codes, topic_rules, default_topic, output_slug):
    qs = [q for q in all_questions if q['ders_kodu'] in course_codes]
    print(f"\n=========================================================================================")
    print(f"ANALYZING: {group_name} ({len(qs)} Soru, {len(course_codes)} Ders)")
    print(f"=========================================================================================")
    
    def classify(q):
        stem = q['soru'].lower()
        opts = ' '.join(q['secenekler'].values()).lower()
        scores = {}
        for top_name, patterns in topic_rules:
            score = 0
            for pat in patterns:
                s_match = len(re.findall(pat, stem, re.IGNORECASE))
                o_match = len(re.findall(pat, opts, re.IGNORECASE))
                score += (s_match * 4) + o_match
            scores[top_name] = score
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else default_topic
        
    classified = defaultdict(lambda: defaultdict(list))
    topic_periods = defaultdict(lambda: defaultdict(int))
    all_periods = set()
    tagged_qs = []
    
    for q in qs:
        top = classify(q)
        q_copy = dict(q)
        q_copy['konu'] = top
        tagged_qs.append(q_copy)
        classified[top][q['ders_kodu']].append(q_copy)
        per = f"{q['yil']} D{q['donem']}"
        all_periods.add(per)
        topic_periods[top][per] += 1
        
    print(f"{'KONU BAŞLIĞI':<48} | TOPLAM | DÖNEM | KESİŞİM DURUMU")
    print("-" * 90)
    
    cross_topics = []
    sorted_topics = sorted(topic_rules, key=lambda x: -sum(len(classified[x[0]][c]) for c in course_codes))
    
    report_rows = []
    for top_name, _ in sorted_topics:
        tot = sum(len(classified[top_name][c]) for c in course_codes)
        periods_cnt = len(topic_periods[top_name])
        active_courses = [c for c in course_codes if len(classified[top_name][c]) > 0]
        is_every = (periods_cnt == len(all_periods))
        status = f"🔥 HER DÖNEM SORULDU! ({len(active_courses)} Ders)" if is_every else f"⭐ {periods_cnt}/8 Dönem ({len(active_courses)} Ders)"
        print(f"{top_name:<48} | {tot:>6} | {periods_cnt}/8  | {status}")
        
        report_rows.append((top_name, tot, periods_cnt, len(active_courses), status))
        if len(active_courses) >= 2:
            cross_topics.append((top_name, active_courses, tot))
            
    # Save Tagged JSON
    os.makedirs('scripts/ciktilar/analiz', exist_ok=True)
    with open(f"scripts/ciktilar/analiz/{output_slug}_sorulari_etiketli.json", 'w', encoding='utf-8') as f:
        json.dump(tagged_qs, f, ensure_ascii=False, indent=2)
        
    # Save Report
    report_file = f"scripts/ciktilar/analiz/{output_slug.upper()}_ORTAK_KONULAR_RAPORU.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(f"# 📖 {group_name} Ortak Konu ve Kesişim Raporu\n\n")
        f.write(f"> **Kapsam:** {len(qs)} Soru, {len(course_codes)} Zorunlu Ders, 8 Sınav Dönemi.\n\n")
        f.write(f"## 📊 Genel Kesişim Matrisi\n\n")
        f.write("| Konu Başlığı | Toplam Soru | Dönem Frekansı | Kesişen Ders Sayısı | Kesişim Durumu |\n")
        f.write("| :--- | :---: | :---: | :---: | :--- |\n")
        for top_name, tot, periods_cnt, act_cnt, status in report_rows:
            f.write(f"| **{top_name}** | **{tot}** | {periods_cnt}/8 Dönem | {act_cnt} Farklı Ders | {status} |\n")
            
        f.write("\n---\n\n## 💡 Öğretmenler ve Kurs Yönetimi İçin Tavsiyeler\n\n")
        for top, act_courses, tot in sorted(cross_topics, key=lambda x: -x[2]):
            f.write(f"### 📍 {top} (Toplam {tot} Soru)\n")
            f.write(f"- **Etkilenen Ders Kodları:** {', '.join(str(c) for c in act_courses)}\n")
            f.write(f"- **Ders Birleştirme:** Bu konu işlendiğinde aynı salondaki {len(act_courses)} farklı seviyedeki öğrenci tek seferde faydalanır.\n\n")
            
    print(f"Saved: {report_file}")
    return report_rows

# =========================================================================
# 1. DİN KÜLTÜRÜ VE AHLAK BİLGİSİ (111 - 118)
# =========================================================================
DIN_RULES = [
    ("İnanç ve İman Esasları", [
        r'\biman\b', r'\binanç\b', r'\btevhid\b', r'\ballah’ın sıfat', r'\bzati sıfat', r'\bsübuti sıfat',
        r'\bahiret\b', r'\bkaza ve kader', r'\bmelek\b', r'\bpeygamberlik', r'\bnübüvvet', r'\bvahiy\b',
        r'\bbasü ba’s', r'\bhaşr\b', r'\bmizan\b', r'\bamel defteri', r'\bcennet', r'\bcehennem'
    ]),
    ("İbadetler ve Hükümleri", [
        r'\bibadet', r'\bnamaz\b', r'\boruç\b', r'\bzekât\b', r'\bzekat\b', r'\bhac\b', r'\bumre\b',
        r'\bkurban\b', r'\bfarz\b', r'\bvacip\b', r'\bsünnet\b', r'\bhelal\b', r'\bharam\b',
        r'\babdest', r'\bgusül\b', r'\bteyemmüm', r'\bkıble\b', r'\bcemaat\b'
    ]),
    ("Ahlak, Değerler ve Sosyal Hayat", [
        r'\bahlak', r'\bkul hakkı', r'\badalet\b', r'\bdürüstlük', r'\bsabır\b', r'\bgıybet\b',
        r'\biftira\b', r'\bhaset\b', r'\bzina\b', r'\bmahremiyet', r'\bsıla-i rahim', r'\bana baba hakkı',
        r'\bisraf\b', r'\btutum ve davranış', r'\berdem\b', r'\bhikmet\b', r'\biffet\b'
    ]),
    ("Hz. Muhammed (sav) ve Sünnet Anlayışı", [
        r'\bhz\. muhammed', r'\bpeygamberimiz', r'\bresulullah', r'\bhadis\b', r'\bsünnet',
        r'\büsve-i hasene', r'\bvahiy kâtibi', r'\brisalet', r'\btebliğ', r'\btebyin', r'\bteşri',
        r'\btemsil\b', r'\behl-i beyt', r'\bsahabe\b'
    ]),
    ("Kur’an-ı Kerim ve Yorumu", [
        r'\bkur’an', r'\bayet\b', r'\bsure\b', r'\bcüz\b', r'\bmushaf\b', r'\btefsir\b', r'\bmeal\b',
        r'\btecvid\b', r'\bmukabele', r'\bkıssa\b', r'\bnüzul\b', r'\bmuhkem', r'\bmüteşabih'
    ]),
    ("İslam Düşüncesinde Yorumlar ve Mezhepler", [
        r'\bmezhep', r'\bitikadi', r'\bameli\b', r'\bfıkhî', r'\bmaturidi', r'\beş’ari', r'\beşari',
        r'\bhanefi', r'\bşafii', r'\bmaliki', r'\bhanbeli', r'\bcaferi', r'\btasavvuf', r'\btarikat',
        r'\byesevilik', r'\bmevlevilik', r'\bbektaşilik', r'\bahilik'
    ]),
    ("Din ve Laiklik, Güncel Konular ve Dünya Dinleri", [
        r'\byahudilik', r'\bhristiyanlık', r'\btora\b', r'\bincil\b', r'\bsinagog', r'\bhavra', r'\bkilise',
        r'\blaiklik', r'\bseküler', r'\bislamofobi', r'\bmisyo', r'\bateizm', r'\bdeizm', r'\bagnostisizm'
    ]),
]
run_topic_analysis("Din Kültürü ve Ahlak Bilgisi (1-8)", [111, 112, 113, 114, 115, 116, 117, 118], DIN_RULES, "Ahlak, Değerler ve Sosyal Hayat", "din_kulturu")

# =========================================================================
# 2. FELSEFE (121, 122, 125, 126)
# =========================================================================
FELSEFE_RULES = [
    ("Felsefeyi Tanıma ve Akıl Yürütme", [
        r'\bfelsefe\b', r'\bfelsefi düşünce', r'\bfilozof', r'\brefleksif', r'\btutarlılık',
        r'\btümevarım', r'\btümdengelim', r'\banaloji', r'\bargüman', r'\böncül\b', r'\bçelişki',
        r'\bgörüş\b', r'\bakıl yürütme', r'\bhikmet\b', r'\bsevgi\b'
    ]),
    ("Varlık Felsefesi (Ontoloji)", [
        r'\bvarlık felsefesi', r'\bontoloji', r'\bvarlığın mahiyeti', r'\bidealizm', r'\bmateryalizm',
        r'\bdüalizm', r'\bfenomenoloji', r'\bnihilizm', r'\boluş\b', r'\bmadde\b', r'\bidea\b',
        r'\btöz\b', r'\barke\b', r'\bmetafizik'
    ]),
    ("Bilgi Felsefesi (Epistemoloji)", [
        r'\bbilgi felsefesi', r'\bepistemoloji', r'\bdoğru bilgi', r'\brasyonalizm', r'\bampirizm',
        r'\bkritisizm', r'\bpozitivizm', r'\bpragmatizm', r'\bsezgicilik', r'\bentüisyonizm',
        r'\bseptisizm', r'\bkuşkuculuk', r'\broletivizm', r'\bapriori', r'\baposteriori'
    ]),
    ("Ahlak, Sanat ve Din Felsefesi", [
        r'\bahlak felsefesi', r'\betik\b', r'\berdem\b', r'\bvicdan\b', r'\bözgürlük', r'\bhedonizm',
        r'\bfaydacılık', r'\butilitarizm', r'\bödev ahlakı', r'\bkant’ın ödev', r'\bestetik',
        r'\bgüzellik', r'\bsanat felsefesi', r'\bdin felsefesi', r'\btanrı kanıt', r'\bteizm',
        r'\bdeizm', r'\bpanteizm', r'\bateizm'
    ]),
    ("Siyaset ve Bilim Felsefesi", [
        r'\bsiyaset felsefesi', r'\bdevlet\b', r'\begemenlik', r'\bmeşruiyet', r'\bütopya',
        r'\bhukuk\b', r'\bbilim felsefesi', r'\bparadigma', r'\bdoğrulanabilirlik', r'\byanlışlanabilirlik'
    ]),
    ("İlk Çağ ve Orta Çağ Felsefesi", [
        r'\bmö 6\. yüzyıl', r'\bms 2\. yüzyıl', r'\bsokrates', r'\bplaton', r'\baristoteles',
        r'\bthales', r'\banaksimandros', r'\bherakleitos', r'\bparmenides', r'\bpatristik',
        r'\bskolastik', r'\baugustinus', r'\btomas', r'\bfârâbî', r'\bfarabi', r'\bibn sina',
        r'\bgazali', r'\bibn rüşd', r'\bçeviri faaliyeti'
    ]),
    ("15-17. Yüzyıl ve 18-19. Yüzyıl Aydınlanma Felsefesi", [
        r'\brönesans', r'\bhümanizm', r'\bdescartes', r'\bspinoza', r'\bfrancis bacon', r'\tthomas hobbes',
        r'\baydınlanma', r'\bjohn locke', r'\brousseau', r'\bkant\b', r'\bhegel\b', r'\bakıl çağı'
    ]),
    ("20. Yüzyıl ve Çağdaş Felsefe Akımları", [
        r'\b20\. yüzyıl', r'\bvaroluşçuluk', r'\begzistansiyalizm', r'\bsartre', r'\bnietzsche',
        r'\bhermeneutik', r'\bmantıkçı pozitivizm', r'\bkarnap', r'\bdiyalektik materyalizm', r'\bmarx\b'
    ]),
]
run_topic_analysis("Felsefe (1-4)", [121, 122, 125, 126], FELSEFE_RULES, "Felsefeyi Tanıma ve Akıl Yürütme", "felsefe")

# =========================================================================
# 3. AÖİHL İMAM HATİP MESLEK DERSLERİ (Siyer, Fıkıh, Akaid, Kelam, Dinler Tarihi, İKM)
# =========================================================================
MESLEK_CODES = [931, 932, 511, 512, 817, 818, 819, 820, 611, 612, 713, 714]
MESLEK_RULES = [
    ("Hz. Muhammed’in Hayatı ve Siyer", [
        r'\bhz\. muhammed', r'\bsiyer', r'\bcahiliye', r'\bhicret', r'\bensar', r'\bmuhacir',
        r'\bbedir savaşı', r'\buhud savaşı', r'\bhendek savaşı', r'\bhudeybiye', r'\bmekke’nin fethi',
        r'\bveda hutbesi', r'\bveda haccı', r'\bmuahat', r'\bmedine sözleşmesi'
    ]),
    ("Fıkıh, Hukuk ve İbadet Usulü", [
        r'\bfıkıh', r'\bmükellef', r'\bef’al-i mükellefin', r'\bicma\b', r'\bkıyas\b', r'\bedille-i şer’iyye',
        r'\biçtihat', r'\bfetva\b', r'\bnikah\b', r'\btalak\b', r'\bmiras\b', r'\bferaiz',
        r'\balışveriş', r'\bfaiz\b', r'\briba\b', r'\bzekat hükümleri', r'\btaharet'
    ]),
    ("Akaid, Kelam ve İnanç Esasları", [
        r'\bakaid', r'\bkelam\b', r'\bimanın tanımı', r'\btaklidî iman', r'\btahkikî iman',
        r'\btekfir', r'\bfısk\b', r'\bnifak\b', r'\brü’yetullah', r'\bhudus delili',
        r'\bimkan delili', r'\bnizam delili', r'\bgaye delili', r'\bkaza ve kader', r'\bşefaat'
    ]),
    ("Dinler Tarihi ve Karşılaştırmalı Dinler", [
        r'\bdinler tarihi', r'\byahudilik', r'\bhristiyanlık', r'\bhinduizm', r'\bbudizm',
        r'\bzerdüştlük', r'\bcaynizm', r'\bsihizm', r'\bkonfüçyanizm', r'\btaoizm',
        r'\bkutsal metin', r'\bvedalar', r'\btripitaka', r'\bavesta', r'\bteslis', r'\bpapa\b'
    ]),
    ("İslam Kültür, Medeniyeti ve Kurumları", [
        r'\bislam medeniyeti', r'\bbeytülhikme', r'\brasathane', r'\bmedrese', r'\bvakıf medeniyeti',
        r'\bdarüşşifa', r'\bkülliye', r'\bhat sanatı', r'\btezhip', r'\bebru\b', r'\bminyatür',
        r'\bdivan teşkilatı', r'\bbeytülmal', r'\bkaza teşkilatı'
    ]),
]
run_topic_analysis("AÖİHL İmam Hatip Meslek Dersleri", MESLEK_CODES, MESLEK_RULES, "Akaid, Kelam ve İnanç Esasları", "imam_hatip_meslek")

# =========================================================================
# 4. FEN BİLİMLERİ (Fizik, Kimya, Biyoloji)
# =========================================================================
FEN_CODES = [421, 422, 423, 424, 431, 432, 433, 434, 441, 442, 443, 444]
FEN_RULES = [
    ("Hücre, Canlıların Ortak Özellikleri ve Genetik (Biyoloji)", [
        r'\bhücre\b', r'\borganel', r'\bmitokondri', r'\bribozom', r'\bdna\b', r'\brna\b',
        r'\bmitoz', r'\bmayoz', r'\bgenetik', r'\bkalıtım', r'\bkromozom', r'\bprotein sentezi',
        r'\benizim', r'\bfotosentez', r'\bsolunum', r'\bcanlıların sınıf'
    ]),
    ("Madde, Atom, Periyodik Sistem ve Kimyasal Bağlar (Kimya)", [
        r'\batom\b', r'\bperiyodik sistem', r'\bkimyasal bağ', r'\bkovalent', r'\biyonik',
        r'\bmol\b', r'\bavogadro', r'\bçözelti', r'\basit\b', r'\bbaz\b', r'\btuz\b', r'\bph\b',
        r'\bgazlar', r'\btermodinamik', r'\bkimyasal tepkime', r'\belektroliz'
    ]),
    ("Kuvvet, Hareket, Enerji ve Elektrik/Dalgalar (Fizik)", [
        r'\bkuvvet', r'\bhareket', r'\bhız\b', r'\bivme\b', r'\bnewton', r'\biş\b', r'\benerji\b',
        r'\bkinetik', r'\bpotansiyel', r'\belektrik', r'\bdirenç', r'\bakım\b', r'\bvolt',
        r'\blamba\b', r'\bmanyetizma', r'\bdalga', r'\boptik', r'\bkırılma', r'\byansıma', r'\bmercek'
    ]),
    ("Ekoloji, Canlılar ve Çevre", [
        r'\bekoloji', r'\bekosistem', r'\bbesin zinciri', r'\bpopülasyon', r'\bkomünite',
        r'\bbiyoçeşitlilik', r'\bçevre kirliliği', r'\berozyon', r'\bmadde döngüsü'
    ]),
]
run_topic_analysis("Fen Bilimleri (Fizik, Kimya, Biyoloji 1-4)", FEN_CODES, FEN_RULES, "Hücre, Canlıların Ortak Özellikleri ve Genetik (Biyoloji)", "fen_bilimleri")

print("\n=========================================================================================")
print("ALL COMPULSORY SUBJECT ANALYSES GENERATED SUCCESSFULLY!")
print("=========================================================================================")
