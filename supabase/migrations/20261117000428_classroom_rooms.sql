-- Apply after schema.sql, first to an isolated Supabase project. Never resets user progress.
BEGIN;

CREATE SCHEMA IF NOT EXISTS classroom_private;
REVOKE ALL ON SCHEMA classroom_private FROM PUBLIC, anon, authenticated;

CREATE TABLE public.classroom_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 24),
  name_key text NOT NULL,
  host_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  closed_at timestamptz,
  announcement_id bigint NOT NULL DEFAULT 0,
  announcement text NOT NULL DEFAULT '' CHECK (char_length(announcement) <= 280)
);
CREATE UNIQUE INDEX classroom_open_name ON public.classroom_rooms(name_key) WHERE closed_at IS NULL;

CREATE TABLE public.classroom_members (
  room_id uuid NOT NULL REFERENCES public.classroom_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  connection_id uuid NOT NULL,
  name text NOT NULL,
  visible boolean NOT NULL,
  online boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  last_seen_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  left_at timestamptz,
  last_sequence bigint NOT NULL DEFAULT 0 CHECK (last_sequence BETWEEN 0 AND 9007199254740991),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(answers) = 'object'),
  PRIMARY KEY (room_id, user_id)
);
CREATE INDEX classroom_member_account ON public.classroom_members(user_id) WHERE left_at IS NULL;

CREATE TABLE public.classroom_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.classroom_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('JOIN','LEAVE','AWAY','RETURN','OFFLINE','ONLINE')),
  happened_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX classroom_event_room ON public.classroom_events(room_id, id DESC);

ALTER TABLE public.classroom_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.classroom_rooms, public.classroom_members, public.classroom_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.classroom_events_id_seq FROM PUBLIC, anon, authenticated;

CREATE FUNCTION classroom_private.assert_member(p_room_id uuid, p_connection_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));
  -- All room operations serialize on this lock, including expiry and snapshot creation.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_room_id::text, 1));
  IF NOT EXISTS (SELECT 1 FROM public.classroom_members
      WHERE room_id = p_room_id AND user_id = v_uid AND connection_id = p_connection_id AND left_at IS NULL) THEN
    RAISE EXCEPTION 'CONNECTION_REPLACED';
  END IF;
  RETURN v_uid;
END;
$$;

CREATE FUNCTION classroom_private.expire_members(p_room_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  WITH expired AS (
    UPDATE public.classroom_members SET online = false
    WHERE room_id = p_room_id AND online AND left_at IS NULL
      AND last_seen_at < clock_timestamp() - interval '15 seconds'
    RETURNING room_id, user_id, name, last_seen_at
  )
  INSERT INTO public.classroom_events(room_id,user_id,name,kind,happened_at)
  SELECT room_id,user_id,name,'OFFLINE',last_seen_at + interval '15 seconds' FROM expired;
$$;

CREATE FUNCTION classroom_private.snapshot(p_room_id uuid, p_uid uuid, p_after_event bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_room public.classroom_rooms; v_members jsonb; v_events jsonb; v_sequence bigint;
BEGIN
  SELECT * INTO STRICT v_room FROM public.classroom_rooms WHERE id = p_room_id;
  PERFORM classroom_private.expire_members(p_room_id);
  SELECT last_sequence INTO STRICT v_sequence FROM public.classroom_members WHERE room_id = p_room_id AND user_id = p_uid;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'userId',user_id,'name',name,'visible',visible,'online',online AND left_at IS NULL,
      'joinedAt',extract(epoch FROM joined_at)*1000,'lastSeenAt',extract(epoch FROM last_seen_at)*1000,
      'answers',answers) ORDER BY joined_at,user_id),'[]'::jsonb)
  INTO v_members FROM public.classroom_members
  WHERE room_id = p_room_id AND (v_room.host_id = p_uid OR user_id = p_uid);
  IF p_after_event IS NULL THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('id',id::text,'type',kind,'userId',user_id,'name',name,
        'at',extract(epoch FROM happened_at)*1000) ORDER BY id),'[]'::jsonb)
    INTO v_events FROM (SELECT * FROM public.classroom_events
      WHERE room_id = p_room_id AND v_room.host_id = p_uid ORDER BY id DESC LIMIT 100) recent;
  ELSE
    SELECT coalesce(jsonb_agg(jsonb_build_object('id',id::text,'type',kind,'userId',user_id,'name',name,
        'at',extract(epoch FROM happened_at)*1000) ORDER BY id),'[]'::jsonb)
    INTO v_events FROM (SELECT * FROM public.classroom_events
      WHERE room_id = p_room_id AND v_room.host_id = p_uid AND id > p_after_event ORDER BY id LIMIT 100) recent;
  END IF;
  RETURN jsonb_build_object('roomId',v_room.id,'roomName',v_room.name,'hostId',v_room.host_id,
    'closed',v_room.closed_at IS NOT NULL,'sequence',v_sequence,
    'participantCount',(SELECT count(*) FROM public.classroom_members WHERE room_id = p_room_id AND left_at IS NULL),
    'announcement',CASE WHEN v_room.announcement_id = 0 THEN NULL ELSE
      jsonb_build_object('id',v_room.announcement_id::text,'text',v_room.announcement) END,
    'members',v_members,'events',v_events);
