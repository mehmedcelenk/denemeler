-- Data integrity exercise, NOT a concurrent or network/load test.
-- Use only on an isolated DB: PGOPTIONS='-c classroom.test_confirm=isolated-test'.
DO $$ BEGIN
  IF current_setting('classroom.test_confirm', true) IS DISTINCT FROM 'isolated-test' THEN
    RAISE EXCEPTION 'Set classroom.test_confirm=isolated-test on a disposable database';
  END IF;
END $$;
BEGIN;
INSERT INTO auth.users(id,email,raw_user_meta_data)
SELECT ('31000000-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid,
       'classroom-scale-' || i || '@example.invalid',
       jsonb_build_object('username', 'classroom_scale_' || i)
FROM generate_series(0,60) i;
INSERT INTO public.user_profiles(id,username,display_name)
SELECT ('31000000-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid,
       'classroom_scale_' || i, 'Öğrenci ' || i
FROM generate_series(0,60) i ON CONFLICT(id) DO NOTHING;

SET LOCAL ROLE authenticated;
DO $$
DECLARE s jsonb; r uuid; uid uuid; conn uuid; i integer; cursor_id bigint; last_id bigint; page_count integer;
  host constant uuid := '31000000-0000-0000-0000-000000000000';
  host_conn constant uuid := '32000000-0000-0000-0000-000000000000';
BEGIN
  PERFORM set_config('request.jwt.claim.sub',host::text,true);
  s := public.join_or_create_room('Sınıf 61', host_conn, true, NULL);
  r := (s->>'roomId')::uuid;
  cursor_id := (s->'events'->-1->>'id')::bigint;
  FOR i IN 1..60 LOOP
    uid := ('31000000-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid;
    conn := ('32000000-0000-0000-0000-' || lpad(i::text,12,'0'))::uuid;
    PERFORM set_config('request.jwt.claim.sub',uid::text,true);
    s := public.join_or_create_room('sınıf 61',conn,true,NULL);
    IF (s->>'roomId')::uuid <> r OR (s->>'hostId')::uuid <> host
      OR jsonb_array_length(s->'members') <> 1 OR jsonb_array_length(s->'events') <> 0 THEN
      RAISE EXCEPTION 'Incorrect room/role/privacy for student %', i;
    END IF;
    s := public.update_room_member(r,conn,false,jsonb_build_object(i::text, i % 2 = 0),1);
    s := public.update_room_member(r,conn,false,jsonb_build_object(i::text, i % 2 <> 0),1);
    IF (s->'members'->0->'answers'->>i::text)::boolean <> (i % 2 = 0) THEN
      RAISE EXCEPTION 'Duplicate sequence overwrote student % answer', i;
    END IF;
    s := public.update_room_member(r,conn,true,'{}',2);
  END LOOP;
  PERFORM set_config('request.jwt.claim.sub',host::text,true);
  s := public.get_room_snapshot(r,host_conn);
  IF (s->>'participantCount')::integer <> 61 OR jsonb_array_length(s->'members') <> 61 THEN
    RAISE EXCEPTION 'Expected host and sixty students';
  END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(s->'members') m
      WHERE m->>'userId' <> host::text AND (m->>'visible')::boolean AND (m->>'online')::boolean) <> 60 THEN
    RAISE EXCEPTION 'Wrong participant visibility or connectivity';
  END IF;
  IF jsonb_array_length(s->'events') <> 100 THEN RAISE EXCEPTION 'Event history must be capped at 100'; END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(s->'members') m
      WHERE m->>'userId' <> host::text AND (SELECT count(*) FROM jsonb_object_keys(m->'answers')) = 1) <> 60 THEN
    RAISE EXCEPTION 'Student answers were lost';
  END IF;
  s := public.update_room_member(r,host_conn,true,'{}',1,cursor_id);
  page_count := jsonb_array_length(s->'events');
  last_id := (s->'events'->-1->>'id')::bigint;
  IF page_count <> 100 OR (s->'events'->0->>'id')::bigint <= cursor_id THEN
    RAISE EXCEPTION 'First event page skipped entries';
  END IF;
  s := public.update_room_member(r,host_conn,true,'{}',2,last_id);
  IF jsonb_array_length(s->'events') <> 80 OR (s->'events'->0->>'id')::bigint <= last_id THEN
    RAISE EXCEPTION 'Remaining event page skipped entries';
  END IF;
END $$;
RESET ROLE;
ROLLBACK;
