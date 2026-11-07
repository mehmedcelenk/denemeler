#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MEB OGM Materyal YKS Çıkmış Soru Kitapları İndirici.

Resmi CDN üzerinden 2018-2024 arası TYT, AYT ve YDT kitapçıklarını indirir.
"""

import sys
import time
from pathlib import Path
import urllib.request

ROOT_DIR = Path(__file__).resolve().parents[2]
DEST_DIR = ROOT_DIR / "kaynaklar" / "yks"
DEST_DIR.mkdir(parents=True, exist_ok=True)

BOOKS = [
    {
        "id": "TYT_GENEL",
        "title": "TYT Çıkmış Sorular (2018-2024)",
        "filename": "CS_TYT_2018_2026.pdf",
        "url": "https://ogm-small-cdn.eba.gov.tr/ogm-test-images/6aba49d35748c605dd7fe9e8/CS_TYT_2018_2026.pdf"
    },
    {
        "id": "TYT_DIN",
        "title": "TYT Din Kültürü Çıkmış Sorular (2018-2024)",
        "filename": "CS_DIIN_TYT_2018_2026.pdf",
        "url": "https://ogm-small-cdn.eba.gov.tr/ogm-test-images/6abc1f3410f5ec2735b7c59d/CS_DIIN_TYT_2018_2026.pdf"
    },
    {
        "id": "AYT_EA",
        "title": "AYT Eşit Ağırlık Çıkmış Sorular (2018-2024)",
        "filename": "CS_AYT_EA_2018_2026.pdf",
        "url": "https://ogm-small-cdn.eba.gov.tr/ogm-test-images/6abbfce510f5ec2735b743a2/CS_AYT_EA_2018_2026.pdf"
    },
    {
        "id": "AYT_SOZ",
        "title": "AYT Sözel Çıkmış Sorular (2018-2024)",
        "filename": "CS_AYT_SOZ_2018_2026.pdf",
        "url": "https://ogm-small-cdn.eba.gov.tr/ogm-test-images/6abb8789b98f4c074f5d3271/CS_AYT_SOZ_2018_2026.pdf"
    },
    {
        "id": "AYT_SAY",
        "title": "AYT Sayısal Çıkmış Sorular (2018-2024)",
        "filename": "CS_AYT_SAY_2018_2026.pdf",
        "url": "https://ogm-small-cdn.eba.gov.tr/ogm-test-images/6abbe07510f5ec2735b6cda6/CS_AYT_SAY_2018_2026.pdf"
    },
    {
        "id": "AYT_DIN",
        "title": "AYT Din Kültürü Sözel Çıkmış Sorular (2018-2024)",
        "filename": "CS_AYT_DIIN_SOZ_2018_2026.pdf",
        "url": "https://ogm-small-cdn.eba.gov.tr/ogm-test-images/6abc1cb910f5ec2735b7be59/CS_AYT_DIIN_SOZ_2018_2026.pdf"
    },
    {
        "id": "YDT",
        "title": "YDT Çıkmış Sorular (2018-2024)",
        "filename": "CS_YDT_2018_2026.pdf",
        "url": "https://ogm-small-cdn.eba.gov.tr/ogm-test-images/6abae76e5748c605dd819d0a/CS_YDT_2018_2026.pdf"
    }
]


def download_file(item: dict) -> bool:
    dest_path = DEST_DIR / item["filename"]
    if dest_path.exists() and dest_path.stat().st_size > 1000:
        print(f"⏩ Zaten mevcut: {item['filename']} ({dest_path.stat().st_size // (1024*1024)} MB)")
        return True

    print(f"📥 İndiriliyor: {item['title']} -> {item['filename']}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    req = urllib.request.Request(item["url"], headers=headers)

    tmp_path = dest_path.with_suffix(".tmp")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp, open(tmp_path, "wb") as f:
            total_size = int(resp.headers.get("Content-Length", 0))
            downloaded = 0
            start_time = time.time()
            chunk_size = 1024 * 1024  # 1MB
            while True:
                chunk = resp.read(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                percent = (downloaded / total_size * 100) if total_size else 0
                mb = downloaded / (1024 * 1024)
                sys.stdout.write(f"\r   [{percent:.1f}%] {mb:.1f} MB / {total_size / (1024*1024):.1f} MB")
                sys.stdout.flush()
        print()
        tmp_path.rename(dest_path)
        print(f"✅ Başarılı: {item['filename']}")
        return True
    except Exception as err:
        print(f"\n❌ Hata ({item['filename']}): {err}")
        if tmp_path.exists():
            tmp_path.unlink()
        return False


def main():
    print(f"=== YKS Resmi MEB Kitapçıkları İndirme Başlıyor ({len(BOOKS)} dosya) ===")
    success_count = 0
    for book in BOOKS:
        if download_file(book):
            success_count += 1
    print(f"\n=== Tamamlandı: {success_count}/{len(BOOKS)} kitap indirildi ===")


if __name__ == "__main__":
    main()

