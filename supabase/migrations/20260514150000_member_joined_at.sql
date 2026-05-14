-- Admin-editable "member since" date, distinct from the system
-- created_at audit timestamp.
--
-- Until now the public profile and admin pages have rendered "Member
-- since X" off members.created_at — which is set by Postgres at
-- insert time and was never editable. That's fine for digital
-- registrations through /classes/register, but the school has
-- decades of paper-form joins; admins need to set the real join
-- date for those rows without lying about when the row was created.
--
-- joined_at is a date (no time-of-day — the school doesn't track
-- that), nullable so existing rows behave exactly as before. Every
-- public display falls back to created_at when joined_at is null.

alter table public.members
  add column if not exists joined_at date;
