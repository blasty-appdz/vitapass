import { usePushNotifications } from '../hooks/usePushNotifications'
import { useTranslation } from 'react-i18next'

export default function PushNotificationToggle() {
  const { t } = useTranslation()
  const { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications()

  if (!isSupported) return null
  if (permission === 'denied') return (
    <div style={{
      padding: '12px 16px',
      background: '#fef3c7',
      borderRadius: 12,
      fontSize: 13,
      color: '#92400e',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span>🔕</span>
      <span>{t('push.blocked', 'Notifications bloquées — modifie les paramètres du navigateur')}</span>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      background: 'var(--color-surface, #f8fafc)',
      borderRadius: 14,
      border: '1px solid var(--color-border, #e2e8f0)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>🔔</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text, #1e293b)' }}>
            {t('push.title', 'Notifications push')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted, #64748b)', marginTop: 2 }}>
            {isSubscribed
              ? t('push.active', 'Activées — rappels RDV, messages médecin')
              : t('push.inactive', 'Désactivées')}
          </div>
        </div>
      </div>

      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={loading}
        style={{
          position: 'relative',
          width: 48,
          height: 28,
          borderRadius: 14,
          border: 'none',
          background: isSubscribed ? '#10b981' : '#cbd5e1',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          flexShrink: 0,
          opacity: loading ? 0.6 : 1,
        }}
        aria-label={isSubscribed ? 'Désactiver les notifications' : 'Activer les notifications'}
      >
        <span style={{
          position: 'absolute',
          top: 3,
          left: isSubscribed ? 23 : 3,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}