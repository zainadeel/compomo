export type ToastIntent = 'neutral' | 'brand' | 'positive' | 'negative' | 'warning' | 'caution';

export interface ToastData {
  id: string;
  message: string;
  intent: ToastIntent;
  duration: number;
}

export interface ToastOptions {
  message: string;
  intent?: ToastIntent;
  duration?: number;
}

let toasts: ToastData[] = [];
const listeners = new Set<() => void>();
let idCounter = 0;

function emit() {
  listeners.forEach(fn => fn());
}

export function subscribeToToasts(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getToasts(): ToastData[] {
  return toasts;
}

export const toast = {
  show(options: ToastOptions): string {
    const id = `ds-toast-${++idCounter}`;
    toasts = [...toasts, { id, intent: 'neutral', duration: 4000, ...options }];
    emit();
    return id;
  },
  success(message: string, options?: Partial<ToastOptions>): string {
    return toast.show({ message, intent: 'positive', ...options });
  },
  error(message: string, options?: Partial<ToastOptions>): string {
    return toast.show({ message, intent: 'negative', ...options });
  },
  warning(message: string, options?: Partial<ToastOptions>): string {
    return toast.show({ message, intent: 'warning', ...options });
  },
  info(message: string, options?: Partial<ToastOptions>): string {
    return toast.show({ message, intent: 'neutral', ...options });
  },
  dismiss(id: string) {
    toasts = toasts.filter(t => t.id !== id);
    emit();
  },
  dismissAll() {
    toasts = [];
    emit();
  },
};
