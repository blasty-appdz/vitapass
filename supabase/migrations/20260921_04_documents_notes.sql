-- Notes des médecins : colonnes content et created_by (elles n'existaient pas, l'enregistrement d'une note échouait).
-- (appliqué en ligne le 2026-09-21)
alter table public.documents add column if not exists content text;
alter table public.documents add column if not exists created_by uuid references auth.users(id) on delete set null;

drop policy if exists "documents_insert_doctor" on public.documents;
create policy "documents_insert_doctor" on public.documents for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.is_validated_doctor((select auth.uid()))
    and exists (
      select 1 from public.doctor_access da
      where da.doctor_id = (select auth.uid()) and da.patient_id = documents.patient_id and da.status = 'active'));
