/**
 * VitaPass — Couche service Supabase
 * Centralise toutes les requêtes base de données
 */
import { supabase } from '../supabase'

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  getSession: () => supabase.auth.getSession(),
  getUser: () => supabase.auth.getUser(),
  signIn: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),
  signUp: (email, password, metadata) =>
    supabase.auth.signUp({ email, password, options: { data: metadata } }),
  signOut: () => supabase.auth.signOut(),
  updateUser: (attrs) => supabase.auth.updateUser(attrs),
  resetPassword: (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.vitapass.app/auth/callback',
    }),
  onAuthStateChange: (callback) => supabase.auth.onAuthStateChange(callback),
}

// ─── Profils ─────────────────────────────────────────────────────────────────
export const profileService = {
  get: (userId) =>
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
  update: (userId, data) =>
    supabase.from('profiles').update(data).eq('id', userId),
  getById: (id) =>
    supabase
      .from('profiles')
      .select('id,fname,lname,gender,specialite,numero_ordre')
      .eq('id', id)
      .maybeSingle(),
}

// ─── Dossiers médicaux ───────────────────────────────────────────────────────
export const dossierService = {
  get: (userId) =>
    supabase
      .from('dossiers')
      .select('*')
      .eq('patient_id', userId)
      .maybeSingle(),
  update: (userId, data) =>
    supabase
      .from('dossiers')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('patient_id', userId)
      .select()
      .maybeSingle(),
}

// ─── Accès médecins ──────────────────────────────────────────────────────────
export const doctorAccessService = {
  getAll: (patientId) =>
    supabase
      .from('doctor_access')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active'),
  count: (patientId) =>
    supabase
      .from('doctor_access')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('status', 'active'),
  insert: (patientId, doctorId) =>
    supabase
      .from('doctor_access')
      .insert({ patient_id: patientId, doctor_id: doctorId, status: 'active' }),
  revoke: (accessId) =>
    supabase
      .from('doctor_access')
      .update({ status: 'revoked' })
      .eq('id', accessId),
  checkExisting: (patientId, doctorId) =>
    supabase
      .from('doctor_access')
      .select('id')
      .eq('patient_id', patientId)
      .eq('doctor_id', doctorId)
      .eq('status', 'active')
      .maybeSingle(),
}

// ─── Documents ───────────────────────────────────────────────────────────────
export const documentService = {
  getAll: (patientId) =>
    supabase
      .from('documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
  insert: (data) => supabase.from('documents').insert(data),
  delete: (id) => supabase.from('documents').delete().eq('id', id),
  upload: (path, file) =>
    supabase.storage.from('documents').upload(path, file),
  getPublicUrl: (path) =>
    supabase.storage.from('documents').getPublicUrl(path),
}

// ─── Professionnels ──────────────────────────────────────────────────────────
export const professionalService = {
  search: ({ wilaya, specialite } = {}) => {
    let query = supabase
      .from('professionals')
      .select(
        'id, fname, lname, gender, specialite, wilaya, adresse, tarif, duree_rdv, langues, photo_url, bio, is_available'
      )
      .eq('validated', true)
      .eq('is_available', true)
    if (wilaya) query = query.eq('wilaya', wilaya)
    if (specialite) query = query.eq('specialite', specialite)
    return query.order('fname')
  },
  get: (id) =>
    supabase.from('professionals').select('*').eq('id', id).maybeSingle(),
  getPro: (userId) =>
    supabase
      .from('professionals')
      .select('fname,specialite,wilaya')
      .eq('id', userId)
      .maybeSingle(),
  update: (userId, data) =>
    supabase
      .from('professionals')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', userId),
}

// ─── Rendez-vous ─────────────────────────────────────────────────────────────
export const appointmentService = {
  getByPatient: (patientId) =>
    supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: true }),
  getByPro: (proId) =>
    supabase
      .from('appointments')
      .select('*')
      .eq('professional_id', proId)
      .order('scheduled_at', { ascending: true }),
  insert: (data) => supabase.from('appointments').insert(data),
  updateStatus: (id, status) =>
    supabase.from('appointments').update({ status }).eq('id', id),
}

// ─── RPCs ────────────────────────────────────────────────────────────────────
export const rpcService = {
  findDoctorByEmail: (email) =>
    supabase.rpc('find_doctor_by_email', { p_email: email }),
}
