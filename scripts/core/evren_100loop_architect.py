#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EVREN 100-Döngülü Mimari Planlama & Kendi Kendini Düzeltici (Self-Refining) Denetim Motoru.

Bu betik:
- Projedeki tüm kaynak kodları (~130 dosya) mantıksal, izole bloklara (100 döngü) böler.
- Her döngüde sadece ilgili mikro-dosya grubunu satır satır okur.
- EVREN Egemen LLM (glm-5.3 / deepseek-v4.1-flash) ile mevcut mimari planı (docs/EVREN_MIMARI_PLAN.md)
  sürekli 'review & update' eder; çelişen varsayımları siler, budar, sıfır-spagetti ve
  modüler "Jenga Kulesi" (Decoupled Modular Architecture) mimarisine ulaştırır.
- Kesintiye dayanıklıdır: 'data/evren_cache/architect_loop_state.json' içinde ilerlemeyi saklar.
"""

import argparse
import glob
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.core.evren_client import EvrenClient

CACHE_DIR = ROOT_DIR / "data" / "evren_cache"
STATE_FILE = CACHE_DIR / "architect_loop_state.json"
PLAN_FILE = ROOT_DIR / "docs" / "EVREN_MIMARI_PLAN.md"

# Modelin bağlamının başında tutularak %3 prefix-cache indirimini tetikleyen sabit Anayasa
SYSTEM_PROMPT = """Sen AÖL Dijital Kitapçık projesinin Baş Sistem Mimarı ve EVREN (SSYZ) Kıdemli Entegrasyon Denetçisisin.
Bu proje için Astra (ChatGPT) gibi otonom kodlama ajanlarının sıfır hatayla uygulayacağı kusursuz, modüler ve kırılmaz bir mimari plan hazırlıyorsun.

### ANA HEDEF: "JENGA MİMARİSİ" (Sıfır İçiçelik, Sıfır Spagetti, Tam Bağımsızlık)
1. **İzole Özellikler (Plug-and-Play / Jenga):**
   - Hangi özelliği (örn: AI Tutor, Classroom, TTS, TDE-Xray, Interlinear vb.) çekip çıkarsan veya silsen dahi, kitapçık ve geri kalan sistem ASLA bozulmamalı ve hata fırlatmamalıdır.
   - Hiçbir özellik (`src/features/x`), başka bir özelliğin iç durumuna veya özel DOM yapısına doğrudan bağımlı olamaz. İletişim yalnızca `src/app/state.ts` (Store/Events) veya saf arayüz kontratları üzerinden akar.
2. **KISS & Minimalizm (350 Satır Sınırı):**
   - Kaynak JS/TS/CSS dosyaları en fazla 350 satır olabilir. 300 satırlık karmaşık canavarlar yerine 20-30 satırlık temiz, odaklı ve saf fonksiyonlar tercih edilmelidir.
3. **Tek Doğruluk Kaynağı (State & Micro-Store):**
   - Durum mutasyonları sadece `src/app/state.ts` içindeki `store` aksiyonları üzerinden yapılmalı, doğrudan `state.xyz = ...` yazımları engellenmeli, LocalStorage senkronizasyonları tek merkezden yönetilmelidir.
4. **EVREN Platform Yetenekleri (evrendocs):**
   - LLM & Muhakeme: `glm-5.3` (amiral model, derin analiz), `deepseek-v4.1-flash` (1M bağlam, ders kitabı pedagojisi), `qwen3.8-flash-next` (hızlı canlı öğretmen asistanı).
   - Adanmış OCR: `dots-ocr` ve `deepseek-ocr-2` (Yalnızca `POST /v1/ocr` ucu!).
   - Doğal Türkçe TTS: `voxcpm2` (`POST /v1/audio/speech`).
   - Karar & Zorluk Motoru: `clef` ve `laya` (`POST /v1/systemone`).
   - Vektör & Rerank: `qwen3-embedding-8b` (`/v1/embeddings`), `qwen3-reranker-8b` (`/v1/rerank`).

