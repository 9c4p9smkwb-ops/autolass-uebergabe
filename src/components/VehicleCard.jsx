import { useState } from 'react';
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

function isUrgent(vehicle) {
  if (vehicle.status >= 6) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(vehicle.auslieferungsdatum);
  const diff = (due - today) / (1000 * 60 * 60 * 24);
  return diff <= 2;
}

export default function VehicleCard({ vehicle, user, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showDelay, setShowDelay] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const cfg = STATUS_CONFIG[vehicle.status];
  const urgent = isUrgent(vehicle);

  const changeStatus = async (newStatus) => {
    if (newStatus < 1 || newStatus > 8) return;
    setChangingStatus(true);
    const oldStatus = vehicle.status;
    const updates = { status: newStatus };
    if (newStatus === 8) updates.uebergeben_at = new Date().toISOString();

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
        {urgent && (
          <div style={{ background: '#EB0A1E', color: '#fff', padding: '6px 16px', fontSize: 13, fontWeight: 700 }}>
            ⚠️ Auslieferung in ≤ 2 Tagen — Status noch nicht ≥ 6!
          </div>
        )}

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
              <Info label="Wunschtermin" value={fmtDate(vehicle.wunsch_uebergabedatum)} />
              <Info label="Angelegt von" value={vehicle.created_by} />
              {vehicle.bemerkung && <Info label="Bemerkung" value={vehicle.bemerkung} full />}
            </div>

            {/* Status stepper */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>STATUS ÄNDERN</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1,2,3,4,5,6,7,8].map(s => (
                  <button
                    key={s}
                    disabled={changingStatus || vehicle.status === s}
                    onClick={() => changeStatus(s)}
                    style={{
                      padding: '8px 12px', borderRadius: 8, fontWeight: 700, fontSize: 13,
                      background: vehicle.status === s ? STATUS_CONFIG[s].color : '#f0f0f0',
                      color: vehicle.status === s ? STATUS_CONFIG[s].textColor : '#555',
                      opacity: changingStatus ? 0.6 : 1,
                      transition: 'all 0.15s',
                      minWidth: 36,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
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
