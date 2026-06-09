/**
 * Test email J+0 via Resend
 * Usage : RESEND_API_KEY=re_xxx node scripts/test-email.mjs
 */

import { Resend } from 'resend'
import { getEmailJ0 } from '../api/emails.js'

const RESEND_API_KEY = process.env.RESEND_API_KEY
if (!RESEND_API_KEY) {
  console.error('❌  RESEND_API_KEY manquante')
  console.error('    Usage : RESEND_API_KEY=re_xxx node scripts/test-email.mjs')
  process.exit(1)
}

const resend   = new Resend(RESEND_API_KEY)
const fakeLead = { full_name: 'Dr. Mohamed' }
const email    = getEmailJ0(fakeLead)

console.log('📧  Envoi du test J+0 à snaceri99@yahoo.com...')
console.log('    Sujet :', email.subject)

const { data, error } = await resend.emails.send({
  from:    'Samir VitaPass <samir@vitapass.app>',
  to:      'snaceri99@yahoo.com',
  subject: email.subject,
  html:    email.html,
  text:    email.text,
})

if (error) {
  console.error('❌  Erreur Resend :', error)
  process.exit(1)
}

console.log('✅  Email envoyé ! ID :', data.id)
