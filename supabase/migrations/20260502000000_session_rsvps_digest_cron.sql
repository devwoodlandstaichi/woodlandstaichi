-- EOD RSVP digest scheduling. pg_cron fires once a day at 22:00 UTC,
-- which is 5 PM America/Chicago during CDT (summer) and 4 PM during
-- CST (winter). Calls the eod-rsvp-digest Edge Function via pg_net.
--
-- Required Vault secrets (managed in Studio → Database → Vault):
--   - eod_digest_url:    full https URL of the deployed function
--   - eod_digest_token:  matches WTC_DIGEST_AUTH_TOKEN secret on the function
--
-- Deploy the function first, then set the Vault secrets, then this
-- migration just creates the cron entry. If you skip the secrets, the
-- cron job will fire and silently 401 from the function — harmless but
-- wasted invocations.
--
-- One-time setup (admin SQL via Studio):
--   select vault.create_secret('https://<project-ref>.functions.supabase.co/eod-rsvp-digest', 'eod_digest_url');
--   select vault.create_secret('<random-shared-token>', 'eod_digest_token');

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Helper that pg_cron will invoke. Reads the function URL + auth token
-- from Vault and POSTs to the Edge Function. Wrapped so the cron
-- expression stays simple.
create or replace function public.send_eod_rsvp_digest()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  digest_url text;
  digest_token text;
begin
  select decrypted_secret into digest_url
  from vault.decrypted_secrets where name = 'eod_digest_url';
  select decrypted_secret into digest_token
  from vault.decrypted_secrets where name = 'eod_digest_token';

  if digest_url is null or digest_token is null then
    raise notice 'eod_digest_url or eod_digest_token vault secret missing — skipping';
    return;
  end if;

  perform net.http_post(
    url := digest_url,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || digest_token
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- Idempotent schedule. Unschedule any prior entry with the same name
-- before creating, so re-running this migration on a dev DB is safe.
do $$
declare
  job_id bigint;
begin
  select jobid into job_id from cron.job where jobname = 'eod-rsvp-digest';
  if job_id is not null then
    perform cron.unschedule(job_id);
  end if;
  perform cron.schedule(
    'eod-rsvp-digest',
    '0 22 * * *',
    $cron$select public.send_eod_rsvp_digest();$cron$
  );
end $$;
