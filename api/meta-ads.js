/**
 * VitaPass — Agent Meta Ads
 * Vercel Cron Job : tous les jours à 9h00 (0 9 * * *)
 *
 * Pipeline :
 *  1. Vérifier le solde du compte publicitaire
 *  2. Chercher une campagne "VitaPass - Trafic Oran" existante
 *     → Si trouvée en PAUSED (brouillon) : la publier
 *     → Si absente : créer campagne + ad set
 *  3. Logger le statut et le solde
 */

const BASE          = 'https://graph.facebook.com/v19.0'
const TOKEN         = process.env.META_ACCESS_TOKEN
const ACCOUNT_ID    = process.env.META_AD_ACCOUNT_ID   // sans "act_"
const ACCOUNT       = `act_${ACCOUNT_ID}`
const CAMPAIGN_NAME = 'VitaPass - Trafic Oran'

// ── Helpers HTTP ─────────────────────────────────────────────────────────────

async function metaGet(path, params = {}) {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('access_token', TOKEN)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
  }
  const res  = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(`Meta GET ${path} — ${data.error.message} (code ${data.error.code})`)
  return data
}

async function metaPost(path, body = {}) {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('access_token', TOKEN)
  const res  = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (data.error) throw new Error(`Meta POST ${path} — ${data.error.message} (code ${data.error.code})`)
  return data
}

// ── 1. Solde du compte ───────────────────────────────────────────────────────

async function getAccountInfo() {
  return metaGet(`/${ACCOUNT}`, {
    fields: 'name,balance,currency,account_status',
  })
}

// ── 2. Recherche campagne existante ──────────────────────────────────────────

async function findCampaign() {
  const data = await metaGet(`/${ACCOUNT}/campaigns`, {
    fields: 'id,name,status,objective',
    limit:  100,
  })
  return (data.data ?? []).find(c => c.name === CAMPAIGN_NAME) ?? null
}

// ── 3. Publier une campagne en brouillon (PAUSED → ACTIVE) ───────────────────

async function publishCampaign(campaignId) {
  return metaPost(`/${campaignId}`, { status: 'ACTIVE' })
}

// ── 4. Trouver la clé géo de la ville d'Oran via Meta Targeting Search ───────

async function findOranCityKey() {
  try {
    const data = await metaGet('/search', {
      type:           'adgeolocation',
      q:              'Oran',
      location_types: ['city'],
      country_code:   'DZ',
    })
    const result = (data.data ?? []).find(
      r => r.name?.toLowerCase() === 'oran' && r.country_code === 'DZ'
    )
    return result?.key ?? null
  } catch {
    return null
  }
}

// ── 5. Créer campagne + ad set ────────────────────────────────────────────────

async function createCampaign() {
  // Campagne — objectif trafic (OUTCOME_TRAFFIC = LINK_CLICKS en API v17+)
  const campaign = await metaPost(`/${ACCOUNT}/campaigns`, {
    name:                 CAMPAIGN_NAME,
    objective:            'OUTCOME_TRAFFIC',
    status:               'ACTIVE',
    special_ad_categories: [],
  })

  // Ciblage géographique : ville d'Oran si la clé est trouvée, sinon Algérie entière
  const cityKey      = await findOranCityKey()
  const geoLocations = cityKey
    ? { cities: [{ key: cityKey }] }
    : { countries: ['DZ'] }

  if (!cityKey) {
    console.warn('[meta-ads] Clé géo Oran introuvable — ciblage sur DZ entier')
  }

  // Ad Set — budget + ciblage
  const adset = await metaPost(`/${ACCOUNT}/adsets`, {
    name:              'VitaPass — Oran 25-55',
    campaign_id:       campaign.id,
    daily_budget:      500,            // 500 centimes = 5 €/jour
    billing_event:     'IMPRESSIONS',
    optimization_goal: 'LINK_CLICKS',
    bid_strategy:      'LOWEST_COST_WITHOUT_CAP',
    targeting: {
      geo_locations: geoLocations,
      age_min: 25,
      age_max: 55,
    },
    status: 'ACTIVE',
  })

  return { campaign, adset }
}

// ── Handler principal ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'] ?? ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // 1. Solde
    const account  = await getAccountInfo()
    const { balance, currency } = account
    console.log(`[meta-ads] Compte : ${account.name} | Solde : ${balance} ${currency}`)

    // 2. Campagne existante ?
    const existing = await findCampaign()
    let campaignId, campaignStatus

    if (existing) {
      campaignId = existing.id

      if (existing.status === 'PAUSED') {
        // Brouillon → publier
        await publishCampaign(campaignId)
        campaignStatus = 'ACTIVE (réactivée depuis brouillon)'
        console.log(`[meta-ads] Campagne publiée : ${campaignId}`)
      } else {
        campaignStatus = existing.status
        console.log(`[meta-ads] Campagne existante : ${campaignId} — ${campaignStatus}`)
      }
    } else {
      // Nouvelle campagne
      const { campaign, adset } = await createCampaign()
      campaignId     = campaign.id
      campaignStatus = 'ACTIVE (créée)'
      console.log(`[meta-ads] Campagne créée : ${campaignId} | Ad Set : ${adset.id}`)
    }

    console.log(`[meta-ads] Solde restant : ${balance} ${currency}`)

    return res.status(200).json({
      ok:       true,
      campaign: { id: campaignId, name: CAMPAIGN_NAME, status: campaignStatus },
      account:  { balance, currency },
    })
  } catch (err) {
    console.error('[meta-ads] Erreur :', err.message)
    return res.status(500).json({ error: err.message })
  }
}
