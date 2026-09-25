#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_tarih.py
Tarih 1 - 6 (492 Soru) Veri Temizleme ve MEB Müfredatına Göre Kesişim Analizi
"""

import json
import re

turkish_lower = 'abcçdefgğhıijklmnoöprsştuüvyz'

def clean_text(text):
    if not text:
        return ''
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    merged_lines = []
    for l in lines:
        l = re.sub(r'[ \t]+', ' ', l)
        if not merged_lines:
            merged_lines.append(l)
            continue
        prev = merged_lines[-1]
        
        # Word broken across lines
        if prev.endswith('-') and not prev.endswith(' -') and not prev.endswith('--'):
            merged_lines[-1] = prev[:-1] + l
            continue
            
        # Lowercase continuation
        if l and l[0] in turkish_lower:
            merged_lines[-1] = prev + ' ' + l
            continue
            
        # Punctuation continuation
        if l and l[0] in '),;:.':
            merged_lines[-1] = prev + l
            continue
            
        is_roman = bool(re.match(r'^(I{1,3}|IV|V|VI|VII|VIII|IX|X)\.\s*', l))
        is_bullet = bool(re.match(r'^[\-\•\*\d+\.]\s*', l))
        is_lead = any(l.startswith(w) for w in ['Buna göre', 'Aşağıdaki', 'Bu parçada', 'Numaralanmış', 'Yukarıdaki', 'Bu bilgilere', 'Verilen', 'Bu duruma'])
        prev_has_terminal = prev[-1] in '.!?:;”\"’\'' or prev.endswith('?') or prev.endswith('!')
        
        if not prev_has_terminal and not is_roman and not is_bullet and not is_lead:
            merged_lines[-1] = prev + ' ' + l
            continue
            
        merged_lines.append(l)
        
    return '\n\n'.join(merged_lines)

def classify_tarih(q):
    stem = q['soru'].lower()
    opts = ' '.join(q.get('secenekler', {}).values()).lower()
    text = stem + ' ' + opts
    ders = q['ders']

    # --- 1. TARİH VE ZAMAN ---
    if any(k in text for k in ['takvim', 'hicri', 'miladi', 'celali', 'rumi', '12 hayvan', 'on iki hayvan']):
        return 'Tarih ve Zaman', 'Zamanın Taksimi ve Takvimler'
    if any(k in text for k in ['arkeoloji', 'nümizmatik', 'epigrafi', 'paleografi', 'filoloji', 'heraldik', 'antropoloji', 'etnografya', 'kronoloji', 'diplomatik', 'karbon 14', 'tarihe yardımcı', 'birinci elden', 'ikinci elden', 'tarihî olay', 'tarihî olgu', 'herodot', 'thukydides', 'tarih yazıcılığı', 'tarih araştırmaları']):
        return 'Tarih ve Zaman', 'Tarih Bilimine Giriş, Yöntem ve Kaynaklar'

    # --- 2. İLK ÇAĞ MEDENİYETLERİ ---
    if any(k in text for k in ['çatalhöyük', 'göbeklitepe', 'çayönü', 'hacılar', 'alişar', 'alacahöyük', 'aslantepe', 'yontma taş', 'cilalı taş', 'neolitik', 'paleolitik', 'kalkolitik', 'tunç çağı', 'bakır çağı', 'demir çağı', 'tarih öncesi']):
        return 'İlk Çağ Medeniyetleri', 'Tarih Öncesi Çağlar ve Arkeolojik Merkezler'
    if any(k in text for k in ['hitit', 'frig', 'lidya', 'urartu', 'iyon', 'pankuş', 'anal', 'tavananna', 'sardes', 'tuşpa', 'gordion', 'hattuşa', 'kadeş', 'kibele', 'fibula', 'kral yolu']):
        return 'İlk Çağ Medeniyetleri', 'Anadolu Medeniyetleri (Hitit, Frig, Lidya, Urartu, İyon)'
    if any(k in text for k in ['sümer', 'babil', 'asur', 'akad', 'elam', 'ziggurat', 'hammurabi', 'urukagina', 'çivi yazısı', 'kültepe', 'ninova', 'mısır', 'hiyeroglif', 'firavun', 'nomo', 'papirüs']):
        return 'İlk Çağ Medeniyetleri', 'Mezopotamya ve Mısır Medeniyetleri'
    if any(k in text for k in ['fenike', 'ibrani', 'pers', 'satrap', 'büyük iskender', 'helen', 'roma', '12 levha', 'polis', 'atina', 'sparta', 'site', 'kast sistemi', 'kolonicilik', 'alfabe']):
        return 'İlk Çağ Medeniyetleri', 'Doğu Akdeniz, Ege ve Roma Medeniyetleri'

    # --- 3. ORTA ÇAĞ'DA DÜNYA ---
    if any(k in text for k in ['feodal', 'derebeylik', 'kavimler göçü', 'magna charta', 'justinianus', 'skolastik', 'cengiz han', 'moğol boyları', 'orta çağ’da', 'orta çağda']):
        return 'Orta Çağ\'da Dünya', 'Orta Çağ Siyasi, Sosyal Yapısı ve Hukuk'
    if any(k in text for k in ['ipek yolu', 'baharat yolu', 'kürk yolu', 'ribat', 'kervansaray', 'bedesten', 'arasta', 'kapan', 'han ', 'ticaret yolu', 'soğd']):
        return 'Orta Çağ\'da Dünya', 'Orta Çağ Ticaret Yolları ve Merkezleri'

    # --- 4. İLK VE ORTA ÇAĞLARDA TÜRK DÜNYASI ---
    if any(k in text for k in ['orhun', 'göktürk', 'kök türk', 'bilge kağan', 'kültigin', 'tonyukuk', 'uygur', 'karabalgasun', 'sine uşu', 'bögü kağan', 'maniheizm', 'moçur', 'tayan', 'kürşad']):
        return 'İlk ve Orta Çağlarda Türk Dünyası', 'Kök Türkler, Uygurlar ve Orhun Kitabeleri'
    if any(k in text for k in ['asya hun', 'mete han', 'teoman', 'avrupa hun', 'attila', 'orta asya göç', 'ötüken', 'iskit', 'alper tunga']):
        return 'İlk ve Orta Çağlarda Türk Dünyası', 'Orta Asya Türk Göçleri ve Hun Devletleri'
    if any(k in text for k in ['kurultay', 'töre', 'kut anlayışı', 'ikili teşkilat', 'ülüş', 'onlu teşkilat', 'balbal', 'kurgan', 'yuğ', 'boy ', 'ordu millet', 'tarkan', 'ayukı', 'yabgu']):
        return 'İlk ve Orta Çağlarda Türk Dünyası', 'Türk Devlet Teşkilatı, Hukuk ve Toplum Yapısı'
    if any(k in text for k in ['hazar', 'avar', 'peçenek', 'kıpçak', 'kuman', 'bulgar', 'macar', 'türgiş', 'karlık', 'kırgız', 'sibir', 'sabir', 'oğuzlar']):
        return 'İlk ve Orta Çağlarda Türk Dünyası', 'Diğer Türk Toplulukları ve Kültürel Etkileşim'

    # --- 5. İSLAM MEDENİYETİ ---
    if any(k in text for k in ['hicret', 'bedir', 'uhud', 'hendek', 'hudeybiye', 'mekke', 'dört halife', 'hz. ebubekir', 'hz. ömer', 'hz. osman', 'hz. ali', 'sıffin', 'cemel', 'ridde', 'yermük', 'nihavend', 'divan teşkilatı']):
        return 'İslam Medeniyeti', 'Hz. Muhammed ve Dört Halife Dönemi'
    if any(k in text for k in ['emevi', 'abbasi', 'mevali', 'endülüs', 'beytülhikme', 'samarra', 'avasım', 'muaviye', 'kerbela', 'talavera', 'kurtuba', 'harun reşid']):
        return 'İslam Medeniyeti', 'Emeviler, Abbasiler ve İslam Kültür Medeniyeti'

    # --- 6. TÜRK-İSLAM TARİHİ ---
    if any(k in text for k in ['talas', 'karahanlı', 'gazneli', 'satuk buğra', 'gazneli mahmud', 'yusuf kadir', 'somnat']):
        return 'Türk-İslam Tarihi', 'Türklerin İslamiyeti Kabulü, Karahanlılar ve Gazneliler'
    if any(k in text for k in ['dandanakan', 'pasinler', 'malazgirt', 'tuğrul', 'alp arslan', 'melikşah', 'nizamülmülk', 'büyük selçuklu', 'nizamiye medresesi', 'hasan sabbah', 'batınilik', 'atabey']):
        return 'Türk-İslam Tarihi', 'Büyük Selçuklu Devleti ve Teşkilatı'
    if any(k in text for k in ['kutadgu bilig', 'divanü lugati', 'atabetü', 'divan-ı hikmet', 'yusuf has hacib', 'kaşgarlı', 'ahmed yesevi', 'edip ahmed']):
        return 'Türk-İslam Tarihi', 'İlk Türk-İslam Kültür ve Edebi Eserleri'

    # --- 7. SELÇUKLU VE ANADOLU BEYLİKLERİ ---
    if any(k in text for k in ['danişment', 'saltuk', 'mengücek', 'artuk', 'çaka bey', 'yağıbasan', 'divriği ulu cami', 'mama hatun']):
        return 'Selçuklu ve Anadolu Beylikleri', 'Anadolu\'da Kurulan İlk Türk Beylikleri'
    if any(k in text for k in ['miryokefalon', 'türkiye selçuklu', 'anadolu selçuklu', 'süleyman şah', 'kılıç arslan', 'alaeddin keykubad', 'gıyaseddin', 'iznik', 'konya', 'haçlı sefer']):
        return 'Selçuklu ve Anadolu Beylikleri', 'Türkiye Selçuklu Devleti ve Haçlı Seferleri'
    if any(k in text for k in ['kösedağ', 'babailer', 'karamanoğulları', 'karesi', 'germiyan', 'dulkadir', 'candaroğulları', 'hamitoğulları', 'menteşe', 'saruhan', 'ahilik', 'ahi evran', 'moğol istilası']):
        return 'Selçuklu ve Anadolu Beylikleri', 'Kösedağ Savaşı, Moğol İstilası ve İkinci Beylikler'

    # --- 8. BEYLİKTEN DEVLETE OSMANLI (KURULUŞ) ---
    if any(k in text for k in ['osman bey', 'orhan bey', 'koyunhisar', 'bursa', 'çimpe', 'iznik', 'bafeus', 'şeyh edebali', 'yarhisar', 'mudanya']):
        return 'Beylikten Devlete Osmanlı', 'Osmanlı Beyliği\'nin Kuruluşu ve Genişlemesi'
    if any(k in text for k in ['sırpsındığı', 'i. kosova', 'ii. kosova', 'niğbolu', 'varna', 'iskân', 'istimalet', 'i. murad', 'edirne', 'sazlıdere', 'hacı ilbeyi']):
        return 'Beylikten Devlete Osmanlı', 'Balkan Fetihleri, Haçlı Savaşları ve İskân Politikası'
    if any(k in text for k in ['ankara savaşı', 'yıldırım bayezid', 'fetret', 'çelebi mehmed', 'şeyh bedreddin', 'timur', 'anadolu türk siyasi birliği']):
        return 'Beylikten Devlete Osmanlı', 'Ankara Savaşı, Fetret Devri ve Siyasi Birlik'
    if any(k in text for k in ['yeniçeri', 'devşirme', 'pençik', 'tımar', 'tımarlı sipahi', 'yaya ve müsellem', 'kapıkulu', 'ocak', 'cebeci', 'topçu']):
        return 'Beylikten Devlete Osmanlı', 'Osmanlı Askerî Teşkilatı (Tımar ve Kapıkulu Ocakları)'

    # --- 9. DÜNYA GÜCÜ OSMANLI (YÜKSELME / KLASİK ÇAĞ) ---
    if any(k in text for k in ['istanbul’un fethi', 'istanbulun fethi', 'fatih', 'ii. mehmed', 'otlukbeli', 'kanunname-i ali osman', 'kırım’ın fethi', 'akkoyunlu', 'uzun hasan', 'şahi', 'galata']):
        return 'Dünya Gücü Osmanlı', 'İstanbul\'un Fethi ve Fatih Sultan Mehmed Dönemi'
    if any(k in text for k in ['yavuz', 'i. selim', 'çaldıran', 'mercidabık', 'ridaniye', 'halifelik', 'turnadağ', 'cem sultan', 'ii. bayezid', 'safevi', 'şah ismail', 'memlük']):
        return 'Dünya Gücü Osmanlı', 'II. Bayezid ve Yavuz Sultan Selim (Doğu Siyaseti ve Halifelik)'
    if any(k in text for k in ['kanuni', 'süleyman', 'mohaç', 'belgrad', 'preveze', 'barbaros', 'hint deniz', 'i. viyana', 'rodos', 'kapitülasyon', 'cerbe']):
        return 'Dünya Gücü Osmanlı', 'Kanuni Sultan Süleyman Dönemi, Mohaç ve Denizler'
    if any(k in text for k in ['divan-ı hümayun', 'sadrazam', 'şeyhülislam', 'nişancı', 'defterdar', 'kazasker', 'reisülküttab', 'enderun', 'birun', 'harem', 'sancak sistemi', 'beylerbeyi']):
        return 'Dünya Gücü Osmanlı', 'Osmanlı Merkez ve Taşra Yönetimi (Divan ve Saray)'
    if any(k in text for k in ['lonca', 'narh', 'millet sistemi', 'vakıf', 'ilmiye', 'seyfiye', 'kalemiye', 'reaya', 'sufi', 'ahilik', 'medrese', 'mimar sinan']):
        return 'Dünya Gücü Osmanlı', 'Osmanlı Toplum Yapısı, Millet Sistemi ve Vakıflar'

    # --- 10. DEĞİŞEN DÜNYA DENGELERİ (17. VE 18. YÜZYIL) ---
    if any(k in text for k in ['zitvatorok', 'kasr-ı şirin', 'ferhat paşa', 'nasuh paşa', 'hotin', 'bucaş', 'ii. viyana', 'karlofça', 'kutsal ittifak', 'bahçesaray', 'çehrin']):
        return 'Değişen Dünya Dengeleri', '17. Yüzyıl Savaşları ve Antlaşmaları (Karlofça, Kasr-ı Şirin)'
    if any(k in text for k in ['celali', 'genç osman', 'iv. murad', 'köprülü', 'tarhuncu', 'koçi bey', 'katip çelebi', 'kuyucu murad', 'canbolatoğlu', 'karayazıcı']):
        return 'Değişen Dünya Dengeleri', '17. Yüzyıl İç İsyanları ve Islahatçıları'
    if any(k in text for k in ['coğrafi keşif', 'rönesans', 'reform', 'luther', 'westphalia', 'aydınlanma', 'merkantilizm', 'protestan', 'newton', 'kopernik', 'galileo', 'hümanizm']):
        return 'Değişen Dünya Dengeleri', 'Avrupa\'daki Gelişmeler (Keşifler, Rönesans, Reform, Aydınlanma)'
    if any(k in text for k in ['pasarofça', 'belgrad antlaşması', 'küçük kaynarca', 'yaş antlaşması', 'prut', 'kırım’ın', 'kırım hanlığı', 'girit']):
        return 'Değişen Dünya Dengeleri', '18. Yüzyıl Siyaseti ve Antlaşmalar (Küçük Kaynarca, Pasarofça)'
    if any(k in text for k in ['lale devri', 'ibrahim müteferrika', 'matbaa', 'iii. ahmed', 'nevşehirli', 'iii. selim', 'nizam-ı cedit', 'irad-ı cedit', 'humbaracı', 'hendesehane', 'tulumbacılar']):
        return 'Değişen Dünya Dengeleri', '18. Yüzyıl Islahatları, Lale Devri ve Nizam-ı Cedit'

    # --- 11. EN UZUN YÜZYIL (19. YÜZYIL VE DAĞILMA) ---
    if any(k in text for k in ['sened-i ittifak', 'ii. mahmud', 'vaka-i hayriye', 'asakir-i mansure', 'takvim-i vekayi', 'muhtarlık', 'sekban-ı cedit', 'divan-ı ahkam']):
        return 'En Uzun Yüzyıl (19. Yüzyıl)', 'Sened-i İttifak ve II. Mahmud Dönemi Islahatları'
    if any(k in text for k in ['tanzimat', 'ıslahat fermanı', 'gülhane', 'mustafa reşit', 'kırım savaşı', 'paris antlaşması', 'halepa', 'vilayet nizamnamesi']):
        return 'En Uzun Yüzyıl (19. Yüzyıl)', 'Tanzimat ve Islahat Fermanları Dönemi'
    if any(k in text for k in ['meşrutiyet', 'kanun-i esasi', 'ii. abdülhamid', 'mithat paşa', 'genç osmanlılar', 'ittihat ve terakki', '31 mart', 'meclis-i mebusan', 'duyun-ı umumiye', 'babıali baskını']):
        return 'En Uzun Yüzyıl (19. Yüzyıl)', 'I. ve II. Meşrutiyet Dönemi ve Kanun-i Esasi'
    if any(k in text for k in ['osmanlıcılık', 'islamcılık', 'türkçülük', 'batıcılık', 'yusuf akçura', 'ziya gökalp', 'namık kemal', 'üç tarz-ı siyaset', 'mehmet akif']):
        return 'En Uzun Yüzyıl (19. Yüzyıl)', 'Dağılmayı Önleme Çabaları ve Fikir Akımları'
    if any(k in text for k in ['baltalimanı', 'düyun-ı umumiye', 'dış borç', 'hicaz demiryolu', 'süveyş', 'sanayi inkılabı', 'muharrem kararnamesi']):
        return 'En Uzun Yüzyıl (19. Yüzyıl)', '19. Yüzyıl Ekonomisi, Düyun-ı Umumiye ve Demiryolları'
    if any(k in text for k in ['93 harbi', 'berlin antlaşması', 'ayastefanos', 'plevne', 'trablusgarp', 'uşi', 'balkan savaşı', 'londra antlaşması', 'bab-ı ali baskını', 'gazi osman paşa']):
        return 'En Uzun Yüzyıl (19. Yüzyıl)', '19. ve 20. Yüzyıl Savaşları (93 Harbi, Trablusgarp, Balkan)'
    if any(k in text for k in ['fransız ihtilali', 'milliyetçilik', 'sırp isyanı', 'yunan isyanı', 'edirne antlaşması', 'mısır meselesi', 'mehmet ali paşa', 'hünkar iskelesi', 'boğazlar sözleşmesi']):
        return 'En Uzun Yüzyıl (19. Yüzyıl)', 'Milliyetçilik İsyanları, Boğazlar ve Şark Meselesi'

    # Fallbacks per course
    defaults = {
        'TARİH – 1': ('İlk Çağ Medeniyetleri', 'İlk Çağ Medeniyetleri ve Kültürü'),
        'TARİH – 2': ('İlk ve Orta Çağlarda Türk Dünyası', 'İlk Türk Devletleri ve Teşkilatı'),
        'TARİH – 3': ('Selçuklu ve Anadolu Beylikleri', 'Selçuklu ve Beylikler Dönemi'),
        'TARİH – 4': ('Dünya Gücü Osmanlı', 'Klasik Dönem Osmanlı Siyaseti ve Teşkilatı'),
        'TARİH – 5': ('Değişen Dünya Dengeleri', '17. ve 18. Yüzyıl Osmanlı ve Dünya Siyaseti'),
        'TARİH – 6': ('En Uzun Yüzyıl (19. Yüzyıl)', '19. Yüzyıl Islahatları ve Siyasi Gelişmeler')
    }
    return defaults.get(ders, ('Genel Tarih', 'Tarihsel Gelişmeler'))

# Load questions
with open('ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
    all_qs = json.load(f)

tarih_qs = [q for q in all_qs if q['ders'].startswith('TARİH – ')]
print(f'İşlenecek Tarih Soru Sayısı: {len(tarih_qs)}')

analyzed_tarih = []
for q in tarih_qs:
    ana_konu, alt_konu = classify_tarih(q)
    soru_temiz = clean_text(q['soru'])
    secenekler_temiz = {}
    for k, v in q.get('secenekler', {}).items():
        secenekler_temiz[k] = clean_text(v)
    
    analyzed_tarih.append({
        'id': q['id'],
        'ders': q['ders'],
        'ders_kodu': q.get('ders_kodu', ''),
        'yil': q['yil'],
        'donem': str(q['donem']),
        'soru_no': q['soru_no'],
        'soru_temiz': soru_temiz,
        'secenekler_temiz': secenekler_temiz,
        'dogru_cevap': q.get('dogru_cevap', ''),
        'ana_konu': ana_konu,
        'alt_konu': alt_konu
    })

# Save Tarih analyzed
with open('ciktilar/analiz/tarih_analizli_sorular_temiz.json', 'w', encoding='utf-8') as f:
    json.dump(analyzed_tarih, f, ensure_ascii=False, indent=2)

print('✅ ciktilar/analiz/tarih_analizli_sorular_temiz.json kaydedildi!')

# Check subtopic counts & cross-course intersections
from collections import defaultdict
sub_courses = defaultdict(set)
sub_counts = defaultdict(int)
for q in analyzed_tarih:
    sub = q['alt_konu']
    sub_courses[sub].add(q['ders'])
    sub_counts[sub] += 1

print(f'\nFarklı Alt Konu Sayısı: {len(sub_courses)}')
multi_courses = {s: cs for s, cs in sub_courses.items() if len(cs) > 1}
print(f'Birden Fazla Kademede Kesişen Alt Konu Sayısı: {len(multi_courses)}')
for s, cs in sorted(multi_courses.items(), key=lambda x: (len(x[1]), sub_counts[x[0]]), reverse=True):
    short_cs = [c.replace('TARİH – ', 'T-') for c in sorted(cs)]
    print(f'  ⚡ {s} -> {len(cs)} Derste Kesişiyor ({sub_counts[s]} Soru) -> {short_cs}')
