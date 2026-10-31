#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖF İlk Dönem İslâm Tarihi (İDİT) Kavram Sözlüğü Derleyici.

Modüler 1-5 ünite kavramlarını birleştirir, ID benzersizliğini doğrular
ve data/concepts/AOF_ITAR_concepts.json dosyasını üretir.
"""

import json
from pathlib import Path
from typing import Any, Dict, List

from scripts.enrichment.itar_concepts_u1 import UNIT1_CONCEPTS
from scripts.enrichment.itar_concepts_u2 import UNIT2_CONCEPTS
from scripts.enrichment.itar_concepts_u3 import UNIT3_CONCEPTS
from scripts.enrichment.itar_concepts_u4 import UNIT4_CONCEPTS
from scripts.enrichment.itar_concepts_u5 import UNIT5_CONCEPTS

ROOT_DIR = Path(__file__).resolve().parents[2]
CONCEPTS_FILE = ROOT_DIR / "data" / "concepts" / "AOF_ITAR_concepts.json"


def get_all_concepts() -> List[Dict[str, Any]]:
    all_c = (
        UNIT1_CONCEPTS
        + UNIT2_CONCEPTS
        + UNIT3_CONCEPTS
        + UNIT4_CONCEPTS
        + UNIT5_CONCEPTS
    )
    seen = set()
    for c in all_c:
        cid = c["id"]
        if cid in seen:
            raise ValueError(f"Yinelenen kavram id'si: {cid}")
        seen.add(cid)
    return all_c


def main() -> None:
    concepts = get_all_concepts()
    CONCEPTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CONCEPTS_FILE, "w", encoding="utf-8") as f:
        json.dump(concepts, f, ensure_ascii=False, indent=2)
    print(f"Başarıyla derlendi: {CONCEPTS_FILE} (Toplam {len(concepts)} kavram)")


if __name__ == "__main__":
    main()
