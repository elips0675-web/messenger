import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 18px', borderRadius: 10, fontSize: 13,
            background: t.type === 'error' ? '#fee2e2' : '#d1fae5',
            color: t.type === 'error' ? '#991b1b' : '#065f46',
            border: `1px solid ${t.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,.1)',
            maxWidth: 360, wordBreak: 'break-word',
            animation: 'slideIn .2s ease-out'
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
