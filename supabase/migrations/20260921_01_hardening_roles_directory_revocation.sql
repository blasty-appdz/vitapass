-- VitaPass : durcissement de sécurité (5 corrections). Aucune donnée n'est modifiée ni supprimée.
-- Sans changement du code de l'application : les requêtes actuelles du front continuent de fonctionner.

-- 1. Un compte ne peut plus se donner un rôle ni une validation depuis l'API.
--    (Les changements faits depuis le tableau de bord Supabase ou avec la clé service_role restent possibles.)
create or replace function public.protect_privileged_columns()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_table_name = 'profiles' then
      if tg_op = 'INSERT' then
        if coalesce(new.role, 'patient') not in ('patient', 'doctor') or coalesce(new.validated, false) then
          raise exception 'Rôle et validation non modifiables' using errcode = '42501';
        end if;
      elsif new.role is distinct from old.role or new.validated is distinct from old.validated then
        raise exception 'Rôle et validation non modifiables' using errcode = '42501';
      end if;
    elsif tg_table_name = 'professionals' then
      if tg_op = 'INSERT' then
        if coalesce(new.validated, false) then
          raise exception 'Rôle et validation non modifiables' using errcode = '42501';
        end if;
      elsif new.validated is distinct from old.validated then
        raise exception 'Rôle et validation non modifiables' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end
$fn$;
revoke execute on function public.protect_privileged_columns() from public, anon, authenticated;

create trigger protect_profiles
  before insert or update on public.profiles
  for each row execute function public.protect_privileged_columns();
create trigger protect_professionals
  before insert or update on public.professionals
  for each row execute function public.protect_privileged_columns();

-- 2. L'inscription ne peut plus créer un compte « admin » : seuls patient et doctor sont acceptés depuis le formulaire.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into public.profiles (id, role, fname, lname)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' = 'doctor' then 'doctor' else 'patient' end,
    coalesce(new.raw_user_meta_data->>'fname', ''),
    coalesce(new.raw_user_meta_data->>'lname', '')
  ) on conflict (id) do nothing;

  insert into public.dossiers (patient_id, meds, allergies, antecedents, vaccins, glyc, bp, weight, family)
  values (new.id, '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]')
  on conflict do nothing;

  return new;
exception when others then
  return new;
end
$fn$;

-- 3. L'annuaire public ne montre plus les professionnels non validés (e-mail et téléphone compris).
--    Reste en place : « Read professionals » (sa propre ligne, ou les professionnels validés).
drop policy if exists "pros_public_read" on public.professionals;

-- 4. Les créneaux déjà réservés ne sont plus lisibles publiquement.
--    Reste en place : « Public can read available slots » (créneaux libres) et la gestion par leur propriétaire.
drop policy if exists "slots_public_read" on public.availability_slots;

-- 5. Retirer l'accès d'un médecin le retire vraiment : on supprime les anciennes règles qui ignoraient le statut.
--    Restent en place : dossiers_select_doctor et documents_select_doctor (statut « active » exigé).
drop policy if exists "Médecin peut lire dossier si accès accordé" on public.dossiers;
drop policy if exists "Médecin voir dossier autorisé" on public.dossiers;
drop policy if exists "Médecin peut lire documents si accès accordé" on public.documents;
drop policy if exists "Médecin voir documents" on public.documents;
drop policy if exists "Médecin peut ajouter note si accès accordé" on public.documents;
create policy "documents_insert_doctor" on public.documents
  for insert to authenticated
  with check (exists (
    select 1 from public.doctor_access da
    where da.doctor_id = (select auth.uid())
      and da.patient_id = documents.patient_id
      and da.status = 'active'
  ));
