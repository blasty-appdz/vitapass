// src/hooks/useOffline.js
import { useState, useEffect, useCallback } from 'react'

const DB_NAME = 'vitapass_offline'
const DB_VERSION = 1
const STORES = ['profile', 'dossier', 'appointments', 'professionals']

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' })
        }
      })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveOffline(storeName, data) {
  try {
    const db = await openDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const record = Array.isArray(data)
      ? data.map((item, i) => ({ ...item, id: item.id || item.patient_id || String(i) }))
      : [{ ...data, id: data.id || data.patient_id || 'single' }]
    record.forEach((item) => store.put(item))
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn('[VitaPass Offline] saveOffline error:', err)
    return false
  }
}

export async function loadOffline(storeName) {
  try {
    const db = await openDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('[VitaPass Offline] loadOffline error:', err)
    return []
  }
}

export async function clearOffline(storeName) {
  try {
    const db = await openDB()
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).clear()
  } catch (err) {
    console.warn('[VitaPass Offline] clearOffline error:', err)
  }
}

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setWasOffline(true)
      setTimeout(() => setWasOffline(false), 4000)
    }
    const handleOffline = () => {
      setIsOffline(true)
      setWasOffline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready
        await reg.sync.register('vitapass-sync')
      } catch (err) {
        console.warn('[VitaPass Offline] Background sync not available:', err)
      }
    }
  }, [])

  return { isOffline, wasOffline, triggerSync }
}
