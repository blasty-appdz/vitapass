import Icon, { splitLeadingEmoji } from './Icon'

const KIND = { '✅': 'ok', '✓': 'ok', '❌': 'ko', '⚠️': 'wa', '⚠': 'wa' }

export default function Toast({ msg, className = 'toast' }) {
  const { emoji, text } = splitLeadingEmoji(msg)
  return (
    <div className={className} role="status">
      {emoji && <span className={KIND[emoji] || 'ok'} style={{ display: 'flex' }}><Icon e={emoji} size={18} /></span>}
      <span>{emoji ? (text || (KIND[emoji] === 'ko' ? 'Erreur' : 'Enregistré')) : msg}</span>
    </div>
  )
}
