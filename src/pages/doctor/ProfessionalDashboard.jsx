import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'

export default function ProfessionalDashboard({ nav }) {
  const [userId, setUserId] = useState(null)
  const [profil, setProfil] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState('aujourdhui')
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const charger = useCallback(async (uid) => {
    setLoading(true)
    try {
      const { data: pro } = await supabase
        .from('professionals')
        .select('id, fname, lname, specialite, wilaya, validated, is_available, tarif, duree_rdv')
        .eq('id', uid)
        .maybeSingle()
      setProfil(pro)

      const { data: rdvs } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', uid)
        .order('scheduled_at', { ascending: true })
      setAppointments(rdvs || [])
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
        charger(data.user.id)
      }
    })
  }, [charger])

  const toggleDisponibilite = async () => {
    const nouveau = !profil.is_available
    await supabase
      .from('professionals')
      .update({ is_available: nouveau, updated_at: new Date().toISOString() })
      .eq('id', userId)
    setProfil(p => ({ ...p, is_available: nouveau }))
    showToast(nouveau ? '✅ Vous êtes maintenant disponible' : '⏸️ Vous êtes en pause')
  }

  const changerStatutRdv = async (rdvId, statut) => {
    await supabase
      .from('appointments')
      .update({ status: statut })
      .eq('id', rdvId)
    setAppointments(a => a.map(r => r.id === rdvId ? { ...r, status: statut } : r))
    showToast(statut === 'confirmed' ? '✅ RDV confirmé' : '❌ RDV annulé')
  }

  const filtrerRdvs = () => {
    const now = new Date()
    const debutAujourdhui = new Date(now)
    debutAujourdhui.setHours(0, 0, 0, 0)
    const finAujourdhui = new Date(now)
    finAujourdhui.setHours(23, 59, 59, 999)

    if (onglet === 'aujourdhui') {
      return appointments.filter(r => {
        const d = new Date(r.scheduled_at)
        return d >= debutAujourdhui && d <= finAujourdhui
      })
    }
    if (onglet === 'avenir') {
      return appointments.filter(r => new Date(r.scheduled_at) > finAujourdhui)
    }
    if (onglet === 'passes') {
      return appointments.filter(r => new Date(r.scheduled_at) < debutAujourdhui)
    }
    return appointments
  }

  const rdvsFiltres = filtrerRdvs()

  const stats = {
    aujourdhui: appointments.filter(r => {
      const d = new Date(r.scheduled_at)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    }).length,
    total: appointments.length,
    confirmes: appointments.filter(r => r.status === 'confirmed').length,
    annules: appointments.filter(r => r.status === 'cancelled').length,
  }

  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={{ color: '#6b7280', marginTop: 16 }}>Chargement...</p>
    </div>
  )

  const profilIncomplet = profil && (!profil.fname || !profil.specialite || !profil.wilaya)

  return (
    <div style={styles.container}>
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* Alerte profil incomplet */}
      {profilIncomplet && (
        <div style={styles.alerteBanner}>
          ⚠️ Votre profil est incomplet — complétez-le pour apparaître dans les recherches.
          <button style={styles.alerteBtn} onClick={() => nav('doctor-onboarding')}>
            Compléter →
          </button>
        </div>
      )}

      {/* Header profil */}
      <div style={styles.profilHeader}>
        <div style={styles.avatar}>
          {profil?.fname ? profil.fname[0].toUpperCase() : '?'}
        </div>
        <div style={styles.profilInfo}>
          <h1 style={styles.profilNom}>
            Dr. {profil?.fname || '—'} {profil?.lname || '—'}
          </h1>
          <p style={styles.profilSpec}>{profil?.specialite || 'Spécialité non renseignée'}</p>
          <p style={styles.profilWilaya}>📍 {profil?.wilaya || 'Wilaya non renseignée'}</p>
        </div>
        <div style={styles.profilActions}>
          <div style={{
            ...styles.statusBadge,
            background: profil?.validated ? '#dcfce7' : '#fef9c3',
            color: profil?.validated ? '#16a34a' : '#92400e'
          }}>
            {profil?.validated ? '✓ Validé' : '⏳ En attente de validation'}
          </div>
          <button
            style={{
              ...styles.dispoBtn,
              background: profil?.is_available ? '#2563eb' : '#6b7280'
            }}
            onClick={toggleDisponibilite}>
            {profil?.is_available ? '🟢 Disponible' : '⏸️ En pause'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <StatCard label="Aujourd'hui" value={stats.aujourdhui} icon="📅" color="#dbeafe" />
        <StatCard label="Total RDV" value={stats.total} icon="🗓️" color="#f0fdf4" />
        <StatCard label="Confirmés" value={stats.confirmes} icon="✅" color="#dcfce7" />
        <StatCard label="Annulés" value={stats.annules} icon="❌" color="#fef2f2" />
      </div>

      {/* Actions rapides */}
      <div style={styles.actionsRapides}>
        <button style={styles.actionBtn} onClick={() => nav('doctor-schedule')}>
          🗓️ Gérer mes créneaux
        </button>
        <button style={styles.actionBtn} onClick={() => nav('doctor-onboarding')}>
          ✏️ Modifier mon profil
        </button>
      </div>

      {/* Liste RDV */}
      <div style={styles.card}>
        {/* Onglets */}
        <div style={styles.onglets}>
          {[
            { id: 'aujourdhui', label: "Aujourd'hui" },
            { id: 'avenir', label: 'À venir' },
            { id: 'passes', label: 'Passés' },
          ].map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              style={{
                ...styles.ongletBtn,
                borderBottom: onglet === o.id ? '2px solid #2563eb' : '2px solid transparent',
                color: onglet === o.id ? '#2563eb' : '#6b7280',
                fontWeight: onglet === o.id ? 700 : 400,
              }}>
              {o.label}
            </button>
          ))}
        </div>

        {rdvsFiltres.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: 32 }}>📭</p>
            <p>Aucun rendez-vous {onglet === 'aujourdhui' ? "aujourd'hui" : onglet === 'avenir' ? 'à venir' : 'passé'}</p>
          </div>
        ) : (
          <div style={styles.rdvList}>
            {rdvsFiltres.map(rdv => {
              const date = new Date(rdv.scheduled_at)
              const dateStr = date.toLocaleDateString('fr-FR', {
                weekday: 'long', day: '2-digit', month: 'long'
              })
              const heureStr = date.toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit'
              })
              const statusColor = {
                pending: { bg: '#fef9c3', color: '#92400e', label: '⏳ En attente' },
                confirmed: { bg: '#dcfce7', color: '#16a34a', label: '✅ Confirmé' },
                cancelled: { bg: '#fef2f2', color: '#dc2626', label: '❌ Annulé' },
                completed: { bg: '#f0f9ff', color: '#0369a1', label: '✓ Terminé' },
              }[rdv.status] || { bg: '#f3f4f6', color: '#374151', label: rdv.status }

              return (
                <div key={rdv.id} style={styles.rdvCard}>
                  <div style={styles.rdvLeft}>
                    <div style={styles.rdvDateTime}>
                      <span style={styles.rdvHeure}>{heureStr}</span>
                      <span style={styles.rdvDate}>{dateStr}</span>
                    </div>
                    <div style={styles.rdvPatient}>
                      <span style={styles.rdvPatientNom}>
                        👤 Patient #{rdv.patient_id?.slice(0, 8) || '—'}
                      </span>
                      {rdv.notes && (
                        <span style={styles.rdvNotes}>💬 {rdv.notes}</span>
                      )}
                    </div>
                  </div>
                  <div style={styles.rdvRight}>
                    <span style={{
                      ...styles.rdvStatus,
                      background: statusColor.bg,
                      color: statusColor.color
                    }}>
                      {statusColor.label}
                    </span>
                    {rdv.status === 'pending' && (
                      <div style={styles.rdvBtns}>
                        <button style={styles.btnConfirmer}
                          onClick={() => changerStatutRdv(rdv.id, 'confirmed')}>
                          Confirmer
                        </button>
                        <button style={styles.btnAnnuler}
                          onClick={() => changerStatutRdv(rdv.id, 'cancelled')}>
                          Annuler
                        </button>
                      </div>
                    )}
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

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ ...styles.statCard, background: color }}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', padding: '24px 16px', fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '0 auto' },
  centered: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  spinner: { width: 36, height: 36, border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 1000 },
  alerteBanner: { background: '#fef9c3', border: '1px solid #fde68a', color: '#92400e', padding: '12px 16px', borderRadius: 10, fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  alerteBtn: { background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
  profilHeader: { display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  avatar: { width: 60, height: 60, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, flexShrink: 0 },
  profilInfo: { flex: 1 },
  profilNom: { fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 },
  profilSpec: { fontSize: 14, color: '#2563eb', fontWeight: 600, margin: '2px 0' },
  profilWilaya: { fontSize: 13, color: '#6b7280', margin: 0 },
  profilActions: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  statusBadge: { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 },
  dispoBtn: { color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 },
  statCard: { borderRadius: 12, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 28, fontWeight: 800, color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: 600 },
  actionsRapides: { display: 'flex', gap: 12, marginBottom: 20 },
  actionBtn: { flex: 1, padding: '12px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151' },
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  onglets: { display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20 },
  ongletBtn: { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' },
  empty: { textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: 14 },
  rdvList: { display: 'flex', flexDirection: 'column', gap: 12 },
  rdvCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', borderRadius: 10, border: '1.5px solid #e5e7eb', gap: 12 },
  rdvLeft: { display: 'flex', gap: 16, alignItems: 'flex-start' },
  rdvDateTime: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 50 },
  rdvHeure: { fontSize: 16, fontWeight: 800, color: '#2563eb' },
  rdvDate: { fontSize: 11, color: '#6b7280', textAlign: 'center' },
  rdvPatient: { display: 'flex', flexDirection: 'column', gap: 4 },
  rdvPatientNom: { fontSize: 14, fontWeight: 600, color: '#111827' },
  rdvNotes: { fontSize: 12, color: '#6b7280' },
  rdvRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  rdvStatus: { fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 },
  rdvBtns: { display: 'flex', gap: 6 },
  btnConfirmer: { background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  btnAnnuler: { background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
}
