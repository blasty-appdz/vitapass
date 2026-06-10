-- VitaPass — Corrections Security Advisor Supabase
-- À exécuter dans le SQL Editor (une seule fois)
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. RLS — doctor_leads (accès service_role uniquement)
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.doctor_leads ENABLE ROW LEVEL SECURITY;

-- Aucune policy permissive → accès refusé pour anon et authenticated.
-- Le service_role contourne le RLS par défaut dans Supabase.
-- L'agent GitHub Actions utilise SUPABASE_SERVICE_ROLE_KEY → accès total.


-- ════════════════════════════════════════════════════════════
-- 2. RLS — agent_state (accès service_role uniquement)
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.agent_state ENABLE ROW LEVEL SECURITY;

-- Même logique : aucune policy = deny-all pour les users.
-- service_role contourne le RLS → l'agent peut lire/écrire normalement.


-- ════════════════════════════════════════════════════════════
-- 3. RLS — specialites (lecture publique pour l'app React)
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.specialites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "specialites_select_public"
  ON public.specialites
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Pas d'INSERT/UPDATE/DELETE pour les users → seul le service_role peut modifier.


-- ════════════════════════════════════════════════════════════
-- 4. Function Search Path Mutable — fixer search_path
-- ════════════════════════════════════════════════════════════
-- Empêche un attaquant de hijack les fonctions via un search_path malveillant.

ALTER FUNCTION public.handle_new_user()               SET search_path = '';
ALTER FUNCTION public.find_doctor_by_email(text)      SET search_path = '';
ALTER FUNCTION public.handle_new_professional()       SET search_path = '';
ALTER FUNCTION public.rls_auto_enable()               SET search_path = '';

-- Pour search_professionals : vérifier la signature exacte avec :
--   SELECT pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname = 'search_professionals';
-- Puis exécuter :
--   ALTER FUNCTION public.search_professionals(<signature>) SET search_path = '';


-- ════════════════════════════════════════════════════════════
-- 5. SECURITY DEFINER — révoquer accès anon + authenticated
-- ════════════════════════════════════════════════════════════
-- Ces fonctions ne doivent être appelables que par le backend (service_role/postgres).

REVOKE EXECUTE ON FUNCTION public.find_doctor_by_email(text)  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_professional()   FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()           FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()           FROM anon, authenticated;


-- ════════════════════════════════════════════════════════════
-- 6. Leaked Password Protection
-- ════════════════════════════════════════════════════════════
-- Ne peut PAS être activé via SQL.
-- À activer manuellement : Supabase Dashboard → Authentication → Settings
-- → "Enable leaked password protection" → ON
-- (vérifie les mots de passe contre la base HaveIBeenPwned)
