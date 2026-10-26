#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Açık Öğretim Daire Başkanlığı (aokul.gov.tr) Resmî Müfredat ve Kitap Kataloğu Çekici.

http://aokul.gov.tr/Kitaplar/Kitaplar.aspx?type=2 sayfasındaki:
- Tüm ders kategorileri
- Dönem bazlı ders başlıkları (Kelâm-1, Tarih-1, Türk Dili ve Edebiyatı-1 vb.)
- Resmî MEB sorumluluk açıklamaları ("...Ünitelerinden sorumludur", "...sayfaya kadar")
- Doğrudan kitap PDF indirme bağlantıları
- Sesli kitap bağlantıları
verilerini yapısal JSON olarak çıkarır ve istenen PDF'leri indirir.
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests
from bs4 import BeautifulSoup

ROOT_DIR = Path(__file__).resolve().parents[2]
OUT_CATALOG_PATH = ROOT_DIR / "docs" / "kaynak_pdfler" / "aokul_mufredat_katalogu.json"
PDF_DEST_DIR = ROOT_DIR / "docs" / "kaynak_pdfler" / "ders_kitaplari"
OUT_CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
PDF_DEST_DIR.mkdir(parents=True, exist_ok=True)

AOKUL_BASE_URL = "http://aokul.gov.tr"
CATALOG_URL = f"{AOKUL_BASE_URL}/Kitaplar/Kitaplar.aspx?type=2"


def fetch_and_parse_catalog() -> List[Dict[str, Any]]:
    print(f"[*] Resmî MEB kataloğu indiriliyor: {CATALOG_URL}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    resp = requests.get(CATALOG_URL, headers=headers, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    catalog_items: List[Dict[str, Any]] = []

    # Accordion ve kart bloklarını tara
    # Sayfada dersler card/collapse blokları içindedir
    cards = soup.find_all("div", class_=re.compile(r"card|panel|accordion", re.I))
    print(f"[*] Sayfada {len(cards)} adet kart/blok bulundu, ayrıştırılıyor...")

    # Alternatif doğrudan link ve açıklama eşleştirme:
    # Sayfadaki tüm a linklerini ve çevrelerindeki metinleri dolaş
    processed_links = set()

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href.lower().endswith(".pdf"):
            continue

        full_pdf_url = href if href.startswith("http") else f"{AOKUL_BASE_URL}/{href.lstrip('/')}"
        link_text = a.get_text(strip=True)

        # Çevreleyen kapsayıcıyı (card / div) bul
        parent_box = a.find_parent("div", class_=re.compile(r"card|col|row|tab-pane|collapse", re.I))
        if not parent_box:
            parent_box = a.parent.parent if a.parent else None

        desc = ""
        course_name = link_text
        audio_url = ""

        if parent_box:
            box_text = parent_box.get_text(separator="\n", strip=True)
            # Açıklama metnini yakala
            desc_match = re.search(r"Açıklama:\s*(.+?)(?=\n|$)", box_text, re.IGNORECASE)
            if not desc_match:
                desc_match = re.search(r"(.+?sorumludur.*)", box_text, re.IGNORECASE)
            if desc_match:
                desc = desc_match.group(1).strip()

            # Ses dosyasını yakala
            audio_tag = parent_box.find("audio") or parent_box.find("source")
            if audio_tag and audio_tag.get("src"):
                audio_href = audio_tag["src"].strip()
                audio_url = audio_href if audio_href.startswith("http") else f"{AOKUL_BASE_URL}/{audio_href.lstrip('/')}"

            # Başlığı iyileştir
            h_tag = parent_box.find(["h4", "h5", "h6", "button", "span"])
            if h_tag and h_tag.get_text(strip=True):
                candidate_title = h_tag.get_text(strip=True)
                if len(candidate_title) < 60:
                    course_name = candidate_title

        key = (course_name, full_pdf_url)
        if key in processed_links:
            continue
        processed_links.add(key)

        catalog_items.append({
            "ders_adi": course_name,
            "link_metni": link_text,
            "aciklama": desc,
            "pdf_url": full_pdf_url,
            "audio_url": audio_url,
        })

    print(f"[+] Toplam {len(catalog_items)} adet ders/dönem kitabı tespit edildi.")
    return catalog_items


def download_course_pdf(item: Dict[str, Any], dest_filename: Optional[str] = None) -> Path:
    pdf_url = item["pdf_url"]
    fname = dest_filename or Path(pdf_url.split("?")[0]).name
    out_file = PDF_DEST_DIR / fname

    if out_file.exists() and out_file.stat().st_size > 10000:
        print(f"  -> Zaten mevcut: {out_file.name} ({out_file.stat().st_size // 1024} KB)")
        return out_file

    print(f"[*] İndiriliyor: {pdf_url} -> {out_file.name}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    r = requests.get(pdf_url, headers=headers, stream=True, timeout=120)
    r.raise_for_status()

    with open(out_file, "wb") as f:
        for chunk in r.iter_content(chunk_size=65536):
            if chunk:
                f.write(chunk)

    print(f"  -> İndirildi: {out_file.name} ({out_file.stat().st_size // 1024} KB)")
    return out_file


def main() -> None:
    catalog = fetch_and_parse_catalog()
    OUT_CATALOG_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[✓] Resmî katalog kaydedildi: {OUT_CATALOG_PATH}")

    # Örnek ilk 10 kaydı yazdır
    print("\n--- ÖRNEK MÜFREDAT VE KİTAP LİSTESİ ---")
    for item in catalog[:8]:
        print(f"• {item['ders_adi']}")
        if item['aciklama']:
            print(f"  Açıklama: {item['aciklama']}")
        print(f"  PDF: {item['pdf_url']}")


if __name__ == "__main__":
    main()

