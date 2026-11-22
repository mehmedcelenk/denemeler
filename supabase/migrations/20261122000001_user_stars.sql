-- Migration: Add stars counter column to user_progress for 7 Sema Katmanı rank sync
-- Safe & idempotent: inherits existing authenticated RLS policies on user_progress.

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS stars INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_progress_stars_nonneg'
  ) THEN
    ALTER TABLE public.user_progress
      ADD CONSTRAINT chk_user_progress_stars_nonneg
      CHECK (stars >= 0);
  END IF;
END $$;
