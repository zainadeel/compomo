import type {
  ToastCloseContext,
  ToastCloseReason,
  ToastListener,
  ToastManager,
  ToastOptions,
  ToastPromiseOptions,
  ToastPromiseValue,
  ToastRecord,
} from './toast-types';

function resolvePromiseValue<Value, Data>(
  value:
    | ToastPromiseValue<Data>
    | ((input: Value) => ToastPromiseValue<Data>),
  input: Value,
): ToastOptions<Data> {
  const resolved = typeof value === 'function' ? value(input) : value;
  return typeof resolved === 'string' ? { description: resolved } : resolved;
}

class ToastManagerImpl<Data = unknown> implements ToastManager<Data> {
  private records: ToastRecord<Data>[] = [];
  private listeners = new Set<ToastListener<Data>>();
  private nextId = 0;

  add(options: ToastOptions<Data>): string {
    const id = options.id || `ds-toast-${++this.nextId}`;
    const existingIndex = this.records.findIndex(record => record.id === id);

    if (!options.title?.trim() && !options.description?.trim()) {
      console.warn(`[ds-toast] Toast "${id}" should provide a title or description.`);
    }

    if (existingIndex >= 0) {
      const current = this.records[existingIndex];
      const updated: ToastRecord<Data> = {
        ...current,
        ...options,
        id,
        priority: options.priority ?? current.priority,
        transitionStatus: 'active',
        closeReason: undefined,
        updateKey: current.updateKey + 1,
        timerKey: current.timerKey + 1,
      };
      this.records = [
        updated,
        ...this.records.filter((_, index) => index !== existingIndex),
      ];
      this.emit();
      return id;
    }

    const record: ToastRecord<Data> = {
      ...options,
      id,
      priority: options.priority ?? 'low',
      transitionStatus: 'starting',
      updateKey: 0,
      timerKey: 0,
    };
    this.records = [record, ...this.records];
    this.emit();
    return id;
  }

  update(id: string, updates: Partial<ToastOptions<Data>>): void {
    const index = this.records.findIndex(record => record.id === id);
    if (index < 0) return;
    const current = this.records[index];
    const restartsTimer =
      Object.prototype.hasOwnProperty.call(updates, 'timeout') ||
      (current.type === 'loading' && updates.type !== undefined && updates.type !== 'loading');
    const updated: ToastRecord<Data> = {
      ...current,
      ...updates,
      id,
      priority: updates.priority ?? current.priority,
      updateKey: current.updateKey + 1,
      timerKey: restartsTimer ? current.timerKey + 1 : current.timerKey,
    };
    this.records = this.records.map((record, recordIndex) =>
      recordIndex === index ? updated : record
    );
    this.emit();
  }

  close(id: string, reason: ToastCloseReason = 'programmatic'): void {
    const index = this.records.findIndex(record => record.id === id);
    if (index < 0 || this.records[index].transitionStatus === 'ending') return;

    const closing: ToastRecord<Data> = {
      ...this.records[index],
      transitionStatus: 'ending',
      closeReason: reason,
    };
    this.records = this.records.map((record, recordIndex) =>
      recordIndex === index ? closing : record
    );
    this.emit();
    closing.onClose?.({ id, reason, toast: closing });
  }

  closeAll(reason: ToastCloseReason = 'programmatic'): void {
    for (const record of [...this.records]) this.close(record.id, reason);
  }

  async promise<Value>(
    promiseValue: PromiseLike<Value>,
    options: ToastPromiseOptions<Value, Data>,
  ): Promise<Value> {
    const loading = resolvePromiseValue(options.loading, undefined as Value);
    const id = this.add({
      ...loading,
      type: loading.type ?? 'loading',
      timeout: 0,
    });

    try {
      const value = await promiseValue;
      const success = resolvePromiseValue(options.success, value);
      this.update(id, {
        ...success,
        type: success.type ?? 'success',
        timeout: success.timeout,
      });
      return value;
    } catch (error) {
      const failure = resolvePromiseValue(options.error, error);
      this.update(id, {
        ...failure,
        type: failure.type ?? 'error',
        timeout: failure.timeout,
      });
      throw error;
    }
  }

  subscribe(listener: ToastListener<Data>): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): readonly ToastRecord<Data>[] {
    return this.records.map(record => ({ ...record }));
  }

  activate(id: string): void {
    const record = this.records.find(candidate => candidate.id === id);
    if (!record || record.transitionStatus !== 'starting') return;
    this.records = this.records.map(candidate =>
      candidate.id === id
        ? { ...candidate, transitionStatus: 'active' }
        : candidate
    );
    this.emit();
  }

  remove(id: string): ToastCloseContext<Data> | null {
    const record = this.records.find(candidate => candidate.id === id);
    if (!record || record.transitionStatus !== 'ending') return null;
    const reason = record.closeReason ?? 'programmatic';
    this.records = this.records.filter(candidate => candidate.id !== id);
    this.emit();
    const context: ToastCloseContext<Data> = { id, reason, toast: record };
    return context;
  }

  notifyRemove(context: ToastCloseContext<Data>): void {
    const { toast } = context;
    toast.onRemove?.(context);
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}

export function createToastManager<Data = unknown>(): ToastManager<Data> {
  return new ToastManagerImpl<Data>();
}

const defaultManagerKey = Symbol.for('@ds-mo/ui/default-toast-manager');
const globalScope = globalThis as typeof globalThis & Record<PropertyKey, unknown>;
const existingManager = globalScope[defaultManagerKey] as ToastManager | undefined;

export const toastManager: ToastManager =
  existingManager ?? createToastManager();

if (!existingManager) globalScope[defaultManagerKey] = toastManager;