### ÇALIŞMA KURALI (REVIEW, PRUNE & UPDATE):
Sana mevcut mimari plan ve BU DÖNGÜDE İNCELENEN 1-3 adet yeni dosyanın tam içeriği verilecek.
1. **Gerçeklik Kontrolü:** Önceki döngülerde yazılmış plandaki varsayımlar, bu dosyadaki gerçek kodla çelişiyorsa veya gereksiz karmaşıklık içeriyorsa o maddeleri ACIMASIZCA SİL veya DÜZELT.
2. **Spagetti & Jenga İhlalleri:** Dosyadaki gizli bağımlılıkları, temizlenmeyen event-listener'ları, 350 satıra yaklaşan tehlikeli blokları dosya adı ve satır numarasıyla plana işle.
3. **EVREN Entegrasyon Fırsatı:** Bu dosyanın yaptığı işi EVREN modelleriyle daha az kodla nasıl daha yetenekli ve kararlı kılarız?
4. **Astra İçin Kesin Talimatlar:** Kodlama yapacak olan Astra ajanına muğlak laflar ("şurayı iyileştir") değil; tam dosya yolu, silinecek fonksiyon, eklenecek temiz arayüz ve test beklentisi ver.
"""

def generate_100_loop_schedule() -> List[Dict[str, Any]]:
    """Tüm proje dosyalarını 100 mantıksal mikro-döngüye böler."""
    batches: List[Dict[str, Any]] = []

    # 1-10: Anayasa, Mimari Belgeleri ve EVREN Dokümantasyonu
    batches.append({"title": "Proje Kuralları ve Anayasa", "files": ["AGENTS.md", "README.md"]})
    batches.append({"title": "Mevcut Mimari Haritası", "files": ["docs/ARCHITECTURE.md", "docs/FEATURELIST.md"]})
    batches.append({"title": "EVREN Entegrasyon Rehberleri", "files": ["docs/EVREN_ENTEGRASYON_REHBERI.md", "docs/EVREN_AI_AGENT_PROMPT.md"]})
    batches.append({"title": "EVREN Platform Dokümantasyonu (Özet & Altyapı)", "files": ["evrendocs/docs.md"]})
    batches.append({"title": "EVREN Model Kataloğu (LLM, OCR, TTS, Karar)", "files": ["evrendocs/models_catalog.md", "evrendocs/release_notes.md"]})
    batches.append({"title": "EVREN Kullanıcı Kılavuzu (1. Başlarken & 2. Panel)", "files": ["evrendocs/user_guide.md"], "slice": (1, 200)})
    batches.append({"title": "EVREN Kullanıcı Kılavuzu (3. Veri Setleri & 4. Etiketleme)", "files": ["evrendocs/user_guide.md"], "slice": (201, 450)})
    batches.append({"title": "EVREN Kullanıcı Kılavuzu (5. Modeller & 6. Projeler)", "files": ["evrendocs/user_guide.md"], "slice": (451, 700)})
    batches.append({"title": "EVREN Kullanıcı Kılavuzu (7. Eğitim & 8. Çıkarım & API)", "files": ["evrendocs/user_guide.md"], "slice": (701, 980)})
    batches.append({"title": "EVREN Python İstemcisi ve API Sözleşmesi", "files": ["scripts/core/evren_client.py"]})

    # 11-20: Çekirdek Durum (State), Olaylar ve Giriş Noktaları
    batches.append({"title": "State ve Micro-Store Çekirdeği (1-180)", "files": ["src/app/state.ts"], "slice": (1, 180)})
    batches.append({"title": "State ve Micro-Store Aksiyonları (181-343)", "files": ["src/app/state.ts"], "slice": (181, 350)})
    batches.append({"title": "Uygulama Olay Köprüsü (Event Bridge)", "files": ["src/app/events.js"]})
    batches.append({"title": "Uygulama Başlatma ve Bootstrap", "files": ["src/app/bootstrap.js", "src/main.js"]})
    batches.append({"title": "Temel Veri Sözleşmeleri ve Tipler", "files": ["src/data/question.ts", "src/vite-env.d.ts"]})
    batches.append({"title": "Ders Verisi Yükleme Mantığı", "files": ["src/data/questions.js", "src/data/subjects.js"]})
    batches.append({"title": "Supabase İstemcisi ve Fallback Altyapısı", "files": ["src/data/supabase-client.ts"]})
    batches.append({"title": "Ders Kitabı (Textbook) Veri Modeli", "files": ["src/data/textbook.ts"]})
    batches.append({"title": "Supabase Şeması ve RLS Güvenliği", "files": ["supabase/schema.sql"]})
    batches.append({"title": "Ortak Yardımcılar: Depolama ve Kaçış Fonksiyonları", "files": ["src/shared/storage-keys.ts", "src/shared/escape.ts", "src/shared/difficulty.ts"]})

    # 21-30: Shared Katmanı ve Edge Fonksiyonları
    batches.append({"title": "Ortak Matematik & KaTeX İşleme", "files": ["src/shared/math-render.ts"]})
    batches.append({"title": "Ortak Markdown Dönüştürücü", "files": ["src/shared/simple-markdown.ts"]})
    batches.append({"title": "Ortak Soru Filtreleme ve Arama", "files": ["src/shared/question-filter.ts", "src/shared/search.ts"]})
    batches.append({"title": "Ortak Konu ve Kayıtlı Tercihler", "files": ["src/shared/topic.ts", "src/shared/saved-choices.ts", "src/shared/combo.ts"]})
    batches.append({"title": "Cloudflare Edge API: Ask-AI (Soru Çözüm)", "files": ["functions/api/ask-ai.ts"]})
    batches.append({"title": "Cloudflare Edge API: TTS (Seslendirme)", "files": ["functions/api/tts.ts"]})
    batches.append({"title": "AI Tutor Modülü Çekirdeği (1-150)", "files": ["src/features/ai-tutor/ai-tutor.ts"], "slice": (1, 150)})
    batches.append({"title": "AI Tutor Modülü UI & Chat (151-300)", "files": ["src/features/ai-tutor/ai-tutor.ts"], "slice": (151, 350)})
    batches.append({"title": "Seslendirme (Audio): Sağlayıcı Sözleşmeleri", "files": ["src/features/audio/speech-provider.ts"]})
    batches.append({"title": "Seslendirme (Audio): Servis ve Ses Seçimi", "files": ["src/features/audio/speech-service.ts", "src/features/audio/voice-gender.ts"]})

    # 31-45: Canlı Sınıf (Classroom) Modülleri
    batches.append({"title": "Classroom Tipleri ve Veri Yapıları", "files": ["src/features/classroom/types.ts"]})
    batches.append({"title": "Classroom Oturum Deposu ve Toast", "files": ["src/features/classroom/session-store.ts", "src/features/classroom/toast.ts"]})
    batches.append({"title": "Classroom Odak Takibi (Anti-Cheat & Grace)", "files": ["src/features/classroom/focus-tracker.ts"]})
    batches.append({"title": "Classroom WakeLock ve Ekran Açık Tutma", "files": ["src/features/classroom/wake-lock.ts"]})
    batches.append({"title": "Classroom Sıralama ve Puanlama", "files": ["src/features/classroom/ranking.ts"]})
    batches.append({"title": "Classroom Ağ Kanalı (WebRTC / PeerJS)", "files": ["src/features/classroom/room-channel.ts"]})
    batches.append({"title": "Classroom Mesaj İşleyici (1-175)", "files": ["src/features/classroom/message-handler.ts"], "slice": (1, 175)})
    batches.append({"title": "Classroom Mesaj İşleyici (176-350)", "files": ["src/features/classroom/message-handler.ts"], "slice": (176, 350)})
    batches.append({"title": "Classroom Oda Servisi (1-170)", "files": ["src/features/classroom/room-service.ts"], "slice": (1, 170)})
    batches.append({"title": "Classroom Oda Servisi (171-340)", "files": ["src/features/classroom/room-service.ts"], "slice": (171, 350)})
    batches.append({"title": "Classroom Arayüzü (1-170)", "files": ["src/features/classroom/room-ui.ts"], "slice": (1, 170)})
    batches.append({"title": "Classroom Arayüzü (171-345)", "files": ["src/features/classroom/room-ui.ts"], "slice": (171, 350)})
    batches.append({"title": "Classroom Modal ve Katılım Diyaloğu", "files": ["src/features/classroom/room-modal.ts"]})
    batches.append({"title": "Cevap İşaretleme ve Skor Mantığı", "files": ["src/features/answers/marking.ts"]})
    batches.append({"title": "Cevap Depolama ve Açıklama Çözümü", "files": ["src/features/answers/storage.ts", "src/features/answers/explanation.ts"]})

    # 46-60: Kitapçık (Booklet), Seçim ve Soru Kartı
    batches.append({"title": "Kitapçık: Soru Kartı Yapısı (1-180)", "files": ["src/features/booklet/question-card.ts"], "slice": (1, 180)})
    batches.append({"title": "Kitapçık: Soru Kartı Detayları (181-350)", "files": ["src/features/booklet/question-card.ts"], "slice": (181, 350)})
    batches.append({"title": "Kitapçık: Filtreleme Mantığı", "files": ["src/features/booklet/filter.ts"]})
    batches.append({"title": "Kitapçık: Görünüm Modu ve Kaldığı Yer", "files": ["src/features/booklet/view-mode.ts", "src/features/booklet/resume.ts"]})
    batches.append({"title": "Kitapçık: Arayüz Araç Çubuğu (Features Bar)", "files": ["src/features/booklet/features-bar.ts"]})
    batches.append({"title": "Kitapçık: Seçim ve İşaretleme Olayları", "files": ["src/features/booklet/selection.js"]})
    batches.append({"title": "Kitapçık: Render Döngüsü", "files": ["src/features/booklet/render.js"]})
    batches.append({"title": "Notasyonlar: Şık Eleme ve Vurgulayıcı", "files": ["src/features/annotations/eliminate-choice.ts", "src/features/annotations/highlighter.ts"]})
    batches.append({"title": "Dersler: Çekmece ve Başlık Satırları", "files": ["src/features/subjects/drawer.ts", "src/features/subjects/subject-rows.ts"]})
    batches.append({"title": "Dersler: Filtreler ve Sınav Modu", "files": ["src/features/subjects/filters.ts", "src/features/subjects/exam-mode.ts"]})
    batches.append({"title": "Dersler: Sınav Dönemleri Yönetimi", "files": ["src/features/subjects/exam-periods.ts"]})
    batches.append({"title": "Dersler: Ders Seçim Mantığı", "files": ["src/features/subjects/selection.js"]})
    batches.append({"title": "Dersler: Konu Modeli ve Konu Ağacı", "files": ["src/features/subjects/topic-model.js", "src/features/subjects/topics-tree.ts"]})
    batches.append({"title": "Dersler: Konu Yönetim Arayüzü", "files": ["src/features/subjects/topics.js"]})
    batches.append({"title": "Arama Özelliği (Search)", "files": ["src/features/search/search.js"]})

    # 61-75: Branşa Özel Özellikler, Kütüphane, Gamification ve Görünüm
    batches.append({"title": "Kütüphane (Yıldızlılar ve Rövanş Havuzu)", "files": ["src/features/library/library-model.ts", "src/features/library/library-drawer.ts", "src/features/library/library-actions.ts"]})
    batches.append({"title": "Gamification: Seri (Streak) ve Kombo Bildirimleri", "files": ["src/features/gamification/streak.ts", "src/features/gamification/combo-toast.ts"]})
    batches.append({"title": "İngilizce: Kelime ve Seviyeler", "files": ["src/features/english/vocabulary.js", "src/features/english/levels.js"]})
    batches.append({"title": "İngilizce: Çeviri ve Satır Arası Röntgen", "files": ["src/features/english/translations.js", "src/features/english/interlinear.ts"]})
    batches.append({"title": "İngilizce: Gramer Balonu", "files": ["src/features/english/grammar-bubble.ts"]})
    batches.append({"title": "TDE: Edebiyat Sözlüğü ve Pusula", "files": ["src/features/tde/edebiyat-dict.ts", "src/features/tde/edebiyat-pusulasi.ts"]})
    batches.append({"title": "TDE: Cümle Röntgeni ve Veri Modeli", "files": ["src/features/tde/cumle-xray.ts", "src/features/tde/cumle-xray-data.ts"]})
    batches.append({"title": "Matematik / Fen: Formül Sözlüğü ve Modal", "files": ["src/features/formulas/formula-dict.ts", "src/features/formulas/formula-modal.ts"]})
    batches.append({"title": "Yazı Tahtası Modu (Board Mode)", "files": ["src/features/board/board-mode.ts"]})
    batches.append({"title": "Yazdırma ve İbadet Vakitleri", "files": ["src/features/print/print.js", "src/features/prayer/prayer.js"]})
    batches.append({"title": "Görünüm: Tema ve Vurgu Rengi", "files": ["src/features/appearance/theme.js", "src/features/appearance/accent.js"]})
    batches.append({"title": "Görünüm: Düzen ve Tercihler", "files": ["src/features/appearance/layout.js", "src/features/appearance/preferences.ts"]})
    batches.append({"title": "Stiller: Temel ve Dizin (Base, Index, Responsive)", "files": ["src/styles/base.css", "src/styles/index.css", "src/styles/responsive.css"]})
    batches.append({"title": "Stiller: Kitapçık ve Soru Kartı", "files": ["src/styles/booklet.css", "src/styles/header.css"]})
    batches.append({"title": "Stiller: AI Tutor ve Seslendirme", "files": ["src/styles/ai-tutor.css", "src/styles/answers.css"]})

    # 76-85: Diğer CSS Stilleri ve Arayüz Kabuğu
    batches.append({"title": "Stiller: Classroom ve Sınıf Ekstraları", "files": ["src/styles/classroom.css", "src/styles/classroom-extras.css"]})
    batches.append({"title": "Stiller: Branşlar (English, TDE, Formül)", "files": ["src/styles/english.css", "src/styles/tde.css", "src/styles/formulas.css"]})
    batches.append({"title": "Stiller: Çekmece, Konular ve Vurgular", "files": ["src/styles/drawer.css", "src/styles/topics.css", "src/styles/highlights.css"]})
    batches.append({"title": "Arayüz Kabuğu ve Vite Yapılandırması", "files": ["index.html", "vite.config.js"]})
    batches.append({"title": "Mimari Denetim Betiği (check-architecture)", "files": ["scripts/check-architecture.js"]})
    batches.append({"title": "Webapp Veri Üretim Betiği (build_webapp)", "files": ["scripts/core/build_webapp.py"]})
    batches.append({"title": "AÖF Sınav Parser ve Pipeline", "files": ["scripts/core/aof_parser.py", "scripts/core/aof_evren_pipeline.py"]})
    batches.append({"title": "TDE Fonoloji ve Gramer Röntgen Hattı", "files": ["scripts/core/evren_tde_phonology_pipeline.py", "scripts/core/evren_tde_grammar_xray_pipeline.py"]})
    batches.append({"title": "EVREN Sıfır Hata Master Motoru", "files": ["scripts/core/evren_zero_error_master.py"]})
    batches.append({"title": "Ders Kataloğu ve Supabase Senkronizasyonu", "files": ["scripts/core/sync_to_supabase.py", "scripts/core/sync_tde_master_glossary.py"]})

    # 86-95: Test Süitleri (Unit & Hardening)
    batches.append({"title": "Testler: AI Tutor Entegrasyon Testleri", "files": ["tests/ai-tutor.test.ts"]})
    batches.append({"title": "Testler: Classroom Hardening ve Session", "files": ["tests/classroom-hardening.test.ts", "tests/classroom-session.test.ts"]})
    batches.append({"title": "Testler: Seslendirme ve Supabase Testleri", "files": ["tests/speech.test.ts", "tests/supabase-client.test.ts"]})
    batches.append({"title": "Testler: TDE Özellikleri ve Cümle Röntgeni", "files": ["tests/tde-features.test.ts"]})
    batches.append({"title": "Testler: Ders Kitabı ve Matematik Testleri", "files": ["tests/textbook.test.ts", "tests/math-features.test.ts"]})
    batches.append({"title": "Testler: Şık Eleme ve Gamification", "files": ["tests/eliminate-choice.test.ts", "tests/eliminate-wrong.test.ts", "tests/combo.test.ts"]})
    batches.append({"title": "Testler: Taksonomi ve Veri Doğrulama", "files": ["tests/data.test.ts", "tests/tarih-taxonomy.test.ts", "tests/ing-taxonomy.test.ts"]})
    batches.append({"title": "Testler: Görünüm, Kütüphane ve Regresyon", "files": ["tests/view-mode.test.ts", "tests/library.test.ts", "tests/regressions.test.ts"]})
    batches.append({"title": "Testler: E2E Playwright Uygulama Akışları", "files": ["tests/browser/app.spec.js"]})
    batches.append({"title": "Testler: E2E Regresyon Testleri", "files": ["tests/browser/regressions.spec.js"]})

    # 96-100: Final Entegrasyon, Budama ve Astra İçin Mühürleme
    batches.append({"title": "Final Konsolidasyon 1: Jenga Modülerlik Matrisi ve Sınır Kontrolü", "files": ["docs/ARCHITECTURE.md", "src/app/state.ts"]})
    batches.append({"title": "Final Konsolidasyon 2: EVREN Model & Kota Verimlilik Tablosu", "files": ["docs/EVREN_ENTEGRASYON_REHBERI.md", "functions/api/ask-ai.ts"]})
    batches.append({"title": "Final Konsolidasyon 3: Gereksiz Dosya/Özellik Budama (Dead Code Pruning)", "files": ["AGENTS.md"]})
    batches.append({"title": "Final Konsolidasyon 4: Aşama Aşama Astra Uygulama Yönergesi (Sıfır Hata Protokolü)", "files": ["docs/ARCHITECTURE.md"]})
    batches.append({"title": "Final Mühürleme: Kusursuz 100/100 Canlı Mimari Plan Sertifikasyonu", "files": ["docs/EVREN_MIMARI_PLAN.md"]})

    return batches

def read_files_content(batch: Dict[str, Any]) -> str:
    """Belirtilen dosya veya dosya dilimlerini satır numaralarıyla okur."""
    content_parts = []
    line_slice = batch.get("slice")

    for rel_path in batch["files"]:
        p = ROOT_DIR / rel_path
        if not p.exists():
            content_parts.append(f"--- [UYARI: {rel_path} bulunamadı] ---")
            continue
        try:
            raw_lines = p.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            content_parts.append(f"--- [İkili Dosya: {rel_path}] ---")
            continue

        start_line = 1
        end_line = len(raw_lines)
        if line_slice:
            start_line = max(1, line_slice[0])
            end_line = min(len(raw_lines), line_slice[1])

        numbered_lines = []
        for idx in range(start_line - 1, end_line):
            numbered_lines.append(f"{idx + 1:4d}: {raw_lines[idx]}")

        snippet = "\n".join(numbered_lines)
        content_parts.append(f"=== DOSYA: {rel_path} (Satır {start_line}-{end_line} / Toplam {len(raw_lines)}) ===\n{snippet}\n")

    return "\n".join(content_parts)

def load_or_init_state() -> Dict[str, Any]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "current_loop": 0,
        "completed_loops": [],
        "created_at": time.time(),
        "updated_at": time.time(),
    }

def save_state(state: Dict[str, Any]) -> None:
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

def load_or_init_plan() -> str:
    if PLAN_FILE.exists():
        return PLAN_FILE.read_text(encoding="utf-8").strip()
    return """# AÖL Dijital Kitapçık — EVREN & Jenga Mimari Geliştirme Planı
