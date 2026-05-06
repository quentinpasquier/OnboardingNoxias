-- V2.1 : commentaires Google-Docs-like + gestion de fichiers côté client public
-- À exécuter dans Supabase SQL Editor après 0003_share.sql

create extension if not exists "uuid-ossp";

-- ============================================================================
-- Table mission_comments
-- ============================================================================
create table if not exists public.mission_comments (
  id              uuid primary key default uuid_generate_v4(),
  mission_id      uuid references public.missions(id) on delete cascade not null,
  anchor_type     text not null,
  anchor_id       text,
  author_name     text not null,
  author_role     text not null check (author_role in ('client', 'admin')),
  body            text not null,
  resolved        boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists mission_comments_mission_idx on public.mission_comments(mission_id);
create index if not exists mission_comments_anchor_idx on public.mission_comments(mission_id, anchor_type, anchor_id);

alter table public.mission_comments enable row level security;

drop policy if exists "auth_read_comments" on public.mission_comments;
create policy "auth_read_comments" on public.mission_comments
  for select to authenticated using (true);

drop policy if exists "auth_insert_comments" on public.mission_comments;
create policy "auth_insert_comments" on public.mission_comments
  for insert to authenticated with check (true);

drop policy if exists "auth_update_comments" on public.mission_comments;
create policy "auth_update_comments" on public.mission_comments
  for update to authenticated using (true) with check (true);

drop policy if exists "auth_delete_comments" on public.mission_comments;
create policy "auth_delete_comments" on public.mission_comments
  for delete to authenticated using (true);

-- ============================================================================
-- RPC publiques (accès via share_token)
-- ============================================================================
create or replace function public.list_shared_comments(p_token uuid)
returns setof mission_comments
language sql security definer set search_path = public
as $$
  select c.* from public.mission_comments c
  join public.missions m on m.id = c.mission_id
  where m.share_token = p_token
  order by c.created_at asc;
$$;

create or replace function public.add_shared_comment(
  p_token uuid,
  p_anchor_type text,
  p_anchor_id text,
  p_author_name text,
  p_body text
) returns mission_comments
language plpgsql security definer set search_path = public
as $$
declare
  v_mission_id uuid;
  v_row mission_comments;
begin
  select id into v_mission_id from public.missions where share_token = p_token;
  if v_mission_id is null then raise exception 'invalid share token'; end if;
  if length(coalesce(p_body, '')) = 0 then raise exception 'empty body'; end if;
  if length(p_body) > 5000 then raise exception 'body too long (max 5000)'; end if;
  if length(coalesce(p_author_name, '')) = 0 then raise exception 'empty name'; end if;
  if length(p_author_name) > 100 then raise exception 'name too long (max 100)'; end if;

  insert into public.mission_comments
    (mission_id, anchor_type, anchor_id, author_name, author_role, body)
    values (v_mission_id, p_anchor_type, p_anchor_id, p_author_name, 'client', p_body)
    returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.resolve_shared_comment(
  p_token uuid,
  p_comment_id uuid,
  p_resolved boolean
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.mission_comments c
  set resolved = p_resolved
  from public.missions m
  where c.mission_id = m.id and m.share_token = p_token and c.id = p_comment_id;
  if not found then raise exception 'invalid token or comment'; end if;
end;
$$;

create or replace function public.delete_shared_comment(
  p_token uuid,
  p_comment_id uuid
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.mission_comments c
  using public.missions m
  where c.mission_id = m.id and m.share_token = p_token and c.id = p_comment_id;
  if not found then raise exception 'invalid token or comment'; end if;
end;
$$;

-- ============================================================================
-- Gestion de fichiers via share_token
-- ============================================================================
create or replace function public.add_shared_file(
  p_token uuid,
  p_name text,
  p_excerpt text
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_new_file jsonb;
begin
  if length(coalesce(p_name, '')) = 0 then raise exception 'empty name'; end if;
  if length(p_name) > 500 then raise exception 'name too long'; end if;
  if length(coalesce(p_excerpt, '')) > 500000 then raise exception 'excerpt too long'; end if;

  v_new_file := jsonb_build_object(
    'id', uuid_generate_v4()::text,
    'name', p_name,
    'excerpt', coalesce(p_excerpt, ''),
    'addedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'addedBy', 'client'
  );

  update public.missions
    set files = coalesce(files, '[]'::jsonb) || v_new_file,
        updated_at = now()
    where share_token = p_token;
  if not found then raise exception 'invalid share token'; end if;
end;
$$;

create or replace function public.remove_shared_file(
  p_token uuid,
  p_file_id text
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.missions
    set files = (
      select coalesce(jsonb_agg(f), '[]'::jsonb)
      from jsonb_array_elements(files) f
      where f->>'id' is distinct from p_file_id
    ),
    updated_at = now()
    where share_token = p_token;
  if not found then raise exception 'invalid share token'; end if;
end;
$$;

grant execute on function public.list_shared_comments(uuid) to anon, authenticated;
grant execute on function public.add_shared_comment(uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.resolve_shared_comment(uuid, uuid, boolean) to anon, authenticated;
grant execute on function public.delete_shared_comment(uuid, uuid) to anon, authenticated;
grant execute on function public.add_shared_file(uuid, text, text) to anon, authenticated;
grant execute on function public.remove_shared_file(uuid, text) to anon, authenticated;
