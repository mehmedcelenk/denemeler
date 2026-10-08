import json

file_path = 'data/subjects/ING.json'
with open(file_path, 'r', encoding='utf-8') as f:
    questions = json.load(f)

def classify_strict(q):
    soru = q.get('soru', '').strip()
    sec = q.get('secenekler', {})
    ans_key = q.get('dogru_cevap', '')
    ans = str(sec.get(ans_key, '')).strip().lower()
    soru_l = soru.lower()
    ders = q.get('ders', '').strip()
    full_text = f"{soru_l} {ans}"

    # ------------------ PRIORITY 1: EXACT TARGET ANSWER MEANINGS ------------------
    # 1a. Specific Target Vocabulary Answers
    if ans in ['leisure time activity', 'movie type', 'martial art', 'extreme sport']:
        return "Thematic Vocabulary & Life", "Hobbies, Sports, Music & Adventure Activities"
    if ans in ['use a dictionary', 'dictionary', 'english exam', 'study for my english exam']:
        return "Thematic Vocabulary & Life", "Education, School, Exams & Language Learning"
    if ans in ['job interview', 'interview', 'bio-genetic engineer', 'consultant', 'alternative energy consultant', 'smart-building technician']:
        return "Thematic Vocabulary & Life", "Jobs, Occupations, Career Goals & Work"
    if ans in ['do the grocery shopping', 'grocery shopping', 'a glass of water', 'i have a glass of water', 'free tables', 'a bottle in the fridge', 'recipe']:
        return "Thematic Vocabulary & Life", "Food, Cooking, Shopping & Restaurant"
    if ans in ['wear fashionable clothes', 'fashionable clothes', 'shopping list']:
        return "Thematic Vocabulary & Life", "Giyim, Alışveriş & Fiyatlar"
    if ans in ['russia', 'german', 'french', 'japanese', 'spanish', 'turkey', 'italian', 'english', 'american']:
        return "Everyday Functions & Communication", "Countries, Nationalities & Personal Identification"
    if ans in ['scuba diving', 'scuba-diving', 'mountain climbing', 'wingsuit flying', 'bungee jumping', 'free climbing']:
        return "Thematic Vocabulary & Life", "Hobbies, Sports, Music & Adventure Activities"
    if ans in ['use alternative energy sources', 'solar power', 'geothermal energy', 'alternative energy']:
        return "Thematic Vocabulary & Life", "Environment, Nature, Climate & Renewable Energy"
    if ans in ['virtual reality glasses and drone cameras', 'virtual reality', 'drone cameras', 'technological devices', 'social media']:
        return "Thematic Vocabulary & Life", "Television, Media & Technology"
    if ans in ['disabled people', 'good manners', 'social relations', 'human rights', 'donate my old books']:
        return "Thematic Vocabulary & Life", "Human Rights, Social Issues & Community Help"
    if ans in ['lemon and mint tea', 'call 112', 'call 112 immediately', 'dermatologist', 'flu']:
        return "Thematic Vocabulary & Life", "Health, Illnesses & Emergency"
    if ans in ['chichen itza', 'archaeological site', 'historic place', 'for three days', 'for five days']:
        return "Thematic Vocabulary & Life", "Travel, Tourism, Transportation & Holidays"

    # ------------------ PRIORITY 2: DIALOGUE FUNCTIONS ------------------
    if 'where are you from' in soru_l:
        return "Everyday Functions & Communication", "Countries, Nationalities & Personal Identification"
    if 'how can i get to' in soru_l or 'where is the salty lake' in soru_l or 'can you tell me how can i get' in soru_l:
        return "Everyday Functions & Communication", "Yön, Adres & Konum Sorma"
    if any(w in soru_l for w in ['would you like', 'let\'s go', 'why not', 'how about', 'shall we']):
        return "Everyday Functions & Communication", "Offers, Invitations & Suggestions (How about, Let’s, Would you like)"
    if 'can i have' in soru_l or 'can you help' in soru_l or 'would you mind' in soru_l or 'can i ' in soru_l:
        return "Everyday Functions & Communication", "Requests & Asking for Permission (Can, Could, Would, May)"

    # ------------------ PRIORITY 3: GRAMMAR TARGETS ------------------
    if 'if only' in full_text or 'wish' in full_text or 'if i had' in full_text or 'wouldn\'t have had' in full_text or 'if parents' in full_text or 'if it rains' in full_text:
        return "Grammar & Structures", "Conditionals & Wish Clauses (If Clauses & I Wish)"

    if any(w in ans for w in ['was built', 'is served', 'is provided', 'was provided', 'were built', 'can be produced', 'was constructed', 'is located']):
        return "Grammar & Structures", "Passive Voice (Present & Past Passive)"

    if any(w in ans for w in ['said that', 'told me', 'doing skateboarding makes her happy']) or ('manager asked him' in soru_l and 'interview' not in ans):
        return "Grammar & Structures", "Reported Speech (Direct & Indirect Speech)"

    if ans in ['who', 'which', 'where', 'whose', 'that'] or any(w in full_text for w in ['woman who lives', 'documentary which was', 'person who']):
        return "Grammar & Structures", "Relative Clauses (Who, Which, That, Where, Whose)"

    if any(w in ans for w in ['must have', 'could have', 'might have', 'can\'t have']):
        return "Grammar & Structures", "Past Modals of Deduction (Must/Can't/Might have V3)"

    if ans in ['should', 'must', 'have to', 'needn\'t', 'ought to', 'had better'] or any(w in ans for w in ['should drink', 'must call', 'needn\'t worry', 'have to wear']):
        return "Grammar & Structures", "Modals & Advice (Should, Must, Have to, Needn’t, Deduction)"

    if any(w in ans for w in ['larger', 'more carefully', 'cleaner', 'colder', 'faster', 'most popular', 'bravest', 'most famous', 'the most', 'as...as']) or 'than new york' in full_text:
        return "Grammar & Structures", "Comparatives & Superlatives (More, -er than, The Most, As...as)"

    # ------------------ PRIORITY 4: TIME & TENSES ------------------
    if 'when bob was driving' in soru_l or 'when i checked' in soru_l or 'while i' in soru_l or 'when i came home' in soru_l:
        if ans in ['ran', 'had called', 'was eating', 'were listening', 'slept']:
            return "Grammar & Structures", "Time Clauses & Sequencing (When, While, As soon as, Before, After)"

    if 'used to' in soru_l or 'didn\'t use to' in soru_l or ans in ['used to live', 'hadn\'t eaten', 'had called']:
        return "Tenses & Time Expressions", "Past Tenses (Simple Past, Past Continuous, Past Perfect) & Used To"

    if any(w in ans for w in ['will call', 'is going to visit', 'will be', 'be going to']) or 'next saturday' in soru_l:
        return "Tenses & Time Expressions", "Future Forms (Will, Be Going To) & Predictions"

    if any(w in ans for w in ['are you doing', 'am studying', 'always', 'usually', 'rarely', 'never']) or 'at the moment' in soru_l or 'now' in soru_l:
        return "Tenses & Time Expressions", "Present Tenses (Simple Present & Continuous) & Daily Routines"

    # ------------------ PRIORITY 5: FALLBACK BY COURSE ------------------
    course_fallbacks = {
        'İNGİLİZCE – 1': ("Everyday Functions & Communication", "Countries, Nationalities & Personal Identification"),
        'İNGİLİZCE – 2': ("Thematic Vocabulary & Life", "Food, Cooking, Shopping & Restaurant"),
        'İNGİLİZCE – 3': ("Thematic Vocabulary & Life", "Education, School, Exams & Language Learning"),
        'İNGİLİZCE – 4': ("Grammar & Structures", "Modals & Advice (Should, Must, Have to, Needn’t, Deduction)"),
        'İNGİLİZCE – 5': ("Thematic Vocabulary & Life", "Jobs, Occupations, Career Goals & Work"),
        'İNGİLİZCE – 6': ("Thematic Vocabulary & Life", "Hobbies, Sports, Music & Adventure Activities"),
        'İNGİLİZCE – 7': ("Thematic Vocabulary & Life", "Human Rights, Social Issues & Community Help"),
        'İNGİLİZCE – 8': ("Thematic Vocabulary & Life", "Environment, Nature, Climate & Renewable Energy")
    }
    return course_fallbacks.get(ders, ("Everyday Functions & Communication", "Everyday Communication & Language Structures"))

# Apply priority classification
updated = 0
for q in questions:
    new_a, new_sub = classify_strict(q)
    if q.get('ana_konu') != new_a or q.get('alt_konu') != new_sub:
        updated += 1
        q['ana_konu'] = new_a
        q['alt_konu'] = new_sub

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"STRICT OVERLAP RESOLUTION COMPLETE: {updated} questions updated.")
