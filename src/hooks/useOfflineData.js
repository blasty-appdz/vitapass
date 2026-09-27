// src/hooks/useOfflineData.js
import { useState, useEffect } from 'react'
import { saveOffline, loadOffline } from './useOffline'
import { supabase } from '../supabase'

export function useOfflineProfile(userId) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!userId) return
    loadOffline('profile').then((records) => {
      const found = records.find((r) => r.id === userId)
      if (found) setProfile(found)
    })
    // Sync en ligne → sauvegarde en cache
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle().then(({ data }) => {
      if (data) {
        setProfile(data)
        saveOffline('profile', data)
      }
    })
  }, [userId])

  return { profile }
}

export function useOfflineDossier(userId) {
  const [dossier, setDossier] = useState(null)

  useEffect(() => {
    if (!userId) return
    loadOffline('dossier').then((records) => {
      const found = records.find((r) => r.patient_id === userId || r.id === userId)
      if (found) setDossier(found)
    })
    supabase.from('dossiers').select('*').eq('patient_id', userId).maybeSingle().then(({ data }) => {
      if (data) {
        setDossier(data)
        saveOffline('dossier', { ...data, id: data.patient_id })
      }
    })
  }, [userId])

  return { dossier }
}

export function useOfflineAppointments(userId) {
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    if (!userId) return
    loadOffline('appointments').then((records) => {
      const found = records.filter((r) => r.patient_id === userId)
      if (found.length > 0) setAppointments(found)
    })
    supabase
      .from('appointments')
      .select('id, start_at, end_at, status, motif, notes, professional_id, patient_id')
      .eq('patient_id', userId)
      .order('start_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setAppointments(data)
          saveOffline('appointments', data)
        }
      })
  }, [userId])

  return { appointments }
}