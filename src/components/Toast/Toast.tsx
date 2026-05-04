import React, { forwardRef, useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import ReactDOM from 'react-dom';
import { cn } from '@/utils/cn';
import { Text } from '@/components/Text';
import { Surface } from '@/components/Surface';
import type { SurfaceIntent } from '@/components/Surface';
import styles from './Toast.module.css';

/* ─── Toast Types ───────────────────────────────────────────────────────────── */

export type ToastIntent = 'neutral' | 'brand' | 'positive' | 'negative' | 'warning' | 'caution';
export type ToastPosition = 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';

export interface ToastData {
  id: string;
  message: string;
  intent?: ToastIntent;
  duration?: number;
  onDismiss?: () => void;
}

export interface ToastOptions {
  message: string;
  intent?: ToastIntent;
  /** Auto-dismiss duration in ms. 0 = no auto-dismiss. Default 4000. */
  duration?: number;
  onDismiss?: () => void;
}

/* ─── Toast Store (external, framework-agnostic) ────────────────────────────── */

let toasts: ToastData[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(fn => fn());
}

function getSnapshot(): ToastData[] {
  return toasts;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

let idCounter = 0;

export const toast = {
  show(options: ToastOptions): string {
    const id = `toast-${++idCounter}`;
    toasts = [...toasts, { id, ...options }];
    emit();
    return id;
  },
  info(message: string, options?: Omit<ToastOptions, 'message'>): string {
    return toast.show({ message, intent: 'neutral', ...options });
  },
  success(message: string, options?: Omit<ToastOptions, 'message'>): string {
    return toast.show({ message, intent: 'positive', ...options });
  },
  error(message: string, options?: Omit<ToastOptions, 'message'>): string {
    return toast.show({ message, intent: 'negative', ...options });
  },
  warning(message: string, options?: Omit<ToastOptions, 'message'>): string {
    return toast.show({ message, intent: 'warning', ...options });
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

/* ─── useToasts hook ────────────────────────────────────────────────────────── */

export function useToasts(): ToastData[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* ─── Single Toast ──────────────────────────────────────────────────────────── */

const INTENT_MAP: Record<ToastIntent, SurfaceIntent> = {
  neutral: 'neutral',
  brand: 'brand',
  positive: 'positive',
  negative: 'negative',
  warning: 'warning',
  caution: 'caution',
};

interface ToastItemProps {
  data: ToastData;
}

const ToastItem: React.FC<ToastItemProps> = ({ data }) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const remainingRef = useRef<number>(data.duration ?? 4000);
  const startedAtRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      toast.dismiss(data.id);
      data.onDismiss?.();
    }, 200);
  }, [data]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const startTimer = useCallback((ms: number) => {
    if (ms <= 0) return;
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(dismiss, ms);
  }, [dismiss]);

  const pause = useCallback(() => {
    if (pausedRef.current || !timerRef.current) return;
    pausedRef.current = true;
    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    startTimer(remainingRef.current);
  }, [startTimer]);

  useEffect(() => {
    remainingRef.current = data.duration ?? 4000;
    pausedRef.current = false;
    startTimer(remainingRef.current);
    return clearTimer;
  }, [data.duration, startTimer, clearTimer]);

  const isNegative = data.intent === 'negative';

  return (
    <Surface
      intent={INTENT_MAP[data.intent ?? 'neutral']}
      contrast="bold"
      elevation="floating"
      radius="lg"
      className={cn(styles.toast, exiting && styles.toastExit)}
      role={isNegative ? 'alert' : 'status'}
      aria-live={isNegative ? 'assertive' : 'polite'}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <Text variant="text-body-medium" as="span" color="inherit">
        {data.message}
      </Text>
      <button
        type="button"
        className={styles.dismiss}
        onClick={dismiss}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </Surface>
  );
};

/* ─── ToastContainer ────────────────────────────────────────────────────────── */

export interface ToastContainerProps {
  /** Where to render toasts on screen. */
  position?: ToastPosition;
}

export const ToastContainer = forwardRef<HTMLDivElement, ToastContainerProps>(
  ({ position = 'top-center' }, ref) => {
    const items = useToasts();

    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
      <div
        ref={ref}
        className={cn(styles.container, styles[positionClass(position)])}
        role="region"
        aria-label="Notifications"
      >
        {items.map(item => (
          <ToastItem key={item.id} data={item} />
        ))}
      </div>,
      document.body
    );
  }
);

ToastContainer.displayName = 'ToastContainer';

function positionClass(position: ToastPosition): string {
  switch (position) {
    case 'top-center': return 'topCenter';
    case 'top-right': return 'topRight';
    case 'bottom-center': return 'bottomCenter';
    case 'bottom-right': return 'bottomRight';
  }
}
