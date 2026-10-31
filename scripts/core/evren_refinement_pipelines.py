#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN Çok Katmanlı Mimari Rafinasyon Pipeline Paketi.

Bu betik 3 ek pipeline içerir ve mevcut 100 döngülük mimari planı tamamlandıktan sonra
sırayla çalıştırılmak üzere tasarlanmıştır:

1. PIPELINE A (10 Adım): Genel Planı Acımasızca Eleştiren "Devil's Advocate" Hakem Pipeline
2. PIPELINE B (30 Adım): Yalnızca State & Store'a Odaklanan 30-Döngülü Derin Güvenlik & İzolasyon Pipeline
3. PIPELINE C (5 Adım): State Planını Eleştirip Mühürleyen Nihai Konsolidasyon Pipeline
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.core.evren_client import EvrenClient

CACHE_DIR = ROOT_DIR / "data" / "evren_cache"
PLAN_FILE = ROOT_DIR / "docs" / "EVREN_MIMARI_PLAN.md"
STATE_PLAN_FILE = ROOT_DIR / "docs" / "STATE_MIMARI_PLAN.md"

# ==============================================================================
# PIPELINE A: 10 ADIMLIK GENEL PLAN ELEŞTİRİ & DENETİM HATTI
# ==============================================================================
CRITIQUE_10_STEPS = [
    {"id": 1, "topic": "KISS ve Aşırı Mühendislik (Over-Engineering) Denetimi", "focus": "Gereksiz katman, sınıf veya fazladan soyutlama var mı? Kod satırını ve karmaşıklığı artıran her şeyi buda."},
    {"id": 2, "topic": "350 Satır Sınırı ve Dosya Bölünme Riskleri", "focus": "Planlanan yeni dosyalar 350 satırı aşar mı? Parçalanan dosyalar döngüsel bağımlılık (circular dependency) yaratır mı?"},
    {"id": 3, "topic": "Jenga İzolasyonunun Gerçekçiliği", "focus": "Modüller birbirinden koparılırken performans düşüşü, bellek sızıntısı veya aşırı EventBus yükü oluşur mu?"},
    {"id": 4, "topic": "EVREN Model Rolleri ve Kota/Hız Darboğazları", "focus": "Seçilen modeller (glm-5.3, deepseek-v4.1-flash, voxcpm2, clef) latency ve günlük token kotası açısından gerçekçi mi?"},
    {"id": 5, "topic": "Classroom WebRTC / PeerJS Kararlılığı", "focus": "Canlı sınıf odası, odak takibi (focus-tracker) ve kalp atışı planı 100 öğrencide kopma yaratır mı?"},
    {"id": 6, "topic": "Eski Tarayıcılar ve Mobil Uyumluluk", "focus": "CSS container queries, WebLock, mobil klavye açılması ve dokunmatik olaylar planda unutulmuş mu?"},
    {"id": 7, "topic": "Supabase ve Çevrimdışı (Offline-First) Güvenliği", "focus": "Supabase çökerse yerel JSON ve localStorage tam senkronize kalabilir mi? Sessiz veri kaybı riski var mı?"},
    {"id": 8, "topic": "Astra (Uygulayıcı Ajan) İçin Muğlaklık Taraması", "focus": "Planda 'şurayı güzelleştir' gibi soyut laf kalmış mı? Her madde dosya adı, fonksiyon adı ve somut imza içeriyor mu?"},
    {"id": 9, "topic": "Geriye Dönük Uyumluluk (aol_* LocalStorage ve Testler)", "focus": "Mevcut kullanıcının kayıtlı cevapları veya streak verisi silinir mi? 89 birim testi bozulur mu?"},
    {"id": 10, "topic": "Final Mühürleme ve Karar Özeti", "focus": "Tüm eleştiriler plana yedirildi mi? Plandaki çelişkili veya şişkin kısımlar tamamen temizlendi mi?"},
]

