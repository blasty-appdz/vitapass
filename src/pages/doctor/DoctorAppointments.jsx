import { useState } from 'react'
import DoctorShell, { Loader } from './DoctorShell'
import { useProAppointments, AppointmentItem, dayStart, fmtDay } from './proData'
import Icon from '../../components/common/Icon'

export default function DoctorAppointments({ nav, showToast, pro, userId }) {
  const { appointments, loading, error, setStatus, reload } = useProAppointments(userId)
  const [filter, setFilter] = useState('upcoming')

  const onStatus = async (id, status) => {
    const err = await setStatus(id, status)
    if (err) showToast('❌ ' + err)
    else showToast(status === 'cancelled' ? 'Rendez-vous annulé' : '✅ Rendez-vous mis à jour')
  }

  const start = dayStart()
  const filtered = appointments.filter(r => {
    const d = new Date(r.start_at)
    if (filter === 'upcoming') return d >= start && r.status !== 'cancelled'
    if (filter === 'past') return d < start && r.status !== 'cancelled'
    return r.status === 'cancelled'
  })
  if (filter === 'past') filtered.reverse()

  const groups = filtered.reduce((acc, r) => {
    const key = new Date(r.start_at).toDateString()
    ;(acc[key] = acc[key] || []).push(r)
    return acc
  }, {})

  const who = pro?.fname ? `Dr. ${pro.fname} ${pro.lname || ''}` : ''

  return (
    <DoctorShell nav={nav} active="pro-agenda" who={who} title="Agenda" subtitle="Tous vos rendez-vous pris sur VitaPass">
      <div className="pro-seg">
        {[['upcoming', 'À venir'], ['past', 'Passés'], ['cancelled', 'Annulés']].map(([id, label]) => (
          <button key={id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>

      {error && (
        <div className="pro-banner warn">{error} <button className="pro-btn ghost" onClick={reload}>Réessayer</button></div>
      )}

      {loading ? <Loader /> : filtered.length === 0 ? (
        <div className="pro-card pro-empty">
          <div className="e"><Icon e="📭" /></div>
          {filter === 'upcoming' ? 'Aucun rendez-vous à venir' : filter === 'past' ? 'Aucun rendez-vous passé' : 'Aucun rendez-vous annulé'}
          {filter === 'upcoming' && (
            <div style={{ marginTop: 14 }}>
              <button className="pro-btn g" onClick={() => nav('pro-schedule')}>Ouvrir des créneaux</button>
            </div>
          )}
        </div>
      ) : Object.entries(groups).map(([key, list]) => (
        <div key={key}>
          <div className="sec-label" style={{ textTransform: 'capitalize' }}>{fmtDay(list[0].start_at)}</div>
          {list.map(r => (
            <AppointmentItem key={r.id} rdv={r} onStatus={onStatus} onOpenPatient={(id) => nav('pro-patient', { patientId: id })} />
          ))}
        </div>
      ))}
    </DoctorShell>
  )
}
