import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useTranslation } from 'react-i18next'

export default function AppointmentsScreen({ nav, user, showToast, isOffline, offlineAppointments }) {
  const { t } = useTranslation()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    if (isOffline) {
      setAppointments(offlineAppointments || [])
      setLoading(false)
      return
    }
    fetchAppointments()
  }, [user?.id, isOffline, offlineAppointments])

  async function fetchAppointments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('id, appointment_date, status, notes, professional_id')
      .eq('patient_id', user.id)
      .order('appointment_date', { ascending: false })

    if (error) {
      setAppointments(offlineAppointments || [])
    } else {
      setAppointments(data || [])
    }
    setLoading(false)
  }

  function statusLabel(status) {
    const map = {
      pending:   { label: 'En attente', color: '#f59e0b' },
      confirmed: { label: 'Confirmé',   color: '#10b981' },
      cancelled: { label: 'Annulé',     color: '#ef4444' },
      completed: { label: 'Terminé',    color: '#6b7280' },
    }
    return map[status] || { label: status, color: '#6b7280' }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 80 }}>
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        padding: '20px 20px 28px',
        color: '#fff'
      }}>
        <button
          onClick={() => nav('home')}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', marginBottom: 8 }}
        >←</button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Mes rendez-vous</h1>
        {isOffline && (
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.85 }}>📴 Mode hors ligne — données locales</p>
        )}
      </div>

      <div style={{ padding: '20px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chargement...</div>
        ) : appointments.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
            <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>Aucun rendez-vous pour le moment</p>
            {!isOffline && (
              <button
                onClick={() => nav('search')}
                style={{ marginTop: 16, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >Prendre un RDV</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {appointments.map(appt => {
              const { label, color } = statusLabel(appt.status)
              const date = new Date(appt.appointment_date)
              return (
                <div key={appt.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: `4px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                        {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 13 }}>
                        🕐 {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {appt.notes && <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 12 }}>{appt.notes}</p>}
                    </div>
                    <span style={{ background: color + '20', color, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>{label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}