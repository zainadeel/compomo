import {
  findTableVirtualIndexAtOffset,
  resolveTableVirtualPlan,
  sameTableVirtualPlan,
  tableVirtualItemSizes,
  type TableVirtualItem,
  type TableVirtualPlan,
} from './table-virtual-model';

export interface TableVirtualControllerState {
  enabled: boolean;
  items: readonly TableVirtualItem[];
  pinnedRowIds: ReadonlySet<string>;
  viewport: HTMLElement | null;
  viewportSize: number;
}

export interface TableVirtualControllerOptions {
  state: () => TableVirtualControllerState;
  windowChanged: (plan: TableVirtualPlan | null) => void;
  requestAnimationFrame?: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame?: (handle: number) => void;
}

const MEASURE_EPSILON_PX = 0.5;

/** Binds viewport scroll/resize to a recycled row window. Scroll offset stays off render state. */
export class TableVirtualController {
  private connected = false;
  private connectedViewport: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private frame: number | null = null;
  private measures = new Map<string, number>();
  private plan: TableVirtualPlan | null = null;
  private scrollOffset = 0;
  private pendingReset = false;
  private readonly raf: (callback: FrameRequestCallback) => number;
  private readonly caf: (handle: number) => void;

  constructor(private readonly options: TableVirtualControllerOptions) {
    this.raf = options.requestAnimationFrame ?? (typeof requestAnimationFrame === 'function'
      ? callback => requestAnimationFrame(callback)
      : callback => setTimeout(callback, 16) as unknown as number);
    this.caf = options.cancelAnimationFrame ?? (typeof cancelAnimationFrame === 'function'
      ? handle => cancelAnimationFrame(handle)
      : handle => clearTimeout(handle));
  }

  connect(): void {
    this.connected = true;
    this.refresh();
  }

  disconnect(): void {
    this.connected = false;
    this.cancelFrame();
    this.unbindViewport();
  }

  refresh(): void {
    if (!this.connected) return;
    const { viewport, enabled } = this.options.state();
    if (!enabled || !viewport) {
      this.unbindViewport();
      this.emit(null);
      return;
    }
    if (viewport !== this.connectedViewport) {
      this.unbindViewport();
      this.connectedViewport = viewport;
      viewport.addEventListener('scroll', this.handleScroll, { passive: true });
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(this.schedule);
        this.resizeObserver.observe(viewport);
      }
    }
    this.sync();
  }

  schedule = (): void => {
    if (!this.connected || this.frame !== null) return;
    this.frame = this.raf(() => {
      this.frame = null;
      this.sync();
    });
  };

  /** Drop cached heights after column, density, or wrap geometry changes. */
  invalidateMeasures(): void {
    this.measures.clear();
    this.schedule();
  }

  /** Rebuild from a new index and pin the viewport to the start. */
  resetToTop(): void {
    this.pendingReset = true;
    this.measures.clear();
    this.scrollOffset = 0;
    const viewport = this.connectedViewport ?? this.options.state().viewport;
    if (viewport) viewport.scrollTop = 0;
    this.schedule();
  }

  sizeFor(item: TableVirtualItem): number {
    return this.measures.get(item.id) ?? item.estimatedSize;
  }

  currentPlan(): TableVirtualPlan | null {
    return this.plan;
  }

  /** Measure painted rows and correct scroll when estimates were wrong. */
  collectMeasurements(root: ParentNode | null): void {
    if (!root || !this.connected || !this.options.state().enabled) return;
    const painted = root.querySelectorAll<HTMLElement>('[data-virtual-id]');
    if (painted.length === 0) return;

    const prefixBefore = this.prefixForCurrentItems();
    const viewport = this.connectedViewport;
    const scrollTop = viewport?.scrollTop ?? this.scrollOffset;
    const anchorIndex = findTableVirtualIndexAtOffset(prefixBefore, scrollTop);
    const anchorOffset = prefixBefore[anchorIndex] ?? 0;
    let changed = false;
    painted.forEach(element => {
      const id = element.getAttribute('data-virtual-id');
      if (!id) return;
      const height = element.getBoundingClientRect().height;
      if (!Number.isFinite(height) || height <= 0) return;
      const previous = this.measures.get(id);
      if (previous != null && Math.abs(previous - height) < MEASURE_EPSILON_PX) return;
      this.measures.set(id, height);
      changed = true;
    });
    if (!changed) return;

    const prefixAfter = this.prefixForCurrentItems();
    const nextAnchor = prefixAfter[anchorIndex] ?? 0;
    const delta = nextAnchor - anchorOffset;
    if (viewport && Math.abs(delta) >= MEASURE_EPSILON_PX) {
      viewport.scrollTop = Math.max(0, viewport.scrollTop + delta);
      this.scrollOffset = viewport.scrollTop;
    }
    this.sync();
  }

  private prefixForCurrentItems(): number[] {
    const { items } = this.options.state();
    const sizes = tableVirtualItemSizes(items, this.measures);
    const prefix = [0];
    for (let index = 0; index < sizes.length; index += 1) {
      prefix.push(prefix[index]! + sizes[index]!);
    }
    return prefix;
  }

  private readonly handleScroll = (): void => {
    const viewport = this.connectedViewport;
    if (viewport) this.scrollOffset = viewport.scrollTop;
    this.schedule();
  };

  private sync(): void {
    if (!this.connected) return;
    const state = this.options.state();
    if (!state.enabled) {
      this.emit(null);
      return;
    }

    if (this.pendingReset) {
      this.scrollOffset = 0;
      if (state.viewport) state.viewport.scrollTop = 0;
      this.pendingReset = false;
    } else if (state.viewport) {
      this.scrollOffset = state.viewport.scrollTop;
    }
    const sizes = tableVirtualItemSizes(state.items, this.measures);
    const plan = resolveTableVirtualPlan({
      items: state.items,
      sizes,
      scrollOffset: this.scrollOffset,
      viewportSize: state.viewport?.clientHeight || state.viewportSize,
      pinnedRowIds: state.pinnedRowIds,
    });
    this.emit(plan);
  }

  private emit(plan: TableVirtualPlan | null): void {
    if (sameTableVirtualPlan(this.plan, plan)) return;
    this.plan = plan;
    this.options.windowChanged(plan);
  }

  private unbindViewport(): void {
    this.connectedViewport?.removeEventListener('scroll', this.handleScroll);
    this.connectedViewport = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private cancelFrame(): void {
    if (this.frame === null) return;
    this.caf(this.frame);
    this.frame = null;
  }
}
