#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB Ders Kitabı PDF -> Dijital Markdown & Yapısal JSON Kitap Dönüştürücüsü.

Kaynak PDF'leri (docs/kaynak_pdfler/ders_kitaplari/*.pdf) okur,
sayfa düzenini (başlıklar, BİLGİ KUTUSU, NOT EDELİM, maddeler, dipnotlar) ayrıştırır,
EVREN API aktifse görsel/LLM doğrulaması uygular ve kalıcı olarak:
- docs/kitaplar/markdown/<KITAP_KODU>.md
- docs/kitaplar/json/<KITAP_KODU>.json
dosyalarını üretir.
"""

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    from scripts.core.evren_client import EvrenClient
except ModuleNotFoundError:
    from evren_client import EvrenClient


CALLOUT_PATTERNS: List[Tuple[str, str, str]] = [
    (r"^BİLGİ\s+KUTUSU$", "bilgi_kutusu", "BİLGİ KUTUSU"),
    (r"^NOT\s+EDELİM$", "not_edelim", "NOT EDELİM"),
    (r"^KAVRAM\s+KUTUSU$", "kavram", "KAVRAM KUTUSU"),
    (r"^OKUMA\s+METNİ$", "okuma_metni", "OKUMA METNİ"),
    (r"^ETKİNLİK$", "etkinlik", "ETKİNLİK"),
    (r"^DİKKAT\s*!?", "uyari", "DİKKAT"),
]


def get_pdf_page_count(pdf_path: Path) -> int:
    """pdfinfo ile toplam sayfa sayısını döner."""
    res = subprocess.run(
        ["pdfinfo", str(pdf_path)],
        capture_output=True,
        text=True,
        check=True,
    )
    for line in res.stdout.splitlines():
        if line.lower().startswith("pages:"):
            return int(line.split(":", 1)[1].strip())
    raise RuntimeError(f"Sayfa sayısı okunamadı: {pdf_path}")


def extract_raw_page_text(pdf_path: Path, page_num: int) -> str:
    """pdftotext ile tek bir sayfanın metnini çıkarır."""
    res = subprocess.run(
        ["pdftotext", "-f", str(page_num), "-l", str(page_num), str(pdf_path), "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    return res.stdout.replace("\x0c", "").strip()


def render_page_image(pdf_path: Path, page_num: int, out_dir: Path, dpi: int = 150) -> Path:
    """pdftoppm ile tek bir sayfayı PNG görseline dönüştürür (dots-ocr için)."""
    out_dir.mkdir(parents=True, exist_ok=True)
    prefix = out_dir / f"page_{page_num:03d}"
    expected = out_dir / f"page_{page_num:03d}.png"
    if expected.exists():
        return expected
    subprocess.run(
        [
            "pdftoppm",
            "-png",
            "-r",
            str(dpi),
            "-singlefile",
            "-f",
            str(page_num),
            "-l",
            str(page_num),
            str(pdf_path),
            str(prefix),
        ],
        check=True,
    )
    return expected


def clean_and_structure_page(raw_text: str, page_num: int) -> Tuple[str, Dict[str, Any]]:
    """Sayfa metnini başlık, paragraf, yan kutu ve maddelere ayrıştırır."""
    lines = [ln.strip() for ln in raw_text.splitlines()]
    filtered: List[str] = []
    idx = 0
    while idx < len(lines):
        line = lines[idx]
        if not line:
            filtered.append("")
            idx += 1
            continue
        # Tek harfli dekoratif kutu ikonlarını ('B' -> BİLGİ KUTUSU, 'N' -> NOT EDELİM) temizle
        if len(line) == 1 and line in ("B", "N", "E", "O", "D") and idx + 1 < len(lines):
            next_non_empty = next((l for l in lines[idx + 1 : idx + 4] if l), "")
            if any(re.match(pat, next_non_empty, re.IGNORECASE) for pat, _, _ in CALLOUT_PATTERNS):
                idx += 1
                continue
        # Yalnızca sayfa numarası olan üst/alt satırları atla
        if re.match(r"^\d{1,3}$", line) and (idx < 3 or idx > len(lines) - 4):
            idx += 1
            continue
        filtered.append(line)
        idx += 1

    md_blocks: List[str] = [f"<!-- Sayfa: {page_num} -->"]
    paragraphs: List[str] = []
    callouts: List[Dict[str, Any]] = []
    headings: List[Tuple[int, str]] = []

    blocks = re.split(r"\n\s*\n", "\n".join(filtered))
    i = 0
    while i < len(blocks):
        block = blocks[i].strip()
        if not block:
            i += 1
            continue
        block_lines = [b.strip() for b in block.splitlines() if b.strip()]
        first_line = block_lines[0]

        # 1. Ünite Başlığı Tespiti
        if re.match(r"^(?:\d+\.\s*ÜNİTE|ÜNİTE\s*\d+)\b", first_line, re.IGNORECASE):
            title = " ".join(block_lines)
            headings.append((1, title))
            md_blocks.append(f"# {title}")
            i += 1
            continue

        # 2. Yan Kutu (BİLGİ KUTUSU, NOT EDELİM vb.) Tespiti
        matched_callout = None
        for pat, ctype, clabel in CALLOUT_PATTERNS:
            if re.match(pat, first_line, re.IGNORECASE):
                matched_callout = (ctype, clabel)
                break

        if matched_callout:
            ctype, clabel = matched_callout
            body_lines = block_lines[1:]
            if not body_lines and i + 1 < len(blocks):
                i += 1
                body_lines = [b.strip() for b in blocks[i].splitlines() if b.strip()]
            body_text = " ".join(body_lines)
            callouts.append({"tip": ctype, "baslik": clabel, "icerik": body_text, "sayfa": page_num})
            md_blocks.append(f"> [!{clabel}]\n> {body_text}")
            i += 1
            continue

        # 3. Konu / Alt Başlık Tespiti (Örn: "1. Kelam İlminin Tanımı..." veya "1.1. ...")
        if (
            len(block_lines) <= 2
            and len(" ".join(block_lines)) < 110
            and re.match(r"^(?:\d+(?:\.\d+)*\.|[A-ZÇĞİÖŞÜ]\.)\s+[A-ZÇĞİÖŞÜ]", first_line)
            and not first_line.endswith(".")
        ):
            title = " ".join(block_lines)
            level = 3 if re.match(r"^\d+\.\d+", first_line) else 2
            headings.append((level, title))
            md_blocks.append(f"{'#' * level} {title}")
            i += 1
            continue

        # 4. Madde İşaretleri (✓✓ veya •)
        if any(bl.startswith(("✓", "•", "- ")) for bl in block_lines):
            bullet_md: List[str] = []
            for bl in block_lines:
                cleaned_item = re.sub(r"^[✓•\-]+\s*", "", bl).strip()
                bullet_md.append(f"- {cleaned_item}")
            joined_bullets = "\n".join(bullet_md)
            paragraphs.append(joined_bullets)
            md_blocks.append(joined_bullets)
            i += 1
            continue

        # 5. Standart Paragraf (Satır sonu tirelemelerini birleştir)
        merged_lines: List[str] = []
        for bl in block_lines:
            if merged_lines and merged_lines[-1].endswith("-"):
                merged_lines[-1] = merged_lines[-1][:-1] + bl
            else:
                merged_lines.append(bl)
        para_text = " ".join(merged_lines)
        paragraphs.append(para_text)
        md_blocks.append(para_text)
        i += 1

    return "\n\n".join(md_blocks), {
        "sayfa": page_num,
        "basliklar": headings,
        "paragraflar": paragraphs,
        "kutular": callouts,
    }


def convert_pdf_to_digital_book(
    pdf_path: Path,
    kitap_kodu: str,
    kitap_adi: str,
    subject: str,
    donemler: List[int],
    start_page: int = 1,
    end_page: Optional[int] = None,
    use_evren_ocr: bool = False,
) -> Tuple[Path, Path]:
    """PDF kitabını Markdown ve Yapısal JSON kitabına dönüştürür."""
    total_pages = get_pdf_page_count(pdf_path)
    last_page = min(end_page or total_pages, total_pages)
    evren = EvrenClient() if use_evren_ocr else None

    md_pages: List[str] = [
        f"# 📖 {kitap_adi} ({kitap_kodu})",
        f"> **Ders Kodu:** `{subject}` | **Dönemler:** `{', '.join(map(str, donemler))}` | **Toplam Sayfa:** `{total_pages}`",
        "---",
    ]

    sections: List[Dict[str, Any]] = []
    current_section: Dict[str, Any] = {
        "baslik": "Giriş ve Ön Söz",
        "seviye": 1,
        "sayfa_baslangic": start_page,
        "sayfa_bitis": start_page,
        "paragraflar": [],
        "kutular": [],
    }

    cache_dir = Path("scripts/scratch/book_cache") / kitap_kodu
    cache_dir.mkdir(parents=True, exist_ok=True)

    for pno in range(start_page, last_page + 1):
        raw_txt = extract_raw_page_text(pdf_path, pno)
        if use_evren_ocr and evren and evren.is_configured:
            img_path = render_page_image(pdf_path, pno, cache_dir / "images")
            page_md = evren.ocr_page_to_markdown(img_path, pno, raw_text_hint=raw_txt)
            _, page_struct = clean_and_structure_page(raw_txt, pno)
        else:
            page_md, page_struct = clean_and_structure_page(raw_txt, pno)

        md_pages.append(page_md)
        for level, h_title in page_struct["basliklar"]:
            if current_section["paragraflar"] or current_section["kutular"]:
                sections.append(current_section)
            current_section = {
                "baslik": h_title,
                "seviye": level,
                "sayfa_baslangic": pno,
                "sayfa_bitis": pno,
                "paragraflar": [],
                "kutular": [],
            }
        current_section["sayfa_bitis"] = pno
        current_section["paragraflar"].extend(page_struct["paragraflar"])
        current_section["kutular"].extend(page_struct["kutular"])

    if current_section["paragraflar"] or current_section["kutular"]:
        sections.append(current_section)

    book_json: Dict[str, Any] = {
        "kitap_kodu": kitap_kodu,
        "kitap_adi": kitap_adi,
        "subject": subject,
        "donemler": donemler,
        "toplam_sayfa": total_pages,
        "uniteler": [
            {
                "unite_no": 1,
                "unite_adi": kitap_adi,
                "donem": donemler[0] if donemler else 1,
                "ders": f"{kitap_adi} – {donemler[0] if donemler else 1}",
                "sayfa_araligi": [start_page, last_page],
                "bolumler": sections,
            }
        ],
        "istilahlar": [],
    }

    md_out = Path("docs/kitaplar/markdown") / f"{kitap_kodu}.md"
    json_out = Path("docs/kitaplar/json") / f"{kitap_kodu}.json"
    md_out.parent.mkdir(parents=True, exist_ok=True)
    json_out.parent.mkdir(parents=True, exist_ok=True)

    md_out.write_text("\n\n".join(md_pages) + "\n", encoding="utf-8")
    json_out.write_text(json.dumps(book_json, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return md_out, json_out


def main() -> None:
    parser = argparse.ArgumentParser(description="MEB PDF Ders Kitabını Dijital Markdown ve JSON Kitaba Dönüştürür")
    parser.add_argument("--pdf", default="docs/kaynak_pdfler/ders_kitaplari/KLM_1_2.pdf", help="Kaynak PDF yolu")
    parser.add_argument("--code", default="KLM_1_2", help="Kitap kodu (örn. KLM_1_2, TDE_1)")
    parser.add_argument("--title", default="AÖİHL Kelam", help="Kitap başlığı")
    parser.add_argument("--subject", default="KLM", help="SubjectId (örn. KLM, TDE, BIO)")
    parser.add_argument("--start", type=int, default=1, help="Başlangıç sayfası")
    parser.add_argument("--end", type=int, default=None, help="Bitiş sayfası")
    parser.add_argument("--evren", action="store_true", help="EVREN dots-ocr görsel doğrulamasını kullan")
    args = parser.parse_args()

    pdf_file = Path(args.pdf)
    if not pdf_file.exists():
        raise SystemExit(f"PDF bulunamadı: {pdf_file}")

    md_path, json_path = convert_pdf_to_digital_book(
        pdf_path=pdf_file,
        kitap_kodu=args.code,
        kitap_adi=args.title,
        subject=args.subject,
        donemler=[1, 2],
        start_page=args.start,
        end_page=args.end,
        use_evren_ocr=args.evren,
    )
    print(f"✅ Dijital Kitap üretildi:\n  📄 Markdown: {md_path}\n  📦 JSON:     {json_path}")


if __name__ == "__main__":
    main()

