import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AuthScreen from './auth/AuthScreen'

export default function LandingScreen() {
  const { t } = useTranslation()
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('login')

  if (showAuth) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24, overflowY: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <svg width="56" height="56" viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="52" fill="rgba(0,201,141,0.1)" stroke="rgba(0,201,141,0.28)" strokeWidth="1.5" />
          <circle cx="55" cy="55" r="44" fill="#0A1628" />
          <path d="M55 82C48 76 30 66 30 51c0-8 6-14 13-14 4.5 0 8.5 2.5 12 6.5 3.5-4 7.5-6.5 12-6.5 7 0 13 6 13 14 0 15-17 25-25 31Z" fill="url(#sg2)" />
          <defs>
            <linearGradient id="sg2" x1="30" y1="37" x2="80" y2="82" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00C98D" />
              <stop offset="1" stopColor="#005E42" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--white)' }}>
          Vita<span style={{ color: 'var(--g)' }}>Pass</span>
        </div>
      </div>

      {/* AuthScreen gère son propre onglet via initialTab */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, width: '100%', maxWidth: 420 }}>
        <AuthScreen initialTab={authTab} />
      </div>

      <div onClick={() => setShowAuth(false)} style={{ fontSize: 13, color: 'var(--dim)', cursor: 'pointer', textDecoration: 'underline' }}>
        ← {t('common.back')}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--white)', fontFamily: "'Inter',sans-serif" }}>
      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(8,14,30,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 800, color: 'var(--white)' }}>
          Vita<span style={{ color: 'var(--g)' }}>Pass</span>
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { setAuthTab('login'); setShowAuth(true) }}
            style={{ background: 'transparent', color: 'var(--white)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 20px', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('auth.login')}
          </button>
          <button
            onClick={() => { setAuthTab('signup'); setShowAuth(true) }}
            style={{ background: 'var(--g)', color: '#001A12', border: 'none', borderRadius: 8, padding: '9px 20px', fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('auth.signup_btn')}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px' }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(28px,5vw,56px)', fontWeight: 800, lineHeight: 1.1, maxWidth: '820px', marginBottom: 24 }}>
          {t('landing.hero_title')}<br />
          <span style={{ color: 'var(--g)' }}>{t('landing.hero_title_accent')}</span>
        </h1>
        <p style={{ fontSize: 17, color: '#8A9AB5', maxWidth: '520px', lineHeight: 1.75, marginBottom: 44 }}>
          {t('landing.hero_sub')}
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => { setAuthTab('signup'); setShowAuth(true) }}
            style={{ background: 'var(--g)', color: '#001A12', border: 'none', borderRadius: 10, padding: '16px 40px', fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('landing.create_btn')}
          </button>
          <button
            onClick={() => { setAuthTab('login'); setShowAuth(true) }}
            style={{ background: 'transparent', color: 'var(--white)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '16px 36px', fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            {t('landing.login_btn')}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '32px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: 'var(--white)' }}>
          Vita<span style={{ color: 'var(--g)' }}>Pass</span>
        </span>
        <span style={{ fontSize: 12, color: 'var(--dim)' }}>
          © 2026 VitaPass · {t('landing.footer_free')}
        </span>
      </div>
    </div>
  )
}
