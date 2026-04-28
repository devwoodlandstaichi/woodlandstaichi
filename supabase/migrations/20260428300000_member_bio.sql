-- Member bio + photo. Owned by the member; reused on the public
-- Instructors page if/when the member is promoted (instructors.member_id
-- link). RLS for "members update self" was already added in the initial
-- schema, so members can update these new columns immediately.

alter table public.members
  add column if not exists bio text,
  add column if not exists photo_url text;
