-- Croquette & Macadam — migration gestion des comptes
-- À exécuter UNE FOIS dans Supabase > SQL Editor.
-- Ne supprime aucune donnée existante.

alter table public.profiles
  add column if not exists is_active boolean not null default true;
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

create or replace function public.my_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles
  where id = auth.uid() and is_active = true
$$;

-- Les comptes désactivés ne peuvent plus consulter ni gérer l'espace connecté.
drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select to authenticated using (public.my_role() is not null);

drop policy if exists regs_read on public.registrations;
create policy regs_read on public.registrations
  for select to authenticated using (public.my_role() is not null);

drop policy if exists regs_insert on public.registrations;
create policy regs_insert on public.registrations
  for insert to authenticated with check (user_id = auth.uid() and public.my_role() is not null);

drop policy if exists regs_update on public.registrations;
create policy regs_update on public.registrations
  for update to authenticated using (user_id = auth.uid() and public.my_role() is not null)
  with check (user_id = auth.uid() and public.my_role() is not null);

drop policy if exists regs_delete on public.registrations;
create policy regs_delete on public.registrations
  for delete to authenticated using (public.my_role() is not null and (user_id = auth.uid() or public.my_role() = 'admin'));

drop policy if exists maraudes_read on public.maraudes;
create policy maraudes_read on public.maraudes
  for select to anon, authenticated using (auth.role() = 'anon' or public.my_role() is not null);

-- La policy fiches_read existante utilise déjà my_role() et bloque donc les comptes désactivés.
