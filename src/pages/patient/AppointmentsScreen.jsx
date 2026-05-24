import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']

function formatRdv(dateStr) {
  const d = new Date(dateStr)
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const STATUS_CONFIG = {
  pending:   { label: 'En attente', color: 'var(--yellow)', bg: 'rgba(255,209,102,.1)', border: 'rgba(255,209,102,.25)' },
  confirmed: { label: 'Confirmé',   color: 'var(--g)',      bg: 'rgba(0,201,141,.1)',   border: 'rgba(0,201,141,.25)' },
  cancelled: { label: 'Annulé',     color: '#FF8A8A',       bg: 'rgba(255,90,90,.1)',   border: 'rgba(255,90,90,.25)' },
  completed: { label: 'Terminé',    color: 'var(--dim)',    bg: 'rgba(90,106,133,.1)',  border: 'rgba(90,106,133,.25)' },
}

export default function AppointmentsScreen({ nav, showToast }) {
  const [rdvs, setRdvs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => { loadRdvs() }, [])

  const loadRdvs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', user.id)
      .order('start_at', { ascending: false })
    setRdvs(data || [])

    // Charger les noms des pros séparément
    if (data && data.length > 0) {
      const proIds = [...new Set(data.map(r => r.professional_id))]
      const proData = []
      for (const id of proIds) {
        const { data: p } = await supabase
          .from('professionals')
          .select('id, fname, lname, specialite, gender')
          .eq('id', id)
          .maybeSingle()
        if (p) proData.push(p)
      }
      setRdvs(data.map(r => ({
        ...r,
        pro: proData.find(p => p.id === r.professional_id)
      })))
    }
    setLoading(false)
  }

  const cancelRdv = async (id) => {
    if (!confirm('Annuler ce rendez-vous ?')) return
    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
    showToast('Rendez-vous annulé')
    loadRdvs()
  }

  const now = new Date()
  const upcoming = rdvs.filter(r => new Date(r.start_at) >= now && r.status !== 'cancelled')
  const past = rdvs.filter(r => new Date(r.start_at) < now || r.status === 'cancelled')

  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div className="screen" style={{ display: 'flex' }}>

      {/* HEADER */}
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('home')}>←</div>
        <div className="shdr-title">Mes rendez-vous</div>
      </div>

      {/* TABS */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        <div
          className={`tab${tab === 'upcoming' ? ' active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          📅 À venir ({upcoming.length})
        </div>
        <div
          className={`tab${tab === 'past' ? ' active' : ''}`}
          onClick={() => setTab('past')}
        >
          🕐 Passés ({past.length})
        </div>
      </div>

      {loading && <div className="loading">⏳ Chargement...</div>}

      {!loading && list.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-icon">📅</div>
          <p>{tab === 'upcoming' ? 'Aucun rendez-vous à venir' : 'Aucun rendez-vous passé'}</p>
          {tab === 'upcoming' && (
            <div
              className="add-btn"
              style={{ marginTop: 16 }}
              onClick={() => nav('search')}
            >
              🔍 Trouver un professionnel
            </div>
          )}
        </div>
      )}

      {!loading && list.map(rdv => {
        const st = STATUS_CONFIG[rdv.status] || STATUS_CONFIG.pending
        const pro = rdv.pro
        const canCancel = rdv.status === 'confirmed' || rdv.status === 'pending'
        const isFuture = new Date(rdv.start_at) >= now

        return (
          <div key={rdv.id} className="card" style={{ marginBottom: 10 }}>
            {/* STATUS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: 'var(--dim)' }}>
                📅 {formatRdv(rdv.start_at)}
              </div>
              <span style={{
                background: st.bg, border: `1px solid ${st.border}`,
                color: st.color, fontFamily: "'Syne',sans-serif",
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20
              }}>
                {st.label}
              </span>
            </div>

            {/* PRO */}
            <div className="card-row" style={{ marginBottom: rdv.motif ? 10 : 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(77,159,236,.1)', border: '1px solid rgba(77,159,236,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
              }}>
                {pro?.gender === 'Féminin' ? '👩‍⚕️' : '👨‍⚕️'}
              </div>
              <div className="card-info">
                <div className="card-name">
                  {pro ? `Dr. ${pro.fname} ${pro.lname}` : 'Médecin'}
                </div>
                {pro?.specialite && (
                  <div className="card-sub" style={{ color: 'var(--blue)' }}>{pro.specialite}</div>
                )}
              </div>
            </div>

            {/* MOTIF */}
            {rdv.motif && (
              <div style={{
                fontSize: 12, color: 'rgba(255,255,255,.5)',
                background: 'rgba(255,255,255,.04)', borderRadius: 8,
                padding: '8px 12px', marginBottom: 10, lineHeight: 1.5
              }}>
                💬 {rdv.motif}
              </div>
            )}

            {/* ANNULER */}
            {canCancel && isFuture && (
              <button
                className="btn-cancel"
                style={{ color: '#FF8A8A', borderColor: 'rgba(255,90,90,.2)' }}
                onClick={() => cancelRdv(rdv.id)}
              >
                Annuler ce rendez-vous
              </button>
            )}
          </div>
        )
      })}

      {/* BOUTON PRENDRE RDV */}
      {!loading && (
        <div
          className="add-btn"
          style={{ marginTop: 8 }}
          onClick={() => nav('search')}
        >
          ＋ Prendre un nouveau rendez-vous
        </div>
      )}

      <div className="pad-b" />
    </div>
  )
}