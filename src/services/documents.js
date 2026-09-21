/**
 * VitaPass — Ouverture des documents médicaux
 * Le stockage « documents » est PRIVÉ : un fichier ne s'ouvre qu'avec une URL signée à durée courte,
 * délivrée seulement au patient propriétaire ou à un médecin validé ayant un accès actif.
 */
import { supabase } from '../supabase'

const BUCKET = 'documents'

// Chemin du fichier dans le stockage : colonne storage_path, ou (anciens enregistrements)
// déduit de l'ancienne URL publique enregistrée dans file_url.
export function docStoragePath(doc) {
  if (doc?.storage_path) return doc.storage_path
  const url = doc?.file_url
  if (!url) return null
  const marker = `/${BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  return decodeURIComponent(url.slice(i + marker.length).split('?')[0])
}

export function hasDocumentFile(doc) {
  return Boolean(docStoragePath(doc))
}

export async function openDocument(doc, onError) {
  const path = docStoragePath(doc)
  if (!path) {
    onError?.('Fichier introuvable')
    return
  }
  // L'onglet est ouvert tout de suite (geste de l'utilisateur) pour ne pas être bloqué par le navigateur.
  const tab = window.open('', '_blank')
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300)
  if (error || !data?.signedUrl) {
    tab?.close()
    onError?.("Impossible d'ouvrir le fichier")
    return
  }
  if (tab) tab.location.href = data.signedUrl
  else window.open(data.signedUrl, '_blank')
}
