-- V2 : partage public + recommandations client
-- À exécuter dans Supabase SQL Editor après 0002_status.sql

alter table public.missions
  add column if not exists share_token uuid unique,
  add column if not exists recommendations text;

create index if not exists missions_share_token_idx
  on public.missions(share_token)
  where share_token is not null;

-- ============================================================================
-- RPC publique : lecture d'une mission via son share_token
-- ============================================================================
-- Cette fonction est SECURITY DEFINER : elle bypass la RLS pour ne renvoyer
-- QUE la ligne dont le token matche, sans permettre l'énumération.
create or replace function public.get_shared_mission(p_token uuid)
returns missions
language sql
security definer
set search_path = public
as $$
  select * from public.missions where share_token = p_token limit 1;
$$;

grant execute on function public.get_shared_mission(uuid) to anon, authenticated;

-- ============================================================================
-- RPC publique : soumettre des recommandations client
-- ============================================================================
-- Le client peut écrire dans le champ recommendations sans avoir de compte.
-- Limité à 10 000 caractères pour éviter l'abus.
create or replace function public.submit_shared_recommendations(
  p_token uuid,
  p_recommendations text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recommendations is null then
    raise exception 'recommendations cannot be null';
  end if;
  if length(p_recommendations) > 10000 then
    raise exception 'recommendations too long (max 10000 chars)';
  end if;
  update public.missions
    set recommendations = p_recommendations,
        updated_at = now()
    where share_token = p_token;
  if not found then
    raise exception 'invalid share token';
  end if;
end;
$$;

grant execute on function public.submit_shared_recommendations(uuid, text) to anon, authenticated;
