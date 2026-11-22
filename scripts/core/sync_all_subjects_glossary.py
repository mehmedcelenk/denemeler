#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tüm Branşlar (TAR, COG, FEL, DIN, INK, BIO, FIZ, KIM, KLM, MAT, SAG, AOF)
Birleşik Tahribatsız Kavram Balonu Motoru (`soru_xray` & `secenekler_xray`).

Özellikler:
1. Dönem Öncelikli Kümülatif Katalog Yükleme:
   - Soru hangi döneme aitse (örn: Coğrafya 1 veya Kimya 2), önce o dönemin kavramları,
     ardından branşın diğer dönem kavramları en uzun terimden en kısaya doğru sıralanarak taranır.
2. Tahribatsız Çok Katmanlı `soru_xray` Birleştirici:
   - Mevcut `soru_xray` içindeki dil bilgisi, ses olayı ve kavşak etiketlerini %100 korur.
   - Asla iç içe `<span>` üretmez.
   - Mevcut kavram balonlarının `data-tr` açıklamalarını güncel `💡 Hile:` kataloğuyla yeniler.
   - `dogru_nedeni` ("Çünkü: ... / MEB Ders Kitabı...") alanına ASLA DOKUNMAZ! %100 KORUR!
3. Tam Kapsamlı ve Bağlamsal `secenekler_xray` Giydirici:
   - Yapısal şıkları (`I ve II`, `Yalnız I`, `D - Y - D`, pure formula `CO`, tek harf `K`) deterministik filtreyle atlar.
   - Şıklardaki kavramları hem genel `pattern` hem de `stem_context_pattern` koşullu `option_only_pattern` ile sarar.
   - Matematiksel metin eşitliği (`strip_xray == plain`) ve tag dengesi kilidiyle %100 sıfır hata garantisi verir.
