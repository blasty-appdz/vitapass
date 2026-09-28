import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase'
import { WILAYAS } from '../../data'
import Icon, { IconText } from '../../components/common/Icon'
export default function OnboardingScreen({ profile, setProfile, userId, showToast }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    wilaya: 'Oran',
    blood: 'A+',
    gender: 'Masculin',
    dob: '',
    cnas: '',
    emergency: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!form.dob) { setError('La date de naissance est requise'); return }
    setSaving(true)
    setError('')
    const { error: dbErr } = await supabase.from('profiles').update(form).eq('id', userId)
    if (dbErr) {
      setError(dbErr.message)
      setSaving(false)
      return
    }
    setProfile({ ...profile, ...form })
    showToast('✅ Profil complété !')
    setSaving(false)
  }

  return (
    <div className="auth-screen" style={{ justifyContent: 'flex-start', paddingTop: 40, overflowY: 'auto' }}>
      <div className="auth-logo" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)' }}>
          Complète ton <span style={{ color: 'var(--g)' }}>profil</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--dim)', textAlign: 'center' }}>
          Ces informations seront affichées en cas d'urgence
        </div>
      </div>

      <div className="auth-card" style={{ width: '100%' }}>
        {error && <div className="error-msg"><IconText>{error}</IconText></div>}

        <div className="form-group">
          <label className="form-label">{t('profile.dob')} *</label>
          <input
            className={`form-input${!form.dob && error ? ' error' : ''}`}
            type="date"
            value={form.dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setForm({ ...form, dob: e.target.value })}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('profile.blood')}</label>
            <select className="form-select" value={form.blood} onChange={e => setForm({ ...form, blood: e.target.value })}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('profile.gender')}</label>
            <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option value="Masculin">{t('profile.male')}</option>
              <option value="Féminin">{t('profile.female')}</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('profile.wilaya')}</label>
          <select className="form-select" value={form.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })}>
            {WILAYAS.map(w => <option key={w}>{w}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('profile.cnas')}</label>
          <input className="form-input" placeholder="DZ-CNAS-XXXXXX" value={form.cnas} onChange={e => setForm({ ...form, cnas: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('profile.emergency')}</label>
          <input className="form-input" type="tel" placeholder="Nom · 0550 12 34 56" value={form.emergency} onChange={e => setForm({ ...form, emergency: e.target.value })} />
        </div>
        <button className="btn-submit" onClick={save} disabled={saving}>
          {saving ? '…' : t('common.confirm')}
        </button>
        <button className="btn-cancel" onClick={() => supabase.auth.signOut()}><Icon e="🚪" /> {t('profile.logout')}</button>
      </div>
    </div>
  )
}
