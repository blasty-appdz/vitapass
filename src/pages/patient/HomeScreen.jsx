import { useTranslation } from 'react-i18next'
import Icon from '../../components/common/Icon'

export default function HomeScreen({ nav, profile, dossier, doctorCount = 0, notifs = [], isOffline }) {
  const { t } = useTranslation()
  const meds = dossier?.meds || []
  const bp = dossier?.bp || []
  const glyc = dossier?.glyc || []
  const lastBp = bp.length ? bp[bp.length - 1] : null
  const lastGlyc = glyc.length ? glyc[glyc.length - 1] : null
  const metric = lastBp ? `${lastBp.s}/${lastBp.d}` : lastGlyc != null ? String(lastGlyc) : '–'
  const initials = `${(profile?.fname || '').charAt(0)}${(profile?.lname || '').charAt(0)}`.toUpperCase() || 'VP'
  const greet = String(t('home.greeting')).replace(/\s*\p{Extended_Pictographic}️?/gu, '').trim()

  return (
    <div className="screen" style={{ display: 'flex' }}>
      {isOffline && (
        <div style={{ background: 'var(--yellow-soft)', border: '1px solid rgba(255,200,87,.25)', borderRadius: 14, padding: '10px 14px', fontSize: 13, color: 'var(--yellow)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon e="📴" size={16} /> <span>Mode hors ligne — données locales</span>
        </div>
      )}

      <div className="home-top">
        <div className="home-av" onClick={() => nav('profile')} role="button" aria-label={t('nav.profile')}>{initials}</div>
        <div className="home-hi">
          <small>{greet}</small>
          <b>{profile?.fname} {profile?.lname}</b>
        </div>
        <div className="home-bell" onClick={() => nav('profile')} role="button" aria-label={t('nav.profile')}>
          <Icon name="user" size={20} />
        </div>
      </div>

      <div className="vitacard" onClick={() => nav('qr')}>
        <div className="vc-top">
          <span className="vc-logo"><i><Icon name="heart" size={15} stroke={2.2} /></i>VitaPass</span>
          {profile?.blood && <span className="vc-blood">{profile.blood}</span>}
        </div>
        <div className="vc-name">{profile?.fname} {profile?.lname}</div>
        <div className="vc-info">{profile?.wilaya}{profile?.cnas ? ` · ${profile.cnas}` : ''}</div>
        <div className="vc-bottom">
          <span className="vc-id">VP-DZ-{profile?.id?.slice(0, 8)?.toUpperCase()}</span>
          <span className="vc-qr"><Icon name="qr" size={16} />QR</span>
        </div>
      </div>

      <div className="sos-row" onClick={() => nav('qr')}>
        <div className="sic"><Icon name="siren" size={20} /></div>
        <div>
          <b>{t('home.qr_pass_title')}</b>
          <small>{t('home.qr_pass_sub')}</small>
        </div>
        <Icon name="chevronRight" size={20} className="chev" />
      </div>

      {notifs.length > 0 && <div style={{ height: 10 }} />}
      {notifs.map(n => (
        <div key={n.id} className="notif" onClick={() => nav(n.screen)}>
          <div className="nic"><Icon e={n.icon} size={17} /></div>
          <span>{n.txt}</span>
          <Icon name="chevronRight" size={18} className="chev" />
        </div>
      ))}

      <div className="sec-h">{t('home.health_summary')}</div>
      <div className="qstats">
        <div className="qs" onClick={() => nav('dossier')}>
          <div className="qs-icon c-g"><Icon name="pill" size={17} /></div>
          <div className="qs-val">{meds.length}</div>
          <div className="qs-lbl">{t('home.treatments')}</div>
        </div>
        <div className="qs" onClick={() => nav('doctors')}>
          <div className="qs-icon c-b"><Icon name="doctor" size={17} /></div>
          <div className="qs-val">{doctorCount}</div>
          <div className="qs-lbl">{t('home.doctors_count')}</div>
        </div>
        <div className="qs" onClick={() => nav('suivi')}>
          <div className="qs-icon c-y"><Icon name="activity" size={17} /></div>
          <div className="qs-val" style={{ fontSize: metric.length > 5 ? 18 : 22 }}>{metric}</div>
          <div className="qs-lbl">{t('home.metrics')}</div>
        </div>
      </div>

      <div className="sec-h">{t('home.quick_access')}</div>
      <div className="tiles">
        <div className="tile" onClick={() => nav('search')}>
          <div className="tic c-g"><Icon name="calendar" size={20} /></div>
          <div><b>{t('home.rdv_title')}</b><small>{t('home.rdv_sub')}</small></div>
        </div>
        <div className="tile" onClick={() => nav('dossier')}>
          <div className="tic c-b"><Icon name="file" size={20} /></div>
          <div><b>{t('home.dossier_title')}</b><small>{t('home.dossier_sub')}</small></div>
        </div>
        <div className="tile" onClick={() => nav('doctors')}>
          <div className="tic c-v"><Icon name="users" size={20} /></div>
          <div><b>{t('home.doctors_title')}</b><small>{t('home.doctors_sub')}</small></div>
        </div>
        <div className="tile" onClick={() => nav('suivi')}>
          <div className="tic c-y"><Icon name="activity" size={20} /></div>
          <div><b>{t('home.suivi_title')}</b><small>{t('home.suivi_sub')}</small></div>
        </div>
      </div>
      <div className="pad-b" />
    </div>
  )
}
