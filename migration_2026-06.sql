-- =============================================
-- AutoLass Übergabe – Migration Juni 2026
-- Im Supabase SQL Editor ausführen (einmalig)
-- =============================================

-- Wunsch-Übergabedatum komplett entfernen
ALTER TABLE vehicles DROP COLUMN IF EXISTS wunsch_uebergabedatum;

-- Werkstatttermin optional (nur Service-Nutzer pflegen ihn)
ALTER TABLE vehicles ALTER COLUMN werkstatttermin DROP NOT NULL;

-- Falls eine separate uebergabedatum-Spalte existiert und NOT NULL ist: optional machen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'vehicles' AND column_name = 'uebergabedatum') THEN
    ALTER TABLE vehicles ALTER COLUMN uebergabedatum DROP NOT NULL;
  END IF;
END $$;
