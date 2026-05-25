import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const SECTIONS = [
  { key: 'groupe_sanguin',    label: 'Groupe sanguin',     icon: '🩸', critical: true  },
  { key: 'allergies',         label: 'Allergies',          icon: '⚠️', critical: true  },
  { key: 'medicaments',       label: 'Médicaments',        icon: '💊', critical: true  },
  { key: 'antecedents',       label: 'Antécédents',        icon: '📋', critical: false },
  { key: 'maladies_chroniques', label: 'Maladies chroniques', icon: '🏥', critical: false },
  { key: 'contact_urgence',   label: 'Contact d\'urgence', icon: '📞', critical: true  },
]

export default function EmergencyPublicPage({ token }) {
  const [dossier, setDossier] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!token) { setError('Token manquant.'); setLoading(false); return }
    fetchDossier()
  }, [token])

  async function fetchDossier() {
    setLoading(true)
    setError(null)

    const { data: dos, error: e1 } = await supabase
      .from('dossiers')
      .select('*')
      .eq('urgence_token', token)
      .eq('urgence_public', true)
      .maybeSingle()

    if (e1 || !dos) {
      setError('Dossier introuvable ou accès urgence non activé.')
      setLoading(false)
      return
    }

    setDossier(dos)

    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name, date_naissance, photo_url')
      .eq('id', dos.user_id)
      .maybeSingle()

    setProfile(prof)
    setLoading(false)
  }

  function calcAge(dateStr) {
    if (!dateStr) return null
    const diff = Date.now() - new Date(dateStr).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={{ color: '#fff', marginTop: 16 }}>Chargement du dossier…</p>
    </div>
  )

  if (error) return (
    <div style={styles.center}>
      <div style={styles.errorBox}>
        <span style={{ fontSize: 48 }}>🚫</span>
        <h2 style={{ color: '#ef4444', margin: '12px 0 8px' }}>Accès impossible</h2>
        <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: 14 }}>{error}</p>
        <p style={{ color: '#64748b', fontSize: 12, marginTop: 12 }}>
          Le patient doit activer le partage urgence dans son application VitaPass.
        </p>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      {/* Header urgence */}
      <div style={styles.header}>
        <div style={styles.badge}>🚨 URGENCE MÉDICALE</div>
        <p style={styles.headerSub}>Données de santé critiques — Accès secouriste</p>
      </div>

      {/* Identité patient */}
      <div style={styles.card}>
        <div style={styles.patientRow}>
          {profile?.photo_url
            ? <img src={profile.photo_url} alt="patient" style={styles.avatar} />
            : <div style={styles.avatarPlaceholder}>👤</div>
          }
          <div>
            <div style={styles.patientName}>{profile?.full_name || 'Nom inconnu'}</div>
            {profile?.date_naissance && (
              <div style={styles.patientAge}>
                {calcAge(profile.date_naissance)} ans
                <span style={styles.dob}> · né(e) le {new Date(profile.date_naissance).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Données critiques en priorité */}
      {SECTIONS.filter(s => s.critical).map(section => (
        <DataCard key={section.key} section={section} dossier={dossier} critical />
      ))}

      {/* Séparateur */}
      <div style={styles.separator}>
        <span style={styles.separatorText}>Informations complémentaires</span>
      </div>

      {/* Données secondaires */}
      {SECTIONS.filter(s => !s.critical).map(section => (
        <DataCard key={section.key} section={section} dossier={dossier} />
      ))}

      {/* Footer */}
      <div style={styles.footer}>
        <img
          src="https://vitapass.app/vitapass-icon.png"
          alt="VitaPass"
          style={{ width: 28, height: 28, borderRadius: 6, marginBottom: 6 }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <p style={styles.footerText}>Dossier médical sécurisé par <strong>VitaPass</strong></p>
        <p style={styles.footerSub}>Ces données sont partagées avec le consentement explicite du patient.</p>
        <p style={styles.footerTime}>Consulté le {new Date().toLocaleString('fr-FR')}</p>
      </div>
    </div>
  )
}

function DataCard({ section, dossier, critical }) {
  const value = dossier?.[section.key]
  const isEmpty = !value || (typeof value === 'string' && value.trim() === '') ||
                  (Array.isArray(value) && value.length === 0)

  return (
    <div style={{ ...styles.card, ...(critical ? styles.cardCritical : {}) }}>
      <div style={styles.cardHeader}>
        <span style={styles.cardIcon}>{section.icon}</span>
        <span style={styles.cardLabel}>{section.label}</span>
        {critical && <span style={styles.criticalBadge}>CRITIQUE</span>}
      </div>
      <div style={styles.cardValue}>
        {isEmpty
          ? <span style={styles.empty}>Non renseigné</span>
          : Array.isArray(value)
            ? value.map((v, i) => <div key={i} style={styles.tag}>{v}</div>)
            : <span style={{ color: '#f1f5f9', fontSize: 15 }}>{value}</span>
        }
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    padding: '0 0 40px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  center: {
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#0f172a',
  },
  spinner: {
    width: 48, height: 48,
    border: '4px solid #1e293b',
    borderTop: '4px solid #ef4444',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    background: '#1e293b',
    borderRadius: 16, padding: '32px 24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    maxWidth: 340, margin: '0 16px',
    border: '1px solid #ef444440',
  },
  header: {
    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
    padding: '24px 20px 20px',
    textAlign: 'center',
    borderBottom: '1px solid #ef444430',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    fontWeight: 800, fontSize: 18,
    letterSpacing: 1,
    padding: '8px 20px',
    borderRadius: 40,
    border: '1px solid rgba(255,255,255,0.3)',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13, marginTop: 8, marginBottom: 0,
  },
  card: {
    background: '#1e293b',
    margin: '12px 16px 0',
    borderRadius: 14,
    padding: '14px 16px',
    border: '1px solid #334155',
  },
  cardCritical: {
    border: '1px solid #ef444450',
    background: '#1a1a2e',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  cardIcon: { fontSize: 20 },
  cardLabel: { color: '#94a3b8', fontSize: 13, fontWeight: 600, flex: 1 },
  criticalBadge: {
    background: '#ef44441a',
    color: '#ef4444',
    fontSize: 10, fontWeight: 700,
    padding: '2px 8px', borderRadius: 20,
    border: '1px solid #ef444430',
    letterSpacing: 0.5,
  },
  cardValue: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tag: {
    background: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 8, padding: '4px 10px',
    fontSize: 13, border: '1px solid #334155',
  },
  empty: { color: '#475569', fontSize: 13, fontStyle: 'italic' },
  patientRow: { display: 'flex', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ef4444' },
  avatarPlaceholder: {
    width: 56, height: 56, borderRadius: '50%',
    background: '#0f172a', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 28, border: '2px solid #334155',
  },
  patientName: { color: '#f1f5f9', fontSize: 20, fontWeight: 700 },
  patientAge:  { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  dob: { color: '#64748b', fontSize: 12 },
  separator: {
    display: 'flex', alignItems: 'center',
    margin: '20px 16px 4px',
    gap: 10,
  },
  separatorText: {
    color: '#475569', fontSize: 11,
    fontWeight: 600, letterSpacing: 1,
    textTransform: 'uppercase', whiteSpace: 'nowrap',
  },
  footer: {
    margin: '32px 16px 0',
    padding: '20px',
    background: '#0f172a',
    borderRadius: 14,
    border: '1px solid #1e293b',
    textAlign: 'center',
  },
  footerText:  { color: '#64748b', fontSize: 13, margin: '0 0 4px' },
  footerSub:   { color: '#475569', fontSize: 11, margin: '0 0 8px' },
  footerTime:  { color: '#334155', fontSize: 11, margin: 0 },
}