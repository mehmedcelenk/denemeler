-- Migration: Add responsible_courses JSONB column to user_progress
-- Safe & idempotent: inherits existing authenticated RLS policies on user_progress.

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS responsible_courses JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_progress_responsible_courses_obj'
  ) THEN
    ALTER TABLE public.user_progress
      ADD CONSTRAINT chk_user_progress_responsible_courses_obj
      CHECK (jsonb_typeof(responsible_courses) = 'object');
  END IF;
END $$;
