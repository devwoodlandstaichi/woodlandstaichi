-- Per-member opt-in for showing their photo on public-facing pages
-- (a future practitioner roster, testimonial cards, etc.). Privacy-
-- first default: existing members are NOT shown publicly until they
-- explicitly opt in via /members/me. Admins can flip it on a
-- member's behalf from the edit page.

alter table public.members
  add column if not exists photo_public boolean not null default false;
