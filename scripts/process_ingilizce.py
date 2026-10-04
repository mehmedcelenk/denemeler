#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_ingilizce.py
İNGİLİZCE (1 - 8) Zorunlu Ortak Kültür Dersi Gelişmiş Analiz ve Temizleme Motoru
- Kapsam: İNGİLİZCE – 1'den 8'e kadar (656 soru, her kademede 82 soru)
- MEB Ortaöğretim İngilizce Müfredatı (A1-B2 kazanımları, tematik kelime ve dilbilgisi fonksiyonları).
- Çöp sepeti fallback'i kaldırıldı; 30'a yakın gerçek müfredat konusu tanımlandı.
- Eşleşmeyen az sayıdaki soru dürüstçe 'Genel - Konu Saptanamadı' kategorisinde tutulur.
"""

import json
import re
from collections import defaultdict, Counter

def clean_english_text(text):
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r'[ \t]+', ' ', t)
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    cleaned = '\n'.join(lines)
    return cleaned

def clean_english_options(secenekler):
    cleaned = {}
    for k in ['A', 'B', 'C', 'D']:
        val = secenekler.get(k, '')
        if isinstance(val, str):
            v = val.strip()
            v = re.sub(r'\s+', ' ', v)
            cleaned[k] = v
        else:
            cleaned[k] = str(val)
    return cleaned

def classify_english(soru_text, secenekler, ders):
    stem = soru_text or ''
    opt_vals = [str(v).strip() for v in secenekler.values()] if isinstance(secenekler, dict) else []

    # OCR boşluk düzeltmeleri (örn: 'c an i' -> 'can i', 'w hat' -> 'what', 'h ow' -> 'how')
    norm_stem = re.sub(r'\bc\s+an\b', 'can', stem, flags=re.IGNORECASE)
    norm_stem = re.sub(r'\bw\s+hat\b', 'what', norm_stem, flags=re.IGNORECASE)
    norm_stem = re.sub(r'\bw\s+here\b', 'where', norm_stem, flags=re.IGNORECASE)
    norm_stem = re.sub(r'\bt\s+ake\b', 'take', norm_stem, flags=re.IGNORECASE)
    norm_stem = re.sub(r'\bh\s+ow\b', 'how', norm_stem, flags=re.IGNORECASE)
    norm_stem = re.sub(r'\bh\s+ello\b', 'hello', norm_stem, flags=re.IGNORECASE)

    # Satır sonlarını boşluğa dönüştürerek kalıp eşleşmelerini yakala (örn: "best\nfriend" -> "best friend")
    full = re.sub(r'\s+', ' ', norm_stem + ' ' + ' '.join(opt_vals)).lower().replace("’", "'").replace("`", "'")
    t = full
    t_stem = re.sub(r'\s+', ' ', stem).lower().replace("’", "'").replace("`", "'")
    clean_opts = {re.sub(r'[^a-zA-Z\s]', '', v).strip().lower() for v in opt_vals}

    # 1. OKUDUĞUNU ANLAMA, PARAGRAF & TABLO/KART İNCELEME (Reading Comprehension)
    if any(k in t_stem for k in [
        'bu metne göre', 'bu parçaya göre', 'bu parçada aşağıdaki', 'metinde aşağıdaki',
        'hangisinin cevabı vardır', 'hangisinin cevabı yoktur', 'metne göre',
        'according to the text', 'according to the passage',
        'which of the following is correct according to', 'bu metinde hakkında bilgi verilen',
        'bu diyaloğa göre', 'parçaya göre', 'metne göre hangi', 'bu konuşmaya göre',
        'which question does not have an answer in the text', 'bu tabloya göre',
        'bu metinde mike', 'jack brown cv', 'dear sally, you are invited',
        'marie and pierre curie', 'sally ride was really interested in space',
        'have a cat, fluffy', 'works at a pharmacy'
    ]) or (len(stem.split('\n')) >= 4 and any(w in t_stem for w in ['according', 'text', 'passage', 'following'])):
        return ('Okuduğunu Anlama & Paragraf', 'Reading Comprehension (Paragrafta Anlam & Metin İnceleme)')

    # 2. ŞART CÜMLELERİ & DİLEKLER (Conditionals & Wish Clauses)
    if any(k in t for k in ['wish', 'if only', 'third conditional']):
        return ('Grammar & Structures', 'Conditionals & Wish Clauses (If Clauses & I Wish)')
    if re.search(r'\bif\b', t) and any(w in t for w in ['will', 'would', 'can', 'could', 'should', 'had', 'were', "don't", "doesn't", 'consume', 'study', 'rains', 'stop', 'want', 'eat', 'sleep']):
        return ('Grammar & Structures', 'Conditionals & Wish Clauses (If Clauses & I Wish)')

    # 3. AKTARMALI ANLATIM (Reported Speech - Direct & Indirect Speech)
    if any(k in t for k in ['says that', 'said that', 'told me that', 'asked me if', 'told that', 'asked whether']):
        return ('Grammar & Structures', 'Reported Speech (Direct & Indirect Speech)')

    # 4. KARŞILAŞTIRMA & ÜSTÜNLÜK (Comparatives & Superlatives)
    if re.search(r'\bthan\b', t) or re.search(r'\bthe\s+\w+(?:est|iest)\b', t) or any(k in t for k in [
        'more expensive', 'more popular', 'as tall as', 'as good as', 'comparative', 'superlative',
        'the most', 'the best', 'the worst', 'colder', 'larger', 'hotter', 'easier', 'faster', 'cleaner',
        "book i've ever read", "museum i've ever visited", "the - - - - book", "the - - - - museum"
    ]):
        return ('Grammar & Structures', 'Comparatives & Superlatives (More, -er than, The Most, As...as)')

    # 5. EDİLGEN ÇATI (Passive Voice)
    passive_verbs = [
        'was completed', 'is completed', 'were completed', 'was built', 'were built',
        'is produced', 'are produced', 'was discovered', 'were invented', 'is celebrated',
        'was written', 'is considered', 'was established', 'are consumed', 'is made of',
        'were awarded', 'was repaired', 'were caught', 'are caught', 'is visited',
        'are visited', 'are given', 'is given', 'was found', 'is found', 'are served',
        'is served', 'are watched', 'is provided by', 'was abandoned'
    ]
    if 'edilgen' in t or any(k in t for k in passive_verbs) or ('is' in clean_opts and 'was completed' in clean_opts) or ('was built' in clean_opts):
        return ('Grammar & Structures', 'Passive Voice (Present & Past Passive)')
    if re.search(r'\b(?:is|are|was|were)\s+(?:used|eaten|cooked|cleaned|held|celebrated|seen|made)\b', t) and any(w in t for w in ['in abundance', 'every year', 'by the', 'during']):
        return ('Grammar & Structures', 'Passive Voice (Present & Past Passive)')

    # 6. SIFAT CÜMLECİKLERİ & İLGİ ZAMİRLERİ (Relative Clauses)
    rel_words = {'who', 'which', 'that', 'where', 'whose', 'whom'}
    if len(clean_opts.intersection(rel_words)) >= 3 or any(k in t for k in ['someone who', 'a person who', 'the car which', 'whose car', 'the place where', 'who motivates', 'a friend who']):
        return ('Grammar & Structures', 'Relative Clauses (Who, Which, That, Where, Whose)')

    # 7. BAĞLAÇLAR & CÜMLE GEÇİŞLERİ (Conjunctions & Connectors)
    connector_words = {'because', 'although', 'even though', 'though', 'therefore', 'however', 'since', 'so', 'otherwise', 'moreover', 'furthermore', 'as a result', 'in addition', 'but', 'whereas', 'finally', 'then'}
    if len(clean_opts.intersection(connector_words)) >= 2 or any(k in clean_opts for k in ['however', 'therefore', 'in spite of', 'as a result', 'moreover', 'otherwise']):
        return ('Grammar & Structures', 'Conjunctions & Connectors (Because, Although, Therefore, Since, However)')
    if re.search(r'\bneither\b.*\bnor\b', t) or re.search(r'\beither\b.*\bor\b', t) or re.search(r'\bboth\b.*\band\b', t) or any(k in t for k in ['not only', 'either / or', 'neither / nor', 'both / and']):
        return ('Grammar & Structures', 'Conjunctions & Connectors (Because, Although, Therefore, Since, However)')
    if any(k in clean_opts for k in ['either', 'neither']) and any(w in t for w in [' or ', ' nor ', 'coffee or tea', 'deserve inequality']):
        return ('Grammar & Structures', 'Conjunctions & Connectors (Because, Although, Therefore, Since, However)')
    if any(k in t for k in ['because of', 'as a result of', 'due to', 'in spite of', 'despite']) and any(c in t for c in ['rain', 'traffic', 'weather', 'heavy', 'illness', 'stop']):
        return ('Grammar & Structures', 'Conjunctions & Connectors (Because, Although, Therefore, Since, However)')
    if 'first,' in t and 'then,' in t and ('finally' in t or 'after that' in t):
        return ('Grammar & Structures', 'Conjunctions & Connectors (Because, Although, Therefore, Since, However)')

    # 8. ZAMAN BAĞLAÇLARI & OLAY SIRALAMASI (When, While, Before, After)
    if any(k in t for k in [
        'while i was', 'while he was', 'while she was', 'while they were', 'while we were',
        'while crossing', 'while drinking', 'while walking', 'while taking', 'while diving',
        'when i arrived', 'when he came', 'when they found', 'as soon as', 'by the time',
        'before he went', 'after she had', 'after i had', 'when jack went', 'when you see',
        'when i checked', 'when i called', 'when my grandfather', 'out of petrol', 'when the rescuers',
        'rescuers found', 'relieved when they'
    ]) or (re.search(r'\bwhile\b', t) and any(w in t for w in ['was', 'were', 'fell asleep', 'attacked', 'street', 'biscuits', 'dishes', 'gave me', 'listening', 'walk'])):
        return ('Grammar & Structures', 'Time Clauses & Sequencing (When, While, As soon as, Before, After)')

    # 9. KİPLİKLER, TAVSİYE & ZORUNLULUK (Modals - Should, Must, Have to, Needn't, Deduction)
    modal_tokens = {'should', 'must', "mustn't", 'mustn’t', 'have to', "don't have to", 'don’t have to', 'has to', "doesn't have to", 'had better', 'ought to', 'can’t have', 'must have', 'might have', 'could have', 'might', 'could', 'would'}
    if len(clean_opts.intersection(modal_tokens)) >= 2:
        return ('Grammar & Structures', 'Modals & Advice (Should, Must, Have to, Needn’t, Deduction)')
    if re.search(r'\b(?:must|might|should|could)\s+have\b', t) or re.search(r'\bhad\s+better\b', t) or 'have died' in t:
        return ('Grammar & Structures', 'Modals & Advice (Should, Must, Have to, Needn’t, Deduction)')
    if any(k in t for k in [
        'you should', "you shouldn't", 'you shouldn’t', 'must obey', "mustn't", 'mustn’t',
        'have to wear', "don't have to", 'must have been', 'must have studied', 'can’t have',
        'might have died', 'might have gone', 'must call 112', 'had better', 'should have', 'have died'
    ]):
        return ('Grammar & Structures', 'Modals & Advice (Should, Must, Have to, Needn’t, Deduction)')

    # 10. ÖNERİLER, DAVETLER & TEKLİFLER (Suggestions & Offers - How about, Let's, Would you like)
    if any(k in t for k in [
        'how about', 'what about', "let's", 'let’s', 'lets ', "why don't we", "why don't you",
        "why dont we", "why dont you", 'why not', 'shall we', 'would you like', 'it sounds great',
        "it isn't my thing", "i'd love to", 'i’d love to', "i am afraid i can't", 'can we meet',
        'how do you feel about', 'accepting', 'refusing', 'invitation'
    ]):
        return ('Everyday Functions & Communication', 'Offers, Invitations & Suggestions (How about, Let’s, Would you like)')

    # 11. İSTEKLER, İZİN & RİCA (Requests & Asking for Permission - Can I, Could you, May I)
    if any(k in t for k in [
        'can i have', 'can i use', 'could you please', 'would you mind', 'do you mind if', 'may i help',
        'is it ok if', 'can i watch', 'can i borrow', 'can you help', 'could you tell me',
        'can you lift', 'may i come', 'asking for direction', 'how can i get to', 'could you give me',
        'how long did the process take', 'about 60 days'
    ]):
        return ('Everyday Functions & Communication', 'Requests & Asking for Permission (Can, Could, Would, May)')

    # 12. GÖRÜŞLER, DUYGULAR & ÖZÜR (Opinions, Feelings, Apologies & Regrets)
    if any(k in t for k in [
        'what do you think', 'in my opinion', 'i think', 'i believe', 'i agree', "i don't agree",
        'i don’t agree', 'i am terribly sorry', "i didn't mean to", 'apologize', 'expresses her regret',
        'you look worried', 'you look frightened', 'you look happy', 'you look ill', 'stay in bed',
        "what's the matter", "what is the matter", "what's wrong with you", 'feel angry', 'feel lonely',
        'feel depressed', 'feel exhausted', 'feeling blue', 'going to pieces', 'jumping for joy',
        'feel stressed', 'calms me down', 'dislike', 'find it annoying', 'sounds boring', 'proud of',
        'disappointed', 'hate drinking', 'hate doing', 'disagree', 'there is no doubt about it',
        "i'd say exactly the same", 'i’d say exactly the same', 'why do we need emotions'
    ]):
        return ('Everyday Functions & Communication', 'Expressing Opinions, Feelings & Apologies')

    # 13. SIKLIK ZARFLARI & GÜNLÜK RUTİNLER (Adverbs of Frequency & Routines)
    freq_words = {'always', 'usually', 'often', 'sometimes', 'rarely', 'seldom', 'never', 'hardly ever'}
    if clean_opts.intersection(freq_words) and len(clean_opts.intersection(freq_words)) >= 2:
        return ('Tenses & Time Expressions', 'Adverbs of Frequency & Daily Routines (Always, Usually, Rarely, Never)')
    if any(k in t for k in [
        'how often', 'every morning', 'every day', 'at weekends', 'once a week', 'twice a day', 'on saturdays',
        'what time', 'twenty past', 'wake up', 'walk to school', 'have for breakfast'
    ]):
        return ('Tenses & Time Expressions', 'Adverbs of Frequency & Daily Routines (Always, Usually, Rarely, Never)')

    # 14. GEÇMİŞ ZAMAN & USED TO (Past Tenses & Used To)
    if any(k in t for k in [
        'use to', 'used to', 'when you were a child', 'when i was a child', 'when my grandfather was a child',
        'when he was a child', 'when he was young', 'when she was young', 'in the past, it', 'in the past, planes',
        'in the past, people', 'had finished my work', 'before he visited london', 'after i had listened',
        'had never met', 'stole all the money', 'slipped out of the bank', 'when you were 17 years old',
        'left the work early yesterday', 'lived in istanbul when he was', 'yesterday morning', 'last weekend',
        'two weeks ago', 'did you visit', 'did you go', 'had already slept', 'had already finished',
        'had never seen', 'left the house at 9', 'where did you grow up', 'had called', 'in 1953', 'during 1990'
    ]) or re.search(r'\blast\s+(?:night|year|month|summer|week)\b', t) or re.search(r'\bhadn\'?t\s+\w+\b', t) or re.search(r'\bhad\s+been\s+hungry\b', t):
        return ('Tenses & Time Expressions', 'Past Tenses (Simple Past, Past Continuous, Past Perfect) & Used To')

    # 15. GELECEK ZAMAN & PLANLAR (Future Forms & Predictions)
    if any(k in t for k in [
        'will happen', 'will win', 'will live', 'will help', 'will answer', 'will do',
        'is going to attend', 'am going to cook', 'am going to have a rest', 'going to go to the theme park',
        'are going to travel', 'is going to buy', 'is going to focus', 'in the future',
        'tomorrow morning', 'tomorrow', 'next year', 'next saturday', 'next sunday', 'next weekend',
        'next century', 'in the year 2050', 'make prediction', 'probably will', 'plans for summer', "won't be able to"
    ]) or re.search(r'\b(?:am|is|are)\s+going\s+to\b', t) or re.search(r'\bplan for the (?:dinner|next weekend|weekend)\b', t) or re.search(r'\bwill\s+[\w\s]+tomorrow\b', t):
        return ('Tenses & Time Expressions', 'Future Forms (Will, Be Going To) & Predictions')

    # 16. ŞİMDİKİ ZAMAN, GENİŞ ZAMAN & PRESENT PERFECT
    if any(k in t for k in [
        'am studying', 'is studying', 'are studying', 'at the moment', 'right now', 'currently',
        'is reading', 'are watching', 'what are you doing', 'what do you do', 'does she live',
        'so far', 'how long have you lived', 'how long have you been', 'since 2010', 'for 5 years'
    ]):
        return ('Tenses & Time Expressions', 'Present Tenses (Simple Present & Continuous) & Daily Routines')

    # 17. ÇEVRE, DOĞA, İKLİM & ENERJİ (Environment, Climate & Nature)
    if any(k in t for k in [
        'environment', 'climate change', 'global warming', 'solar energy', 'renewable energy',
        'renewable resources', 'geothermal energy', 'recycle', 'pollution', 'pollutes', 'polluting',
        'contaminate', 'contamination', 'natural resources', 'extinction', 'endangered',
        'greenhouse effect', 'plant trees', 'save water', 'litter', 'garbage', 'cut down trees',
        'clean and safe drinking water', 'protect nature', 'fossil fuel', 'earth heat', 'air pollution',
        'water pollution', 'solar power', 'habitats', 'penguins', 'rainforests', 'energy is provided by the sun', 'save the world',
        'planting lots of trees', 'fresh air and a clean nature'
    ]):
        return ('Thematic Vocabulary & Life', 'Environment, Nature, Climate & Renewable Energy')

    # 18. TEKNOLOJİ, İNTERNET & SOSYAL MEDYA (Technology & Social Media)
    if any(k in t for k in [
        'social media', 'virtual reality', 'drone camera', 'smartphone', 'technological devices',
        'keep in touch', 'internet connection', 'download', 'upload', 'password', 'online shopping',
        'screen time', 'artificial intelligence', 'robotics', 'send e-mail', 'battery is dead',
        'face to face communication', 'charger', 'text message', 'mobile phone', 'electronic device',
        'on the net', 'online games', 'go online', 'cybercrime', 'cyberbullying', 'stalking', 'social networking'
    ]):
        return ('Thematic Vocabulary & Life', 'Technology, Social Media & Digital Communication')

    # 19. MESLEKLER, İŞ & KARİYER (Jobs, Career & Work)
    if any(k in t for k in [
        'job interview', 'future career', 'curriculum vitae', 'work experience', 'ambitious',
        'architect', 'engineer', 'technician', 'lawyer', 'salary', 'qualification', 'apply for a job',
        'job advertisement', 'boss', 'employee', 'hire', 'profession', 'occupation', 'become an astronaut',
        'competitive', 'pessimistic'
    ]):
        return ('Thematic Vocabulary & Life', 'Jobs, Occupations, Career Goals & Work')

    # 20. SEYAHAT, TURİZM, ULAŞIM & TATİL (Travel & Holidays)
    if any(k in t for k in [
        'hotel', 'ancient site', 'archaeological site', 'sightseeing', 'book a ticket', 'flight ticket',
        'luggage', 'tourist attraction', 'souvenir', 'historical monument', 'travel agency', 'passport',
        'transportation', 'catch a flight', 'airport', 'holiday in', 'vacation', 'travel abroad',
        'trip to', 'visiting historical places', 'chichen itza', 'by plane', 'where is rize located',
        'butterfly valley', 'salonica', 'where does the tea festival take place', 'cunda island',
        'haydarpaşa', 'topkapı palace', 'minivans', 'how long is the trip', 'famous for big ben', 'famous for',
        'stay here? lily : by tram', 'stay here', 'when is the museum open', 'between 10:00 and 18:00',
        'get lost on the trip', 'big ben', 'buckingham palace', 'victoria museum', 'salty lake'
    ]):
        return ('Thematic Vocabulary & Life', 'Travel, Tourism, Transportation & Holidays')

    # 21. YEMEK, MUTFAK, ALIŞVERİŞ & EV YAŞAMI (Food, Shopping & Household)
    if any(k in t for k in [
        'recipe', 'ingredients', 'delicious', 'traditional dish', 'traditional food', 'cuisine', 'bake',
        'boil', 'fry', 'slice', 'spoon of sugar', 'roast chicken', 'dessert', 'stuffed dolma', 'baklava',
        'beef stew', 'serve kebab', 'spinach', 'vegetarian dishes', 'restaurant', 'waiter', 'waitress',
        'order food', 'menu', 'shopping list', 'market to buy some food', 'sales slip', 'eating out',
        'cup of coffee', 'furniture', 'appliances', 'wooden houses', 'opposite the toilet', 'clean the table',
        'mop the floor', 'trash out', 'sweater', 'shop assistant', 'size do you need', '99 tl', 'suit',
        'junk or frozen food', 'unhealthy lifestyles', 'what do people eat'
    ]):
        return ('Thematic Vocabulary & Life', 'Food, Cooking, Shopping & Restaurant')

    # 22. SPORLAR, HOBİLER, MÜZİK & SİNEMA (Sports, Hobbies, Music & Movies)
    if any(k in t for k in [
        'extreme sport', 'scuba diving', 'bungee jumping', 'paragliding', 'rock climbing',
        'free climbing', 'wingsuit flying', 'listen to music', 'play guitar', 'theatre',
        'cinema', 'martial arts', 'leisure time', 'favorite sport', 'rap music', 'mountain climbing',
        'playing chess', 'board games', 'good at fixing', 'afraid of being under water', 'play the piano',
        'draw a picture', 'reading books', 'gardening', 'knitting', 'cliff diving', 'water sports',
        'film genre', 'music genre', 'folk music', 'country music', 'smooth jazz', 'rock and jazz',
        "i'd rather", 'pastime', 'fond of planting', 'favourite film', 'favourite singer', 'the piano',
        'collecting hats', 'classical music', 'horror films', 'romantic comedy', 'favourite pastime',
        'fond of', 'science fiction films', 'space exploration', 'photography', 'taking photos', 'hobby',
        'storytelling more interactive', '3d films', 'biographical films',
        'going trekking', 'guitar lessons', 'quiz shows', 'soap operas'
    ]) or re.search(r'\bprefer listening to\b', t) or re.search(r'\bwhat kind of programmes do you watch\b', t):
        return ('Thematic Vocabulary & Life', 'Hobbies, Sports, Music & Adventure Activities')

    # 23. SAĞLIK, HASTALIKLAR & İLK YARDIM (Health & First Aid)
    if any(k in t for k in [
        'have got a flu', 'have got a headache', 'stomachache', 'cough', 'fever', 'see a doctor',
        'prescribe medicine', 'hospital', 'ambulance', 'healthy diet', 'emergency', 'safety rules',
        'first aid', 'hurt your leg', 'broken arm', 'painkiller', 'call 112', 'survival kit',
        'pain in my throat', 'swallow'
    ]):
        return ('Thematic Vocabulary & Life', 'Health, Illnesses, First Aid & Safety')

    # 24. KUTLAMALAR, PARTİLER & ÖZEL GÜNLER (Celebrations & Parties)
    if any(k in t for k in [
        'housewarming party', 'birthday party', 'wedding ceremony', 'graduation party',
        'baby shower', 'celebrate', 'costume party', 'send invitation', 'celebrate christmas',
        'house-warming party', 'festival'
    ]):
        return ('Thematic Vocabulary & Life', 'Parties, Celebrations & Special Days')

    # 25. DOSTLUK, KİŞİLİK & SOSYAL İLİŞKİLER (Friendship & Personality)
    if any(k in t for k in [
        'get on well with', 'true friend', 'best friend', 'count on', 'depend on', 'trustworthy',
        'tell lies', 'tells lies', 'tell the truth', 'honest', 'generous', 'selfish', 'stubborn',
        'have an argument', 'plays tricks', 'keep a secret', 'deceives', 'points me to the right',
        'back up', 'support each other', 'good relationship', 'patient person', 'optimistic', 'good manners',
        'look like', "what's your new coach like", "what is your new coach like", 'facial features',
        'tall and slim', 'tall and fit', 'shiny black feathers', 'appearance', 'what does your',
        'what kind of a person', 'friends with alice', "what is your sister like", "sister's personality",
        "sister’s personality"
    ]):
        return ('Thematic Vocabulary & Life', 'Friendship, Relationships & Personality Traits')

    # 26. İNSAN HAKLARI & TOPLUMSAL KONULAR (Human Rights & Social Issues)
    if any(k in t for k in [
        'human rights', 'animal rights', 'wheelchair ramp', 'disabled people', 'handicapped',
        'refugee', 'homeless', 'illiterate', 'gender equality', 'equal rights', 'illegal',
        'discrimination', 'charity', 'donate', 'volunteer', 'social responsibility',
        'equality', 'inequality', 'values and norms', 'right to', 'respecting older'
    ]):
        return ('Thematic Vocabulary & Life', 'Human Rights, Social Issues & Community Help')

    # 27. EĞİTİM, OKUL, DERSLER & DİL ÖĞRENİMİ (Education & School Life)
    if any(k in t for k in [
        'spanish course', 'speak a foreign language', 'study for my exam', 'study for our exam',
        'high school', 'graduation', 'failed the exam', 'pass the exam', 'dictionary',
        'scholarship', 'homework', 'teacher', 'student'
    ]):
        return ('Thematic Vocabulary & Life', 'Education, School, Exams & Language Learning')

    # 28. KIYAFET, MODA, MEVSİMLER & HAVA DURUMU (Clothes, Seasons & Weather)
    if any(k in t for k in [
        'season of the year', 'winter', 'summer', 'autumn', 'spring', 'fashionable clothes',
        'wear clothes', 'buy new clothes', 'rainy', 'sunny', 'weather in', 'western-style clothes',
        'the weather is', 'too cold'
    ]):
        return ('Thematic Vocabulary & Life', 'Seasons, Weather, Clothes & Fashion')

    # 29. YETENEKLER & BECERİLER (Abilities - Can / Can't & Good at / Bad at)
    if any(k in t for k in ['can’t speak', 'can speak', 'can’t swim', 'can swim', 'good at', 'bad at', 'drawing pictures and i', 'gifted in it', 'talented']):
        return ('Grammar & Structures', 'Abilities & Skills (Can, Can’t, Good at, Bad at)')

    # 30. SAHİPLİK, ZAMİRLER & NESNELER (Possessives, Pronouns & Everyday Objects)
    if any(k in t for k in ['is this your', 'the book is mine', 'my book is', 'belong to', 'whose is this']):
        return ('Grammar & Structures', 'Possessives & Pronouns (Mine, Yours, My, His, Her)')

    # 31. ÜLKELER, DİLLER & MİLLETLER (Countries, Nationalities & Personal Info)
    if any(k in t for k in [
        'where are you from', 'i am from', 'nationality', 'languages do you speak', 'what is your nationality',
        'official language', 'languages can you speak', 'sanchez', 'in england', "i'm spanish", 'i’m spanish'
    ]):
        return ('Everyday Functions & Communication', 'Countries, Nationalities & Personal Identification')

    # 32. Fallback: GENEL - KONU SAPTANAMADI
    return ('Genel Dil Becerileri', 'Genel - Konu Saptanamadı')

def main():
    print("=" * 60)
    print("🇬🇧 İNGİLİZCE (İngilizce 1 - 8) TAM KAPSAMLI ANALİZ MOTORU")
    print("=" * 60)

    with open('scripts/ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
        all_raw = json.load(f)

    ing_raw = [q for q in all_raw if 'İNGİLİZCE' in q.get('ders', '').upper()]
    print(f"Toplam seçilen zorunlu İngilizce sorusu: {len(ing_raw)}")

    processed_questions = []
    course_counts = Counter()

    for q in ing_raw:
        qid = q['id']
        ders_std = q['ders'].strip()
        ders_std = re.sub(r'\s*[-–—]\s*', ' – ', ders_std)
        yil = q['yil']
        donem = q['donem']
        soru_no = q['soru_no']
        dogru_cevap = q['dogru_cevap'].strip().upper()

        course_counts[ders_std] += 1

        soru_temiz = clean_english_text(q.get('soru', ''))
        secenekler_temiz = clean_english_options(q.get('secenekler', {}))

        ana_konu, alt_konu = classify_english(soru_temiz, secenekler_temiz, ders_std)

        processed_questions.append({
            'id': qid,
            'ders': ders_std,
            'ders_kodu': q.get('ders_kodu', ''),
            'yil': yil,
            'donem': str(donem),
            'soru_no': soru_no,
            'soru_temiz': soru_temiz,
            'secenekler_temiz': secenekler_temiz,
            'dogru_cevap': dogru_cevap,
            'ana_konu': ana_konu,
            'alt_konu': alt_konu
        })

    print(f"Kademe Dağılımı: {dict(course_counts)}")

    # Kaydet
    out_path = 'scripts/ciktilar/analiz/ingilizce_analizli_sorular_temiz.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(processed_questions, f, ensure_ascii=False, indent=2)
    print(f"✅ {out_path} dosyasına {len(processed_questions)} temiz soru yazıldı.")

if __name__ == '__main__':
    main()
