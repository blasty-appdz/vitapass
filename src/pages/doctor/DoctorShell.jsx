import { supabase } from '../../supabase'

// Cadre commun de l'espace professionnel : en-tête, contenu, navigation du bas.
const ITEMS = [
  { id: 'pro-dashboard', icon: '🏠', label: 'Accueil' },
  { id: 'pro-agenda', icon: '📅', label: 'Agenda' },
  { id: 'pro-patients', icon: '👥', label: 'Patients' },
  { id: 'pro-schedule', icon: '🗓️', label: 'Créneaux' },
  { id: 'pro-onboarding', icon: '👤', label: 'Profil' },
]

export default function DoctorShell({ nav, active, title, subtitle, who, children, hideNav = false }) {
  const logout = async () => {
    await supabase.auth.signOut()
    try { if ('caches' in window) await caches.delete('supabase-api-cache') } catch { /* ignore */ }
  }

  return (
    <div className="pro-app">
      <header className="pro-top">
        <div className="pro-top-in">
          <div className="pro-logo">Vita<span>Pass</span><small>Pro</small></div>
          {who && <div className="pro-who">{who}</div>}
          <button className="pro-logout" onClick={logout} style={who ? undefined : { marginLeft: 'auto' }}>
            {"🚪"} Déconnexion
          </button>
        </div>
      </header>

      <main className="pro-main">
        {title && <div className="pro-title">{title}</div>}
        {subtitle && <div className="pro-sub">{subtitle}</div>}
        {children}
      </main>

      {!hideNav && (
        <nav className="pro-nav">
          <div className="pro-nav-in">
            {ITEMS.map(it => (
              <button
                key={it.id}
                className={`pro-ni${active === it.id ? ' active' : ''}`}
                onClick={() => nav(it.id)}
              >
                <span className="ico">{it.icon}</span>
                <span>{it.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}

// Petites aides partagées par les écrans médecin
export function fullName(p) {
  if (!p) return 'Patient'
  return `${p.fname || ''} ${p.lname || ''}`.trim() || 'Patient'
}

export function ageOf(dob) {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d)) return null
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

export function Loader({ label = 'Chargement…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 48, color: 'var(--dim)', fontSize: 13 }}>
      <div className="spin" />
      {label}
    </div>
  )
}
