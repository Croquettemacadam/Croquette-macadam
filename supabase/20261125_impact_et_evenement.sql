-- Croquette & Macadam — outils de gestion de l'impact et de l'événement mis en avant
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor > New query.
-- Cette migration ajoute deux tables et un bucket. Elle ne modifie pas les tables de comptes existantes.

create table if not exists public.impact_reports (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  maraudes_count integer not null default 1 check (maraudes_count >= 0),
  kibble_kg numeric(10,1) not null default 0 check (kibble_kg >= 0),
  leashes integer not null default 0 check (leashes >= 0),
  harnesses integer not null default 0 check (harnesses >= 0),
  toys integer not null default 0 check (toys >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists impact_reports_date_idx on public.impact_reports(date desc);
alter table public.impact_reports enable row level security;

drop policy if exists impact_reports_public_read on public.impact_reports;
create policy impact_reports_public_read on public.impact_reports
  for select to anon, authenticated using (true);

drop policy if exists impact_reports_manager_insert on public.impact_reports;
create policy impact_reports_manager_insert on public.impact_reports
  for insert to authenticated
  with check (public.my_role() in ('president','admin'));

drop policy if exists impact_reports_manager_update on public.impact_reports;
create policy impact_reports_manager_update on public.impact_reports
  for update to authenticated
  using (public.my_role() in ('president','admin'))
  with check (public.my_role() in ('president','admin'));

grant select on public.impact_reports to anon, authenticated;
grant insert, update on public.impact_reports to authenticated;

-- Un seul événement peut être publié à la fois : la clé id est toujours égale à 1.
create table if not exists public.featured_event (
  id smallint primary key default 1 check (id = 1),
  date date not null,
  title text not null,
  place text not null,
  description text not null default '',
  photo_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.featured_event enable row level security;

drop policy if exists featured_event_public_read on public.featured_event;
create policy featured_event_public_read on public.featured_event
  for select to anon, authenticated using (true);

drop policy if exists featured_event_manager_insert on public.featured_event;
create policy featured_event_manager_insert on public.featured_event
  for insert to authenticated
  with check (public.my_role() in ('president','admin','photographe'));

drop policy if exists featured_event_manager_update on public.featured_event;
create policy featured_event_manager_update on public.featured_event
  for update to authenticated
  using (public.my_role() in ('president','admin','photographe'))
  with check (public.my_role() in ('president','admin','photographe'));

grant select on public.featured_event to anon, authenticated;
grant insert, update on public.featured_event to authenticated;

-- Stockage public des photos de l'événement (lecture publique, écriture limitée aux rôles autorisés).
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

drop policy if exists cm_site_media_public_read on storage.objects;
create policy cm_site_media_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-media');

drop policy if exists cm_site_media_upload on storage.objects;
create policy cm_site_media_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-media' and public.my_role() in ('president','admin','photographe'));

drop policy if exists cm_site_media_update on storage.objects;
create policy cm_site_media_update on storage.objects
  for update to authenticated
  using (bucket_id = 'site-media' and public.my_role() in ('president','admin','photographe'))
  with check (bucket_id = 'site-media' and public.my_role() in ('president','admin','photographe'));
