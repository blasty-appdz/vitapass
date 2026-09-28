import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import { RDV_STATUS } from '../../data'
import { fullName } from './DoctorShell'
import Icon from '../../components/common/Icon'

// Rendez-vous du professionnel connecté + nom des patients (fonction sécurisée côté base).
export function useProAppointments(proId) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!proId) return
    setLoading(true)
    setError('')
    const [{ data: rdvs, error: e1 }, { data: patients }] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, patient_id, professional_id, slot_id, start_at, end_at, status, motif, notes, created_at')
        .eq('professional_id', proId)
        .order('start_at', { ascending: true }),
      supabase.rpc('pro_appointment_patients'),
    ])
    if (e1) {
      setError('Impossible de charger les rendez-vous')
      setAppointments([])
    } else {
      const byId = Object.fromEntries((patients || []).map(p => [p.id, p]))
      setAppointments((rdvs || []).map(r => ({ ...r, patient: byId[r.patient_id] || null })))
    }
    setLoading(false)
  }, [proId])

  useEffect(() => { load() }, [load])

  const setStatus = async (id, status) => {
    const { error: e } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (e) return e.message
    setAppointments(list => list.map(r => (r.id === id ? { ...r, status } : r)))
    return null
  }

  return { appointments, loading, error, reload: load, setStatus }
}

export const dayStart = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export const dayEnd = (d = new Date()) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }

export const fmtHour = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
export const fmtDay = (iso) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export function StatusPill({ status }) {
  const s = RDV_STATUS[status] || { label: status, color: 'var(--dim)', bg: 'rgba(255,255,255,.06)' }
  return <span className="pro-pill" style={{ color: s.color, background: s.bg }}>{s.label}</span>
}

// Une ligne de rendez-vous avec les actions possibles pour le médecin
export function AppointmentItem({ rdv, onStatus, onOpenPatient, showDay = false }) {
  const [busy, setBusy] = useState(false)
  const future = new Date(rdv.start_at) > new Date()
  const act = async (status, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return
    setBusy(true)
    await onStatus(rdv.id, status)
    setBusy(false)
  }
  return (
    <div className="pro-card" style={{ opacity: rdv.status === 'cancelled' ? 0.6 : 1 }}>
      <div className="pro-row" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 58, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--g)' }}>{fmtHour(rdv.start_at)}</div>
          {rdv.end_at && <div style={{ fontSize: 11.5, color: 'var(--dim)' }}>→ {fmtHour(rdv.end_at)}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {showDay && <div style={{ fontSize: 12.5, color: 'var(--dim)', textTransform: 'capitalize', marginBottom: 2 }}>{fmtDay(rdv.start_at)}</div>}
          <div style={{ fontWeight: 700, fontSize: 15 }}>{fullName(rdv.patient)}</div>
          {rdv.motif && <div style={{ fontSize: 13, color: 'var(--dim)', marginTop: 3 }}><Icon e="💬" /> {rdv.motif}</div>}
          <div style={{ marginTop: 6 }}><StatusPill status={rdv.status} /></div>
        </div>
      </div>
      {rdv.status !== 'cancelled' && rdv.status !== 'completed' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {rdv.status === 'pending' && (
            <button className="pro-btn g" disabled={busy} onClick={() => act('confirmed')}><Icon e="✓" /> Confirmer</button>
          )}
          {!future && (
            <button className="pro-btn blue" disabled={busy} onClick={() => act('completed')}><Icon e="✓" /> Consultation faite</button>
          )}
          {onOpenPatient && (
            <button className="pro-btn ghost" disabled={busy} onClick={() => onOpenPatient(rdv.patient_id)}>Dossier</button>
          )}
          <button className="pro-btn red" disabled={busy} onClick={() => act('cancelled', 'Annuler ce rendez-vous ? Le créneau sera libéré.')}>Annuler</button>
        </div>
      )}
    </div>
  )
}
