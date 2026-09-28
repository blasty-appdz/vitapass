import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AuthScreen from './auth/AuthScreen'
import Icon from '../components/common/Icon'

function Logo({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" fill="none" aria-hidden="true">
      <circle cx="55" cy="55" r="52" fill="rgba(0,201,141,0.1)" stroke="rgba(0,201,141,0.28)" strokeWidth="1.5" />
      <circle cx="55" cy="55" r="44" fill="#0A1628" />
      <path d="M55 82C48 76 30 66 30 51c0-8 6-14 13-14 4.5 0 8.5 2.5 12 6.5 3.5-4 7.5-6.5 12-6.5 7 0 13 6 13 14 0 15-17 25-25 31Z" fill="url(#lsg)" />
      <defs>
        <linearGradient id="lsg" x1="30" y1="37" x2="80" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00C98D" />
          <stop offset="1" stopColor="#005E42" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const S = {
  page: { minHeight: '100dvh', background: 'radial-gradient(90% 45% at 50% 0%, rgba(0,201,141,.13), transparent 65%), var(--bg)', color: 'var(--white)', display: 'flex', flexDirection: 'column' },
  nav: { position: 'sticky', top: 0, zIndex: 100, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'rgba(6,11,22,.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--line)' },
  brand: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--brand)', fontSize: 18, fontWeight: 800 },
  ghost: { background: 'var(--card)', color: 'var(--white)', border: '1px solid var(--line2)', borderRadius: 12, padding: '9px 14px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  hero: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '56px 22px 40px', maxWidth: 640, margin: '0 auto', width: '100%' },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--g)', background: 'var(--g-soft)', border: '1px solid rgba(0,201,141,.25)', padding: '6px 13px', borderRadius: 99, marginBottom: 22 },
  h1: { fontSize: 'clamp(32px, 8vw, 54px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-1.2px', marginBottom: 18 },
  sub: { fontSize: 16.5, color: 'var(--dim)', maxWidth: 480, lineHeight: 1.65, marginBottom: 30 },
  cta: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', maxWidth: 360, background: 'var(--g)', color: 'var(--g-ink)', border: 'none', borderRadius: 16, padding: '16px 22px', fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: '0 12px 30px rgba(0,201,141,.28)' },
  cta2: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', maxWidth: 360, background: 'transparent', color: 'var(--white)', border: '1px solid var(--line2)', borderRadius: 16, padding: '15px 22px', fontSize: 15.5, fontWeight: 500, cursor: 'pointer', marginTop: 10 },
  feats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 520, marginTop: 38 },
  feat: { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--dim)', lineHeight: 1.35 },
  fic: { width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  foot: { padding: '22px 18px 28px', borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: 12.5, color: 'var(--t3)' },
}

export default function LandingScreen() {
  const { t } = useTranslation()
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const open = (tab) => { setAuthTab(tab); setShowAuth(true) }
  const footer = String(t('landing.footer_free')).replace(/\s*\p{Regional_Indicator}+/gu, '')

  if (showAuth) return (
    <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center', gap: 22, padding: 20, overflowY: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Logo size={60} />
        <div style={{ fontFamily: 'var(--brand)', fontSize: 28, fontWeight: 800 }}>
          Vita<span style={{ color: 'var(--g)' }}>Pass</span>
        </div>
      </div>

      {/* AuthScreen gère son propre onglet via initialTab */}
      <div className="auth-card" style={{ maxWidth: 420 }}>
        <AuthScreen initialTab={authTab} />
      </div>

      <button onClick={() => setShowAuth(false)} style={{ ...S.ghost, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="chevronLeft" size={16} /> {t('common.back')}
      </button>
    </div>
  )

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <span style={S.brand}>
          <Logo size={30} />
          <span>Vita<span style={{ color: 'var(--g)' }}>Pass</span></span>
        </span>
        <button onClick={() => open('login')} style={S.ghost}>{t('auth.login')}</button>
      </nav>

      <main style={S.hero}>
        <div style={S.pill}><Icon name="shield" size={15} />{t('landing.available')}</div>
        <h1 style={S.h1}>
          {t('landing.hero_title')}<br />
          <span style={{ color: 'var(--g)' }}>{t('landing.hero_title_accent')}</span>
        </h1>
        <p style={S.sub}>{t('landing.hero_sub')}</p>

        <button onClick={() => open('signup')} style={S.cta}>
          {t('landing.create_btn')}
        </button>
        <button onClick={() => open('login')} style={S.cta2}>
          {String(t('landing.login_btn')).replace(/\s*→\s*$/, '')} <Icon name="arrowRight" size={17} />
        </button>

        <div style={S.feats}>
          <div style={S.feat}><span style={S.fic} className="c-r"><Icon name="qr" size={18} /></span>{t('nav.qr')}</div>
          <div style={S.feat}><span style={S.fic} className="c-b"><Icon name="file" size={18} /></span>{t('nav.dossier')}</div>
          <div style={S.feat}><span style={S.fic} className="c-g"><Icon name="calendar" size={18} /></span>{t('nav.rdv')}</div>
        </div>
      </main>

      <footer style={S.foot}>
        © 2026 VitaPass · {footer}
      </footer>
    </div>
  )
}
