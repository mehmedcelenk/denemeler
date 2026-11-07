#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""YKS Ayrıştırıcı Çalıştırıcı ve Manifest Güncelleyici."""

import json
import re
import subprocess
from pathlib import Path
from typing import Dict, Any, List

from yks_parser import parse_subject_stream, ROOT_DIR, PDF_DIR, OUT_DIR, next_id
from yks_parser_answers import extract_answers_from_pages, normalize_subject_answer_key

MANIFEST_PATH = ROOT_DIR / "src" / "data" / "generated" / "subjectManifest.json"

SUBJECT_CONFIGS = [
    # TYT Dersleri (CS_TYT_2018_2026.pdf ve CS_DIIN_TYT_2018_2026.pdf)
    {
        "id": "TYT_TURKCE",
        "file": "CS_TYT_2018_2026.pdf",
        "pages": (13, 147),
        "ans_pages": (406, 410),
        "ans_key": "TÜRKÇE",
        "name": "TYT TÜRKÇE",
        "sinav": "TYT"
    },
    {
        "id": "TYT_TAR",
        "file": "CS_TYT_2018_2026.pdf",
        "pages": (151, 162),
        "ans_pages": (406, 410),
        "ans_key": "TARIH",
        "name": "TYT TARİH",
        "sinav": "TYT"
    },
    {
        "id": "TYT_COG",
        "file": "CS_TYT_2018_2026.pdf",
        "pages": (165, 178),
        "ans_pages": (406, 410),
        "ans_key": "COGRAFYA",
        "name": "TYT COĞRAFYA",
        "sinav": "TYT"
    },
    {
        "id": "TYT_FEL",
        "file": "CS_TYT_2018_2026.pdf",
        "pages": (181, 219),
        "ans_pages": (406, 410),
        "ans_key": "FELSEFE",
        "name": "TYT FELSEFE",
        "sinav": "TYT"
    },
    {
        "id": "TYT_MAT",
        "file": "CS_TYT_2018_2026.pdf",
        "pages": (222, 336),
        "ans_pages": (406, 410),
        "ans_key": "MATEMATİK",
        "name": "TYT MATEMATİK",
        "sinav": "TYT"
    },
    {
        "id": "TYT_FIZ",
        "file": "CS_TYT_2018_2026.pdf",
        "pages": (339, 366),
        "ans_pages": (406, 410),
        "ans_key": "FİZİK",
        "name": "TYT FİZİK",
        "sinav": "TYT"
    },
    {
        "id": "TYT_KIM",
        "file": "CS_TYT_2018_2026.pdf",
        "pages": (369, 385),
        "ans_pages": (406, 410),
        "ans_key": "KİMYA",
        "name": "TYT KİMYA",
        "sinav": "TYT"
    },
    {
        "id": "TYT_BIO",
        "file": "CS_TYT_2018_2026.pdf",
        "pages": (388, 405),
        "ans_pages": (406, 410),
        "ans_key": "BIYOLOJI",
        "name": "TYT BİYOLOJİ",
        "sinav": "TYT"
    },
    {
        "id": "TYT_DIN",
        "file": "CS_DIIN_TYT_2018_2026.pdf",
        "pages": (13, 32),
        "ans_pages": (33, 33),
        "ans_key": "DİN",
        "name": "TYT DİN KÜLTÜRÜ",
        "sinav": "TYT"
    },
    # AYT Sayısal (CS_AYT_SAY_2018_2026.pdf)
    {
        "id": "AYT_MAT",
        "file": "CS_AYT_SAY_2018_2026.pdf",
        "pages": (14, 111),
        "ans_pages": (232, 235),
        "ans_key": "MATEMATİK",
        "name": "AYT MATEMATİK",
        "sinav": "AYT"
    },
    {
        "id": "AYT_FIZ",
        "file": "CS_AYT_SAY_2018_2026.pdf",
        "pages": (114, 161),
        "ans_pages": (232, 235),
        "ans_key": "FIZIK",
        "name": "AYT FİZİK",
        "sinav": "AYT"
    },
    {
        "id": "AYT_KIM",
        "file": "CS_AYT_SAY_2018_2026.pdf",
        "pages": (164, 193),
        "ans_pages": (232, 235),
        "ans_key": "KIMYA",
        "name": "AYT KİMYA",
        "sinav": "AYT"
    },
    {
        "id": "AYT_BIO",
        "file": "CS_AYT_SAY_2018_2026.pdf",
        "pages": (196, 231),
        "ans_pages": (232, 235),
        "ans_key": "BIYOLOJI",
        "name": "AYT BİYOLOJİ",
        "sinav": "AYT"
    },
    # AYT Eşit Ağırlık & Sözel
    {
        "id": "AYT_EDB",
        "file": "CS_AYT_EA_2018_2026.pdf",
        "pages": (13, 85),
        "ans_pages": (228, 230),
        "ans_key": "GENEL",
        "name": "AYT TÜRK DİLİ VE EDEBİYATI",
        "sinav": "AYT"
    },
    {
        "id": "AYT_TAR1",
        "file": "CS_AYT_EA_2018_2026.pdf",
        "pages": (88, 108),
        "ans_pages": (228, 230),
        "ans_key": "TARIH-1",
        "name": "AYT TARİH-1",
        "sinav": "AYT"
    },
    {
        "id": "AYT_COG1",
        "file": "CS_AYT_EA_2018_2026.pdf",
        "pages": (111, 124),
        "ans_pages": (228, 230),
        "ans_key": "COĞRAFYA-1",
        "name": "AYT COĞRAFYA-1",
        "sinav": "AYT"
    },
    {
        "id": "AYT_TAR2",
        "file": "CS_AYT_SOZ_2018_2026.pdf",
        "pages": (127, 149),
        "ans_pages": (246, 250),
        "ans_key": "TARIH-2",
        "name": "AYT TARİH-2",
        "sinav": "AYT"
    },
    {
        "id": "AYT_COG2",
        "file": "CS_AYT_SOZ_2018_2026.pdf",
        "pages": (152, 176),
        "ans_pages": (246, 250),
        "ans_key": "COĞRAFYA-2",
        "name": "AYT COĞRAFYA-2",
        "sinav": "AYT"
    },
    {
        "id": "AYT_FEL",
        "file": "CS_AYT_SOZ_2018_2026.pdf",
        "pages": (179, 245),
        "ans_pages": (246, 250),
        "ans_key": "FELSEFE",
        "name": "AYT FELSEFE GRUBU",
        "sinav": "AYT"
    },
    {
        "id": "AYT_DIN",
        "file": "CS_AYT_DIIN_SOZ_2018_2026.pdf",
        "pages": (14, 32),
        "ans_pages": (33, 33),
        "ans_key": "DİN",
        "name": "AYT DİN KÜLTÜRÜ",
        "sinav": "AYT"
    }
]


