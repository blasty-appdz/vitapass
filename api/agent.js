/**
 * VitaPass — Agent quotidien médecins
 * Vercel Cron Job : tous les jours à 8h00 (0 8 * * *)
 *
 * Ordre d'exécution :
 *  1. Prospection  — Google Places → email hunting → insertion doctor_leads
 *  2. Relances     — séquence J+0 / J+3 / J+7 via Resend
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getEmailJ0, getEmailJ3, getEmailJ7 } from './emails.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

// ═══════════════════════════════════════════════════════════════════════════════
// PARTIE 1 — PROSPECTION
// ═══════════════════════════════════════════════════════════════════════════════

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY
const SEARCH_KEY = process.env.GOOGLE_SEARCH_API_KEY
const SEARCH_CX  = process.env.GOOGLE_SEARCH_CX

const SEARCH_TERMS = [
  { query: 'médecin généraliste Oran', specialty: 'Médecin généraliste' },
  { query: 'pédiatre Oran',            specialty: 'Pédiatrie'            },
  { query: 'cardiologue Oran',          specialty: 'Cardiologie'          },
  { query: 'gynécologue Oran',          specialty: 'Gynécologie'          },
  { query: 'dermatologue Oran',         specialty: 'Dermatologie'         },
  { query: 'médecin Oran',              specialty: 'Médecin'              },
]

const EMAIL_RE    = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const JUNK_EMAILS = ['noreply', 'no-reply', 'example', 'sentry', 'wix.com', 'wordpress']

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function searchPlaces(query) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('key', PLACES_KEY)
  const res  = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places TextSearch [${data.status}]: ${data.error_message ?? ''}`)
  }
  return data.results ?? []
}

async function getPlaceDetails(placeId) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website')
  url.searchParams.set('key', PLACES_KEY)
  const res  = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK') return null
  return data.result ?? null
}

async function extractEmailFromWebsite(website) {
  if (!website) return null
  try {
    const res = await fetch(website, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VitaPassBot/1.0; +https://vitapass.app)' },
    })
    if (!res.ok) return null
    const html = await res.text()
    const mailtoRe = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi
    let m
    while ((m = mailtoRe.exec(html)) !== null) {
      const email = m[1].split('?')[0].toLowerCase()
      if (!JUNK_EMAILS.some(j => email.includes(j))) return email
    }
    const raw = html.match(EMAIL_RE) ?? []
    for (const email of raw) {
      const e = email.toLowerCase()
      if (!JUNK_EMAILS.some(j => e.includes(j))) return e
    }
  } catch {
    // timeout réseau ou accès bloqué — on ignore
  }
  return null
}

async function searchEmailGoogle(name) {
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', SEARCH_KEY)
  url.searchParams.set('cx', SEARCH_CX)
  url.searchParams.set('q', `"${name}" médecin Oran email`)
  url.searchParams.set('num', '5')
  try {
    const res  = await fetch(url)
    const data = await res.json()
    for (const item of data.items ?? []) {
      const text    = (item.snippet ?? '') + (item.htmlSnippet ?? '')
      const matches = text.match(EMAIL_RE) ?? []
      for (const email of matches) {
        const e = email.toLowerCase()
        if (!JUNK_EMAILS.some(j => e.includes(j))) return e
      }
    }
  } catch (err) {
    console.error(`[search-google] "${name}": ${err.message}`)
  }
  return null
}

async function findEmail(name, website) {
  if (website) {
    const email = await extractEmailFromWebsite(website)
    if (email) return email
  }
  return searchEmailGoogle(name)
}

async function emailExists(email) {
  const { data } = await supabase
    .from('doctor_leads')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  return !!data
}

async function runProspection() {
  const report = { found: 0, emails_found: 0, inserted: 0, skipped: 0, errors: 0 }

  for (const { query, specialty } of SEARCH_TERMS) {
    console.log(`[prospection] Recherche : "${query}"`)
    let places = []
    try {
      places = await searchPlaces(query)
    } catch (err) {
      console.error(`[places] ${err.message}`)
      report.errors++
      continue
    }
    report.found += places.length

    for (const place of places) {
      try {
        await sleep(300)
        const details = await getPlaceDetails(place.place_id)
        if (!details) continue
        const name    = details.name                   ?? place.name
        const phone   = details.formatted_phone_number ?? null
        const website = details.website                ?? null
        const email   = await findEmail(name, website)
        if (!email) continue
        report.emails_found++
        if (await emailExists(email)) { report.skipped++; continue }
        const { error } = await supabase.from('doctor_leads').insert({
          full_name:     name,
          email,
          phone,
          specialty,
          city:          'Oran',
          status:        'new',
          sequence_step: 0,
          notes:         'Trouvé via prospection automatique Google Maps',
        })
        if (error) throw new Error(error.message)
        report.inserted++
        console.log(`[prospection] Inséré : ${name} <${email}>`)
        await sleep(200)
      } catch (err) {
        console.error(`[prospection] Erreur (${place.name}): ${err.message}`)
        report.errors++
      }
    }
    await sleep(1000)
  }
  return report
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTIE 2 — RELANCES EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

const FROM     = 'Samir — VitaPass <samir@vitapass.app>'
const DELAY_J3 = 72 * 60 * 60 * 1000      // 72h après step 1
const DELAY_J7 = 4 * 24 * 60 * 60 * 1000  // 4 jours après step 2

async function sendEmail(lead, template) {
  const { subject, html, text } = template
  const { error } = await resend.emails.send({ from: FROM, to: lead.email, subject, html, text })
  if (error) throw new Error(`Resend (${lead.email}): ${error.message}`)
}

async function updateLead(id, step) {
  const { error } = await supabase
    .from('doctor_leads')
    .update({
      sequence_step:   step,
      last_contact_at: new Date().toISOString(),
      status:          step >= 3 ? 'final' : 'nurturing',
    })
    .eq('id', id)
  if (error) throw new Error(`DB update (${id}): ${error.message}`)
}

async function runRelances() {
  const now    = Date.now()
  const report = { sent: 0, errors: 0 }
  const EXCLUDE = ['unsubscribed', 'converted', 'demo_scheduled']

  // J+0 — nouveaux leads
  const { data: newLeads, error: e0 } = await supabase
    .from('doctor_leads')
    .select('*')
    .eq('sequence_step', 0)
    .not('status', 'in', `(${EXCLUDE.join(',')})`)
  if (e0) throw new Error('Fetch new leads: ' + e0.message)

  for (const lead of newLeads ?? []) {
    try {
      await sendEmail(lead, getEmailJ0(lead))
      await updateLead(lead.id, 1)
      report.sent++
    } catch (err) { console.error('[J+0]', err.message); report.errors++ }
  }

  // J+3 — relance douce
  const { data: step1Leads, error: e1 } = await supabase
    .from('doctor_leads')
    .select('*')
    .eq('sequence_step', 1)
    .not('status', 'in', `(${EXCLUDE.join(',')})`)
    .lt('last_contact_at', new Date(now - DELAY_J3).toISOString())
  if (e1) throw new Error('Fetch step-1 leads: ' + e1.message)

  for (const lead of step1Leads ?? []) {
    try {
      await sendEmail(lead, getEmailJ3(lead))
      await updateLead(lead.id, 2)
      report.sent++
    } catch (err) { console.error('[J+3]', err.message); report.errors++ }
  }

  // J+7 — dernier message
  const { data: step2Leads, error: e2 } = await supabase
    .from('doctor_leads')
    .select('*')
    .eq('sequence_step', 2)
    .not('status', 'in', `(${EXCLUDE.join(',')})`)
    .lt('last_contact_at', new Date(now - DELAY_J7).toISOString())
  if (e2) throw new Error('Fetch step-2 leads: ' + e2.message)

  for (const lead of step2Leads ?? []) {
    try {
      await sendEmail(lead, getEmailJ7(lead))
      await updateLead(lead.id, 3)
      report.sent++
    } catch (err) { console.error('[J+7]', err.message); report.errors++ }
  }

  return report
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'] ?? ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const prospection = await runProspection()
    console.log('[agent] prospection:', prospection)

    const relances = await runRelances()
    console.log('[agent] relances:', relances)

    return res.status(200).json({ ok: true, prospection, relances })
  } catch (err) {
    console.error('[agent] fatal:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
