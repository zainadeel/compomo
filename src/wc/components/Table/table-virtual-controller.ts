import {
  createTableVirtualIndex,
  findTableVirtualIndexAtOffset,
  resolveTableVirtualPlanFromIndex,
  sameTableVirtualPlan,
  tableVirtualItemSizes,
  type TableVirtualItem,
  type TableVirtualIndex,
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
  private measurementObserver: ResizeObserver | null = null;
  private measurementTargets = new Set<HTMLElement>();
  private viewportWidth = 0;
  private viewportSize = 0;
  private frame: number | null = null;
  private measures = new Map<string, number>();
  private measuredIds = new Set<string>();
  private plan: TableVirtualPlan | null = null;
  private index: TableVirtualIndex | null = null;
  private indexedItems: readonly TableVirtualItem[] | null = null;
  private indexDirty = true;
  private scrollOffset = 0;
  private scrollDirection: 'backward' | 'forward' | 'none' = 'none';
  private pendingReset = false;
  private readonly raf: (callback: FrameRequestCallback) => number;
  private readonly caf: (handle: number) => void;

  constructor(private readonly options: TableVirtualControllerOptions) {
    this.raf =
      options.requestAnimationFrame ??
      (typeof requestAnimationFrame === 'function'
        ? callback => requestAnimationFrame(callback)
        : callback => setTimeout(callback, 16) as unknown as number);
    this.caf =
      options.cancelAnimationFrame ??
      (typeof cancelAnimationFrame === 'function'
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
      this.viewportWidth = viewport.clientWidth;
      this.viewportSize = viewport.clientHeight;
      this.scrollOffset = viewport.scrollTop;
      viewport.addEventListener('scroll', this.handleScroll, { passive: true });
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(this.handleViewportResize);
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
    this.measuredIds.clear();
    this.indexDirty = true;
    this.schedule();
  }

  /** Rebuild from a new index and pin the viewport to the start. */
  resetToTop(): void {
    this.pendingReset = true;
    this.measures.clear();
    this.measuredIds.clear();
    this.indexDirty = true;
    this.scrollOffset = 0;
    this.scrollDirection = 'none';
    const viewport = this.connectedViewport ?? this.options.state().viewport;
    if (viewport) viewport.scrollTop = 0;
    this.schedule();
  }

  sizeFor(item: TableVirtualItem): number {
    if (!item.variableSize) return item.estimatedSize;
    return this.measures.get(item.id) ?? item.estimatedSize;
  }

  currentPlan(): TableVirtualPlan | null {
    return this.plan;
  }

  currentViewportSize(): number {
    return this.viewportSize;
  }

  /** Measure painted rows and correct scroll when estimates were wrong. */
  collectMeasurements(root: ParentNode | null): void {
    if (!root || !this.connected || !this.options.state().enabled) return;
    const painted = root.querySelectorAll<HTMLElement>('[data-virtual-measure="true"]');
    this.syncMeasurementTargets(painted);
    if (painted.length === 0) return;

    const state = this.options.state();
    const measurements: Array<{ id: string; height: number }> = [];
    painted.forEach(element => {
      const id = element.getAttribute('data-virtual-id');
      if (!id || this.measuredIds.has(id)) return;
      measurements.push({ id, height: element.getBoundingClientRect().height });
    });
    this.applyMeasurements(state.items, measurements);
  }

  private applyMeasurements(
    items: readonly TableVirtualItem[],
    measurements: readonly { id: string; height: number }[]
  ): void {
    if (measurements.length === 0) return;
    const currentIndex = this.ensureIndex(items);
    const prefixBefore = currentIndex.prefix;
    const viewport = this.connectedViewport;
    const scrollTop = viewport?.scrollTop ?? this.scrollOffset;
    const anchorIndex = findTableVirtualIndexAtOffset(prefixBefore, scrollTop);
    const anchorOffset = prefixBefore[anchorIndex] ?? 0;
    let changed = false;
    for (const { id, height } of measurements) {
      if (!Number.isFinite(height) || height <= 0) continue;
      const itemIndex = currentIndex.itemIndexById.get(id);
      const item = itemIndex == null ? undefined : items[itemIndex];
      if (!item?.variableSize) continue;
      this.measuredIds.add(id);
      const previous = this.measures.get(id);
      if (Math.abs(item.estimatedSize - height) < MEASURE_EPSILON_PX) {
        if (previous != null) {
          this.measures.delete(id);
          changed = true;
        }
        continue;
      }
      if (previous != null && Math.abs(previous - height) < MEASURE_EPSILON_PX) continue;
      this.measures.set(id, height);
      changed = true;
    }
    if (!changed) return;
    this.indexDirty = true;
    const prefixAfter = this.ensureIndex(items).prefix;
    const nextAnchor = prefixAfter[anchorIndex] ?? 0;
    const delta = nextAnchor - anchorOffset;
    if (viewport && Math.abs(delta) >= MEASURE_EPSILON_PX) {
      viewport.scrollTop = Math.max(0, viewport.scrollTop + delta);
      this.scrollOffset = viewport.scrollTop;
    }
    this.sync();
  }

  private syncMeasurementTargets(elements: NodeListOf<HTMLElement>): void {
    if (typeof ResizeObserver === 'undefined') return;
    if (!this.measurementObserver) {
      this.measurementObserver = new ResizeObserver(entries => {
        const state = this.options.state();
        const measurements = entries.map(entry => ({
          id: (entry.target as HTMLElement).getAttribute('data-virtual-id') ?? '',
          height: entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height,
        }));
        this.applyMeasurements(state.items, measurements);
      });
    }
    const next = new Set(elements);
    for (const element of this.measurementTargets) {
      if (!next.has(element)) this.measurementObserver.unobserve(element);
    }
    for (const element of next) {
      if (!this.measurementTargets.has(element)) this.measurementObserver.observe(element);
    }
    this.measurementTargets = next;
  }

  private readonly handleViewportResize = (entries: ResizeObserverEntry[]): void => {
    const entry = entries.find(candidate => candidate.target === this.connectedViewport);
    const width = entry?.contentRect.width ?? this.connectedViewport?.clientWidth ?? 0;
    const size = entry?.contentRect.height ?? this.connectedViewport?.clientHeight ?? 0;
    const sizeChanged = size !== this.viewportSize;
    this.viewportSize = size;
    if (width !== this.viewportWidth) {
      this.viewportWidth = width;
      const items = this.options.state().items;
      const hasVariableSize =
        this.indexedItems === items && this.index
          ? this.index.hasVariableSize
          : items.some(item => item.variableSize);
      if (hasVariableSize) this.invalidateMeasures();
      else if (sizeChanged) this.schedule();
      return;
    }
    if (sizeChanged) this.schedule();
  };

  private readonly handleScroll = (): void => {
    const viewport = this.connectedViewport;
    if (viewport) {
      const nextOffset = viewport.scrollTop;
      this.scrollDirection =
        nextOffset > this.scrollOffset
          ? 'forward'
          : nextOffset < this.scrollOffset
            ? 'backward'
            : this.scrollDirection;
      this.scrollOffset = nextOffset;
    }
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
    }
    const index = this.ensureIndex(state.items);
    const plan = resolveTableVirtualPlanFromIndex(index, {
      scrollOffset: this.scrollOffset,
      viewportSize: this.viewportSize || state.viewportSize,
      scrollDirection: this.scrollDirection,
      pinnedRowIds: state.pinnedRowIds,
    });
    this.emit(plan);
  }

  private emit(plan: TableVirtualPlan | null): void {
    if (sameTableVirtualPlan(this.plan, plan)) return;
    this.plan = plan;
    this.options.windowChanged(plan);
  }

  private ensureIndex(items: readonly TableVirtualItem[]): TableVirtualIndex {
    if (!this.indexDirty && this.index && this.indexedItems === items) return this.index;
    if (this.indexedItems !== items && (this.measures.size > 0 || this.measuredIds.size > 0)) {
      const itemIds = new Set(items.map(item => item.id));
      for (const id of this.measures.keys()) {
        if (!itemIds.has(id)) this.measures.delete(id);
      }
      for (const id of this.measuredIds) {
        if (!itemIds.has(id)) this.measuredIds.delete(id);
      }
    }
    this.indexedItems = items;
    this.index = createTableVirtualIndex(items, tableVirtualItemSizes(items, this.measures));
    this.indexDirty = false;
    return this.index;
  }

  private unbindViewport(): void {
    this.connectedViewport?.removeEventListener('scroll', this.handleScroll);
    this.connectedViewport = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.measurementObserver?.disconnect();
    this.measurementObserver = null;
    this.measurementTargets.clear();
    this.viewportWidth = 0;
    this.viewportSize = 0;
  }

  private cancelFrame(): void {
    if (this.frame === null) return;
    this.caf(this.frame);
    this.frame = null;
  }
}
