-- Per-session "newcomers welcome" flag. Different from class.level —
-- a Tuesday Intermediate session can still be flagged as a good first
-- visit (e.g. the instructor is running an open-floor day), without
-- changing the class itself. Defaults off so existing rows aren't
-- silently advertised.

alter table public.class_sessions
  add column newcomer_friendly boolean not null default false;

-- Partial index supports quick "what are the next newcomer sessions?"
-- lookups without bloating writes on the much larger general index.
create index class_sessions_newcomer_idx
  on public.class_sessions (session_date)
  where newcomer_friendly = true;
