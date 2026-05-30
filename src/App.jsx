import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import ArchiveView from './components/ArchiveView';

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem('al_user') || null);
  const [view, setView] = useState('dashboard');

  const handleLogin = (name) => {
    localStorage.setItem('al_user', name);
    setUser(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('al_user');
    setUser(null);
    setView('dashboard');
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header user={user} view={view} setView={setView} onLogout={handleLogout} />
      <main style={{ flex: 1, padding: '12px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        {view === 'dashboard' ? (
          <Dashboard user={user} />
        ) : (
          <ArchiveView user={user} />
        )}
      </main>
    </div>
  );
}

function Header({ user, view, setView, onLogout }) {
  return (
    <header style={{
      background: '#282830',
      color: '#fff',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          background: '#EB0A1E',
          width: 8,
          height: 32,
          borderRadius: 2,
          flexShrink: 0,
        }} />
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
          AutoLass <span style={{ color: '#EB0A1E' }}>Übergabe</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setView('dashboard')}
          style={{
            background: view === 'dashboard' ? '#EB0A1E' : 'transparent',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Aktiv
        </button>
        <button
          onClick={() => setView('archive')}
          style={{
            background: view === 'archive' ? '#EB0A1E' : 'transparent',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Archiv
        </button>
        <button
          onClick={onLogout}
          title="Abmelden"
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {user} ✕
        </button>
      </div>
    </header>
  );
}
