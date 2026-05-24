import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function formatHeure(dateStr) {
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function BookingScreen({ nav, navParams, showToast }) {
  const [pro, setPro] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [motif, setMotif] = useState('')
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [step, setStep] = useState(1) // 1=choisir créneau, 2=confirmer

  useEffect(() => {
    if (navParams?.proId) {
      loadPro(navParams.proId)
      loadSlots(navParams.proId)
    }
  }, [navParams])

  const loadPro = async (id) => {
    const { data } = await supabase
      .from('professionals')
      .select('id, fname, lname, gender, specialite, tarif, duree_rdv')
      .eq('id', id)
      .maybeSingle()
    setPro(data)
  }

  const loadSlots = async (id) => {
    setLoading(true)
    const now = new Date().toISOString()
    const { data } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('professional_id', id)
      .eq('is_booked', false)
      .gte('start_at', now)
      .order('start_at')
    setSlots(data || [])

    // Sélectionner le premier jour disponible par défaut
    if (data && data.length > 0) {
      setSelectedDay(new Date(data[0].start_at))
    }
    setLoading(false)
  }

  // Jours uniques disponibles
  const availableDays = slots.reduce((acc, slot) => {
    const d = new Date(slot.start_at)
    if (!acc.find(x => isSameDay(x, d))) acc.push(d)
    return acc
  }, [])

  // Créneaux du jour sélectionné
  const slotsOfDay = selectedDay
    ? slots.filter(s => isSameDay(new Date(s.start_at), selectedDay))
    : []

  const handleConfirm = async () => {
    if (!selectedSlot) return
    setBooking(true)

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Créer le RDV
    const { error } = await supabase.from('appointments').insert({
      patient_id: user.id,
      professional_id: pro.id,
      slot_id: selectedSlot.id,
      start_at: selectedSlot.start_at,
      end_at: selectedSlot.end_at,
      status: 'confirmed',
      motif: motif || null,
    })

    if (error) {
      showToast('❌ Erreur : ' + error.message)
      setBooking(false)
      return
    }

    // 2. Marquer le créneau comme réservé
    await supabase
      .from('availability_slots')
      .update({ is_booked: true })
      .eq('id', selectedSlot.id)

    showToast('✅ Rendez-vous confirmé !')
    setBooking(false)
    nav('appointments')
  }

  if (loading) return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => nav('search')}>←</div>
        <div className="shdr-title">Prendre RDV</div>
      </div>
      <div className="loading">⏳ Chargement des créneaux...</div>
    </div>
  )

  return (
    <div className="screen" style={{ display: 'flex' }}>

      {/* HEADER */}
      <div className="screen-hdr">
        <div className="back-btn" onClick={() => step === 2 ? setStep(1) : nav('pro-profile', { proId: navParams?.proId })}>←</div>
        <div className="shdr-title">Prendre RDV</div>
      </div>

      {/* RECAP PRO */}
      {pro && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: 14, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(77,159,236,.1)', border: '1px solid rgba(77,159,236,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
          }}>
            {pro.gender === 'Féminin' ? '👩‍⚕️' : '👨‍⚕️'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>
              Dr. {pro.fname} {pro.lname}
            </div>
            <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 2 }}>{pro.specialite}</div>
          </div>
          {pro.tarif && (
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: 'var(--g)' }}>
              {pro.tarif} DA
            </div>
          )}
        </div>
      )}

      {/* ÉTAPE 1 : CHOISIR UN CRÉNEAU */}
      {step === 1 && (
        <>
          {slots.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 24 }}>
              <div className="empty-icon">📅</div>
              <p>Aucun créneau disponible</p>
              <p style={{ marginTop: 8, fontSize: 12 }}>Ce médecin n'a pas encore ajouté de disponibilités</p>
            </div>
          ) : (
            <>
              {/* SÉLECTION DU JOUR */}
              <div className="dsect-title">Choisir une date</div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
                {availableDays.map((day, i) => {
                  const isSelected = selectedDay && isSameDay(day, selectedDay)
                  return (
                    <div
                      key={i}
                      onClick={() => { setSelectedDay(day); setSelectedSlot(null) }}
                      style={{
                        flexShrink: 0,
                        background: isSelected ? 'var(--g)' : 'var(--card)',
                        border: `1px solid ${isSelected ? 'var(--g)' : 'var(--border)'}`,
                        borderRadius: 12, padding: '10px 14px',
                        textAlign: 'center', cursor: 'pointer', minWidth: 60
                      }}
                    >
                      <div style={{
                        fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700,
                        color: isSelected ? '#001A12' : 'var(--dim)',
                        textTransform: 'uppercase', letterSpacing: 1
                      }}>
                        {JOURS[day.getDay()]}
                      </div>
                      <div style={{
                        fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800,
                        color: isSelected ? '#001A12' : 'var(--white)', marginTop: 2
                      }}>
                        {day.getDate()}
                      </div>
                      <div style={{
                        fontSize: 10, color: isSelected ? '#001A12' : 'var(--dim)', marginTop: 2
                      }}>
                        {MOIS[day.getMonth()]}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* CRÉNEAUX DU JOUR */}
              {selectedDay && (
                <>
                  <div className="dsect-title">
                    Créneaux du {formatDateLabel(selectedDay.toISOString())}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    {slotsOfDay.map(slot => {
                      const isSelected = selectedSlot?.id === slot.id
                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            background: isSelected ? 'var(--g)' : 'var(--card)',
                            border: `1px solid ${isSelected ? 'var(--g)' : 'var(--border)'}`,
                            borderRadius: 10, padding: '8px 16px',
                            fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700,
                            color: isSelected ? '#001A12' : 'var(--white)',
                            cursor: 'pointer'
                          }}
                        >
                          {formatHeure(slot.start_at)}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <button
                className="btn-submit"
                disabled={!selectedSlot}
                onClick={() => setStep(2)}
                style={{ opacity: selectedSlot ? 1 : 0.4 }}
              >
                Continuer →
              </button>
            </>
          )}
        </>
      )}

      {/* ÉTAPE 2 : CONFIRMER */}
      {step === 2 && selectedSlot && (
        <>
          <div className="dsect-title">Récapitulatif</div>
          <div className="pinfo-list" style={{ marginBottom: 14 }}>
            <div className="pinfo-row">
              <span className="pi-key">Date</span>
              <span className="pi-val">{formatDateLabel(selectedSlot.start_at)}</span>
            </div>
            <div className="pinfo-row">
              <span className="pi-key">Heure</span>
              <span className="pi-val">{formatHeure(selectedSlot.start_at)}</span>
            </div>
            <div className="pinfo-row">
              <span className="pi-key">Médecin</span>
              <span className="pi-val">Dr. {pro?.fname} {pro?.lname}</span>
            </div>
            {pro?.tarif && (
              <div className="pinfo-row">
                <span className="pi-key">Tarif</span>
                <span className="pi-val" style={{ color: 'var(--g)' }}>{pro.tarif} DA</span>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Motif de consultation (optionnel)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Ex: Consultation de routine, renouvellement d'ordonnance..."
              value={motif}
              onChange={e => setMotif(e.target.value)}
              style={{ resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          <button
            className="btn-submit"
            onClick={handleConfirm}
            disabled={booking}
            style={{ fontSize: 15, padding: 16, marginBottom: 8 }}
          >
            {booking ? '⏳ Confirmation...' : '✅ Confirmer le rendez-vous'}
          </button>
          <button className="btn-cancel" onClick={() => setStep(1)}>
            ← Changer de créneau
          </button>
        </>
      )}

      <div className="pad-b" />
    </div>
  )
}