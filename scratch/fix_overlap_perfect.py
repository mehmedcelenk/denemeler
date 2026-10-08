import json

file_path = 'data/subjects/ING.json'
with open(file_path, 'r', encoding='utf-8') as f:
    questions = json.load(f)

def classify_perfect(q):
    soru = q.get('soru', '').strip()
    sec = q.get('secenekler', {})
    ans_key = q.get('dogru_cevap', '')
    ans = str(sec.get(ans_key, '')).strip().lower()
    soru_l = soru.lower()
    ders = q.get('ders', '').strip()
    full_text = f"{soru_l} {ans} {' '.join(str(v) for v in sec.values()).lower()}"

    # 1. Reading Comprehension (Passages & Prompts)
    if len(soru) > 280 or 'bu cümlelere göre' in soru_l or 'paragrafa göre' in soru_l or 'metne göre' in soru_l:
        return "Okuduğunu Anlama & Paragraf", "Reading Comprehension (Paragrafta Anlam & Metin İnceleme)"

    # 2. Technology, Digital Devices & Media
    if any(w in full_text for w in ['technological devices', 'virtual reality', 'drone', 'social media', 'internet', 'cell phone', 'smartphone', 'gadgets', 'computer', 'go online', 'digital']):
        return "Thematic Vocabulary & Life", "Television, Media & Technology"

    # 3. Human Rights, Society, Manners & Social Issues
    if any(w in full_text for w in ['good manners', 'society', 'social relations', 'disabled', 'wheelchair', 'human rights', 'animal rights', 'donate my old books', 'charity', 'gender equality', 'child labour']):
        return "Thematic Vocabulary & Life", "Human Rights, Social Issues & Community Help"

    # 4. Environment, Nature & Renewable Energy
    if any(w in full_text for w in ['renewable energy', 'solar power', 'geothermal', 'global warming', 'climate change', 'pollute', 'pollution', 'waste water', 'cut down trees', 'protect the nature', 'alternative energy']):
        return "Thematic Vocabulary & Life", "Environment, Nature, Climate & Renewable Energy"

    # 5. Food, Cooking, Shopping & Restaurants
    if any(w in full_text for w in ['grocery shopping', 'glass of water', 'free tables', 'recipe', 'steak', 'menu', 'bottle in the fridge', 'food festival', 'stuffed dolma', 'cook', 'bake', 'boil', 'dish', 'cuisine', 'market', 'shopping list', 'bread and milk']):
        return "Thematic Vocabulary & Life", "Food, Cooking, Shopping & Restaurant"

    # 6. Clothes, Fashion & Shopping
    if any(w in full_text for w in ['fashionable clothes', 'dress', 'clothes', 'half-price', 'discount', 'mall']):
        return "Thematic Vocabulary & Life", "Giyim, Alışveriş & Fiyatlar"

    # 7. Health, Illnesses & Emergency
    if any(w in full_text for w in ['lemon and mint tea', 'call 112', 'dermatologist', 'flu', 'emergency', 'headache', 'toothache', 'fever', 'doctor', 'hospital', 'medicine', 'keep fit']):
        return "Thematic Vocabulary & Life", "Health, Illnesses & Emergency"

    # 8. Hobbies, Sports & Adventure Activities
    if any(w in full_text for w in ['leisure time activity', 'scuba diving', 'scuba-diving', 'mountain climbing', 'wingsuit flying', 'bungee jumping', 'free climbing', 'skydiving', 'trekking', 'skateboarding', 'playing chess', 'playing the piano', 'theatre', 'cinema', 'movie']):
        return "Thematic Vocabulary & Life", "Hobbies, Sports, Music & Adventure Activities"

    # 9. Travel, Tourism & Holidays
    if any(w in full_text for w in ['chichen itza', 'archaeological site', 'historic place', 'for three days', 'for five days', 'travel agent', 'tourism', 'flight', 'scenery', 'trip', 'hotel', 'accommodation', 'grand bazaar', 'salty lake']):
        return "Thematic Vocabulary & Life", "Travel, Tourism, Transportation & Holidays"

    # 10. Education, School & Learning
    if any(w in full_text for w in ['use a dictionary', 'dictionary', 'meanings in the paragraph', 'words in the paragraph', 'school', 'exam', 'study', 'teacher', 'college']):
        return "Thematic Vocabulary & Life", "Education, School, Exams & Language Learning"

    # 11. Jobs, Careers & Work
    if any(w in full_text for w in ['job interview', 'career', 'bio-genetic engineer', 'consultant', 'ambitious', 'workplace', 'occupations', 'profession', 'manager asked']):
        return "Thematic Vocabulary & Life", "Jobs, Occupations, Career Goals & Work"

    # 12. Countries, Nationalities & Personal Info
    if any(w in full_text for w in ['where are you from', 'from - - - -', 'russia', 'german', 'french', 'japanese', 'spanish', 'turkey', 'nationalities']):
        return "Everyday Functions & Communication", "Countries, Nationalities & Personal Identification"

    # 13. Directions & Locations
    if any(w in full_text for w in ['how can i get to', 'where is the salty lake', 'take the first left', 'on your right']):
        return "Everyday Functions & Communication", "Yön, Adres & Konum Sorma"

    # 14. Offers, Invitations & Suggestions
    if any(w in full_text for w in ['would you like', 'let\'s go', 'why not', 'how about', 'shall we']):
        return "Everyday Functions & Communication", "Offers, Invitations & Suggestions (How about, Let’s, Would you like)"

    # 15. Requests & Permission
    if any(w in full_text for w in ['can i have', 'can you help', 'could you', 'would you mind']):
        return "Everyday Functions & Communication", "Requests & Asking for Permission (Can, Could, Would, May)"

    # 16. Expressing Opinions & Feelings
    if any(w in full_text for w in ['what do you think', 'in my opinion', 'i think', 'i prefer']):
        return "Everyday Functions & Communication", "Expressing Opinions, Feelings & Apologies"

    # 17. Conditionals & Wish Clauses
    if any(w in full_text for w in ['if only', 'wish', 'if i had', 'wouldn\'t have had', 'if parents', 'if it rains']):
        return "Grammar & Structures", "Conditionals & Wish Clauses (If Clauses & I Wish)"

    # 18. Passive Voice
    if any(w in full_text for w in ['was built', 'is served', 'is provided', 'was provided', 'were built', 'can be produced', 'was constructed']):
        return "Grammar & Structures", "Passive Voice (Present & Past Passive)"

    # 19. Reported Speech
    if any(w in full_text for w in ['said that', 'told me', 'doing skateboarding makes her happy', 'reported']):
        return "Grammar & Structures", "Reported Speech (Direct & Indirect Speech)"

    # 20. Relative Clauses
    if ans in ['who', 'which', 'where', 'whose', 'that'] or any(w in full_text for w in ['woman who lives', 'documentary which was', 'person who']):
        return "Grammar & Structures", "Relative Clauses (Who, Which, That, Where, Whose)"

    # 21. Past Modals of Deduction
    if any(w in full_text for w in ['must have been', 'could have been', 'might have been', 'can\'t have']):
        return "Grammar & Structures", "Past Modals of Deduction (Must/Can't/Might have V3)"

    # 22. Modals & Advice
    if ans in ['should', 'must', 'have to', 'needn\'t', 'ought to', 'had better'] or any(w in full_text for w in ['should drink', 'must call', 'needn\'t worry', 'have to wear']):
        return "Grammar & Structures", "Modals & Advice (Should, Must, Have to, Needn’t, Deduction)"

    # 23. Comparatives & Superlatives
    if any(w in full_text for w in ['larger', 'more carefully', 'cleaner', 'colder', 'faster', 'most popular', 'bravest', 'most famous', 'the most', 'as...as']) or 'than' in full_text:
        return "Grammar & Structures", "Comparatives & Superlatives (More, -er than, The Most, As...as)"

    # 24. Time Clauses & Sequencing
    if any(w in full_text for w in ['when bob was driving', 'when i checked', 'while i', 'when i came home', 'was eating', 'were listening', 'ran out of petrol']):
        return "Grammar & Structures", "Time Clauses & Sequencing (When, While, As soon as, Before, After)"

    # 25. Past Tenses & Used To
    if any(w in full_text for w in ['used to', 'didn\'t use to', 'hadn\'t eaten', 'had called', 'was driving', 'were playing', 'yesterday', 'in 1953']):
        return "Tenses & Time Expressions", "Past Tenses (Simple Past, Past Continuous, Past Perfect) & Used To"

    # 26. Future Forms
    if any(w in full_text for w in ['will call', 'is going to visit', 'will be', 'be going to', 'next saturday', 'tomorrow']):
        return "Tenses & Time Expressions", "Future Forms (Will, Be Going To) & Predictions"

    # 27. Present Tenses & Daily Routines
    if any(w in full_text for w in ['are you doing', 'am studying', 'always', 'usually', 'rarely', 'never', 'every day', 'at the moment', 'now']):
        return "Tenses & Time Expressions", "Present Tenses (Simple Present & Continuous) & Daily Routines"

    return "Everyday Functions & Communication", "Everyday Communication & Language Structures"

# Reclassify
updated_count = 0
for q in questions:
    new_a, new_sub = classify_perfect(q)
    if q.get('ana_konu') != new_a or q.get('alt_konu') != new_sub:
        updated_count += 1
        q['ana_konu'] = new_a
        q['alt_konu'] = new_sub

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"PERFECT RECLASSIFICATION COMPLETE: {updated_count} questions updated.")