END;
$$;

CREATE FUNCTION public.join_or_create_room(p_name text, p_connection_id uuid, p_visible boolean, p_room_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid(); v_name text; v_key text; v_display text; v_room public.classroom_rooms;
  v_member public.classroom_members; v_old public.classroom_members;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_connection_id IS NULL OR p_visible IS NULL THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  v_name := regexp_replace(btrim(coalesce(p_name,'')), '\s+', ' ', 'g');
  IF char_length(v_name) NOT BETWEEN 1 AND 24 THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  v_key := lower(translate(v_name,'İIı','iii'));
  -- One active connection per account, and one open room per normalized name.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));
  IF EXISTS (SELECT 1 FROM public.classroom_members m JOIN public.classroom_rooms r ON r.id=m.room_id
    WHERE m.user_id=v_uid AND m.left_at IS NULL AND r.closed_at IS NULL
      AND m.last_seen_at >= clock_timestamp()-interval '15 seconds' AND m.connection_id <> p_connection_id) THEN
    RAISE EXCEPTION 'CONNECTION_ACTIVE';
  END IF;
  IF p_room_id IS NOT NULL THEN
    SELECT * INTO v_room FROM public.classroom_rooms WHERE id=p_room_id AND closed_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'ROOM_CLOSED'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.classroom_members WHERE room_id=p_room_id AND user_id=v_uid) THEN
      RAISE EXCEPTION 'FORBIDDEN';
    END IF;
  ELSE
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_key, 2));
    SELECT * INTO v_room FROM public.classroom_rooms WHERE name_key=v_key AND closed_at IS NULL;
    IF NOT FOUND THEN
      INSERT INTO public.classroom_rooms(name,name_key,host_id) VALUES(v_name,v_key,v_uid) RETURNING * INTO v_room;
    END IF;
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_room.id::text, 1));
  IF EXISTS (SELECT 1 FROM public.classroom_rooms WHERE id=v_room.id AND closed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'ROOM_CLOSED';
  END IF;
  FOR v_old IN UPDATE public.classroom_members SET left_at=clock_timestamp(),online=false
      WHERE user_id=v_uid AND room_id<>v_room.id AND left_at IS NULL RETURNING * LOOP
    INSERT INTO public.classroom_events(room_id,user_id,name,kind) VALUES(v_old.room_id,v_uid,v_old.name,'LEAVE');
  END LOOP;
  PERFORM classroom_private.expire_members(v_room.id);
  SELECT * INTO v_member FROM public.classroom_members WHERE room_id=v_room.id AND user_id=v_uid;
  SELECT left(coalesce(nullif(p.username,''),nullif(p.display_name,''),'Katılımcı'),80)
    INTO v_display FROM public.user_profiles p WHERE p.id=v_uid;
  v_display := coalesce(v_display,'Katılımcı');
  IF v_member.user_id IS NULL THEN
    INSERT INTO public.classroom_members(room_id,user_id,connection_id,name,visible)
      VALUES(v_room.id,v_uid,p_connection_id,v_display,p_visible);
    INSERT INTO public.classroom_events(room_id,user_id,name,kind) VALUES(v_room.id,v_uid,v_display,'JOIN');
  ELSE
    IF v_member.left_at IS NOT NULL OR NOT v_member.online THEN
      INSERT INTO public.classroom_events(room_id,user_id,name,kind)
        VALUES(v_room.id,v_uid,v_display,CASE WHEN v_member.left_at IS NOT NULL THEN 'JOIN' ELSE 'ONLINE' END);
    END IF;
    IF v_member.visible <> p_visible AND v_room.host_id <> v_uid THEN
      INSERT INTO public.classroom_events(room_id,user_id,name,kind)
        VALUES(v_room.id,v_uid,v_display,CASE WHEN p_visible THEN 'RETURN' ELSE 'AWAY' END);
    END IF;
    UPDATE public.classroom_members SET connection_id=p_connection_id,name=v_display,visible=p_visible,
      online=true,left_at=NULL,last_seen_at=clock_timestamp(),
      last_sequence=CASE WHEN connection_id=p_connection_id THEN last_sequence ELSE 0 END
      WHERE room_id=v_room.id AND user_id=v_uid;
  END IF;
  RETURN classroom_private.snapshot(v_room.id,v_uid);
END;
$$;

CREATE FUNCTION public.update_room_member(p_room_id uuid, p_connection_id uuid, p_visible boolean, p_answers jsonb, p_sequence bigint, p_after_event bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid; v_member public.classroom_members; v_host uuid; v_answers jsonb;
BEGIN
  v_uid := classroom_private.assert_member(p_room_id,p_connection_id);
  IF EXISTS(SELECT 1 FROM public.classroom_rooms WHERE id=p_room_id AND closed_at IS NOT NULL) THEN
    RETURN classroom_private.snapshot(p_room_id,v_uid,p_after_event);
  END IF;
  IF p_visible IS NULL OR p_sequence IS NULL OR p_sequence NOT BETWEEN 1 AND 9007199254740991
      OR p_answers IS NULL OR jsonb_typeof(p_answers)<>'object' OR octet_length(p_answers::text)>65536 THEN
    RAISE EXCEPTION 'INVALID_INPUT';
  END IF;
  IF EXISTS(SELECT 1 FROM jsonb_each(p_answers) a WHERE a.key !~ '^[1-9][0-9]{0,14}$'
      OR jsonb_typeof(a.value) NOT IN ('boolean','null')) THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  PERFORM classroom_private.expire_members(p_room_id);
  SELECT * INTO STRICT v_member FROM public.classroom_members WHERE room_id=p_room_id AND user_id=v_uid;
  IF p_sequence <= v_member.last_sequence THEN RETURN classroom_private.snapshot(p_room_id,v_uid,p_after_event); END IF;
  SELECT host_id INTO v_host FROM public.classroom_rooms WHERE id=p_room_id;
  IF NOT v_member.online THEN
    INSERT INTO public.classroom_events(room_id,user_id,name,kind) VALUES(p_room_id,v_uid,v_member.name,'ONLINE');
  END IF;
  IF v_member.visible<>p_visible AND v_host<>v_uid THEN
    INSERT INTO public.classroom_events(room_id,user_id,name,kind)
      VALUES(p_room_id,v_uid,v_member.name,CASE WHEN p_visible THEN 'RETURN' ELSE 'AWAY' END);
  END IF;
  SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) INTO v_answers
    FROM jsonb_each(v_member.answers || p_answers) WHERE value <> 'null'::jsonb;
  UPDATE public.classroom_members SET visible=p_visible,online=true,last_seen_at=clock_timestamp(),
    answers=v_answers,last_sequence=p_sequence WHERE room_id=p_room_id AND user_id=v_uid;
  RETURN classroom_private.snapshot(p_room_id,v_uid,p_after_event);
END;
$$;

CREATE FUNCTION public.get_room_snapshot(p_room_id uuid, p_connection_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid;
BEGIN
  v_uid := classroom_private.assert_member(p_room_id,p_connection_id);
  RETURN classroom_private.snapshot(p_room_id,v_uid);
END;
$$;

CREATE FUNCTION public.leave_room(p_room_id uuid, p_connection_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid(); v_name text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text, 0));
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_room_id::text, 1));
  -- Retried leave is idempotent and cannot disconnect a replacement connection.
  UPDATE public.classroom_members SET online=false,left_at=clock_timestamp()
    WHERE room_id=p_room_id AND user_id=v_uid AND connection_id=p_connection_id AND left_at IS NULL
    RETURNING name INTO v_name;
  IF FOUND THEN
    INSERT INTO public.classroom_events(room_id,user_id,name,kind) VALUES(p_room_id,v_uid,v_name,'LEAVE');
  END IF;
