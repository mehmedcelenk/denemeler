#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN DeepSeek TDE 1-8 Ses Bilgisi 50'lik Paket Doğruluk Denetçisi.

`data/concepts/tde_phonology_lexicon.json` içindeki tüm kelimeleri 50'şerli
paketler halinde EVREN'in `deepseek-v4.1-flash` modeline göndererek:
1. Gerçekten MEB ve TDK kurallarına göre bir ses olayı olup olmadığını
2. Ses olayının türünü (Ünlü Düşmesi, Yumuşama, Benzeşme, Daralma, Türeme)
3. Pedagojik kök + ek açıklamasını
tek tek doğrular, sahte pozitifleri eler ve sözlüğü DeepSeek onayıyla günceller.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.core.evren_client import EvrenClient
from scripts.core.evren_tde_grammar_xray_pipeline import extract_json_object
from scripts.core.evren_tde_phonology_pipeline import (
    TDE_JSON_PATH,
    LEXICON_PATH,
    inject_phonology_into_xray,
)

AUDIT_LOG_PATH = ROOT_DIR / "data" / "concepts" / "tde_phonology_deepseek_audit.json"

DEEPSEEK_SYSTEM_PROMPT = """Sen Türk Dil Kurumu (TDK) ve MEB Talim Terbiye Kurulu Ses Bilgisi (Fonoloji) Başuzmanısın.
Sana 50 adet Türkçe kelime ve mevcut ses olayı iddiaları verilecek.

GÖREVİN:
Her kelimeyi kök ve eklerine ayırarak tek tek denetlemek:
1. GERÇEKTEN MEB müfredatında yer alan bir Ses Olayı var mı?
   - **Ünlü Düşmesi:** (akıl→aklı, şehir→şehrin, ayır-→ayrıntı, ne asıl→nasıl, kaybolmak)
   - **Ünsüz Yumuşaması:** (kitap→kitabı, ağaç→ağacı, git-→giden, tat→tadı, ettik→ettiği, çocuk→çocuğu)
   - **Ünsüz Benzeşmesi (Sertleşmesi):** (edebiyat-da→edebiyatta, git-di→gitti, et-gi→etki, bit-gi→bitki, sanat-cı→sanatçı, seç-gin→seçkin, bas-gı→baskı)
   - **Ünlü Daralması:** (başla-yor→başlıyor, söyle-yor→söylüyor, de-ye→diye, ye-yecek→yiyecek)
   - **Ünsüz Türemesi:** (hak→hakkı, his→hissetmek, af→affetmek, red→reddetmek)
   - **Ünlü Türemesi:** (bir-cik→biricik, dar-cık→daracık, az-cık→azıcık, gencecik)
   - **Ünsüz Düşmesi:** (küçük-cük→küçücük, ufak-cık→ufacık, sıcak-cık→sıcacık, alçak-l→alçalmak)
   - **N-M Değişimi:** (pembe, çember, tembel, çarşamba, perşembe, ambar)

2. KESİN YASAKLAR (Ses Olayı SAYILMAZ - Bunlara 'is_valid': false ver):
   - Kök içindeki harfler (öğren, öğretmen, doğru, değer, ağır, rağmen, başka, eski, usta, nokta, hasta) SES OLAYI DEĞİLDİR!
   - Ünsüzle biten fiile gelen yardımcı ünlü (gel-iyor, bak-ıyor, ol-uyor, bil-iyor) ÜNLÜ DARALMASI DEĞİLDİR!
   - Ses olayı olmayan ekler (gelmişler, evler, masada) SES OLAYI DEĞİLDİR!

Yanıtını SADECE aşağıdaki JSON şemasında ver:
```json
{
  "results": [
    {
      "word": "etki",
      "is_valid": true,
      "event_type": "Ünsüz Benzeşmesi (Sertleşmesi)",
      "explanation": "'et-' fiil köküne gelen '-gi' yapım eki, 't' sert ünsüzünün etkisiyle '-ki'ye dönüşmüştür (t + g > t + k)."
    },
    {
      "word": "başka",
      "is_valid": false,
      "event_type": "-",
      "explanation": "Kelime kök halindedir, ses olayı yoktur."
    }
  ]
}
```"""


