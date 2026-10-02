# -*- coding: utf-8 -*-
"""
AÖL İngilizce Cümle Röntgeni (Gelişmiş Cümle Bazlı 4 Temel Öge Ayrıştırıcısı)
Cümleleri pedagojik olarak ve cümle sınırlarını (. ? !) koruyarak 4 ana ögeye ayırır:
1. Özne (Subject): Mavi Alt Çizgi (#2563eb)
2. Yüklem (Verb): Kırmızı Alt Çizgi (#e11d48)
3. Nesne (Object & Complement): Yeşil Alt Çizgi (#059669)
4. Zarf Tümleci (Adverbial - Zaman/Yer/Durum): Amber Alt Çizgi (#d97706)
"""

import json
import re
from pathlib import Path

AUX_MODALS = {
    'am', 'is', 'are', 'was', 'were', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
    "isn't", "aren't", "wasn't", "weren't", "don't", "doesn't", "didn't",
    "can't", "couldn't", "won't", "wouldn't", "shouldn't", "mustn't"
}

WH_WORDS = {'where', 'what', 'when', 'who', 'whom', 'whose', 'why', 'how', 'which'}

GREETINGS = [
    'hello', 'hi', 'good morning', 'good afternoon', 'good evening', 'good night',
    'oh', 'well', 'excuse me', 'hey'
]

COMMON_VERBS = {
    'likes', 'like', 'liked', 'wants', 'want', 'wanted', 'goes', 'go', 'went', 'gone',
    'plays', 'play', 'played', 'lives', 'live', 'lived', 'works', 'work', 'worked',
    'studies', 'study', 'studied', 'reads', 'read', 'watches', 'watch', 'watched',
    'eats', 'eat', 'ate', 'eaten', 'drinks', 'drink', 'drank', 'drunk',
    'thinks', 'think', 'thought', 'knows', 'know', 'knew', 'known',
    'gives', 'give', 'gave', 'given', 'takes', 'take', 'took', 'taken',
    'makes', 'make', 'made', 'helps', 'help', 'helped', 'plans', 'plan', 'planned',
    'tells', 'tell', 'told', 'produces', 'produce', 'produced', 'deceives', 'deceive',
    'means', 'mean', 'meant', 'happens', 'happen', 'happened', 'starts', 'start', 'started',
    'established', 'establish', 'donate', 'donated', 'buys', 'buy', 'bought',
    'leaves', 'leave', 'left', 'catches', 'catch', 'caught', 'finds', 'find', 'found',
    'realizes', 'realize', 'realized', 'forgets', 'forget', 'forgot', 'forgotten',
    'misses', 'miss', 'missed', 'wears', 'wear', 'wore', 'worn', 'joins', 'join', 'joined',
    'visits', 'visit', 'visited', 'tries', 'try', 'tried', 'speaks', 'speak', 'spoke', 'spoken',
    'drives', 'drive', 'drove', 'driven', 'writes', 'write', 'wrote', 'written',
    'chooses', 'choose', 'chose', 'chosen', 'brings', 'bring', 'brought', 'sends', 'send', 'sent',
    'builds', 'build', 'built', 'meets', 'meet', 'met', 'spends', 'spend', 'spent',
    'pays', 'pay', 'paid', 'runs', 'run', 'ran', 'swims', 'swim', 'swam', 'swum',
    'sings', 'sing', 'sang', 'sung', 'sleeps', 'sleep', 'slept', 'keeps', 'keep', 'kept',
    'teaches', 'teach', 'taught', 'sells', 'sell', 'sold', 'breaks', 'break', 'broke', 'broken',
    'wins', 'win', 'won', 'loses', 'lose', 'lost', 'falls', 'fall', 'fell', 'fallen',
    'begins', 'begin', 'began', 'begun', 'becomes', 'become', 'became', 'grows', 'grow', 'grew', 'grown',
    'shows', 'show', 'showed', 'shown', 'prefers', 'prefer', 'preferred', 'enjoys', 'enjoy', 'enjoyed',
    'decides', 'decide', 'decided', 'hopes', 'hope', 'hoped', 'remembers', 'remember', 'remembered'
}

ADVERBIAL_PHRASES = [
    'at weekends', 'on weekdays', 'every day', 'every week', 'every year', 'every month',
    'in the morning', 'in the afternoon', 'in the evening', 'at night', 'at noon',
    'last week', 'last year', 'last night', 'last month', 'two days ago', 'three years ago',
    'next week', 'next year', 'next month', 'at home', 'at school', 'at work', 'at the party',
    'at the cinema', 'in the garden', 'in the park', 'in the library', 'in the classroom',
    'to school', 'to work', 'to the hospital', 'at the moment', 'for two hours',
    'on sundays', 'on mondays', 'on tuesdays', 'on wednesdays', 'on thursdays', 'on fridays', 'on saturdays',
    'in summer', 'in winter', 'in spring', 'in autumn', 'in fall', 'very much', 'a lot'
]