def parse_ydt_special() -> List[Dict[str, Any]]:
    """YDT İNGİLİZCE kitabını 12 alt bölümüyle birlikte ayrıştırır."""
    pdf_path = str(PDF_DIR / "CS_YDT_2018_2026.pdf")
    raw_ans = subprocess.check_output(f'pdftotext -f 252 -l 255 "{pdf_path}" -', shell=True).decode('utf-8', errors='ignore')
    sections = [
        ('VOCABULARY', 13, 19),
        ('GRAMMAR', 20, 35),
        ('CLOZE TEST', 36, 44),
        ('SENTENCE COMPLETION', 45, 62),
        ('PARAGRAPH COMPREHENSION', 63, 107),
        ('DIALOGUE COMPLETION', 108, 129),
        ('RESTATEMENT', 130, 150),
        ('SITUATION', 151, 164),
        ('PARAGRAPH COMPLETION', 165, 186),
        ('TRANSLATION (ENG.-TUR.)', 187, 212),
        ('TRANSLATION (TUR.-ENG.)', 213, 239),
        ('IRRELEVANT SENTENCE', 240, 251)
    ]

    sec_names = [s[0] for s in sections]
    pattern = '(' + '|'.join(re.escape(s) for s in sec_names) + ')'
    parts = re.split(pattern, raw_ans)
    sec_ans: Dict[str, Dict[int, str]] = {}
    curr_sec = None

    for p in parts:
        p_s = p.strip()
        if p_s in sec_names:
            curr_sec = p_s
            sec_ans[curr_sec] = {}
        elif curr_sec:
            pairs = re.findall(r'(\d+)\.\s*([A-E])', p)
            for num, opt in pairs:
                sec_ans[curr_sec][int(num)] = opt

    ydt_questions: List[Dict[str, Any]] = []
    for sec_name, p_start, p_end in sections:
        ans_dict = sec_ans.get(sec_name, {})
        qs = parse_subject_stream(
            pdf_path=pdf_path,
            start_page=p_start,
            end_page=p_end,
            ans_key=ans_dict,
            course_name="YDT İNGİLİZCE",
            sinav_adi="YDT"
        )
        for q in qs:
            q["ana_konu"] = sec_name
        ydt_questions.extend(qs)

    return ydt_questions


