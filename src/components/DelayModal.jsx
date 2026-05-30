import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DelayModal({ vehicle, user, onClose, onSaved }) {
  const [grund, setGrund] = useState('');
  const [neuesDatum, setNeuesDatum] = useState(vehicle.auslieferungsdatum || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!grund.trim() || !neuesDatum) { setError('Bitte Grund und neues Datum angeben.'); return; }
    setSaving(true);
    const { error: delErr } = await supabase.from('delays').insert({
      vehicle_id: vehicle.id,
      grund: grund.trim(),
      neues_datum: neuesDatum,
      gemeldet_von: user,
    });
    if (delErr) { setError(delErr.message); setSaving(false); return; }
    const { error: upErr } = await supabase
      .from('vehicles')
      .update({ auslieferungsdatum: neuesDatum })
      .eq('id', vehicle.id);
    if (upErr) { setError(upErr.message); setSaving(false); return; }
    setSaving(false);
    onSaved();
  };

  return (
    <Overlay>
      <div style={modalStyle}>
        <h3 style={{ marginBottom: 16, color: '#282830' }}>⚠️ Verzögerung melden</h3>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          {vehicle.modell} · *{vehicle.fahrgestellnummer}
        </p>

        <label style={labelStyle}>Grund der Verzögerung *</label>
        <textarea
          value={grund}
          onChange={e => setGrund(e.target.value)}
          rows={3}
          placeholder="Bitte beschreiben …"
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <label style={labelStyle}>Neues Auslieferungsdatum *</label>
        <input
          type="date"
          value={neuesDatum}
          onChange={e => setNeuesDatum(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: '#EB0A1E', fontSize: 13, marginBottom: 8 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={btnSecondary}>Abbrechen</button>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>
            {saving ? '…' : 'Speichern'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 16,
    }}>
      {children}
    </div>
  );
}

const modalStyle = {
  background: '#fff', borderRadius: 16, padding: 24,
  width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 8,
  border: '2px solid #e0e0e0', fontSize: 15, marginBottom: 14, display: 'block',
};
const btnPrimary = {
  flex: 1, padding: '14px', borderRadius: 10, background: '#EB0A1E',
  color: '#fff', fontWeight: 700, fontSize: 16,
};
const btnSecondary = {
  flex: 1, padding: '14px', borderRadius: 10, background: '#f0f0f0',
  color: '#282830', fontWeight: 600, fontSize: 16,
};
