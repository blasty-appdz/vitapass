import { useEffect } from 'react'
import { supabase } from '../supabase'

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href).then(() => {
      window.location.href = window.location.origin + '/#type=recovery'
    })
  }, [])

  return (
    <div style={{ background: '#080E1E', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EFF3FF', fontFamily: 'sans-serif' }}>
      ⏳ Redirection en cours...
    </div>
  )
}