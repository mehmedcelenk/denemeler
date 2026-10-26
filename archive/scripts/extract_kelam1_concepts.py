#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kelam 1 (KLM_1) 1. ve 2. Ünite İstılah & Kavram Çıkarıcı.

Yalnızca MEB Kelam 1 müfredatını (1. ve 2. Üniteler / Sayfa 11-48) hedefler.
Bölüm bölüm (5 odaklı parça) çıkararak token sınırlarını aşmaz ve jilet gibi kesinlik sağlar.
"""

import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List

from evren_client import EvrenClient

ROOT_DIR = Path(__file__).resolve().parents[2]
BOOK_MD_PATH = ROOT_DIR / "docs" / "kitaplar" / "markdown" / "KLM_1_2.md"
OUT_JSON_PATH = ROOT_DIR / "docs" / "kitaplar" / "json" / "KLM_1_concepts.json"
DATA_CONCEPTS_DIR = ROOT_DIR / "data" / "concepts"
DATA_CONCEPTS_DIR.mkdir(parents=True, exist_ok=True)
RUNTIME_JSON_PATH = DATA_CONCEPTS_DIR / "KLM_1_concepts.json"


def split_book_pages(md_text: str) -> Dict[int, str]:
    pages = re.split(r"<!-- Sayfa: (\d+) -->", md_text)
    page_dict: Dict[int, str] = {}
    for i in range(1, len(pages), 2):
        p_num = int(pages[i])
        page_dict[p_num] = pages[i + 1]
    return page_dict


def build_page_slice(page_dict: Dict[int, str], start_p: int, end_p: int) -> str:
    parts = []
    for p in range(start_p, end_p + 1):
        if p in page_dict:
            parts.append(f"--- SAYFA {p} ---\n" + page_dict[p].strip())
    return "\n\n".join(parts)


EXTRACT_PROMPT = """Sen MEB Din Öğretimi Genel Müdürlüğü AÖL Kelam Zümre Başkanısın.
Aşağıda AÖİHL Kelam 1 ders kitabının {section_title} (Sayfa {start_p}-{end_p}) metni yer almaktadır.

Bu metinden yalnızca Kelam 1 (Dönem 1) müfredatına dahil olan, MEB sınavlarında soru kökü veya çeldirici olarak çıkan 4 ile 8 adet arasındaki en kritik kavramı çıkar.

Şema:
{{
  "kavramlar": [
    {{
      "id": "klm1_<kavram_kodu_snake_case>",
      "term": "<Kavramın Tam Adı>",
      "subject": "KLM",
      "ders": "KELAM – 1",
      "ders_kodu": 819,
      "donem": 1,
      "unite_no": {unit_no},
      "sayfa": <bu kavramın en net tanımlandığı sayfa no - tamsayı>,
      "tanim": "<MEB ders kitabındaki öz, kesin ve sınavda aranan tanım>",
      "baglam_farki": "<Bu kavramın Kelam ilmindeki özel anlamı veya fıkıh/felsefeden farkı>",
      "sinav_ipucu": "<MEB sınavlarında bu kavram nasıl sorulur, çeldiricisi nedir?>",
      "aliases": ["<varsa eş anlamlı veya diğer adları>"]
    }}
  ]
}}

Yalnızca geçerli JSON formatında yanıt ver.

