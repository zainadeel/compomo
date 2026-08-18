import type {
  TableGroup,
  TableGroupLoadMoreDetail,
  TableLoadMoreMode,
  TableLoadMoreReason,
} from './table-types';

export interface TableGroupLoadControllerState {
  enabled: boolean;
  loadMoreMode: TableLoadMoreMode;
  loadMoreThreshold: number;
  containedScroll: boolean;
  groups: TableGroup[];
  viewport: HTMLElement | null;
  sentinels: ReadonlyMap<string, HTMLElement>;
  loadingMoreLabel: string;
  endOfResultsLabel: string;
  rowsLoadedLabel: string;
}

export interface TableGroupLoadControllerOptions {
  state: () => TableGroupLoadControllerState;
  announce: (message: string) => void;
  request: (detail: TableGroupLoadMoreDetail) => void;
}

interface GroupSnapshot {
  count: number;
  hasMore: boolean;
  loading: boolean;
  error: string;
  identity: string | number;
}

function groupIdentity(group: TableGroup): string | number {
  return group.loadIdentity ?? group.id;
}

function formatGroupLabel(template: string, group: TableGroup, count?: number): string {
  return template
    .split('{group}').join(group.label)
    .split('{count}').join(String(count ?? group.rows.length))
    .split('{loaded}').join(String(group.rows.length))
    .split('{total}').join(String(group.totalCount ?? group.rows.length));
}

/** Owns request guards, announcements, and observation for independently loaded groups. */
export class TableGroupLoadController {
  readonly intersectionSupported = typeof IntersectionObserver !== 'undefined';

  private connected = false;
  private intersectionObserver: IntersectionObserver | null = null;
  private snapshots = new Map<string, GroupSnapshot>();
  private pending = new Map<string, { identity: string | number; count: number }>();

  constructor(private readonly options: TableGroupLoadControllerOptions) {}

  initialize(): void {
    this.snapshots = this.createSnapshots();
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
      !state.enabled ||
      state.loadMoreMode !== 'auto' ||
      !this.intersectionSupported ||
      !state.viewport
    ) {
      this.disconnectObserver();
      return;
    }

    this.disconnectObserver();
    const threshold = Number.isFinite(state.loadMoreThreshold)
      ? Math.max(0, state.loadMoreThreshold)
      : 0;
    this.intersectionObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const groupId = (entry.target as HTMLElement).dataset.groupId;
          if (groupId) this.request(groupId, 'auto');
        }
      },
      {
        root: state.containedScroll ? state.viewport : null,
        rootMargin: `0px 0px ${threshold}px 0px`,
      },
    );

    for (const [groupId, sentinel] of state.sentinels) {
      const group = state.groups.find(item => item.id === groupId);
      if (!group?.hasMore || group.loadingMore || group.loadMoreError?.trim()) continue;
      this.intersectionObserver.observe(sentinel);
    }
  }

  structureChanged(): void {
    this.pending.clear();
    this.snapshots = this.createSnapshots();
    this.disconnectObserver();
  }

  dataChanged(): void {
    const state = this.options.state();
    const nextSnapshots = new Map<string, GroupSnapshot>();

    for (const group of state.groups) {
      const next = this.snapshot(group);
      const previous = this.snapshots.get(group.id);
      const pending = this.pending.get(group.id);

      if (!previous || previous.identity !== next.identity) {
        this.pending.delete(group.id);
      } else {
        if (next.count > previous.count) {
          this.options.announce(
            formatGroupLabel(state.rowsLoadedLabel, group, next.count - previous.count),
          );
        }
        if (!previous.error && next.error) {
          this.pending.delete(group.id);
          this.options.announce(next.error);
        }
        if (previous.hasMore && !next.hasMore) {
          this.pending.delete(group.id);
          this.options.announce(formatGroupLabel(state.endOfResultsLabel, group));
        }
        if (pending && next.count > pending.count) this.pending.delete(group.id);
        if (pending && previous.loading && !next.loading && next.count === pending.count) {
          this.pending.delete(group.id);
        }
      }

      nextSnapshots.set(group.id, next);
    }

    this.snapshots = nextSnapshots;
    for (const groupId of this.pending.keys()) {
      if (!nextSnapshots.has(groupId)) this.pending.delete(groupId);
    }
    this.disconnectObserver();
  }

  configurationChanged(): void {
    this.disconnectObserver();
  }

  request(groupId: string, reason: TableLoadMoreReason): void {
    const state = this.options.state();
    const group = state.groups.find(item => item.id === groupId);
    if (
      !state.enabled ||
      !group?.hasMore ||
      group.loadingMore ||
      (reason !== 'retry' && !!group.loadMoreError?.trim()) ||
      this.pending.has(groupId)
    ) return;

    const identity = groupIdentity(group);
    this.pending.set(groupId, { identity, count: group.rows.length });
    this.options.announce(formatGroupLabel(state.loadingMoreLabel, group));
    this.options.request({
      groupId,
      reason,
      loadIdentity: identity,
      loadedRowCount: group.rows.length,
    });
  }

  private createSnapshots(): Map<string, GroupSnapshot> {
    return new Map(this.options.state().groups.map(group => [group.id, this.snapshot(group)]));
  }

  private snapshot(group: TableGroup): GroupSnapshot {
    return {
      count: group.rows.length,
      hasMore: !!group.hasMore,
      loading: !!group.loadingMore,
      error: group.loadMoreError?.trim() ?? '',
      identity: groupIdentity(group),
    };
  }

  private disconnectObserver(): void {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
  }
}
