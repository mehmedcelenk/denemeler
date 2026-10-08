import json
import re

file_path = 'data/subjects/ING.json'
with open(file_path, 'r', encoding='utf-8') as f:
    questions = json.load(f)

def get_precise_topic(q):
    soru = q.get('soru', '').strip()
    sec = q.get('secenekler', {})
    ans_key = q.get('dogru_cevap', '')
    ans_text = str(sec.get(ans_key, '')).strip()
    sec_all = ' '.join(str(v) for v in sec.values()).lower()
    full_text = f"{soru} {sec_all}".lower()
    ders = q.get('ders', '').strip()

    # --- 1. Reading Comprehension & Paragraph Passages ---
    if len(soru) > 280 or 'bu cümlelere göre' in full_text or 'paragrafa göre' in full_text or 'metne göre' in full_text or 'read the text' in full_text:
        return "Okuduğunu Anlama & Paragraf", "Reading Comprehension (Paragrafta Anlam & Metin İnceleme)"

    # --- 2. Conditionals & Wish Clauses ---
    if re.search(r'\b(if|if only|wish|wishes)\b', full_text):
        if 'if only' in full_text or 'wish' in full_text:
            return "Grammar & Structures", "Conditionals & Wish Clauses (If Clauses & I Wish)"
        if 'if i had' in full_text or 'wouldn\'t have' in full_text or 'if parents' in full_text or 'if it rains' in full_text or 'if clause' in full_text or 'if' in soru.lower():
            return "Grammar & Structures", "Conditionals & Wish Clauses (If Clauses & I Wish)"

    # --- 3. Passive Voice ---
    if re.search(r'\b(was built|is served|is provided|was provided|were built|can be produced|is located|was born|is celebrated|are made)\b', full_text):
        return "Grammar & Structures", "Passive Voice (Present & Past Passive)"

    # --- 4. Reported Speech ---
    if re.search(r'\b(said that|told me|reported|asked him questions|manager asked him|said he|told her)\b', full_text):
        return "Grammar & Structures", "Reported Speech (Direct & Indirect Speech)"

    # --- 5. Relative Clauses ---
    if re.search(r'\b(who lives|which was|documentary which|woman who|people who|place where|person who|man who)\b', full_text) or (ans_text.lower() in ['who', 'which', 'where', 'whose'] and len(ans_text) < 10):
        return "Grammar & Structures", "Relative Clauses (Who, Which, That, Where, Whose)"

    # --- 6. Past Modals of Deduction ---
    if re.search(r'\b(must have|can\'t have|could have|might have|should have)\b', full_text):
        return "Grammar & Structures", "Past Modals of Deduction (Must/Can't/Might have V3)"

    # --- 7. Modals & Advice ---
    if re.search(r'\b(should|mustn\'t|must|have to|has to|needn\'t|ought to|had better)\b', full_text) and not any(k in full_text for k in ['technological', 'renewable', 'energy', 'dictionary']):
        return "Grammar & Structures", "Modals & Advice (Should, Must, Have to, Needn’t, Deduction)"

    # --- 8. Comparatives & Superlatives ---
    if re.search(r'\b(more|than|most|er than|larger|cleaner|colder|faster|popular|taller|older|as...as|the best|the most)\b', full_text):
        if any(k in full_text for k in ['larger than', 'more beautiful', 'cleaner than', 'colder than', 'faster than', 'most popular', 'bravest', 'most famous', 'more carefully', 'more energetic']):
            return "Grammar & Structures", "Comparatives & Superlatives (More, -er than, The Most, As...as)"

    # --- 9. Tenses & Time Expressions ---
    # 9a. Time Clauses (When / While / As soon as / Before / After)
    if re.search(r'\b(while|as soon as|before|after)\b', full_text) or ('when' in full_text and any(w in full_text for w in ['was driving', 'were playing', 'fell asleep', 'was eating', 'checked my cell'])):
        return "Grammar & Structures", "Time Clauses & Sequencing (When, While, As soon as, Before, After)"

    # 9b. Past Tenses & Used To
    if re.search(r'\b(used to|didn\'t use to|hadn\'t eaten|had called|was driving|were playing|yesterday|in 1953|last year|last month|ago)\b', full_text):
        return "Tenses & Time Expressions", "Past Tenses (Simple Past, Past Continuous, Past Perfect) & Used To"

    # 9c. Future Forms (Will / Be Going To)
    if re.search(r'\b(going to|will|next saturday|next week|tomorrow|busy weekend plan)\b', full_text):
        return "Tenses & Time Expressions", "Future Forms (Will, Be Going To) & Predictions"

    # 9d. Present Tenses & Daily Routines
    if re.search(r'\b(every day|always|often|usually|rarely|never|at the moment|now|is studying|am studying)\b', full_text):
        return "Tenses & Time Expressions", "Present Tenses (Simple Present & Continuous) & Daily Routines"

    # --- 10. Thematic Vocabulary & Life ---
    # 10a. Technology, Media & Digital Devices
    if any(w in full_text for w in ['technology', 'technological', 'virtual reality', 'drone', 'social media', 'internet', 'cell phone', 'smartphone', 'gadgets', 'computer', 'go online']):
        return "Thematic Vocabulary & Life", "Television, Media & Technology"

    # 10b. Environment, Climate & Renewable Energy
    if any(w in full_text for w in ['renewable energy', 'solar power', 'geothermal', 'global warming', 'climate change', 'pollute', 'pollution', 'waste water', 'cut down trees', 'protect the nature', 'environment']):
        return "Thematic Vocabulary & Life", "Environment, Nature, Climate & Renewable Energy"

    # 10c. Health, Illnesses & Emergency
    if any(w in full_text for w in ['flu', 'dermatologist', 'lemon and mint tea', 'infection', 'accident', 'call 112', 'emergency', 'survival kit', 'headache', 'toothache', 'fever', 'doctor', 'hospital', 'medicine', 'keep fit']):
        return "Thematic Vocabulary & Life", "Health, Illnesses & Emergency"

    # 10d. Human Rights, Social Issues & Society
    if any(w in full_text for w in ['human rights', 'animal rights', 'wheelchair', 'disabled', 'gender equality', 'child labour', 'social relations', 'good manners', 'society', 'etiquette', 'politeness', 'charity', 'donate']):
        return "Thematic Vocabulary & Life", "Human Rights, Social Issues & Community Help"

    # 10e. Jobs, Careers & Work
    if any(w in full_text for w in ['job interview', 'career', 'bio-genetic engineer', 'consultant', 'ambitious', 'workplace', 'occupations', 'profession', 'manager', 'applicant', 'cv', 'salary']):
        return "Thematic Vocabulary & Life", "Jobs, Occupations, Career Goals & Work"

    # 10f. Hobbies, Sports & Adventure Activities
    if any(w in full_text for w in ['scuba diving', 'scuba-diving', 'extreme sport', 'wingsuit', 'bungee jumping', 'free climbing', 'mountain climbing', 'skydiving', 'trekking', 'skateboarding', 'board games', 'martial art', 'playing chess', 'playing the piano', 'theatre', 'cinema', 'movie']):
        return "Thematic Vocabulary & Life", "Hobbies, Sports, Music & Adventure Activities"

    # 10g. Food, Cooking, Shopping & Restaurant
    if any(w in full_text for w in ['restaurant', 'free tables', 'waitress', 'menu', 'steak', 'order', 'recipe', 'stuffed dolma', 'cook', 'bake', 'boil', 'dish', 'cuisine', 'food festival', 'grocery shopping', 'bread and milk', 'bottle in the fridge', 'market', 'buy', 'shopping list']):
        return "Thematic Vocabulary & Life", "Food, Cooking, Shopping & Restaurant"

    # 10h. Travel, Tourism & Holidays
    if any(w in full_text for w in ['archaeological site', 'historic place', 'chichen itza', 'byzantine church', 'anıtkabir', 'grand bazaar', 'salty lake', 'travel agent', 'tourism', 'flight', 'scenery', 'trip', 'hotel', 'accommodation']):
        return "Thematic Vocabulary & Life", "Travel, Tourism, Transportation & Holidays"

    # 10i. Education, School & Learning
    if any(w in full_text for w in ['dictionary', 'meanings', 'words in the paragraph', 'school', 'exam', 'study', 'teacher', 'college', 'course']):
        return "Thematic Vocabulary & Life", "Education, School, Exams & Language Learning"

    # --- 11. Everyday Functions & Communication ---
    if any(w in full_text for w in ['where are you from', 'where is', 'how can i get', 'take the first left', 'on your right']):
        return "Everyday Functions & Communication", "Yön, Adres & Konum Sorma"

    if any(w in full_text for w in ['would you like', 'let\'s', 'why not', 'how about', 'shall we']):
        return "Everyday Functions & Communication", "Offers, Invitations & Suggestions (How about, Let’s, Would you like)"

    if any(w in full_text for w in ['can i have', 'could you', 'can you help', 'would you mind', 'can i']):
        return "Everyday Functions & Communication", "Requests & Asking for Permission (Can, Could, Would, May)"

    if any(w in full_text for w in ['what do you think', 'in my opinion', 'i think', 'i prefer', 'dislike']):
        return "Everyday Functions & Communication", "Expressing Opinions, Feelings & Apologies"

    if any(w in full_text for w in ['where are you from', 'i am from', 'my name is', 'is this your']):
        return "Everyday Functions & Communication", "Countries, Nationalities & Personal Identification"

    # General fallback
    return "Everyday Functions & Communication", "Everyday Communication & Language Structures"

# Reclassify all 656 questions
changed_count = 0
for i, q in enumerate(questions):
    old_ana = q.get('ana_konu', '')
    old_alt = q.get('alt_konu', '')
    
    new_ana, new_alt = get_precise_topic(q)
    
    if old_ana != new_ana or old_alt != new_alt:
        changed_count += 1
        q['ana_konu'] = new_ana
        q['alt_konu'] = new_alt

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"COMPLETE AUDIT DONE: {changed_count} questions updated out of {len(questions)}!")

