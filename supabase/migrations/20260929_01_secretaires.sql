-- VitaPass : secrétaires médicales (2026-09-29). Aucune donnée supprimée.
-- Principe :
--   * Une secrétaire crée son compte VitaPass (rôle « secretary »).
--   * Le médecin l'ajoute à son cabinet avec son e-mail (doctor_secretaries).
--   * Le médecin choisit, dossier par dossier, ceux qu'elle peut consulter (secretary_patient_access).
--   * Accès en LECTURE SEULE. Il tombe automatiquement si :
--       - le médecin retire la secrétaire du cabinet,
--       - le médecin retire le dossier,
--       - le patient révoque l'accès du médecin,
--       - le médecin n'est plus validé.
--   * Le patient voit, dans « Mes médecins », quelles secrétaires ont accès à son dossier.

-- 1. Nouveau rôle
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role = any (array['patient', 'doctor', 'admin', 'secretary']));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $f$
begin
  insert into public.profiles (id, role, fname, lname)
  values (
    new.id,
    case new.raw_user_meta_data->>'role'
      when 'doctor' then 'doctor'
      when 'secretary' then 'secretary'
      else 'patient' end,
    coalesce(new.raw_user_meta_data->>'fname', ''),
    coalesce(new.raw_user_meta_data->>'lname', '')
  ) on conflict (id) do nothing;

  -- Pas de dossier médical créé pour un compte secrétaire
  if coalesce(new.raw_user_meta_data->>'role', '') <> 'secretary' then
    insert into public.dossiers (patient_id, meds, allergies, antecedents, vaccins, glyc, bp, weight, family)
    values (new.id, '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]')
    on conflict do nothing;
  end if;

  return new;
exception when others then
  return new;
end
$f$;

create or replace function public.protect_privileged_columns()
returns trigger language plpgsql set search_path = ''
as $f$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_table_name = 'profiles' then
      if tg_op = 'INSERT' then
        if coalesce(new.role, 'patient') not in ('patient', 'doctor', 'secretary') or coalesce(new.validated, false) then
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
$f$;

-- 2. Tables
create table if not exists public.doctor_secretaries (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  secretary_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (doctor_id, secretary_id)
);

create table if not exists public.secretary_patient_access (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  secretary_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (doctor_id, secretary_id, patient_id)
);
create index if not exists spa_secretary_patient_idx on public.secretary_patient_access (secretary_id, patient_id);
create index if not exists spa_patient_idx on public.secretary_patient_access (patient_id);
create index if not exists ds_secretary_idx on public.doctor_secretaries (secretary_id);

alter table public.doctor_secretaries enable row level security;
alter table public.secretary_patient_access enable row level security;

-- 3. Fonction centrale : la secrétaire connectée peut-elle lire ce dossier ?
create or replace function public.is_secretary_for(p_patient uuid)
returns boolean language sql stable security definer set search_path = ''
as $f$
  select exists (
    select 1
    from public.secretary_patient_access s
    join public.doctor_secretaries ds
      on ds.doctor_id = s.doctor_id and ds.secretary_id = s.secretary_id and ds.status = 'active'
    join public.doctor_access da
      on da.doctor_id = s.doctor_id and da.patient_id = s.patient_id and da.status = 'active'
    join public.profiles d
      on d.id = s.doctor_id and d.role = 'doctor' and coalesce(d.validated, false)
    where s.secretary_id = (select auth.uid())
      and s.patient_id = p_patient
  )
$f$;
revoke execute on function public.is_secretary_for(uuid) from public, anon;
grant execute on function public.is_secretary_for(uuid) to authenticated;

-- 4. Règles d'accès (RLS)
-- doctor_secretaries : le médecin voit/retire ses secrétaires ; la secrétaire voit ses cabinets.
drop policy if exists ds_select on public.doctor_secretaries;
create policy ds_select on public.doctor_secretaries for select to authenticated
  using ((select auth.uid()) = doctor_id or (select auth.uid()) = secretary_id);
drop policy if exists ds_doctor_update on public.doctor_secretaries;
create policy ds_doctor_update on public.doctor_secretaries for update to authenticated
  using ((select auth.uid()) = doctor_id)
  with check ((select auth.uid()) = doctor_id);
-- L'ajout passe uniquement par la fonction add_secretary_by_email (pas d'insert direct).

-- secretary_patient_access : le médecin gère ; la secrétaire et le patient consultent.
drop policy if exists spa_select on public.secretary_patient_access;
create policy spa_select on public.secretary_patient_access for select to authenticated
  using ((select auth.uid()) in (doctor_id, secretary_id, patient_id));
drop policy if exists spa_doctor_insert on public.secretary_patient_access;
create policy spa_doctor_insert on public.secretary_patient_access for insert to authenticated
  with check (
    (select auth.uid()) = doctor_id
    and public.is_validated_doctor(doctor_id)
    and exists (select 1 from public.doctor_secretaries ds
                where ds.doctor_id = secretary_patient_access.doctor_id
                  and ds.secretary_id = secretary_patient_access.secretary_id
                  and ds.status = 'active')
    and exists (select 1 from public.doctor_access da
                where da.doctor_id = secretary_patient_access.doctor_id
                  and da.patient_id = secretary_patient_access.patient_id
                  and da.status = 'active')
  );
