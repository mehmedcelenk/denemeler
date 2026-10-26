#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖL Web Sitesindeki Tüm Derslerin Resmî MEB PDF'lerini İndirici.

aokul.gov.tr üzerinden 13 temel dersin (TDE, TAR, INK, COG, MAT, FIZ, KIM, BIO, FEL, DIN, SAG, ING, KLM)
tüm dönem kitaplarını indirir. Ses dosyalarını atlar.
"""

import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List
import requests

ROOT_DIR = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT_DIR / "docs" / "kaynak_pdfler" / "aokul_mufredat_katalogu.json"
DEST_DIR = ROOT_DIR / "docs" / "kaynak_pdfler" / "ders_kitaplari"
DEST_DIR.mkdir(parents=True, exist_ok=True)

# 13 Temel Ders Eşleştirme Kuralları
SUBJECT_RULES: Dict[str, Dict[str, Any]] = {
    "TDE": {"name": "Türk Dili ve Edebiyatı", "pattern": r"türk dili|edebiyat"},
    "TAR": {"name": "Tarih", "pattern": r"tarih(?!.*(inkıl|islam))"},
    "INK": {"name": "T.C. İnkılap Tarihi", "pattern": r"inkılâp|inkilap"},
    "COG": {"name": "Coğrafya", "pattern": r"coğrafya|cografya"},
    "MAT": {"name": "Matematik", "pattern": r"matematik"},
    "FIZ": {"name": "Fizik", "pattern": r"fizik"},
    "KIM": {"name": "Kimya", "pattern": r"kimya"},
    "BIO": {"name": "Biyoloji", "pattern": r"biyoloji"},
    "FEL": {"name": "Felsefe", "pattern": r"felsefe"},
    "DIN": {"name": "Din Kültürü ve Ahlak Bilgisi", "pattern": r"din kültürü"},
    "SAG": {"name": "Sağlık Bilgisi ve Trafik Kültürü", "pattern": r"sağlık.*trafik|saglik"},
    "ING": {"name": "İngilizce", "pattern": r"ingilizce"},
    "KLM": {"name": "Kelam", "pattern": r"kelam|kelâm"},
}


def build_meb_pdf_url(raw_url: str) -> str:
    """MEB IIS sunucusunun göreceli yolunu düzeltir."""
    raw = raw_url.strip()
    if "/Kitaplar/Kitaplar/" in raw:
        return raw
    if "aokul.gov.tr/Kitaplar/2/" in raw:
        return raw.replace("aokul.gov.tr/Kitaplar/2/", "aokul.gov.tr/Kitaplar/Kitaplar/2/")
    return raw


def get_target_books() -> List[Dict[str, Any]]:
    if not CATALOG_PATH.exists():
        print(f"Katalog bulunamadı: {CATALOG_PATH}")
        sys.exit(1)

    catalog: List[Dict[str, Any]] = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    targets: List[Dict[str, Any]] = []
    seen_urls = set()

    for item in catalog:
        title = item.get("ders_adi", "") or item.get("link_metni", "")
        desc = item.get("aciklama", "")
        raw_url = item.get("pdf_url", "")
        if not raw_url:
            continue

        fixed_url = build_meb_pdf_url(raw_url)

        for s_code, cfg in SUBJECT_RULES.items():
            if re.search(cfg["pattern"], title, re.I) or re.search(cfg["pattern"], raw_url, re.I):
                # Seçmeli / yabancı dil ayrımı
                if s_code == "TAR" and "seçmeli" in title.lower():
                    continue

                if fixed_url in seen_urls:
                    continue
                seen_urls.add(fixed_url)

                fname = Path(fixed_url.split("?")[0]).name
                targets.append({
                    "subject": s_code,
                    "ders_adi": title,
                    "aciklama": desc,
                    "pdf_url": fixed_url,
                    "filename": fname,
                })
                break

    return targets


def download_one_pdf(target: Dict[str, Any]) -> bool:
    fname = target["filename"]
    out_path = DEST_DIR / fname
    url = target["pdf_url"]

    if out_path.exists() and out_path.stat().st_size > 50000:
        print(f"  [✓] Zaten mevcut: {fname} ({out_path.stat().st_size // 1024} KB)")
        return True

    print(f"  [*] İndiriliyor: [{target['subject']}] {fname} -> {url}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    for attempt in range(3):
        try:
            r = requests.get(url, headers=headers, stream=True, timeout=60)
            if r.status_code == 200:
                with open(out_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=131072):
                        if chunk:
                            f.write(chunk)
                print(f"      -> Başarılı: {fname} ({out_path.stat().st_size // 1024} KB)")
                return True
            else:
                print(f"      [!] HTTP {r.status_code} (Deneme {attempt+1}/3)")
        except Exception as e:
            print(f"      [!] Bağlantı hatası: {e} (Deneme {attempt+1}/3)")
        time.sleep(2)

    return False


def main() -> None:
    targets = get_target_books()
    print(f"=== MEB RESMÎ DERS KİTAPLARI İNDİRME MOTORU ===")
    print(f"Toplam hedeflenen benzersiz kitap sayısı: {len(targets)}")

    success_count = 0
    fail_count = 0

    for i, t in enumerate(targets, 1):
        print(f"\n[{i}/{len(targets)}] {t['subject']} - {t['ders_adi']}")
        ok = download_one_pdf(t)
        if ok:
            success_count += 1
        else:
            fail_count += 1

    print("\n==========================================")
    print(f"[+] İndirme tamamlandı: {success_count} Başarılı, {fail_count} Başarısız.")


if __name__ == "__main__":
    main()

