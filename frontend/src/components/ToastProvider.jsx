import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import styles from '../styles/ToastProvider.module.css';

const ToastContext = createContext({ notify: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((toast) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    setToasts((current) => [...current, { id, ...toast }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, toast.duration || 3500);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastStack} aria-live="assertive" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.variant || 'info']}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
