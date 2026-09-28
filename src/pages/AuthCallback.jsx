import { useEffect } from 'react'
import { supabase } from '../supabase'
import Icon from '../components/common/Icon'

// Retour du lien « mot de passe oublié » : on récupère la session puis on ouvre l'écran de nouveau mot de passe.
export default function AuthCallback() {
  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const recovery = url.hash.includes('type=recovery') || url.searchParams.get('type') === 'recovery' || Boolean(code)
      try {
        if (code) await supabase.auth.exchangeCodeForSession(code)
        else await supabase.auth.getSession() // lit les jetons présents dans l'adresse (#access_token=…)
      } catch (e) {
        console.warn('[VitaPass] callback:', e)
      }
      window.location.replace(window.location.origin + '/' + (recovery ? '#type=recovery' : ''))
    }
    run()
  }, [])

  return (
    <div style={{ background: '#080E1E', minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', fontFamily: 'sans-serif' }}>
      <Icon e="⏳" /> Redirection en cours...
    </div>
  )
}
