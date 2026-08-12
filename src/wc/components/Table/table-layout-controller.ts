export interface TableLayoutElements {
  viewport: HTMLElement | null;
  table: HTMLTableElement | null;
  stickyHeaderTable: HTMLTableElement | null;
  collapseAllOverlay: HTMLElement | null;
  frame: HTMLElement | null;
  interactiveHead: HTMLTableSectionElement | null;
}

export interface TableLayoutMode {
  documentStickyHeader: boolean;
  floatingCollapseAll: boolean;
  clampVerticalOverscroll: boolean;
}

export interface TableOverflowState {
  start: boolean;
  end: boolean;
  scrollable: boolean;
}

export interface TableLayoutControllerOptions {
  elements: () => TableLayoutElements;
  mode: () => TableLayoutMode;
  overflowChanged: (state: TableOverflowState) => void;
  verticalEdgeWheel?: (deltaY: number) => boolean;
}

export interface TableLayoutMetricInput {
  viewportInlineSize: number;
  viewportBlockSize: number;
  scrollInlineSize: number;
  scrollBlockSize: number;
  scrollInlineOffset: number;
  tableInlineSize: number;
  collapseHeadBlockStart?: number;
  collapseFrameBlockStart?: number;
}

export interface TableLayoutMetrics {
  visibleInlineSize: number;
  overflow: TableOverflowState;
  inlineOffset: number;
  maxInlineOffset: number;
  collapseBlockOffset: number | null;
}

/** Pure geometry resolution shared by the controller and focused tests. */
export function resolveTableLayoutMetrics(input: TableLayoutMetricInput): TableLayoutMetrics {
  const horizontalOverflow = input.scrollInlineSize - input.viewportInlineSize > 1;
  return {
    visibleInlineSize: Math.min(input.viewportInlineSize, input.tableInlineSize),
    overflow: {
      start: horizontalOverflow && input.scrollInlineOffset > 1,
      end: horizontalOverflow &&
        input.scrollInlineOffset + input.viewportInlineSize < input.scrollInlineSize - 1,
      scrollable: horizontalOverflow || input.scrollBlockSize - input.viewportBlockSize > 1,
    },
    inlineOffset: input.scrollInlineOffset,
    maxInlineOffset: Math.max(0, input.scrollInlineSize - input.viewportInlineSize),
    collapseBlockOffset: input.collapseHeadBlockStart == null ||
      input.collapseFrameBlockStart == null
      ? null
      : Math.max(0, input.collapseHeadBlockStart - input.collapseFrameBlockStart),
  };
}

/**
 * Owns table viewport observation. It resolves newly rendered geometry
 * immediately so the first paint has the correct viewport-width chrome, then
 * batches observer-driven scroll and resize reads/writes into one animation frame.
 * The component remains responsible only for refs and reactive overflow state.
 */
export class TableLayoutController {
  private connected = false;
  private connectedViewport: HTMLElement | null = null;
  private observedTable: HTMLTableElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private frame: number | null = null;
  private overflow: TableOverflowState | null = null;

  constructor(private readonly options: TableLayoutControllerOptions) {}

  connect(): void {
    this.connected = true;
    this.refresh();
  }

  disconnect(): void {
    this.connected = false;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.connectedViewport?.removeEventListener('scroll', this.handleScroll);
    this.connectedViewport?.removeEventListener('wheel', this.handleWheel);
    this.connectedViewport = null;
    this.observedTable = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  /** Reconcile newly rendered refs, observers, and pending geometry. */
  refresh(): void {
    if (!this.connected) return;
    const { viewport, table } = this.options.elements();
    const elementsChanged = viewport !== this.connectedViewport || table !== this.observedTable;
    if (elementsChanged) {
      this.connectedViewport?.removeEventListener('scroll', this.handleScroll);
      this.connectedViewport?.removeEventListener('wheel', this.handleWheel);
      this.resizeObserver?.disconnect();
      this.connectedViewport = viewport;
      this.observedTable = table;
      viewport?.addEventListener('scroll', this.handleScroll, { passive: true });
      viewport?.addEventListener('wheel', this.handleWheel, { passive: false });

      if (typeof ResizeObserver !== 'undefined' && viewport) {
        this.resizeObserver ??= new ResizeObserver(this.schedule);
        this.resizeObserver.observe(viewport);
        if (table) this.resizeObserver.observe(table);
      }
    }
    // Rendering can change the table's intrinsic width without replacing either
    // element. Resolve that geometry before componentDidRender returns so WebKit
    // cannot paint or expose one frame using the full spanning-cell width.
    this.sync();
  }

  private schedule = (): void => {
    if (!this.connected || this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.sync();
    });
  };

