import { useState } from 'react'
import { supabase } from '../../supabase'
import { validatePassword } from '../../utils/validators'

export default function ResetPasswordScreen() {
  const [pwd, setPwd] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleReset = async () => {
    const pwdErr = validatePassword(pwd)
    if (pwdErr) { setErr(pwdErr); return }
    setLoading(true)
    setErr('')
    const { error } = await supabase.auth.updateUser({ password: pwd })
    if (error) { setErr(error.message); setLoading(false); return }
    window.history.replaceState(null, '', window.location.pathname)
    setDone(true)
    setLoading(false)
  }

  const base = {
    position: 'fixed', inset: 0, background: '#080E1E', zIndex: 9999,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 16, padding: 24,
  }
  const inputStyle = {
    width: '100%', maxWidth: 340, background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
    padding: '13px 16px', color: '#EFF3FF', fontSize: 14, outline: 'none',
  }
  const btn = (d) => ({
    width: '100%', maxWidth: 340,
    background: d ? 'rgba(0,201,141,0.35)' : '#00C98D',
    color: '#001A12', border: 'none', borderRadius: 12,
    padding: 14, fontWeight: 700, fontSize: 14,
    cursor: d ? 'not-allowed' : 'pointer',
    fontFamily: "'Syne',sans-serif",
  })

  if (done) return (
    <div style={base}>
      <div style={{ fontSize: 56 }}>{"✅"}</div>
      <div style={{ color: '#EFF3FF', fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", textAlign: 'center' }}>
        Mot de passe modifié !
      </div>
      <button
        onClick={() => window.location.href = window.location.origin + window.location.pathname}
        style={{ ...btn(false), marginTop: 8 }}
      >
        Se connecter →
      </button>
    </div>
  )

  return (
    <div style={base}>
      <div style={{ fontSize: 48 }}>{"🔐"}</div>
      <div style={{ color: '#EFF3FF', fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
        Nouveau mot de passe
      </div>
      <input
        type="password"
        placeholder="••••••••"
        value={pwd}
        onChange={e => setPwd(e.target.value)}
        style={inputStyle}
        onKeyDown={e => e.key === 'Enter' && pwd.length >= 6 && handleReset()}
      />
      {err && (
        <div style={{ color: '#FF8A8A', fontSize: 12, background: 'rgba(255,90,90,.1)', border: '1px solid rgba(255,90,90,.2)', borderRadius: 8, padding: '8px 14px', maxWidth: 340, width: '100%', textAlign: 'center' }}>
          {"⚠️"} {err}
        </div>
      )}
      <button
        onClick={handleReset}
        disabled={loading || pwd.length < 6}
        style={btn(loading || pwd.length < 6)}
      >
        {loading ? '⏳...' : 'Valider'}
      </button>
    </div>
  )
}
