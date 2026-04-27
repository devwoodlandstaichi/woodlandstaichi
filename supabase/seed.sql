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

-- Testimonials migrated from the old site (woodlandstaichi.com/about-us/testimonial/).
-- Quotes preserved as found; some were truncated during scrape and may need
-- founder review before publishing to production.
insert into public.testimonials (member_name, attribution, quote, display_order) values
  ('Tom G', '8/5/21',
   'Woodlands Tai Chi has been a wonderful addition to my life. After over 4 years in the group, I wholeheartedly recommend Tai Chi to anyone looking to improve their health and Woodlands Tai Chi as the place to get the training and practice that bring great results.',
   10),

  ('Lessley C', 'member since 2017',
   'Practicing Tai Chi has been one of the most rewarding decisions I''ve made for my overall wellbeing. It has greatly improved my balance and flexibility. I feel more centered, my stress levels are lower and I''ve gained strength without strain.',
   20),

  ('Mark D', '8/10/23',
   'I had a bad bicycle accident resulting in a spinal cord injury four years ago. Then I tried Tai Chi. After two years of tai chi, my balance is much better, and I can now do most of the moves without falling or losing my balance.',
   30),

  ('Leslie C', '4/6/22',
   'My name is Leslie and I want to tell you that the practice of Tai Chi has allowed me to discontinue my blood pressure medication. Not only that but it has also improved my balance and provided me with a calming, meditative space to breathe.',
   40),

  ('Cathy P', '2024',
   'The Woodlands Tai Chi group is amazing! What has so impressed me is that it is led by a dedicated team of volunteer instructors under the direction of Sifu Sesco, and it is completely free of charge to the community.',
   50),

  ('Lise H', '2/2/23',
   'Joining the Woodlands Tai Chi group over two years ago was one of the best decisions my husband and I have ever made. Not only has it helped maintain the physical balance control needed as you age but another benefit that is not as often mentioned is the emotional balance.',
   60),

  ('Mickey C', 'member 2021',
   'My name is Mickey, I started with Woodlands Tai Chi in my late 70s. The first two attempts didn''t stick with me, but on my 3rd attempt, I was successful, and I''ve been at it for about 4 years now.',
   70),

  ('Laurie A', 'member 2015',
   'Tai chi is subtle — one doesn''t even realize how the slow movement builds strength, develops my balance and keeps my brain (fairly) sharp. The best part is the friendships that one develops.',
   80),

  ('Colleen W', 'retired nurse',
   'I find myself practicing at home randomly whenever I''m bored or have a few minutes between doing other tasks. I have gotten stronger and my balance has improved quite a bit.',
   90),

  ('Vincent B', '4/2/22',
   'Tai Chi is great. It grants me ancient, mystical powers — specifically, the ability to gracefully overpower unsuspecting old people… in slow motion.',
   100),

  ('Marissa O', null,
   'It is a different way of moving our body, slower, not the usual gym exercises but our bodies are gaining flexibility, strength as well as balance. The teachers are incredibly patient and helpful.',
   110),

  ('Jen R', null,
   'What I found was literally a welcoming circle. The instructors are all volunteers, and the time, care, and presence they offer, especially Sesco and Zai, is extraordinary.',
   120),

  ('Helen G', null,
   'Since October, I have had the blessing of beginning my journey in Tai Chi, and today I want to express my deepest gratitude to all the teachers. Thank you for your guidance, patience, dedication, and the beautiful energy you share in every class.',
   130),

  ('Janice W', 'member since 2/2/23',
   'I have been a Tai Chi enthusiast and practitioner for 3 years. It is not hyperbole to say that it has been a great 3 years for helping to maintain my physical health and well-being. Practicing Tai Chi has improved my balance and my flexibility.',
   140),

  ('Kala G', '5/2/23',
   'I joined this Tai Chi class two years ago, and it has been one of the most enriching commitments I''ve made. The sessions are completely free, yet they are run with the kind of professionalism and care you would expect from a top-tier program.',
   150);

-- News posts migrated from /news/ on the legacy site (April 2026).
insert into public.news_posts (title, slug, body, posted_at, display_order) values
  ('World Tai Chi Day 2026',
   'world-tai-chi-day-2026',
   'Mark your calendar — **April 25, 2026** at **North Shore Park**, The Woodlands. Open to the public. Bring water and a soft pair of shoes.',
   '2026-04-01', 10),

  ('Schedule change — Intermediate & Advanced',
   'schedule-change-intermediate',
   'Friday evening intermediate class is cancelled. New time: **Wednesday evenings 6:15 pm at TWMC**.',
   '2026-04-25', 20),

  ('Venue change — May to July 2026',
   'venue-change-may-july-2026',
   'Friday classes on May 8, June 5, July 3, and July 31 will meet at **KBCC** instead of TWMC. Wednesday classes on June 3, July 1, July 8, and July 29 — venue to be announced.',
   '2026-04-26', 30),

  ('Bring your own water — now mandatory',
   'mandatory-water',
   'It is now mandatory you bring portable water to class. You will not be permitted to leave the dojo during class to fetch water.',
   '2026-03-15', 40),

  ('Fuego Shoes — 10% member discount',
   'fuego-shoes-discount',
   'Effective immediately, Fuego Shoes will give Woodlands Tai Chi members a **10% discount**. Use code **WOODLANDSTAICHI10** at checkout, or [follow the affiliate link](https://fuegodance.com/discount/WOODLANDSTAICHI10).',
   '2026-02-10', 50);
