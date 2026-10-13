import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastViewport, type ToastItem, type ToastInput } from '../components/ui/Toast';

/* Avisos curtos (aria-live). Nunca para celebrar dinheiro ou rentabilidade. */

interface ToastCtx {
  toast: (t: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const toast = useCallback((t: ToastInput) => {
    const id = `t${++counter.current}`;
    // fila curta: um aviso igual ao que já está na fila não se repete
    setItems((list) => (list.some((x) => x.title === t.title && x.description === t.description) ? list : [...list.slice(-5), { ...t, id }]));
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast fora do ToastProvider');
  return ctx;
}
