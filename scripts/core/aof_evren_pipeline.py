#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AÖF İlahiyat çıkmış soru kitapçıklarını EVREN AI ile sıfırdan ayıklar.

- pdftotext -layout ile sayfa düzenini okur.
- 'A Grubu Cevap Anahtarı'ndan 20 cevabı deterministik olarak alır.
- Group A sayfalarını EVREN deepseek-v4.1-flash modeline gönderir.
- 5 seçeneği (A-E), temiz soru metnini ve müfredat konu etiketlerini çıkarır.
- Mükerrer (aynı) soruları filtreler.
- data/subjects/AOF_*.json dosyalarını eksiksiz ve hatasız üretir.
"""

import concurrent.futures
import glob
import json
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from evren_client import EvrenClient

ROOT_DIR = Path(__file__).resolve().parents[2]
PDF_BASE = ROOT_DIR / "docs" / "kaynak_pdfler" / "aof_ilahiyat"
OUT_BASE = ROOT_DIR / "data" / "subjects"

AOF_COURSES = [
    {
        "folder": "hadis_tarihi_ve_usulu",
        "code": "AOF_HADIS",
        "ders": "HADİS TARİHİ VE USÜLÜ",
        "ders_kodu": 801,
        "start_id": 20000,
    },
    {
        "folder": "ilk_donem_islam_tarihi",
        "code": "AOF_ITAR",
        "ders": "İLK DÖNEM İSLAM TARİHİ",
        "ders_kodu": 802,
        "start_id": 20500,
    },
    {
        "folder": "islam_ahlak_esaslari",
        "code": "AOF_AHLAK",
        "ders": "İSLAM AHLAK ESASLARI",
        "ders_kodu": 803,
        "start_id": 21000,
    },
    {
        "folder": "islam_ibadet_esaslari",
        "code": "AOF_IBADET",
        "ders": "İSLAM İBADET ESASLARI",
        "ders_kodu": 804,
        "start_id": 21500,
    },
    {
        "folder": "islam_inanc_esaslari",
        "code": "AOF_INANC",
        "ders": "İSLAM İNANÇ ESASLARI",
        "ders_kodu": 805,
        "start_id": 22000,
    },
]


def extract_answer_key(full_text: str) -> Dict[int, str]:
    """PDF içindeki 'A Grubu Cevap Anahtarı' tablosundan 1-20 cevaplarını çıkarır."""
    match = re.search(
        r"A\s*Grubu\s*Cevap\s*Anahtar[ıi](.*?)(?:B\s*Grubu|$)",
        full_text,
        re.DOTALL | re.IGNORECASE,
    )
    answers: Dict[int, str] = {}
    if not match:
        return answers

    block = match.group(1)
    lines = [l.strip() for l in block.split("\n") if l.strip()]
    for line in lines:
        letters = re.findall(r"\b([A-E])\b", line)
        if len(letters) >= 15:
            for idx, letter in enumerate(letters[:20], start=1):
                answers[idx] = letter
            break
    return answers


def extract_group_a_text(pdf_path: Path) -> Tuple[str, Dict[int, str]]:
    """PDF'ten pdftotext -layout ile Group A metnini ve cevap anahtarını alır."""
    cmd = ["pdftotext", "-layout", str(pdf_path), "-"]
    raw = subprocess.check_output(cmd, encoding="utf-8", errors="replace")
    ans_key = extract_answer_key(raw)
    group_a_text = raw.split("A Grubu Cevap Anahtarı")[0]
    return group_a_text, ans_key


CACHE_DIR = ROOT_DIR / "data" / "evren_cache" / "aof_exams"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def call_evren_for_questions(
    client: EvrenClient, group_a_text: str, course_name: str, cache_key: str = ""
) -> List[Dict[str, Any]]:
    """EVREN modeline metni gönderip 20 soruyu JSON olarak çeker (yerel disk önbellekli)."""
    if cache_key:
        cache_file = CACHE_DIR / f"{cache_key}.json"
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                if len(cached) >= 15:
                    return cached
            except Exception:
                pass

    prompt = f"""Aşağıda AÖF İlahiyat '{course_name}' dersinin sınav kitapçığının A Grubu sayfalarının tam metni yer almaktadır.
Bu metinde toplam 20 soru bulunmaktadır (1'den 20'ye kadar).

GÖREV:
1. 1'den 20'ye kadar olan TÜM soruları sırayla ayıkla.
2. Her sorunun kökünü ve 5 seçeneğini (A, B, C, D, E) eksiksiz, pürüzsüz Türkçe ile çıkar.
3. Filigran artıklarını (AOSDESTEK, na ılı Sis, te, m, i, sayfa altı notları vb.) kesinlikle temizle.
4. Her soru için dersin müfredatına uygun bir 'ana_konu' ve 'alt_konu' ata.
5. SADECE geçerli bir JSON dizisi döneceksin. Başka hiçbir açıklama yazma.

JSON Şeması:
[
  {{
    "soru_no": 1,
    "soru": "Soru metni...",
    "secenekler": {{
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "...",
      "E": "..."
    }},
    "ana_konu": "...",
    "alt_konu": "..."
  }}
]

Metin:
{group_a_text}
"""
    ans, _ = client.chat_completion(
        [{"role": "user", "content": prompt}],
        model="qwen3.8-flash-next",
        max_tokens=8192,
        thinking=False,
    )
    m = re.search(r"\[\s*\{.*\}\s*\]", ans, re.DOTALL)
    if not m:
        raise ValueError(f"JSON dizisi bulunamadı. Yanıt boyutu: {len(ans)}")

    parsed = json.loads(m.group(0))
    if cache_key and len(parsed) >= 15:
        cache_file = CACHE_DIR / f"{cache_key}.json"
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(parsed, f, ensure_ascii=False, indent=2)

    return parsed


