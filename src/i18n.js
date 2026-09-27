import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import ar from './locales/ar.json'

let saved = 'fr'
try { saved = localStorage.getItem('vitapass_lang') || 'fr' } catch { /* stockage indisponible */ }

// Arabe : lecture de droite à gauche
const applyDir = (lng) => {
  document.documentElement.lang = lng
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: saved,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  })

applyDir(saved)
i18n.on('languageChanged', (lng) => {
  applyDir(lng)
  try { localStorage.setItem('vitapass_lang', lng) } catch { /* ignore */ }
})

export default i18n
