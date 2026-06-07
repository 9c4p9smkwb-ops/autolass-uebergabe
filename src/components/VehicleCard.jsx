import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { STATUS_CONFIG } from '../constants';
import StatusBadge from './StatusBadge';
import DelayModal from './DelayModal';
import HistoryModal from './HistoryModal';
import VehicleForm from './VehicleForm';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Ganzzahlige Tagesdifferenz bis Datum (negativ = Vergangenheit, 0 = heute, 1 = morgen)
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

// Liefert aktive Warnungen für eine Fahrzeugkarte
function getWarnings(vehicle) {
  const warnings = [];

  // 1) Werkstatttermin überfällig und Status noch nicht in Arbeit (< 4)
  const wsDiff = daysUntil(vehicle.werkstatttermin);
  if (wsDiff !== null && wsDiff < 0 && vehicle.status < 4) {
    warnings.push('Handlungsbedarf - Werkstatt nicht bestätigt');
  }

  // 2) Auslieferung morgen oder überfällig und Status noch nicht übergabebereit (< 7)
  const ausDiff = daysUntil(vehicle.auslieferungsdatum);
  if (ausDiff !== null && ausDiff <= 1 && vehicle.status < 7) {
    warnings.push('Handlungsbedarf - Fahrzeug nicht übergabebereit');
  }

  return warnings;
}

// Auslieferung überschritten und noch nicht übergeben (< 8) → Übergabe-Button warnen
function isUebergabeOverdue(vehicle) {
  const ausDiff = daysUntil(vehicle.auslieferungsdatum);
  return ausDiff !== null && ausDiff < 0 && vehicle.status < 8;
}

