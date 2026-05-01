-- Rename classes.cohort_start_date → classes.class_start_date. The
-- "cohort" framing was abandoned earlier in favour of treating each
-- recurring class as the unit of enrolment, but the column name lagged.
-- Metadata-only rename; no row rewrite.

alter table public.classes
  rename column cohort_start_date to class_start_date;
