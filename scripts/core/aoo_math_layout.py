#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖO PDF Kelime Düzeyi Geometri, Kesir/Üs Birleştirme ve 2B Seçenek Ayrıştırıcı."""

import re
import subprocess
import lxml.etree
import lxml.html

SUPERSCRIPTS = str.maketrans('0123456789+-abxymn', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ᵃᵇˣʸᵐⁿ')

MM_CHAR_MAP = {
    'MMBinary': {'$': '·', '#': '·', "'": ':', '|': '/', '3': '★', 'x': '◆'},
    'MMBinaryBold': {'$': '·', '#': '·', "'": ':', '|': '/', '3': '★', 'x': '◆'},
    'MMExtra': {'1': '<', '2': '>', '%': '', '&': ''},
    'MMExtraBold': {'1': '<', '2': '>', '%': '', '&': ''},
    'MMEtc': {'c': '°', 'Y': '▲', 'T': '■', '_': '●', '=': '='},
    'MMEtcBold': {'c': '°', 'Y': '▲', 'T': '■', '_': '●', '=': '='},
    'MMGreek': {'r': 'π'},
    'MMGreekBold': {'r': 'π'},
    'MMRelation': {'#': '≤', ',': '≅'},
    'MMRelationBold': {'#': '≤', ',': '≅'},
    'MMVariableA': {'a': '(', 'k': ')', 'd': '(', 'n': ')'},
    'MMVariableABold': {'a': '(', 'k': ')', 'd': '(', 'n': ')'},
    'MMVariableB': {'%': '', 'W': '', 'X': '', 'Y': ''},
    'MMVariableC': {'%': '', 'W': '', 'X': '', 'Y': ''},
    'MMaExtra': {'%': '', '&': ''},
}

MATH_TOKEN_RE = re.compile(r'^[0-9▲■●★◆xyabπ,\-+()²³⁴⁵⁶⁷⁸⁹⁰¹⁺⁻ᵃᵇˣʸ√]+$')

SQRT_FIXES = [
    (r'Alanı\s+24\s+cm²\s+olan', 'Alanı √24 cm² olan'),
    (r'\ba\s*=\s*2\s+ve\s+b\s*=\s*3\s+olduğuna\s+göre,\s*72\b', 'a = √2 ve b = √3 olduğuna göre, √72'),
    (r'\b56\s*\+\s*21\s*-\s*13\b', '√(56 + √(21 - √13))'),
    (r'\b18\s+sayısı\s+aşağıdakilerden\s+hangisiyle\s+çarpılırsa', '√18 sayısı aşağıdakilerden hangisiyle çarpılırsa'),
    (r'\b75\s+sayısı\s+aşağıdakilerden\s+hangisi\s+ile\s+çarpılırsa', '√75 sayısı aşağıdakilerden hangisi ile çarpılırsa'),
    (r'\bx\s*=\s*2\s+ve\s+y\s*=\s*3\s+olduğuna\s+göre,\s*108\b', 'x = √2 ve y = √3 olduğuna göre, √108'),
    (r'\ba\s*=\s*2\s+ve\s+b\s*=\s*5\s+olduğuna\s+göre,\s*160\b', 'a = √2 ve b = √5 olduğuna göre, √160'),
    (r'\ba\s*=\s*3\s+ve\s+b\s*=\s*5\s+olduğuna\s+göre,\s*135\b', 'a = √3 ve b = √5 olduğuna göre, √135'),
    (r'\b42\s*:\s*7\s+işleminin', '√42 : √7 işleminin'),
]


def extract_mm_nodes_by_page(pdf_path: str) -> dict:
    raw = subprocess.check_output(
        ['pdftohtml', '-nodrm', '-stdout', '-xml', '-i', '-f', '2', '-l', '23', pdf_path],
        stderr=subprocess.DEVNULL,
    )
    xml_start = raw.find(b'<?xml')
    if xml_start < 0:
        return {}
    root = lxml.etree.fromstring(raw[xml_start:])
    all_fonts = {f.get('id'): f.get('family', '').split('+')[-1] for f in root.xpath('//fontspec')}
    by_page = {}
    for p_idx, page in enumerate(root.xpath('//page')):
        pno = 2 + p_idx
        nodes = []
        for t in page.xpath('.//text'):
            fam = all_fonts.get(t.get('font'), '')
            if fam in MM_CHAR_MAP:
                txt = ''.join(t.itertext()).strip()
                if txt:
                    x = float(t.get('left', 0)) / 1.5
                    y = float(t.get('top', 0)) / 1.5
                    nodes.append((fam, x, y, txt))
        if nodes:
            by_page[pno] = nodes
    return by_page


def apply_mm_fixes_to_word(w: dict, mm_nodes: list) -> bool:
    for fam, mx, my, mtxt in mm_nodes:
        if not (w['xmin'] - 4.5 <= mx <= w['xmax'] + 4.5 and abs(w['ymin'] - my) < 6.5):
            continue
        cmap = MM_CHAR_MAP.get(fam, {})
        if mtxt not in cmap:
            continue
        rep = cmap[mtxt]
        txt = w['text']
        if txt == mtxt:
            w['text'] = rep
        elif txt == '(' + mtxt:
            w['text'] = '(' + rep
        elif mtxt == 'c' and txt.endswith('c') and txt[:-1].isdigit():
            w['text'] = txt[:-1] + rep
        elif txt in (mtxt + ',', mtxt + '}'):
            w['text'] = rep + txt[-1]
        if fam in ('MMVariableA', 'MMVariableABold') and (w['ymax'] - w['ymin']) > 18.0:
            yc = (w['ymin'] + w['ymax']) / 2.0
            w['ymin'] = yc - 6.8
            w['ymax'] = yc + 6.8
    return bool(w['text'])


def process_column_words(words: list) -> list:
    if not words:
        return []
    words.sort(key=lambda w: ((w['ymin'] + w['ymax']) / 2.0, w['xmin']))

    # 1. Coalesce split decimals (e.g. '0', ',', '76' -> '0,76') and touching coefficients ('3', 'x' -> '3x')
    merged = []
    i = 0
    while i < len(words):
        w = dict(words[i])
        while i + 1 < len(words):
            nxt = words[i + 1]
            same_y = abs(w['ymin'] - nxt['ymin']) < 2.5 and abs(w['ymax'] - nxt['ymax']) < 2.5
            gap = nxt['xmin'] - w['xmax']
            if same_y and -1.5 <= gap <= 2.2:
                if i + 2 < len(words) and nxt['text'] == ',':
                    w3 = words[i + 2]
                    if abs(w['ymin'] - w3['ymin']) < 2.5 and -1.5 <= (w3['xmin'] - nxt['xmax']) <= 2.4:
                        if w['text'].lstrip('-+(').isdigit() and w3['text'].rstrip(')').isdigit():
                            w['text'] = f"{w['text']},{w3['text']}"
                            w['xmax'] = w3['xmax']
                            i += 2
                            continue
                if gap <= 0.8 and w['text'].isdigit() and nxt['text'] in ('x', 'y', 'a', 'b'):
                    w['text'] = w['text'] + nxt['text']
                    w['xmax'] = nxt['xmax']
                    i += 1
                    continue
            break
        merged.append(w)
        i += 1
    words = merged

    # 2. Merge vertically stacked fractions (N / D)
    used_f = [False] * len(words)
    frac_merged = []
    for idx, w1 in enumerate(words):
        if used_f[idx]:
            continue
        w1_w = w1['xmax'] - w1['xmin']
        if w1_w < 38.0 and MATH_TOKEN_RE.match(w1['text']) and w1['text'] not in ('+', '-', ',', '(', ')'):
            best_j = -1
            best_dy = 999.0
            for j, w2 in enumerate(words):
                if idx == j or used_f[j]:
                    continue
                w2_w = w2['xmax'] - w2['xmin']
                if w2_w >= 38.0 or not MATH_TOKEN_RE.match(w2['text']) or w2['text'] in ('+', '-', ',', '(', ')'):
                    continue
                dy = w2['ymin'] - w1['ymin']
                if 7.8 <= dy <= 13.5:
                    ov = min(w1['xmax'], w2['xmax']) - max(w1['xmin'], w2['xmin'])
                    min_w = min(w1_w, w2_w)
                    if ov > max(0.4, min_w * 0.35):
                        if dy < best_dy:
                            best_dy = dy
                            best_j = j
            if best_j >= 0:
                w2 = words[best_j]
                used_f[best_j] = True
                yc = ((w1['ymin'] + w1['ymax']) / 2.0 + (w2['ymin'] + w2['ymax']) / 2.0) / 2.0
                frac_merged.append({
                    'xmin': min(w1['xmin'], w2['xmin']),
                    'xmax': max(w1['xmax'], w2['xmax']),
                    'ymin': yc - 6.8,
                    'ymax': yc + 6.8,
                    'text': f"{w1['text']}/{w2['text']}",
                })
                continue
        frac_merged.append(w1)

    return frac_merged


def group_words_into_lines(words: list) -> list:
    if not words:
        return []
    sorted_w = sorted(words, key=lambda w: ((w['ymin'] + w['ymax']) / 2.0, w['xmin']))
    lines = []
    for w in sorted_w:
        yc = (w['ymin'] + w['ymax']) / 2.0
        if lines and abs(yc - lines[-1]['yc']) <= 4.5:
            lines[-1]['words'].append(w)
            lines[-1]['xmin'] = min(lines[-1]['xmin'], w['xmin'])
            lines[-1]['xmax'] = max(lines[-1]['xmax'], w['xmax'])
            lines[-1]['ymin'] = min(lines[-1]['ymin'], w['ymin'])
            lines[-1]['ymax'] = max(lines[-1]['ymax'], w['ymax'])
            n = len(lines[-1]['words'])
            lines[-1]['yc'] = (lines[-1]['yc'] * (n - 1) + yc) / n
        else:
            lines.append({
                'xmin': w['xmin'],
                'xmax': w['xmax'],
                'ymin': w['ymin'],
                'ymax': w['ymax'],
                'yc': yc,
                'words': [w],
            })

    for ln in lines:
        ln['words'].sort(key=lambda w: w['xmin'])
        merged_line = []
        i = 0
        w_list = ln['words']
        while i < len(w_list):
            w = dict(w_list[i])
            if i + 1 < len(w_list):
                nxt = w_list[i + 1]
                gap = nxt['xmin'] - w['xmax']
                h1 = w['ymax'] - w['ymin']
                h2 = nxt['ymax'] - nxt['ymin']
                can_have_exp = (
                    re.search(r'(?:\d+|cm|mm|km|dm|m|[xyabk]|\))$', w['text'])
                    and not w['text'].endswith('.')
                )
                is_exp = (
                    can_have_exp
                    and -1.5 <= gap <= 3.8
                    and h2 < h1 * 0.88
                    and nxt['ymax'] < w['ymax'] - 1.2
                    and re.match(r'^(?:-?\d+|[abxymn])$', nxt['text'])
                )
                if is_exp:
                    w['text'] += nxt['text'].translate(SUPERSCRIPTS)
                    w['xmax'] = nxt['xmax']
                    i += 1
            merged_line.append(w)
            i += 1
        ln['words'] = merged_line

        parts = []
        for idx, w in enumerate(ln['words']):
            if idx > 0:
                prev = ln['words'][idx - 1]
                gap = w['xmin'] - prev['xmax']
                if gap <= 1.6 and (prev['text'] in ('(', '(-', '+(', '[') or w['text'] in (')', '),', ').', ']', ',') or w['text'].startswith(('²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁰', '⁻'))):
                    parts[-1] += w['text']
                    continue
            parts.append(w['text'])
        ln['text'] = ' '.join(parts).strip()
    return lines


def apply_sqrt_fixes(text: str) -> str:
    for pat, rep in SQRT_FIXES:
        text = re.sub(pat, rep, text)
    return text
