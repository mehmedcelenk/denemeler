-- ==============================================================================
-- AÖL Dijital Kitapçık — Supabase Veritabanı Şeması
-- Uyumlu Sözleşmeler: src/data/question.ts & src/data/textbook.ts
-- ==============================================================================

-- Gerekli Eklentiler (Extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Türkçe metin/trigram araması için
-- Vektör arama (EVREN qwen3-embedding-8b / 4096-boyut) gereksinimi için:
CREATE EXTENSION IF NOT EXISTS "vector";

-- ------------------------------------------------------------------------------
-- 1. SORULAR TABLOSU (questions)
-- src/data/question.ts Question arayüzünün birebir SQL karşılığı
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,                           -- Sabit soru kimliği (örn: 474, 1992)
    subject TEXT,                                     -- Ders alanı kodu (örn: 'KLM', 'TDE', 'MAT')
    ders TEXT NOT NULL,                               -- Ders tam adı (örn: 'KELAM – 1')
    ders_kodu INTEGER,                                -- MEB ders kodu (örn: 819)
    soru_no SMALLINT,                                 -- Sınavdaki soru sırası (1..20)
    soru TEXT NOT NULL,                               -- Ham soru metni / kökü
    secenekler JSONB NOT NULL,                        -- {"A": "...", "B": "...", "C": "...", "D": "...", "E"?: "..."}
    dogru_cevap VARCHAR(1) NOT NULL,                  -- 'A', 'B', 'C', 'D', 'E'
    ana_konu TEXT,                                    -- Taksonomi ana konu başlığı
    alt_konu TEXT,                                    -- Taksonomi alt konu başlığı
    yil TEXT,                                         -- Sınav yılı (örn: '2023-2024')
    donem TEXT,                                       -- Sınav dönemi (örn: '1', '2', '3')
    puan NUMERIC(4, 2),                               -- Soru puanı (örn: 0.20 veya 5.00)
    kredi SMALLINT,                                   -- Ders kredisi (örn: 2)
    sinav_soru_sayisi SMALLINT,                       -- Dönem sınavındaki soru adedi (örn: 10 veya 20)
    ipucu TEXT,                                       -- Soruya özel ipucu metni
    sekilli BOOLEAN NOT NULL DEFAULT false,           -- Görsel/şekilli soru bayrağı
    zorluk TEXT,                                      -- 'kek', 'orta', 'boss'
    soru_tr TEXT,                                     -- İngilizce sorular için Türkçe çeviri
    soru_ar TEXT,                                     -- Kelam/AÖF için Arapça orijinal metin
    soru_xray TEXT,                                   -- Kavram balonlu & dil bilgisi ayrıştırılmış HTML
    secenekler_xray JSONB,                           -- Şıklara özel kavram/balon işaretlemeleri
    dogru_nedeni TEXT,                                -- MEB ders kitabı sayfa atıflı çözüm gerekçesi
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_dogru_cevap CHECK (dogru_cevap IN ('A', 'B', 'C', 'D', 'E')),
    CONSTRAINT chk_zorluk CHECK (zorluk IS NULL OR zorluk IN ('kek', 'orta', 'boss')),
    CONSTRAINT chk_secenekler_valid CHECK (
        jsonb_typeof(secenekler) = 'object' AND
        secenekler ? 'A' AND
        secenekler ? 'B' AND
        secenekler ? 'C' AND
        secenekler ? 'D'
    )
);

