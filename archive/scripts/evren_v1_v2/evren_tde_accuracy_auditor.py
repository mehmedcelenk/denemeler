#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN Destekli TDE 1-8 Dil Bilgisi ve Ses Olayları Doğruluk Denetçisi (Accuracy & Quality Auditor).

TDE 1-8 derslerinden temsili soruları ve üretilen röntgen tahlillerini EVREN Bağımsız Denetçi LLM'ine
(MEB Başmüfettişi rolüyle) sunarak:
1. Cümle Ögeleri Kavşaklarının doğruluğu
2. Sözcük Türleri ve Yapılarının (Sıfat, Zamir, Zarf, Edat/Bağlaç, Fiilimsi, Tamlama) doğruluğu
3. Ses Olaylarının (Ünlü Düşmesi, Yumuşama, Benzeşme, Daralma, Türeme) doğruluğu
kapsamında 100 üzerinden puanlar, tespit edilen hata/uyarıları raporlar ve doğruluk oranını çıkarır.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import html
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

TDE_JSON_PATH = ROOT_DIR / "data" / "subjects" / "TDE.json"
REPORT_PATH = ROOT_DIR / "data" / "evren_cache" / "tde_evren_audit_report.json"

AUDITOR_SYSTEM_PROMPT = """Sen MEB Talim ve Terbiye Kurulu Türk Dili ve Edebiyatı Başmüfettişi ve Dilbilim Denetçisisin.
Sana bir Açık Öğretim Lisesi TDE sorusu ve bu sorudaki cümlelere yapılmış 3 katmanlı dil bilgisi tahlili verilecek:
1. `Cümle Ögeleri Sınırları` (Özne, Yüklem, Belirtili/Belirtisiz Nesne, Dolaylı Tümleç, Zarf Tümleci)
2. `Sözcük Türleri ve Yapıları` (Sıfat, Zamir, Zarf, Edat, Bağlaç, Fiilimsi, Ek-Fiil, İsim Tamlaması)
3. `Ses Olayları` (Ünlü Düşmesi, Ünsüz Yumuşaması, Ünsüz Benzeşmesi, Ünlü Daralması, Ünsüz/Ünlü Türemesi, Ünsüz Düşmesi, N-M Değişimi)

GÖREVİN:
Verilen tahlili MEB müfredatı ve Türk Dil Kurumu kuralları ışığında en yüksek akademik titizlikle denetlemek.

Aşağıdaki JSON şemasında yanıt ver:
```json
{
  "question_id": 123,
  "score": 95,
  "verdict": "MÜKEMMEL", // "MÜKEMMEL" (90-100), "BAŞARILI" (75-89), "GELİŞTİRİLMELİ" (<75)
  "syntax_accuracy": "Hatasız. Ögeler yükleme sorulan doğru sorularla tam sınırlarından ayrılmış.",
  "pos_accuracy": "Hatasız. Sıfatlar, isim tamlamaları ve fiilimsiler doğru tespit edilmiş.",
  "phonology_accuracy": "Hatasız. Ses olayları ve açıklamaları eksiksiz.",
  "flaws_or_warnings": [
    // Varsa küçük hata, şüpheli tespit veya geliştirme önerisi (yoksa boş liste bırak)
  ],
  "summary": "1-2 cümlelik genel denetim değerlendirmesi."
}
```
Başka hiçbir metin yazma, sadece geçerli JSON döndür."""


def extract_annotations_for_audit(xray_html: str) -> Dict[str, Any]:
    """Soru xray HTML'inden denetlenecek yapıları yapılandırılmış nesneye dönüştürür."""
    # 1. Junctions
    junction_matches = re.findall(
        r'<span class="xray-junction"[^>]*data-tr="([^"]*)"[^>]*title="([^"]*)"',
        xray_html,
    )
    junctions = []
    for tr, title in junction_matches:
        tr_dec = html.unescape(tr).replace("<br>", " | ")
        junctions.append({
            "title": html.unescape(title),
            "detail": tr_dec,
        })

    # 2. POS Words & Embedded Sound Events (.has-sound)
    pos_matches = re.findall(
        r'<span class="pos-word(?:\s+has-sound)?\s+(pos-[a-z]+)"[^>]*data-tr="([^"]*)"[^>]*data-note="([^"]*)"[^>]*>(.*?)</span>',
        xray_html,
    )
    pos_items = []
    sound_items = []
    for cat, tr, note, text in pos_matches:
        unesc_tr = html.unescape(tr)
        lines = [ln.strip() for ln in unesc_tr.splitlines() if ln.strip()]
        pos_items.append({
            "word": html.unescape(text),
            "category": cat,
            "type": html.unescape(note),
            "explanation": lines[0] if lines else "",
        })
        for ln in lines[1:]:
            if ln.startswith("🔊"):
                sound_items.append({
                    "word": html.unescape(text),
                    "explanation": ln,
                })

    # 3. Standalone Sound Words
    sound_matches = re.findall(
        r'<span class="sound-word"[^>]*data-tr="([^"]*)"[^>]*data-note="([^"]*)"[^>]*>(.*?)</span>',
        xray_html,
    )
    for tr, note, text in sound_matches:
        sound_items.append({
            "word": html.unescape(text),
            "event_type": html.unescape(note),
            "explanation": html.unescape(tr),
        })

    return {
        "junctions": junctions,
        "pos_items": pos_items,
        "sound_items": sound_items,
    }


