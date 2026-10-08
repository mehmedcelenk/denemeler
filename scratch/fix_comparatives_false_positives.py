import json
import re

file_path = 'data/subjects/ING.json'
with open(file_path, 'r', encoding='utf-8') as f:
    questions = json.load(f)

# True Comparative/Superlative option forms:
COMP_SUPER_CHOICES = {
    'larger', 'faster', 'cleaner', 'colder', 'taller', 'older', 'cheaper', 'smaller',
    'shorter', 'longer', 'richer', 'poorer', 'easier', 'harder', 'heavier', 'lighter',
    'better', 'worse', 'more expensive', 'more beautiful', 'more popular', 'more energetic',
    'more comfortable', 'more difficult', 'more dangerous', 'the largest', 'the most beautiful',
    'the bravest', 'the most famous', 'the cheapest', 'the highest', 'the best', 'the worst',
    'the heaviest', 'the lightest', 'the fastest', 'the cleanest', 'the coldest'
}

def classify_perfect_v2(q):
    soru = q.get('soru', '').strip()
    sec = q.get('secenekler', {})
    ans_key = q.get('dogru_cevap', '')
    ans = str(sec.get(ans_key, '')).strip()
    ans_lower = ans.lower()
    soru_lower = soru.lower()
    full_text = f"{soru_lower} {ans_lower} {' '.join(str(v) for v in sec.values()).lower()}"
    ders = q.get('ders', '').strip()

    # 1. Reading Comprehension Passages
    if len(soru) > 280 or 'bu cümlelere göre' in soru_lower or 'paragrafa göre' in soru_lower or 'metne göre' in soru_lower or 'bu metnin ana fikri' in soru_lower:
        return "Okuduğunu Anlama & Paragraf", "Reading Comprehension (Paragrafta Anlam & Metin İnceleme)"

    # 2. Directions & Locations
    if 'how can i get to' in soru_lower or 'where is' in soru_lower or 'how do i get' in soru_lower or 'can you tell me the way' in soru_lower or 'butterfly valley' in soru_lower:
        return "Everyday Functions & Communication", "Yön, Adres & Konum Sorma"

    # 3. Shopping & Clothes
    if 'shop assistant' in soru_lower or 'customer' in soru_lower or 'what size' in soru_lower or 'clothing' in soru_lower or 'kimonos' in soru_lower or 'dress' in soru_lower or 'suits' in soru_lower or 'size' in ans_lower or 'buy' in ans_lower or 'fashionable' in ans_lower:
        if 'food festival' not in full_text and 'recipe' not in full_text:
            return "Thematic Vocabulary & Life", "Food, Cooking, Shopping & Restaurant"

    # 4. Food, Cooking & Restaurants
    if any(w in full_text for w in ['grocery shopping', 'food festival', 'salad', 'recipe', 'cook', 'bake', 'boil', 'dish', 'cuisine', 'steak', 'menu', 'waitress', 'restaurant', 'fridge', 'stuffed dolma']):
        return "Thematic Vocabulary & Life", "Food, Cooking, Shopping & Restaurant"

    # 5. Technology, Media & Gadgets
    if any(w in full_text for w in ['robotic mops', 'fitness trackers', 'laptop', 'camera', 'smartphone', 'tablet', 'internal memory', 'technological', 'devices', 'social media', 'internet', 'virtual reality', 'drone']):
        return "Thematic Vocabulary & Life", "Television, Media & Technology"

    # 6. Travel, Tourism & Holidays
    if any(w in full_text for w in ['travel agent', 'sightseeing', 'holiday in the mountains', 'holiday by the sea', 'lake van', 'akdamar island', 'scenery', 'butterfly valley', 'ship', 'trip', 'flight', 'hotel', 'landmarks']):
        return "Thematic Vocabulary & Life", "Travel, Tourism, Transportation & Holidays"

    # 7. Art, Hobbies & Sports
    if any(w in full_text for w in ['paintings', 'art', 'theatre', 'scuba diving', 'tennis', 'volleyball', 'club', 'actress', 'films']):
        return "Thematic Vocabulary & Life", "Hobbies, Sports, Music & Adventure Activities"

    # 8. Human Rights, Social Issues & Society
    if any(w in full_text for w in ['good manners', 'tells the truth', 'deceives', 'culture', 'individualism', 'society', 'relations', 'human rights']):
        return "Thematic Vocabulary & Life", "Human Rights, Social Issues & Community Help"

    # 9. Health & Emergency
    if any(w in full_text for w in ['nervous', 'exam tomorrow', 'feelings', 'health', 'illness', 'doctor']):
        return "Thematic Vocabulary & Life", "Health, Illnesses & Emergency"

    # 10. Genuine Comparatives & Superlatives (ONLY if target choice or stem is explicitly comparing)
    if ans_lower in COMP_SUPER_CHOICES or any(w in ans_lower for w in ['than', 'the most', 'the largest', 'the highest', 'the best of', 'the worst of']) or ('than me' in soru_lower) or ('is - - - - than' in soru_lower and ans_lower in ['larger', 'cleaner', 'colder', 'faster', 'cheaper', 'smaller', 'easier', 'harder', 'better', 'worse', 'more expensive', 'more popular', 'more energetic']):
        return "Grammar & Structures", "Comparatives & Superlatives (More, -er than, The Most, As...as)"

    # 11. Conditionals & Wish Clauses
    if 'if' in soru_lower or 'wish' in soru_lower or 'if only' in soru_lower or 'would rather' in full_text:
        return "Grammar & Structures", "Conditionals & Wish Clauses (If Clauses & I Wish)"

    # 12. Passive Voice
    if any(w in ans_lower for w in ['was built', 'is served', 'is provided', 'was provided', 'were built', 'can be produced', 'is visited']):
        return "Grammar & Structures", "Passive Voice (Present & Past Passive)"

    # 13. Time Clauses & Sequencing (When / While / How long)
    if 'how long have you been' in soru_lower or 'while' in soru_lower or 'when' in soru_lower or 'how was communication in the past' in soru_lower:
        return "Grammar & Structures", "Time Clauses & Sequencing (When, While, As soon as, Before, After)"

    # 14. Past Tenses & Used To
    if 'used to' in soru_lower or 'in the past' in soru_lower or 'had' in ans_lower or 'was' in ans_lower:
        return "Tenses & Time Expressions", "Past Tenses (Simple Past, Past Continuous, Past Perfect) & Used To"

    # 15. Future Forms
    if 'in the future' in soru_lower or 'will' in ans_lower or 'going to' in ans_lower:
        return "Tenses & Time Expressions", "Future Forms (Will, Be Going To) & Predictions"

    # 16. Present Tenses & Daily Routines
    if any(w in soru_lower for w in ['free time', 'always', 'usually', 'every day', 'routine']):
        return "Tenses & Time Expressions", "Present Tenses (Simple Present & Continuous) & Daily Routines"

    # 17. Everyday Functions
    if '?' in soru:
        return "Everyday Functions & Communication", "Everyday Communication & Language Structures"

    return "Everyday Functions & Communication", "Everyday Communication & Language Structures"

# Reclassify all 656 questions
fixed_count = 0
for q in questions:
    old_a = q.get('ana_konu', '')
    old_sub = q.get('alt_konu', '')
    new_a, new_sub = classify_perfect_v2(q)
    if old_a != new_a or old_sub != new_sub:
        fixed_count += 1
        q['ana_konu'] = new_a
        q['alt_konu'] = new_sub

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"RECLASSIFICATION v2 COMPLETE: {fixed_count} questions updated.")

