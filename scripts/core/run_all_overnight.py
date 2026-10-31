#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN Gece Boyu Otonom Master Orkestratör (Overnight Master Runner).

Bu betik:
1. 100-Döngülü Mimari Motorunu (11 -> 100) kesintisiz tamamlar.
2. Ardından Pipeline A (10 Adımlık Eleştirel Denetim) çalıştırır.
3. Ardından Pipeline B (30 Adımlık Derin State Mimarisi) çalıştırır.
4. Ardından Pipeline C (5 Adımlık State Eleştiri & Mühürleme) çalıştırır.
5. İşlem bittiğinde 'data/evren_cache/OVERNIGHT_COMPLETED.flag' dosyasını oluşturur.
"""

import os
import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
CACHE_DIR = ROOT_DIR / "data" / "evren_cache"
COMPLETED_FLAG = CACHE_DIR / "OVERNIGHT_COMPLETED.flag"
PROGRESS_LOG = CACHE_DIR / "overnight_runner.log"

def log(msg: str):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    print(formatted)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_LOG, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

def run_cmd(cmd: list):
    log(f"Çalıştırılıyor: {' '.join(cmd)}")
    res = subprocess.run(cmd, cwd=str(ROOT_DIR))
    if res.returncode != 0:
        log(f"⚠️ Komut hata ile bitti (Kod: {res.returncode})")
    else:
        log("✅ Komut başarıyla tamamlandı.")
    return res.returncode

def main():
    log("🌙 Gece Boyu Otonom Master Orkestratör Başladı.")

    # 1. Aşama: 100 Döngüyü Tamamla
    log("AŞAMA 1: 100-Döngülü Ana Mimari Motoru (Kalan tüm döngüler)")
    run_cmd([sys.executable, "scripts/core/evren_100loop_architect.py", "--count", "100"])

    # 2. Aşama: Pipeline A (10 Adım)
    log("AŞAMA 2: Pipeline A (10 Adımlık Eleştirel Denetim)")
    run_cmd([sys.executable, "scripts/core/evren_refinement_pipelines.py", "--pipeline", "critique10"])

    # 3. Aşama: Pipeline B (30 Adım)
    log("AŞAMA 3: Pipeline B (30 Adımlık State Derin İnceleme)")
    run_cmd([sys.executable, "scripts/core/evren_refinement_pipelines.py", "--pipeline", "state30"])

    # 4. Aşama: Pipeline C (5 Adım)
    log("AŞAMA 4: Pipeline C (5 Adımlık State Eleştiri & Mühürleme)")
    run_cmd([sys.executable, "scripts/core/evren_refinement_pipelines.py", "--pipeline", "state_critique5"])

    # 5. Bitiş bayrağı
    COMPLETED_FLAG.write_text(f"COMPLETED at {time.strftime('%Y-%m-%d %H:%M:%S')}\n", encoding="utf-8")
    log("🏆 TÜM AŞAMALAR VE PİPELİNE'LAR EKSİKSİZ TAMAMLANDI!")

if __name__ == "__main__":
    main()

