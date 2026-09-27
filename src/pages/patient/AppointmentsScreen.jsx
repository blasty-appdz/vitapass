import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import { useTranslation } from 'react-i18next'
import { RDV_STATUS } from '../../data'
import { saveOffline } from '../../hooks/useOffline'

export default function AppointmentsScreen({ nav, user, showToast, isOffline, offlineAppointments }) {
  const { t } = useTranslation()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    if (isOffline) {
      setAppointments(offlineAppointments || [])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('id, start_at, end_at, status, motif, notes, professional_id, patient_id')
      .eq('patient_id', user.id)
      .order('start_at', { ascending: true })
    if (error) {
      setAppointments(offlineAppointments || [])
      setLoading(false)
      return
    }
    const ids = [...new Set((data || []).map(r => r.professional_id))]
    let pros = []
    if (ids.length) {
      const { data: p } = await supabase
        .from('professionals')
        .select('id, fname, lname, specialite, adresse, wilaya, telephone')
        .in('id', ids)
      pros = p || []
    }
    const list = (data || []).map(r => ({ ...r, pro: pros.find(p => p.id === r.professional_id) || null }))
    setAppointments(list)
    saveOffline('appointments', list)
    setLoading(false)
  }, [user?.id, isOffline]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const cancel = async (rdv) => {
    if (!window.confirm(t('rdv.cancel_confirm', 'Annuler ce rendez-vous ?'))) return
    setBusy(rdv.id)
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', rdv.id)
    setBusy(null)
    if (error) { showToast('❌ ' + error.message); return }
    showToast('✅ ' + t('rdv.cancelled', 'Rendez-vous annulé'))
    setAppointments(list => list.map(r => (r.id === rdv.id ? { ...r, status: 'cancelled' } : r)))
  }

  const now = new Date()
  const upcoming = appointments.filter(r => new Date(r.start_at) >= now && r.status !== 'cancelled')
  const past = appointments.filter(r => new Date(r.start_at) < now || r.status === 'cancelled').reverse()
  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('home')}>←</div>
        <div className="shdr-title">{t('rdv.title', 'Mes rendez-vous')}</div>
      </div>

      {isOffline && (
        <div style={{ background: 'rgba(255,209,102,.1)', border: '1px solid rgba(255,209,102,.25)', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: 'var(--yellow)', marginBottom: 10 }}>
          {"📴"} Mode hors ligne — données locales
        </div>
      )}

      <div className="tabs">
        <div className={`tab${tab === 'upcoming' ? ' active' : ''}`} onClick={() => setTab('upcoming')}>{t('rdv.upcoming', 'À venir')} ({upcoming.length})</div>
        <div className={`tab${tab === 'past' ? ' active' : ''}`} onClick={() => setTab('past')}>{t('rdv.past', 'Historique')}</div>
      </div>

      {loading ? (
        <div className="loading">{t('common.loading')}</div>
      ) : list.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-icon">{"📅"}</div>
          <p>{tab === 'upcoming' ? t('rdv.none', 'Aucun rendez-vous à venir') : t('rdv.no_history', 'Aucun rendez-vous passé')}</p>
          {!isOffline && tab === 'upcoming' && (
            <button className="btn-submit" style={{ marginTop: 16 }} onClick={() => nav('search')}>
              {"📅"} {t('rdv.book', 'Prendre un rendez-vous')}
            </button>
          )}
        </div>
      ) : list.map(rdv => {
        const d = new Date(rdv.start_at)
        const st = RDV_STATUS[rdv.status] || RDV_STATUS.pending
        const canCancel = !isOffline && tab === 'upcoming' && (rdv.status === 'pending' || rdv.status === 'confirmed')
        return (
          <div key={rdv.id} className="card" style={{ borderLeft: `3px solid ${st.color}` }}>
            <div className="card-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ textAlign: 'center', minWidth: 52 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--white)' }}>{d.getDate()}</div>
                <div style={{ fontSize: 10, color: 'var(--dim)', textTransform: 'uppercase' }}>{d.toLocaleDateString('fr-FR', { month: 'short' })}</div>
              </div>
              <div className="card-info">
                <div className="card-name">{rdv.pro ? `Dr. ${rdv.pro.fname || ''} ${rdv.pro.lname || ''}` : 'Médecin'}</div>
                {rdv.pro?.specialite && <div className="card-sub" style={{ color: 'var(--blue)' }}>{rdv.pro.specialite}</div>}
                <div className="card-sub" style={{ textTransform: 'capitalize' }}>
                  {"🕐"} {d.toLocaleDateString('fr-FR', { weekday: 'long' })} {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {rdv.pro?.adresse && <div className="card-sub">{"📍"} {rdv.pro.adresse}{rdv.pro.wilaya ? `, ${rdv.pro.wilaya}` : ''}</div>}
                {rdv.motif && <div className="card-sub">{"💬"} {rdv.motif}</div>}
              </div>
              <span className="badge" style={{ color: st.color, background: st.bg }}>{st.label}</span>
            </div>
            {(canCancel || rdv.pro?.telephone) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {rdv.pro?.telephone && tab === 'upcoming' && (
                  <a href={`tel:${rdv.pro.telephone.replace(/\s/g, '')}`} className="btn-cancel"
                    style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '9px 0', fontSize: 12, margin: 0 }}>
                    {"📞"} Appeler le cabinet
                  </a>
                )}
                {canCancel && (
                  <button className="btn-cancel" disabled={busy === rdv.id} onClick={() => cancel(rdv)}
                    style={{ flex: 1, padding: '9px 0', fontSize: 12, color: '#FF8A8A', margin: 0 }}>
                    {busy === rdv.id ? '⏳' : t('rdv.cancel', 'Annuler')}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
      <div className="pad-b" />
    </div>
  )
}
