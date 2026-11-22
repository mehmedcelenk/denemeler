-- Robokuş ('bird') seçeneğini user_profiles.mascot_id CHECK kısıtına ekler.
ALTER TABLE public.user_profiles
    DROP CONSTRAINT IF EXISTS chk_user_profiles_mascot_id;

ALTER TABLE public.user_profiles
    ADD CONSTRAINT chk_user_profiles_mascot_id
    CHECK (mascot_id IN ('cat', 'dog', 'fish', 'bird', 'none'));