END;
$$;

CREATE FUNCTION public.publish_room_announcement(p_room_id uuid, p_connection_id uuid, p_text text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid;
BEGIN
  v_uid := classroom_private.assert_member(p_room_id,p_connection_id);
  IF NOT EXISTS(SELECT 1 FROM public.classroom_rooms WHERE id=p_room_id AND host_id=v_uid) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
  IF p_text IS NULL OR char_length(btrim(p_text)) NOT BETWEEN 1 AND 280 THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  UPDATE public.classroom_rooms SET announcement=btrim(p_text),announcement_id=announcement_id+1
    WHERE id=p_room_id AND closed_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'ROOM_CLOSED'; END IF;
END;
$$;

CREATE FUNCTION public.close_classroom_room(p_room_id uuid, p_connection_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid;
BEGIN
  v_uid := classroom_private.assert_member(p_room_id,p_connection_id);
  UPDATE public.classroom_rooms SET closed_at=coalesce(closed_at,clock_timestamp()) WHERE id=p_room_id AND host_id=v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
END;
$$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA classroom_private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.join_or_create_room(text,uuid,boolean,uuid),
  public.update_room_member(uuid,uuid,boolean,jsonb,bigint,bigint),public.get_room_snapshot(uuid,uuid),
  public.leave_room(uuid,uuid),public.publish_room_announcement(uuid,uuid,text),public.close_classroom_room(uuid,uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_or_create_room(text,uuid,boolean,uuid),
  public.update_room_member(uuid,uuid,boolean,jsonb,bigint,bigint),public.get_room_snapshot(uuid,uuid),
  public.leave_room(uuid,uuid),public.publish_room_announcement(uuid,uuid,text),public.close_classroom_room(uuid,uuid)
  TO authenticated;

COMMIT;
