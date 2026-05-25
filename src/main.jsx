import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import './i18n'
import { Analytics } from '@vercel/analytics/react'
import { registerSW } from 'virtual:pwa-register'
import OfflineBanner from './components/OfflineBanner'

const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true)
  },
  onOfflineReady() {
    console.log('[VitaPass] ✅ Application prête en mode hors ligne')
  },
  onRegisterError(error) {
    console.warn('[VitaPass] Erreur enregistrement SW:', error)
  },
})

const isCallback = window.location.pathname === '/auth/callback'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OfflineBanner />
    {isCallback ? <AuthCallback /> : <App />}
    <Analytics />
  </StrictMode>,
)