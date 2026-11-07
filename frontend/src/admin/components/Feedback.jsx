import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle, WarningCircle, X } from '@phosphor-icons/react';
import Button from '../../components/Button.jsx';

// -- Toasts ------------------------------------------------------------------

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lift ${
              toast.type === 'error'
                ? 'border-red-100 bg-white text-red-700'
                : 'border-emerald-100 bg-white text-emerald-700'
            }`}
          >
            {toast.type === 'error' ? (
              <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
            )}
            <span className="flex-1 text-ink">{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              className="text-slate-400 transition-colors hover:text-slate-600"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

// -- Confirmation dialog -----------------------------------------------------

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setState({ ...options, resolve });
      }),
    []
  );

  const close = (result) => {
    if (state?.resolve) state.resolve(result);
    setState(null);
  };

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lift">
            <h2 className="text-lg font-semibold text-navy">{state.title || 'Please confirm'}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{state.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => close(false)}>
                {state.cancelLabel || 'Cancel'}
              </Button>
              <Button
                size="sm"
                variant={state.destructive ? 'danger' : 'navy'}
                onClick={() => close(true)}
              >
                {state.confirmLabel || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context;
}
