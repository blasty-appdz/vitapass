// src/components/OfflineBanner.jsx
import { useOffline } from '../hooks/useOffline'

export default function OfflineBanner() {
  const { isOffline, wasOffline } = useOffline()

  if (!isOffline && !wasOffline) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: 600,
        backgroundColor: isOffline ? '#1e293b' : '#16a34a',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {isOffline ? (
        <>
          <span style={{ fontSize: '16px' }}>📵</span>
          <span>Mode hors ligne — données locales affichées</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: '16px' }}>✅</span>
          <span>Connexion rétablie — synchronisation en cours…</span>
        </>
      )}
    </div>
  )
}