> **Hedef:** Özelliklerin birbirinden tamamen bağımsız olduğu (Jenga mimarisi), 350 satır sınırına uyan, EVREN platformuna entegre, %100 kararlı ve sıfır spagettiye sahip nihai sistem tasarımı.
> **Uygulayıcı:** Astra (ChatGPT / Otonom Kodlama Ajanı).

## Bölüm 1: Jenga Modülerlik ve Bağımsızlık Analizi (Özellik İzolasyonu)
*(Henüz analiz edilmedi — Döngüler tamamlandıkça güncellenecek)*

## Bölüm 2: Durum Yönetimi (State & Store) ve 350 Satır Denetimi
*(Henüz analiz edilmedi)*

## Bölüm 3: EVREN API ve Model Entegrasyonu (LLM, OCR, TTS, Karar)
*(Henüz analiz edilmedi)*

## Bölüm 4: Veri Hatları, Taksonomi ve Ders Kitabı Entegrasyonu
*(Henüz analiz edilmedi)*

## Bölüm 5: Budanan / İptal Edilen Varsayımlar Günlüğü (Pruned Log)
*(Henüz analiz edilmedi)*

## Bölüm 6: Astra İçin Adım Adım Kodlama Yönergesi (Sıfır Hata Protokolü)
*(Henüz analiz edilmedi)*
"""

def save_plan(plan_text: str) -> None:
    PLAN_FILE.write_text(plan_text.strip() + "\n", encoding="utf-8")

def run_loop_step(
    client: EvrenClient,
    loop_idx: int,
    batch: Dict[str, Any],
    current_plan: str,
    model: str = "glm-5.3",
) -> str:
    """Tek bir mimari döngüyü EVREN LLM ile yürütür ve güncellenmiş plan metnini döner."""
    batch_content = read_files_content(batch)

    prompt = f"""### DÖNGÜ: {loop_idx} / 100 — {batch['title']}

