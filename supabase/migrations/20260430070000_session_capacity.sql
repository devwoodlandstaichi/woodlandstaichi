-- Per-session capacity override. NULL means "inherit from
-- public.classes.capacity" (the recurring class definition); a non-null
-- value applies just to this single occurrence — useful when a guest
-- instructor uses a smaller room, or a special drop-in is intentionally
-- capped lower than the parent class.

alter table public.class_sessions
  add column capacity integer
  check (capacity is null or capacity >= 0);
