import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Icon } from './ui';

type ToastKind = 'ok' | 'error' | 'info';
type ShowToast = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ShowToast>(() => undefined);
const ICON: Record<ToastKind, string> = { ok: 'check_circle', error: 'error', info: 'info' };

// Short messages instead of browser dialogs: confirmations and errors of every action
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback<ShowToast>((message, kind = 'ok') => {
    window.clearTimeout(timer.current);
    setToast({ message, kind });
    setVisible(true);
    timer.current = window.setTimeout(() => setVisible(false), kind === 'error' ? 4000 : 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast${toast ? ` ${toast.kind}` : ''}${visible ? ' show' : ''}`} role="status" aria-live="polite">
        {toast && <><Icon name={ICON[toast.kind]} fill />{toast.message}</>}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