drop policy if exists spa_doctor_delete on public.secretary_patient_access;
create policy spa_doctor_delete on public.secretary_patient_access for delete to authenticated
  using ((select auth.uid()) = doctor_id);

-- Lecture des dossiers par la secrétaire (lecture seule)
drop policy if exists profiles_select_secretary on public.profiles;
create policy profiles_select_secretary on public.profiles for select to authenticated
  using (public.is_secretary_for(id));
drop policy if exists dossiers_select_secretary on public.dossiers;
create policy dossiers_select_secretary on public.dossiers for select to authenticated
  using (public.is_secretary_for(patient_id));
drop policy if exists documents_select_secretary on public.documents;
create policy documents_select_secretary on public.documents for select to authenticated
  using (public.is_secretary_for(patient_id));
drop policy if exists read_patient_docs_as_secretary on storage.objects;
create policy read_patient_docs_as_secretary on storage.objects for select to authenticated
  using (bucket_id = 'documents' and exists (
    select 1 from public.secretary_patient_access s
    where s.secretary_id = (select auth.uid())
      and s.patient_id::text = (storage.foldername(objects.name))[1]
      and public.is_secretary_for(s.patient_id)));

-- Le médecin voit le nom de ses secrétaires ; la secrétaire voit le nom de ses médecins.
drop policy if exists profiles_select_cabinet on public.profiles;
create policy profiles_select_cabinet on public.profiles for select to authenticated
  using (exists (
    select 1 from public.doctor_secretaries ds
    where ds.status = 'active'
      and ((ds.doctor_id = (select auth.uid()) and ds.secretary_id = profiles.id)
        or (ds.secretary_id = (select auth.uid()) and ds.doctor_id = profiles.id))
  ));

-- 5. Fonctions appelées par l'application
-- Le médecin ajoute une secrétaire à partir de l'e-mail de son compte VitaPass.
create or replace function public.add_secretary_by_email(p_email text)
returns table (id uuid, fname text, lname text)
language plpgsql security definer set search_path = ''
as $f$
declare
  v_doc uuid := (select auth.uid());
  v_sec uuid;
begin
  if not public.is_validated_doctor(v_doc) then
    raise exception 'Réservé aux médecins validés' using errcode = '42501';
  end if;
  select p.id into v_sec
  from public.profiles p join auth.users u on u.id = p.id
  where lower(u.email) = lower(trim(p_email)) and p.role = 'secretary'
  limit 1;
  if v_sec is null then
    raise exception 'Aucun compte secrétaire VitaPass avec cet e-mail' using errcode = 'P0002';
  end if;
  insert into public.doctor_secretaries (doctor_id, secretary_id, status)
  values (v_doc, v_sec, 'active')
  on conflict (doctor_id, secretary_id) do update set status = 'active', revoked_at = null, created_at = now();
  return query select p.id, p.fname, p.lname from public.profiles p where p.id = v_sec;
end
$f$;
revoke execute on function public.add_secretary_by_email(text) from public, anon;
grant execute on function public.add_secretary_by_email(text) to authenticated;

-- Le médecin retire une secrétaire : elle perd immédiatement l'accès à tous les dossiers.
create or replace function public.remove_secretary(p_secretary uuid)
returns void language plpgsql security definer set search_path = ''
as $f$
declare v_doc uuid := (select auth.uid());
begin
  update public.doctor_secretaries set status = 'revoked', revoked_at = now()
    where doctor_id = v_doc and secretary_id = p_secretary;
  if not found then raise exception 'Secrétaire introuvable'; end if;
  delete from public.secretary_patient_access where doctor_id = v_doc and secretary_id = p_secretary;
end
$f$;
revoke execute on function public.remove_secretary(uuid) from public, anon;
grant execute on function public.remove_secretary(uuid) to authenticated;

-- Le patient voit quelles secrétaires (et de quel médecin) peuvent lire son dossier.
create or replace function public.patient_dossier_secretaries()
returns table (doctor_id uuid, secretary_id uuid, fname text, lname text)
language sql stable security definer set search_path = ''
as $f$
  select s.doctor_id, s.secretary_id, p.fname, p.lname
  from public.secretary_patient_access s
  join public.doctor_secretaries ds
    on ds.doctor_id = s.doctor_id and ds.secretary_id = s.secretary_id and ds.status = 'active'
  join public.doctor_access da
    on da.doctor_id = s.doctor_id and da.patient_id = s.patient_id and da.status = 'active'
  join public.profiles p on p.id = s.secretary_id
  where s.patient_id = (select auth.uid())
$f$;
revoke execute on function public.patient_dossier_secretaries() from public, anon;
grant execute on function public.patient_dossier_secretaries() to authenticated;

-- 6. Quand un patient révoque son médecin, on nettoie aussi les accès secrétaires liés.
create or replace function public.cleanup_secretary_access()
returns trigger language plpgsql security definer set search_path = ''
as $f$
begin
  if new.status = 'revoked' and old.status is distinct from 'revoked' then
    delete from public.secretary_patient_access
      where doctor_id = new.doctor_id and patient_id = new.patient_id;
  end if;
  return new;
end
$f$;
revoke execute on function public.cleanup_secretary_access() from public, anon, authenticated;
drop trigger if exists cleanup_secretary_access on public.doctor_access;
create trigger cleanup_secretary_access after update of status on public.doctor_access
  for each row execute function public.cleanup_secretary_access();
