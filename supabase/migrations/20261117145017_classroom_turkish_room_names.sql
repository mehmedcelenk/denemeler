-- Keep Turkish dotted and dotless I distinct, including for already open rooms.
BEGIN;
LOCK TABLE public.classroom_rooms IN ACCESS EXCLUSIVE MODE;
UPDATE public.classroom_rooms SET name_key = lower(translate(name,'Iİ','ıi'));

CREATE OR REPLACE FUNCTION public.join_or_create_room(p_name text, p_connection_id uuid, p_visible boolean, p_room_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid(); v_name text; v_key text; v_display text; v_room public.classroom_rooms;
  v_member public.classroom_members; v_old public.classroom_members;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF p_connection_id IS NULL OR p_visible IS NULL THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  v_name := regexp_replace(btrim(coalesce(p_name,'')), '\s+', ' ', 'g');
  IF char_length(v_name) NOT BETWEEN 1 AND 24 THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  v_key := lower(translate(v_name,'Iİ','ıi'));
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
COMMIT;
