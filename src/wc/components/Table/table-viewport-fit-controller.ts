import { resolveCssLengthPx } from '../../utils/resolve-css-length-px';

export interface TableViewportFitMetricInput {
  scrollportBlockStart: number;
  scrollportBlockSize: number;
  hostBlockStart: number;
  insetBlockStart: number;
  insetBlockEnd: number;
}

export interface TableViewportFitMetrics {
  reservedBlockSize: number;
  currentBlockSize: number;
  settled: boolean;
}

export interface TableViewportFitElements {
  host: HTMLElement | null;
  surface: HTMLElement | null;
}

export interface TableViewportFitControllerOptions {
  enabled: () => boolean;
  elements: () => TableViewportFitElements;
  insets: () => { blockStart: string | number; blockEnd: string | number };
  fitChanged: (metrics: TableViewportFitMetrics | null) => void;
}

/** Resolve the reserved compact-state height and the height currently visible. */
export function resolveTableViewportFitMetrics(
  input: TableViewportFitMetricInput,
): TableViewportFitMetrics {
  const insetBlockStart = Math.max(0, input.insetBlockStart);
  const insetBlockEnd = Math.max(0, input.insetBlockEnd);
  const scrollportBlockEnd = input.scrollportBlockStart + input.scrollportBlockSize;
  const settledBlockStart = input.scrollportBlockStart + insetBlockStart;
  const reservedBlockSize = Math.max(
    0,
    input.scrollportBlockSize - insetBlockStart - insetBlockEnd,
  );
  const currentBlockStart = Math.max(input.hostBlockStart, settledBlockStart);
  const currentBlockSize = Math.min(
    reservedBlockSize,
    Math.max(0, scrollportBlockEnd - insetBlockEnd - currentBlockStart),
  );

  return {
    reservedBlockSize,
    currentBlockSize,
    settled: input.hostBlockStart <= settledBlockStart + 0.5,
  };
}

/**
 * Fits the complete table chrome to its nearest vertical scrollport. The host
 * reserves its compact-state height so the outer page can consume collapsing
 * header travel without changing document height. The visible table surface
 * grows into that reservation until it reaches the supplied sticky inset.
 */
export class TableViewportFitController {
  private connected = false;
  private connectedHost: HTMLElement | null = null;
  private connectedSurface: HTMLElement | null = null;
  private scrollRoot: HTMLElement | Window | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private metrics: TableViewportFitMetrics | null = null;
  private insetBlockStart: string | number | null = null;
  private insetBlockEnd: string | number | null = null;

  constructor(private readonly options: TableViewportFitControllerOptions) {}

  connect(): void {
    this.connected = true;
    this.refresh();
  }

  disconnect(): void {
    this.connected = false;
    this.disconnectRuntime();
    this.clearGeometry();
  }

  refresh(forceGeometry = true): void {
    if (!this.connected) return;
    if (!this.options.enabled()) {
      this.disconnectRuntime();
      this.clearGeometry();
      return;
    }

    const { host, surface } = this.options.elements();
    if (!host || !surface) return;
    const elementsChanged = host !== this.connectedHost || surface !== this.connectedSurface;
    const nextScrollRoot = elementsChanged || !this.scrollRoot
      ? this.findScrollRoot(host)
      : this.scrollRoot;
    const rootChanged = nextScrollRoot !== this.scrollRoot;
    if (nextScrollRoot !== this.scrollRoot) {
      this.disconnectRuntime();
      this.scrollRoot = nextScrollRoot;
      this.scrollRoot.addEventListener('scroll', this.sync, { passive: true });
      window.addEventListener('resize', this.sync, { passive: true });
      if (typeof ResizeObserver !== 'undefined' && this.scrollRoot instanceof HTMLElement) {
        this.resizeObserver = new ResizeObserver(this.sync);
        this.resizeObserver.observe(this.scrollRoot);
      }
    }
    this.connectedHost = host;
    this.connectedSurface = surface;
    const insets = this.options.insets();
    const insetsChanged = insets.blockStart !== this.insetBlockStart ||
      insets.blockEnd !== this.insetBlockEnd;
    this.insetBlockStart = insets.blockStart;
    this.insetBlockEnd = insets.blockEnd;
    if (forceGeometry || elementsChanged || rootChanged || insetsChanged) this.sync();
  }

