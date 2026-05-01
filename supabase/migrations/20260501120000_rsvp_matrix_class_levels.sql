-- Widen the default rsvp_level_matrix so members at every tier can
-- see "combined" and "play_only" sessions (mixed-level by design),
-- and beginners can see "remedial" (curriculum-supportive). Without
-- this, the matrix's "at-or-below" rule silently hides every
-- non-strict session class. Amends the column default and rewrites
-- the existing single app_settings row.

alter table public.app_settings
  alter column rsvp_level_matrix set default '{
    "instructor":   ["instructor", "advanced", "intermediate", "beginners", "remedial", "play_only", "combined"],
    "advanced":     ["advanced", "intermediate", "beginners", "play_only", "combined"],
    "intermediate": ["intermediate", "beginners", "play_only", "combined"],
    "beginners":    ["beginners", "remedial", "combined"]
  }'::jsonb;

update public.app_settings
set rsvp_level_matrix = '{
  "instructor":   ["instructor", "advanced", "intermediate", "beginners", "remedial", "play_only", "combined"],
  "advanced":     ["advanced", "intermediate", "beginners", "play_only", "combined"],
  "intermediate": ["intermediate", "beginners", "play_only", "combined"],
  "beginners":    ["beginners", "remedial", "combined"]
}'::jsonb;
