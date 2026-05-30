-- =============================================
-- AutoLass Übergabe – Supabase SQL Setup
-- Einmal im Supabase SQL Editor ausführen
-- =============================================

-- Fahrzeuge
CREATE TABLE IF NOT EXISTS vehicles (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fahrgestellnummer     VARCHAR(6) NOT NULL,
  kennzeichen           VARCHAR(20),
  modell                VARCHAR(100) NOT NULL,
  fahrzeugtyp           VARCHAR(2) NOT NULL CHECK (fahrzeugtyp IN ('NW', 'GW')),
  verkaeufer            VARCHAR(50) NOT NULL,
  kunde                 VARCHAR(100) NOT NULL,
  werkstatttermin       DATE NOT NULL,
  wunsch_uebergabedatum DATE NOT NULL,
  auslieferungsdatum    DATE NOT NULL,
  bemerkung             TEXT,
  status                INTEGER DEFAULT 1 CHECK (status BETWEEN 1 AND 8),
  created_by            VARCHAR(50) NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  uebergeben_at         TIMESTAMPTZ,
  is_archived           BOOLEAN DEFAULT FALSE
);

-- Statusverlauf
CREATE TABLE IF NOT EXISTS status_history (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id   UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  old_status   INTEGER,
  new_status   INTEGER NOT NULL,
  changed_by   VARCHAR(50) NOT NULL,
  changed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Verzögerungen
CREATE TABLE IF NOT EXISTS delays (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id      UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  grund           TEXT NOT NULL,
  neues_datum     DATE NOT NULL,
  gemeldet_von    VARCHAR(50) NOT NULL,
  gemeldet_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security aktivieren
ALTER TABLE vehicles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE delays         ENABLE ROW LEVEL SECURITY;

-- Policies: anon darf alles (kein Passwort-Auth)
CREATE POLICY "anon_all_vehicles"       ON vehicles       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_status_history" ON status_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_delays"         ON delays         FOR ALL USING (true) WITH CHECK (true);

-- Realtime für vehicles aktivieren (im Supabase Dashboard unter Database > Replication prüfen)
-- ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
