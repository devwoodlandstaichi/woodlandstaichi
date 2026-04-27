-- Seed data for local development.
-- Mirrors the current Woodlands Tai Chi class schedule from the live site.

insert into public.classes (name, level, location, location_address, day_of_week, start_time, end_time, capacity, description, display_order) values
  ('Wednesday Morning Beginners', 'beginners',
   'The Woodlands Methodist Church', '1915 Lake Front Circle, The Woodlands, TX',
   'wed', '08:00', '09:00', 30,
   'Beginners class — free to join. Reg/shirt payment due at enrollment.', 10),

  ('Wednesday Evening Beginners', 'beginners',
   'The Woodlands Methodist Church', '1915 Lake Front Circle, The Woodlands, TX',
   'wed', '17:15', '18:15', 30,
   'Beginners class — free to join. Reg/shirt payment due at enrollment.', 20),

  ('Friday Morning Beginners', 'beginners',
   'The Woodlands Methodist Church', '1915 Lake Front Circle, The Woodlands, TX',
   'fri', '08:00', '09:00', 30,
   'Beginners class — free to join. Reg/shirt payment due at enrollment.', 30),

  ('Thursday Morning Beginners', 'beginners',
   'Kevin Brady Community Center', '2250 Buckthorne Pl, The Woodlands, TX',
   'thu', '08:30', '09:30', 30,
   'Beginners class — free to join. Reg/shirt payment due at enrollment.', 40),

  ('Wednesday Morning Intermediate & Advanced', 'intermediate',
   'The Woodlands Methodist Church', '1915 Lake Front Circle, The Woodlands, TX',
   'wed', '09:00', '11:00', 40,
   'Intermediate and advanced practice.', 50),

  ('Wednesday Evening Intermediate & Advanced', 'intermediate',
   'The Woodlands Methodist Church', '1915 Lake Front Circle, The Woodlands, TX',
   'wed', '18:15', '19:15', 40,
   'Intermediate and advanced practice.', 60),

  ('Thursday Morning Combined', 'combined',
   'Kevin Brady Community Center', '2250 Buckthorne Pl, The Woodlands, TX',
   'thu', '09:30', '11:00', 40,
   'Combined class for all levels.', 70),

  ('Friday Morning Remedial', 'remedial',
   'The Woodlands Methodist Church', '1915 Lake Front Circle, The Woodlands, TX',
   'fri', '08:00', '09:00', 20,
   'Remedial class — by invitation only.', 80),

  ('Friday Morning Play-Only', 'play_only',
   'The Woodlands Methodist Church', '1915 Lake Front Circle, The Woodlands, TX',
   'fri', '09:00', '11:00', 30,
   'Advanced play-only session — by invitation only.', 90);
