import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import VehicleCard from './VehicleCard';
import VehicleForm from './VehicleForm';
import { STATUS_CONFIG } from '../constants';

export default function Dashboard({ user }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState(0);
  const [filterVerkaeufer, setFilterVerkaeufer] = useState('');
  const [search, setSearch] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .neq('status', 8)
      .order('auslieferungsdatum', { ascending: true });

    if (!error) setVehicles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();

    const channel = supabase
      .channel('vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, fetchVehicles)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchVehicles]);

  const verkaeuferList = [...new Set(vehicles.map(v => v.verkaeufer))].filter(Boolean).sort();

  const filtered = vehicles.filter(v => {
    if (filterStatus && v.status !== filterStatus) return false;
    if (filterVerkaeufer && v.verkaeufer !== filterVerkaeufer) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.modell?.toLowerCase().includes(q) ||
        v.kunde?.toLowerCase().includes(q) ||
        v.kennzeichen?.toLowerCase().includes(q) ||
        v.fahrgestellnummer?.includes(q)
      );
    }
    return true;
  });

  const urgentCount = vehicles.filter(v => {
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr); d.setHours(0,0,0,0);
      return Math.round((d - today) / 86400000);
    };
    const ws = diff(v.werkstatttermin);
    const aus = diff(v.auslieferungsdatum);
    const werkstattWarn = ws !== null && ws < 0 && v.status < 4;
    const auslieferWarn = aus !== null && aus <= 1 && v.status < 7;
    return werkstattWarn || auslieferWarn;
  }).length;

  return (
    <div>
      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 8px', marginBottom: 8 }}>
        <Chip
          active={filterStatus === 0}
          onClick={() => setFilterStatus(0)}
          color="#282830"
          count={vehicles.length}
          label="Alle"
        />
        {urgentCount > 0 && (
          <Chip active={false} onClick={() => {}} color="#EB0A1E" count={urgentCount} label="⚠️ Dringend" />
        )}
        {[1,2,3,4,5,6,7,8].map(s => {
          const cnt = vehicles.filter(v => v.status === s).length;
          if (cnt === 0) return null;
          return (
            <Chip
              key={s}
              active={filterStatus === s}
              onClick={() => setFilterStatus(filterStatus === s ? 0 : s)}
              color={STATUS_CONFIG[s].color}
              count={cnt}
              label={s + ''}
            />
          );
        })}
      </div>

      {/* Search & filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Suche …"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            border: '2px solid #e0e0e0', fontSize: 15, outline: 'none',
          }}
        />
        <select
          value={filterVerkaeufer}
          onChange={e => setFilterVerkaeufer(e.target.value)}
          style={{
            padding: '10px 12px', borderRadius: 10, border: '2px solid #e0e0e0',
            fontSize: 14, background: '#fff',
          }}
        >
          <option value="">Alle VK</option>
          {verkaeuferList.map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      {/* Vehicle list */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Lädt …</div>
      )}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          {vehicles.length === 0 ? 'Noch keine Fahrzeuge angelegt.' : 'Keine Treffer.'}
        </div>
      )}
      {filtered.map(v => (
        <VehicleCard key={v.id} vehicle={v} user={user} onRefresh={fetchVehicles} />
      ))}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 60, height: 60, borderRadius: '50%',
          background: '#EB0A1E', color: '#fff',
          fontSize: 30, fontWeight: 300, lineHeight: '60px',
          boxShadow: '0 4px 16px rgba(235,10,30,0.4)',
          zIndex: 50,
        }}
      >
        +
      </button>

      {showForm && (
        <VehicleForm
          user={user}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchVehicles(); }}
        />
      )}
    </div>
  );
}

function Chip({ label, count, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 20,
        background: active ? color : '#fff',
        color: active ? '#fff' : '#282830',
        border: `2px solid ${active ? color : '#e0e0e0'}`,
        fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
    >
      <span style={{
        background: active ? 'rgba(255,255,255,0.3)' : color,
        color: active ? '#fff' : '#fff',
        borderRadius: 10, padding: '1px 7px', fontSize: 12,
      }}>{count}</span>
      {label}
    </button>
  );
}
