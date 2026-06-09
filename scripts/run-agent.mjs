/**
 * VitaPass — Point d'entrée GitHub Actions
 * Lance runProspection() puis runRelances() directement
 */

import { runProspection, runRelances } from '../api/agent.js'

console.log('=== VitaPass Agent démarré ===', new Date().toISOString())
console.log('SUPABASE_URL:', process.env.SUPABASE_URL?.substring(0, 30))

const prospection = await runProspection()
console.log('[résultat] prospection:', JSON.stringify({
  wilayas:  prospection.wilayas,
  inserted: prospection.inserted,
  errors:   prospection.errors,
}, null, 2))

const relances = await runRelances()
console.log('[résultat] relances:', JSON.stringify(relances, null, 2))

console.log('=== Agent terminé ===', new Date().toISOString())
