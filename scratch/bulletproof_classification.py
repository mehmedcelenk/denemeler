import json

file_path = 'data/subjects/ING.json'
with open(file_path, 'r', encoding='utf-8') as f:
    questions = json.load(f)

def classify_bulletproof(q):
    soru = q.get('soru', '').strip()
    sec = q.get('secenekler', {})
    ans_key = q.get('dogru_cevap', '')
    ans = str(sec.get(ans_key, '')).strip()
    
    text = f"{soru} {ans}".lower()
    full_opts = ' '.join(str(v) for v in sec.values()).lower()
    ders = q.get('ders', '').strip()

    # 1. Reading Comprehension (Passages & Prompts)
    if len(soru) > 280 or 'bu cümlelere göre' in soru.lower() or 'paragrafa göre' in soru.lower() or 'metne göre' in soru.lower():
        return "Okuduğunu Anlama & Paragraf", "Reading Comprehension (Paragrafta Anlam & Metin İnceleme)"

    # 2. Countries & Nationalities / Where are you from
    if 'where are you from' in soru.lower() or any(w in ans.lower() for w in ['russia', 'german', 'french', 'japanese', 'spanish', 'turkey', 'italian', 'english', 'american', 'china', 'brazil']):
        return "Everyday Functions & Communication", "Countries, Nationalities & Personal Identification"

    # 3. Directions & Locations / How can I get to
    if any(w in soru.lower() for w in ['how can i get to', 'where is the salty lake', 'can you tell me how can i get']) or any(w in ans.lower() for w in ['take the first left', 'on your right', 'opposite the bank', 'next to the museum']):
        return "Everyday Functions & Communication", "Yön, Adres & Konum Sorma"

    # 4. Offers, Invitations & Suggestions
    if any(w in soru.lower() for w in ['would you like', 'let\'s go', 'why not', 'how about', 'shall we']) or any(w in ans.lower() for w in ['it sounds great', 'i am totally free', 'why not', 'i\'d love to']):
        return "Everyday Functions & Communication", "Offers, Invitations & Suggestions (How about, Let’s, Would you like)"

    # 5. Requests, Permission & Favors
    if any(w in soru.lower() for w in ['can i have', 'can you help', 'could you', 'would you mind', 'can i use']) or any(w in ans.lower() for w in ['here you are', 'sure', 'of course', 'no problem']):
        if 'free tables' in soru.lower() or 'order' in soru.lower():
            return "Thematic Vocabulary & Life", "Food, Cooking, Shopping & Restaurant"
        return "Everyday Functions & Communication", "Requests & Asking for Permission (Can, Could, Would, May)"

    # 6. Expressing Opinions, Preferences & Feelings
    if any(w in soru.lower() for w in ['what do you think', 'in your opinion', 'how do you feel', 'what is your opinion']):
        return "Everyday Functions & Communication", "Expressing Opinions, Feelings & Apologies"

    # 7. Conditionals & Wish Clauses
    if any(w in soru.lower() for w in ['if only', 'i wish']) or 'if only' in ans.lower() or 'if i had' in text or 'wouldn\'t have had' in text or 'if parents' in text or 'if it rains' in text:
        return "Grammar & Structures", "Conditionals & Wish Clauses (If Clauses & I Wish)"

    # 8. Passive Voice
    if any(w in ans.lower() for w in ['was built', 'is served', 'is provided', 'was provided', 'were built', 'can be produced', 'was constructed', 'is located']) or any(w in soru.lower() for w in ['was built', 'is served', 'is provided']):
        return "Grammar & Structures", "Passive Voice (Present & Past Passive)"

    # 9. Reported Speech
    if any(w in ans.lower() for w in ['said that', 'told me', 'doing skateboarding makes her happy']) or 'manager asked him questions' in soru.lower() or 'reported' in soru.lower():
        return "Grammar & Structures", "Reported Speech (Direct & Indirect Speech)"

    # 10. Relative Clauses
    if ans.lower() in ['who', 'which', 'where', 'whose', 'that'] or any(w in text for w in ['woman who lives', 'documentary which was', 'person who']):
        return "Grammar & Structures", "Relative Clauses (Who, Which, That, Where, Whose)"

    # 11. Past Modals of Deduction
    if any(w in ans.lower() for w in ['must have been', 'could have been', 'might have been', 'can\'t have']):
        return "Grammar & Structures", "Past Modals of Deduction (Must/Can't/Might have V3)"

    # 12. Modals & Advice
    if ans.lower() in ['should', 'must', 'have to', 'needn\'t', 'ought to', 'had better'] or any(w in ans.lower() for w in ['should drink', 'must call', 'needn\'t worry', 'have to wear']):
        return "Grammar & Structures", "Modals & Advice (Should, Must, Have to, Needn’t, Deduction)"

    # 13. Comparatives & Superlatives
    if any(w in ans.lower() for w in ['larger', 'more carefully', 'cleaner', 'colder', 'faster', 'most popular', 'bravest', 'most famous', 'the most', 'as...as']) or 'than' in text:
        return "Grammar & Structures", "Comparatives & Superlatives (More, -er than, The Most, As...as)"

    # 14. Time Clauses (When / While / As Soon As / Before / After)
    if 'while' in soru.lower() or 'when i came home' in soru.lower() or 'when bob was driving' in soru.lower() or 'when jack went' in soru.lower():
        if any(w in ans.lower() for w in ['was eating', 'were listening', 'ran out', 'had called', 'slept']):
            return "Grammar & Structures", "Time Clauses & Sequencing (When, While, As soon as, Before, After)"

    # 15. Past Tenses & Used To
    if any(w in ans.lower() for w in ['used to live', 'used to', 'had called', 'was calling', 'had eaten', 'were playing']) or any(w in soru.lower() for w in ['used to', 'didn\'t use to', 'yesterday', 'in 1953']):
        return "Tenses & Time Expressions", "Past Tenses (Simple Past, Past Continuous, Past Perfect) & Used To"

    # 16. Future Forms (Will / Be Going To)
    if any(w in ans.lower() for w in ['will call', 'is going to visit', 'will be', 'be going to']) or any(w in soru.lower() for w in ['next saturday', 'tomorrow', 'future plan']):
        return "Tenses & Time Expressions", "Future Forms (Will, Be Going To) & Predictions"

    # 17. Present Tenses & Daily Routines
    if any(w in ans.lower() for w in ['are you doing', 'am studying', 'always', 'usually', 'rarely', 'never']) or any(w in soru.lower() for w in ['every day', 'at the moment', 'now']):
        return "Tenses & Time Expressions", "Present Tenses (Simple Present & Continuous) & Daily Routines"

    # 18. Food, Cooking, Shopping & Restaurants
    if any(w in ans.lower() for w in ['grocery shopping', 'glass of water', 'free tables', 'recipe', 'steak', 'menu', 'bottle in the fridge', 'food festival', 'buy a book']) or any(w in soru.lower() for w in ['recipe', 'stuffed dolma', 'grocery shopping', 'food festival']):
        return "Thematic Vocabulary & Life", "Food, Cooking, Shopping & Restaurant"

    # 19. Hobbies, Sports & Adventure Activities
    if any(w in ans.lower() for w in ['scuba diving', 'scuba-diving', 'mountain climbing', 'leisure time activity', 'extreme sport', 'wingsuit', 'bungee jumping', 'free climbing', 'skydiving', 'trekking', 'skateboarding', 'playing chess', 'cooking']) or any(w in soru.lower() for w in ['extreme sport', 'favourite pastime']):
        return "Thematic Vocabulary & Life", "Hobbies, Sports, Music & Adventure Activities"

    # 20. Clothes, Fashion & Shopping
    if any(w in ans.lower() for w in ['wear fashionable clothes', 'shopping list', 'half-price', 'discount']) or any(w in soru.lower() for w in ['french people dress', 'clothes']):
        return "Thematic Vocabulary & Life", "Giyim, Alışveriş & Fiyatlar"

    # 21. Health, Illnesses & Emergency
    if any(w in ans.lower() for w in ['lemon and mint tea', 'call 112', 'dermatologist', 'flu', 'emergency']) or any(w in soru.lower() for w in ['flu', 'illness', 'health', 'accident']):
        return "Thematic Vocabulary & Life", "Health, Illnesses & Emergency"

    # 22. Human Rights, Social Issues & Society
    if any(w in ans.lower() for w in ['disabled people', 'human rights', 'good manners', 'social relations', 'donate my old books', 'dictionary']) or any(w in soru.lower() for w in ['human rights', 'good manners', 'wheelchair ramps']):
        if 'dictionary' in ans.lower() or 'dictionary' in soru.lower():
            return "Thematic Vocabulary & Life", "Education, School, Exams & Language Learning"
        return "Thematic Vocabulary & Life", "Human Rights, Social Issues & Community Help"

    # 23. Environment, Nature & Renewable Energy
    if any(w in ans.lower() for w in ['use alternative energy sources', 'solar power', 'geothermal', 'global warming', 'climate change', 'recycle paper']) or any(w in soru.lower() for w in ['protect the nature', 'renewable energy', 'alternative energy']):
        return "Thematic Vocabulary & Life", "Environment, Nature, Climate & Renewable Energy"

    # 24. Television, Media & Technology
    if any(w in ans.lower() for w in ['technological devices', 'drone cameras', 'virtual reality', 'social media', 'wastes my time', 'documentary']) or any(w in soru.lower() for w in ['technological devices', 'social media', 'watching tv']):
        return "Thematic Vocabulary & Life", "Television, Media & Technology"

    # 25. Jobs, Careers & Work
    if any(w in ans.lower() for w in ['bio-genetic engineer', 'job interview', 'career', 'ambitious', 'fixing']) or any(w in soru.lower() for w in ['future career', 'job interview']):
        return "Thematic Vocabulary & Life", "Jobs, Occupations, Career Goals & Work"

    # 26. Travel, Tourism & Holidays
    if any(w in ans.lower() for w in ['chichen itza', 'archaeological site', 'historic place', 'for five days', 'hotel', 'flight', 'scenery']) or any(w in soru.lower() for w in ['travel agent', 'trip']):
        return "Thematic Vocabulary & Life", "Travel, Tourism, Transportation & Holidays"

    # 27. Education, School & Learning
    if any(w in ans.lower() for w in ['use a dictionary', 'dictionary', 'english exam', 'college student', 'school']) or any(w in soru.lower() for w in ['meanings in the paragraph', 'dictionary']):
        return "Thematic Vocabulary & Life", "Education, School, Exams & Language Learning"

    # Fallback by course
    if ders == 'İNGİLİZCE – 1':
        return "Everyday Functions & Communication", "Countries, Nationalities & Personal Identification"
    elif ders == 'İNGİLİZCE – 2':
        return "Thematic Vocabulary & Life", "Food, Cooking, Shopping & Restaurant"
    elif ders == 'İNGİLİZCE – 3':
        return "Thematic Vocabulary & Life", "Education, School, Exams & Language Learning"
    elif ders == 'İNGİLİZCE – 4':
        return "Grammar & Structures", "Modals & Advice (Should, Must, Have to, Needn’t, Deduction)"
    elif ders == 'İNGİLİZCE – 5':
        return "Thematic Vocabulary & Life", "Jobs, Occupations, Career Goals & Work"
    elif ders == 'İNGİLİZCE – 6':
        return "Thematic Vocabulary & Life", "Hobbies, Sports, Music & Adventure Activities"
    elif ders == 'İNGİLİZCE – 7':
        return "Thematic Vocabulary & Life", "Human Rights, Social Issues & Community Help"
    elif ders == 'İNGİLİZCE – 8':
        return "Thematic Vocabulary & Life", "Environment, Nature, Climate & Renewable Energy"

    return "Everyday Functions & Communication", "Everyday Communication & Language Structures"

# Reclassify all questions
count = 0
for q in questions:
    new_a, new_sub = classify_bulletproof(q)
    if q.get('ana_konu') != new_a or q.get('alt_konu') != new_sub:
        count += 1
        q['ana_konu'] = new_a
        q['alt_konu'] = new_sub

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"BULLETPROOF RECLASSIFICATION COMPLETE: {count} questions updated.")

