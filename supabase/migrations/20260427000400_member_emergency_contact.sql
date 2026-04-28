-- Add emergency contact columns to public.members.
--
-- The admin form (src/app/admin/members/member-form.tsx) and update
-- action (src/app/admin/members/actions.ts) already reference these
-- columns; without them, every Save changes silently failed with a
-- PostgREST "column not found" error. This migration also unblocks the
-- CSV import (toImport/migrate.py) which has emergency contact data
-- worth preserving.

alter table public.members
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_relationship text,
  add column if not exists emergency_phone text;
