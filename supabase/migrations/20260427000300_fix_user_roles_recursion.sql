-- Fix: the original "admins manage roles" policy on public.user_roles
-- contained an inline `exists (select ... from public.user_roles ...)`
-- subquery. Because that subquery is itself subject to RLS, evaluating
-- the policy re-invokes the same policy, producing
-- "infinite recursion detected in policy for relation user_roles" on
-- every SELECT against the table.
--
-- Move the admin check into a security-definer function (same pattern as
-- is_admin_or_instructor) so the inner read bypasses RLS.

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = uid and role = 'admin'
  );
$$;

drop policy if exists "admins manage roles" on public.user_roles;

create policy "admins manage roles"
  on public.user_roles for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
