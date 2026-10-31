#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖF İlk Dönem İslâm Tarihi Alıştırma Sorularını Ayrıştırıcı.

data/raw_pipeline/aof_itar/alistirmalar/U[1-5].pdf dosyalarını okur,
50 alıştırma sorusunu çıkarıp doğrular ve JSON nesnelerine dönüştürür.
"""

import json
import re
import unicodedata
from pathlib import Path
from typing import Any, Dict, List
import pypdf

ROOT_DIR = Path(__file__).resolve().parents[2]
ALISTIRMALAR_DIR = ROOT_DIR / "data" / "raw_pipeline" / "aof_itar" / "alistirmalar"

UNIT_TOPICS = {
    1: ("İslâm Öncesi Arabistan", "Dinî, Sosyal ve Siyasi Yapı"),
    2: ("Hz. Muhammed'in Hayatı", "Peygamberlik Öncesi Dönem"),
    3: ("İslâm'ın Mekke Dönemi", "Tebliğ, Baskılar ve Hicret"),
    4: ("İslâm'ın Medine Dönemi", "Toplumsal Düzen ve Gazveler"),
    5: ("İslâm'ın Medine Dönemi", "Hudeybiye Sonrası, Fetihler ve Vedâ Haccı"),
}


def clean_pdf_text(raw_text: str) -> str:
    text = unicodedata.normalize("NFC", raw_text)
    # Ligatürleri düzelt (fi, fl)
    text = text.replace("\ufb01", "fi").replace("\ufb02", "fl")
    text = re.sub(r"\r\n|\r", "\n", text)
    # Sayfa altı telif metnini kaldır
    text = re.sub(
        r"Anadolu Üniversitesi tarafından hazırlanmış olan bu testlerin.*?(?=ILH|\d+\s*\)|$)",
        "",
        text,
        flags=re.DOTALL,
    )
    # Sayfa başı başlıklarını kaldır
    text = re.sub(r"ILH\w+\s*-\s*[^\n]+\nÜnite\s*\d+\s*-\s*Alıştırma Soruları\n", "", text)
    return text


def clean_stem(stem: str) -> str:
    # Tireli satır sonlarını birleştir
    stem = re.sub(r"(\w+)-\n\s*(\w+)", r"\1\2", stem)

    # Romen rakamları varsa (I., II., vb.) satır başlarını koru
    has_roman = bool(re.search(r"(?:^|\n)\s*(?:I|II|III|IV|V)\s*\.", stem))
    if has_roman:
        lines = [line.strip() for line in stem.splitlines() if line.strip()]
        result_lines = []
        for line in lines:
            if line.startswith("II.Hz. Hamza"):
                line = "III. Hz. Hamza"
            elif re.match(r"^I{1,3}\.[A-Za-zÇĞİÖŞÜ]", line):
                line = re.sub(r"^(I{1,3})\.([A-Za-zÇĞİÖŞÜ])", r"\1. \2", line)
            result_lines.append(line)
        cleaned = "\n".join(result_lines)
        cleaned = re.sub(r"\n(?=(?:Yukarıdaki|İslamiyet öncesi|Buna göre))", "\n\n", cleaned)
        return cleaned

    # Normal metin: satır sonlarını tek boşluğa çevir
    cleaned = re.sub(r"\s*\n\s*", " ", stem).strip()
    return cleaned


def clean_cozum(cozum_raw: str) -> str:
    text = re.sub(r"(\w+)-\n\s*(\w+)", r"\1\2", cozum_raw)
    text = re.sub(r"\s*\n\s*", " ", text).strip()
    text = re.sub(r"\s{2,}", " ", text)
    return text


def parse_unit_pdf(unit_no: int) -> List[Dict[str, Any]]:
    pdf_path = ALISTIRMALAR_DIR / f"U{unit_no}.pdf"
    if not pdf_path.exists():
        raise FileNotFoundError(f"{pdf_path} bulunamadı.")

    reader = pypdf.PdfReader(str(pdf_path))
    raw_text = "\n".join([page.extract_text() for page in reader.pages])
    cleaned_text = clean_pdf_text(raw_text)

    parts = re.split(r"(?:^|\n)\s*(\d+)\s*\)\s*\n", cleaned_text)
    questions: List[Dict[str, Any]] = []

    ana_konu, alt_konu = UNIT_TOPICS[unit_no]
    start_id = 20600 + (unit_no - 1) * 10

    for idx, i in enumerate(range(1, len(parts), 2)):
        q_num_str = parts[i]
        q_body = parts[i + 1]

        m_opts = re.split(r"\n\s*([A-E])\s*\)\s*\n", q_body)
        stem = clean_stem(m_opts[0])

        opts: Dict[str, str] = {}
        cozum_text = ""
        for j in range(1, len(m_opts), 2):
            opt_letter = m_opts[j]
            opt_val = m_opts[j + 1]
            if opt_letter == "E":
                cozum_parts = re.split(r"\n\s*Çözüm\s*:\s*\n", opt_val, maxsplit=1)
                opt_e = re.sub(r"\s*\n\s*", " ", cozum_parts[0]).strip()
                opts["E"] = opt_e.rstrip("*").strip()
                cozum_text = cozum_parts[1].strip() if len(cozum_parts) > 1 else ""
            else:
                opt_str = re.sub(r"\s*\n\s*", " ", opt_val).strip()
                opts[opt_letter] = opt_str.rstrip("*").strip()

        ans_m = re.search(
            r"Doğru cevap\s+[\"“”']?([A-E])[\"“”']?\s+şıkkıdır",
            cozum_text,
            re.IGNORECASE,
        )
        if not ans_m:
            raise ValueError(f"U{unit_no} Q{q_num_str}: Doğru cevap bulunamadı!")
        correct_ans = ans_m.group(1).upper()

        cleaned_solution = clean_cozum(cozum_text)

        q_obj = {
            "id": start_id + idx,
            "ders": "İLK DÖNEM İSLAM TARİHİ",
            "ders_kodu": 802,
            "yil": "AÖF Alıştırma Soruları",
            "donem": f"Ünite {unit_no}",
            "soru_no": int(q_num_str),
            "soru": stem,
            "secenekler": opts,
            "dogru_cevap": correct_ans,
            "dogru_nedeni": cleaned_solution,
            "ana_konu": ana_konu,
            "alt_konu": alt_konu,
            "kredi": 2,
            "sinav_soru_sayisi": 20,
            "puan": 0.1,
            "sekilli": False,
        }
        questions.append(q_obj)

    return questions


def load_all_practice_questions() -> List[Dict[str, Any]]:
    all_questions = []
    for u in range(1, 6):
        u_questions = parse_unit_pdf(u)
        all_questions.extend(u_questions)
    return all_questions


if __name__ == "__main__":
    qs = load_all_practice_questions()
    print(f"Toplam ayrıştırılan alıştırma sorusu: {len(qs)}")
