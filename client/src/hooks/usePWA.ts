import { useEffect, useState } from 'react';

interface PWAStatus {
  adBlockActive: boolean;
  canInstall: boolean;
  install: () => Promise<void>;
}

export function usePWA(): PWAStatus {
  const [adBlockActive, setAdBlock] = useState(false);
  const [deferredPrompt, setPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Verificar si el SW ya está activo
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => setAdBlock(true))
        .catch(() => {});
    }

    // Capturar el prompt de instalación de la PWA
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setPrompt(null);
    }
  };

  return { adBlockActive, canInstall, install };
}
