import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)
    if (supported) {
      setPermission(Notification.permission)
      checkExistingSubscription()
    }
  }, [])

  async function checkExistingSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    } catch (e) {
      console.error('checkExistingSubscription:', e)
    }
  }

  const subscribe = useCallback(async () => {
    if (!isSupported) return { error: 'Non supporté' }
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setLoading(false)
        return { error: 'Permission refusée' }
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const subJson = sub.toJSON()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        }, { onConflict: 'user_id,endpoint' })

      if (error) throw error
      setIsSubscribed(true)
      setLoading(false)
      return { success: true }
    } catch (e) {
      console.error('subscribe:', e)
      setLoading(false)
      return { error: e.message }
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', sub.endpoint)
        }
      }
      setIsSubscribed(false)
      setLoading(false)
      return { success: true }
    } catch (e) {
      console.error('unsubscribe:', e)
      setLoading(false)
      return { error: e.message }
    }
  }, [])

  return { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe }
}