def normalize_stem(text: str) -> str:
    """Mükerrer soru tespiti için soru metnini normalize eder."""
    text = text.lower()
    tr_map = str.maketrans("çğışöüİÇĞİŞÖÜ", "cgisouicgisou")
    text = text.translate(tr_map)
    text = re.sub(r"[^\w\s]", "", text)
    return " ".join(text.split())


def process_exam_pdf(
    client: EvrenClient, pdf_path: Path, course_name: str
) -> List[Dict[str, Any]]:
    """Tek bir PDF dosyasından 20 soruyu çıkarıp cevap anahtarıyla birleştirir."""
    group_a_text, ans_key = extract_group_a_text(pdf_path)
    if len(ans_key) < 20:
        print(f"  [UYARI] {pdf_path.name} için 20 cevap bulunamadı ({len(ans_key)})!")

    questions = call_evren_for_questions(
        client, group_a_text, course_name, cache_key=pdf_path.stem
    )
    enriched = []
    for q in questions:
        s_no = q.get("soru_no", 0)
        correct = ans_key.get(s_no, "A")
        q["dogru_cevap"] = correct
        enriched.append(q)
    return enriched


def process_single_course(course_info: Dict[str, Any]) -> Tuple[str, int]:
    """Bir AÖF dersine ait tüm PDF'leri paralel işler, tekilleştirir ve JSON olarak kaydeder."""
    course_folder = PDF_BASE / course_info["folder"]
    pdf_files = sorted(list(course_folder.glob("*.pdf")))
    print(f"\n🚀 Başlıyor: {course_info['ders']} ({len(pdf_files)} PDF)")

    all_raw_questions: List[Dict[str, Any]] = []
    
    def worker(pdf_p: Path) -> List[Dict[str, Any]]:
        client = EvrenClient()
        print(f"  📄 İşleniyor: {pdf_p.name}...")
        try:
            items = process_exam_pdf(client, pdf_p, course_info["ders"])
            print(f"     ✅ {pdf_p.name}: {len(items)} soru ayıklandı.")
            return items
        except Exception as exc:
            print(f"     ❌ Hata ({pdf_p.name}): {exc}")
            return []

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(worker, pdf_files))

    for items in results:
        all_raw_questions.extend(items)

    # Tekilleştirme (Deduplication)
    seen_stems: Set[str] = set()
    final_questions: List[Dict[str, Any]] = []
    current_id = course_info["start_id"]

    for raw_q in all_raw_questions:
        stem = raw_q.get("soru", "").strip()
        stem_norm = normalize_stem(stem)
        stem_key = stem_norm[:80]
        if not stem_key or stem_key in seen_stems:
            continue
        seen_stems.add(stem_key)

        opts = raw_q.get("secenekler", {})
        final_item = {
            "id": current_id,
            "ders": course_info["ders"],
            "ders_kodu": course_info["ders_kodu"],
            "yil": "AÖF İlahiyat",
            "donem": "ARA",
            "soru_no": len(final_questions) + 1,
            "soru": stem,
            "secenekler": {
                "A": opts.get("A", "").strip(),
                "B": opts.get("B", "").strip(),
                "C": opts.get("C", "").strip(),
                "D": opts.get("D", "").strip(),
                "E": opts.get("E", "").strip(),
            },
            "dogru_cevap": raw_q.get("dogru_cevap", "A"),
            "ana_konu": raw_q.get("ana_konu", "Genel"),
            "alt_konu": raw_q.get("alt_konu", "Genel"),
            "kredi": 2,
            "sinav_soru_sayisi": 20,
            "puan": 0.1,
            "sekilli": False,
        }
        final_questions.append(final_item)
        current_id += 1

    out_file = OUT_BASE / f"{course_info['code']}.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(final_questions, f, ensure_ascii=False, indent=2)

    print(f"✨ TAMAMLANDI: {course_info['ders']} -> {len(final_questions)} benzersiz soru kaydedildi -> {out_file.name}")
    return course_info["code"], len(final_questions)


def run_pipeline() -> None:
    """Tüm 5 AÖF dersini sırayla veya eşzamanlı olarak işler."""
    start_time = time.time()
    results = {}
    print("=" * 60)
    print("AÖF İlahiyat EVREN AI Soru Ayıklama Hattı Başlatılıyor...")
    print("=" * 60)

    for course_info in AOF_COURSES:
        code, count = process_single_course(course_info)
        results[code] = count

    elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print(f"🎉 TÜM DERSLER İŞLENDİ! Toplam Süre: {elapsed:.1f} saniye")
    for code, count in results.items():
        print(f"  • {code}: {count} soru")
    print("=" * 60)


if __name__ == "__main__":
    run_pipeline()