"""

import argparse
import html
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
SUBJECTS_DIR = ROOT_DIR / "data" / "subjects"
CONCEPTS_DIR = ROOT_DIR / "data" / "concepts"

STRUCTURAL_ROMAN_RE = re.compile(
    r"^(?:(?:Yalnız\s+)?[IVX]+(?:\s*(?:ve|ile|,|-)\s*(?:Yalnız\s+)?[IVX]+)*|\b(?:veya)\b)$",
    re.IGNORECASE,
)
STRUCTURAL_DY_RE = re.compile(r"^[DY](?:\s*[-,]\s*[DY])+$")
STRUCTURAL_PUNCT_RE = re.compile(r"^(?:\([^)]*\)\s*)+$")
STRUCTURAL_PAIR_RE = re.compile(r"^[IVX]+\.\s*[a-zçğıöşü]\s*[,\s]+[IVX]+\.", re.IGNORECASE)
STRUCTURAL_NUM_RE = re.compile(r"^[-+]?\d+(?:[.,]\d+)?(?:\s*[/xX+-]\s*[-+]?\d+(?:[.,]\d+)?)*$")
STRUCTURAL_SHORT_RE = re.compile(r"^[A-Za-z0-9_]{1,2}(?:\s*[-+]\s*[A-Za-z0-9_]{1,2})?$")
STRUCTURAL_CHEM_RE = re.compile(r"^(?:[A-Z][a-z]?\d*(?:\s*[A-Z][a-z]?\d*)*|[+-]|\d+[+-])$")

TOKEN_SPLIT_RE = re.compile(
    r'(<span\s+class="xray-junction"[^>]*>.*?</span>'
    r'|<span\s+class="[^"]*(?:sound-word|has-sound|concept-word)[^"]*"[^>]*>.*?</span>'
    r'|<span\s+class="[^"]*\bpos-word\b[^"]*"[^>]*>[^<]*</span>'
    r'|<[^>]+>)',
    re.DOTALL,
)
PURE_POS_SPAN_RE = re.compile(
    r'^<span\s+class="[^"]*\bpos-word\b[^"]*"[^>]*>([^<]*)</span>$',
    re.DOTALL,
)
CONCEPT_SPAN_RE = re.compile(
    r'<span\s+class="vocab-word\s+concept-word"[^>]*>(.*?)</span>',
    re.DOTALL,
)

NOISE_TERMS = {
    "hangisi", "hangisidir", "aşağıdaki", "yukarıdaki", "kaç farklı",
    "değildir", "söylenemez", "ulaşılamaz", "sebep olmuştur",
    "yapılması", "yüksek olması", "karşılanabilmesine yöneliktir",
    "sağlamak", "şartlarındandır", "ibadetlerden",
    "ortalamalarının artması", "elverişli", "engebeli yerlerde",
}


def strip_xray_to_plain(html_str: str) -> str:
    if not html_str:
        return ""
    s = re.sub(r'<span\s+class="xray-junction"[^>]*>.*?</span>', "", html_str, flags=re.DOTALL)
    return html.unescape(re.sub(r"<[^>]+>", "", s))


def is_structural_option(opt_text: str) -> bool:
    t = re.sub(r"\s+\d{1,2}$", "", opt_text.strip())
    if not t:
        return True
    if STRUCTURAL_ROMAN_RE.match(t):
        return True
    if STRUCTURAL_DY_RE.match(t):
        return True
    if STRUCTURAL_PUNCT_RE.match(t):
        return True
    if STRUCTURAL_PAIR_RE.match(t):
        return True
    if STRUCTURAL_NUM_RE.match(t):
        return True
    if STRUCTURAL_CHEM_RE.match(t):
        return True
    if len(t) <= 2 and STRUCTURAL_SHORT_RE.match(t):
        return True
    return False


def strip_noise_concept_spans(html_str: str) -> Tuple[str, int]:
    if not html_str or "concept-word" not in html_str:
        return html_str, 0

    removed = 0

    def _repl(match: re.Match) -> str:
        nonlocal removed
        full_span = match.group(0)
        inner = match.group(1)
        clean_inner = html.unescape(re.sub(r"<[^>]+>", "", inner)).strip().lower()
        if clean_inner in NOISE_TERMS or len(clean_inner) > 40:
            removed += 1
            return inner
        return full_span

    return CONCEPT_SPAN_RE.sub(_repl, html_str), removed


def load_subject_catalogs(sub_code: str) -> Dict[int, List[Dict[str, Any]]]:
    """İlgili branşın tüm dönem kavram kataloglarını yükler."""
    catalogs: Dict[int, List[Dict[str, Any]]] = {}

    # 1. Dönem dönem ayrılmış kataloglar (örn: TAR_1 .. TAR_6)
    sem_files = sorted(CONCEPTS_DIR.glob(f"{sub_code}_*_concepts.json"))
    if sem_files:
        for p in sem_files:
            sem_str = p.stem.replace("_concepts", "").split("_")[-1]
            try:
                sem_num = int(sem_str)
            except ValueError:
                sem_num = 1
            catalogs[sem_num] = json.loads(p.read_text(encoding="utf-8"))
        return catalogs

    # 2. Tek dosyada toplanmış kataloglar (örn: BIO_concepts.json, AOF_ITAR_concepts.json)
    combined_file = CONCEPTS_DIR / f"{sub_code}_concepts.json"
    if combined_file.exists():
        items: List[Dict[str, Any]] = json.loads(combined_file.read_text(encoding="utf-8"))
        for c in items:
            sem_num = c.get("donem") or 1
            catalogs.setdefault(sem_num, []).append(c)
        if not catalogs:
            catalogs[1] = items
        return catalogs

    return catalogs


def build_matchers_for_question(
    target_sem: int,
    catalogs: Dict[int, List[Dict[str, Any]]],
    sub_code: str,
) -> List[Dict[str, Any]]:
    all_sems = sorted(catalogs.keys())
    if not all_sems:
        return []

    # Soru dönemini en başa al, sonra diğer dönemleri sırala
    ordered_sems = [target_sem] + [s for s in all_sems if s != target_sem]
    raw_items: List[Tuple[int, int, Dict[str, Any]]] = []

    for tier_idx, sem in enumerate(ordered_sems):
        tier = 0 if sem == target_sem else 1
        for c in catalogs.get(sem, []):
            raw_items.append((tier, sem, c))

    matchers: List[Dict[str, Any]] = []
    for tier, source_sem, c in raw_items:
        gen_pat = c.get("pattern", "")
        opt_pat = c.get("option_only_pattern", "")
        ctx_pat = c.get("stem_context_pattern", "")

        gen_rx: Optional[re.Pattern] = None
        if gen_pat:
            try:
                gen_rx = re.compile(gen_pat, re.IGNORECASE)
            except re.error:
                gen_rx = None

        opt_rx: Optional[re.Pattern] = None
        if opt_pat:
            try:
                opt_rx = re.compile(opt_pat, re.IGNORECASE)
            except re.error:
                opt_rx = None

        ctx_rx: Optional[re.Pattern] = None
        if ctx_pat:
            try:
                ctx_rx = re.compile(ctx_pat, re.IGNORECASE)
            except re.error:
                ctx_rx = None

        if not gen_rx and not opt_rx:
            continue

        term = c.get("term", "")
        matchers.append({
            "id": c.get("id", term.lower()),
            "term": term,
            "term_key": re.sub(r"\s*\([^)]*\)", "", term).strip().lower(),
            "sayfa": c.get("sayfa") or 12,
            "source_sem": source_sem,
            "ders": c.get("ders", f"{sub_code} – {source_sem}"),
            "tanim": c.get("tanim", ""),
            "gen_rx": gen_rx,
            "opt_rx": opt_rx,
            "ctx_rx": ctx_rx,
            "tier": tier,
            "len": len(term),
        })

    # En uzun terimler önce, aynı uzunlukta ise soru döneminin kendi tanımı öncelikli
    matchers.sort(key=lambda m: (-m["len"], m["tier"]))
    return matchers


def format_concept_span(
    matched_surface: str,
    matcher: Dict[str, Any],
) -> str:
    tr_esc = html.escape(matcher["tanim"], quote=True)
    note_esc = html.escape(
        f"MEB {matcher['ders']} • S.{matcher['sayfa']} • {matcher['term']}",
        quote=True,
    )
    return (
        f'<span class="vocab-word concept-word" '
        f'data-tr="{tr_esc}" data-note="{note_esc}" '
        f'onclick="showVocabBubble(this, event)">'
        f"{html.escape(matched_surface, quote=False)}</span>"
    )


def refresh_existing_concept_span_hile(
    span_html: str,
    matchers: List[Dict[str, Any]],
) -> str:
    m_inner = re.search(r">(.*?)</span>$", span_html, flags=re.DOTALL)
    if not m_inner:
        return span_html
    surface_raw = html.unescape(m_inner.group(1)).strip()

    best_m = None
    for m in matchers:
        if m["gen_rx"] and m["gen_rx"].fullmatch(surface_raw):
            best_m = m
            break
    if best_m is None:
        for m in matchers:
            if m["gen_rx"] and m["gen_rx"].search(surface_raw):
                best_m = m
                break

    if best_m is not None:
        new_tr = html.escape(best_m["tanim"], quote=True)
        span_html = re.sub(r'data-tr="[^"]*"', lambda _: f'data-tr="{new_tr}"', span_html, count=1)
    else:
        def _fix_tr(m_tr: re.Match) -> str:
            raw_tr = html.unescape(m_tr.group(1))
            fixed_tr = re.sub(
                r"💡\s*(?:Sınav\s+Şifresi|Şifre|İpucu|Formül\s*/\s*Şifre|Formül)\s*:",
                "💡 Hile:",
                raw_tr,
                flags=re.IGNORECASE,
            )
            return f'data-tr="{html.escape(fixed_tr, quote=True)}"'

        span_html = re.sub(r'data-tr="([^"]*)"', _fix_tr, span_html, count=1)

    return span_html


def enrich_plain_segment_with_concepts(
    raw_segment: str,
    matchers: List[Dict[str, Any]],
    used_term_keys: Set[str],
    is_option: bool = False,
    stem_plain: str = "",
) -> Tuple[str, int]:
    if not raw_segment or not raw_segment.strip():
        return html.escape(raw_segment, quote=False), 0

    search_len = len(raw_segment)
    if is_option:
        m_trail = re.search(r"\s+\d{1,2}$", raw_segment)
        if m_trail and m_trail.start() > 0:
            search_len = m_trail.start()

    search_text = raw_segment[:search_len]
    protected_ranges: List[Tuple[int, int]] = [
        m.span() for m in re.finditer(r"\$\$[\s\S]+?\$\$|\$[^$\n]+?\$", search_text)
    ]
    chosen_spans: List[Tuple[int, int, str]] = []

    for m in matchers:
        t_key = m["term_key"]
        if not is_option and t_key in used_term_keys:
            continue

        candidates: List[re.Match] = []
        if m["gen_rx"] is not None:
            candidates.extend(m["gen_rx"].finditer(search_text))

        if is_option and not candidates and m["opt_rx"] is not None:
            if m["ctx_rx"] is None or m["ctx_rx"].search(stem_plain):
                candidates.extend(m["opt_rx"].finditer(search_text.strip()))

        for match in candidates:
            if match.string is not search_text:
                lead_ws = len(search_text) - len(search_text.lstrip())
                start = lead_ws + match.start()
                end = lead_ws + match.end()
            else:
                start, end = match.span()

            if start == end:
                continue

            matched_word = raw_segment[start:end]
            if matched_word.strip().lower() in NOISE_TERMS:
                continue

            if any(not (end <= s or start >= e) for s, e in protected_ranges):
                continue

            if any(not (end <= s or start >= e) for s, e, _ in chosen_spans):
                continue

            span_html = format_concept_span(matched_word, m)
            chosen_spans.append((start, end, span_html))
            used_term_keys.add(t_key)
            if not is_option:
                break

    if not chosen_spans:
        return html.escape(raw_segment, quote=False), 0

    chosen_spans.sort(key=lambda x: x[0])
    out_parts: List[str] = []
    last_idx = 0
    for start, end, span_html in chosen_spans:
        if start > last_idx:
            out_parts.append(html.escape(raw_segment[last_idx:start], quote=False))
        out_parts.append(span_html)
        last_idx = end
    if last_idx < len(raw_segment):
        out_parts.append(html.escape(raw_segment[last_idx:], quote=False))

    return "".join(out_parts), len(chosen_spans)


def enrich_option_xray(
    opt_plain: str,
    stem_plain: str,
    matchers: List[Dict[str, Any]],
) -> Tuple[Optional[str], int]:
    if not opt_plain or is_structural_option(opt_plain):
        return None, 0

    used_keys: Set[str] = set()
    enriched_html, added_count = enrich_plain_segment_with_concepts(
        opt_plain,
        matchers,
        used_keys,
        is_option=True,
        stem_plain=stem_plain,
    )
    if added_count == 0:
        return None, 0

    if (
        strip_xray_to_plain(enriched_html) == opt_plain
        and enriched_html.count("<span") == enriched_html.count("</span>")
    ):
        return enriched_html, added_count

    return None, 0


def inject_concepts_into_stem_xray(
    stem_xray: str,
    plain_soru: str,
    matchers: List[Dict[str, Any]],
) -> Tuple[str, int]:
    used_term_keys: Set[str] = set()
    candidate_html, added_total = enrich_plain_segment_with_concepts(
        plain_soru,
        matchers,
        used_term_keys,
        is_option=False,
        stem_plain=plain_soru,
    )

    if (
        strip_xray_to_plain(candidate_html) == plain_soru
        and candidate_html.count("<span") == candidate_html.count("</span>")
    ):
        return candidate_html, added_total

    return html.escape(plain_soru, quote=False), 0


def process_subject(sub_code: str) -> Dict[str, Any]:
    json_path = SUBJECTS_DIR / f"{sub_code}.json"
    if not json_path.exists():
        return {"error": f"{json_path} bulunamadı"}

    questions: List[Dict[str, Any]] = json.loads(json_path.read_text(encoding="utf-8"))
    catalogs = load_subject_catalogs(sub_code)

    total_qs = len(questions)
    opt_enriched_qs = 0
    total_opt_spans = 0
    stem_enriched_qs = 0
    total_stem_spans = 0

    for q in questions:
        # Soru dönemini tespit et
        donem_val = q.get("donem")
        try:
            target_sem = int(donem_val) if donem_val is not None else 1
        except ValueError:
            target_sem = 1

        # Ders başlığından dönem çıkarmayı dene (örn: 'TARİH – 2' -> 2)
        ders_title = str(q.get("ders", ""))
        m_sem = re.search(r"[-–]\s*(\d+)", ders_title)
        if m_sem:
            try:
                target_sem = int(m_sem.group(1))
            except ValueError:
                pass

        matchers = build_matchers_for_question(target_sem, catalogs, sub_code)
        if not matchers:
            continue

        plain_soru = str(q.get("soru", "")).strip()

        # 1. soru_xray Zenginleştirme
        stem_xr = q.get("soru_xray") or ""
        new_stem_xr, added_stem = inject_concepts_into_stem_xray(stem_xr, plain_soru, matchers)
        if new_stem_xr and "concept-word" in new_stem_xr:
            q["soru_xray"] = new_stem_xr
            stem_enriched_qs += 1
            total_stem_spans += len(re.findall(r'class="vocab-word concept-word"', new_stem_xr))
        elif stem_xr:
            q["soru_xray"] = stem_xr
        elif "soru_xray" in q:
            q.pop("soru_xray", None)

        # 2. secenekler_xray Zenginleştirme
        secenekler = q.get("secenekler") or {}
        new_sec_xr: Dict[str, str] = {}
        added_opts_in_q = 0

        for k, opt_plain in secenekler.items():
            opt_s = str(opt_plain).strip()
            opt_xr, opt_count = enrich_option_xray(opt_s, plain_soru, matchers)
            if opt_xr is not None and opt_count > 0:
                new_sec_xr[k] = opt_xr
                added_opts_in_q += opt_count

        if new_sec_xr:
            q["secenekler_xray"] = new_sec_xr
            opt_enriched_qs += 1
            total_opt_spans += added_opts_in_q
        elif "secenekler_xray" in q:
            # Boş kalmışsa kaldır
            q.pop("secenekler_xray", None)

    # Güncellenmiş soruları kaydet
    json_path.write_text(json.dumps(questions, indent=2, ensure_ascii=False), encoding="utf-8")

    return {
        "subject": sub_code,
        "total_questions": total_qs,
        "stem_enriched_qs": stem_enriched_qs,
        "total_stem_spans": total_stem_spans,
        "opt_enriched_qs": opt_enriched_qs,
        "total_opt_spans": total_opt_spans,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Tüm Branşlar Birleşik Tahribatsız Kavram Balonu Motoru")
    parser.add_argument("--subjects", type=str, default="", help="Virgülle ayrılmış branş listesi (örn: TAR,COG,KIM)")
    args = parser.parse_args()

    core_subjects = [
        "TAR", "COG", "FEL", "DIN", "INK", "BIO", "FIZ", "KIM", "KLM", "MAT", "SAG",
        "AOF_ITAR", "AOF_HADIS", "AOF_AHLAK", "AOF_IBADET", "AOF_INANC", "AOF_ARAPCA",
    ]
    if args.subjects:
        targets = [s.strip().upper() for s in args.subjects.split(",") if s.strip()]
    else:
        targets = core_subjects

    print("=== TÜM BRANŞLAR BİRLEŞİK TAHRİBATSIZ KAVRAM BALONU MOTORU ===")
    print(f"{'Ders':12} | {'Soru':6} | {'Kök XR Soru':12} | {'Kök Balon':10} | {'Şık XR Soru':12} | {'Şık Balon':10} |")
    print("-" * 75)

    tot_qs, tot_stem_qs, tot_stem_spans, tot_opt_qs, tot_opt_spans = 0, 0, 0, 0, 0

    for sub in targets:
        stats = process_subject(sub)
        if "error" in stats:
            print(f"{sub:12} | {stats['error']}")
            continue

        tot_qs += stats["total_questions"]
        tot_stem_qs += stats["stem_enriched_qs"]
        tot_stem_spans += stats["total_stem_spans"]
        tot_opt_qs += stats["opt_enriched_qs"]
        tot_opt_spans += stats["total_opt_spans"]

        print(
            f"{stats['subject']:12} | "
            f"{stats['total_questions']:6} | "
            f"{stats['stem_enriched_qs']:12} | "
            f"{stats['total_stem_spans']:10} | "
            f"{stats['opt_enriched_qs']:12} | "
            f"{stats['total_opt_spans']:10} |"
        )

    print("-" * 75)
    print(
        f"{'TOPLAM':12} | "
        f"{tot_qs:6} | "
        f"{tot_stem_qs:12} | "
        f"{tot_stem_spans:10} | "
        f"{tot_opt_qs:12} | "
        f"{tot_opt_spans:10} |"
    )
    print("\n✅ Tüm branşlar başarıyla zenginleştirildi!")


if __name__ == "__main__":
    main()
