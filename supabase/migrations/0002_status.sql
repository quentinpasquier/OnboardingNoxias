-- Migration 0002 — Statut de mission (en cours / terminé)
-- À exécuter dans Supabase SQL Editor après 0001_init.sql.

alter table public.missions
  add column if not exists status text not null default 'in_progress'
  check (status in ('in_progress', 'completed'));

create index if not exists missions_status_idx on public.missions (status);
