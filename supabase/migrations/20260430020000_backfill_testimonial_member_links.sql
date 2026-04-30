-- One-shot backfill: link historical (WordPress-migrated) testimonials
-- to existing public.members rows by matching the "First L" attribution
-- string against first_name + last_name initial. Phase 5.1 follow-up so
-- legacy quotes show up under their authors' /members/me account when
-- they sign in.
--
-- Two of the 15 historical entries (Helen G, Colleen W) match no one
-- on the current roster and stay null — likely former members who
-- aren't tracked any more. They remain visible on /about as before;
-- only the member_id linkage is missing.
--
-- Idempotent: WHERE member_id IS NULL plus the unique-match guard
-- means re-running does nothing once linked.

with matched as (
  select t.id as t_id, m.id as m_id
  from public.testimonials t
  join public.members m on (
    -- Standard "First L" → first_name + last_name initial
    (lower(m.first_name) = lower(split_part(t.member_name, ' ', 1))
     and left(lower(m.last_name), 1) = lower(split_part(t.member_name, ' ', 2)))
    -- "Mickey C" → "Mickey Paul Collins" (multi-word first_name)
    or (m.first_name like '% %'
        and lower(split_part(m.first_name, ' ', 1)) = lower(split_part(t.member_name, ' ', 1))
        and left(lower(m.last_name), 1) = lower(split_part(t.member_name, ' ', 2)))
    -- "Jen R" → "Jennifer Rich" (short-form first name)
    or (t.member_name ilike 'jen %'
        and lower(m.first_name) = 'jennifer'
        and left(lower(m.last_name), 1) = lower(split_part(t.member_name, ' ', 2)))
  )
  where t.member_id is null
),
unique_matches as (
  -- Only link when exactly one member matches a given testimonial.
  -- Guards against an accidental two-people-share-a-name collision.
  -- Postgres has no min(uuid); array_agg works for our purpose since
  -- count(*)=1 means only one element to pick.
  select t_id, (array_agg(m_id))[1] as m_id
  from matched
  group by t_id
  having count(*) = 1
)
update public.testimonials t
set member_id = u.m_id
from unique_matches u
where t.id = u.t_id;