# ==============================================================================
# PIPELINE B: SADECE STATE İÇİN 30 ADIMLIK DERİN İNCELEME
# ==============================================================================
STATE_30_STEPS = [
    {"id": 1, "scope": "state.ts: Mutable vs Readonly AppState Ayrımı ve Tip Zırhı"},
    {"id": 2, "scope": "store.markChoice ve cevap işaretleme mutasyonunun atomikliği"},
    {"id": 3, "scope": "store.clearAllMarks ve sınav sıfırlama güvenliği"},
    {"id": 4, "scope": "store.setCurrentSubject ve ders geçişinde bellek temizliği"},
    {"id": 5, "scope": "store.setProgramMode (AOIHL vs AOF) ayrımı ve yan etkisiz geçiş"},
    {"id": 6, "scope": "store.setSelectedCourses (Set manipülasyonu ve referans şeffaflığı)"},
    {"id": 7, "scope": "store.setCourseFilterMode (AND vs OR mantıksal kesişim)"},
    {"id": 8, "scope": "store.setSelectedTopicKeys ve alt konu filtreleme performansı"},
    {"id": 9, "scope": "store.setBookletQuestions ve soru listesi sıralama garantisi"},
    {"id": 10, "scope": "store.setBookletFilterMode (all/incorrect/starred/unanswered)"},
    {"id": 11, "scope": "store.setContentViewMode (questions vs notes) görünüm durumu"},
    {"id": 12, "scope": "store.setActiveSearchFilter ve Türkçe arama debounce durumu"},
    {"id": 13, "scope": "store.toggleEliminateChoice ve şık karalama state'i"},
    {"id": 14, "scope": "store.eliminateOneWrongChoice (50/50 joker mantığı)"},
    {"id": 15, "scope": "store.toggleStarredQuestion ve yıldız havuzu senkronizasyonu"},
    {"id": 16, "scope": "store.addRematchQuestion / removeRematchQuestion (Rövanş sepeti)"},
    {"id": 17, "scope": "store.setLibraryMode ve libraryTab durum yönetimi"},
    {"id": 18, "scope": "store.setWaterStreak ve günlük seri koruma tarihi"},
    {"id": 19, "scope": "store.setColumnCount ve masaüstü/mobil sütun duyarlılığı"},
    {"id": 20, "scope": "store.setCanvasZoomScale ve zoomLevelIndex sınırları"},
    {"id": 21, "scope": "store.toggleQuestionExpanded ve soru akordeon durumu"},
    {"id": 22, "scope": "store.toggleAnswerReveal ve toggleHintReveal geçici durumları"},
    {"id": 23, "scope": "store.setAiExplanation ve soru bazlı AI yanıt önbelleği"},
    {"id": 24, "scope": "store.appendAiQuestionReply ve çok turlu soru-cevap geçmişi"},
    {"id": 25, "scope": "store.setPendingAiQuestion ve ağ istek yükleme durumları"},
    {"id": 26, "scope": "store.setTtsVoiceGender ve setTtsVoiceEngine tercihleri"},
    {"id": 27, "scope": "onStateChange ve notifyStateChange EventBus mimarisi"},
    {"id": 28, "scope": "safeStorageSet ve localStorage kota taşması (QuotaExceededError) zırhı"},
    {"id": 29, "scope": "State modülünün 5 mikro-dosyaya (types, init, store, events, persist) bölünmesi"},
    {"id": 30, "scope": "State için Mocking ve 0-Hata Test Süiti Tasarımı"},
]

# ==============================================================================
# PIPELINE C: 5 ADIMLIK STATE ELEŞTİRİ & MÜHÜRLEME HATTI
# ==============================================================================
STATE_CRITIQUE_5_STEPS = [
    {"id": 1, "topic": "State Bölünmesi Aşırı mı?", "focus": "5 mikro-dosyaya bölmek basitliği artırıyor mu yoksa import karmaşası mı yaratıyor? Gerekirse 2-3 dosyada birleştir."},
    {"id": 2, "topic": "Tüm aol_* LocalStorage Anahtarları Korundu mu?", "focus": "Öğrencinin geçmiş verisini tutan anahtarların tek bir harfi dahi değişti mi? Kontrol et."},
    {"id": 3, "topic": "Set ve Map Referans Değişmezliği (Immutability)", "focus": "Store dışarıya Set dönerken kopyasını mı dönüyor yoksa ReadonlySet mi? Kaçak mutasyon mümkün mü?"},
    {"id": 4, "topic": "Asenkron Eşzamanlılık (Race Condition) Denetimi", "focus": "Aynı anda iki farklı soru işaretlenirse veya AI açıklaması yazılırken cevap seçilirse veri çakışır mı?"},
    {"id": 5, "topic": "Astra İçin Nihai State Sertifikası", "focus": "State planını dondur, imzala ve Astra'nın tek nefeste uygulayabileceği netlikte mühürle."},
]

def run_critique_pipeline(client: EvrenClient):
    print("\n" + "="*60)
    print("🔥 PIPELINE A BAŞLIYOR: 10 Adımlık Eleştirel Mimari Denetim")
    print("="*60)
    if not PLAN_FILE.exists():
        print("❌ Hata: EVREN_MIMARI_PLAN.md bulunamadı.")
        return

    plan_text = PLAN_FILE.read_text(encoding="utf-8")
    for step in CRITIQUE_10_STEPS:
        print(f"\n👉 [Eleştiri {step['id']}/10] {step['topic']}")
        prompt = f"""Sen Acımasız Sistem Mimarı ve Devil's Advocate (Şeytanın Avukatı) Hakemisin.
Mevcut mimari planı en sert şekilde eleştireceksin.

### ODAK NOKTASI:
{step['topic']}
{step['focus']}

### MEVCUT MİMARİ PLAN:
```markdown
{plan_text}
```

### GÖREVİN:
1. Plandaki bu odak noktasıyla ilgili zayıflıkları, gereksiz karmaşıklıkları ve Astra'yı yanıltabilecek noktaları tespit et.
2. Plandan NELERİN SİLİNMESİ veya NELERİN DAHA SADE YAZILMASI gerektiğini belirle.
3. Planı doğrudan revize ederek eksiksiz yeni Markdown metnini dön."""

        plan_text, usage = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model="deepseek-v4.1-flash",
            max_tokens=4096,
            thinking=False,
        )
        PLAN_FILE.write_text(plan_text.strip() + "\n", encoding="utf-8")
        print(f"✅ Eleştiri {step['id']} tamamlandı. Plan güncellendi ({len(plan_text)} karakter).")