def audit_question(
    client: EvrenClient,
    q: Dict[str, Any],
    model: str = "qwen3.8-flash-next",
) -> Tuple[int, Optional[Dict[str, Any]], Optional[str]]:
    """Tek bir soruyu EVREN ile denetler."""
    qid = int(q["id"])
    ders = q.get("ders", "")
    soru = q["soru"]
    xray = q.get("soru_xray", "")
    extracted = extract_annotations_for_audit(xray)

    user_prompt = (
        f"Ders: {ders}\n"
        f"Soru ID: {qid}\n\n"
        f"Soru Metni:\n{soru}\n\n"
        f"Yapılan Tahlil Verileri:\n"
        f"{json.dumps(extracted, ensure_ascii=False, indent=2)}\n\n"
        f"Lütfen bu tahlilin MEB kurallarına uygunluğunu, doğruluk puanını ve varsa hatalarını değerlendir."
    )

    try:
        content, _ = client.chat_completion(
            messages=[
                {"role": "system", "content": AUDITOR_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            model=model,
            temperature=0.1,
            max_tokens=3072,
            thinking=False,
        )
        text = content.strip()
        if "```" in text:
            m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if m:
                text = m.group(1)
        s = text.find("{")
        e = text.rfind("}")
        if s != -1 and e != -1 and e > s:
            parsed = json.loads(text[s : e + 1])
            return qid, parsed, None
        return qid, None, "JSON ayrıştırılamadı"
    except Exception as exc:
        return qid, None, str(exc)


def main() -> None:
    parser = argparse.ArgumentParser(description="EVREN TDE Dil Bilgisi Doğruluk Denetçisi")
    parser.add_argument("--samples-per-course", type=int, default=3, help="Her TDE dersinden kaç soru denetlenecek")
    parser.add_argument("--workers", type=int, default=8, help="Paralel EVREN iş parçacığı")
    parser.add_argument("--model", type=str, default="qwen3.8-flash-next", help="Denetçi EVREN modeli")
    args = parser.parse_args()

    client = EvrenClient()
    if not client.is_configured:
        print("❌ EVREN_API_KEY bulunamadı!", file=sys.stderr)
        sys.exit(1)

    questions: List[Dict[str, Any]] = json.loads(TDE_JSON_PATH.read_text(encoding="utf-8"))

    # Her dönemden (TDE 1..8) zengin tahlili olan örnekler seç
    by_course: Dict[int, List[Dict[str, Any]]] = {i: [] for i in range(1, 9)}
    for q in questions:
        ders = q.get("ders", "")
        m = re.search(r"[–-]\s*([1-8])", ders)
        if m:
            course_idx = int(m.group(1))
            xray = q.get("soru_xray", "")
            if "pos-word" in xray and "xray-junction" in xray and len(q["soru"]) > 100:
                by_course[course_idx].append(q)

    sampled: List[Dict[str, Any]] = []
    for course_idx in range(1, 9):
        pool = by_course[course_idx]
        sampled.extend(pool[: args.samples_per_course])

    print(
        f"🔍 EVREN TDE Doğruluk Denetimi Başlatıldı\n"
        f"   Toplam Denetlenecek Soru: {len(sampled)} (8 dönemden eşit dağılım)\n"
        f"   Denetçi Modeli: {args.model} | Workers: {args.workers}",
        flush=True,
    )

    results: List[Dict[str, Any]] = []
    scores: List[float] = []

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(audit_question, client, q, args.model): q
            for q in sampled
        }
        for future in as_completed(futures):
            q = futures[future]
            qid, report, err = future.result()
            if report:
                score = float(report.get("score", 0))
                verdict = report.get("verdict", "")
                scores.append(score)
                results.append({
                    "id": qid,
                    "ders": q.get("ders"),
                    "soru_snippet": q["soru"][:90] + "...",
                    "report": report,
                })
                print(f"  ✅ QID {qid} ({q.get('ders')}): Puan = {score}/100 ({verdict})", flush=True)
            else:
                print(f"  ⚠️ QID {qid} ({q.get('ders')}) Denetim Hatası: {err}", flush=True)

    avg_score = sum(scores) / len(scores) if scores else 0
    high_count = sum(1 for s in scores if s >= 90)
    pass_count = sum(1 for s in scores if 75 <= s < 90)
    low_count = sum(1 for s in scores if s < 75)

    summary_data = {
        "total_audited": len(results),
        "average_score": round(avg_score, 1),
        "distribution": {
            "mukemmel_90_100": high_count,
            "basarili_75_89": pass_count,
            "gelistirilmeli_alti_75": low_count,
        },
        "audited_questions": results,
    }

    REPORT_PATH.write_text(json.dumps(summary_data, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n" + "=" * 60)
    print(f"🏆 EVREN DOĞRULUK DENETİMİ RAPORU:")
    print(f"   Denetlenen Soru Sayısı: {len(results)}")
    print(f"   Ortalama Başarı Puanı: {avg_score:.1f} / 100")
    print(f"   Mükemmel (90-100 Puan): {high_count}/{len(results)}")
    print(f"   Başarılı (75-89 Puan): {pass_count}/{len(results)}")
    print(f"   Geliştirilmeli (<75 Puan): {low_count}/{len(results)}")
    print(f"   Detaylı Rapor: {REPORT_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()

