#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tüm Branşlar (TAR, COG, FEL, INK, KLM, BIO, FIZ, KIM, MAT, DIN, SAG, AOF)
Kavram Kataloglarını Normalize Etme, Regex Düzeltme, '💡 Hile:' Dönüşümü ve EVREN Motoru.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import glob
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.core.catalog_expansions import NEW_CONCEPTS_BY_SUBJECT, STEM_CONTEXT_MAP
from scripts.core.evren_client import EvrenClient
from scripts.core.evren_tde_grammar_xray_pipeline import extract_json_object

CONCEPTS_DIR = ROOT_DIR / "data" / "concepts"
CATALOGS_DIR = ROOT_DIR / "scripts" / "catalogs"
STATE_PATH = CONCEPTS_DIR / "all_subjects_hile_refinement_state.json"

HILE_REFINEMENT_SYSTEM_PROMPT = """Sen MEB Açık Öğretim Lisesi Başmüfettişi, Deha Eğitim Metodoloğu ve Hafıza Şampiyonusun.
Sana bir dersin kavramları (`id`, `term`, `ders`, `tanim`) verilecek.

GÖREVİN:
1. `tanim` içindeki mevcut akademik gövdeyi (tanım cümlesini ve örnekleri) koru.
2. En alttaki `\\n💡 Hile:` kısmını denetle. Eğer zayıfsa, formül/şifre gibi kuru kalmışsa veya yoksa;
   öğrencinin sınavda saniyeler içinde şıkkı işaretlemesini sağlayan, normalde karıştırılan şeyleri
   deha bir zihinsel kısayolla (analoji, ters köşe kuralı, tezat testi, anahtar kelime dedektifliği)
   kolaycık çözen GERÇEK BİR DEHA HİLESİNE dönüştür.
3. Çıktı formatı SADECE aşağıdaki JSON şemasında olmalıdır:
```json
{
  "results": [
    {
      "id": "kavram_id",
      "tanim": "Akademik gövde tanımı...\\n💡 Hile: Gerçek deha zihinsel kısayol..."
    }
  ]
}
```"""


def clean_regex_escapes(pat: str) -> str:
    if not pat:
        return ""
    # Regex kaçışlarındaki gereksiz çoklu ters bölüleri temizle
    out = re.sub(r'\\{2,}([bs().?])', r'\\\1', pat)
    return out


def convert_sifre_to_hile(tanim: str, sinav_ipucu: Optional[str] = None) -> str:
    if not tanim:
        tanim = ""
    tanim = tanim.strip()

    out = re.sub(
        r"💡\s*(?:Sınav\s+Şifresi|Şifre|İpucu|Formül\s*/\s*Şifre|Formül)\s*:",
        "💡 Hile:",
        tanim,
        flags=re.IGNORECASE,
    )
    if "💡" in out and "💡 Hile:" not in out:
        out = re.sub(r"💡\s*", "💡 Hile: ", out)

    if "💡 Hile:" not in out and sinav_ipucu:
        s_ip = sinav_ipucu.strip()
        if s_ip:
            out = f"{out}\n💡 Hile: {s_ip}"

    return out


