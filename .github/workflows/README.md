# GitHub Actions — VitaPass Agent

## Workflow : agent.yml

Lance automatiquement `runProspection()` + `runRelances()` toutes les heures.
Peut aussi être déclenché manuellement depuis l'onglet **Actions** du repo.

## Ajouter les secrets

1. Aller dans le repo GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Cliquer sur **New repository secret** pour chaque variable ci-dessous :

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | URL du projet Supabase (ex: `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase (Settings → API) |
| `RESEND_API_KEY` | Clé API Resend pour l'envoi des emails |
| `GOOGLE_PLACES_API_KEY` | Clé API Google Places (Google Cloud Console) |
| `GOOGLE_SEARCH_API_KEY` | Clé API Google Custom Search |
| `GOOGLE_SEARCH_CX` | ID du moteur Custom Search (programmablesearchengine.google.com) |

## Déclencher manuellement

GitHub → onglet **Actions** → **VitaPass Agent** → **Run workflow** → **Run workflow**

## Consulter les logs

GitHub → onglet **Actions** → cliquer sur un run → job **Prospection + Relances**
