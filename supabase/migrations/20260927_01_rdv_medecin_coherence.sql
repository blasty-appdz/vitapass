-- VitaPass : cohérence rendez-vous / espace médecin (2026-09-27). Aucune donnée supprimée.

-- 1. Le médecin voit le nom des patients qui ont pris RDV chez lui (sans ouvrir la table profiles).
create or replace function public.pro_appointment_patients()
returns table (id uuid, fname text, lname text, gender text, dob date)
language sql stable security definer set search_path = ''
as $f$
  select distinct p.id, p.fname, p.lname, p.gender, p.dob
  from public.appointments a
  join public.profiles p on p.id = a.patient_id
  where a.professional_id = (select auth.uid())
$f$;
revoke execute on function public.pro_appointment_patients() from public, anon;
grant execute on function public.pro_appointment_patients() to authenticated;

-- 2. Un RDV ne peut plus être modifié que sur son statut et ses notes (pas de changement de date,
--    de médecin, de patient ou de créneau depuis l'API). Le patient ne peut que l'annuler.
create or replace function public.appointments_guard_update()
returns trigger language plpgsql set search_path = ''
as $f$
begin
  if current_user in ('anon', 'authenticated') then
    if new.patient_id is distinct from old.patient_id
       or new.professional_id is distinct from old.professional_id
       or new.slot_id is distinct from old.slot_id
       or new.start_at is distinct from old.start_at
       or new.end_at is distinct from old.end_at then
      raise exception 'Seul le statut du rendez-vous peut être modifié' using errcode = '42501';
    end if;
    if new.status not in ('pending', 'confirmed', 'cancelled', 'completed') then
      raise exception 'Statut invalide' using errcode = '22023';
    end if;
    if (select auth.uid()) = old.patient_id and (select auth.uid()) is distinct from old.professional_id
       and new.status is distinct from old.status and new.status <> 'cancelled' then
      raise exception 'Le patient ne peut qu''annuler' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end
$f$;
revoke execute on function public.appointments_guard_update() from public, anon, authenticated;
drop trigger if exists appointments_guard_update on public.appointments;
create trigger appointments_guard_update before update on public.appointments
  for each row execute function public.appointments_guard_update();

-- 3. Spécialités et langues : une seule nomenclature (celle de la table specialites + codes langue).
update public.professionals set specialite = case specialite
  when 'Médecine générale' then 'Médecin généraliste'
  when 'Cardiologie' then 'Cardiologue'
  when 'Dermatologie' then 'Dermatologue'
  when 'Gynécologie' then 'Gynécologue'
  when 'Neurologie' then 'Neurologue'
  when 'Ophtalmologie' then 'Ophtalmologue'
  when 'Orthopédie' then 'Orthopédiste'
  when 'Pédiatrie' then 'Pédiatre'
  when 'Psychiatrie' then 'Psychiatre'
  when 'Radiologie' then 'Radiologue'
  when 'Rhumatologie' then 'Rhumatologue'
  when 'Urologie' then 'Urologue'
  when 'Gastro-entérologie' then 'Gastro-entérologue'
  when 'Endocrinologie' then 'Endocrinologue'
  when 'Pneumologie' then 'Pneumologue'
  when 'Néphrologie' then 'Néphrologue'
  else specialite end
where specialite is not null;

update public.professionals set langues = array(
  select distinct case l
    when 'Français' then 'fr' when 'Arabe' then 'ar' when 'Tamazight' then 'kab' when 'Anglais' then 'en'
    else l end
  from unnest(langues) l)
where langues is not null;

-- 4. Un créneau réservé ne peut pas être supprimé par erreur par le médecin.
drop policy if exists "Pro manages own slots" on public.availability_slots;
create policy "slots_pro_select" on public.availability_slots for select to authenticated
  using ((select auth.uid()) = professional_id);
create policy "slots_pro_insert" on public.availability_slots for insert to authenticated
  with check ((select auth.uid()) = professional_id and coalesce(is_booked, false) = false);
create policy "slots_pro_update" on public.availability_slots for update to authenticated
  using ((select auth.uid()) = professional_id) with check ((select auth.uid()) = professional_id);
create policy "slots_pro_delete" on public.availability_slots for delete to authenticated
  using ((select auth.uid()) = professional_id and is_booked = false);

-- 5. Ré-autoriser un médecin déjà révoqué : on réactive la ligne existante (clé unique médecin/patient),
--    uniquement si le médecin est validé.
drop policy if exists "da_patient_update" on public.doctor_access;
create policy "da_patient_update" on public.doctor_access for update to authenticated
  using ((select auth.uid()) = patient_id)
  with check ((select auth.uid()) = patient_id and (status = 'revoked' or public.is_validated_doctor(doctor_id)));

-- 6. Un créneau libéré (RDV annulé) peut être supprimé par le médecin sans erreur.
alter table public.appointments drop constraint if exists appointments_slot_id_fkey;
alter table public.appointments add constraint appointments_slot_id_fkey
  foreign key (slot_id) references public.availability_slots(id) on delete set null;
