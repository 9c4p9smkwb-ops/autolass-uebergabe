import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { STATUS_CONFIG } from '../constants';

export default function HistoryModal({ vehicle, onClose }) {
  const [history, setHistory] = useState([]);
  const [delays, setDelays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('status_history').select('*').eq('vehicle_id', vehicle.id).order('changed_at', { ascending: false }),
      supabase.from('delays').select('*').eq('vehicle_id', vehicle.id).order('gemeldet_at', { ascending: false }),
    ]).then(([h, d]) => {
      setHistory(h.data || []);
      setDelays(d.data || []);
      setLoading(false);
    });
  }, [vehicle.id]);

  const fmt = (ts) => new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#282830' }}>Verlauf</h3>
          <button onClick={onClose} style={{ background: '#f0f0f0', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{vehicle.modell} · *{vehicle.fahrgestellnummer}</p>

        {loading && <p style={{ color: '#999', textAlign: 'center' }}>Lädt …</p>}

        {delays.length > 0 && (
          <>
            <h4 style={{ fontSize: 14, color: '#EB0A1E', marginBottom: 8 }}>Verzögerungen</h4>
            {delays.map(d => (
              <div key={d.id} style={{ background: '#fff5f5', border: '1px solid #fcc', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{d.grund}</p>
                <p style={{ fontSize: 12, color: '#666' }}>
                  Neues Datum: {new Date(d.neues_datum).toLocaleDateString('de-DE')} · {d.gemeldet_von} · {fmt(d.gemeldet_at)}
                </p>
              </div>
            ))}
          </>
        )}

        {history.length > 0 && (
          <>
            <h4 style={{ fontSize: 14, color: '#282830', marginBottom: 8, marginTop: delays.length ? 12 : 0 }}>Statuswechsel</h4>
            {history.map(h => (
              <div key={h.id} style={{ borderLeft: `3px solid ${STATUS_CONFIG[h.new_status]?.color || '#ccc'}`, paddingLeft: 12, marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>
                  {h.old_status ? `${h.old_status} → ` : ''}{h.new_status}. {STATUS_CONFIG[h.new_status]?.label}
                </p>
                <p style={{ fontSize: 12, color: '#666' }}>{h.changed_by} · {fmt(h.changed_at)}</p>
              </div>
            ))}
          </>
        )}

        {!loading && history.length === 0 && delays.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center' }}>Kein Verlauf vorhanden.</p>
        )}
      </div>
    </div>
  );
}
