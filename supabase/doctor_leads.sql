-- VitaPass — Table doctor_leads
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS doctor_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  phone               TEXT,
  specialty           TEXT,
  city                TEXT,
  status              TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new','contacted','nurturing','final','demo_scheduled','converted','unsubscribed')),
  sequence_step       INTEGER NOT NULL DEFAULT 0,
  last_contact_at     TIMESTAMPTZ,
  demo_scheduled_at   TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes de l'agent
CREATE INDEX IF NOT EXISTS idx_doctor_leads_step    ON doctor_leads (sequence_step);
CREATE INDEX IF NOT EXISTS idx_doctor_leads_status  ON doctor_leads (status);
CREATE INDEX IF NOT EXISTS idx_doctor_leads_contact ON doctor_leads (last_contact_at);

-- RLS : désactivé (accès via service role uniquement)
ALTER TABLE doctor_leads DISABLE ROW LEVEL SECURITY;
