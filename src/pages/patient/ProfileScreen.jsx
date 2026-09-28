import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase'
import Modal from '../../components/common/Modal'
import PushNotificationToggle from '../../components/PushNotificationToggle'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { formatDate } from '../../utils/formatters'
import { WILAYAS } from '../../data'
import Icon from '../../components/common/Icon'

export default function ProfileScreen({ nav, profile, setProfile, onLogout, showToast, isOffline }) {
  const { t } = useTranslation()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(profile || {})
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (isOffline) { showToast('Impossible en mode hors ligne'); return }
    if (!form.fname?.trim() || !form.lname?.trim()) {
      showToast('❌ Prénom et nom requis')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      fname: form.fname,
      lname: form.lname,
      dob: form.dob,
      gender: form.gender,
      wilaya: form.wilaya,
      blood: form.blood,
      cnas: form.cnas,
      emergency: form.emergency,
    }).eq('id', profile.id)
    if (!error) {
      setProfile({ ...profile, ...form })
      setModal(false)
      showToast('✅ Profil mis à jour')
    } else {
      showToast('❌ ' + error.message)
    }
    setSaving(false)
  }

  const age = profile?.dob
    ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  return (
    <div className="screen" style={{ display: 'flex' }}>
      <div className="profile-hero">
        <div className="p-av-wrap">
          <div className="p-av" style={{ fontSize: 28, fontWeight: 700 }}>{`${(profile?.fname || '').charAt(0)}${(profile?.lname || '').charAt(0)}`.toUpperCase() || <Icon name="user" />}</div>
          <div className="p-badge"><Icon e="✅" /></div>
        </div>
        <div className="p-name">{profile?.fname} {profile?.lname}</div>
        <div className="p-id">VP-DZ-{profile?.id?.slice(0, 8)?.toUpperCase()}</div>
        <div className="p-chips">
          <span className="pchip"><Icon e="🩸" /> {profile?.blood || 'N/A'}</span>
          <span className="pchip"><Icon e="📍" /> {profile?.wilaya || 'N/A'}</span>
          {age !== null && <span className="pchip">{age} ans</span>}
        </div>
      </div>

      {isOffline && (
        <div style={{ background: 'rgba(255,209,102,.1)', border: '1px solid rgba(255,209,102,.25)', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: 'var(--yellow)', margin: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon e="📴" /> <span>Mode hors ligne — modification désactivée</span>
        </div>
      )}

      <div style={{ height: 16 }} />
      <div className="sec-label">{t('profile.title')}</div>
      <div className="pinfo-list">
        {[
          [t('profile.first_name'), profile?.fname],
          [t('profile.last_name'), profile?.lname],
          [t('profile.dob'), formatDate(profile?.dob)],
          [t('profile.gender'), profile?.gender === 'Féminin' ? t('profile.female') : profile?.gender === 'Masculin' ? t('profile.male') : profile?.gender],
          [t('profile.wilaya'), profile?.wilaya],
          [t('profile.blood'), profile?.blood],
          [t('profile.cnas'), profile?.cnas],
          [t('profile.emergency'), profile?.emergency],
        ].map(([k, v], i) => (
          <div key={i} className="pinfo-row">
            <span className="pi-key">{k}</span>
            <span className="pi-val">{v || '—'}</span>
          </div>
        ))}
      </div>

      {!isOffline && (
        <div className="add-btn" onClick={() => { setForm(profile || {}); setModal(true) }}>
          <Icon e="✏️" /> {t('profile.edit')}
        </div>
      )}

      <div className="dsect-title">Paramètres</div>
      <PushNotificationToggle />
      <div className="pinfo-row" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="pi-key"><Icon e="🌐" /> Langue / اللغة</span>
        <LanguageSwitcher />
      </div>
      <div className="pinfo-row" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginTop: 10, cursor: 'pointer' }} onClick={() => nav('doctors')}>
        <span className="pi-key"><Icon e="👨‍⚕️" /> Médecins ayant accès à mon dossier</span>
        <span className="pi-val">›</span>
      </div>
      <a href="/privacy" className="pinfo-row" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginTop: 10, textDecoration: 'none', display: 'flex', justifyContent: 'space-between' }}>
        <span className="pi-key"><Icon e="🔒" /> Politique de confidentialité</span>
        <span className="pi-val">›</span>
      </a>
      <div style={{ height: 12 }} />

      <div className="logout-btn" onClick={onLogout}>
        <Icon e="🚪" /> {t('profile.logout')}
      </div>

      {modal && (
        <Modal title={t('profile.edit')} onClose={() => setModal(false)}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('profile.first_name')}</label>
              <input className="form-input" defaultValue={profile?.fname} onChange={e => setForm({ ...form, fname: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('profile.last_name')}</label>
              <input className="form-input" defaultValue={profile?.lname} onChange={e => setForm({ ...form, lname: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('profile.dob')}</label>
            <input className="form-input" type="date" defaultValue={profile?.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('profile.blood')}</label>
              <select className="form-select" defaultValue={profile?.blood} onChange={e => setForm({ ...form, blood: e.target.value })}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('profile.gender')}</label>
              <select className="form-select" defaultValue={profile?.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="Masculin">{t('profile.male')}</option>
                <option value="Féminin">{t('profile.female')}</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('profile.wilaya')}</label>
            <select className="form-select" defaultValue={profile?.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })}>
              {WILAYAS.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('profile.cnas')}</label>
            <input className="form-input" defaultValue={profile?.cnas} onChange={e => setForm({ ...form, cnas: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('profile.emergency')}</label>
            <input className="form-input" placeholder="+213 XXX XXX XXX" defaultValue={profile?.emergency} onChange={e => setForm({ ...form, emergency: e.target.value })} />
          </div>
          <button className="btn-submit" onClick={save} disabled={saving}>
            {saving ? '…' : t('profile.save')}
          </button>
          <button className="btn-cancel" onClick={() => setModal(false)}>{t('profile.cancel')}</button>
        </Modal>
      )}
    </div>
  )
}
