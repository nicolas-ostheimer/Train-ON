import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { ensureCategoriesSeeded } from './db/db'

// Service Worker registrieren (Offline-Fähigkeit). Aktualisiert sich automatisch.
registerSW({ immediate: true })

// Standardkategorien einmalig anlegen (Neuinstallation). Fehler hier dürfen
// den App-Start nicht blockieren.
ensureCategoriesSeeded().catch((e) => console.error('Kategorien-Seed fehlgeschlagen:', e))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
