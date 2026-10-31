#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖF İlahiyat Çıkmış Sınav Sorularını 1.1.1 (1. Sınıf 1. Dönem Vize) Hiyerarşisine Güncelleyici.

Mevcut AÖF derslerindeki çıkmış sınav sorularını (378 soru):
- yil: '1.1 Vizeler'
- donem: '1.1.1'
- sinav_kodu: '1.1.1'
- sinav_adi: '1. Sınıf 1. Dönem Ara Sınavı (Vize)'
olarak yapılandırır. Alıştırma sorularını (yil: 'AÖF Alıştırma Soruları') korur.
"""

import json
from pathlib import Path
from typing import Any, Dict, List

ROOT_DIR = Path(__file__).resolve().parents[2]
SUBJECTS_DIR = ROOT_DIR / "data" / "subjects"
AOF_FILES = [
    "AOF_ITAR.json",
    "AOF_HADIS.json",
    "AOF_AHLAK.json",
    "AOF_IBADET.json",
    "AOF_INANC.json",
]


def update_subject_file(file_name: str) -> int:
    path = SUBJECTS_DIR / file_name
    if not path.exists():
        print(f"Uyarı: {path} bulunamadı.")
        return 0

    questions: List[Dict[str, Any]] = json.loads(path.read_text(encoding="utf-8"))
    updated_count = 0

    for q in questions:
        # Alıştırma sorularına dokunma
        if q.get("yil") == "AÖF Alıştırma Soruları":
            continue

        q["yil"] = "1.1 Vizeler"
        q["donem"] = "1.1.1"
        q["sinav_kodu"] = "1.1.1"
        q["sinav_adi"] = "1. Sınıf 1. Dönem Ara Sınavı (Vize)"
        updated_count += 1

    path.write_text(
        json.dumps(questions, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"{file_name}: {updated_count} çıkmış soru '1.1.1 (1.1 Vizeler)' olarak güncellendi.")
    return updated_count


def main() -> None:
    print("=== AÖF İLAHİYAT SINAV HİYERARŞİSİ GÜNCELLEMESİ (1.1.1 VİZELER) ===")
    total_updated = 0
    for f in AOF_FILES:
        total_updated += update_subject_file(f)
    print(f"Toplam Güncellenen Soru Sayısı: {total_updated}")


if __name__ == "__main__":
    main()

