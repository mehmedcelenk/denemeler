-- ==============================================================================
-- AÖL Dijital Kitapçık — Supabase Veritabanı Şeması
-- Uyumlu Sözleşmeler: src/data/question.ts & src/data/textbook.ts
-- ==============================================================================

-- Gerekli Eklentiler (Extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Türkçe metin/trigram araması için
CREATE EXTENSION IF NOT EXISTS "vector";       -- Vektör arama (EVREN qwen3-embedding-8b / 4096-boyut)

-- ------------------------------------------------------------------------------
-- 1. SORULAR TABLOSU (questions)
-- src/data/question.ts Question arayüzünün birebir SQL karşılığı
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,                           -- Sabit soru kimliği (örn: 474, 1992, 51001)
    subject TEXT NOT NULL,                            -- Ders alanı kodu (örn: 'KLM', 'TDE', 'MAT', 'TYT_TURKCE')
    ders TEXT NOT NULL,                               -- Ders tam adı (örn: 'KELAM – 1', 'TYT TÜRKÇE')
    ders_kodu INTEGER,                                -- MEB ders kodu (örn: 819)
    soru_no SMALLINT,                                 -- Sınavdaki soru sırası (1..20)
    soru TEXT NOT NULL,                               -- Ham soru metni / kökü
    secenekler JSONB NOT NULL,                        -- {"A": "...", "B": "...", "C": "...", "D": "...", "E"?: "..."}
    dogru_cevap VARCHAR(1) NOT NULL,                  -- 'A', 'B', 'C', 'D', 'E'
    ana_konu TEXT,                                    -- Taksonomi ana konu başlığı
    alt_konu TEXT,                                    -- Taksonomi alt konu başlığı
    yil TEXT,                                         -- Sınav yılı (örn: '2023-2024')
    donem TEXT,                                       -- Sınav dönemi (örn: '1', '2', '3')
    sinav_kodu TEXT,                                  -- AÖF/MEB sınav oturum kodu
    sinav_adi TEXT,                                   -- Sınav oturum adı (örn: 'TYT', '1. Sınıf Güz Vize')
    puan NUMERIC(4, 2),                               -- Soru puanı (örn: 0.20 veya 1.00)
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
    CONSTRAINT chk_soru_not_empty CHECK (length(btrim(soru)) > 0),
    CONSTRAINT chk_secenekler_valid CHECK (
        jsonb_typeof(secenekler) = 'object' AND
        secenekler ? 'A' AND
        secenekler ? 'B' AND
        secenekler ? 'C' AND
        secenekler ? 'D'
    )
);

-- ------------------------------------------------------------------------------
-- 2. DERS KATALOĞU VE MANIFEST TABLOSU (subjects)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,                              -- Örn: 'TDE', 'TYT_TURKCE', 'AOF_HADIS'
    name TEXT NOT NULL,                               -- Örn: 'Türk Dili ve Ed.', 'TYT Türkçe'
    short_name TEXT NOT NULL,                         -- Örn: 'TDE', 'TÜRKÇE'
    icon TEXT,                                        -- Emoji/ikon (örn: '📚', '📐')
    program TEXT NOT NULL,                            -- 'AOIHL', 'AOF', 'TYT', 'AYT', 'YDT', 'ILMIHAL', 'GIRISIMCILIK'
    category TEXT NOT NULL,                           -- 'sozel', 'sayisal', 'kultur', 'ilahiyat'
    kredi SMALLINT NOT NULL DEFAULT 2,
    question_count INTEGER NOT NULL DEFAULT 0,
    course_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. KAVRAMLAR VE ISTILAHLAR TABLOSU (concepts)
