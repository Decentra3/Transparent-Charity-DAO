'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

interface Toast {
  id: number;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = idRef.current++;
    const duration = toast.durationMs ?? 3000;
    const t: Toast = { id, variant: 'default', ...toast, durationMs: duration };
    setToasts((prev) => [...prev, t]);
    window.setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Renderer */}
      <div className="fixed bottom-4 right-4 z-[1000] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              `min-w-[260px] max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm ` +
              (t.variant === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
               t.variant === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
               t.variant === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
               'bg-card border-border text-foreground')
            }
            role="status"
            aria-live="polite"
          >
            {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
            {t.description && <div className="text-xs opacity-90">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}


