-- Track the last time a member's QR was emailed to them. Used by the
-- bulk QR email action so we can re-send only to members who haven't
-- received their badge yet, without spamming the inbox of someone who
-- already has it.
--
-- The column is also stamped by the per-member "Email QR" action, so a
-- subsequent bulk-unsent run skips them automatically.

alter table public.members
  add column qr_emailed_at timestamptz;

-- Partial index for the "find anyone with a token but no email yet"
-- query path. Keeps the index tight: only members with a QR but no
-- delivery yet show up.
create index members_qr_unemailed_idx
  on public.members (qr_emailed_at)
  where qr_token is not null and qr_emailed_at is null;