  private readonly handleScroll = (): void => {
    this.clampInlineOffset();
    if (this.options.mode().clampVerticalOverscroll) this.clampBlockOffset();
    this.schedule();
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    const viewport = this.connectedViewport;
    if (!viewport) return;

    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const atStart = viewport.scrollLeft <= 0 && event.deltaX < 0;
      const atEnd = viewport.scrollLeft >= max && event.deltaX > 0;
      if (atStart || atEnd) event.preventDefault();
      return;
    }

    if (!this.options.mode().clampVerticalOverscroll || event.deltaY === 0) return;
    const max = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const atStart = viewport.scrollTop <= 0 && event.deltaY < 0;
    const atEnd = viewport.scrollTop >= max && event.deltaY > 0;
    if (!atStart && !atEnd) return;

    this.options.verticalEdgeWheel?.(event.deltaY);
    event.preventDefault();
  };

  private clampInlineOffset(): void {
    const viewport = this.connectedViewport;
    if (!viewport) return;
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const clamped = Math.min(max, Math.max(0, viewport.scrollLeft));
    if (viewport.scrollLeft !== clamped) viewport.scrollLeft = clamped;
  }

  private clampBlockOffset(): void {
    const viewport = this.connectedViewport;
    if (!viewport) return;
    const max = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const clamped = Math.min(max, Math.max(0, viewport.scrollTop));
    if (viewport.scrollTop !== clamped) viewport.scrollTop = clamped;
  }

  private sync(): void {
    const elements = this.options.elements();
    const viewport = elements.viewport;
    if (!viewport) return;

    // Read every layout value before writing styles or reactive state.
    const mode = this.options.mode();
    const measureCollapse = mode.floatingCollapseAll && !mode.documentStickyHeader &&
      elements.collapseAllOverlay && elements.frame && elements.interactiveHead;
    const metrics = resolveTableLayoutMetrics({
      viewportInlineSize: viewport.clientWidth,
      viewportBlockSize: viewport.clientHeight,
      scrollInlineSize: viewport.scrollWidth,
      scrollBlockSize: viewport.scrollHeight,
      scrollInlineOffset: viewport.scrollLeft,
      tableInlineSize: elements.table?.getBoundingClientRect().width ?? viewport.clientWidth,
      collapseHeadBlockStart: measureCollapse
        ? elements.interactiveHead!.getBoundingClientRect().top
        : undefined,
      collapseFrameBlockStart: measureCollapse
        ? elements.frame!.getBoundingClientRect().top
        : undefined,
    });

    this.setProperty(
      viewport,
      '--ds-table-visible-inline-size',
      `${metrics.visibleInlineSize}px`,
    );
    if (elements.stickyHeaderTable) {
      this.setProperty(
        elements.stickyHeaderTable,
        '--ds-table-inline-scroll-offset',
        `${metrics.inlineOffset}px`,
      );
      this.setProperty(
        elements.stickyHeaderTable,
        '--ds-table-inline-scroll-max-offset',
        `${metrics.maxInlineOffset}px`,
      );
    }
    if (metrics.collapseBlockOffset !== null && elements.collapseAllOverlay) {
      this.setProperty(
        elements.collapseAllOverlay,
        '--ds-table-collapse-all-block-offset',
        `${metrics.collapseBlockOffset}px`,
      );
    }

    if (
      !this.overflow ||
      this.overflow.start !== metrics.overflow.start ||
      this.overflow.end !== metrics.overflow.end ||
      this.overflow.scrollable !== metrics.overflow.scrollable
    ) {
      this.overflow = metrics.overflow;
      this.options.overflowChanged(metrics.overflow);
    }
  }

  private setProperty(element: HTMLElement, property: string, value: string): void {
    if (element.style.getPropertyValue(property) !== value) {
      element.style.setProperty(property, value);
    }
  }
}