### İNCELENEN DOSYALAR VE GERÇEK SATIRLAR:
{batch_content}

### MEVCUT MİMARİ PLAN (ÖNCEKİ DÖNGÜLERDEN GELEN CANLI TASLAK):
```markdown
{current_plan}
```

### SENİN GÖREVİN:
Yukarıdaki dosyaların her satırını büyüteçle incele.
1. **Jenga & İzolasyon Analizi:** Bu dosyalardaki özellik (feature) başka hangi dosyalara gizlice dokunuyor? Bağımsız bir modül haline gelmesi için bu bağlantılar nasıl koparılmalı?
2. **350 Satır ve Spagetti Tespiti:** Sınırı aşan veya yaklaşan fonksiyonları/dosyaları somut satır numarasıyla belirt.
3. **EVREN Entegrasyonu:** EVREN'in modelleri (`glm-5.3`, `deepseek-v4.1-flash`, `dots-ocr`, `voxcpm2`, `clef`, `qwen3-asr-1.7b`) bu dosyalara nasıl kusursuz bağlanır?
4. **Planı Güncelle ve Budama:**
   - Eğer planda önceden yazılmış ama bu dosyayı okuyunca gerçekçi olmadığı anlaşılan maddeler varsa **SİL VEYA DEĞİŞTİR** (ve Bölüm 5'teki Budanan Varsayımlar Günlüğü'ne not düş).
   - Astra'nın doğrudan uygulayabilmesi için net dosya yolları, arayüz tipleri ve fonksiyon imzaları ver.
   - Planı baştan sona eksiksiz, Markdown formatında, 6 bölümün tamamını koruyarak üret.

