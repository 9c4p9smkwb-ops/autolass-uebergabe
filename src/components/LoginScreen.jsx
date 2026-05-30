import { useState } from 'react';
import { USERS } from '../constants';

export default function LoginScreen({ onLogin }) {
  const [selected, setSelected] = useState('');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#282830',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-block',
            background: '#EB0A1E',
            borderRadius: 12,
            padding: '10px 20px',
            marginBottom: 16,
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>
              AutoLass
            </span>
          </div>
          <p style={{ color: '#555', fontSize: 15 }}>Wer bist du?</p>
        </div>

        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 10,
            border: '2px solid #e0e0e0',
            fontSize: 16,
            marginBottom: 16,
            color: selected ? '#282830' : '#999',
            appearance: 'none',
            background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23282830' stroke-width='2' fill='none'/%3E%3C/svg%3E") no-repeat right 14px center #fff`,
          }}
        >
          <option value="" disabled>Name auswählen …</option>
          {USERS.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <button
          disabled={!selected}
          onClick={() => onLogin(selected)}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 10,
            background: selected ? '#EB0A1E' : '#ccc',
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            transition: 'background 0.2s',
          }}
        >
          Anmelden
        </button>
      </div>
    </div>
  );
}