SINGLE_ADVERBS = {
    'yesterday', 'tomorrow', 'today', 'tonight', 'now', 'soon', 'recently', 'lately',
    'here', 'there', 'everywhere', 'nowhere', 'abroad',
    'quickly', 'slowly', 'carefully', 'easily', 'fluently', 'loudly', 'quietly',
    'hard', 'fast', 'successfully', 'extremely'
}

CONJUNCTIONS = [
    'because', 'so that', 'even though', 'although', 'in spite of', 'despite',
    'before', 'after', 'while', 'when', 'since', 'so', 'but', 'if', 'as'
]

def is_turkish_prompt_line(line):
    l = line.strip()
    if not l:
        return False
    if re.search(r'^(?:Bu|Buna|Metne|Metinde|Diyaloğa|Parçaya|Aşağıdaki|Aşağıdakilerden|Boşluğa|Cümlesini|Öğretmen|Yukarıdaki|Verilen|Tablo|Görsel|çıkarak)\b', l, re.IGNORECASE):
        return True
    if re.search(r'\b(?:hangisi|hangisinin|söylenemez|doğrudur|yanlıştır|getirilemez|getirilmelidir|uygundur|yoktur|vardır|hangisinden|hangisidir)\b', l, re.IGNORECASE):
        if not re.match(r'^[A-Z][a-zA-Z\s]{0,20}\s*:', l):
            return True
    return False

def clean_stem(text):
    if not text:
        return ''
    t = text.replace('\r', '')
    t = re.sub(r"[\u2018\u2019\u02BC\u00B4`]", "'", t)
    t = re.sub(r'([A-Za-z]+)\s*\n\s*:\s*', r'\1 : ', t)
    t = re.sub(r'([a-zA-ZğüşıöçĞÜŞİÖÇ]+)-\s*\n\s*([a-zA-ZğüşıöçĞÜŞİÖÇ]+)', r'\1\2', t)
    t = re.sub(r'(?:^|\n)([A-Za-z])\n([a-z]+)', r'\n\1\2', t)

    raw_lines = [l.strip() for l in t.split('\n') if l.strip()]
    if not raw_lines:
        return ''

    out_lines = []
    current_type = None
    current_buf = []

    def flush():
        nonlocal current_buf, current_type
        if current_buf:
            if current_type in ('tr_prompt', 'narrative', 'dialogue', 'bullet'):
                out_lines.append(' '.join(current_buf))
            else:
                out_lines.extend(current_buf)
            current_buf = []
            current_type = None

    for line in raw_lines:
        is_spk = bool(re.match(r'^[A-Z][a-zA-Z\s\.\'\-]{0,20}\s*:\s*', line))
        is_tr = is_turkish_prompt_line(line)
        is_bullet = bool(re.match(r'^[•\-\*]\s*', line))

        if is_tr:
            if current_type != 'tr_prompt':
                flush()
                current_type = 'tr_prompt'
            current_buf.append(line)
        elif is_spk:
            flush()
            current_type = 'dialogue'
            current_buf.append(line)
        elif is_bullet:
            flush()
            current_type = 'bullet'
            current_buf.append(line)
        else:
            if current_type in ('dialogue', 'tr_prompt', 'bullet'):
                current_buf.append(line)
            else:
                if current_type != 'narrative':
                    flush()
                    current_type = 'narrative'
                current_buf.append(line)

    flush()
    return '\n'.join(out_lines)

def split_obj_and_adv(obj_tokens):
    if not obj_tokens:
        return [], []
    for phrase in sorted(ADVERBIAL_PHRASES, key=lambda x: -len(x)):
        p_len = len(phrase.split())
        if len(obj_tokens) >= p_len:
            trailing_text = ' '.join(t.lower().strip("',.?!()") for t in obj_tokens[-p_len:])
            if trailing_text == phrase:
                return obj_tokens[:-p_len], obj_tokens[-p_len:]
    last_word = obj_tokens[-1].lower().strip("',.?!()")
    if last_word in SINGLE_ADVERBS:
        return obj_tokens[:-1], obj_tokens[-1:]
    return obj_tokens, []

def format_obj_adv_html(obj_tokens):
    real_obj, adv = split_obj_and_adv(obj_tokens)
    parts = []
    if real_obj:
        parts.append(f'<span class="xray-obj">{" ".join(real_obj)}</span>')
    if adv:
        parts.append(f'<span class="xray-adv">{" ".join(adv)}</span>')
    return (' ' + ' '.join(parts)) if parts else ''

