import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import './i18n'
import { Analytics } from '@vercel/analytics/react'

const isCallback = window.location.pathname === '/auth/callback'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isCallback ? <AuthCallback /> : <App />}
    <Analytics />
  </StrictMode>,
)