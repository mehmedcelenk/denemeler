-- Run ONLY on isolated database with PGOPTIONS='-c classroom.test_confirm=isolated-test'.
-- Assertions exercise real PL/pgSQL and role grants; all fixtures are rolled back.
DO $$ BEGIN
  IF current_setting('classroom.test_confirm',true) IS DISTINCT FROM 'isolated-test' THEN
    RAISE EXCEPTION 'Set classroom.test_confirm=isolated-test on a disposable database';
  END IF;
END $$;
BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('10000000-0000-0000-0000-000000000001','classroom-sql-host@example.invalid','{"username":"classroom_sql_host"}'),
       ('10000000-0000-0000-0000-000000000002','classroom-sql-student@example.invalid','{"username":"classroom_sql_student"}');
INSERT INTO public.user_profiles(id,username,display_name)
VALUES ('10000000-0000-0000-0000-000000000001','classroom_sql_host','Test Host'),
       ('10000000-0000-0000-0000-000000000002','classroom_sql_student','Test Student')
ON CONFLICT(id) DO NOTHING;
CREATE TEMP TABLE classroom_test_context(room_id uuid);
GRANT SELECT, INSERT ON classroom_test_context TO authenticated;

SET LOCAL ROLE authenticated;
DO $$
DECLARE s jsonb; r uuid; event_count int; answer_count int;
  h constant uuid := '20000000-0000-0000-0000-000000000001';
  c constant uuid := '20000000-0000-0000-0000-000000000002';
BEGIN
  PERFORM set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
  s := public.join_or_create_room('  Sınıf   İ  ',h,true,NULL);
  r := (s->>'roomId')::uuid;
  INSERT INTO classroom_test_context VALUES(r);
  IF s->>'hostId' <> auth.uid()::text OR s->>'participantCount' <> '1' THEN RAISE EXCEPTION 'First caller must be host'; END IF;
  BEGIN
    PERFORM public.join_or_create_room('sınıf i',gen_random_uuid(),true,NULL);
    RAISE EXCEPTION 'Second connection accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'CONNECTION_ACTIVE' THEN RAISE; END IF;
  END;
  PERFORM set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
  s := public.join_or_create_room('sınıf i',c,true,NULL);
  IF s->>'roomId' <> r::text OR s->>'hostId' = auth.uid()::text OR s->>'participantCount' <> '2'
     OR jsonb_array_length(s->'members')<>1 OR jsonb_array_length(s->'events')<>0 THEN
    RAISE EXCEPTION 'Join normalization / student privacy failed';
  END IF;
  s := public.update_room_member(r,c,false,'{"12":true,"13":false}',1);
  s := public.update_room_member(r,c,false,'{"12":false}',1);
  IF s->'members'->0->'answers'->>'12' <> 'true' THEN RAISE EXCEPTION 'Duplicate sequence changed answer'; END IF;
  s := public.update_room_member(r,c,false,'{"12":null}',2);
  IF s->'members'->0->'answers' ? '12' THEN RAISE EXCEPTION 'Answer revoke failed'; END IF;
  BEGIN
    PERFORM public.publish_room_announcement(r,c,'forged');
    RAISE EXCEPTION 'Student sent announcement';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'FORBIDDEN' THEN RAISE; END IF; END;
  BEGIN
    PERFORM public.close_classroom_room(r,c);
    RAISE EXCEPTION 'Student closed room';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'FORBIDDEN' THEN RAISE; END IF; END;
  BEGIN
    PERFORM public.update_room_member(r,h,true,'{}',3);
    RAISE EXCEPTION 'Student impersonated host connection';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CONNECTION_REPLACED' THEN RAISE; END IF; END;
  BEGIN
    PERFORM count(*) FROM public.classroom_members;
    RAISE EXCEPTION 'Direct member access allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
  s := public.get_room_snapshot(r,h);
  SELECT count(*) INTO event_count FROM jsonb_array_elements(s->'events') e WHERE e->>'type'='AWAY';
  IF event_count<>1 THEN RAISE EXCEPTION 'Hidden heartbeat must emit only one AWAY event'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(s->'events') e WHERE e->>'type'='RETURN') THEN
    RAISE EXCEPTION 'Heartbeat falsely reported return';
  END IF;
  PERFORM public.publish_room_announcement(r,h,'Ders başladı');
  s := public.join_or_create_room('Sınıf İ',h,true,r);
  IF s->>'hostId'<>auth.uid()::text OR s->'announcement'->>'text'<>'Ders başladı' THEN
    RAISE EXCEPTION 'Host resume/announcement failed';
  END IF;
END $$;

RESET ROLE;
-- Expire only student and prove network status never changes visibility.
UPDATE public.classroom_members SET last_seen_at=clock_timestamp()-interval '20 seconds'
WHERE room_id=(SELECT room_id FROM classroom_test_context) AND user_id='10000000-0000-0000-0000-000000000002';
SET LOCAL ROLE authenticated;
DO $$
DECLARE r uuid := (SELECT room_id FROM classroom_test_context); s jsonb; next_room uuid;
  h constant uuid := '20000000-0000-0000-0000-000000000001';
  c constant uuid := '20000000-0000-0000-0000-000000000002';
  replacement constant uuid := '20000000-0000-0000-0000-000000000003';
BEGIN
  PERFORM set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
  s := public.get_room_snapshot(r,h);
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(s->'events') e WHERE e->>'type'='OFFLINE') THEN
    RAISE EXCEPTION 'Offline event missing';
  END IF;
  PERFORM set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
  s := public.join_or_create_room('Sınıf İ',replacement,false,r);
  BEGIN
    PERFORM public.update_room_member(r,c,true,'{}',3);
    RAISE EXCEPTION 'Replaced connection can write';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'CONNECTION_REPLACED' THEN RAISE; END IF; END;
  PERFORM public.leave_room(r,c); -- stale leave must not disconnect replacement
  s := public.update_room_member(r,replacement,true,'{}',1);
  IF s->'members'->0->>'online'<>'true' THEN RAISE EXCEPTION 'Stale leave disconnected replacement'; END IF;
  PERFORM set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
  PERFORM public.close_classroom_room(r,h);
  s := public.get_room_snapshot(r,h);
  IF s->>'closed'<>'true' THEN RAISE EXCEPTION 'Close failed'; END IF;
  BEGIN
    PERFORM public.join_or_create_room('Sınıf İ',h,true,r);
    RAISE EXCEPTION 'Closed resume reopened room';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'ROOM_CLOSED' THEN RAISE; END IF; END;
  s := public.join_or_create_room('Sınıf İ',h,true,NULL);
  next_room := (s->>'roomId')::uuid;
  IF next_room=r OR jsonb_array_length(s->'members')<>1 THEN RAISE EXCEPTION 'New session reused old room'; END IF;
END $$;
RESET ROLE;

DO $$ BEGIN
  IF has_function_privilege('anon','public.join_or_create_room(text,uuid,boolean,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous RPC access allowed';
  END IF;
  IF has_function_privilege('authenticated','classroom_private.snapshot(uuid,uuid,bigint)','EXECUTE') THEN
    RAISE EXCEPTION 'Private snapshot publicly executable';
  END IF;
END $$;
ROLLBACK;
