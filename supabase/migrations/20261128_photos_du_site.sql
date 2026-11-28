-- Croquette & Macadam — photos du site modifiables depuis l'espace Gestion
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor > New query.
-- Prérequis : les migrations précédentes (fonction my_role() et bucket "site-media").
-- Chaque ligne = une photo du site (src = chemin d'origine dans content.js) remplacée par une autre adresse.

create table if not exists public.site_photos (
  src text primary key,
  url text not null check (url ~ '^(https://|data:image/)'),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.site_photos enable row level security;

drop policy if exists site_photos_public_read on public.site_photos;
create policy site_photos_public_read on public.site_photos
  for select to anon, authenticated using (true);

drop policy if exists site_photos_manager_insert on public.site_photos;
create policy site_photos_manager_insert on public.site_photos
  for insert to authenticated
  with check (public.my_role() in ('president','admin','photographe'));

drop policy if exists site_photos_manager_update on public.site_photos;
create policy site_photos_manager_update on public.site_photos
  for update to authenticated
  using (public.my_role() in ('president','admin','photographe'))
  with check (public.my_role() in ('president','admin','photographe'));

drop policy if exists site_photos_manager_delete on public.site_photos;
create policy site_photos_manager_delete on public.site_photos
  for delete to authenticated
  using (public.my_role() in ('president','admin','photographe'));

grant select on public.site_photos to anon, authenticated;
grant insert, update, delete on public.site_photos to authenticated;
