import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Registrar Service Worker (PWA + bloqueador de anuncios)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .catch(() => { /* SW no disponible, app sigue funcionando */ });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
