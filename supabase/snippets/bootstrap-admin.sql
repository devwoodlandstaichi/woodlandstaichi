-- Bootstrap the first admin/instructor.
--
-- Phase 2 admin pages gate everything on `public.user_roles`. The seed file
-- can't insert into auth.users, so the first admin has to be promoted by hand
-- after they sign up. Workflow:
--
--   1. In the browser, go to http://127.0.0.1:54323 (Supabase Studio) and
--      create a user under Authentication → Users (or sign up via the app
--      once a /signup route exists). Note the email.
--
--   2. From the repo root, run this snippet against local Supabase:
--        psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" \
--          -v email="'you@example.com'" \
--          -v role="'admin'" \
--          -f supabase/snippets/bootstrap-admin.sql
--
--      Or paste it into Studio's SQL editor with `:email` and `:role`
--      replaced by literals.

insert into public.user_roles (user_id, role)
select id, :role::user_role
from auth.users
where email = :email
on conflict (user_id) do update set role = excluded.role;
