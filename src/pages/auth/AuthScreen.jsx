import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase'
import { validateEmail, validatePassword, validateRequired } from '../../utils/validators'
import { WILAYAS } from '../../data'

/**
 * Écran d'authentification (connexion / inscription)
 * @param {string} initialTab - 'login' | 'signup'
 */
export default function AuthScreen({ initialTab = 'login' }) {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState(initialTab)
  const [role, setRole] = useState('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [numeroOrdre, setNumeroOrdre] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const roles = [
    { id: 'patient', icon: '🧑‍💼', label: t('auth.role_patient'), sub: t('auth.role_patient_sub') },
    { id: 'doctor', icon: '👨‍⚕️', label: t('auth.role_doctor'), sub: t('auth.role_doctor_sub') },
  ]

  const clearErrors = () => { setError(''); setFieldErrors({}) }

  const handleLogin = async () => {
    const emailErr = validateEmail(email)
    const pwdErr = validatePassword(password)
    if (emailErr || pwdErr) {
      setFieldErrors({ email: emailErr, password: pwdErr })
      return
    }
    setLoading(true)
    clearErrors()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignup = async () => {
    const errors = {}
    const emailErr = validateEmail(email)
    const pwdErr = validatePassword(password)
    const fnameErr = validateRequired(fname, 'Prénom')
    const lnameErr = validateRequired(lname, 'Nom')
    if (emailErr) errors.email = emailErr
    if (pwdErr) errors.password = pwdErr
    if (fnameErr) errors.fname = fnameErr
    if (lnameErr) errors.lname = lnameErr
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }

    setLoading(true)
    clearErrors()
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { role, fname: fname.trim(), lname: lname.trim(), numero_ordre: numeroOrdre } },
    })
    if (error) setError(error.message)
    else setError('✅ ' + t('auth.account_created'))
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    const emailErr = validateEmail(email)
    if (emailErr) { setFieldErrors({ email: emailErr }); return }
    setLoading(true)
    clearErrors()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://www.vitapass.app/auth/callback',
    })
    if (error) setError(error.message)
    else setError('✅ ' + t('auth.reset_sent'))
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <button
          onClick={() => {
            const next = i18n.language === 'fr' ? 'ar' : 'fr'
            i18n.changeLanguage(next)
            localStorage.setItem('vitapass_lang', next)
          }}
          style={{
            background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 20, padding: '6px 16px', color: '#EFF3FF',
            fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {"🌐"} {i18n.language === 'fr' ? 'العربية' : 'Français'}
        </button>
      </div>

      <div className="auth-logo">
        <svg width="60" height="60" viewBox="0 0 110 110" fill="none">
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
        <div className="auth-title">Vita<span>Pass</span></div>
        <div className="auth-sub">{t('tagline')}</div>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <div
            className={`auth-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => { setTab('login'); clearErrors() }}
          >
            {t('auth.login')}
          </div>
          <div
            className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
            onClick={() => { setTab('signup'); clearErrors() }}
          >
            {t('auth.signup')}
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {tab === 'signup' && (
          <>
            <div className="sec-label" style={{ margin: '0 0 8px' }}>{t('auth.i_am')}</div>
            <div className="role-select">
              {roles.map(r => (
                <div key={r.id} className={`role-btn${role === r.id ? ' selected' : ''}`} onClick={() => setRole(r.id)}>
                  <span className="role-icon">{r.icon}</span>
                  <div>
                    <div className="role-label">{r.label}</div>
                    <div className="role-sub">{r.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            {role === 'doctor' && (
              <div className="form-group">
                <label className="form-label">{t('auth.ordre_number')}</label>
                <input
                  className="form-input"
                  placeholder="Ex: 12345"
                  value={numeroOrdre}
                  onChange={e => setNumeroOrdre(e.target.value)}
                />
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('auth.first_name')}</label>
                <input
                  className={`form-input${fieldErrors.fname ? ' error' : ''}`}
                  placeholder="Karim"
                  value={fname}
                  onChange={e => { setFname(e.target.value); setFieldErrors(p => ({ ...p, fname: null })) }}
                />
                {fieldErrors.fname && <span className="field-error">{fieldErrors.fname}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">{t('auth.last_name')}</label>
                <input
                  className={`form-input${fieldErrors.lname ? ' error' : ''}`}
                  placeholder="Bensalem"
                  value={lname}
                  onChange={e => { setLname(e.target.value); setFieldErrors(p => ({ ...p, lname: null })) }}
                />
                {fieldErrors.lname && <span className="field-error">{fieldErrors.lname}</span>}
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">{t('auth.email')}</label>
          <input
            className={`form-input${fieldErrors.email ? ' error' : ''}`}
            type="email"
            placeholder="email@exemple.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: null })) }}
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">{t('auth.password')}</label>
          <div className="pwd-wrap">
            <input
              className={`form-input${fieldErrors.password ? ' error' : ''}`}
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: null })) }}
              style={{ paddingRight: 40 }}
              onKeyDown={e => e.key === 'Enter' && tab === 'login' && handleLogin()}
            />
            <span className="pwd-eye" onClick={() => setShowPwd(!showPwd)}>
              {showPwd ? '🙈' : '👁️'}
            </span>
          </div>
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </div>

        <button
          className="btn-submit"
          onClick={tab === 'login' ? handleLogin : handleSignup}
          disabled={loading}
        >
          {loading
            ? t('auth.loading')
            : tab === 'login'
              ? '🔐 ' + t('auth.login_btn')
              : '✨ ' + t('auth.signup_btn')}
        </button>

        {tab === 'login' && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <span
              onClick={handleForgotPassword}
              style={{ color: '#00D4A0', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t('auth.forgot_password')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
