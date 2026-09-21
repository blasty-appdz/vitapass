-- VitaPass : socle admin sécurisé, données médecins privées, réservation fiable, accès médecins vérifiés.
-- Aucune donnée n'est supprimée (les e-mails et jetons sont déplacés vers une table privée).

-- ============ 1. Rôle administrateur : fonctions de contrôle ============
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $f$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
$f$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.is_validated_doctor(p_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $f$
  select exists (select 1 from public.profiles p where p.id = p_id and p.role = 'doctor' and coalesce(p.validated, false))
$f$;
revoke execute on function public.is_validated_doctor(uuid) from public, anon;
grant execute on function public.is_validated_doctor(uuid) to authenticated;

-- ============ 2. Actions d'administration (réservées au rôle admin, sans ouvrir les tables) ============
create or replace function public.admin_list_users()
returns table (id uuid, fname text, lname text, role text, wilaya text, created_at timestamptz, validated boolean, numero_ordre text)
language plpgsql stable security definer set search_path = ''
as $f$
begin
  if not public.is_admin() then raise exception 'Accès réservé aux administrateurs' using errcode = '42501'; end if;
  return query select p.id, p.fname, p.lname, p.role, p.wilaya, p.created_at, p.validated, p.numero_ordre
    from public.profiles p order by p.created_at desc;
end
$f$;

create or replace function public.admin_pending_doctors()
returns table (id uuid, fname text, lname text, wilaya text, numero_ordre text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $f$
begin
  if not public.is_admin() then raise exception 'Accès réservé aux administrateurs' using errcode = '42501'; end if;
  return query select p.id, p.fname, p.lname, p.wilaya, p.numero_ordre, p.created_at
    from public.profiles p where p.role = 'doctor' and coalesce(p.validated, false) = false order by p.created_at;
end
$f$;

create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = ''
as $f$
begin
  if not public.is_admin() then raise exception 'Accès réservé aux administrateurs' using errcode = '42501'; end if;
  return jsonb_build_object(
    'patients', (select count(*) from public.profiles where role = 'patient'),
    'medecins', (select count(*) from public.profiles where role = 'doctor'),
    'dossiers', (select count(*) from public.dossiers),
    'documents', (select count(*) from public.documents));
end
$f$;

create or replace function public.admin_set_doctor_validated(p_id uuid, p_valid boolean)
returns void language plpgsql security definer set search_path = ''
as $f$
begin
  if not public.is_admin() then raise exception 'Accès réservé aux administrateurs' using errcode = '42501'; end if;
  update public.profiles set validated = p_valid where id = p_id and role = 'doctor';
  if not found then raise exception 'Médecin introuvable'; end if;
end
$f$;

create or replace function public.admin_reject_doctor(p_id uuid)
returns void language plpgsql security definer set search_path = ''
as $f$
begin
  if not public.is_admin() then raise exception 'Accès réservé aux administrateurs' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where id = p_id and role = 'doctor' and coalesce(validated, false) = false) then
    raise exception 'Seul un médecin non validé peut être rejeté';
  end if;
  delete from public.profiles where id = p_id;
  delete from auth.users where id = p_id;
end
$f$;

revoke execute on function public.admin_list_users(), public.admin_pending_doctors(), public.admin_stats(),
  public.admin_set_doctor_validated(uuid, boolean), public.admin_reject_doctor(uuid) from public, anon;
grant execute on function public.admin_list_users(), public.admin_pending_doctors(), public.admin_stats(),
  public.admin_set_doctor_validated(uuid, boolean), public.admin_reject_doctor(uuid) to authenticated;

-- ============ 3. Une seule validation : profil -> annuaire ============
create or replace function public.sync_professional_validation()
returns trigger language plpgsql security definer set search_path = ''
as $f$
begin
  if new.role = 'doctor' and new.validated is distinct from old.validated then
    update public.professionals set validated = coalesce(new.validated, false), updated_at = now() where id = new.id;
  end if;
  return new;
end
$f$;
revoke execute on function public.sync_professional_validation() from public, anon, authenticated;
create trigger sync_professional_validation
  after update of validated on public.profiles
  for each row execute function public.sync_professional_validation();

-- ============ 4. E-mail et jetons Google des médecins : table privée ============
create table if not exists public.professional_private (
  id uuid primary key references public.professionals(id) on delete cascade,
  email text,
  google_calendar_id text,
  google_refresh_token text
);
alter table public.professional_private enable row level security;
revoke all on public.professional_private from anon, authenticated;
comment on table public.professional_private is 'Données privées des médecins : aucune règle RLS volontairement, seul le service_role y accède.';

insert into public.professional_private (id, email, google_calendar_id, google_refresh_token)
  select id, email, google_calendar_id, google_refresh_token from public.professionals
  on conflict (id) do nothing;
alter table public.professionals drop column email, drop column google_calendar_id, drop column google_refresh_token;

create or replace function public.handle_new_professional()
returns trigger language plpgsql security definer set search_path = ''
as $f$
begin
  if new.raw_user_meta_data->>'role' = 'doctor' then
    insert into public.professionals (id, validated, is_available, created_at, updated_at)
      values (new.id, false, false, now(), now()) on conflict (id) do nothing;
    insert into public.professional_private (id, email)
      values (new.id, new.email) on conflict (id) do nothing;
  end if;
  return new;
exception when others then
  return new;
end
$f$;

-- ============ 5. Les médecins non validés ne peuvent pas recevoir l'accès à un dossier ============
create or replace function public.find_doctor_by_email(p_email text)
returns table (id uuid, fname text, lname text, gender text, specialite text, numero_ordre text, role text)
language plpgsql security definer set search_path = ''
as $f$
begin
  return query
  select p.id, p.fname, p.lname, p.gender, p.specialite, p.numero_ordre, p.role
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(p_email) and p.role = 'doctor' and coalesce(p.validated, false);
end
$f$;

drop policy if exists "da_patient_insert" on public.doctor_access;
create policy "da_patient_insert" on public.doctor_access
  for insert to authenticated
  with check ((select auth.uid()) = patient_id and public.is_validated_doctor(doctor_id));

-- ============ 6. Réservation fiable : créneau réservé côté base, pas de double réservation ============
create or replace function public.appointments_book_slot()
returns trigger language plpgsql security definer set search_path = ''
as $f$
begin
  if new.slot_id is null then return new; end if;
  if (select auth.uid()) is not null
     and not exists (select 1 from public.professionals where id = new.professional_id and coalesce(validated, false)) then
    raise exception 'Professionnel non validé' using errcode = '42501';
  end if;
  update public.availability_slots set is_booked = true
    where id = new.slot_id and professional_id = new.professional_id and is_booked = false;
  if not found then raise exception 'Créneau indisponible' using errcode = '23505'; end if;
  return new;
end
$f$;
revoke execute on function public.appointments_book_slot() from public, anon, authenticated;
create trigger appointments_book_slot before insert on public.appointments
  for each row execute function public.appointments_book_slot();

create or replace function public.appointments_release_slot()
returns trigger language plpgsql security definer set search_path = ''
as $f$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' and new.slot_id is not null then
    update public.availability_slots set is_booked = false where id = new.slot_id;
  end if;
  return new;
end
$f$;
revoke execute on function public.appointments_release_slot() from public, anon, authenticated;
create trigger appointments_release_slot after update of status on public.appointments
  for each row execute function public.appointments_release_slot();

-- ============ 7. Documents : un médecin avec accès actif peut ouvrir les fichiers du patient ============
create policy "read_patient_docs_as_doctor" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and exists (
      select 1 from public.doctor_access da
      where da.doctor_id = (select auth.uid())
        and da.status = 'active'
        and da.patient_id::text = (storage.foldername(name))[1]
    )
  );

-- ============ 8. Règles en double supprimées (déjà couvertes par une règle plus large) ============
drop policy if exists "slots_pro_write" on public.availability_slots;
drop policy if exists "Pro can update own profile" on public.professionals;
drop policy if exists "Voir son profil" on public.profiles;
drop policy if exists "Voir son dossier" on public.dossiers;
drop policy if exists "Patient peut modifier urgence_public" on public.dossiers;
drop policy if exists "Patient update urgence_public" on public.dossiers;
drop policy if exists "Médecin peut lire ses RDVs" on public.rdvs;
