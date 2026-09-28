import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { useTranslation } from 'react-i18next'
import { useOffline, clearOffline } from './hooks/useOffline'
import { useOfflineProfile, useOfflineDossier, useOfflineAppointments } from './hooks/useOfflineData'

// Styles VitaPass
import './styles/vitapass.css'

// Composants communs
import Toast from './components/common/Toast'

// Pages Auth
import AuthScreen from './pages/auth/AuthScreen'
import ResetPasswordScreen from './pages/auth/ResetPasswordScreen'

// Pages Patient
import HomeScreen from './pages/patient/HomeScreen'
import QRScreen from './pages/patient/QRScreen'
import DossierScreen from './pages/patient/DossierScreen'
import SuiviScreen from './pages/patient/SuiviScreen'
import DoctorsScreen from './pages/patient/DoctorsScreen'
import ProfileScreen from './pages/patient/ProfileScreen'
import OnboardingScreen from './pages/patient/OnboardingScreen'
import SearchScreen from './pages/patient/SearchScreen'
import ProProfileScreen from './pages/patient/ProProfileScreen'
import BookingScreen from './pages/patient/BookingScreen'
import AppointmentsScreen from './pages/patient/AppointmentsScreen'

// Pages Médecin
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import PatientRecord from './pages/doctor/PatientRecord'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import ProfessionalOnboarding from './pages/doctor/ProfessionalOnboarding'
import ProfessionalSchedule from './pages/doctor/ProfessionalSchedule'
import ProfessionalDashboard from './pages/doctor/ProfessionalDashboard'

// Autres pages
import EmergencyPublicPage from './pages/EmergencyPublicPage'
import LandingScreen from './pages/LandingScreen'
import PrivacyScreen from './pages/PrivacyScreen'
import Icon from './components/common/Icon'

