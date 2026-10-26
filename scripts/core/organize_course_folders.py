#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ders Kitaplarını Sorumlu Sayfalara Göre Bölme ve Klasörleme Motoru.

İstenen Mimari:
docs/dersler/
  └── <ders_kodu>/
        └── <ders_kodu>_<donem>/
              ├── <ders_kodu>_<donem>_sorumlu.pdf   (Sorumlu sayfaların kırpılmış PDF'i)
              ├── <ders_kodu>_<donem>.md            (Sorumlu sayfaların Markdown metni)
              ├── <ders_kodu>_<donem>.json          (Ders ve ünite üstveri sözleşmesi)
              └── <ders_kodu>_<donem>_kavramlar.json (Döneme özel kavramlar)
"""

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
RAW_PDF_DIR = ROOT_DIR / "docs" / "kaynak_pdfler" / "ders_kitaplari"
OUTPUT_DERSLER_DIR = ROOT_DIR / "docs" / "dersler"
CATALOG_PATH = ROOT_DIR / "docs" / "kaynak_pdfler" / "aokul_mufredat_katalogu.json"

# Bilinen Kesin MEB Sayfa Aralıkları Tablosu (Resmî aokul.gov.tr Açıklamalarından Derlenmiş)
KNOWN_PAGE_RANGES: Dict[str, Tuple[int, Optional[int]]] = {
    # Türk Dili ve Edebiyatı
    "tde_1": (1, 149),
    "tde_2": (150, None),
    "tde_3": (1, 153),
    "tde_4": (154, None),
    "tde_5": (1, 159),
    "tde_6": (160, None),
    # Tarih
    "tar_1": (1, 123),
    "tar_2": (124, None),
    "tar_3": (1, 155),
    "tar_4": (156, None),
    "tar_5": (1, 218),
    "tar_6": (219, None),
    # Coğrafya
    "cog_1": (1, 120),
    "cog_2": (121, None),
    "cog_3": (1, 129),
    "cog_4": (130, None),
    # Biyoloji
    "bio_1": (1, 79),
    "bio_2": (80, None),
    "bio_3": (1, 97),
    "bio_4": (98, None),
    # Din Kültürü
    "din_1": (1, 88),
    "din_2": (89, None),
    "din_3": (1, 79),
    "din_4": (80, None),
    "din_5": (1, 94),
    "din_6": (95, None),
    "din_7": (1, None),
    "din_8": (1, None),
    # Sağlık Bilgisi
    "sag_1": (1, 102),
    "sag_2": (103, None),
    # Kelam
    "klm_1": (11, 48),
    "klm_2": (49, None),
    # Fizik
    "fiz_1": (1, 144),
    "fiz_2": (145, None),
    "fiz_3": (1, 195),
    "fiz_4": (196, None),
    # Kimya
    "kim_1": (1, 136),
    "kim_2": (137, None),
    "kim_3": (1, 106),
    "kim_4": (107, None),
    # Felsefe
    "fel_1": (1, 110),
    "fel_2": (111, 206),
    "fel_3": (1, 104),
    "fel_4": (105, None),
    # Matematik
    "mat_1": (1, None),
    "mat_2": (43, None),
    "mat_3": (1, 227),
    "mat_4": (228, None),
    # İnkılap Tarihi
    "ink_1": (1, 148),
    "ink_2": (149, None),
}


def get_pdf_total_pages(pdf_path: Path) -> int:
    try:
        res = subprocess.run(["pdfinfo", str(pdf_path)], capture_output=True, text=True, check=True)
        m = re.search(r"Pages:\s+(\d+)", res.stdout)
        if m:
            return int(m.group(1))
    except Exception as e:
        print(f"pdfinfo hatası ({pdf_path.name}): {e}")
    return 0


def slice_pdf(src_pdf: Path, start_p: int, end_p: int, out_pdf: Path) -> bool:
    out_pdf.parent.mkdir(parents=True, exist_ok=True)
    if out_pdf.exists() and out_pdf.stat().st_size > 10000:
        return True

    print(f"  [*] Kırpılıyor: {src_pdf.name} (Sayfa {start_p} - {end_p}) -> {out_pdf.name}...")
    with tempfile.TemporaryDirectory() as tmp:
        try:
            # 1. pdfseparate
            sep_pattern = f"{tmp}/p-%d.pdf"
            subprocess.run(
                ["pdfseparate", "-f", str(start_p), "-l", str(end_p), str(src_pdf), sep_pattern],
                check=True,
                capture_output=True,
            )
            # 2. pdfunite
            pages = [f"{tmp}/p-{i}.pdf" for i in range(start_p, end_p + 1)]
            subprocess.run(["pdfunite"] + pages + [str(out_pdf)], check=True, capture_output=True)
            print(f"      -> Tamamlandı: {out_pdf.name} ({out_pdf.stat().st_size // 1024} KB)")
            return True
        except Exception as e:
            print(f"      [!] Kırpma hatası: {e}")
            return False


def extract_text_to_markdown(src_pdf: Path, out_md: Path, title: str, start_p: int, end_p: int) -> None:
    if out_md.exists() and out_md.stat().st_size > 1000:
        return
    try:
        res = subprocess.run(
            ["pdftotext", "-f", str(start_p), "-l", str(end_p), "-layout", str(src_pdf), "-"],
            capture_output=True,
            text=True,
            check=True,
        )
        raw_text = res.stdout
        header = f"# 📖 {title}\n\n> Sorumlu Sayfa Aralığı: {start_p} - {end_p}\n\n---\n\n"
        out_md.write_text(header + raw_text, encoding="utf-8")
        print(f"      -> Markdown oluşturuldu: {out_md.name} ({out_md.stat().st_size // 1024} KB)")
    except Exception as e:
        print(f"      [!] pdftotext hatası: {e}")


def process_course_folder(subject_code: str, term_no: int, src_pdf_name: str, display_name: str, skip_pdf_slice: bool = True) -> None:
    folder_key = f"{subject_code.lower()}_{term_no}"
    target_dir = OUTPUT_DERSLER_DIR / subject_code.lower() / folder_key
    target_dir.mkdir(parents=True, exist_ok=True)

    src_pdf = RAW_PDF_DIR / src_pdf_name
    if not src_pdf.exists():
        return

    total_pages = get_pdf_total_pages(src_pdf)
    if total_pages == 0:
        return

    # Sayfa aralığını belirle
    known_range = KNOWN_PAGE_RANGES.get(folder_key)
    if known_range:
        start_p, end_p = known_range
        end_p = end_p or total_pages
    else:
        start_p, end_p = 1, total_pages

    end_p = min(end_p, total_pages)

    # 1. Kırpılmış PDF (isteğe bağlı)
    out_pdf = target_dir / f"{folder_key}_sorumlu.pdf"
    if not skip_pdf_slice:
        slice_pdf(src_pdf, start_p, end_p, out_pdf)

    # 2. Markdown (doğrudan kaynak PDF'in ilgili sayfa aralığından üret)
    out_md = target_dir / f"{folder_key}.md"
    extract_text_to_markdown(src_pdf, out_md, display_name, start_p, end_p)

    # 3. JSON Üstveri
    out_json = target_dir / f"{folder_key}.json"
    if not out_json.exists():
        data = {
            "ders": display_name,
            "subject": subject_code.upper(),
            "donem": term_no,
            "sorumlu_sayfa_araligi": [start_p, end_p],
            "toplam_sayfa": end_p - start_p + 1,
            "kaynak_pdf": src_pdf_name,
        }
        out_json.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    # 4. Kavramlar Şablonu (Henüz yoksa boş şablon veya mevcut kavramlar)
    out_concepts = target_dir / f"{folder_key}_kavramlar.json"
    if not out_concepts.exists():
        # Kelam 1 için hazır veriyi kopyala
        if folder_key == "klm_1":
            ready_c = ROOT_DIR / "data/concepts/KLM_1_concepts.json"
            if ready_c.exists():
                out_concepts.write_text(ready_c.read_text(encoding="utf-8"), encoding="utf-8")
        else:
            out_concepts.write_text(json.dumps([], indent=2), encoding="utf-8")


def main() -> None:
    print("=== DERS KLASÖRLERİNİ VE SORUMLU SAYFALARI DÜZENLEME ===")
    # Mevcut inen veya kaynakta bulunan PDF'leri tara
    # Biyoloji
    process_course_folder("bio", 1, "biyoloji_1_2024.pdf", "Biyoloji 1")
    process_course_folder("bio", 2, "biyoloji_2_2024.pdf", "Biyoloji 2")
    process_course_folder("bio", 3, "biyoloji_10_2025.pdf", "Biyoloji 3")
    process_course_folder("bio", 4, "biyoloji_10_2025.pdf", "Biyoloji 4")

    # Kelam
    process_course_folder("klm", 1, "KLM_1_2.pdf", "Kelam 1")
    process_course_folder("klm", 2, "KLM_1_2.pdf", "Kelam 2")

    # Coğrafya
    process_course_folder("cog", 1, "cografya_1_2024.pdf", "Coğrafya 1")
    process_course_folder("cog", 2, "cografya_2_2024.pdf", "Coğrafya 2")
    process_course_folder("cog", 3, "cografya_10_2025.pdf", "Coğrafya 3")
    process_course_folder("cog", 4, "cografya_10_2025.pdf", "Coğrafya 4")

    # Tarih
    process_course_folder("tar", 1, "tarih_1_2024.pdf", "Tarih 1")
    process_course_folder("tar", 2, "tarih_2_2024.pdf", "Tarih 2")
    process_course_folder("tar", 3, "tarih_10_2025.pdf", "Tarih 3")
    process_course_folder("tar", 4, "tarih_10_2025.pdf", "Tarih 4")

    # Türk Dili ve Edebiyatı
    process_course_folder("tde", 1, "turk_dili_ve_edebiyati_1_2024.pdf", "Türk Dili ve Edebiyatı 1")
    process_course_folder("tde", 2, "turk_dili_ve_edebiyati_2_2024.pdf", "Türk Dili ve Edebiyatı 2")
    process_course_folder("tde", 3, "turk_dili_ve_edebiyati_10_2025.pdf", "Türk Dili ve Edebiyatı 3")
    process_course_folder("tde", 4, "turk_dili_ve_edebiyati_10_2025.pdf", "Türk Dili ve Edebiyatı 4")

    # Din Kültürü
    process_course_folder("din", 1, "din_kulturu_ve_ahlak_bilgisi_1_2024.pdf", "Din Kültürü 1", skip_pdf_slice=True)
    process_course_folder("din", 2, "din_kulturu_ve_ahlak_bilgisi_2_2024.pdf", "Din Kültürü 2", skip_pdf_slice=True)
    process_course_folder("din", 3, "din_kulturu_ve_ahlak_bilgisi_3_4_2025.pdf", "Din Kültürü 3", skip_pdf_slice=True)
    process_course_folder("din", 4, "din_kulturu_ve_ahlak_bilgisi_3_4_2025.pdf", "Din Kültürü 4", skip_pdf_slice=True)
    process_course_folder("din", 5, "din_kulturu_5 dönem 2022.pdf", "Din Kültürü 5", skip_pdf_slice=True)
    process_course_folder("din", 6, "din_kulturu_6 dönem 2022.pdf", "Din Kültürü 6", skip_pdf_slice=True)
    process_course_folder("din", 7, "din_kulturu_7 dönem 2022.pdf", "Din Kültürü 7", skip_pdf_slice=True)
    process_course_folder("din", 8, "din_kulturu_8 dönem 2022.pdf", "Din Kültürü 8", skip_pdf_slice=True)

    # Fizik
    process_course_folder("fiz", 1, "fizik_1_2024.pdf", "Fizik 1", skip_pdf_slice=True)
    process_course_folder("fiz", 2, "fizik_2_2024.pdf", "Fizik 2", skip_pdf_slice=True)
    process_course_folder("fiz", 3, "fizik_10_2025.pdf", "Fizik 3", skip_pdf_slice=True)
    process_course_folder("fiz", 4, "fizik_10_2025.pdf", "Fizik 4", skip_pdf_slice=True)

    # Kimya
    process_course_folder("kim", 1, "kimya_1_2024.pdf", "Kimya 1", skip_pdf_slice=True)
    process_course_folder("kim", 2, "kimya_2_2024.pdf", "Kimya 2", skip_pdf_slice=True)
    process_course_folder("kim", 3, "kimya_10_2025.pdf", "Kimya 3", skip_pdf_slice=True)
    process_course_folder("kim", 4, "kimya_10_2025.pdf", "Kimya 4", skip_pdf_slice=True)

    # Felsefe
    process_course_folder("fel", 1, "felsefe-2025.pdf", "Felsefe 1", skip_pdf_slice=True)
    process_course_folder("fel", 2, "felsefe-2025.pdf", "Felsefe 2", skip_pdf_slice=True)
    process_course_folder("fel", 3, "FELSEFE 11.pdf", "Felsefe 3", skip_pdf_slice=True)
    process_course_folder("fel", 4, "FELSEFE 11.pdf", "Felsefe 4", skip_pdf_slice=True)

    # Matematik
    process_course_folder("mat", 1, "matematik_9_1_2_2025.pdf", "Matematik 1", skip_pdf_slice=True)
    process_course_folder("mat", 2, "matemetik_9_2_2025.pdf", "Matematik 2", skip_pdf_slice=True)
    process_course_folder("mat", 3, "matematik_10_2025.pdf", "Matematik 3", skip_pdf_slice=True)
    process_course_folder("mat", 4, "matematik_10_2025.pdf", "Matematik 4", skip_pdf_slice=True)

    # Sağlık Bilgisi ve Trafik Kültürü
    process_course_folder("sag", 1, "saglik_bil_trafik_kult_1_2.pdf", "Sağlık Bilgisi ve Trafik Kültürü 1", skip_pdf_slice=True)
    process_course_folder("sag", 2, "saglik_bil_trafik_kult_1_2.pdf", "Sağlık Bilgisi ve Trafik Kültürü 2", skip_pdf_slice=True)

    # İnkılap Tarihi
    process_course_folder("ink", 1, "inkilap_tarihi_1_2.pdf", "T.C. İnkılap Tarihi 1", skip_pdf_slice=True)
    process_course_folder("ink", 2, "inkilap_tarihi_1_2.pdf", "T.C. İnkılap Tarihi 2", skip_pdf_slice=True)

    print("[✓] İşlem tamamlandı. Klasör yapısı güncellendi.")


if __name__ == "__main__":
    main()

