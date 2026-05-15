create table if not exists public.cloud_cert_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  progress jsonb not null default '{}'::jsonb,
  points integer not null default 0 check (points >= 0),
  certificate_issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cloud_cert_profiles enable row level security;

create policy "cloud_cert_profiles_select_own"
  on public.cloud_cert_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "cloud_cert_profiles_insert_own"
  on public.cloud_cert_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "cloud_cert_profiles_update_own"
  on public.cloud_cert_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.set_cloud_cert_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_cloud_cert_profiles_updated_at on public.cloud_cert_profiles;

create trigger set_cloud_cert_profiles_updated_at
  before update on public.cloud_cert_profiles
  for each row
  execute function public.set_cloud_cert_updated_at();
