#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN 64x H200 GPU Destekli Tüm Katalogları (TDE, TAR, COĞ, FEL, İNK) Yükseltme Motoru.

Amacı:
- Mevcut tüm `*_precise_catalog.py` dosyalarındaki kuru sözlük tanımlarını okur.
- EVREN (`deepseek-v4.1-flash`) üzerinden 16 paralel iş parçacığı ile her kavramı:
  1) Hiç bilmeyen bir öğrencinin 3 saniyede sıfırdan öğreneceği Feynman sadeliğinde,
  2) Gelenek (Türk-İslam tarihi/kültürü) ile Modernlik (yapay zekâ, sinema, teknoloji, güncel yaşam)
     arasında doğal denge kuran akılda kalıcı analoji/hikayeyle,
  3) En altında mutlaka `\n💡 Sınav Şifresi: ...` satırı barındıracak şekilde günceller.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
import importlib.util
import json
import pprint
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.core.evren_client import EvrenClient

CORE_DIR = ROOT_DIR / "scripts" / "core"

TARGET_CATALOGS = [
    "cog1_precise_catalog.py",
    "cog2_precise_catalog.py",
    "cog3_precise_catalog.py",
    "cog4_precise_catalog.py",
    "fel1_precise_catalog.py",
    "fel2_precise_catalog.py",
    "fel3_precise_catalog.py",
    "fel4_precise_catalog.py",
    "ink1_precise_catalog.py",
    "ink2_precise_catalog.py",
    "tar1_precise_catalog.py",
    "tar2_precise_catalog.py",
    "tar3_precise_catalog.py",
    "tar4_precise_catalog.py",
    "tar5_precise_catalog.py",
    "tar6_precise_catalog.py",
    "tde1_precise_catalog.py",
    "tde2_precise_catalog.py",
    "tde3_precise_catalog.py",
    "tde4_precise_catalog.py",
    "tde5_precise_catalog.py",
    "tde6_precise_catalog.py",
    "tde7_precise_catalog.py",
    "tde8_precise_catalog.py",
]

SYSTEM_PROMPT = (
    "Sen MEB Açık Öğretim Lisesi (AÖL) Baş Pedagoji ve Müfredat Mimarısın.\n"
    "Görevin: Verilen kavram listesinin her bir maddesindeki `tanim` metnini, öğrencinin çıkmış soru çözerken "
    "kelimeye tıkladığı anda **konuyu sıfırdan, korkmadan ve 3 saniyede öğreneceği** yeni nesil formata dönüştürmektir.\n\n"
    "ALTIN ANAYASA KURALLARI:\n"
    "1. **Sıfırdan Öğreten Yalın Türkçe + Analoji:** Akademik laf kalabalığı yasaktır. Kavramı anlatırken yeri geldiğinde "
    "**Türk ve İslam tarihinin/kültürünün köklerinden** (Orhun, Harezmi, İbn Haldun, Fatih, Ahilik, Yunus Emre), yeri geldiğinde ise "
    "**modern bilim, teknoloji, sinema ve güncel yaşamdan** (yapay zekâ, mikroçipler, sinema flashback kurgusu, sosyal medya, "
    "navigasyon/GPS, siber güvenlik, modern ekonomi) doğal ve akılda kalıcı bir benzetme/hikaye kur.\n"
    "2. **Kısa ve Öz Boyut:** İlk kısım **1 veya en fazla 2 akıcı cümle** olsun (`**kalın**` vurgular kullanabilirsin).\n"
    "3. **Zorunlu Sınav Şifresi Satırı:** Açıklamanın hemen altına `\\n💡 Sınav Şifresi: ...` satırı ekle ve MEB sınavlarında "
    "bu kavramı diğer şıklardan ayırt ettiren en kritik ipucunu, kodlamayı veya anahtar kelimeleri yaz.\n"
    "4. Eğer mevcut tanımda `---` ile ayrılmış dönem/sınıf geçişleri varsa (ör. 9. Sınıf --- 10. Sınıf), bu `---` yapısını koruyarak her bölümü özlü ve şifreli hale getir.\n"
    "5. Yalnızca geçerli bir JSON dizisi döndür: `[{\"id\": \"...\", \"tanim\": \"...\"}]`"
)


def upgrade_batch_with_evren(
    client: EvrenClient,
    catalog_name: str,
    batch: List[Dict[str, Any]],
) -> Dict[str, str]:
    items_payload = [
        {
            "id": item["id"],
            "term": item["term"],
            "old_tanim": item.get("tanim", ""),
        }
        for item in batch
    ]
    user_prompt = (
        f"Katalog: {catalog_name}\n"
        f"Dönüştürülecek Kavramlar:\n{json.dumps(items_payload, ensure_ascii=False, indent=2)}\n\n"
        "Lütfen her kavram için yeni nesil (1-2 cümle öz + `\\n💡 Sınav Şifresi:`) `tanim` içeren JSON dizisini üret:"
    )
    try:
        content, _ = client.chat_completion(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            model="deepseek-v4.1-flash",
            temperature=0.2,
            max_tokens=4096,
            thinking=False,
        )
        cleaned = content.strip()
        if "```" in cleaned:
            m = re.search(r"```(?:json)?\s*([\s\S]+?)```", cleaned)
            if m:
                cleaned = m.group(1).strip()
        start_b = cleaned.find("[")
        end_b = cleaned.rfind("]")
        if start_b != -1 and end_b != -1:
            arr = json.loads(cleaned[start_b : end_b + 1])
            if isinstance(arr, list):
                return {
                    str(x["id"]): str(x["tanim"]).strip()
                    for x in arr
                    if isinstance(x, dict) and x.get("id") and x.get("tanim")
                }
    except Exception as e:
        print(f"  [!] EVREN batch hatası ({catalog_name}): {e}")
    return {}


