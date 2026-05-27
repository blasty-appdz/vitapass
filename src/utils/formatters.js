/**
 * VitaPass — Utilitaires de formatage
 */

export const formatDate = (d) => {
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('fr-DZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d))
  } catch {
    return d
  }
}

export const getAvatarEmoji = (gender, role) => {
  if (role === 'doctor') return gender === 'Féminin' ? '👩‍⚕️' : '👨‍⚕️'
  return gender === 'Féminin' ? '👩' : '👨'
}

export const formatTime = (dateStr) => {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
