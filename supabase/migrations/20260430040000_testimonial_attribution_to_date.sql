-- Migrate parseable date strings out of testimonials.attribution and
-- into the structured submitted_at column so the public /about can
-- render them as proper dates. Phase 5.1 follow-up.
--
-- Only handles strict "M/D/YY" or "M/D/YYYY" patterns (e.g. "8/5/21",
-- "8/10/23"). Free-form attributions like "member since 2017" or
-- "retired nurse" are left untouched and continue to display as the
-- secondary line on the card.
--
-- Idempotent: WHERE clause skips rows whose attribution has already
-- been parsed (NULLed) on a previous run.

-- 4-digit year format (M/D/YYYY)
update public.testimonials
set
  submitted_at = to_timestamp(attribution, 'FMMM/FMDD/YYYY'),
  attribution = null
where attribution ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$'
  and submitted_at is null;

-- 2-digit year format (M/D/YY) — Postgres pivots <70 to 2000s, >=70
-- to 1900s, which is what we want for testimonials dating back to
-- the early 2010s at the oldest.
update public.testimonials
set
  submitted_at = to_timestamp(attribution, 'FMMM/FMDD/YY'),
  attribution = null
where attribution ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{2}$'
  and submitted_at is null;