def load_catalog_module(file_path: Path) -> Tuple[str, List[Dict[str, Any]], str]:
    text = file_path.read_text(encoding="utf-8")
    m_doc = re.search(r'"""([\s\S]*?)"""', text)
    docstring = m_doc.group(1).strip() if m_doc else file_path.stem
    m_var = re.search(r"(PRECISE_[A-Z0-9_]+_CONCEPTS)\s*:", text)
    if not m_var:
        m_var = re.search(r"(PRECISE_[A-Z0-9_]+_CONCEPTS)\s*=", text)
    var_name = m_var.group(1) if m_var else "PRECISE_CONCEPTS"

    spec = importlib.util.spec_from_file_location(file_path.stem, file_path)
    mod = importlib.util.module_from_spec(spec)  # type: ignore
    spec.loader.exec_module(mod)  # type: ignore
    concepts = getattr(mod, var_name)
    return var_name, concepts, docstring


def save_catalog_module(
    file_path: Path,
    var_name: str,
    concepts: List[Dict[str, Any]],
    docstring: str,
) -> None:
    lines = [
        "#!/usr/bin/env python3",
        "# -*- coding: utf-8 -*-",
        f'"""{docstring}"""',
        "",
        "from typing import Any, Dict, List, Tuple",
        "",
        f"{var_name}: List[Dict[str, Any]] = [",
    ]
    for c in concepts:
        lines.append("    {")
        lines.append(f'        "id": {json.dumps(c["id"], ensure_ascii=False)},')
        lines.append(f'        "term": {json.dumps(c["term"], ensure_ascii=False)},')
        if "sayfa" in c:
            lines.append(f'        "sayfa": {c["sayfa"]},')
        if "tanim" in c:
            lines.append(f'        "tanim": {json.dumps(c["tanim"], ensure_ascii=False)},')
        if "pattern" in c:
            lines.append(f'        "pattern": r{json.dumps(c["pattern"], ensure_ascii=False)},')
        lines.append("    },")
    lines.append("]")
    lines.append("")
    file_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    print("=== EVREN 64x H200 GPU KATALOG YÜKSELTME SEFERBERLİĞİ ===")
    client = EvrenClient()
    if not client.is_configured:
        print("Hata: EVREN istemcisi yapılandırılmamış.")
        return

    target_files = [CORE_DIR / fname for fname in TARGET_CATALOGS if (CORE_DIR / fname).exists()]
    if len(sys.argv) > 1:
        custom = [a for a in sys.argv[1:] if not a.startswith("-")]
        if custom:
            target_files = [CORE_DIR / f for f in custom if (CORE_DIR / f).exists()]

    all_tasks = []
    catalog_records: Dict[str, Dict[str, Any]] = {}

    for fpath in target_files:
        var_name, concepts, docstring = load_catalog_module(fpath)
        catalog_records[fpath.name] = {
            "path": fpath,
            "var_name": var_name,
            "concepts": concepts,
            "docstring": docstring,
        }
        # Yalnızca henüz 💡 Sınav Şifresi eklenmemiş olanları 10'arlı batch'lere böl
        pending = [c for c in concepts if "💡" not in c.get("tanim", "")]
        for i in range(0, len(pending), 10):
            batch = pending[i : i + 10]
            all_tasks.append((fpath.name, batch))

    print(f"[*] Toplam {len(target_files)} katalog, {len(all_tasks)} kalan EVREN batch görevi başlatılıyor...")

    upgraded_map: Dict[str, Dict[str, str]] = {f.name: {} for f in target_files}

    with ThreadPoolExecutor(max_workers=4) as pool:
        fut_map = {
            pool.submit(upgrade_batch_with_evren, client, cname, batch): cname
            for cname, batch in all_tasks
        }
        done_count = 0
        for fut in as_completed(fut_map):
            cname = fut_map[fut]
            res = fut.result()
            upgraded_map[cname].update(res)
            done_count += 1
            if done_count % 10 == 0 or done_count == len(all_tasks):
                print(f"    -> İlerleme: {done_count}/{len(all_tasks)} batch tamamlandı.")

    total_updated = 0
    for cname, rec in catalog_records.items():
        updates = upgraded_map.get(cname, {})
        concepts = rec["concepts"]
        cat_updated = 0
        for c in concepts:
            cid = c["id"]
            if cid in updates and len(updates[cid]) > 20:
                new_t = updates[cid]
                # 💡 kontrolü
                if "💡" not in new_t and "💡" in c.get("tanim", ""):
                    pass
                else:
                    c["tanim"] = new_t
                    cat_updated += 1
                    total_updated += 1
        save_catalog_module(rec["path"], rec["var_name"], concepts, rec["docstring"])
        print(f"[✓] {cname}: {cat_updated}/{len(concepts)} kavram yeni nesil standarda yükseltildi.")

    print(f"\n[★] Toplam {total_updated} sözel katalog kavramı EVREN ile yenilendi!")


if __name__ == "__main__":
    main()
