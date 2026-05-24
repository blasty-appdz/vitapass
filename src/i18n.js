import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import ar from './locales/ar.json'

const saved = localStorage.getItem('vitapass_lang') || 'fr'

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

export default i18n