-- Migration: Pre-generated EVREN teacher lessons per question
-- Safe & idempotent: adds question_lessons table, index, updated_at trigger, and RLS policies.

CREATE TABLE IF NOT EXISTS public.question_lessons (
    question_id INTEGER PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    payload JSONB NOT NULL,
    model TEXT,
    version SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_question_lessons_payload CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_question_lessons_subject
    ON public.question_lessons(subject);

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_question_lessons_timestamp ON public.question_lessons;
CREATE TRIGGER set_question_lessons_timestamp
    BEFORE UPDATE ON public.question_lessons
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.question_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read question_lessons" ON public.question_lessons;
CREATE POLICY "Public read question_lessons"
    ON public.question_lessons FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role write question_lessons" ON public.question_lessons;
CREATE POLICY "Service role write question_lessons"
    ON public.question_lessons FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
