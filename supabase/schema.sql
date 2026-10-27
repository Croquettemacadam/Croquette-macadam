-- ===========================================================================
-- Croquette & Macadam : base de données Supabase
-- À coller dans Supabase > SQL Editor > New query > Run (une seule fois).
-- Les règles d'accès (RLS) sont appliquées par le SERVEUR : c'est ce qui protège
-- réellement les fiches, même si quelqu'un modifie le code du site dans son navigateur.
-- ===========================================================================

-- 1. Tables -----------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  role text not null default 'benevole'
    check (role in ('benevole','photographe','president','admin'))
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text,
  kind text not null default 'maraude' check (kind in ('maraude','evenement')),
  title text not null,
  place text,
  capacity int,
  description text,
  created_at timestamptz default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null,
  note text,
  unique (event_id, user_id)
);

create table public.maraudes (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text,
  text text,
  photos text[] not null default '{}',
  created_at timestamptz default now()
);

-- Fiches : données sensibles. Ne stocker que le strict nécessaire
-- (pas de lieu exact, pas de photo de personne, pas de données de santé de la personne).
create table public.fiches (
  id uuid primary key default gen_random_uuid(),
  personne text,
  animal text,
  espece text,
  besoins text,
  suivi_veto text,
  derniere_maraude date,
  secteur text,
  notes text,
  photo text,
  consentement boolean not null default false,
  updated_at timestamptz default now()
);

-- 2. Fonction : rôle de la personne connectée ---------------------------------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- 3. Règles d'accès (RLS) ---------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.events        enable row level security;
alter table public.registrations enable row level security;
alter table public.maraudes      enable row level security;
alter table public.fiches        enable row level security;

-- profiles : chacun lit sa propre ligne ; aucune écriture depuis le site
create policy profiles_read_own on public.profiles
  for select to authenticated using (id = auth.uid());

-- events : lecture pour tous les comptes connectés, écriture pour l'admin
create policy events_read on public.events
  for select to authenticated using (true);
create policy events_admin_write on public.events
  for all to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- registrations : chacun gère ses propres inscriptions (l'admin peut supprimer)
create policy regs_read on public.registrations
  for select to authenticated using (true);
create policy regs_insert on public.registrations
  for insert to authenticated with check (user_id = auth.uid());
create policy regs_update on public.registrations
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy regs_delete on public.registrations
  for delete to authenticated using (user_id = auth.uid() or public.my_role() = 'admin');

-- maraudes : lecture publique (page publique du site), écriture photographe + admin
create policy maraudes_read on public.maraudes
  for select to anon, authenticated using (true);
create policy maraudes_write on public.maraudes
  for all to authenticated
  using (public.my_role() in ('photographe','admin'))
  with check (public.my_role() in ('photographe','admin'));

-- fiches : lecture pour tous les comptes bénévoles (un profil existant), modification UNIQUEMENT par le président
create policy fiches_read on public.fiches
  for select to authenticated using (public.my_role() is not null);
create policy fiches_insert on public.fiches
  for insert to authenticated with check (public.my_role() = 'president');
create policy fiches_update on public.fiches
  for update to authenticated using (public.my_role() = 'president') with check (public.my_role() = 'president');
create policy fiches_delete on public.fiches
  for delete to authenticated using (public.my_role() = 'president');
-- Si la table fiches existe déjà, ajoute la colonne photo : alter table public.fiches add column if not exists photo text;
-- Si tu avais déjà exécuté une ancienne version de ce fichier (fiches réservées au président),
-- exécute d'abord : drop policy if exists fiches_president on public.fiches;
-- puis les 4 "create policy fiches_..." ci-dessus.

-- 4. Stockage des photos de maraudes -----------------------------------------
insert into storage.buckets (id, name, public)
values ('maraudes', 'maraudes', true)
on conflict (id) do nothing;

create policy photos_read on storage.objects
  for select using (bucket_id = 'maraudes');
create policy photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'maraudes' and public.my_role() in ('photographe','admin'));
create policy photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'maraudes' and public.my_role() in ('photographe','admin'));
create policy photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'maraudes' and public.my_role() in ('photographe','admin'));

-- 5. Créer les comptes (à répéter pour chaque personne) ------------------------
-- a) Supabase > Authentication > Users > Add user > Create new user
--      Email : identifiant@asso.local   (ex. admin@asso.local)
--      Password : le code de la personne (12 caractères ou plus pour l'admin et le président)
--      Cocher "Auto Confirm User"
-- b) Puis exécuter, en adaptant, pour lui donner un nom et un rôle :
--
-- insert into public.profiles (id, username, display_name, role)
-- select id, 'admin', 'Emerick', 'admin' from auth.users where email = 'admin@asso.local';
--
-- Rôles possibles : 'benevole', 'photographe', 'president', 'admin'
-- Le domaine "asso.local" doit correspondre à "fakeEmailDomain" dans js/config.js.
