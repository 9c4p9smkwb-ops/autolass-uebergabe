import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import StatusBadge from './StatusBadge';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ArchiveView() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('vehicles')
      .select('*')
      .eq('is_archived', true)
      .order('uebergeben_at', { ascending: false })
      .then(({ data }) => { setVehicles(data || []); setLoading(false); });
  }, []);

  const filtered = vehicles.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.modell?.toLowerCase().includes(q) ||
      v.kunde?.toLowerCase().includes(q) ||
      v.kennzeichen?.toLowerCase().includes(q) ||
      v.fahrgestellnummer?.includes(q)
    );
  });

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Archiv durchsuchen …"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '2px solid #e0e0e0', fontSize: 15, outline: 'none',
          }}
        />
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Lädt …</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          {vehicles.length === 0 ? 'Archiv ist leer.' : 'Keine Treffer.'}
        </div>
      )}

      {filtered.map(v => (
        <div key={v.id} style={{
          background: '#fff', borderRadius: 14, marginBottom: 10,
          padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          opacity: 0.85,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#282830' }}>
                {v.modell}
                <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>{v.fahrzeugtyp}</span>
              </p>
              <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                *{v.fahrgestellnummer}
                {v.kennzeichen && ` · ${v.kennzeichen}`}
                {' · '}{v.kunde}
              </p>
            </div>
            <StatusBadge status={v.status} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 12px', marginTop: 10 }}>
            <Inf label="Verkäufer" val={v.verkaeufer} />
            <Inf label="Übergeben" val={fmtDate(v.uebergeben_at)} />
            <Inf label="Angelegt" val={v.created_by} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Inf({ label, val }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: '#bbb', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: 13, color: '#555' }}>{val || '—'}</p>
    </div>
  );
}
