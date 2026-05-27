import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useTranslation } from 'react-i18next'
import { useOffline } from './hooks/useOffline'
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

// QR script CDN (chargé une seule fois)
if (!document.querySelector('script[src*="qrcodejs"]')) {
  const qrScript = document.createElement('script')
  qrScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
  document.head.appendChild(qrScript)
}

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
  const [clock, setClock] = useState('')
  const [doctorCount, setDoctorCount] = useState(0)
  const [notifs, setNotifs] = useState([])
  const [emergencyToken, setEmergencyToken] = useState(null)
  const [isRecovery] = useState(() => window.location.hash.includes('type=recovery'))
  const [userId, setUserId] = useState(null)

  const { profile: offlineProfile } = useOfflineProfile(userId)
  const { dossier: offlineDossier } = useOfflineDossier(userId)
  const { appointments: offlineAppointments } = useOfflineAppointments(userId)

  // ── Horloge ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setClock(`${n.getHours()}:${String(n.getMinutes()).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Auth + routing initial ────────────────────────────────────────────────
  useEffect(() => {
    const path = window.location.pathname
    const urgenceMatch = path.match(/^\/urgence\/([a-f0-9-]{36})$/)
    if (urgenceMatch) {
      setEmergencyToken(urgenceMatch[1])
      setLoading(false)
      return
    }
    if (isRecovery) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) { setUserId(session.user.id); loadUserData(session.user.id) }
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) {
        setUserId(session.user.id)
        setSplash(true)
        loadUserData(session.user.id)
        setTimeout(() => setSplash(false), 2000)
      } else {
        setProfile(null); setDossier(null); setUserId(null); setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [isRecovery])

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
          .select('fname,specialite,wilaya')
          .eq('id', uid)
          .maybeSingle()
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
    setScreen('home')
  }
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }
  const nav = (s, params = {}) => { setScreen(s); setNavParams(params) }

  const navItems = [
    { id: 'home', icon: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />, label: t('nav.home') },
    { id: 'search', icon: <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />, label: t('nav.search') },
    { id: 'appointments', icon: <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />, label: t('nav.rdv') },
    { id: 'dossier', icon: <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z" />, label: t('nav.dossier') },
    { id: 'profile', icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />, label: t('nav.profile') },
  ]

  // ── Cas spéciaux ─────────────────────────────────────────────────────────
  if (emergencyToken) return <EmergencyPublicPage token={emergencyToken} />
  if (isRecovery) return <ResetPasswordScreen />
  if (loading) return (
    <div className="phone" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading">{t('common.loading')}</div>
    </div>
  )

  const profileIncomplete = session && profile && !profile.blood && profile.role !== 'doctor'
  if (profileIncomplete) return (
    <div className="phone">
      <OnboardingScreen profile={profile} setProfile={setProfile} userId={session.user.id} showToast={showToast} />
    </div>
  )
  if (!session) return <LandingScreen />

  // ── Interface Médecin ─────────────────────────────────────────────────────
  if (profile?.role === 'doctor') return (
    <>
      {screen === 'pro-onboarding' && <ProfessionalOnboarding nav={nav} />}
      {screen === 'pro-dashboard' && <ProfessionalDashboard nav={nav} showToast={showToast} />}
      {screen === 'pro-schedule' && <ProfessionalSchedule nav={nav} showToast={showToast} />}
      {screen === 'doctor' && <DoctorDashboard nav={nav} showToast={showToast} />}
      {screen === 'doctor-patient' && <PatientRecord nav={nav} showToast={showToast} patientId={navParams?.patientId} />}
      {screen === 'doctor-appointments' && <DoctorAppointments nav={nav} showToast={showToast} />}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(13,21,38,.95)', border: '1px solid rgba(0,201,141,.3)', color: '#EFF3FF', padding: '10px 20px', borderRadius: 20, zIndex: 999, fontSize: 13, fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>
          {toast}
        </div>
      )}
    </>
  )

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

      {/* Status bar */}
      <div className="sbar">
        <span className="sbar-time">{clock}</span>
        <div className="sbar-right">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
          </svg>
        </div>
      </div>

      {/* Écrans */}
      <div className="screens">
        {screen === 'home' && <HomeScreen nav={nav} profile={profile} dossier={dossier} doctorCount={doctorCount} notifs={notifs} isOffline={isOffline} />}
        {screen === 'qr' && <QRScreen nav={nav} profile={profile} dossierData={dossier} />}
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
      <div className="bnav">
        {navItems.map(item => (
          <div
            key={item.id}
            className={`ni${
              screen === item.id ||
              (item.id === 'dossier' && screen === 'suivi') ||
              (item.id === 'search' && (screen === 'pro-profile' || screen === 'booking'))
                ? ' active' : ''
            }`}
            onClick={() => nav(item.id)}
          >
            <svg viewBox="0 0 24 24">{item.icon}</svg>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  )
}
