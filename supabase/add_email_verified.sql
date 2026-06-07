-- VitaPass — Ajout colonne email_verified à doctor_leads
-- À exécuter dans Supabase SQL Editor

ALTER TABLE doctor_leads
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true;

-- Les lignes existantes conservent email_verified = true (emails réels)
-- Les emails devinés seront insérés avec email_verified = false

CREATE INDEX IF NOT EXISTS idx_doctor_leads_email_verified
  ON doctor_leads (email_verified);
