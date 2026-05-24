import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher({ style = {} }) {
  const { i18n } = useTranslation()

  const toggle = () => {
    const next = i18n.language === 'fr' ? 'ar' : 'fr'
    i18n.changeLanguage(next)
    localStorage.setItem('vitapass_lang', next)
  }

  return (
    <button
      onClick={toggle}
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: '5px 12px',
        color: '#EFF3FF',
        fontFamily: "'Syne', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        letterSpacing: '0.5px',
        ...style,
      }}
    >
      {i18n.language === 'fr' ? 'العربية' : 'Français'}
    </button>
  )
}