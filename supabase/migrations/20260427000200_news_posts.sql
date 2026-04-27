-- News posts — short announcements the founder/instructors will want to add
-- via Studio (and eventually via admin UI in Phase 4).

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  body text not null,                 -- markdown allowed
  posted_at date not null default current_date,
  published boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index news_posts_published_posted_idx
  on public.news_posts (published, posted_at desc)
  where published = true;

create trigger set_updated_at_news_posts before update on public.news_posts
  for each row execute function public.set_updated_at();

alter table public.news_posts enable row level security;

create policy "anyone reads published posts"
  on public.news_posts for select
  using (published = true);

create policy "admins manage news"
  on public.news_posts for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));
