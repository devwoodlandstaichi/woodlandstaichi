-- Sex (m/f) collected on the registration form. Nullable so existing
-- rows and the returning form (which doesn't ask) stay valid.
create type member_sex as enum ('male', 'female');

alter table public.members
  add column sex member_sex;