-- ------------------------------------------------------------------------------
-- 2. KAVRAMLAR VE ISTILAHLAR TABLOSU (concepts)
-- src/data/textbook.ts ScopedConceptEntry & data/concepts/*.json karşılığı
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,                              -- Benzersiz kavram kodu (örn: 'klm1_hudus_delili', 'mat_kumeler_ve_alt_kume_d1')
    base_id TEXT,                                     -- Kök kavram kimliği (örn: 'mat_kumeler_ve_alt_kume')
    term TEXT NOT NULL,                               -- Kavram başlığı (örn: 'Hudûs Delili')
    subject TEXT NOT NULL,                            -- SubjectId (örn: 'KLM', 'TDE', 'COG', 'DIN')
    ders TEXT NOT NULL,                               -- Ders adı (örn: 'KELAM – 1')
    ders_kodu INTEGER,                                -- MEB ders kodu
    donem SMALLINT NOT NULL,                          -- Müfredat kademesi / dönemi (1..8)
    unite_no SMALLINT,                                -- Kitap ünite numarası
    sayfa SMALLINT,                                   -- MEB PDF sayfa numarası
    tanim TEXT NOT NULL,                              -- Pedagojik tanım & sınav şifresi
    baglam_farki TEXT,                                -- Diğer dönemlerle anlam/bağlam farkı
    sinav_ipucu TEXT,                                 -- MEB sınav tuzağı / püf noktası
    pattern TEXT,                                     -- Röntgen regex eşleştirme deseni
    aliases JSONB NOT NULL DEFAULT '[]'::jsonb,       -- Eş anlamlı veya alternatif terimler listesi
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_donem_positive CHECK (donem >= 1)
);

-- ------------------------------------------------------------------------------
-- 3. SORU-KAVRAM İLİŞKİLERİ KÖPRÜ TABLOSU (question_concepts)
-- Sorular ile müfredat kavramları arasındaki çoka-çok (N:M) ilişki
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_concepts (
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    match_type TEXT NOT NULL DEFAULT 'xray',          -- 'xray' (otomatik balon), 'curriculum' (müfredat), 'ai'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (question_id, concept_id)
);

-- ------------------------------------------------------------------------------
-- 4. YAPAY ZEKA ÖĞRETMEN AÇIKLAMALARI (ai_explanations)
-- data/ai_explanations/*.json ve EVREN LLM çıkarımlarının önbelleği
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_explanations (
    question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    query TEXT NOT NULL DEFAULT 'Bu soruyu adım adım açıklar mısın?',
    reply TEXT NOT NULL,                              -- 4 adımlı pedagojik çözüm Markdown metni
    model TEXT NOT NULL DEFAULT 'deepseek-v4.1-flash',-- EVREN / Yerel model adı
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. SEMANTİK VEKTÖRLER (question_embeddings) [EVREN Entegrasyonu]
-- EVREN qwen3-embedding-8b (4096 boyut) ile benzer soru & konu tespiti
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_embeddings (
    question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    embedding vector(4096),                           -- TR-TEB 1. Türkçe embedding
    model TEXT NOT NULL DEFAULT 'qwen3-embedding-8b',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- İNDEKS TASARIMI (Performans & Filtreleme)
-- ------------------------------------------------------------------------------

-- Sorular tablosu indeksleri
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_ders ON questions(ders);
CREATE INDEX IF NOT EXISTS idx_questions_ders_kodu ON questions(ders_kodu);
CREATE INDEX IF NOT EXISTS idx_questions_yil_donem ON questions(yil, donem);
CREATE INDEX IF NOT EXISTS idx_questions_ana_konu ON questions(ana_konu);
CREATE INDEX IF NOT EXISTS idx_questions_zorluk ON questions(zorluk);
CREATE INDEX IF NOT EXISTS idx_questions_sekilli ON questions(sekilli) WHERE sekilli = true;
-- Trigram Türkçe metin araması (LIKE / ILIKE ve regex aramaları için devasa hız)
CREATE INDEX IF NOT EXISTS idx_questions_soru_trgm ON questions USING gin (soru gin_trgm_ops);

-- Kavramlar tablosu indeksleri
CREATE INDEX IF NOT EXISTS idx_concepts_base_id ON concepts(base_id);
CREATE INDEX IF NOT EXISTS idx_concepts_subject ON concepts(subject);
CREATE INDEX IF NOT EXISTS idx_concepts_ders_donem ON concepts(ders, donem);
CREATE INDEX IF NOT EXISTS idx_concepts_term ON concepts(term);
CREATE INDEX IF NOT EXISTS idx_concepts_tanim_trgm ON concepts USING gin (tanim gin_trgm_ops);

-- İlişki ve açıklama indeksleri
CREATE INDEX IF NOT EXISTS idx_qc_concept ON question_concepts(concept_id);
CREATE INDEX IF NOT EXISTS idx_ai_explanations_model ON ai_explanations(model);

-- Vektör benzerlik indeksi (HNSW / Cosine Distance)
CREATE INDEX IF NOT EXISTS idx_question_embeddings_hnsw 
ON question_embeddings USING hnsw (embedding vector_cosine_ops);

-- ------------------------------------------------------------------------------
-- GÜNCELLEME ZAMAN DAMGASI TETİKLEYİCİSİ (Trigger)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_questions_timestamp ON questions;
CREATE TRIGGER set_questions_timestamp
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_concepts_timestamp ON concepts;
CREATE TRIGGER set_concepts_timestamp
    BEFORE UPDATE ON concepts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ------------------------------------------------------------------------------

-- RLS etkinleştirme
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_embeddings ENABLE ROW LEVEL SECURITY;

-- 1. Okuma Politikaları (Public Anon & Authenticated erişebilir)
DROP POLICY IF EXISTS "Public questions read policy" ON questions;
CREATE POLICY "Public questions read policy" 
    ON questions FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public concepts read policy" ON concepts;
CREATE POLICY "Public concepts read policy" 
    ON concepts FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public question_concepts read policy" ON question_concepts;
CREATE POLICY "Public question_concepts read policy" 
    ON question_concepts FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public ai_explanations read policy" ON ai_explanations;
CREATE POLICY "Public ai_explanations read policy" 
    ON ai_explanations FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Public question_embeddings read policy" ON question_embeddings;
CREATE POLICY "Public question_embeddings read policy" 
    ON question_embeddings FOR SELECT 
    USING (true);

-- 2. Yazma Politikaları (Sadece backend / service_role yazabilir)
DROP POLICY IF EXISTS "Service role write questions" ON questions;
CREATE POLICY "Service role write questions" 
    ON questions FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role write concepts" ON concepts;
CREATE POLICY "Service role write concepts" 
    ON concepts FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role write question_concepts" ON question_concepts;
CREATE POLICY "Service role write question_concepts" 
    ON question_concepts FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role write ai_explanations" ON ai_explanations;
CREATE POLICY "Service role write ai_explanations" 
    ON ai_explanations FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role write question_embeddings" ON question_embeddings;
CREATE POLICY "Service role write question_embeddings" 
    ON question_embeddings FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