export default function VehicleCard({ vehicle, user, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showDelay, setShowDelay] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [history, setHistory] = useState([]);

  const cfg = STATUS_CONFIG[vehicle.status];
  const warnings = getWarnings(vehicle);
  const urgent = warnings.length > 0;
  const uebergabeOverdue = isUebergabeOverdue(vehicle);

  // Statushistorie laden, sobald Karte aufgeklappt (und nach Statuswechsel neu)
  useEffect(() => {
    if (!expanded) return;
    supabase
      .from('status_history')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('changed_at', { ascending: false })
      .then(({ data }) => setHistory(data || []));
  }, [expanded, vehicle.id, vehicle.status]);

  const changeStatus = async (newStatus) => {
    if (newStatus < 1 || newStatus > 8) return;
    setChangingStatus(true);
    const oldStatus = vehicle.status;
    const updates = { status: newStatus };

    await supabase.from('vehicles').update(updates).eq('id', vehicle.id);
    await supabase.from('status_history').insert({
      vehicle_id: vehicle.id,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: user,
    });
    setChangingStatus(false);
    onRefresh();
  };

  return (
    <>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        marginBottom: 12,
        boxShadow: urgent ? '0 0 0 2px #EB0A1E' : '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}>
        {warnings.map((msg, i) => (
          <div key={i} style={{ background: '#EB0A1E', color: '#fff', padding: '6px 16px', fontSize: 13, fontWeight: 700 }}>
            ⚠️ {msg}
          </div>
        ))}

        {/* Card header */}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: '100%', background: 'none', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
            borderBottom: expanded ? '1px solid #f0f0f0' : 'none',
          }}
        >
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: cfg?.color || '#ccc',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#282830' }}>
              {vehicle.modell}
              <span style={{
                marginLeft: 8, fontSize: 12, fontWeight: 600,
                color: vehicle.fahrzeugtyp === 'NW' ? '#2196F3' : '#FF9800',
                background: vehicle.fahrzeugtyp === 'NW' ? '#e3f2fd' : '#fff3e0',
                padding: '1px 7px', borderRadius: 10,
              }}>
                {vehicle.fahrzeugtyp}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              *{vehicle.fahrgestellnummer}
              {vehicle.kennzeichen && ` · ${vehicle.kennzeichen}`}
              {' · '}{vehicle.kunde}
            </div>
          </div>
          <div style={{ flexShrink: 0, fontSize: 18, color: '#ccc' }}>{expanded ? '▲' : '▼'}</div>
        </button>

        {/* Status badge */}
        <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge status={vehicle.status} />
          <span style={{ fontSize: 12, color: '#999' }}>Auslieferung: {fmtDate(vehicle.auslieferungsdatum)}</span>
        </div>

        {expanded && (
          <div style={{ padding: '0 16px 16px' }}>
            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 14 }}>
              <Info label="Verkäufer" value={vehicle.verkaeufer} />
              <Info label="Werkstatt" value={fmtDate(vehicle.werkstatttermin)} />
              <Info label="Angelegt von" value={vehicle.created_by} />
              {vehicle.bemerkung && <Info label="Bemerkung" value={vehicle.bemerkung} full />}
            </div>

            {/* Status stepper */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>STATUS ÄNDERN</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1,2,3,4,5,6,7,8].map(s => {
                  const isActive = vehicle.status === s;
                  const warnUebergabe = s === 8 && uebergabeOverdue && !isActive;
                  return (
                    <button
                      key={s}
                      className={warnUebergabe ? 'uebergabe-pulse' : undefined}
                      disabled={changingStatus || isActive}
                      onClick={() => changeStatus(s)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                        background: warnUebergabe ? '#EB0A1E' : (isActive ? STATUS_CONFIG[s].color : '#f0f0f0'),
                        color: warnUebergabe ? '#fff' : (isActive ? STATUS_CONFIG[s].textColor : '#555'),
                        opacity: changingStatus ? 0.6 : 1,
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {warnUebergabe ? `⚠️ ${STATUS_CONFIG[s].short}` : STATUS_CONFIG[s].short}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Statushistorie inline */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>STATUSHISTORIE</p>
              {history.length === 0 ? (
                <p style={{ fontSize: 13, color: '#999' }}>Noch keine Statuswechsel.</p>
              ) : (
                history.map(h => (
                  <div key={h.id} style={{ borderLeft: `3px solid ${STATUS_CONFIG[h.new_status]?.color || '#ccc'}`, paddingLeft: 10, marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#282830' }}>
                      {h.old_status ? `${STATUS_CONFIG[h.old_status]?.short || h.old_status} → ` : ''}
                      {STATUS_CONFIG[h.new_status]?.short || h.new_status}
                    </p>
                    <p style={{ fontSize: 12, color: '#666' }}>{h.changed_by} · {fmtDateTime(h.changed_at)}</p>
                  </div>
                ))
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <ActionBtn color="#FF9800" onClick={() => setShowDelay(true)}>⚠️ Verzögerung</ActionBtn>
              <ActionBtn color="#282830" onClick={() => setShowHistory(true)}>📋 Verlauf</ActionBtn>
              <ActionBtn color="#2196F3" onClick={() => setShowEdit(true)}>✏️ Bearbeiten</ActionBtn>
            </div>
          </div>
        )}
      </div>

      {showDelay && (
        <DelayModal
          vehicle={vehicle}
          user={user}
          onClose={() => setShowDelay(false)}
          onSaved={() => { setShowDelay(false); onRefresh(); }}
        />
      )}
      {showHistory && (
        <HistoryModal vehicle={vehicle} onClose={() => setShowHistory(false)} />
      )}
      {showEdit && (
        <VehicleForm
          user={user}
          vehicle={vehicle}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); onRefresh(); }}
        />
      )}
    </>
  );
}

function Info({ label, value, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <p style={{ fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ fontSize: 14, color: '#282830', marginTop: 1 }}>{value || '—'}</p>
    </div>
  );
}

function ActionBtn({ children, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 14px', borderRadius: 10, background: color,
      color: '#fff', fontWeight: 600, fontSize: 14,
    }}>
      {children}
    </button>
  );
}
