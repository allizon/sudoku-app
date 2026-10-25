import { useCallback, useEffect, useRef, useState } from 'react';

/** How long a toast stays before dismissing itself. */
const TOAST_MS = 10_000;

type Toast = { readonly id: number; readonly message: string };

/**
 * The toasts on screen, oldest first, with functions to show and dismiss
 * them. Both functions keep their identity across renders.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}

type ToastsProps = {
  readonly toasts: readonly Toast[];
  readonly onDismiss: (id: number) => void;
};

/** The stack of toasts in the top-right corner. */
export function Toasts({ toasts, onDismiss }: ToastsProps) {
  return (
    <div className="toasts">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

type ToastItemProps = {
  readonly toast: Toast;
  readonly onDismiss: (id: number) => void;
};

/** One toast: gone after 10 seconds, or as soon as it is clicked. */
function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { id, message } = toast;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), TOAST_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div className="toast" role="alert" onClick={() => onDismiss(id)}>
      {message}
    </div>
  );
}
