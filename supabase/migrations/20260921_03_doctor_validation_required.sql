-- Un médecin non validé ne lit ni dossiers, ni documents, ni fichiers, et ne peut pas ajouter de note.
-- (appliqué en ligne le 2026-09-21)
drop policy if exists "dossiers_select_doctor" on public.dossiers;
create policy "dossiers_select_doctor" on public.dossiers for select to authenticated
  using (public.is_validated_doctor((select auth.uid())) and exists (
    select 1 from public.doctor_access da
    where da.doctor_id = (select auth.uid()) and da.patient_id = dossiers.patient_id and da.status = 'active'));

drop policy if exists "documents_select_doctor" on public.documents;
create policy "documents_select_doctor" on public.documents for select to authenticated
  using (public.is_validated_doctor((select auth.uid())) and exists (
    select 1 from public.doctor_access da
    where da.doctor_id = (select auth.uid()) and da.patient_id = documents.patient_id and da.status = 'active'));

drop policy if exists "read_patient_docs_as_doctor" on storage.objects;
create policy "read_patient_docs_as_doctor" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_validated_doctor((select auth.uid())) and exists (
    select 1 from public.doctor_access da
    where da.doctor_id = (select auth.uid()) and da.status = 'active'
      and da.patient_id::text = (storage.foldername(name))[1]));
