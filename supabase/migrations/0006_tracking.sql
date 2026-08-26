-- V3 : tracking temporel + type de pack
-- À exécuter dans Supabase SQL Editor après 0005_validations.sql

alter table public.missions
  add column if not exists start_date date,
  add column if not exists delivery_date date,
  add column if not exists pack_type text;
