import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { VERKAEUFER, TOYOTA_MODELS, isService } from '../constants';

const emptyForm = {
  fahrgestellnummer: '',
  kennzeichen: '',
  modell: '',
  fahrzeugtyp: 'NW',
  verkaeufer: '',
  kunde: '',
  werkstatttermin: '',
  auslieferungsdatum: '',
  bemerkung: '',
};

export default function VehicleForm({ user, vehicle, onClose, onSaved }) {
  const isEdit = !!vehicle;
  const service = isService(user);
  const [form, setForm] = useState(isEdit ? {
    fahrgestellnummer: vehicle.fahrgestellnummer || '',
    kennzeichen: vehicle.kennzeichen || '',
    modell: vehicle.modell || '',
    fahrzeugtyp: vehicle.fahrzeugtyp || 'NW',
    verkaeufer: vehicle.verkaeufer || '',
    kunde: vehicle.kunde || '',
    werkstatttermin: vehicle.werkstatttermin || '',
    auslieferungsdatum: vehicle.auslieferungsdatum || '',
    bemerkung: vehicle.bemerkung || '',
  } : { ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [gwSuggestions, setGwSuggestions] = useState([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // GW-Modell-Autocomplete: bereits eingetragene Modelle + Toyota-Liste
  useEffect(() => {
    supabase.from('vehicles').select('modell').then(({ data }) => {
      const existing = (data || []).map(r => r.modell).filter(Boolean);
      setGwSuggestions([...new Set([...TOYOTA_MODELS, ...existing])]);
    });
  }, []);

  const validate = () => {
    if (form.fahrgestellnummer.length !== 6 || !/^\d+$/.test(form.fahrgestellnummer))
      return 'Fahrgestellnummer: genau 6 Ziffern eingeben.';
    if (!form.modell.trim()) return 'Modell ist Pflicht.';
    if (!form.verkaeufer) return 'Verkäufer auswählen.';
    if (!form.kunde.trim()) return 'Kunde ist Pflicht.';
    if (!form.auslieferungsdatum) return 'Auslieferungsdatum ist Pflicht.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError('');

    // Verkäufer dürfen Werkstatttermin nicht ändern → bestehenden Wert behalten
    const payload = { ...form };
    if (!service && isEdit) payload.werkstatttermin = vehicle.werkstatttermin;
    if (!payload.werkstatttermin) payload.werkstatttermin = null;

    if (isEdit) {
      const { error: upErr } = await supabase
        .from('vehicles')
        .update(payload)
        .eq('id', vehicle.id);
      if (upErr) { setError(upErr.message); setSaving(false); return; }
    } else {
      const { error: insErr } = await supabase
        .from('vehicles')
        .insert({ ...payload, status: 1, created_by: user });
      if (insErr) { setError(insErr.message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 0,
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px 16px 0 0', padding: 24,
        width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#282830', fontSize: 18 }}>{isEdit ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug'}</h3>
          <button onClick={onClose} style={{ background: '#f0f0f0', padding: '6px 12px', borderRadius: 8, fontWeight: 600, fontSize: 15 }}>✕</button>
        </div>

        {/* FIN */}
        <Field label="Fahrgestellnummer (letzte 6 Stellen) *">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: 15 }}>*</span>
            <input
              type="text"
              maxLength={6}
              value={form.fahrgestellnummer}
              onChange={e => set('fahrgestellnummer', e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              style={{ ...inputStyle, paddingLeft: 24 }}
            />
          </div>
        </Field>

        <Field label="Kennzeichen (optional)">
          <input type="text" value={form.kennzeichen} onChange={e => set('kennzeichen', e.target.value.toUpperCase())} placeholder="HH-AB 1234" style={inputStyle} />
        </Field>

        <Field label="Fahrzeugtyp *">
          <div style={{ display: 'flex', gap: 10 }}>
            {['NW', 'GW'].map(t => (
              <button
                key={t}
                onClick={() => set('fahrzeugtyp', t)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 16,
                  background: form.fahrzeugtyp === t ? '#282830' : '#f0f0f0',
                  color: form.fahrzeugtyp === t ? '#fff' : '#282830',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'NW' ? 'NW – Neu' : 'GW – Gebraucht'}
              </button>
            ))}
          </div>
        </Field>

        {/* Modell: NW = Dropdown, GW = Freitext mit Autocomplete */}
        <Field label="Modell *">
          {form.fahrzeugtyp === 'NW' ? (
            <select value={form.modell} onChange={e => set('modell', e.target.value)} style={inputStyle}>
              <option value="">Auswählen …</option>
              {TOYOTA_MODELS.map(m => <option key={m}>{m}</option>)}
            </select>
          ) : (
            <>
              <input
                type="text"
                list="modell-suggestions"
                value={form.modell}
                onChange={e => set('modell', e.target.value)}
                placeholder="z.B. VW Golf"
                style={inputStyle}
              />
              <datalist id="modell-suggestions">
                {gwSuggestions.map(m => <option key={m} value={m} />)}
              </datalist>
            </>
          )}
        </Field>

        <Field label="Verkäufer *">
          <select value={form.verkaeufer} onChange={e => set('verkaeufer', e.target.value)} style={inputStyle}>
            <option value="">Auswählen …</option>
            {VERKAEUFER.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>

        <Field label="Kunde *">
          <input type="text" value={form.kunde} onChange={e => set('kunde', e.target.value)} placeholder="Name des Kunden" style={inputStyle} />
        </Field>

        {/* Werkstatttermin: nur Service darf bearbeiten, Verkäufer sehen Text */}
        <Field label="Werkstatttermin">
          {service ? (
            <input type="date" value={form.werkstatttermin} onChange={e => set('werkstatttermin', e.target.value)} style={inputStyle} />
          ) : (
            <div style={{ ...inputStyle, background: '#f5f5f5', color: '#555' }}>
              {fmtDate(form.werkstatttermin)}
              <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>(nur Service)</span>
            </div>
          )}
        </Field>

        <Field label="Auslieferungsdatum *">
          <input type="date" value={form.auslieferungsdatum} onChange={e => set('auslieferungsdatum', e.target.value)} style={inputStyle} />
        </Field>

        <Field label="Bemerkung (optional)">
          <textarea value={form.bemerkung} onChange={e => set('bemerkung', e.target.value)} rows={3} placeholder="Hinweise …" style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>

        {error && <p style={{ color: '#EB0A1E', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '16px', borderRadius: 12, background: saving ? '#ccc' : '#EB0A1E',
          color: '#fff', fontWeight: 700, fontSize: 17,
        }}>
          {saving ? 'Speichern …' : isEdit ? 'Änderungen speichern' : 'Fahrzeug anlegen'}
        </button>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '2px solid #e0e0e0', fontSize: 15, outline: 'none',
  display: 'block',
};
