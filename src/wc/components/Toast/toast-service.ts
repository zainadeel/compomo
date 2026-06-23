import { resolveCssTimeMs, TOKEN_DEFAULTS } from '../../utils';

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

function defaultToastDurationMs(): number {
  return resolveCssTimeMs(TOKEN_DEFAULTS.animationDelayLong2, TOKEN_DEFAULTS.animationDelayLong2);
}

export const toast = {
  show(options: ToastOptions): string {
    const id = `ds-toast-${++idCounter}`;
    const duration = options.duration ?? defaultToastDurationMs();
    toasts = [...toasts, { id, intent: 'neutral', ...options, duration }];
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
