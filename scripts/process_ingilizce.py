#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
process_ingilizce.py
İNGİLİZCE (1 - 8) Zorunlu Ortak Kültür Dersi Analiz ve Temizleme Scripti
- Kapsam: İNGİLİZCE – 1'den 8'e kadar (656 soru, her kademede 82 soru)
- MEB Ortaöğretim İngilizce Müfredatı (A1-B2 kazanımları, dilbilgisi ve kelime temaları) uygulanır.
- Kesişim kümeleri taranır ve raporlanır.
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
    full = soru_text + " " + " ".join(secenekler.values())
    t = full.lower()

    # 1. GRAMMAR: Conditionals & Wish clauses
    if any(k in t for k in ['if i were', 'if he had', 'if i had known', 'if she had', 'if you study', 'if it rains', 'if they don’t', 'i wish i', 'if you are responsible', 'third conditional']):
        return ("Grammar & Structures", "Conditionals (If Clauses Type 1, 2, 3) & Wish Clauses")

    # 2. GRAMMAR: Relative Clauses
    if any(k in t for k in ['which is faster', 'who is the architect', 'who lives', 'which was built', 'whose car', 'where we met', 'relative clause']):
        return ("Grammar & Structures", "Relative Clauses (Who, Which, That, Where, Whose)")

    # 3. GRAMMAR: Passive Voice
    if any(k in t for k in ['is made of', 'are given', 'was built', 'were invented', 'has been discovered', 'passive voice', 'is celebrated', 'are watched']):
        return ("Grammar & Structures", "Passive Voice (Present & Past Passive)")

    # 4. GRAMMAR: Modals & Advice
    if any(k in t for k in ['should visit', 'must go', 'mustn’t', 'have to stay', 'don’t have to', 'can i borrow', 'could you please', 'would you like', 'may i', 'must have been', 'can’t have']):
        return ("Grammar & Structures", "Modals & Semi-Modals (Can, Could, Should, Must, Have to)")

    # 5. GRAMMAR: Past Habits & Past Tenses
    if any(k in t for k in ['used to live', 'used to play', 'did you go', 'went to', 'yesterday', 'last night', 'last summer', 'two days ago', 'while i was', 'when i arrived', 'had already', 'had never met', 'before he visited', 'after i had']):
        return ("Tenses & Time Expressions", "Past Tenses (Simple Past, Past Continuous, Past Perfect) & Used To")

    # 6. GRAMMAR: Future Forms & Plans
    if any(k in t for k in ['will call', 'will help', 'going to visit', 'are going to', 'am going to', 'will be able', 'next week', 'tomorrow', 'in the future', 'prediction']):
        return ("Tenses & Time Expressions", "Future Forms (Will, Be Going To) & Expressing Predictions")

    # 7. GRAMMAR: Present Tenses & Daily Routines
    if any(k in t for k in ['every day', 'at weekends', 'usually', 'always tells', 'never deceives', 'am drawing', 'is waiting', 'likes going', 'simple present', 'present continuous']):
        return ("Tenses & Time Expressions", "Present Tenses (Simple Present & Continuous) & Routines")

    # 8. VOCABULARY & FUNCTIONS: Food, Cooking & Restaurant
    if any(k in t for k in ['free table', 'order food', 'delicious', 'recipe', 'cuisine', 'ingredients', 'stuffed dolma', 'restaurant', 'waitress', 'waiter', 'steak', 'dessert']):
        return ("Vocabulary & Daily Functions", "Food, Traditional Cuisine, Cooking & Ordering at a Restaurant")

    # 9. VOCABULARY & FUNCTIONS: Career, Jobs & Personality
    if any(k in t for k in ['future career', 'job interview', 'ambitious', 'pessimistic', 'adaptable', 'honest', 'creative', 'organized', 'technician', 'engineer', 'manager', 'fixing broken']):
        return ("Vocabulary & Daily Functions", "Jobs, Career Goals, Skills & Personality Adjectives")

    # 10. VOCABULARY & FUNCTIONS: Travel, Tourism & Directions
    if any(k in t for k in ['how long is the trip', 'city centre', 'flight', 'luggage', 'hotel', 'ticket', 'sightseeing', 'historic site', 'monument', 'tourist', 'ancient']):
        return ("Vocabulary & Daily Functions", "Travel, Tourism, Transportation & Sightseeing")

    # 11. VOCABULARY & FUNCTIONS: Music, Art, Hobbies & Free Time
    if any(k in t for k in ['photography', 'drawing picture', 'rap music', 'rock music', 'hobbies', 'martial art', 'extreme sport', 'leisure time', 'favorite movie', 'theatre']):
        return ("Vocabulary & Daily Functions", "Hobbies, Sports, Music, Art & Entertainment")

    # 12. VOCABULARY & FUNCTIONS: Environment, Technology & Science
    if any(k in t for k in ['wheelchair ramp', 'disabled', 'homeless', 'refugee', 'animal rights', 'illegal', 'renewable energy', 'solar panel', 'global warming', 'gadget', 'smartphone', 'internet', 'recycle']):
        return ("Vocabulary & Daily Functions", "Environment, Social Issues, Human Rights & Technology")

    # Fallback by course level
    if ders in ['İNGİLİZCE – 1', 'İNGİLİZCE – 2']:
        return ("Tenses & Time Expressions", "Present Tenses (Simple Present & Continuous) & Routines")
    elif ders in ['İNGİLİZCE – 3', 'İNGİLİZCE – 4']:
        return ("Grammar & Structures", "Modals & Semi-Modals (Can, Could, Should, Must, Have to)")
    elif ders in ['İNGİLİZCE – 5', 'İNGİLİZCE – 6']:
        return ("Tenses & Time Expressions", "Past Tenses (Simple Past, Past Continuous, Past Perfect) & Used To")
    else:
        return ("Grammar & Structures", "Conditionals (If Clauses Type 1, 2, 3) & Wish Clauses")

