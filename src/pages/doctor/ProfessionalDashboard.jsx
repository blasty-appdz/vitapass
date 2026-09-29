import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import DoctorShell, { Loader } from './DoctorShell'
import { useProAppointments, AppointmentItem, dayStart, dayEnd } from './proData'
import Icon, { IconText } from '../../components/common/Icon'
export default function ProfessionalDashboard({ nav, showToast, pro, setPro, userId }) {
  const { appointments, loading, setStatus } = useProAppointments(userId)
  const [freeSlots, setFreeSlots] = useState(null)
  const [patientsCount, setPatientsCount] = useState(0)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('availability_slots')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', userId)
      .eq('is_booked', false)
      .gte('start_at', new Date().toISOString())
      .then(({ count }) => setFreeSlots(count || 0))
    supabase
      .from('doctor_access')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', userId)
      .eq('status', 'active')
      .then(({ count }) => setPatientsCount(count || 0))
  }, [userId])

  const toggleDispo = async () => {
    setToggling(true)
    const next = !pro?.is_available
    const { error } = await supabase
      .from('professionals')
      .update({ is_available: next, updated_at: new Date().toISOString() })
      .eq('id', userId)
    setToggling(false)
    if (error) { showToast('❌ ' + error.message); return }
    setPro(p => ({ ...p, is_available: next }))
    showToast(next ? '✅ Vous apparaissez dans la recherche' : '⏸️ Vous êtes masqué de la recherche')
  }

  const onStatus = async (id, status) => {
    const err = await setStatus(id, status)
    if (err) showToast('❌ ' + err)
    else showToast(status === 'cancelled' ? 'Rendez-vous annulé' : '✅ Rendez-vous mis à jour')
  }

  const now = new Date()
  const active = appointments.filter(r => r.status !== 'cancelled')
  const today = active.filter(r => new Date(r.start_at) >= dayStart() && new Date(r.start_at) <= dayEnd())
  const upcoming = active.filter(r => new Date(r.start_at) > dayEnd())
  const pending = active.filter(r => r.status === 'pending' && new Date(r.start_at) > now)

  const incomplete = !pro?.fname || !pro?.specialite || !pro?.wilaya
  const who = pro?.fname ? `Dr. ${pro.fname} ${pro.lname || ''}` : ''

  return (
    <DoctorShell nav={nav} active="pro-dashboard" who={who}
      title={pro?.fname ? `Bonjour Dr. ${pro.lname || pro.fname}` : 'Bienvenue'}
      subtitle={now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}>

      {incomplete && (
        <div className="pro-banner warn">
          <Icon e="⚠️" /> <span style={{ flex: 1 }}>Votre profil est incomplet : les patients ne peuvent pas vous trouver.</span>
          <button className="pro-btn g" onClick={() => nav('pro-onboarding')}>Compléter</button>
        </div>
      )}
      {!incomplete && !pro?.validated && (
        <div className="pro-banner info">
          <Icon e="⏳" /> <span style={{ flex: 1 }}>Profil en cours de vérification par l'équipe VitaPass. Vous serez visible dans la recherche dès la validation.</span>
        </div>
      )}
      {pro?.validated && freeSlots === 0 && (
        <div className="pro-banner warn">
          <Icon e="📅" /> <span style={{ flex: 1 }}>Aucun créneau libre à venir : les patients ne peuvent pas réserver.</span>
          <button className="pro-btn g" onClick={() => nav('pro-schedule')}>Ajouter des créneaux</button>
        </div>
      )}

      <div className="pro-card pro-row">
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            <IconText>{pro?.is_available ? '🟢 Visible dans la recherche' : '⏸️ En pause'}</IconText>
          </div>
          <div style={{ fontSize: 13, color: 'var(--dim)', marginTop: 3 }}>
            {pro?.is_available ? 'Les patients peuvent réserver vos créneaux' : 'Vous n\'apparaissez plus aux patients'}
          </div>
        </div>
        <button className={`pro-btn ${pro?.is_available ? 'ghost' : 'g'}`} disabled={toggling} onClick={toggleDispo}>
          {pro?.is_available ? 'Mettre en pause' : 'Activer'}
        </button>
      </div>

      <div className="pro-card pro-row" style={{ cursor: 'pointer' }} onClick={() => nav('pro-secretaries')}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,201,141,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon e="📋" size={19} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Mon secrétariat</div>
          <div style={{ fontSize: 13, color: 'var(--dim)', marginTop: 3 }}>Donnez à vos secrétaires l'accès aux dossiers de votre choix</div>
        </div>
        <span style={{ color: 'var(--dim)', fontSize: 18 }}>›</span>
      </div>

      <div className="pro-grid">
        <div className="pro-stat"><b>{today.length}</b><span>RDV aujourd'hui</span></div>
        <div className="pro-stat"><b>{upcoming.length}</b><span>RDV à venir</span></div>
        <div className="pro-stat"><b>{freeSlots ?? '–'}</b><span>Créneaux libres</span></div>
        <div className="pro-stat"><b>{patientsCount}</b><span>Dossiers partagés</span></div>
      </div>

      {pending.length > 0 && (
        <div className="pro-banner info"><Icon e="🔔" /> {pending.length} rendez-vous à confirmer</div>
      )}

      <div className="sec-label" style={{ marginTop: 6 }}>Aujourd'hui</div>
      {loading ? <Loader /> : today.length === 0 ? (
        <div className="pro-card pro-empty"><div className="e"><Icon e="☕" /></div>Aucun rendez-vous aujourd'hui</div>
      ) : today.map(r => (
        <AppointmentItem key={r.id} rdv={r} onStatus={onStatus} onOpenPatient={(id) => nav('pro-patient', { patientId: id })} />
      ))}

      {!loading && upcoming.length > 0 && (
        <>
          <div className="sec-label">Prochains rendez-vous</div>
          {upcoming.slice(0, 5).map(r => (
            <AppointmentItem key={r.id} rdv={r} showDay onStatus={onStatus} onOpenPatient={(id) => nav('pro-patient', { patientId: id })} />
          ))}
          {upcoming.length > 5 && (
            <button className="pro-btn ghost" style={{ width: '100%' }} onClick={() => nav('pro-agenda')}>
              Voir tout l'agenda ({upcoming.length})
            </button>
          )}
        </>
      )}
    </DoctorShell>
  )
}
