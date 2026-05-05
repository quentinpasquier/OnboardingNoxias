-- Migration 0003 — Profil utilisateur (display_name + avatar)
-- À exécuter dans Supabase SQL Editor.

-- ============================================================================
-- Table profiles : 1 ligne par utilisateur auth.
-- L'id est lié à auth.users(id). Auto-créée à la première édition.
-- ============================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql security definer set search_path = public as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

-- Tous les utilisateurs auth peuvent LIRE tous les profils (workspace partagé Noxias)
drop policy if exists "auth_read_all_profiles" on public.profiles;
create policy "auth_read_all_profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Chacun n'écrit que son propre profil (insert + update)
drop policy if exists "auth_upsert_own_profile" on public.profiles;
create policy "auth_upsert_own_profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "auth_update_own_profile" on public.profiles;
create policy "auth_update_own_profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================================
-- Storage bucket "avatars" : public en lecture, écriture par l'owner
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Lecture publique (les avatars sont visibles partout dans l'app)
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Upload : authentifié, fichier dans un dossier portant son uid (path = "<uid>/...")
drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update / replace : authentifié, propriétaire du dossier
drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Suppression : authentifié, propriétaire du dossier
drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
