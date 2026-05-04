-- Seed the initial 7 WTCD events from the legacy site. Mirrors
-- supabase/snippets/seed-wtcd-events.sql but as a migration so
-- `supabase db push` actually applies it on prod (snippets aren't
-- run by db push). Idempotent on the `year` unique constraint —
-- re-running is a no-op for existing rows. Posters initially point
-- at the legacy WordPress URLs; before DNS cutover, an admin should
-- re-host each via /admin/wtcd → Edit → Replace.

insert into public.wtcd_events (year, event_date, location, poster_url) values
  (2026, '2026-04-25', 'North Shore Park, The Woodlands, TX',
   'https://woodlandstaichi.com/wp-content/uploads/2026/04/WTCD_poster_2026_v4-Final-225x300-1.png'),
  (2025, '2025-04-26', 'The Woodlands, TX',
   'https://woodlandstaichi.com/wp-content/uploads/2025/04/WTCD_poster_2025-1-768x1024.jpg'),
  (2024, '2024-04-27', 'The Woodlands, TX',
   'https://woodlandstaichi.com/wp-content/uploads/2024/04/flyer-wtcd-2024-scaled.jpg'),
  (2023, '2023-04-29', 'The Woodlands, TX',
   'https://woodlandstaichi.com/wp-content/uploads/2023/03/WTCD23-Postcard-copy-768x1140.jpg'),
  (2022, '2022-04-30', 'The Woodlands, TX',
   'https://woodlandstaichi.com/wp-content/uploads/2023/01/WTCD22-Poster6x9.webp'),
  (2021, '2021-04-24', 'The Woodlands, TX',
   'https://woodlandstaichi.com/wp-content/uploads/2023/01/WTCD21fly-front_red.webp'),
  (2019, '2019-04-27', 'The Woodlands, TX',
   'https://woodlandstaichi.com/wp-content/uploads/2023/01/Tai-Chi-Fly2019-postcard.webp')
on conflict (year) do nothing;