def audit_batch(
    client: EvrenClient,
    batch_idx: int,
    words: List[str],
) -> Tuple[int, List[Dict[str, Any]], Optional[str]]:
    """50'lik bir kelime paketini DeepSeek ile denetler."""
    user_prompt = (
        f"Lütfen aşağıdaki {len(words)} kelimeyi tek tek incele ve ses olayı geçerliliğini doğrula:\n\n"
        + ", ".join(words)
    )

    try:
        content, _ = client.chat_completion(
            messages=[
                {"role": "system", "content": DEEPSEEK_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            model="deepseek-v4.1-flash",
            temperature=0.1,
            max_tokens=4096,
            thinking=False,
        )
        parsed = extract_json_object(content)
        if parsed and isinstance(parsed.get("results"), list):
            return batch_idx, parsed["results"], None
        return batch_idx, [], "JSON ayrıştırılamadı"
    except Exception as exc:
        return batch_idx, [], str(exc)


def main() -> None:
    parser = argparse.ArgumentParser(description="EVREN DeepSeek Ses Bilgisi 50'lik Paket Denetçisi")
    parser.add_argument("--batch-size", type=int, default=50, help="Her paketteki kelime sayısı")
    parser.add_argument("--workers", type=int, default=8, help="Paralel DeepSeek iş parçacığı")
    args = parser.parse_args()

    client = EvrenClient()
    if not client.is_configured:
        print("❌ EVREN_API_KEY bulunamadı!", file=sys.stderr)
        sys.exit(1)

    if not LEXICON_PATH.exists():
        print("❌ Sözlük dosyası bulunamadı!", file=sys.stderr)
        sys.exit(1)

    lex_data = json.loads(LEXICON_PATH.read_text(encoding="utf-8"))
    existing_lexicon = lex_data.get("lexicon", {})
    words = sorted(existing_lexicon.keys())

    batches = [words[i : i + args.batch_size] for i in range(0, len(words), args.batch_size)]

    print(
        f"🚀 DeepSeek TDE Ses Bilgisi Denetimi Başlatıldı\n"
        f"   Toplam Kelime: {len(words)} | Paket Sayısı: {len(batches)} (50'şerli)\n"
        f"   Model: deepseek-v4.1-flash | Workers: {args.workers}",
        flush=True,
    )

    audited_lexicon: Dict[str, Dict[str, str]] = {}
    invalid_words: List[Dict[str, str]] = []
    completed = 0
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(audit_batch, client, idx, batch): idx
            for idx, batch in enumerate(batches)
        }
        for future in as_completed(futures):
            b_idx = futures[future]
            _, results, err = future.result()
            completed += 1
            if err:
                print(f"  ⚠️ Paket {b_idx + 1}/{len(batches)} hatası: {err}", flush=True)
                # Hata durumunda mevcut kaydı koru
                for w in batches[b_idx]:
                    if w in existing_lexicon:
                        audited_lexicon[w] = existing_lexicon[w]
            else:
                for item in results:
                    w = str(item.get("word") or "").strip().lower()
                    if not w:
                        continue
                    is_valid = bool(item.get("is_valid"))
                    et = str(item.get("event_type") or "").strip()
                    ex = str(item.get("explanation") or "").strip()
                    if is_valid and et and et != "-" and ex:
                        audited_lexicon[w] = {
                            "event_type": et,
                            "explanation": ex,
                        }
                    else:
                        invalid_words.append({
                            "word": w,
                            "reason": ex,
                        })

            elapsed = time.time() - start_time
            print(
                f"  [{completed}/{len(batches)}] Paket Tamamlandı | "
                f"Onaylanan: {len(audited_lexicon)} | Elenen Sahte Pozitif: {len(invalid_words)} | "
                f"Süre: {elapsed:.1f}s",
                flush=True,
            )

    # 1. Denetim logunu ve temizlenen sözlüğü kaydet
    AUDIT_LOG_PATH.write_text(
        json.dumps(
            {
                "total_audited": len(words),
                "approved_count": len(audited_lexicon),
                "discarded_count": len(invalid_words),
                "discarded_examples": invalid_words[:50],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    lex_data["lexicon"] = audited_lexicon
    LEXICON_PATH.write_text(json.dumps(lex_data, ensure_ascii=False, indent=2), encoding="utf-8")

    # 2. Doğrulanmış DeepSeek sözlüğüyle tüm 656 TDE sorusunu güncelle
    print("\n📦 Doğrulanmış DeepSeek ses sözlüğü TDE.json'a işleniyor...", flush=True)
    questions = json.loads(TDE_JSON_PATH.read_text(encoding="utf-8"))
    enriched_q_count = 0
    total_sound_tags = 0

    for q in questions:
        if q["id"] == 969:
            continue
        updated = inject_phonology_into_xray(q["soru"], q.get("soru_xray") or "", audited_lexicon)
        q["soru_xray"] = updated
        c_sound = updated.count('class="sound-word"') + updated.count("has-sound")
        if c_sound > 0:
            enriched_q_count += 1
            total_sound_tags += c_sound

    TDE_JSON_PATH.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")

    print(
        f"\n🎉 DeepSeek 50'lik Paket Denetimi Tamamlandı!\n"
        f"   İncelenen Toplam Kelime: {len(words)}\n"
        f"   DeepSeek Onaylı Ses Olaylı Kelime: {len(audited_lexicon)}\n"
        f"   Elenen Sahte Pozitif Kelime: {len(invalid_words)}\n"
        f"   Ses Olayı İçeren Soru Sayısı: {enriched_q_count}/{len(questions)}\n"
        f"   Toplam Doğrulanmış Ses Etiketi: {total_sound_tags}\n"
        f"   Denetim Kütüğü: {AUDIT_LOG_PATH}",
        flush=True,
    )


if __name__ == "__main__":
    main()