def split_anchored_pattern(
    pat: str,
    existing_opt: Optional[str] = None,
    existing_ctx: Optional[str] = None,
) -> Tuple[str, Optional[str], Optional[str]]:
    pat = clean_regex_escapes(pat)
    parts = [p.strip() for p in pat.split("|") if p.strip()]

    if existing_opt:
        for p in existing_opt.split("|"):
            p = p.strip()
            if p and p not in parts:
                parts.append(p)

    general_parts: List[str] = []
    option_parts: List[str] = []
    stem_contexts: List[str] = []

    if existing_ctx:
        for c in existing_ctx.split("|"):
            c = c.strip()
            if c and c not in stem_contexts:
                stem_contexts.append(c)

    for p in parts:
        if p.startswith("^") and p.endswith("$"):
            option_parts.append(p)
            if p in STEM_CONTEXT_MAP:
                stem_contexts.append(STEM_CONTEXT_MAP[p])
            else:
                inner = p[1:-1]
                if len(inner) >= 3 and r"\?" not in inner:
                    general_parts.append(rf"\b{inner}\b")
        else:
            if not (p.startswith(r"\b") or p.startswith("^") or p.startswith("(")):
                p = rf"\b{p}"
            if not (p.endswith(r"\b") or p.endswith("$") or p.endswith(")") or p.endswith("*")):
                p = rf"{p}\b"
            general_parts.append(p)

    gen_str = "|".join(dict.fromkeys(general_parts))
    opt_str = "|".join(dict.fromkeys(option_parts)) if option_parts else None
    ctx_str = "|".join(dict.fromkeys(stem_contexts)) if stem_contexts else None
    return gen_str, opt_str, ctx_str


def normalize_concept_item(c: Dict[str, Any], subject_code: str) -> Dict[str, Any]:
    c["subject"] = c.get("subject") or subject_code
    c["tanim"] = convert_sifre_to_hile(c.get("tanim", ""), c.get("sinav_ipucu"))

    raw_pat = c.get("pattern", "")
    gen_pat, opt_pat, ctx_pat = split_anchored_pattern(
        raw_pat,
        existing_opt=c.get("option_only_pattern"),
        existing_ctx=c.get("stem_context_pattern"),
    )
    c["pattern"] = gen_pat
    if opt_pat:
        c["option_only_pattern"] = opt_pat
    else:
        c.pop("option_only_pattern", None)

    if ctx_pat:
        c["stem_context_pattern"] = ctx_pat
    else:
        c.pop("stem_context_pattern", None)

    return c


def load_and_normalize_all_catalogs() -> Dict[str, List[Dict[str, Any]]]:
    """Tüm data/concepts/*.json dosyalarını yükler, normalize eder ve yeni kavramları ekler."""
    results: Dict[str, List[Dict[str, Any]]] = {}

    json_files = sorted(CONCEPTS_DIR.glob("*_concepts.json"))
    for p in json_files:
        if "tde" in p.name.lower() or "phonology" in p.name.lower() or "convergence" in p.name.lower():
            continue

        file_key = p.stem.replace("_concepts", "")
        # Subject kodunu bul (örn: TAR_1 -> TAR, BIO -> BIO, AOF_ITAR -> AOF_ITAR)
        if file_key.startswith("AOF_"):
            sub_code = file_key
        elif "_" in file_key:
            sub_code = file_key.split("_")[0]
        else:
            sub_code = file_key

        items: List[Dict[str, Any]] = json.loads(p.read_text(encoding="utf-8"))
        norm_items: List[Dict[str, Any]] = []
        seen_ids = set()

        for c in items:
            cid = c.get("id")
            if not cid or cid in seen_ids:
                continue
            seen_ids.add(cid)
            norm_items.append(normalize_concept_item(c, sub_code))

        # Yeni kavramları ekle
        new_candidates = NEW_CONCEPTS_BY_SUBJECT.get(sub_code, [])
        for nc in new_candidates:
            # Eğer dosya dönemliyse (örn: TAR_1) ve kavram başka döneme aitse atla
            if "_" in file_key and not file_key.startswith("AOF_"):
                sem_part = file_key.split("_")[-1]
                if sem_part.isdigit() and int(sem_part) != nc.get("donem", 1):
                    continue

            cid = nc["id"]
            if cid in seen_ids:
                continue
            seen_ids.add(cid)

            ders_title = f"{sub_code} – {nc.get('donem', 1)}"
            entry = {
                "id": cid,
                "base_id": cid,
                "term": nc["term"],
                "subject": sub_code,
                "ders": ders_title,
                "ders_kodu": None,
                "donem": nc.get("donem", 1),
                "unite_no": None,
                "sayfa": nc.get("sayfa", 10),
                "tanim": convert_sifre_to_hile(nc["tanim"]),
                "baglam_farki": None,
                "sinav_ipucu": None,
                "pattern": nc["pattern"],
                "aliases": [],
            }
            if nc.get("option_only_pattern"):
                entry["option_only_pattern"] = nc["option_only_pattern"]
            if nc.get("stem_context_pattern"):
                entry["stem_context_pattern"] = nc["stem_context_pattern"]

            norm_items.append(normalize_concept_item(entry, sub_code))

        results[p.stem] = norm_items

    return results


