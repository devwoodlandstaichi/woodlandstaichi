-- Track explicit admin denials on registrations.
--
-- Until now there was no way for an admin to record "we decided not to
-- enroll this person" — the only available actions on the queue marked
-- payment status. Deletion was the de-facto rejection, which threw away
-- the audit trail.
--
-- Schema:
--   denied_at       — null = not denied. Setting = decision moment.
--   denial_reason   — optional free-text shown to the member in the email.
--
-- We don't add a new payment_status enum value because the financial
-- flow (paid/waived/pending/refunded) is orthogonal to the admin
-- decision flow (approved-implicit / denied). Keeping them separate
-- means a denied registration with a refund is representable, and the
-- existing payment filter pages keep working untouched.

alter table public.registrations
  add column denied_at timestamptz,
  add column denial_reason text;

create index registrations_denied_at_idx
  on public.registrations (denied_at)
  where denied_at is not null;
