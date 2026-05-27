import { useTranslation } from 'react-i18next'

export default function HomeScreen({ nav, profile, dossier, doctorCount = 0, notifs = [], isOffline }) {
  const { t } = useTranslation()
  const meds = dossier?.meds || []

  return (
    <div className="screen" style={{ display: 'flex' }}>
      {isOffline && (
        <div style={{ background: 'rgba(255,209,102,.1)', border: '1px solid rgba(255,209,102,.25)', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: 'var(--yellow)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          {"📴"} <span>Mode hors ligne — données locales</span>
        </div>
      )}

      <div className="home-hdr">
        <div className="h-greet">{t('home.greeting')}</div>
        <div className="h-name">{profile?.fname} <span>{profile?.lname}</span></div>
      </div>

      <div className="vitacard" onClick={() => nav('qr')}>
        <div className="vc-top">
          <span className="vc-logo">{"🏥"} VitaPass</span>
          {profile?.blood && <span className="vc-blood">{profile.blood}</span>}
        </div>
        <div className="vc-name">{profile?.fname} {profile?.lname}</div>
        <div className="vc-info">{profile?.wilaya} · {profile?.cnas || 'CNAS'}</div>
        <div className="vc-bottom">
          <span className="vc-id">VP-DZ-{profile?.id?.slice(0, 8)?.toUpperCase()}</span>
          <span style={{ fontSize: 11, color: 'rgba(0,201,141,.5)' }}>QR →</span>
        </div>
      </div>

      {notifs.map(n => (
        <div
          key={n.id}
          onClick={() => nav(n.screen)}
          style={{ background: 'rgba(255,209,102,.08)', border: '1px solid rgba(255,209,102,.25)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 16 }}>{n.icon}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', flex: 1, lineHeight: 1.4 }}>{n.txt}</span>
          <span style={{ color: '#5A6A85', fontSize: 16 }}>›</span>
        </div>
      ))}

      <div className="sec-label">{t('home.health_summary')}</div>
      <div className="qstats">
        <div className="qs" onClick={() => nav('dossier')}>
          <div className="qs-icon">{"💊"}</div>
          <div className="qs-val">{meds.length}</div>
          <div className="qs-lbl">{t('home.treatments')}</div>
        </div>
        <div className="qs" onClick={() => nav('doctors')}>
          <div className="qs-icon">{"👨‍⚕️"}</div>
          <div className="qs-val">{doctorCount}</div>
          <div className="qs-lbl">{t('home.doctors_count')}</div>
        </div>
        <div className="qs" onClick={() => nav('suivi')}>
          <div className="qs-icon">{"📊"}</div>
          <div className="qs-val">–</div>
          <div className="qs-lbl">{t('home.metrics')}</div>
        </div>
      </div>

      <div className="sec-label">{t('home.quick_access')}</div>
      <div className="action-list">
        <div className="action-row" onClick={() => nav('qr')}>
          <div className="ar-icon" style={{ background: 'rgba(255,90,90,.1)' }}>{"🆘"}</div>
          <div className="ar-text">
            <div className="ar-title">{t('home.qr_pass_title')}</div>
            <div className="ar-sub">{t('home.qr_pass_sub')}</div>
          </div>
          <span className="ar-arrow">›</span>
        </div>
        <div className="action-row" onClick={() => nav('search')}>
          <div className="ar-icon" style={{ background: 'rgba(0,201,141,.1)' }}>{"📅"}</div>
          <div className="ar-text">
            <div className="ar-title">{t('home.rdv_title')}</div>
            <div className="ar-sub">{t('home.rdv_sub')}</div>
          </div>
          <span className="ar-arrow">›</span>
        </div>
        <div className="action-row" onClick={() => nav('dossier')}>
          <div className="ar-icon" style={{ background: 'rgba(77,159,236,.1)' }}>{"📋"}</div>
          <div className="ar-text">
            <div className="ar-title">{t('home.dossier_title')}</div>
            <div className="ar-sub">{t('home.dossier_sub')}</div>
          </div>
          <span className="ar-arrow">›</span>
        </div>
        <div className="action-row" onClick={() => nav('doctors')}>
          <div className="ar-icon" style={{ background: 'rgba(0,201,141,.1)' }}>{"👨‍⚕️"}</div>
          <div className="ar-text">
            <div className="ar-title">{t('home.doctors_title')}</div>
            <div className="ar-sub">{t('home.doctors_sub')}</div>
          </div>
          <span className="ar-arrow">›</span>
        </div>
        <div className="action-row" onClick={() => nav('suivi')}>
          <div className="ar-icon" style={{ background: 'rgba(255,209,102,.1)' }}>{"❤️"}</div>
          <div className="ar-text">
            <div className="ar-title">{t('home.suivi_title')}</div>
            <div className="ar-sub">{t('home.suivi_sub')}</div>
          </div>
          <span className="ar-arrow">›</span>
        </div>
      </div>
      <div className="pad-b" />
    </div>
  )
}
