/**
 * VitaPass — Validation des formulaires
 */

export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email requis'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Email invalide'
  return null
}

export const validatePassword = (password) => {
  if (!password) return 'Mot de passe requis'
  if (password.length < 6) return 'Au moins 6 caractères requis'
  return null
}

export const validateRequired = (value, label = 'Ce champ') => {
  if (!value || !String(value).trim()) return `${label} est requis`
  return null
}

export const validatePhone = (phone) => {
  if (!phone) return null // facultatif
  if (!/^[+\d\s().-]{8,}$/.test(phone)) return 'Numéro de téléphone invalide'
  return null
}

/**
 * Valide un objet de champs et retourne { errors, isValid }
 * @param {Object} fields - { fieldName: { value, rules: [fn] } }
 */
export const validateForm = (fields) => {
  const errors = {}
  let isValid = true
  Object.entries(fields).forEach(([key, { value, rules }]) => {
    for (const rule of rules) {
      const error = rule(value)
      if (error) {
        errors[key] = error
        isValid = false
        break
      }
    }
  })
  return { errors, isValid }
}
