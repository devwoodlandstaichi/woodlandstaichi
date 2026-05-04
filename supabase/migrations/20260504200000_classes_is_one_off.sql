-- One-off events (workshops, special-instructor visits, World Tai Chi
-- Day, etc.) are modelled as a class_sessions row whose parent classes
-- row is flagged is_one_off = true. The parent class is hidden from
-- the recurring-class admin list, the public weekly schedule grid, and
-- the term generator — so it never spawns weekly occurrences. Every
-- existing query that joins classes!inner keeps working unchanged.

alter table public.classes
  add column is_one_off boolean not null default false;

create index classes_is_one_off_idx
  on public.classes (is_one_off)
  where is_one_off = true;