--- DERS KİTABI METNİ ---
{text}
"""


def parse_safe_json(raw: str) -> List[Dict[str, Any]]:
    # 1. Doğrudan parse
    try:
        data = json.loads(raw)
        if isinstance(data, dict) and "kavramlar" in data:
            return data["kavramlar"]
        elif isinstance(data, list):
            return data
    except Exception:
        pass

    # 2. Markdown bloklarını ayıkla
    match = re.search(r"```json\s*(.*?)\s*```", raw, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(1))
            if isinstance(data, dict) and "kavramlar" in data:
                return data["kavramlar"]
        except Exception:
            pass

    # 3. Kısmi/kesik JSON tamiri
    brace_start = raw.find("{")
    if brace_start != -1:
        snippet = raw[brace_start:]
        last_obj_end = snippet.rfind("}")
        if last_obj_end != -1:
            candidate = snippet[:last_obj_end + 1]
            if candidate.count("{") > candidate.count("}"):
                candidate += "}" * (candidate.count("{") - candidate.count("}"))
            if candidate.count("[") > candidate.count("]"):
                candidate += "]" * (candidate.count("[") - candidate.count("]"))
            try:
                data = json.loads(candidate)
                if isinstance(data, dict) and "kavramlar" in data:
                    return data["kavramlar"]
            except Exception:
                pass
    return []


def main() -> None:
    if not BOOK_MD_PATH.exists():
        print(f"Hata: Kitap dosyası bulunamadı: {BOOK_MD_PATH}")
        sys.exit(1)

    client = EvrenClient()
    if not client.is_configured:
        print("Hata: EVREN_API_KEY yapılandırılmamış.")
        sys.exit(1)

    print("=== KELAM 1 (1. & 2. ÜNİTE) KAVRAM ÇIKARMA MOTORU ===")
    book_text = BOOK_MD_PATH.read_text(encoding="utf-8")
    pages = split_book_pages(book_text)

    # 5 Odaklı MEB Dilimi (Sayfa 11 - 48):
    slices = [
        (1, "1. Ünite - Tanım, Konu, Amaç ve Doğuş", 11, 18),
        (1, "1. Ünite - İlimlerle İlişki ve Kelamın Yöntemi", 19, 28),
        (2, "2. Ünite - Varlık Meselesi (Allah-Âlem, Hayat, İnsan)", 29, 34),
        (2, "2. Ünite - Bilgi Meselesi (Akl-ı Selîm, Haber-i Sadık, Havass-ı Selîme)", 35, 40),
        (2, "2. Ünite - Delil ve Hüküm (Temsil, İstikra, Vâcip, Mümkin, Mümteni)", 41, 48),
    ]

    all_concepts: List[Dict[str, Any]] = []
    seen_ids = set()

    for unit_no, title, start_p, end_p in slices:
        print(f"\n[*] İşleniyor: {title} (Sayfa {start_p}-{end_p})...")
        slice_text = build_page_slice(pages, start_p, end_p)
        prompt = EXTRACT_PROMPT.format(
            unit_no=unit_no,
            section_title=title,
            start_p=start_p,
            end_p=end_p,
            text=slice_text[:22000],
        )

        reply, usage = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model="deepseek-v4.1-flash",
            temperature=0.1,
            max_tokens=4096,
            thinking=False,
            response_format={"type": "json_object"},
        )
        print(f"  -> Bitti. Token kullanımı: {usage.get('total_tokens', 0)}")

        extracted = parse_safe_json(reply)
        print(f"  -> Çıkarılan kavram sayısı: {len(extracted)}")

        for item in extracted:
            cid = item.get("id", "").strip()
            term = item.get("term", "").strip()
            if not cid or not term:
                continue
            if cid in seen_ids:
                cid = f"{cid}_{item.get('sayfa', start_p)}"
                item["id"] = cid
            if cid not in seen_ids:
                seen_ids.add(cid)
                # Garanti alanları
                item["subject"] = "KLM"
                item["ders"] = "KELAM – 1"
                item["ders_kodu"] = 819
                item["donem"] = 1
                item["unite_no"] = unit_no
                all_concepts.append(item)
                print(f"     ✓ {term} (S.{item.get('sayfa', start_p)})")

    print(f"\n==========================================")
    print(f"[+] Toplam {len(all_concepts)} adet Kelam 1 kavramı başarıyla çıkarıldı.")

    OUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON_PATH.write_text(json.dumps(all_concepts, indent=2, ensure_ascii=False), encoding="utf-8")
    RUNTIME_JSON_PATH.write_text(json.dumps(all_concepts, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f" -> Kaydedildi: {OUT_JSON_PATH}")
    print(f" -> Kaydedildi: {RUNTIME_JSON_PATH}")


if __name__ == "__main__":
    main()
