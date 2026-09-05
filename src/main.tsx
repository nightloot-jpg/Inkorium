import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against HTTP 431: Clean oversized cookies if accumulated on the domain
if (typeof document !== 'undefined' && document.cookie && document.cookie.length > 2000) {
  try {
    const cookies = document.cookie.split(';');
    const domains = [
      '',
      window.location.hostname,
      `.${window.location.hostname}`,
      'inkorium.es',
      '.inkorium.es',
      'www.inkorium.es'
    ];
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name && !name.startsWith('sb-') && !name.startsWith('inkorium_auth')) {
        for (const d of domains) {
          const domainPart = d ? `;domain=${d}` : '';
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/${domainPart};`;
        }
      }
    }
  } catch {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
