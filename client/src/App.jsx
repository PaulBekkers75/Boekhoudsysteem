import { useState } from 'react';
import UploadPage from './pages/UploadPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Boekhoudsysteem</h1>
        <nav className="tabs">
          <button
            className={tab === 'dashboard' ? 'tab active' : 'tab'}
            onClick={() => setTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={tab === 'upload' ? 'tab active' : 'tab'}
            onClick={() => setTab('upload')}
          >
            Uploaden
          </button>
        </nav>
      </header>

      <main className="app-main">
        {tab === 'dashboard' ? <DashboardPage /> : <UploadPage onUploaded={() => setTab('dashboard')} />}
      </main>
    </div>
  );
}