export default function App() {
  const { t } = useTranslation()
  const { isOffline } = useOffline()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [screen, setScreen] = useState('home')
  const [navParams, setNavParams] = useState({})
  const [splash, setSplash] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [doctorCount, setDoctorCount] = useState(0)
  const [notifs, setNotifs] = useState([])
  const [emergencyToken, setEmergencyToken] = useState(null)
  const [isRecovery] = useState(() => window.location.hash.includes('type=recovery'))
  const [userId, setUserId] = useState(null)
  const [pro, setPro] = useState(null)
  const currentUid = useRef(null)

  const { profile: offlineProfile } = useOfflineProfile(userId)
  const { dossier: offlineDossier } = useOfflineDossier(userId)
  const { appointments: offlineAppointments } = useOfflineAppointments(userId)

  // ── Auth + routing initial ────────────────────────────────────────────────
  useEffect(() => {
    const path = window.location.pathname
    if (path === '/privacy') { setLoading(false); return }
    const urgenceMatch = path.match(/^\/urgence\/([a-f0-9-]{36})$/)
    if (urgenceMatch) {
      setEmergencyToken(urgenceMatch[1])
      setLoading(false)
      return
    }
    if (isRecovery) { setLoading(false); return }

    // Un seul point d'entrée : INITIAL_SESSION au chargement, SIGNED_IN à la connexion.
    // Les rafraîchissements de jeton (TOKEN_REFRESHED) ne rechargent plus toute l'application.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') { setLoading(false); return }
      if (!session) {
        currentUid.current = null
        setProfile(null); setDossier(null); setPro(null); setUserId(null)
        setScreen('home'); setNavParams({})
        setLoading(false)
        return
      }
      if (currentUid.current === session.user.id) return
      currentUid.current = session.user.id
      setUserId(session.user.id)
      // Les requêtes Supabase ne doivent pas être lancées dans le callback lui-même
      setTimeout(() => {
        if (event === 'SIGNED_IN') {
          setSplash(true)
          setTimeout(() => setSplash(false), 1800)
        }
        loadUserData(session.user.id)
      }, 0)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Données hors ligne ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOffline || !userId) return
    if (!profile && offlineProfile) setProfile(offlineProfile)
    if (!dossier && offlineDossier) setDossier(offlineDossier)
  }, [isOffline, userId, offlineProfile, offlineDossier])

  // ── Chargement des données utilisateur ───────────────────────────────────
  const loadUserData = async (uid) => {
    setLoading(true)
    try {
      const [{ data: prof }, { data: dos }, { count: docCount }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('dossiers').select('*').eq('patient_id', uid).maybeSingle(),
        supabase.from('doctor_access').select('*', { count: 'exact', head: true }).eq('patient_id', uid).eq('status', 'active'),
      ])
      setProfile(prof)
      if (prof?.role === 'doctor') {
        const { data: proData } = await supabase
          .from('professionals')
          .select('*')
          .eq('id', uid)
          .maybeSingle()
        setPro(proData)
        const profilComplet = proData?.fname && proData?.specialite && proData?.wilaya
        setScreen(profilComplet ? 'pro-dashboard' : 'pro-onboarding')
      }
      setDossier(dos)
      setDoctorCount(docCount || 0)
      if (prof?.role === 'patient') buildNotifs(dos, docCount || 0)
    } catch (e) {
      console.error('Erreur chargement données:', e)
    } finally {
      setLoading(false)
    }
  }

  const buildNotifs = (dos, docCount) => {
    const alerts = []
    const meds = dos?.meds || []
    if (meds.length > 0) alerts.push({ id: 'med', icon: '💊', txt: meds[0].name, screen: 'dossier' })
    if ((dos?.glyc || []).length === 0) alerts.push({ id: 'glyc0', icon: '📊', txt: t('home.suivi_sub'), screen: 'suivi' })
    if (docCount > 0) alerts.push({ id: 'doc', icon: '👨‍⚕️', txt: `${docCount} ${t('home.doctors_count')}`, screen: 'doctors' })
    setNotifs(alerts.slice(0, 3))
  }

  const saveDossier = async (updates) => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!dossier) return
    const { data, error } = await supabase
      .from('dossiers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('patient_id', session.user.id)
      .select()
      .maybeSingle()
    if (error) { showToast('❌ ' + error.message); return }
    if (data) setDossier(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Téléphone partagé : on efface les copies locales des données médicales
    try { if ('caches' in window) await caches.delete('supabase-api-cache') } catch { /* ignore */ }
    try { ['profile', 'dossier', 'appointments', 'professionals'].forEach(s => clearOffline(s)) } catch { /* ignore */ }
    setScreen('home')
  }
  const reloadDossier = async () => {
    if (!session) return
    const { data } = await supabase.from('dossiers').select('*').eq('patient_id', session.user.id).maybeSingle()
    if (data) setDossier(data)
  }
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }
  // Anciens noms d'écran médecin → noms actuels (évite toute page blanche)
  const ALIAS = { doctor: 'pro-patients', 'doctor-patient': 'pro-patient', 'doctor-appointments': 'pro-agenda', 'doctor-schedule': 'pro-schedule', 'doctor-onboarding': 'pro-onboarding' }
  const nav = (s, params = {}) => {
    const target = ALIAS[s] || s
    setScreen(target); setNavParams(params)
    if (profile?.role === 'doctor') window.scrollTo(0, 0)
  }

  const navItems = [
    { id: 'home', icon: 'home', label: t('nav.home') },
    { id: 'search', icon: 'search', label: t('nav.search') },
    { id: 'qr', icon: 'qr', label: t('nav.qr'), center: true },
    { id: 'appointments', icon: 'calendar', label: t('nav.rdv') },
    { id: 'dossier', icon: 'file', label: t('nav.dossier') },
  ]

  // ── Cas spéciaux ─────────────────────────────────────────────────────────
  if (window.location.pathname === '/privacy') return <PrivacyScreen />
  if (emergencyToken) return <EmergencyPublicPage token={emergencyToken} />
  if (isRecovery) return <ResetPasswordScreen />
  if (loading) return (
    <div className="phone" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading"><div className="spin" />{t('common.loading')}</div>
    </div>
  )

  const profileIncomplete = session && profile && !profile.blood && profile.role !== 'doctor'
  if (profileIncomplete) return (
    <div className="phone">
      <OnboardingScreen profile={profile} setProfile={setProfile} userId={session.user.id} showToast={showToast} />
    </div>
  )
  if (!session) return <LandingScreen />

  // Session ouverte mais profil introuvable (réseau coupé, compte incomplet) : on n'affiche pas une app vide
  if (session && !profile && !isOffline) return (
    <div className="phone" style={{ alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
      <div className="empty-icon" style={{ color: 'var(--yellow)' }}><Icon e="⚠️" /></div>
      <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: 17 }}>Impossible de charger votre compte</div>
      <div style={{ color: 'var(--dim)', fontSize: 13 }}>Vérifiez votre connexion puis réessayez.</div>
      <button className="btn-submit" style={{ maxWidth: 260 }} onClick={() => loadUserData(session.user.id)}>Réessayer</button>
      <button className="btn-cancel" style={{ maxWidth: 260 }} onClick={handleLogout}>Se déconnecter</button>
    </div>
  )

  // ── Interface Professionnel de santé ──────────────────────────────────────
  if (profile?.role === 'doctor') {
    const common = { nav, showToast, pro, setPro, userId: session.user.id }
    const proScreen = (() => {
      switch (screen) {
        case 'pro-onboarding': return <ProfessionalOnboarding {...common} />
        case 'pro-schedule': return <ProfessionalSchedule {...common} />
        case 'pro-agenda': return <DoctorAppointments {...common} />
        case 'pro-patients': return <DoctorDashboard {...common} />
        case 'pro-patient': return <PatientRecord {...common} patientId={navParams?.patientId} />
        default: return <ProfessionalDashboard {...common} />
      }
    })()
    return (
      <>
        {proScreen}
        {toast && <Toast msg={toast} className="pro-toast" />}
      </>
    )
  }

  // ── Interface Patient ─────────────────────────────────────────────────────
  return (
    <div className="phone">
      {splash && (
        <div className="splash">
          <div className="sp-logo">
            <div className="sp-icon">
              <svg width="88" height="88" viewBox="0 0 110 110" fill="none">
                <circle cx="55" cy="55" r="52" fill="rgba(0,201,141,0.1)" stroke="rgba(0,201,141,0.28)" strokeWidth="1.5" />
                <circle cx="55" cy="55" r="44" fill="#0A1628" />
                <path d="M55 82C48 76 30 66 30 51c0-8 6-14 13-14 4.5 0 8.5 2.5 12 6.5 3.5-4 7.5-6.5 12-6.5 7 0 13 6 13 14 0 15-17 25-25 31Z" fill="url(#sg)" />
                <defs>
                  <linearGradient id="sg" x1="30" y1="37" x2="80" y2="82" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00C98D" />
                    <stop offset="1" stopColor="#005E42" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="sp-name">Vita<span>Pass</span></div>
            <div className="sp-sub">Bienvenue {profile?.fname} !</div>
          </div>
          <div className="sp-bar"><div className="sp-fill" /></div>
        </div>
      )}

      {/* Écrans */}
      <div className="screens">
        {screen === 'home' && <HomeScreen nav={nav} profile={profile} dossier={dossier} doctorCount={doctorCount} notifs={notifs} isOffline={isOffline} />}
        {screen === 'qr' && <QRScreen nav={nav} profile={profile} dossierData={dossier} onDossierChange={reloadDossier} />}
        {screen === 'search' && <SearchScreen nav={nav} />}
        {screen === 'pro-profile' && <ProProfileScreen nav={nav} navParams={navParams} />}
        {screen === 'booking' && <BookingScreen nav={nav} navParams={navParams} showToast={showToast} />}
        {screen === 'appointments' && <AppointmentsScreen nav={nav} showToast={showToast} user={session?.user} offlineAppointments={offlineAppointments} isOffline={isOffline} />}
        {screen === 'dossier' && <DossierScreen nav={nav} dossier={dossier} onSave={saveDossier} showToast={showToast} isOffline={isOffline} />}
        {screen === 'suivi' && <SuiviScreen nav={nav} dossier={dossier} onSave={saveDossier} showToast={showToast} />}
        {screen === 'doctors' && <DoctorsScreen nav={nav} showToast={showToast} />}
        {screen === 'profile' && <ProfileScreen nav={nav} profile={profile} setProfile={setProfile} onLogout={handleLogout} showToast={showToast} isOffline={isOffline} />}
      </div>

      {/* Navigation bas */}
      <nav className="bnav">
        {navItems.map(item => {
          const active = screen === item.id ||
            (item.id === 'dossier' && screen === 'suivi') ||
            (item.id === 'search' && (screen === 'pro-profile' || screen === 'booking'))
          return (
            <div
              key={item.id}
              className={`ni${item.center ? ' ni-qr' : ''}${active ? ' active' : ''}`}
              onClick={() => nav(item.id)}
              role="button"
              aria-label={item.label}
            >
              <Icon name={item.icon} size={item.center ? 26 : 22} stroke={item.center ? 2.1 : 1.8} />
              {!item.center && <span>{item.label}</span>}
            </div>
          )
        })}
      </nav>

      {toast && <Toast msg={toast} />}
    </div>
  )
}
