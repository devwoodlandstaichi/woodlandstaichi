-- Generic key/value app settings table.
--
-- First use case: kiosk_pin_hash. Future uses might include
-- 'attendance_grace_minutes', 'wtcd_event_date', etc — anything that's
-- one-row, admin-editable, and doesn't deserve its own column.

create table public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid references auth.users(id) on delete set null
);

alter table public.app_settings enable row level security;

-- Staff (admin + instructor) can read settings — the kiosk PIN verify
-- flow runs as a server action under a staff session.
create policy "staff read settings"
  on public.app_settings for select
  using (public.is_admin_or_instructor(auth.uid()));

-- Only admins can write settings.
create policy "admins manage settings"
  on public.app_settings for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create trigger set_updated_at_app_settings before update on public.app_settings
  for each row execute function public.set_updated_at();
