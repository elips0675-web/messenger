import { useState, useEffect } from 'react';

export function PwaBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (!dismissed) {
      setTimeout(() => setIsVisible(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-install-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 1000,
      background: 'var(--surface)', borderRadius: 16, padding: 16,
      boxShadow: '0 8px 30px rgba(0,0,0,.15)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 12, maxWidth: 400, margin: '0 auto',
      animation: 'slideUp .3s ease',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'var(--gradient)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22, flexShrink: 0,
      }}>💼</div>
      <div style={{ flex: 1, fontSize: 13 }}>
        <strong style={{ display: 'block', marginBottom: 2 }}>Установите приложение</strong>
        <span style={{ color: 'var(--text2)', fontSize: 12 }}>Быстрый доступ с рабочего стола</span>
      </div>
      <button onClick={handleInstall} style={{
        background: 'var(--gradient)', color: '#fff', border: 'none',
        padding: '8px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}>Установить</button>
      <button onClick={handleDismiss} style={{
        background: 'none', border: 'none', fontSize: 18, cursor: 'pointer',
        color: 'var(--text2)', padding: 4,
      }}>✕</button>
    </div>
  );
}