def parse_simple_clause(clause):
    clause = clause.strip()
    if not clause:
        return ''

    # 1. Selamlaşma / Ünlem (Hello, Hi, Oh...)
    prefix_greeting = ''
    for g in GREETINGS:
        m = re.match(r'^(' + re.escape(g) + r'[\,\!])\s+', clause, re.IGNORECASE)
        if m:
            prefix_greeting = m.group(1) + ' '
            clause = clause[m.end():].strip()
            break

    tokens = clause.split()
    if not tokens:
        return prefix_greeting.strip()

    first_w = tokens[0].lower().strip("',.?!()")

    # 2. Öneri kalıbı: "How about ..."
    if first_w == 'how' and len(tokens) >= 2 and tokens[1].lower().strip("',.?!()") == 'about':
        verb_part = tokens[2] if len(tokens) >= 3 else ''
        rest_tokens = tokens[3:] if len(tokens) >= 4 else []
        res = f'{prefix_greeting}How about'
        if verb_part:
            res += f' <span class="xray-verb">{verb_part}</span>'
        if rest_tokens:
            res += format_obj_adv_html(rest_tokens)
        return res

    # 3. WH-Sorusu (Devrik Yapı): "Where are you from?", "What does Fred study?"
    if first_w in WH_WORDS and len(tokens) >= 3:
        second_w = tokens[1].lower().strip("',.?!()")
        if second_w in AUX_MODALS:
            wh_part = tokens[0]
            aux_part = tokens[1]
            subj_part = tokens[2]
            rest_tokens = tokens[3:]

            if rest_tokens:
                first_rest = rest_tokens[0].lower().strip("',.?!()")
                if first_rest in COMMON_VERBS or first_rest.endswith(('ing', 'ed')):
                    main_verb = rest_tokens[0]
                    obj_adv_html = format_obj_adv_html(rest_tokens[1:])
                    return f'{prefix_greeting}{wh_part} <span class="xray-verb">{aux_part}</span> <span class="xray-sub">{subj_part}</span> <span class="xray-verb">{main_verb}</span>{obj_adv_html}'

            obj_adv_html = format_obj_adv_html(rest_tokens) if rest_tokens else ''
            return f'{prefix_greeting}{wh_part} <span class="xray-verb">{aux_part}</span> <span class="xray-sub">{subj_part}</span>{obj_adv_html}'

    # 4. Yes/No Sorusu (Devrik Yapı): "Is this your book?", "Can you tell me...?"
    if first_w in AUX_MODALS and len(tokens) >= 2:
        aux_part = tokens[0]
        subj_part = tokens[1]
        rest_tokens = tokens[2:]
        if rest_tokens:
            first_rest = rest_tokens[0].lower().strip("',.?!()")
            if first_rest in COMMON_VERBS or first_rest.endswith(('ing', 'ed')):
                main_verb = rest_tokens[0]
                obj_adv_html = format_obj_adv_html(rest_tokens[1:])
                return f'{prefix_greeting}<span class="xray-verb">{aux_part}</span> <span class="xray-sub">{subj_part}</span> <span class="xray-verb">{main_verb}</span>{obj_adv_html}'

        obj_adv_html = format_obj_adv_html(rest_tokens) if rest_tokens else ''
        return f'{prefix_greeting}<span class="xray-verb">{aux_part}</span> <span class="xray-sub">{subj_part}</span>{obj_adv_html}'

    # 5. 'Let\'s' yapısı
    if first_w == "let's":
        if len(tokens) >= 2:
            obj_adv_html = format_obj_adv_html(tokens[2:]) if len(tokens) > 2 else ''
            return f'{prefix_greeting}<span class="xray-sub">{tokens[0]}</span> <span class="xray-verb">{tokens[1]}</span>{obj_adv_html}'

    # 6. Standart Cümle: Özne sınırını tespit et (sub_end)
    sub_end = 1
    if len(tokens) >= 3 and tokens[1].lower() == 'and':
        sub_end = 4 if (len(tokens) >= 4 and tokens[2].lower() in {'his', 'her', 'my', 'the', 'their', 'our'}) else 3
    elif len(tokens) >= 3 and tokens[0][0].isupper() and tokens[1][0].isupper() and tokens[1].lower().strip("',.?!()") not in AUX_MODALS and tokens[1].lower().strip("',.?!()") not in COMMON_VERBS:
        sub_end = 2
    elif first_w in {'the', 'a', 'an', 'my', 'your', 'his', 'her', 'our', 'their', 'this', 'that', 'these', 'those', 'many', 'some', 'all'}:
        if len(tokens) > 2 and tokens[1].lower().strip("',.?!()") not in AUX_MODALS and tokens[1].lower().strip("',.?!()") not in COMMON_VERBS:
            if len(tokens) >= 6 and tokens[2].lower() in {'in', 'on', 'at', 'with', 'from', 'of'}:
                for idx in range(3, min(7, len(tokens))):
                    w = tokens[idx].lower().strip("',.?!()")
                    if w in AUX_MODALS or w in COMMON_VERBS:
                        sub_end = idx
                        break
                else:
                    sub_end = 2
            else:
                sub_end = 2

    subj_tokens = tokens[:sub_end]
    rest = tokens[sub_end:]
    if not rest:
        return f'{prefix_greeting}<span class="xray-sub">{" ".join(subj_tokens)}</span>'

    # Yüklem sınırını tespit et (verb_end)
    verb_end = 1
    first_rest = rest[0].lower().strip("',.?!()")

    if len(rest) >= 3 and rest[0].lower() == 'used' and rest[1].lower() == 'to':
        verb_end = 3
    elif len(rest) >= 2 and rest[0].lower() == 'would' and rest[1].lower() == 'rather':
        verb_end = 2
    elif first_rest in {'always', 'often', 'usually', 'rarely', 'never', 'hardly'} and len(rest) > 1:
        verb_end = 2
    elif first_rest in AUX_MODALS:
        if len(rest) > 1 and rest[1].lower() in {'not', "n't"}:
            verb_end = min(3, len(rest))
        elif len(rest) > 1 and (rest[1].lower() in COMMON_VERBS or rest[1].lower().endswith(('ing', 'ed'))):
            verb_end = 2
    elif rest[0] == '- - - -' and len(rest) > 1:
        verb_end = 1

    verb_tokens = rest[:verb_end]
    obj_tokens = rest[verb_end:]

    sub_html = f'<span class="xray-sub">{" ".join(subj_tokens)}</span>'
    verb_html = f'<span class="xray-verb">{" ".join(verb_tokens)}</span>'
    obj_adv_html = format_obj_adv_html(obj_tokens)

    return f'{prefix_greeting}{sub_html} {verb_html}{obj_adv_html}'

