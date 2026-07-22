/** Bubbling/composed events — `ds-shell-app` and `ds-bar-nav` coordinate during width motion. */

export const CHROME_TRANSITION_START = 'dsChromeTransitionStart';
export const CHROME_TRANSITION_END = 'dsChromeTransitionEnd';

export type ChromeTransitionSource = 'panel-nav' | 'panel-tools';

export interface ChromeTransitionDetail {
  source: ChromeTransitionSource;
  /** Panel-tools drawer motion direction; omitted for panel-nav. */
  phase?: 'opening' | 'closing';
}

/** Reference-counted gate — used while panel-nav width is transitioning. */
export class ChromeTransitionDepth {
  private depth = 0;

  enter(): void {
    this.depth += 1;
  }

  exit(): void {
    this.depth = Math.max(0, this.depth - 1);
  }

  get isActive(): boolean {
    return this.depth > 0;
  }
}

/** Idempotent gate for one physical chrome surface.
 * Duplicate start notifications still require only one matching end. */
export class ChromeTransitionGate {
  private active = false;

  enter(): void {
    this.active = true;
  }

  exit(): void {
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }
}

export interface RafCoalescer {
  schedule(): void;
  cancel(): void;
}

/** Coalesce bursty layout work (ResizeObserver, prop churn) to one callback per frame. */
export function createRafCoalescer(onFrame: () => void): RafCoalescer {
  let rafId = 0;
  return {
    schedule() {
      if (rafId !== 0) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        onFrame();
      });
    },
    cancel() {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },
  };
}

export function readChromeTransitionSource(event: Event): ChromeTransitionSource | undefined {
  return (event as CustomEvent<ChromeTransitionDetail>).detail?.source;
}

export function readChromeTransitionPhase(event: Event): ChromeTransitionDetail['phase'] {
  return (event as CustomEvent<ChromeTransitionDetail>).detail?.phase;
}
