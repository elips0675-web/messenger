import { useEffect } from 'react';

export function PwaRegistry() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const base = import.meta.env.BASE_URL || '/';
      navigator.serviceWorker
        .register(`${base}sw.js`)
        .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);

  return null;
}
