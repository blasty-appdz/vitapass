/**
 * VitaPass — Agent de prospection automatique médecins
 * Vercel Cron Job : tous les jours à 8h00 (0 8 * * *)
 *
 * Pipeline :
 *  1. Google Places Text Search → liste de médecins à Oran
 *  2. Google Places Details → phone + website par médecin
 *  3. Email hunting : scraping website (mailto:) + Google Custom Search
 *  4. Déduplication via doctor_leads.email (UNIQUE)
 *  5. Insertion Supabase + rapport final
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const JUNK_EMAILS = ['noreply', 'no-reply', 'example', 'sentry', 'wix.com', 'wordpress']

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── 1. Google Places Text Search ─────────────────────────────────────────────

async function searchPlaces(query) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('key', PLACES_KEY)

  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places TextSearch [${data.status}]: ${data.error_message ?? ''}`)
  }
  return data.results ?? []
}

// ── 2. Google Places Details ─────────────────────────────────────────────────

async function getPlaceDetails(placeId) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website')
  url.searchParams.set('key', PLACES_KEY)

  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK') return null
  return data.result ?? null
}

// ── 3a. Email — scraping site web ────────────────────────────────────────────

async function extractEmailFromWebsite(website) {
  if (!website) return null
  try {
    const res = await fetch(website, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VitaPassBot/1.0; +https://vitapass.app)' },
    })
    if (!res.ok) return null
    const html = await res.text()

    // Priorité aux liens mailto:
    const mailtoRe = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi
    let m
    while ((m = mailtoRe.exec(html)) !== null) {
      const email = m[1].split('?')[0].toLowerCase()
      if (!JUNK_EMAILS.some(j => email.includes(j))) return email
    }

    // Fallback : scan brut du HTML
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

// ── 3b. Email — Google Custom Search ─────────────────────────────────────────

async function searchEmailGoogle(name) {
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', SEARCH_KEY)
  url.searchParams.set('cx', SEARCH_CX)
  url.searchParams.set('q', `"${name}" médecin Oran email`)
  url.searchParams.set('num', '5')

  try {
    const res = await fetch(url)
    const data = await res.json()

    for (const item of data.items ?? []) {
      const text = (item.snippet ?? '') + (item.htmlSnippet ?? '')
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

// ── 3. Orchestration email hunting ───────────────────────────────────────────

async function findEmail(name, website) {
  // Site web en premier : gratuit, sans quota API
  if (website) {
    const email = await extractEmailFromWebsite(website)
    if (email) return email
  }
  // Google Custom Search en fallback
  return searchEmailGoogle(name)
}

// ── 4. Déduplication ─────────────────────────────────────────────────────────

async function emailExists(email) {
  const { data } = await supabase
    .from('doctor_leads')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  return !!data
}

// ── 5. Insertion ─────────────────────────────────────────────────────────────

async function insertLead(lead) {
  const { error } = await supabase.from('doctor_leads').insert(lead)
  if (error) throw new Error(`Insert: ${error.message}`)
}

// ── Handler principal ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'] ?? ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const report = { found: 0, emails_found: 0, inserted: 0, skipped: 0, errors: 0 }

  for (const { query, specialty } of SEARCH_TERMS) {
    console.log(`[prospector] Recherche : "${query}"`)

    let places = []
    try {
      places = await searchPlaces(query)
    } catch (err) {
      console.error(`[places] ${err.message}`)
      report.errors++
      continue
    }

    report.found += places.length
    console.log(`[prospector] ${places.length} résultats pour "${query}"`)

    for (const place of places) {
      try {
        await sleep(300) // respect quota Places API

        const details = await getPlaceDetails(place.place_id)
        if (!details) continue

        const name    = details.name                   ?? place.name
        const phone   = details.formatted_phone_number ?? null
        const website = details.website                ?? null

        const email = await findEmail(name, website)
        if (!email) {
          console.log(`[prospector] Pas d'email : ${name}`)
          continue
        }
        report.emails_found++

        if (await emailExists(email)) {
          console.log(`[prospector] Déjà présent : ${email}`)
          report.skipped++
          continue
        }

        await insertLead({
          full_name:    name,
          email,
          phone,
          specialty,
          city:         'Oran',
          status:       'new',
          sequence_step: 0,
          notes:        'Trouvé via prospection automatique Google Maps',
        })
        report.inserted++
        console.log(`[prospector] Inséré : ${name} <${email}>`)

        await sleep(200)
      } catch (err) {
        console.error(`[prospector] Erreur (${place.name}): ${err.message}`)
        report.errors++
      }
    }

    await sleep(1000) // pause entre les termes de recherche
  }

  // Rapport final
  console.log('[prospector] Terminé —', JSON.stringify(report))
  return res.status(200).json({ ok: true, ...report })
}