def run_state_pipeline(client: EvrenClient):
    print("\n" + "="*60)
    print("🏛️ PIPELINE B BAŞLIYOR: Sadece State İçin 30 Adımlık Derin İnceleme")
    print("="*60)
    state_file = ROOT_DIR / "src" / "app" / "state.ts"
    state_source = state_file.read_text(encoding="utf-8") if state_file.exists() else ""

    state_plan = """# AÖL Dijital Kitapçık — 30-Döngülü Derin State Mimarisi ve Tip Güvenliği Planı
> Tek Doğruluk Kaynağı, Sıfır Doğrudan Mutasyon, Readonly Koruması ve LocalStorage Senkronizasyonu.
"""

    for step in STATE_30_STEPS:
        print(f"\n🔄 [State Döngüsü {step['id']}/30] {step['scope']}")
        prompt = f"""Sen Kıdemli TypeScript State Mimarı ve Veri Güvenliği Uzmanısın.
AÖL Dijital Kitapçık projesinin tüm State & Store yapısını 'Jenga Güvenliği' ile yeniden tasarlıyorsun.

### MEVCUT GERÇEK `src/app/state.ts` KODU:
```typescript
{state_source}
```

### İNCELENEN ALAN ({step['id']}/30):
{step['scope']}

### MEVCUT STATE MİMARİ PLANI:
```markdown
{state_plan}
```

### GÖREVİN:
1. İncelenen bu aksiyonu veya alanı büyüteçle analiz et:
   - Dışarıdan doğrudan mutasyon yapılabilir mi?
   - LocalStorage senkronizasyonu hatasız mı?
   - Yan etkisiz (pure) mi?
   - 350 satır sınırını korumak için nasıl sadeleştirilmeli?
2. Astra'nın doğrudan uygulayabileceği arayüz (interface), fonksiyon gövdesi ve test beklentisini plana ekle.
3. Planı baştan sona eksiksiz güncellenmiş Markdown olarak dön."""

        state_plan, usage = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model="deepseek-v4.1-flash",
            max_tokens=4096,
            thinking=False,
        )
        STATE_PLAN_FILE.write_text(state_plan.strip() + "\n", encoding="utf-8")
        print(f"✅ State Döngüsü {step['id']} tamamlandı ({len(state_plan)} karakter).")

def run_state_critique_pipeline(client: EvrenClient):
    print("\n" + "="*60)
    print("⚖️ PIPELINE C BAŞLIYOR: State Planı İçin 5 Adımlık Eleştiri & Mühürleme")
    print("="*60)
    if not STATE_PLAN_FILE.exists():
        print("❌ Hata: STATE_MIMARI_PLAN.md bulunamadı.")
        return

    plan_text = STATE_PLAN_FILE.read_text(encoding="utf-8")
    for step in STATE_CRITIQUE_5_STEPS:
        print(f"\n⚖️ [State Hakemi {step['id']}/5] {step['topic']}")
        prompt = f"""Sen Baş Mimar Hakemisin. Hazırlanan 30 adımlık State Planını acımasızca denetliyorsun.

### ELEŞTİRİ KONUSU:
{step['topic']}
{step['focus']}

### MEVCUT STATE PLANI:
```markdown
{plan_text}
```

### GÖREVİN:
1. Planda aşırı karmaşık, gereksiz veya tehlikeli olan her şeyi SİL / BUDA.
2. KISS (Keep It Simple, Stupid) prensibiyle en az kodla maksimum güvenliği sağla.
3. Astra'nın hata yapamayacağı şekilde planı güncelle ve dön."""

        plan_text, usage = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model="deepseek-v4.1-flash",
            max_tokens=4096,
            thinking=False,
        )
        STATE_PLAN_FILE.write_text(plan_text.strip() + "\n", encoding="utf-8")
        print(f"✅ State Eleştiri {step['id']} tamamlandı ({len(plan_text)} karakter).")

def main():
    parser = argparse.ArgumentParser(description="EVREN İkincil Rafinasyon ve State Pipeline'ları")
    parser.add_argument("--pipeline", choices=["all", "critique10", "state30", "state_critique5"], default="all",
                        help="Hangi pipeline çalıştırılacak?")
    args = parser.parse_args()

    client = EvrenClient()
    if not client.is_configured:
        print("❌ Hata: EVREN_API_KEY tanımlı değil.")
        sys.exit(1)

    if args.pipeline in ["all", "critique10"]:
        run_critique_pipeline(client)
    if args.pipeline in ["all", "state30"]:
        run_state_pipeline(client)
    if args.pipeline in ["all", "state_critique5"]:
        run_state_critique_pipeline(client)

    print("\n🎉 Tüm ilave rafinasyon pipeline'ları başarıyla tamamlandı!")

if __name__ == "__main__":
    main()

