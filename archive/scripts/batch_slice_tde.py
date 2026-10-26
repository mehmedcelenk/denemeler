#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TDE (Türk Dili ve Edebiyatı) 1-8 Tüm Dönemleri Sorumlu Sayfalara Göre Bölme ve Hazırlama Motoru."""

import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT_DIR / "docs" / "kaynak_pdfler" / "ders_kitaplari"
TDE_BASE_DIR = ROOT_DIR / "docs" / "dersler" / "tde"
TDE_BASE_DIR.mkdir(parents=True, exist_ok=True)

TDE_PLAN: List[Dict[str, Any]] = [
    {
        "key": "tde_1",
        "title": "Türk Dili ve Edebiyatı 1",
        "term": 1,
        "pdf": "turk_dili_ve_edebiyati_1_2024.pdf",
        "start": 1,
        "end": 149,
    },
    {
        "key": "tde_2",
        "title": "Türk Dili ve Edebiyatı 2",
        "term": 2,
        "pdf": "turk_dili_ve_edebiyati_1_2024.pdf",
        "start": 150,
        "end": 308,
    },
    {
        "key": "tde_3",
        "title": "Türk Dili ve Edebiyatı 3",
        "term": 3,
        "pdf": "turk_dili_ve_edebiyati_10_2025.pdf",
        "start": 1,
        "end": 153,
    },
    {
        "key": "tde_4",
        "title": "Türk Dili ve Edebiyatı 4",
        "term": 4,
        "pdf": "turk_dili_ve_edebiyati_10_2025.pdf",
        "start": 154,
        "end": 319,
    },
    {
        "key": "tde_5",
        "title": "Türk Dili ve Edebiyatı 5",
        "term": 5,
        "pdf": "edebiyat_5 dönem 2022.pdf",
        "start": 1,
        "end": 159,
    },
    {
        "key": "tde_6",
        "title": "Türk Dili ve Edebiyatı 6",
        "term": 6,
        "pdf": "edebiyat_6 dönem 2022.pdf",
        "start": 160,
        "end": 313,
    },
    {
        "key": "tde_7",
        "title": "Türk Dili ve Edebiyatı 7",
        "term": 7,
        "pdf": "edebiyat_7 dönem 2023.pdf",
        "start": 1,
        "end": 129,
    },
    {
        "key": "tde_8",
        "title": "Türk Dili ve Edebiyatı 8",
        "term": 8,
        "pdf": "edebiyat_8 dönem 2022.pdf",
        "start": 1,
        "end": 172,
    },
]


def process_item(item: Dict[str, Any]) -> None:
    key = item["key"]
    title = item["title"]
    term = item["term"]
    src_pdf = RAW_DIR / item["pdf"]
    start_p = item["start"]
    end_p = item["end"]

    dest_dir = TDE_BASE_DIR / key
    dest_dir.mkdir(parents=True, exist_ok=True)

    out_pdf = dest_dir / f"{key}_sorumlu.pdf"
    out_md = dest_dir / f"{key}.md"
    out_json = dest_dir / f"{key}.json"

    print(f"\n[*] İşleniyor: {key.upper()} ({title}) - Sayfa {start_p} - {end_p}...")

    # 1. Kırpılmış PDF
    if out_pdf.exists() and out_pdf.stat().st_size > 10000:
        print(f"  -> PDF zaten mevcut: {out_pdf.name} ({out_pdf.stat().st_size // 1024} KB)")
    else:
        print(f"  -> PDF kırpılıyor (gs): {src_pdf.name} (Sayfa {start_p}-{end_p})...")
        subprocess.run(
            [
                "gs",
                "-sDEVICE=pdfwrite",
                "-dNOPAUSE",
                "-dBATCH",
                "-dSAFER",
                f"-dFirstPage={start_p}",
                f"-dLastPage={end_p}",
                f"-sOutputFile={str(out_pdf)}",
                str(src_pdf),
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True,
        )
        print(f"  -> PDF oluşturuldu: {out_pdf.name} ({out_pdf.stat().st_size // 1024} KB)")

    # 2. Markdown
    if out_md.exists() and out_md.stat().st_size > 1000:
        print(f"  -> Markdown zaten mevcut: {out_md.name} ({out_md.stat().st_size // 1024} KB)")
    else:
        print(f"  -> Markdown metni çıkarılıyor...")
        res = subprocess.run(["pdftotext", "-layout", str(out_pdf), "-"], capture_output=True, text=True, check=True)
        header = f"# 📖 MEB {title} ({term}. Dönem)\n\n> Sorumlu Sayfa Aralığı: Sayfa {start_p} - {end_p}\n\n---\n\n"
        out_md.write_text(header + res.stdout, encoding="utf-8")
        print(f"  -> Markdown oluşturuldu: {out_md.name} ({out_md.stat().st_size // 1024} KB)")

    # 3. JSON Üstveri
    if not out_json.exists():
        data = {
            "ders": title.upper(),
            "subject": "TDE",
            "donem": term,
            "sorumlu_sayfa_araligi": [start_p, end_p],
            "toplam_sayfa": end_p - start_p + 1,
            "kaynak_pdf": item["pdf"],
        }
        out_json.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"  -> JSON oluşturuldu: {out_json.name}")


def main() -> None:
    print("=== TDE 1-8 TÜM DÖNEMLERİ BÖLME VE DİJİTALLEŞTİRME BAŞLADI ===")
    for item in TDE_PLAN:
        process_item(item)
    print("\n[✓] TDE 1-8 TÜM DÖNEMLER EKSİKSİZ TAMAMLANDI!")


if __name__ == "__main__":
    main()
