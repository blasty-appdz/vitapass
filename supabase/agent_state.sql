-- VitaPass — Table agent_state
-- État persistant de l'agent (rotation wilayas, etc.)
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_state (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS : désactivé (accès via service role uniquement)
ALTER TABLE agent_state DISABLE ROW LEVEL SECURITY;

-- Valeur initiale — l'agent commencera par la wilaya 0 (Alger)
INSERT INTO agent_state (key, value)
VALUES ('wilaya_index', '0'::jsonb)
ON CONFLICT (key) DO NOTHING;
