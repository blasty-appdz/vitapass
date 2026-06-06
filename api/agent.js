/**
 * VitaPass — Agent quotidien médecins
 * Vercel Cron Job : tous les jours à 8h00 (0 8 * * *)
 *
 * Ordre d'exécution :
 *  1. Prospection  — 4 sources : Google Maps, salama.dz, docteur.dz, Facebook
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
const PHONE_RE    = /(?:\+213|0)[2-7]\d[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}/g
const JUNK_EMAILS = ['noreply', 'no-reply', 'example', 'sentry', 'wix.com', 'wordpress', '@2x', '.png', '.jpg', '.svg']

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── Helpers communs ───────────────────────────────────────────────────────────

async function fetchHtml(url, timeoutMs = 10000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'User-Agent':      'Mozilla/5.0 (compatible; VitaPassBot/1.0; +https://vitapass.app)',
      'Accept':          'text/html,application/xhtml+xml',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

function extractEmails(html) {
  const found = new Set()
  const mailtoRe = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi
  let m
  while ((m = mailtoRe.exec(html)) !== null) {
    const e = m[1].split('?')[0].toLowerCase()
    if (!JUNK_EMAILS.some(j => e.includes(j))) found.add(e)
  }
  for (const e of (html.match(EMAIL_RE) ?? [])) {
    const lower = e.toLowerCase()
    if (!JUNK_EMAILS.some(j => lower.includes(j))) found.add(lower)
  }
  return [...found]
}

function extractFirstPhone(html) {
  const m = html.match(PHONE_RE)
  return m ? m[0].replace(/[\s.\-]/g, '') : null
}

function extractDoctorName(html, contextAround = '') {
  const src = contextAround || html
  // Dr. Prénom Nom ou Docteur Prénom Nom
  const m = src.match(/(?:Dr\.?|Docteur|Pr\.?)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+){1,2})/i)
  if (m) return m[0].trim()
  // Deux mots capitalisés consécutifs
  const n = src.match(/\b([A-ZÀ-Ÿ][a-zà-ÿ]{2,})\s+([A-ZÀ-Ÿ][a-zà-ÿ]{2,})\b/)
  return n ? `${n[1]} ${n[2]}` : null
}

function extractSpecialty(html) {
  const m = html.match(
    /\b(médecin généraliste|généraliste|pédiatr\w+|cardiolog\w+|gynécolog\w+|dermatolog\w+|chirurg\w+|ophtalmolog\w+|orthopéd\w+|neurolog\w+|psychiatr\w+|radiolog\w+|interniste|urologue|endocrinolog\w+|rhumatolog\w+|pneumolog\w+)/i
  )
  return m ? m[1].toLowerCase().replace(/^\w/, c => c.toUpperCase()) : null
}

// ── Déduplication & insertion ─────────────────────────────────────────────────

async function emailExists(email) {
  const { data } = await supabase
    .from('doctor_leads')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  return !!data
}

async function insertLeadSafe(lead) {
  if (await emailExists(lead.email)) return false
  const { error } = await supabase.from('doctor_leads').insert(lead)
  if (error) throw new Error(error.message)
  return true
}

// ── Source 1 : Google Places ──────────────────────────────────────────────────

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

async function extractEmailFromWebsite(website) {
  if (!website) return null
  try {
    const html     = await fetchHtml(website)
    const emails   = extractEmails(html)
    return emails[0] ?? null
  } catch { return null }
}

async function runGooglePlaces() {
  const report = { found: 0, inserted: 0, errors: 0 }

  for (const { query, specialty } of SEARCH_TERMS) {
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
        const inserted = await insertLeadSafe({
          full_name: name, email, phone, specialty,
          city: 'Oran', status: 'new', sequence_step: 0,
          notes: 'Trouvé via Google Maps',
        })
        if (inserted) { report.inserted++; console.log(`[google-maps] ✓ ${name} <${email}>`) }
        await sleep(200)
      } catch (err) {
        console.error(`[google-maps] ${place.name}: ${err.message}`)
        report.errors++
      }
    }
    await sleep(1000)
  }
  return report
}

// ── Source 2 : salama.dz ─────────────────────────────────────────────────────

async function scrapeSalamaDz() {
  const report  = { found: 0, inserted: 0, errors: 0 }
  const MAX_PAGES = 5

  for (let page = 1; page <= MAX_PAGES; page++) {
    let html
    try {
      html = await fetchHtml(`https://salama.dz/medecins?wilaya=oran&page=${page}`)
    } catch (err) {
      console.error(`[salama.dz] page ${page}: ${err.message}`)
      break
    }

    const emails = extractEmails(html)
    if (emails.length === 0 && page > 1) break  // plus de résultats

    for (const email of emails) {
      report.found++
      try {
        // Contexte HTML autour de l'email pour extraire nom/spécialité/téléphone
        const idx = html.toLowerCase().indexOf(email)
        const ctx = idx > -1 ? html.slice(Math.max(0, idx - 600), idx + 200) : html

        const name      = extractDoctorName(html, ctx) ?? 'Médecin Oran'
        const phone     = extractFirstPhone(ctx)
        const specialty = extractSpecialty(ctx)

        const inserted = await insertLeadSafe({
          full_name: name, email, phone, specialty,
          city: 'Oran', status: 'new', sequence_step: 0,
          notes: 'Trouvé via salama.dz',
        })
        if (inserted) { report.inserted++; console.log(`[salama.dz] ✓ ${name} <${email}>`) }
      } catch (err) {
        console.error(`[salama.dz] ${email}: ${err.message}`)
        report.errors++
      }
    }
    await sleep(800)
  }
  return report
}

// ── Source 3 : docteur.dz ─────────────────────────────────────────────────────

async function scrapeDocteurDz() {
  const report    = { found: 0, inserted: 0, errors: 0 }
  const MAX_PAGES = 5

  for (let page = 1; page <= MAX_PAGES; page++) {
    let html
    try {
      html = await fetchHtml(`https://docteur.dz/annuaire?ville=oran&page=${page}`)
    } catch (err) {
      console.error(`[docteur.dz] page ${page}: ${err.message}`)
      break
    }

    const emails = extractEmails(html)
    if (emails.length === 0 && page > 1) break

    for (const email of emails) {
      report.found++
      try {
        const idx = html.toLowerCase().indexOf(email)
        const ctx = idx > -1 ? html.slice(Math.max(0, idx - 600), idx + 200) : html

        const name      = extractDoctorName(html, ctx) ?? 'Médecin Oran'
        const phone     = extractFirstPhone(ctx)
        const specialty = extractSpecialty(ctx)

        const inserted = await insertLeadSafe({
          full_name: name, email, phone, specialty,
          city: 'Oran', status: 'new', sequence_step: 0,
          notes: 'Trouvé via docteur.dz',
        })
        if (inserted) { report.inserted++; console.log(`[docteur.dz] ✓ ${name} <${email}>`) }
      } catch (err) {
        console.error(`[docteur.dz] ${email}: ${err.message}`)
        report.errors++
      }
    }
    await sleep(800)
  }
  return report
}

// ── Source 4 : pages Facebook via Google Custom Search ───────────────────────

async function scrapeFacebookViaGoogle() {
  const report = { found: 0, inserted: 0, errors: 0 }

  // Récupérer les URLs de pages Facebook
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', SEARCH_KEY)
  url.searchParams.set('cx', SEARCH_CX)
  url.searchParams.set('q', 'site:facebook.com médecin OR docteur OR "cabinet médical" Oran')
  url.searchParams.set('num', '10')

  let items = []
  try {
    const res  = await fetch(url)
    const data = await res.json()
    items = data.items ?? []
  } catch (err) {
    console.error(`[facebook] Recherche Google: ${err.message}`)
    return report
  }

  for (const item of items) {
    const pageUrl = item.link
    if (!pageUrl?.includes('facebook.com')) continue

    report.found++
    try {
      await sleep(600)

      // Version mobile — contenu plus statique
      const mobileUrl = pageUrl.replace('www.facebook.com', 'm.facebook.com')
      let html
      try {
        html = await fetchHtml(mobileUrl, 8000)
      } catch {
        // Fallback : version desktop
        try { html = await fetchHtml(pageUrl, 8000) } catch { continue }
      }

      // Nom de la page depuis le titre
      const titleMatch = html.match(/<title[^>]*>\s*([^|<\n]{3,60})\s*[|<]/)
      const rawName    = titleMatch ? titleMatch[1].trim() : null
      const name       = rawName ?? extractDoctorName(html) ?? 'Médecin Oran'

      // Spécialité depuis le snippet Google ou le HTML
      const snippetCtx = (item.snippet ?? '') + html.slice(0, 2000)
      const specialty  = extractSpecialty(snippetCtx)
      const phone      = extractFirstPhone(html)

      // Email dans le HTML de la page
      let email = extractEmails(html)[0] ?? null

      // Si pas d'email sur la page → recherche Google avec le nom
      if (!email && rawName) {
        email = await searchEmailGoogle(rawName)
      }
      if (!email) continue

      const inserted = await insertLeadSafe({
        full_name: name, email, phone, specialty,
        city: 'Oran', status: 'new', sequence_step: 0,
        notes: `Trouvé via Facebook (${pageUrl})`,
      })
      if (inserted) { report.inserted++; console.log(`[facebook] ✓ ${name} <${email}>`) }
    } catch (err) {
      console.error(`[facebook] ${pageUrl}: ${err.message}`)
      report.errors++
    }
  }
  return report
}

// ── Orchestration prospection ─────────────────────────────────────────────────

async function runProspection() {
  const sources = {
    google_maps: await runGooglePlaces(),
    salama_dz:   await scrapeSalamaDz(),
    docteur_dz:  await scrapeDocteurDz(),
    facebook:    await scrapeFacebookViaGoogle(),
  }

  // Rapport agrégé
  const total = Object.values(sources).reduce(
    (acc, s) => ({ inserted: acc.inserted + s.inserted, errors: acc.errors + s.errors }),
    { inserted: 0, errors: 0 }
  )

  for (const [src, r] of Object.entries(sources)) {
    console.log(`[prospection] ${src} — trouvés: ${r.found ?? '?'}, insérés: ${r.inserted}, erreurs: ${r.errors}`)
  }

  return { ...total, sources }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTIE 2 — RELANCES EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

const FROM     = 'Samir — VitaPass <samir@vitapass.app>'
const DELAY_J3 = 72 * 60 * 60 * 1000
const DELAY_J7 = 4 * 24 * 60 * 60 * 1000

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
    console.log('[agent] prospection:', JSON.stringify(prospection))

    const relances = await runRelances()
    console.log('[agent] relances:', relances)

    return res.status(200).json({ ok: true, prospection, relances })
  } catch (err) {
    console.error('[agent] fatal:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
