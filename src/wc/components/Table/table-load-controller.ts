import type {
  TableLoadMoreDetail,
  TableLoadMoreMode,
  TableLoadMoreReason,
} from './table-types';

export interface TableLoadControllerState {
  lazyLoading: boolean;
  loadMoreMode: TableLoadMoreMode;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: string | undefined;
  loadIdentity: string | number;
  loadMoreThreshold: number;
  containedScroll: boolean;
  loadingMoreLabel: string;
  endOfResultsLabel: string;
  rowsLoadedLabel: string;
  loadedRowCount: number;
  viewport: HTMLElement | null;
  sentinel: HTMLElement | null;
}

export interface TableLoadControllerOptions {
  state: () => TableLoadControllerState;
  announce: (message: string) => void;
  request: (detail: TableLoadMoreDetail) => void;
}

/** Owns incremental-loading request guards, announcements, and observation. */
export class TableLoadController {
  readonly intersectionSupported = typeof IntersectionObserver !== 'undefined';

  private connected = false;
  private intersectionObserver: IntersectionObserver | null = null;
  private observedSentinel: HTMLElement | null = null;
  private requestPending = false;
  private requestedRowCount = 0;
  private previousLoadedRowCount = 0;

  constructor(private readonly options: TableLoadControllerOptions) {}

  initialize(): void {
    this.previousLoadedRowCount = this.options.state().loadedRowCount;
  }

  connect(): void {
    this.connected = true;
    this.refresh();
  }

  disconnect(): void {
    this.connected = false;
    this.disconnectObserver();
  }

  refresh(): void {
    if (!this.connected) return;
    const state = this.options.state();
    if (
      !state.lazyLoading ||
      state.loadMoreMode !== 'auto' ||
      !state.hasMore ||
      !!state.loadMoreError?.trim() ||
      !this.intersectionSupported ||
      !state.viewport ||
      !state.sentinel
    ) {
      this.disconnectObserver();
      return;
    }

    if (this.intersectionObserver && this.observedSentinel === state.sentinel) return;
    this.disconnectObserver();
    const threshold = Number.isFinite(state.loadMoreThreshold)
      ? Math.max(0, state.loadMoreThreshold)
      : 0;
    this.intersectionObserver = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) this.request('auto');
      },
      {
        root: state.containedScroll ? state.viewport : null,
        rootMargin: `0px 0px ${threshold}px 0px`,
      },
    );
    this.observedSentinel = state.sentinel;
    this.intersectionObserver.observe(state.sentinel);
  }

  structureChanged(): void {
    this.resetRequest();
  }

  dataChanged(): void {
    const state = this.options.state();
    const nextCount = state.loadedRowCount;
    if (!state.lazyLoading) {
      this.previousLoadedRowCount = nextCount;
      this.resetRequest();
      return;
    }
    if (nextCount > this.previousLoadedRowCount) {
      const added = nextCount - this.previousLoadedRowCount;
      this.options.announce(
        state.rowsLoadedLabel
          .replace('{count}', String(added))
          .replace('{total}', String(nextCount)),
      );
    }
    if (nextCount > this.requestedRowCount) this.requestPending = false;
    this.previousLoadedRowCount = nextCount;
    this.disconnectObserver();
  }

  identityChanged(): void {
    this.previousLoadedRowCount = this.options.state().loadedRowCount;
    this.resetRequest();
  }

  configurationChanged(): void {
    this.disconnectObserver();
  }

  loadingChanged(loading: boolean): void {
    const state = this.options.state();
    if (!state.lazyLoading) {
      this.resetRequest();
      return;
    }
    if (loading) {
      this.requestPending = true;
      this.options.announce(state.loadingMoreLabel);
    } else if (state.loadMoreMode === 'manual') {
      // A completed manual request may append no rows; permit another explicit activation.
      this.requestPending = false;
    }
    this.disconnectObserver();
  }

  errorChanged(error: string | undefined): void {
    if (!this.options.state().lazyLoading) {
      this.resetRequest();
      return;
    }
    if (error?.trim()) {
      this.requestPending = false;
      this.options.announce(error);
    }
    this.disconnectObserver();
  }

  hasMoreChanged(hasMore: boolean, hadMore: boolean): void {
    if (!this.options.state().lazyLoading) {
      this.resetRequest();
      return;
    }
    if (!hasMore) {
      this.requestPending = false;
      if (hadMore) this.options.announce(this.options.state().endOfResultsLabel);
    }
    this.disconnectObserver();
  }

  request(reason: TableLoadMoreReason): void {
    const state = this.options.state();
    if (
      !state.lazyLoading ||
      !state.hasMore ||
      state.loadingMore ||
      (reason !== 'retry' && !!state.loadMoreError?.trim()) ||
      this.requestPending
    ) return;

    this.requestPending = true;
    this.requestedRowCount = state.loadedRowCount;
    this.options.announce(state.loadingMoreLabel);
    this.options.request({
      reason,
      loadIdentity: state.loadIdentity,
      loadedRowCount: this.requestedRowCount,
    });
  }

  private resetRequest(): void {
    this.requestPending = false;
    this.requestedRowCount = this.options.state().loadedRowCount;
    this.disconnectObserver();
  }

  private disconnectObserver(): void {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.observedSentinel = null;
  }
}