-- src/data/textbook.ts ScopedConceptEntry & data/concepts/*.json karşılığı
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,                              -- Benzersiz kavram kodu (örn: 'klm1_hudus_delili', 'mat_kumeler_ve_alt_kume_d1')
    base_id TEXT,                                     -- Kök kavram kimliği (örn: 'mat_kumeler_ve_alt_kume')
    term TEXT NOT NULL,                               -- Kavram başlığı (örn: 'Hudûs Delili')
    subject TEXT NOT NULL,                            -- SubjectId (örn: 'KLM', 'TDE', 'COG', 'AOF_AHLAK')
    ders TEXT NOT NULL,                               -- Ders adı (örn: 'KELAM – 1', 'İSLAM AHLAK ESASLARI')
    ders_kodu INTEGER,                                -- MEB ders kodu
    donem SMALLINT NOT NULL,                          -- Müfredat kademesi / dönemi (1..8)
    unite_no SMALLINT,                                -- Kitap ünite numarası
    sayfa SMALLINT,                                   -- MEB PDF sayfa numarası
    tanim TEXT NOT NULL,                              -- Pedagojik tanım & sınav şifresi
    baglam_farki TEXT,                                -- Diğer dönemlerle anlam/bağlam farkı
    sinav_ipucu TEXT,                                 -- MEB sınav tuzağı / püf noktası / şifresi
    pattern TEXT,                                     -- Röntgen regex eşleştirme deseni
    aliases JSONB NOT NULL DEFAULT '[]'::jsonb,       -- Eş anlamlı veya alternatif terimler listesi
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_donem_positive CHECK (donem >= 1)
);

-- ------------------------------------------------------------------------------
-- 4. SORU-KAVRAM İLİŞKİLERİ KÖPRÜ TABLOSU (question_concepts)
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
-- 5. YAPAY ZEKA ÖĞRETMEN AÇIKLAMALARI (ai_explanations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_explanations (
    question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    query TEXT NOT NULL DEFAULT 'Bu soruyu adım adım açıklar mısın?',
    reply TEXT NOT NULL,                              -- 4 adımlı pedagojik çözüm Markdown metni
    model TEXT NOT NULL DEFAULT 'deepseek-v4.1-flash',-- EVREN / Yerel model adı
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. SEMANTİK VEKTÖRLER (question_embeddings) [EVREN Entegrasyonu]
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_embeddings (
    question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    embedding vector(4096),                           -- TR-TEB 1. Türkçe embedding
    model TEXT NOT NULL DEFAULT 'qwen3-embedding-8b',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 7. KULLANICI PROFİLLERİ (user_profiles) [Supabase Auth Entegre]
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '',
    program_mode TEXT NOT NULL DEFAULT 'AOIHL',
    water_streak INTEGER NOT NULL DEFAULT 0,
    last_streak_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. KULLANICI İLERLEMESİ VE CEVAPLARI (user_progress) [Supabase Auth Entegre]
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    choices JSONB NOT NULL DEFAULT '{}'::jsonb,        -- { [qid]: "A" | "B" | ... }
    starred JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [qid1, qid2, ...]
    rematch JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [qid1, qid2, ...]
    eliminated_choices JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_session JSONB,                               -- { subject, questionId, timestamp }
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- İNDEKS TASARIMI (Performans & Filtreleme)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_ders ON questions(ders);
CREATE INDEX IF NOT EXISTS idx_questions_ders_kodu ON questions(ders_kodu);
CREATE INDEX IF NOT EXISTS idx_questions_yil_donem ON questions(yil, donem);
CREATE INDEX IF NOT EXISTS idx_questions_sinav_adi ON questions(sinav_adi);
CREATE INDEX IF NOT EXISTS idx_questions_ana_konu ON questions(ana_konu);
CREATE INDEX IF NOT EXISTS idx_questions_zorluk ON questions(zorluk);
CREATE INDEX IF NOT EXISTS idx_questions_sekilli ON questions(sekilli) WHERE sekilli = true;
CREATE INDEX IF NOT EXISTS idx_questions_soru_trgm ON questions USING gin (soru gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_concepts_base_id ON concepts(base_id);
CREATE INDEX IF NOT EXISTS idx_concepts_subject ON concepts(subject);
CREATE INDEX IF NOT EXISTS idx_concepts_ders_donem ON concepts(ders, donem);
CREATE INDEX IF NOT EXISTS idx_concepts_term ON concepts(term);
CREATE INDEX IF NOT EXISTS idx_concepts_tanim_trgm ON concepts USING gin (tanim gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_qc_concept ON question_concepts(concept_id);
CREATE INDEX IF NOT EXISTS idx_ai_explanations_model ON ai_explanations(model);

-- Not: pgvector HNSW indeksi 2000 boyut sınırına sahiptir. 4096-boyutlu TR-TEB embedding'leri
-- 10.000 soru altında tam doğruluklu (exact cosine) sıralama ile <5ms sürede taranır.

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
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_concepts_timestamp ON concepts;
CREATE TRIGGER set_concepts_timestamp
    BEFORE UPDATE ON concepts
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_user_profiles_timestamp ON user_profiles;
CREATE TRIGGER set_user_profiles_timestamp
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_user_progress_timestamp ON user_progress;
CREATE TRIGGER set_user_progress_timestamp
    BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- YENİ KULLANICI OTOMATİK PROFİL TETİKLEYİCİSİ (Trigger)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));

    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ------------------------------------------------------------------------------
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- 1. Genel Okuma Politikaları (Public Anon & Authenticated)
DROP POLICY IF EXISTS "Public read questions" ON questions;
CREATE POLICY "Public read questions" 
    ON questions FOR SELECT 
    TO anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Public read subjects" ON subjects;
CREATE POLICY "Public read subjects" 
    ON subjects FOR SELECT 
    TO anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Public read concepts" ON concepts;
CREATE POLICY "Public read concepts" 
    ON concepts FOR SELECT 
    TO anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Public read question_concepts" ON question_concepts;
CREATE POLICY "Public read question_concepts" 
    ON question_concepts FOR SELECT 
    TO anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Public read ai_explanations" ON ai_explanations;
CREATE POLICY "Public read ai_explanations" 
    ON ai_explanations FOR SELECT 
    TO anon, authenticated 
    USING (true);

DROP POLICY IF EXISTS "Public read question_embeddings" ON question_embeddings;
CREATE POLICY "Public read question_embeddings" 
    ON question_embeddings FOR SELECT 
    TO anon, authenticated 
    USING (true);

-- 2. Kullanıcı Profil ve İlerleme Politikaları (Sadece Kendi Verisine Erişim)
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" 
    ON user_profiles FOR SELECT 
    TO authenticated 
    USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" 
    ON user_profiles FOR UPDATE 
    TO authenticated 
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" 
    ON user_profiles FOR INSERT 
    TO authenticated 
    WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can read own progress" ON user_progress;
CREATE POLICY "Users can read own progress" 
    ON user_progress FOR SELECT 
    TO authenticated 
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
CREATE POLICY "Users can update own progress" 
    ON user_progress FOR UPDATE 
    TO authenticated 
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
CREATE POLICY "Users can insert own progress" 
    ON user_progress FOR INSERT 
    TO authenticated 
    WITH CHECK ((select auth.uid()) = user_id);

-- 3. Backend / Service Role Tam Erişim Politikaları
DROP POLICY IF EXISTS "Service role write questions" ON questions;
CREATE POLICY "Service role write questions" 
    ON questions FOR ALL 
    TO service_role 
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role write subjects" ON subjects;
CREATE POLICY "Service role write subjects" 
    ON subjects FOR ALL 
    TO service_role 
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role write concepts" ON concepts;
CREATE POLICY "Service role write concepts" 
    ON concepts FOR ALL 
    TO service_role 
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role write question_concepts" ON question_concepts;
CREATE POLICY "Service role write question_concepts" 
    ON question_concepts FOR ALL 
    TO service_role 
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role write ai_explanations" ON ai_explanations;
CREATE POLICY "Service role write ai_explanations" 
    ON ai_explanations FOR ALL 
    TO service_role 
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role write question_embeddings" ON question_embeddings;
CREATE POLICY "Service role write question_embeddings" 
    ON question_embeddings FOR ALL 
    TO service_role 
    USING (true) WITH CHECK (true);
