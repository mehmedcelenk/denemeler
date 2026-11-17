-- Run only against a disposable database after both classroom migrations.
DO $$ BEGIN
  IF current_setting('classroom.test_confirm',true) IS DISTINCT FROM 'isolated-test' THEN
    RAISE EXCEPTION 'Set classroom.test_confirm=isolated-test on a disposable database';
  END IF;
END $$;
BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('30000000-0000-0000-0000-000000000001','room-name-a@example.invalid','{"username":"room_name_a"}'),
 ('30000000-0000-0000-0000-000000000002','room-name-b@example.invalid','{"username":"room_name_b"}'),
 ('30000000-0000-0000-0000-000000000003','room-name-c@example.invalid','{"username":"room_name_c"}');
INSERT INTO public.user_profiles(id,username,display_name) VALUES
 ('30000000-0000-0000-0000-000000000001','room_name_a','A'),
 ('30000000-0000-0000-0000-000000000002','room_name_b','B'),
 ('30000000-0000-0000-0000-000000000003','room_name_c','C')
ON CONFLICT(id) DO NOTHING;
SET LOCAL ROLE authenticated;
DO $$
DECLARE a jsonb; b jsonb; joined jsonb;
  ca constant uuid := '40000000-0000-0000-0000-000000000001';
  cb constant uuid := '40000000-0000-0000-0000-000000000002';
  cc constant uuid := '40000000-0000-0000-0000-000000000003';
BEGIN
  PERFORM set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000001',true);
  a := public.join_or_create_room(' IŞIK ',ca,true,NULL);
  PERFORM set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000002',true);
  b := public.join_or_create_room('İŞİK',cb,true,NULL);
  IF a->>'roomId' = b->>'roomId' THEN RAISE EXCEPTION 'Dotted and dotless I must not share a room'; END IF;
  PERFORM set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000003',true);
  joined := public.join_or_create_room('ışık',cc,true,NULL);
  IF joined->>'roomId' <> a->>'roomId' THEN RAISE EXCEPTION 'Dotless I case matching failed'; END IF;
  PERFORM public.leave_room((joined->>'roomId')::uuid,cc);
  joined := public.join_or_create_room('işik',cc,true,NULL);
  IF joined->>'roomId' <> b->>'roomId' THEN RAISE EXCEPTION 'Dotted I case matching failed'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
