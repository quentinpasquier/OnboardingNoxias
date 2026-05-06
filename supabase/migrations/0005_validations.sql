-- V2.2 : validation par bloc côté commercial + statut visible côté client
-- À exécuter dans Supabase SQL Editor après 0004_comments_and_shared_files.sql

alter table public.missions
  add column if not exists validations jsonb not null default '{}'::jsonb;