def main():
    print("=" * 60)
    print("🇬🇧 İNGİLİZCE (İngilizce 1 - 8) İŞLEME VE ANALİZ MOTORU")
    print("=" * 60)

    with open('ciktilar/tum_sorular.json', 'r', encoding='utf-8') as f:
        all_raw = json.load(f)

    ing_raw = [q for q in all_raw if 'İNGİLİZCE' in q.get('ders', '').upper()]
    print(f"Toplam seçilen zorunlu İngilizce sorusu: {len(ing_raw)}")

    processed_questions = []
    course_counts = Counter()

    for q in ing_raw:
        qid = q['id']
        ders_std = q['ders'].strip()
        # Normalise hyphen if needed
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
    out_path = 'ciktilar/analiz/ingilizce_analizli_sorular_temiz.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(processed_questions, f, ensure_ascii=False, indent=2)
    print(f"✅ {out_path} dosyasına {len(processed_questions)} temiz soru yazıldı.")

    # Kesişim Analizi
    topic_map = {}
    for q in processed_questions:
        sub = q['alt_konu']
        ak = q['ana_konu']
        if sub not in topic_map:
            topic_map[sub] = {
                'ana_konu': ak,
                'count': 0,
                'courses': Counter()
            }
        topic_map[sub]['count'] += 1
        topic_map[sub]['courses'][q['ders']] += 1

    intersections = [t for t in topic_map.values() if len(t['courses']) > 1]
    intersections.sort(key=lambda x: x['count'], reverse=True)

    print("\n" + "=" * 60)
    print(f"🎯 İNGİLİZCE KADEMELERİ ARASI KESİŞİM KÜMELERİ ({len(intersections)} Kesişen Alt Konu)")
    print("=" * 60)

    for idx, item in enumerate(intersections, 1):
        c_details = ", ".join([f"{c.replace('İNGİLİZCE – ', 'İNG-')}: {cnt}" for c, cnt in sorted(item['courses'].items())])
        sub_name = [k for k, v in topic_map.items() if v == item][0]
        print(f"{idx}. ÜNİTE: {item['ana_konu']}")
        print(f"   ► Alt Konu: {sub_name}")
        print(f"   ► Toplam: {item['count']} soru | Dağılım: [{c_details}]")
        print()

if __name__ == '__main__':
    main()
