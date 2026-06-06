/**
 * VitaPass — Agent séquence email médecins
 * Vercel Cron Job : toutes les heures (0 * * * *)
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getEmailJ0, getEmailJ3, getEmailJ7 } from './emails.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Samir — VitaPass <samir@vitapass.app>'

// Délais en millisecondes
const DELAY_J3 = 72 * 60 * 60 * 1000   // 72h après step 1
const DELAY_J7 = 4 * 24 * 60 * 60 * 1000 // 4 jours après step 2

async function sendEmail(lead, template) {
  const { subject, html, text } = template
  const { error } = await resend.emails.send({
    from: FROM,
    to: lead.email,
    subject,
    html,
    text,
  })
  if (error) throw new Error(`Resend error for ${lead.email}: ${error.message}`)
}

async function updateLead(id, step) {
  const { error } = await supabase
    .from('doctor_leads')
    .update({
      sequence_step: step,
      last_contact_at: new Date().toISOString(),
      status: step >= 3 ? 'final' : 'nurturing',
    })
    .eq('id', id)
  if (error) throw new Error(`DB update error for ${id}: ${error.message}`)
}

async function processLeads() {
  const now = Date.now()
  const results = { sent: 0, errors: 0, skipped: 0 }

  // ── J+0 : Nouveaux leads (step = 0) ─────────────────────────────────────────
  const { data: newLeads, error: e0 } = await supabase
    .from('doctor_leads')
    .select('*')
    .eq('sequence_step', 0)
    .neq('status', 'unsubscribed')
    .neq('status', 'converted')
    .neq('status', 'demo_scheduled')

  if (e0) throw new Error('Fetch new leads: ' + e0.message)

  for (const lead of newLeads ?? []) {
    try {
      await sendEmail(lead, getEmailJ0(lead))
      await updateLead(lead.id, 1)
      results.sent++
    } catch (err) {
      console.error('[J+0]', err.message)
      results.errors++
    }
  }

  // ── J+3 : Relance (step = 1, envoyé il y a ≥ 72h) ───────────────────────────
  const { data: step1Leads, error: e1 } = await supabase
    .from('doctor_leads')
    .select('*')
    .eq('sequence_step', 1)
    .neq('status', 'unsubscribed')
    .neq('status', 'converted')
    .neq('status', 'demo_scheduled')
    .lt('last_contact_at', new Date(now - DELAY_J3).toISOString())

  if (e1) throw new Error('Fetch step-1 leads: ' + e1.message)

  for (const lead of step1Leads ?? []) {
    try {
      await sendEmail(lead, getEmailJ3(lead))
      await updateLead(lead.id, 2)
      results.sent++
    } catch (err) {
      console.error('[J+3]', err.message)
      results.errors++
    }
  }

  // ── J+7 : Dernier message (step = 2, envoyé il y a ≥ 4 jours) ───────────────
  const { data: step2Leads, error: e2 } = await supabase
    .from('doctor_leads')
    .select('*')
    .eq('sequence_step', 2)
    .neq('status', 'unsubscribed')
    .neq('status', 'converted')
    .neq('status', 'demo_scheduled')
    .lt('last_contact_at', new Date(now - DELAY_J7).toISOString())

  if (e2) throw new Error('Fetch step-2 leads: ' + e2.message)

  for (const lead of step2Leads ?? []) {
    try {
      await sendEmail(lead, getEmailJ7(lead))
      await updateLead(lead.id, 3)
      results.sent++
    } catch (err) {
      console.error('[J+7]', err.message)
      results.errors++
    }
  }

  return results
}

export default async function handler(req, res) {
  // Sécurité : vérifier le secret cron
  const authHeader = req.headers['authorization'] ?? ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const results = await processLeads()
    console.log('[agent] done', results)
    return res.status(200).json({ ok: true, ...results })
  } catch (err) {
    console.error('[agent] fatal', err.message)
    return res.status(500).json({ error: err.message })
  }
}