def run():
    print("=== YKS Parser Başlatılıyor (TYT + AYT + YDT) ===")
    manifest = {}
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            manifest = json.load(f)

    answer_cache: Dict[str, Dict[str, Dict[int, str]]] = {}

    for cfg in SUBJECT_CONFIGS:
        pdf_path = str(PDF_DIR / cfg["file"])
        print(f"\n📖 İşleniyor: [{cfg['sinav']}] {cfg['name']} ({cfg['file']} s.{cfg['pages'][0]}-{cfg['pages'][1]})...")

        if pdf_path not in answer_cache:
            raw_ans = extract_answers_from_pages(pdf_path, cfg["ans_pages"][0], cfg["ans_pages"][1])
            answer_cache[pdf_path] = raw_ans

        subj_ans = normalize_subject_answer_key(answer_cache[pdf_path], cfg["ans_key"])

        questions = parse_subject_stream(
            pdf_path=pdf_path,
            start_page=cfg["pages"][0],
            end_page=cfg["pages"][1],
            ans_key=subj_ans,
            course_name=cfg["name"],
            sinav_adi=cfg["sinav"]
        )

        out_file = OUT_DIR / f"{cfg['id']}.json"
        with open(out_file, "w", encoding="utf-8") as fp:
            json.dump(questions, fp, ensure_ascii=False, indent=2)

        print(f"   ✅ Kaydedildi: {out_file.name} -> {len(questions)} soru")
        manifest[cfg["id"]] = {
            "questionCount": len(questions),
            "courseCount": len(set(q["ders"] for q in questions))
        }

    # YDT Bölümlerini İşle
    print(f"\n📖 İşleniyor: [YDT] YDT İNGİLİZCE (12 Alt Bölüm)...")
    ydt_questions = parse_ydt_special()
    out_file = OUT_DIR / "YDT_ING.json"
    with open(out_file, "w", encoding="utf-8") as fp:
        json.dump(ydt_questions, fp, ensure_ascii=False, indent=2)

    print(f"   ✅ Kaydedildi: {out_file.name} -> {len(ydt_questions)} soru")
    manifest["YDT_ING"] = {
        "questionCount": len(ydt_questions),
        "courseCount": len(set(q["ders"] for q in ydt_questions))
    }

    with open(MANIFEST_PATH, "w", encoding="utf-8") as fp:
        json.dump(manifest, fp, ensure_ascii=False, indent=2)

    print(f"\n🎉 Tüm YKS dersleri başarıyla ayrıştırıldı ve manifest güncellendi!")


if __name__ == "__main__":
    run()