Lütfen çıktıyı SADECE güncellenmiş yeni `# AÖL Dijital Kitapçık — EVREN & Jenga Mimari Geliştirme Planı` Markdown metni olarak üret."""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]

    updated_plan, usage = client.chat_completion(
        messages=messages,
        model=model,
        temperature=0.15,
        max_tokens=4096,
        thinking=False,
    )
    return updated_plan.strip()

def main():
    parser = argparse.ArgumentParser(description="EVREN 100-Döngülü Mimari Planlayıcı")
    parser.add_argument("--start", type=int, default=None, help="Başlanacak döngü numarası (1-100)")
    parser.add_argument("--count", type=int, default=1, help="Kaç döngü çalıştırılacak?")
    parser.add_argument("--model", type=str, default="qwen3.8-flash-next", help="EVREN model adı (varsayılan: qwen3.8-flash-next)")
    parser.add_argument("--dry-run", action="store_true", help="API çağırmadan sadece dosya kuyruğunu ve içeriği test et")
    args = parser.parse_args()

    schedule = generate_100_loop_schedule()
    total_loops = len(schedule)
    print(f"🚀 EVREN 100-Döngülü Mimari Motoru Hazır: Toplam {total_loops} mikro-döngü tanımlandı.")

    state = load_or_init_state()
    start_idx = args.start if args.start is not None else (state["current_loop"] + 1)
    end_idx = min(total_loops, start_idx + args.count - 1)

    print(f"📊 Aktif Aralık: Döngü {start_idx} -> {end_idx} (Kalan: {total_loops - start_idx + 1})")

    if args.dry_run:
        print("\n🧪 [DRY RUN] Dosya kuyruğu simülasyonu:")
        for idx in range(start_idx, end_idx + 1):
            b = schedule[idx - 1]
            files_str = ", ".join(b["files"])
            slice_str = f" [Satır: {b['slice'][0]}-{b['slice'][1]}]" if "slice" in b else ""
            print(f"  [{idx:03d}/100] {b['title']}: {files_str}{slice_str}")
        print("\n✅ DRY RUN tamamlandı. Dosya yolları ve bölümler geçerli.")
        return

    client = EvrenClient()
    if not client.is_configured:
        print("❌ Hata: EVREN_API_KEY tanımlı değil. Lütfen .env dosyasını kontrol edin.")
        sys.exit(1)

    current_plan = load_or_init_plan()

    for idx in range(start_idx, end_idx + 1):
        batch = schedule[idx - 1]
        print(f"\n========================================================")
        print(f"🔄 DÖNGÜ {idx}/{total_loops}: {batch['title']}")
        print(f"📁 Dosyalar: {batch['files']}")
        print(f"========================================================")

        try:
            updated = run_loop_step(client, idx, batch, current_plan, model=args.model)
            if updated and len(updated) > 200:
                current_plan = updated
                save_plan(current_plan)
                state["current_loop"] = idx
                if idx not in state["completed_loops"]:
                    state["completed_loops"].append(idx)
                state["updated_at"] = time.time()
                save_state(state)
                print(f"✅ Döngü {idx} başarıyla tamamlandı. Plan güncellendi ({len(current_plan)} karakter).")
                if client.remaining_daily_tokens:
                    print(f"💡 Kalan Günlük EVREN Token: {client.remaining_daily_tokens:,}")
            else:
                print(f"⚠️ Uyarı: Döngü {idx} boş veya çok kısa yanıt döndürdü, atlanıyor.")
        except Exception as e:
            print(f"❌ Döngü {idx} sırasında hata oluştu: {e}")
            break

    print("\n🏁 İşlem tamamlandı. Güncel plan: docs/EVREN_MIMARI_PLAN.md")

if __name__ == "__main__":
    main()