def refine_all_hiles_with_evren(
    catalogs_by_file: Dict[str, List[Dict[str, Any]]],
    workers: int = 10,
) -> None:
    """Tüm branşlardaki kavramların '💡 Hile:' kısımlarını EVREN ile doğrular ve deha seviyesine taşır."""
    client = EvrenClient()
    state = {}
    if STATE_PATH.exists():
        try:
            state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
        except Exception:
            state = {}
    completed_ids: Dict[str, str] = state.get("completed_ids", {})

    pending_items: List[Dict[str, Any]] = []
    for f_key, items in catalogs_by_file.items():
        for c in items:
            cid = c["id"]
            if cid in completed_ids:
                c["tanim"] = completed_ids[cid]
            else:
                # Eğer zaten kaliteli 💡 Hile varsa ve uzunluğu yeterliyse
                t = c.get("tanim", "")
                if "💡 Hile:" in t and len(t) >= 120 and "💡 Hile: " in t and len(t.split("💡 Hile:")[1].strip()) >= 50:
                    completed_ids[cid] = t
                else:
                    pending_items.append(c)

    state["completed_ids"] = completed_ids
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    if not pending_items:
        print(f"✅ Tüm {len(completed_ids)} kavramın '💡 Hile:' içeriği hazır ve doğrulanmış.")
        return

    batch_size = 12
    batches = [pending_items[i : i + batch_size] for i in range(0, len(pending_items), batch_size)]
    print(f"🚀 EVREN (deepseek-v4.1-flash) '💡 Hile:' Deha Kısayol Motoru: {len(pending_items)} kavram ({len(batches)} paket)...")

    def _process_batch(batch: List[Dict[str, Any]]) -> Dict[str, str]:
        payload = [
            {
                "id": it["id"],
                "term": it["term"],
                "ders": it.get("ders", it.get("subject", "")),
                "tanim": it["tanim"],
            }
            for it in batch
        ]
        user_prompt = (
            f"Aşağıdaki {len(payload)} adet MEB Açık Lise kavramının gövde tanımını koruyarak en alttaki `💡 Hile:` "
            f"kısmını normalde zor veya karıştırılan bir noktayı deha bir akılla saniyeler içinde kolaycık "
            f"çözdüren gerçek bir hileye dönüştür:\n"
            f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
        )
        for model in ["deepseek-v4.1-flash", "qwen3.8-flash-next"]:
            try:
                content, _ = client.chat_completion(
                    messages=[
                        {"role": "system", "content": HILE_REFINEMENT_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    model=model,
                    temperature=0.15,
                    max_tokens=4096,
                    thinking=False,
                )
                parsed = extract_json_object(content)
                if parsed and isinstance(parsed.get("results"), list):
                    out_map: Dict[str, str] = {}
                    for r in parsed["results"]:
                        if isinstance(r, dict) and r.get("id") and r.get("tanim"):
                            t_val = convert_sifre_to_hile(str(r["tanim"]).strip())
                            if "💡 Hile:" in t_val and len(t_val) >= 40:
                                out_map[str(r["id"])] = t_val
                    if out_map:
                        return out_map
            except Exception:
                time.sleep(1.0)
        return {}

    done = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(_process_batch, b): b for b in batches}
        for fut in as_completed(futures):
            batch = futures[fut]
            res_map = fut.result()
            done += 1
            for item in batch:
                cid = item["id"]
                if cid in res_map:
                    item["tanim"] = res_map[cid]
                    completed_ids[cid] = res_map[cid]
                else:
                    completed_ids[cid] = item["tanim"]
            state["completed_ids"] = completed_ids
            STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  [{done}/{len(batches)}] Paket tamamlandı ({len(res_map)} hile güncellendi) | {time.time() - t0:.1f}s", flush=True)


def update_python_catalogs(catalogs_by_file: Dict[str, List[Dict[str, Any]]]) -> None:
    """scripts/catalogs/ altındaki python sözlük dosyalarını da günceller."""
    for file_key, concepts in catalogs_by_file.items():
        base_name = file_key.replace("_concepts", "")
        # örn: TAR_1 -> tar1_precise_catalog.py, BIO -> bio_precise_catalog.py
        py_name = f"{base_name.lower().replace('_', '')}_precise_catalog.py"
        py_path = CATALOGS_DIR / py_name
        if not py_path.exists():
            continue

        var_name = f"PRECISE_{base_name.upper().replace('_', '')}_CONCEPTS"
        lines = [
            "#!/usr/bin/env python3",
            "# -*- coding: utf-8 -*-",
            f'"""MEB {base_name.upper()} Yüksek Hassasiyetli Kanonik Kavram ve Terim Sözlüğü."""',
            "",
            "from typing import Any, Dict, List",
            "",
            f"{var_name}: List[Dict[str, Any]] = [",
        ]
        for c in concepts:
            lines.append("    {")
            lines.append(f'        "id": {repr(c.get("id"))},')
            lines.append(f'        "term": {repr(c.get("term"))},')
            lines.append(f'        "sayfa": {repr(c.get("sayfa", 10))},')
            lines.append(f'        "tanim": {repr(c.get("tanim", ""))},')
            lines.append(f'        "pattern": {repr(c.get("pattern", ""))},')
            if c.get("option_only_pattern"):
                lines.append(f'        "option_only_pattern": {repr(c.get("option_only_pattern"))},')
            if c.get("stem_context_pattern"):
                lines.append(f'        "stem_context_pattern": {repr(c.get("stem_context_pattern"))},')
            lines.append("    },")
        lines.append("]")
        lines.append("")
        py_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Tüm Branşlar Kavram Kataloglarını Normalize Et ve EVREN Hileleriyle Zenginleştir")
    parser.add_argument("--skip-evren", action="store_true", help="EVREN çağrısını atla (yalnızca yerel normalizasyon)")
    parser.add_argument("--workers", type=int, default=10, help="EVREN paralel iş parçacığı sayısı")
    args = parser.parse_args()

    print("=== TÜM BRANŞLAR KAVRAM KATALOĞU NORMALİZASYON VE '💡 HİLE:' DÖNÜŞÜM MOTORU ===")
    catalogs = load_and_normalize_all_catalogs()

    total_concepts = sum(len(items) for items in catalogs.values())
    print(f"📊 Toplam Yüklenen & Normalize Edilen Kavram Sayısı: {total_concepts} ({len(catalogs)} katalog dosyası)")

    for f_key, items in sorted(catalogs.items()):
        print(f"  • {f_key:25}: {len(items):3} kavram")

    if not args.skip_evren:
        refine_all_hiles_with_evren(catalogs, workers=args.workers)

    # JSON dosyalarını kaydet
    for file_key, concepts in catalogs.items():
        json_path = CONCEPTS_DIR / f"{file_key}.json"
        json_path.write_text(json.dumps(concepts, ensure_ascii=False, indent=2), encoding="utf-8")

    # Python katalog dosyalarını güncelle
    update_python_catalogs(catalogs)
    print("✅ Tüm data/concepts/*.json ve scripts/catalogs/*.py dosyaları güncellendi ve kaydedildi!")


if __name__ == "__main__":
    main()
