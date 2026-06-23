import { Component, Prop, State, h, Host } from '@stencil/core';
import { resolveCssTimeMs, TOKEN_DEFAULTS } from '../../utils';
import { subscribeToToasts, getToasts, toast as toastService, type ToastData, type ToastIntent } from './toast-service';

export type ToastPosition = 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';

const INTENT_BG: Record<ToastIntent, string> = {
  neutral:  'var(--color-background-bold-neutral)',
  brand:    'var(--color-background-bold-brand)',
  positive: 'var(--color-background-bold-positive)',
  negative: 'var(--color-background-bold-negative)',
  warning:  'var(--color-background-bold-warning)',
  caution:  'var(--color-background-bold-caution)',
};

interface ToastItemState {
  data: ToastData;
  exiting: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
  paused: boolean;
}

@Component({
  tag: 'ds-toast-provider',
  styleUrl: 'Toast.css',
  scoped: true,
})
export class ToastProvider {
  @Prop() position: ToastPosition = 'top-center';

  @State() private items: ToastItemState[] = [];

  private unsubscribe: (() => void) | null = null;

  private get fadeOutMs(): number {
    return resolveCssTimeMs(TOKEN_DEFAULTS.motionShort3, TOKEN_DEFAULTS.animationDurationShort3);
  }

  connectedCallback() {
    this.unsubscribe = subscribeToToasts(() => this.syncFromStore());
    this.syncFromStore();
  }

  disconnectedCallback() {
    this.items.forEach(item => { if (item.timer) clearTimeout(item.timer); });
    this.unsubscribe?.();
  }

  private syncFromStore() {
    const storeToasts = getToasts();
    const existingIds = new Set(this.items.map(i => i.data.id));
    const storeIds = new Set(storeToasts.map(t => t.id));

    // Remove items no longer in store (instant, no animation since dismiss() already fires animation)
    const kept = this.items.filter(i => storeIds.has(i.data.id));

    // Add new items
    const newItems: ToastItemState[] = storeToasts
      .filter(t => !existingIds.has(t.id))
      .map(data => {
        const state: ToastItemState = {
          data,
          exiting: false,
          timer: null,
          remaining: data.duration,
          startedAt: 0,
          paused: false,
        };
        if (data.duration > 0) {
          state.startedAt = Date.now();
          state.timer = setTimeout(() => this.dismissItem(data.id), data.duration);
        }
        return state;
      });

    this.items = [...kept, ...newItems];
  }

  private dismissItem(id: string) {
    this.items = this.items.map(i =>
      i.data.id === id ? { ...i, exiting: true, timer: null } : i
    );
    setTimeout(() => {
      this.items = this.items.filter(i => i.data.id !== id);
      toastService.dismiss(id);
    }, this.fadeOutMs);
  }

  private pauseItem(id: string) {
    this.items = this.items.map(i => {
      if (i.data.id !== id || i.paused || !i.timer) return i;
      clearTimeout(i.timer);
      const elapsed = Date.now() - i.startedAt;
      return { ...i, paused: true, timer: null, remaining: Math.max(0, i.remaining - elapsed) };
    });
  }

  private resumeItem(id: string) {
    this.items = this.items.map(i => {
      if (i.data.id !== id || !i.paused || i.remaining <= 0) return i;
      const timer = setTimeout(() => this.dismissItem(id), i.remaining);
      return { ...i, paused: false, timer, startedAt: Date.now() };
    });
  }

  private getPositionStyle(): Record<string, string> {
    const base: Record<string, string> = {
      position: 'fixed',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--dimension-space-075)',
      pointerEvents: 'none',
      padding: 'var(--dimension-space-100)',
      maxWidth: `var(${TOKEN_DEFAULTS.panelWidthMd})`,
      width: '100%',
      boxSizing: 'border-box',
    };
    switch (this.position) {
      case 'top-center':
        return { ...base, top: '0', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' };
      case 'top-right':
        return { ...base, top: '0', right: '0', alignItems: 'flex-end' };
      case 'bottom-center':
        return { ...base, bottom: '0', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' };
      case 'bottom-right':
        return { ...base, bottom: '0', right: '0', alignItems: 'flex-end' };
    }
  }

  render() {
    return (
      <Host style={{ display: 'contents' }}>
        <div
          class="toast-container"
          role="region"
          aria-label="Notifications"
          aria-live="polite"
          style={this.getPositionStyle()}
        >
          {this.items.map(item => (
            <div
              key={item.data.id}
              class={{ toast: true, 'toast--exit': item.exiting }}
              role={item.data.intent === 'negative' ? 'alert' : 'status'}
              style={{
                backgroundColor: INTENT_BG[item.data.intent],
                borderRadius: 'var(--dimension-radius-125)',
                boxShadow: 'var(--effect-elevation-elevated-floating)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--dimension-space-075)',
                padding: 'var(--dimension-space-075) var(--dimension-space-100)',
                minHeight: 'var(--dimension-size-400)',
                pointerEvents: 'auto',
                color: 'var(--color-foreground-on-bold-background-primary)',
                boxSizing: 'border-box',
              }}
              onMouseEnter={() => this.pauseItem(item.data.id)}
              onMouseLeave={() => this.resumeItem(item.data.id)}
            >
              <span class="text-body-medium" style={{ flex: '1' }}>{item.data.message}</span>
              <button
                type="button"
                class="toast-dismiss"
                onClick={() => this.dismissItem(item.data.id)}
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
