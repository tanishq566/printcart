import { useState, useEffect } from 'react';

// Capture beforeinstallprompt globally so SPA route navigation never misses it
let globalDeferredPrompt: any = null;
const promptListeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    promptListeners.forEach((cb) => cb());
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((cb) => cb());
  });
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as any).standalone)
  );
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsStandalone());

  useEffect(() => {
    const syncPrompt = () => {
      setDeferredPrompt(globalDeferredPrompt);
      setIsInstalled(checkIsStandalone());
    };

    promptListeners.add(syncPrompt);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };
    mediaQuery.addEventListener?.('change', handleMediaChange);

    const handleInstalled = () => {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      promptListeners.delete(syncPrompt);
      mediaQuery.removeEventListener?.('change', handleMediaChange);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const promptObj = deferredPrompt || globalDeferredPrompt;
    if (!promptObj) return 'unavailable';

    promptObj.prompt();
    const { outcome } = await promptObj.userChoice;
    if (outcome === 'accepted') {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
    return outcome === 'accepted' ? 'accepted' : 'dismissed';
  };

  return {
    isInstallable: Boolean(deferredPrompt) && !isInstalled,
    isInstalled,
    promptInstall,
  };
}
