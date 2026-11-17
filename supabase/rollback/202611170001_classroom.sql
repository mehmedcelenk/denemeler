-- Emergency rollback of ONLY the new classroom feature; does not drop its data.
-- First archive the three classroom tables, stop classroom clients and save this migration version.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.join_or_create_room(text,uuid,boolean,uuid),
  public.update_room_member(uuid,uuid,boolean,jsonb,bigint,bigint),public.get_room_snapshot(uuid,uuid),
  public.leave_room(uuid,uuid),public.publish_room_announcement(uuid,uuid,text),public.close_classroom_room(uuid,uuid)
  FROM authenticated, anon, PUBLIC;
COMMIT;
-- Keep the new UI's explicit connection error. Do not silently fall back to the insecure old protocol.
-- After repairing and testing, restore the final GRANT EXECUTE stanza of the forward migration.
