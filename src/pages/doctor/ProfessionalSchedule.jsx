import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'
import DoctorShell, { Loader } from './DoctorShell'
import { fmtHour } from './proData'
import Icon from '../../components/common/Icon'

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
const NB_JOURS = 28

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const sameDay = (a, b) => a.toDateString() === b.toDateString()

// Découpe une plage horaire en créneaux pour une date donnée
function buildSlots(date, debut, fin, duree) {
  const [hD, mD] = debut.split(':').map(Number)
  const [hF, mF] = fin.split(':').map(Number)
  const out = []
  let t = hD * 60 + mD
  const end = hF * 60 + mF
  while (t + duree <= end) {
    const s = new Date(date); s.setHours(Math.floor(t / 60), t % 60, 0, 0)
    const e = new Date(date); e.setHours(Math.floor((t + duree) / 60), (t + duree) % 60, 0, 0)
    out.push({ start: s, end: e })
    t += duree
  }
  return out
}

export default function ProfessionalSchedule({ nav, showToast, pro, userId }) {
  const today = startOfDay(new Date())
  const days = Array.from({ length: NB_JOURS }, (_, i) => addDays(today, i))
  const [selected, setSelected] = useState(today)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [debut, setDebut] = useState('09:00')
  const [fin, setFin] = useState('12:00')
  const [debut2, setDebut2] = useState('14:00')
  const [fin2, setFin2] = useState('17:00')
  const [apresMidi, setApresMidi] = useState(true)
  const [repeat, setRepeat] = useState(1)
  const duree = Number(pro?.duree_rdv) || 30

  const load = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('availability_slots')
      .select('id, start_at, end_at, is_booked')
      .eq('professional_id', userId)
      .gte('start_at', today.toISOString())
      .lte('start_at', addDays(today, NB_JOURS + 21).toISOString())
      .order('start_at')
    if (error) showToast('❌ ' + error.message)
    setSlots(data || [])
    setLoading(false)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const slotsOf = (d) => slots.filter(s => sameDay(new Date(s.start_at), d))
  const daySlots = slotsOf(selected)

  const preview = [
    ...buildSlots(selected, debut, fin, duree),
    ...(apresMidi ? buildSlots(selected, debut2, fin2, duree) : []),
  ].filter(s => s.start > new Date())

  const apply = async () => {
    if (preview.length === 0) { showToast('⚠️ Aucun créneau : vérifiez les horaires'); return }
    setSaving(true)
    let total = 0
    for (let w = 0; w < repeat; w++) {
      const date = addDays(selected, 7 * w)
      const candidates = [
        ...buildSlots(date, debut, fin, duree),
        ...(apresMidi ? buildSlots(date, debut2, fin2, duree) : []),
      ].filter(s => s.start > new Date())
      // On remplace les créneaux libres du jour ; les créneaux déjà réservés sont conservés
      const { error: delErr } = await supabase
        .from('availability_slots')
        .delete()
        .eq('professional_id', userId)
        .eq('is_booked', false)
        .gte('start_at', startOfDay(date).toISOString())
        .lt('start_at', addDays(startOfDay(date), 1).toISOString())
      if (delErr) { showToast('❌ ' + delErr.message); setSaving(false); return }
      const booked = slots.filter(s => s.is_booked && sameDay(new Date(s.start_at), date))
      const rows = candidates
        .filter(c => !booked.some(b => new Date(b.start_at) < c.end && new Date(b.end_at) > c.start))
        .map(c => ({ professional_id: userId, start_at: c.start.toISOString(), end_at: c.end.toISOString(), is_booked: false }))
      if (rows.length) {
        const { error } = await supabase.from('availability_slots').insert(rows)
        if (error) { showToast('❌ ' + error.message); setSaving(false); return }
        total += rows.length
      }
    }
    setSaving(false)
    showToast(`✅ ${total} créneau${total > 1 ? 'x' : ''} ouvert${total > 1 ? 's' : ''}`)
    load()
  }

  const removeSlot = async (id) => {
    const { error } = await supabase.from('availability_slots').delete().eq('id', id).eq('is_booked', false)
    if (error) { showToast('❌ ' + error.message); return }
    setSlots(s => s.filter(x => x.id !== id))
  }

  const clearDay = async () => {
    if (!window.confirm('Supprimer tous les créneaux libres de cette journée ?')) return
    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('professional_id', userId)
      .eq('is_booked', false)
      .gte('start_at', startOfDay(selected).toISOString())
      .lt('start_at', addDays(startOfDay(selected), 1).toISOString())
    if (error) { showToast('❌ ' + error.message); return }
    showToast('Journée vidée')
    load()
  }

  const who = pro?.fname ? `Dr. ${pro.fname} ${pro.lname || ''}` : ''
  const free = daySlots.filter(s => !s.is_booked).length

  return (
    <DoctorShell nav={nav} active="pro-schedule" who={who} title="Mes créneaux"
      subtitle={`Ouvrez vos disponibilités : les patients réservent directement. Durée d'un RDV : ${duree} min (modifiable dans Profil).`}>

      {!pro?.validated && (
        <div className="pro-banner info"><Icon e="⏳" /> Vous pouvez préparer vos créneaux dès maintenant ; ils seront visibles après validation de votre profil.</div>
      )}

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
        {days.map(d => {
          const on = sameDay(d, selected)
          const n = slotsOf(d).length
          return (
            <button key={d.toISOString()} onClick={() => setSelected(d)}
              style={{
                flexShrink: 0, minWidth: 56, padding: '8px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                background: on ? 'var(--g)' : 'var(--card)', border: `1px solid ${on ? 'var(--g)' : 'var(--border)'}`,
                color: on ? '#001A12' : 'var(--white)', }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.8 }}>{JOURS[d.getDay()]}</div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{d.getDate()}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{n > 0 ? `${n} cr.` : MOIS[d.getMonth()]}</div>
            </button>
          )
        })}
      </div>

      <div className="pro-card">
        <div style={{ fontWeight: 700, marginBottom: 10, textTransform: 'capitalize' }}>
          {selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}><label className="form-label">Matin : début</label>
            <input className="form-input" type="time" value={debut} onChange={e => setDebut(e.target.value)} /></div>
          <div className="form-group" style={{ flex: 1 }}><label className="form-label">fin</label>
            <input className="form-input" type="time" value={fin} onChange={e => setFin(e.target.value)} /></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: '4px 0 10px', cursor: 'pointer' }}>
          <input type="checkbox" checked={apresMidi} onChange={e => setApresMidi(e.target.checked)} /> Après-midi aussi
        </label>
        {apresMidi && (
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}><label className="form-label">Après-midi : début</label>
              <input className="form-input" type="time" value={debut2} onChange={e => setDebut2(e.target.value)} /></div>
            <div className="form-group" style={{ flex: 1 }}><label className="form-label">fin</label>
              <input className="form-input" type="time" value={fin2} onChange={e => setFin2(e.target.value)} /></div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Répéter</label>
          <select className="form-select" value={repeat} onChange={e => setRepeat(Number(e.target.value))}>
            <option value={1}>Uniquement ce jour</option>
            <option value={2}>Ce jour et le même jour la semaine prochaine</option>
            <option value={4}>Le même jour pendant 4 semaines</option>
          </select>
        </div>
        <div style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 10 }}>
          {preview.length} créneau{preview.length > 1 ? 'x' : ''} de {duree} min{repeat > 1 ? ` × ${repeat} semaines` : ''}
          {preview.length > 0 && ` (${fmtHour(preview[0].start)} → ${fmtHour(preview[preview.length - 1].end)})`}
        </div>
        <button className="btn-submit" style={{ marginBottom: 0 }} disabled={saving || preview.length === 0} onClick={apply}>
          {saving ? 'Enregistrement…' : <><Icon name="calendar" size={17} /> Ouvrir ces créneaux</>}
        </button>
      </div>

      <div className="pro-row" style={{ justifyContent: 'space-between', margin: '14px 0 8px' }}>
        <div className="sec-label" style={{ margin: 0 }}>Créneaux du jour ({daySlots.length})</div>
        {free > 0 && <button className="pro-btn red" onClick={clearDay}>Vider la journée</button>}
      </div>
      {loading ? <Loader /> : daySlots.length === 0 ? (
        <div className="pro-card pro-empty"><div className="e"><Icon e="🗓️" /></div>Aucun créneau ce jour-là</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {daySlots.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10,
              background: s.is_booked ? 'rgba(0,201,141,.12)' : 'var(--card)', border: `1px solid ${s.is_booked ? 'rgba(0,201,141,.35)' : 'var(--border)'}`,
              fontWeight: 700, fontSize: 13,
            }}>
              {fmtHour(s.start_at)}
              {s.is_booked
                ? <span style={{ fontSize: 11.5, color: 'var(--g)' }}>réservé</span>
                : <button onClick={() => removeSlot(s.id)} aria-label="Supprimer"
                    style={{ background: 'none', border: 'none', color: '#FF8A8A', cursor: 'pointer', fontSize: 14, display: 'flex' }}><Icon name="x" size={16} /></button>}
            </div>
          ))}
        </div>
      )}
    </DoctorShell>
  )
}
