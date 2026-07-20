import type { AnchoredPopupAlign, AnchoredPopupSide } from '../utils/anchored-popup';

export type ToastPriority = 'low' | 'high';
export type ToastTransitionStatus = 'starting' | 'active' | 'ending';
export type ToastSwipeDirection = 'up' | 'down' | 'left' | 'right';
export type ToastCloseReason =
  | 'timeout'
  | 'close-button'
  | 'swipe'
  | 'escape'
  | 'programmatic';

export interface ToastPositionerOptions {
  /** Element or document id used to position this toast outside the global stack. */
  anchor: HTMLElement | string;
  side?: AnchoredPopupSide;
  align?: AnchoredPopupAlign;
  sideOffset?: number | string;
  alignOffset?: number | string;
}

export interface ToastActionContext<Data = unknown> {
  id: string;
  data: Data | undefined;
  manager: ToastManager<Data>;
  originalEvent: MouseEvent;
}

export interface ToastAction<Data = unknown> {
  label: string;
  ariaLabel?: string;
  onAction?: (context: ToastActionContext<Data>) => void;
}

export interface ToastCloseContext<Data = unknown> {
  id: string;
  reason: ToastCloseReason;
  toast: ToastRecord<Data>;
}

export interface ToastOptions<Data = unknown> {
  id?: string;
  title?: string;
  description?: string;
  /** Styling/state hook, including `loading`, `success`, and `error`. */
  type?: string;
  /** Milliseconds, a CSS time/token value, or 0 to keep the toast open. */
  timeout?: number | string;
  priority?: ToastPriority;
  action?: ToastAction<Data>;
  positioner?: ToastPositionerOptions;
  data?: Data;
  onClose?: (context: ToastCloseContext<Data>) => void;
  onRemove?: (context: ToastCloseContext<Data>) => void;
}

export interface ToastRecord<Data = unknown>
  extends Omit<ToastOptions<Data>, 'id' | 'priority'> {
  id: string;
  priority: ToastPriority;
  transitionStatus: ToastTransitionStatus;
  updateKey: number;
  /** Internal timer generation; changes only when countdown timing must restart. */
  timerKey: number;
  closeReason?: ToastCloseReason;
}

export type ToastPromiseValue<Data = unknown> = string | ToastOptions<Data>;

export interface ToastPromiseOptions<Value, Data = unknown> {
  loading: ToastPromiseValue<Data>;
  success:
    | ToastPromiseValue<Data>
    | ((value: Value) => ToastPromiseValue<Data>);
  error:
    | ToastPromiseValue<Data>
    | ((error: unknown) => ToastPromiseValue<Data>);
}

export type ToastListener<Data = unknown> = (
  records: readonly ToastRecord<Data>[],
) => void;

export interface ToastManager<Data = unknown> {
  add(options: ToastOptions<Data>): string;
  update(id: string, updates: Partial<ToastOptions<Data>>): void;
  close(id: string, reason?: ToastCloseReason): void;
  closeAll(reason?: ToastCloseReason): void;
  promise<Value>(
    promiseValue: PromiseLike<Value>,
    options: ToastPromiseOptions<Value, Data>,
  ): Promise<Value>;
  subscribe(listener: ToastListener<Data>): () => void;
  getSnapshot(): readonly ToastRecord<Data>[];
  /** Component lifecycle hook; consumers should not need to call this. */
  activate(id: string): void;
  /** Component lifecycle hook; consumers should not need to call this. */
  remove(id: string): ToastCloseContext<Data> | null;
  /** Component lifecycle hook; invokes onRemove after rendered DOM removal. */
  notifyRemove(context: ToastCloseContext<Data>): void;
}

export interface ToastEventDetail<Data = unknown> {
  id: string;
  toast: ToastRecord<Data>;
}

export interface ToastCloseEventDetail<Data = unknown>
  extends ToastEventDetail<Data> {
  reason: ToastCloseReason;
}

export interface ToastActionEventDetail<Data = unknown>
  extends ToastEventDetail<Data> {
  originalEvent: MouseEvent;
}
