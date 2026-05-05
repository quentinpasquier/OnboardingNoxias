-- Noxias Prospection Builder — schéma initial
-- Run via Supabase SQL Editor (Dashboard → SQL → New query → coller → Run)
-- ou via supabase CLI : supabase db push

create extension if not exists "uuid-ossp";

-- ============================================================================
-- Table missions
-- ============================================================================
create table public.missions (
  id              uuid primary key default uuid_generate_v4(),
  client_name     text not null,
  client_website  text,
  notes           text,
  files           jsonb not null default '[]'::jsonb,
  matrix          jsonb not null default '{}'::jsonb,
  matrix_status   jsonb not null default '{}'::jsonb,
  toolbox         jsonb,
  created_by      uuid references auth.users on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index missions_updated_at_idx on public.missions (updated_at desc);
create index missions_created_by_idx on public.missions (created_by);

-- updated_at auto
create or replace function public.set_updated_at() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists missions_set_updated_at on public.missions;
create trigger missions_set_updated_at
  before update on public.missions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security — workspace partagé entre tous les utilisateurs auth
-- ============================================================================
alter table public.missions enable row level security;

-- Tous les utilisateurs authentifiés peuvent lire toutes les missions
drop policy if exists "auth_read_all_missions" on public.missions;
create policy "auth_read_all_missions"
  on public.missions for select
  to authenticated
  using (true);

-- Insert : l'utilisateur authentifié devient created_by
drop policy if exists "auth_insert_missions" on public.missions;
create policy "auth_insert_missions"
  on public.missions for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Update : tout authentifié peut modifier (workspace partagé Noxias)
drop policy if exists "auth_update_missions" on public.missions;
create policy "auth_update_missions"
  on public.missions for update
  to authenticated
  using (true)
  with check (true);

-- Delete : tout authentifié peut supprimer (workspace partagé Noxias)
drop policy if exists "auth_delete_missions" on public.missions;
create policy "auth_delete_missions"
  on public.missions for delete
  to authenticated
  using (true);

-- ============================================================================
-- Table allowlist (optionnel) — restreindre les emails qui peuvent se connecter
-- ============================================================================
-- Pour activer : insérer une ligne par email autorisé.
-- L'auth hook (à configurer côté Supabase Auth) refusera les emails absents.
-- Plus simple : utiliser Supabase Auth → "Disable signups" et inviter les
-- utilisateurs un par un via le dashboard. Cette table est optionnelle.

create table if not exists public.email_allowlist (
  email text primary key,
  added_at timestamptz not null default now(),
  added_by uuid references auth.users
);

alter table public.email_allowlist enable row level security;

drop policy if exists "auth_read_allowlist" on public.email_allowlist;
create policy "auth_read_allowlist"
  on public.email_allowlist for select
  to authenticated
  using (true);
