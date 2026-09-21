# VitaPass — Instructions pour Claude Code

## C'est quoi VitaPass
Application de dossier médical d'urgence pour l'Algérie.

## Stack technique
- Frontend : React + Vite
- Backend : Supabase (https://qklhzepfbhihtlgqbweo.supabase.co)
- Déploiement : Vercel
- OS : Windows, VS Code, PowerShell
- Langages : JS/JSX uniquement

## Repos locaux
- App patient : C:\Users\allbu\vitapass-react\
- Admin : C:\Users\allbu\vitapass-admin\
- Landing : C:\Users\allbu\vitapass-landing\

## Domaines
- vitapass.app → app patient + landing
- app.vitapass.app → app React
- admin.vitapass.app → dashboard admin

## Comptes démo
- Comptes de démonstration : patient.demo@vitapass.app, docteur.demo@vitapass.app, admin@vitapass.app
- Les mots de passe ne sont JAMAIS écrits dans le dépôt : ils sont dans le gestionnaire de mots de passe de Samir.
- Le rôle admin ne se donne que côté base (tableau de bord Supabase) ; l'API ne peut ni donner un rôle ni valider un médecin.

## Règles absolues
- Toujours fichier COMPLET, jamais de modifications partielles
- Jamais .single() → utiliser .maybeSingle()
- Jamais d embedded joins Supabase
- Toujours finir par : git add . && git commit -m "..." && git push
- Pas de Python → Node.js uniquement
- Pas de TypeScript → JS/JSX uniquement

## Fix emojis dans JSX
Ne jamais écrire : <span>🚀</span>
Toujours écrire : <span>{"🚀"}</span>
