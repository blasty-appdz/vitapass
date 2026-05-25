import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function getDateDuJour(jourIndex) {
  const today = new Date()
  const currentDay = today.getDay() === 0 ? 7 : today.getDay()
  const diff = jourIndex + 1 - currentDay
  const date = new Date(today)
  date.setDate(today.getDate() + diff)
  return date
}

function formatDate(date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function genererCreneaux(heureDebut, heureFin, duree) {
  const creneaux = []
  const [hD, mD] = heureDebut.split(':').map(Number)
  const [hF, mF] = heureFin.split(':').map(Number)
  let totalMinutes = hD * 60 + mD
  const finMinutes = hF * 60 + mF
  while (totalMinutes + duree <= finMinutes) {
    const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0')
    const m = (totalMinutes % 60).toString().padStart(2, '0')
    const endTotal = totalMinutes + duree
    const hE = Math.floor(endTotal / 60).toString().padStart(2, '0')
    const mE = (endTotal % 60).toString().padStart(2, '0')
    creneaux.push({ start: `${h}:${m}`, end: `${hE}:${mE}` })
    totalMinutes += duree
  }
  return creneaux
}

export default function ProfessionalSchedule() {
  const [userId, setUserId] = useState(null)
  const [dureeRdv, setDureeRdv] = useState(30)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [jourActif, setJourActif] = useState(0)

  const [config, setConfig] = useState(
    JOURS.map(() => ({ actif: false, debut: '08:00', fin: '17:00' }))
  )

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const chargerDonnees = useCallback(async (uid) => {
    setLoading(true)
    try {
      const { data: pro } = await supabase
        .from('professionals')
        .select('duree_rdv')
        .eq('id', uid)
        .maybeSingle()
      if (pro) setDureeRdv(pro.duree_rdv || 30)

      const debut = new Date()
      debut.setHours(0, 0, 0, 0)
      const fin = new Date()
      fin.setDate(fin.getDate() + 14)

      const { data: existingSlots } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('professional_id', uid)
        .gte('start_at', debut.toISOString())
        .lte('start_at', fin.toISOString())

      setSlots(existingSlots || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id)
        chargerDonnees(data.user.id)
      }
    })
  }, [chargerDonnees])

  const appliquerJour = async (jourIndex) => {
    const cfg = config[jourIndex]
    if (!cfg.actif) return
    setSaving(true)
    try {
      const date = getDateDuJour(jourIndex)
      const creneaux = genererCreneaux(cfg.debut, cfg.fin, dureeRdv)
      if (creneaux.length === 0) {
        showToast('⚠️ Aucun créneau généré — vérifiez les heures')
        return
      }

      // Supprimer les anciens créneaux non réservés du jour
      const debutJour = new Date(date)
      debutJour.setHours(0, 0, 0, 0)
      const finJour = new Date(date)
      finJour.setHours(23, 59, 59, 999)

      await supabase
        .from('availability_slots')
        .delete()
        .eq('professional_id', userId)
        .eq('is_booked', false)
        .gte('start_at', debutJour.toISOString())
        .lte('start_at', finJour.toISOString())

      // Insérer les nouveaux
      const inserts = creneaux.map(c => {
        const startAt = new Date(date)
        const [sh, sm] = c.start.split(':').map(Number)
        startAt.setHours(sh, sm, 0, 0)
        const endAt = new Date(date)
        const [eh, em] = c.end.split(':').map(Number)
        endAt.setHours(eh, em, 0, 0)
        return {
          professional_id: userId,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          is_booked: false
        }
      })

      await supabase.from('availability_slots').insert(inserts)
      showToast(`✅ ${creneaux.length} créneaux ajoutés pour ${JOURS[jourIndex]}`)
      chargerDonnees(userId)
    } catch (e) {
      showToast('❌ Erreur : ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const supprimerSlot = async (slotId) => {
    await supabase.from('availability_slots').delete().eq('id', slotId)
    setSlots(s => s.filter(x => x.id !== slotId))
    showToast('🗑️ Créneau supprimé')
  }

  const slotsParJour = (jourIndex) => {
    const date = getDateDuJour(jourIndex)
    const dateStr = date.toDateString()
    return slots.filter(s => new Date(s.start_at).toDateString() === dateStr)
  }

  const setConfigJour = (jourIndex, field, value) => {
    setConfig(cfg => cfg.map((c, i) => i === jourIndex ? { ...c, [field]: value } : c))
  }

  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={{ color: '#6b7280', marginTop: 16 }}>Chargement de vos créneaux...</p>
    </div>
  )

  const cfg = config[jourActif]
  const preview = cfg.actif ? genererCreneaux(cfg.debut, cfg.fin, dureeRdv) : []
  const slotsJour = slotsParJour(jourActif)
  const dateJour = getDateDuJour(jourActif)

  return (
    <div style={styles.container}>
      {toast && <div style={styles.toast}>{toast}</div>}

      <div style={styles.header}>
        <h1 style={styles.title}>🗓️ Mes créneaux</h1>
        <p style={styles.subtitle}>Gérez vos disponibilités pour les 2 prochaines semaines</p>
      </div>

      {/* Sélecteur de jours */}
      <div style={styles.jourSelector}>
        {JOURS.map((jour, i) => {
          const d = getDateDuJour(i)
          const count = slotsParJour(i).length
          return (
            <button key={i} onClick={() => setJourActif(i)}
              style={{
                ...styles.jourBtn,
                background: jourActif === i ? '#2563eb' : '#fff',
                color: jourActif === i ? '#fff' : '#374151',
                borderColor: jourActif === i ? '#2563eb' : '#e5e7eb',
              }}>
              <span style={{ fontSize: 11, opacity: 0.8 }}>{jour.slice(0, 3)}</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{d.getDate()}</span>
              {count > 0 && (
                <span style={{
                  ...styles.badge,
                  background: jourActif === i ? 'rgba(255,255,255,0.3)' : '#dbeafe',
                  color: jourActif === i ? '#fff' : '#1d4ed8'
                }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      <div style={styles.body}>
        {/* Panel gauche — Configuration */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            {JOURS[jourActif]} {formatDate(dateJour)}
          </h2>

          <label style={styles.switchRow}>
            <input type="checkbox" checked={cfg.actif}
              onChange={e => setConfigJour(jourActif, 'actif', e.target.checked)} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {cfg.actif ? '✅ Jour actif' : '❌ Jour inactif'}
            </span>
          </label>

          {cfg.actif && (
            <>
              <div style={styles.row}>
                <div style={styles.col}>
                  <label style={styles.label}>Début</label>
                  <input type="time" style={styles.input} value={cfg.debut}
                    onChange={e => setConfigJour(jourActif, 'debut', e.target.value)} />
                </div>
                <div style={styles.col}>
                  <label style={styles.label}>Fin</label>
                  <input type="time" style={styles.input} value={cfg.fin}
                    onChange={e => setConfigJour(jourActif, 'fin', e.target.value)} />
                </div>
              </div>

              <label style={styles.label}>Durée par RDV</label>
              <select style={styles.input} value={dureeRdv}
                onChange={e => setDureeRdv(Number(e.target.value))}>
                {[15, 20, 30, 45, 60].map(d => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>

              {preview.length > 0 && (
                <div style={styles.preview}>
                  <p style={styles.previewTitle}>
                    Aperçu — {preview.length} créneau{preview.length > 1 ? 'x' : ''}
                  </p>
                  <div style={styles.previewGrid}>
                    {preview.map((c, i) => (
                      <span key={i} style={styles.previewChip}>
                        {c.start}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button style={styles.btnPrimary} onClick={() => appliquerJour(jourActif)}
                disabled={saving}>
                {saving ? 'Enregistrement...' : `📅 Appliquer ${preview.length} créneaux`}
              </button>
            </>
          )}
        </div>

        {/* Panel droit — Créneaux existants */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            Créneaux enregistrés ({slotsJour.length})
          </h2>
          {slotsJour.length === 0 ? (
            <div style={styles.empty}>
              <p>Aucun créneau pour ce jour</p>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                Activez le jour et cliquez sur "Appliquer"
              </p>
            </div>
          ) : (
            <div style={styles.slotList}>
              {slotsJour
                .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
                .map(slot => {
                  const start = new Date(slot.start_at)
                  const end = new Date(slot.end_at)
                  const hStart = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  const hEnd = end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={slot.id} style={{
                      ...styles.slotRow,
                      background: slot.is_booked ? '#f0fdf4' : '#fff',
                      borderColor: slot.is_booked ? '#86efac' : '#e5e7eb'
                    }}>
                      <span style={styles.slotTime}>{hStart} – {hEnd}</span>
                      {slot.is_booked
                        ? <span style={styles.bookedBadge}>✓ Réservé</span>
                        : <button style={styles.deleteBtn}
                            onClick={() => supprimerSlot(slot.id)}>✕</button>
                      }
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  spinner: { width: 36, height: 36, border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 },
  subtitle: { color: '#6b7280', fontSize: 14, margin: '4px 0 0' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  jourSelector: { display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 },
  jourBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px', borderRadius: 12, border: '1.5px solid', cursor: 'pointer', minWidth: 56, gap: 2, flexShrink: 0, transition: 'all 0.15s' },
  badge: { fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, marginTop: 2 },
  body: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 17, fontWeight: 700, color: '#111827', marginTop: 0, marginBottom: 20 },
  switchRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' },
  row: { display: 'flex', gap: 12 },
  col: { flex: 1 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', background: '#fafafa' },
  preview: { background: '#eff6ff', borderRadius: 10, padding: 14, marginTop: 16 },
  previewTitle: { fontSize: 13, fontWeight: 600, color: '#1d4ed8', margin: '0 0 10px' },
  previewGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  previewChip: { background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  btnPrimary: { width: '100%', marginTop: 20, padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: 14 },
  slotList: { display: 'flex', flexDirection: 'column', gap: 8 },
  slotRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, border: '1.5px solid' },
  slotTime: { fontSize: 14, fontWeight: 600, color: '#374151' },
  bookedBadge: { fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: 20 },
  deleteBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, fontWeight: 700, padding: '2px 6px' },
}