def parse_full_sentence(sent):
    sent = sent.strip()
    if not sent:
        return ''
    conn_pattern = r'\b(' + '|'.join(CONJUNCTIONS) + r')\b'
    parts = re.split(conn_pattern, sent, flags=re.IGNORECASE)

    res = []
    i = 0
    while i < len(parts):
        chunk = parts[i].strip()
        if not chunk:
            i += 1
            continue
        if chunk.lower() in CONJUNCTIONS:
            res.append(chunk)
        else:
            res.append(parse_simple_clause(chunk))
        i += 1
    return ' '.join(res)

def parse_line_xray(line):
    line = line.strip()
    if not line:
        return ''
    if is_turkish_prompt_line(line):
        return f'<div class="xray-prompt">{line}</div>'

    bullet_prefix = ''
    m_bullet = re.match(r'^([•\-\*]\s*)', line)
    if m_bullet:
        bullet_prefix = m_bullet.group(1)
        line = line[m_bullet.end():].strip()

    speaker_html = ''
    m_spk = re.match(r'^([A-Z][a-zA-Z\s\.\'\-]{0,20})\s*:\s*', line)
    if m_spk:
        speaker_html = f'<span class="xray-speaker">{m_spk.group(1)} :</span> '
        line = line[m_spk.end():].strip()

    sents = re.findall(r'[^.?!]+(?:[.?!]+|$)', line)
    parsed_sents = []
    for s in sents:
        s_str = s.strip()
        if s_str:
            parsed_sents.append(parse_full_sentence(s_str))

    return bullet_prefix + speaker_html + ' '.join(parsed_sents)

def generate_xray_html(stem_text):
    cleaned = clean_stem(stem_text)
    lines = cleaned.split('\n')
    parsed_lines = []
    for line in lines:
        line_s = line.strip()
        if not line_s:
            continue
        parsed_lines.append(parse_line_xray(line_s))
    return '\n'.join(parsed_lines)

def main():
    ing_path = Path('data/subjects/ING.json')
    if not ing_path.exists():
        print('Error: data/subjects/ING.json not found.')
        return

    with open(ing_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    print(f'Generating advanced sentence-bounded syntax underlines for {len(questions)} questions...')
    for q in questions:
        q['soru'] = clean_stem(q.get('soru', ''))
        q['soru_xray'] = generate_xray_html(q['soru'])

    with open(ing_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f'Successfully updated soru_xray for all {len(questions)} questions!')

if __name__ == '__main__':
    main()