  /** Pass a fitted table's boundary wheel delta to its owning page scrollport. */
  scrollOuterBy(delta: number): boolean {
    if (!this.scrollRoot || delta === 0) return false;
    if (this.scrollRoot instanceof HTMLElement) {
      const previous = this.scrollRoot.scrollTop;
      const max = Math.max(0, this.scrollRoot.scrollHeight - this.scrollRoot.clientHeight);
      this.scrollRoot.scrollTop = Math.min(max, Math.max(0, previous + delta));
      return this.scrollRoot.scrollTop !== previous;
    }

    const scrollingElement = document.scrollingElement;
    const previous = window.scrollY;
    const max = Math.max(
      0,
      (scrollingElement?.scrollHeight ?? document.documentElement.scrollHeight) -
        window.innerHeight,
    );
    const next = Math.min(max, Math.max(0, previous + delta));
    if (next !== previous) window.scrollTo({ top: next, behavior: 'auto' });
    return next !== previous;
  }

  private disconnectRuntime(): void {
    this.scrollRoot?.removeEventListener('scroll', this.sync);
    window.removeEventListener('resize', this.sync);
    this.scrollRoot = null;
    this.connectedHost = null;
    this.connectedSurface = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.insetBlockStart = null;
    this.insetBlockEnd = null;
  }

  private clearGeometry(): void {
    const { host, surface } = this.options.elements();
    host?.style.removeProperty('--_table-viewport-fit-reserved-block-size');
    surface?.style.removeProperty('--_table-viewport-fit-current-block-size');
    if (this.metrics !== null) {
      this.metrics = null;
      this.options.fitChanged(null);
    }
  }

  private readonly sync = (): void => {
    if (!this.connected || !this.options.enabled() || !this.scrollRoot) return;
    const { host, surface } = this.options.elements();
    if (!host || !surface) return;

    const hostRect = host.getBoundingClientRect();
    const scrollportRect = this.scrollRoot instanceof HTMLElement
      ? this.scrollRoot.getBoundingClientRect()
      : { top: 0, height: window.innerHeight };
    const insets = this.options.insets();
    const next = resolveTableViewportFitMetrics({
      scrollportBlockStart: scrollportRect.top,
      scrollportBlockSize: scrollportRect.height,
      hostBlockStart: hostRect.top,
      insetBlockStart: resolveCssLengthPx(insets.blockStart, 0, host),
      insetBlockEnd: resolveCssLengthPx(insets.blockEnd, 0, host),
    });

    this.setProperty(
      host,
      '--_table-viewport-fit-reserved-block-size',
      `${next.reservedBlockSize}px`,
    );
    this.setProperty(
      surface,
      '--_table-viewport-fit-current-block-size',
      `${next.currentBlockSize}px`,
    );
    if (
      !this.metrics ||
      this.metrics.reservedBlockSize !== next.reservedBlockSize ||
      this.metrics.currentBlockSize !== next.currentBlockSize ||
      this.metrics.settled !== next.settled
    ) {
      this.metrics = next;
      this.options.fitChanged(next);
    }
  };

  private findScrollRoot(host: HTMLElement): HTMLElement | Window {
    let ancestor = this.composedParent(host);
    while (ancestor && ancestor !== document.documentElement) {
      const overflow = getComputedStyle(ancestor).overflowY;
      if (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') {
        return ancestor as HTMLElement;
      }
      ancestor = this.composedParent(ancestor);
    }
    return window;
  }

  private composedParent(element: Element): Element | null {
    return (element as HTMLElement).assignedSlot?.parentElement ?? element.parentElement;
  }

  private setProperty(element: HTMLElement, property: string, value: string): void {
    if (element.style.getPropertyValue(property) !== value) {
      element.style.setProperty(property, value);
    }
  }
}
