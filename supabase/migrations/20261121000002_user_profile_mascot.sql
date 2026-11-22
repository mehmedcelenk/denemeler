-- Migration: Add mascot_id preference column to user_profiles
-- Safe & idempotent: inherits existing authenticated RLS policies on user_profiles.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS mascot_id TEXT NOT NULL DEFAULT 'cat';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_profiles_mascot_id'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT chk_user_profiles_mascot_id
      CHECK (mascot_id IN ('cat', 'dog', 'fish', 'none'));
  END IF;
END $$;
