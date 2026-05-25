import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_MAILTO = Deno.env.get('VAPID_MAILTO')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function base64urlToUint8Array(b64: string): Uint8Array {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function buildVapidJWT(audience: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' }
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_MAILTO,
  }
  const enc = new TextEncoder()
  const headerB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(header)))
  const payloadB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(payload)))
  const signingInput = `${headerB64}.${payloadB64}`

  const pubBytes = base64urlToUint8Array(VAPID_PUBLIC_KEY)
  const x = uint8ArrayToBase64url(pubBytes.slice(1, 33))
  const y = uint8ArrayToBase64url(pubBytes.slice(33, 65))

  const signingKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: VAPID_PRIVATE_KEY, x, y, key_ops: ['sign'] },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    enc.encode(signingInput)
  )
  return `${signingInput}.${uint8ArrayToBase64url(new Uint8Array(sig))}`
}

async function encryptPayload(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const enc = new TextEncoder()
  const authSecret = base64urlToUint8Array(subscription.keys.auth)
  const receiverPublicKeyRaw = base64urlToUint8Array(subscription.keys.p256dh)

  const senderKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']
  )
  const senderPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', senderKeyPair.publicKey)
  )
  const receiverPublicKey = await crypto.subtle.importKey(
    'raw', receiverPublicKeyRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  )
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverPublicKey },
    senderKeyPair.privateKey, 256
  )

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const ikm = new Uint8Array(sharedBits)
  const prkKeyMaterial = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const keyInfoBase = new Uint8Array([
    ...enc.encode('WebPush: info\x00'),
    ...receiverPublicKeyRaw,
    ...senderPublicKeyRaw,
  ])
  const prkKey = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: keyInfoBase }, prkKeyMaterial, 256
  )
  const ikmMaterial = await crypto.subtle.importKey('raw', prkKey, 'HKDF', false, ['deriveBits'])

  const cekInfo = enc.encode('Content-Encoding: aes128gcm\x00')
  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo }, ikmMaterial, 128
  )
  const cek = await crypto.subtle.importKey('raw', cekBits, 'AES-GCM', false, ['encrypt'])

  const nonceInfo = enc.encode('Content-Encoding: nonce\x00')
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo }, ikmMaterial, 96
  )
  const nonce = new Uint8Array(nonceBits)

  const plaintextBytes = enc.encode(payload)
  const padded = new Uint8Array(plaintextBytes.length + 2)
  padded.set(plaintextBytes)
  padded[plaintextBytes.length] = 2
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cek, padded)
  )

  return { ciphertext, salt, serverPublicKey: senderPublicKeyRaw }
}

function buildAes128gcmBody(salt: Uint8Array, serverPublicKey: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const header = new Uint8Array(21 + serverPublicKey.length)
  header.set(salt, 0)
  new DataView(header.buffer).setUint32(16, 4096, false)
  header[20] = serverPublicKey.length
  header.set(serverPublicKey, 21)
  const result = new Uint8Array(header.length + ciphertext.length)
  result.set(header)
  result.set(ciphertext, header.length)
  return result
}

async function sendNotification(
  sub: { endpoint: string; p256dh: string; auth: string },
  notification: { title: string; body: string; url?: string; icon?: string }
) {
  const payload = JSON.stringify(notification)
  const url = new URL(sub.endpoint)
  const audience = `${url.protocol}//${url.host}`
  const { ciphertext, salt, serverPublicKey } = await encryptPayload(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    payload
  )
  const body = buildAes128gcmBody(salt, serverPublicKey, ciphertext)
  const vapidJWT = await buildVapidJWT(audience)

  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Authorization': `vapid t=${vapidJWT},k=${VAPID_PUBLIC_KEY}`,
      'TTL': '86400',
    },
    body,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { user_id, notification } = await req.json()
    if (!user_id || !notification?.title) {
      return new Response(JSON.stringify({ error: 'user_id et notification.title requis' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user_id)

    if (error) throw error
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'Aucune subscription' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const results = await Promise.allSettled(
      subs.map(sub => sendNotification(sub, notification))
    )
    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return new Response(JSON.stringify({ sent, failed, total: subs.length }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    console.error('send-push error:', e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})