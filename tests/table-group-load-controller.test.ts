import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TableGroupLoadController,
  type TableGroupLoadControllerState,
} from '../src/wc/components/Table/table-group-load-controller';
import type { TableGroupLoadMoreDetail } from '../src/wc/components/Table/table-types';
import { installIntersectionObserver } from './helpers/intersection-observer';

function state(): TableGroupLoadControllerState {
  return {
    enabled: true,
    loadMoreMode: 'manual',
    loadMoreThreshold: 0,
    containedScroll: false,
    groups: [
      {
        id: 'critical',
        label: 'Critical',
        rows: [{ id: 'critical-1', cells: {} }],
        totalCount: 3,
        hasMore: true,
        loadingMore: false,
        loadIdentity: 'severity:critical',
      },
      {
        id: 'high',
        label: 'High',
        rows: [{ id: 'high-1', cells: {} }],
        totalCount: 2,
        hasMore: true,
        loadingMore: false,
      },
    ],
    viewport: null,
    sentinels: new Map(),
    loadingMoreLabel: 'Loading more {group} results',
    endOfResultsLabel: 'All {group} results loaded',
    rowsLoadedLabel: '{count} more rows loaded in {group}. {loaded} of {total} rows loaded.',
  };
}

test('emits independently guarded requests with the group identity', () => {
  const current = state();
  const announcements: string[] = [];
  const requests: TableGroupLoadMoreDetail[] = [];
  const controller = new TableGroupLoadController({
    state: () => current,
    announce: message => announcements.push(message),
    request: detail => requests.push(detail),
  });
  controller.initialize();

  controller.request('critical', 'manual');
  controller.request('critical', 'manual');
  controller.request('high', 'manual');

  assert.deepEqual(requests, [
    {
      groupId: 'critical',
      reason: 'manual',
      loadIdentity: 'severity:critical',
      loadedRowCount: 1,
    },
    {
      groupId: 'high',
      reason: 'manual',
      loadIdentity: 'high',
      loadedRowCount: 1,
    },
  ]);
  assert.deepEqual(announcements, ['Loading more Critical results', 'Loading more High results']);
});

test('announces rows and terminal state only for the group that changed', () => {
  const current = state();
  const announcements: string[] = [];
  const controller = new TableGroupLoadController({
    state: () => current,
    announce: message => announcements.push(message),
    request: () => undefined,
  });
  controller.initialize();

  const critical = current.groups[0]!;
  critical.rows = [
    ...critical.rows,
    { id: 'critical-2', cells: {} },
    { id: 'critical-3', cells: {} },
  ];
  critical.hasMore = false;
  controller.dataChanged();

  assert.deepEqual(announcements, [
    '2 more rows loaded in Critical. 3 of 3 rows loaded.',
    'All Critical results loaded',
  ]);
});

test('permits retry after a controlled group failure', () => {
  const current = state();
  const announcements: string[] = [];
  const requests: TableGroupLoadMoreDetail[] = [];
  const controller = new TableGroupLoadController({
    state: () => current,
    announce: message => announcements.push(message),
    request: detail => requests.push(detail),
  });
  controller.initialize();
  controller.request('critical', 'manual');

  current.groups[0] = {
    ...current.groups[0]!,
    loadMoreError: 'Critical events could not be loaded.',
  };
  controller.dataChanged();
  controller.request('critical', 'retry');

  assert.equal(requests.length, 2);
  assert.deepEqual(announcements, [
    'Loading more Critical results',
    'Critical events could not be loaded.',
    'Loading more Critical results',
  ]);
});

test('empty automatic pages remain guarded while explicit manual loading can retry', () => {
  for (const mode of ['auto', 'manual'] as const) {
    const current = { ...state(), loadMoreMode: mode };
    const requests: TableGroupLoadMoreDetail[] = [];
    const controller = new TableGroupLoadController({
      state: () => current,
      announce() {},
      request: detail => requests.push(detail),
    });
    controller.initialize();
    controller.connect();
    controller.request('critical', mode);
    current.groups[0].loadingMore = true;
    controller.dataChanged();
    current.groups[0].loadingMore = false;
    controller.dataChanged();
    controller.request('critical', mode);
    assert.equal(requests.length, mode === 'manual' ? 2 : 1);
    current.groups[0].rows.push({ id: 'new', cells: {} });
    controller.dataChanged();
    controller.request('critical', mode);
    assert.equal(requests.length, mode === 'manual' ? 3 : 2);
  }
});

test('reconciles large group snapshots in linear work without reobserving unchanged sentinels', context => {
  const observers = installIntersectionObserver(context);
  const current = state();
  current.loadMoreMode = 'auto';
  current.viewport = {} as HTMLElement;
  let identityReads = 0;
  const size = 1000;
  current.groups = Array.from({ length: size }, (_, index) => ({
    get id() {
      identityReads++;
      return String(index);
    },
    label: String(index),
    rows: [],
    hasMore: true,
  }));
  current.sentinels = new Map(current.groups.map(group => [group.id, {} as HTMLElement]));
  const requests: TableGroupLoadMoreDetail[] = [];
  const controller = new TableGroupLoadController({
    state: () => current,
    announce() {},
    request: detail => requests.push(detail),
  });
  controller.initialize();
  identityReads = 0;
  controller.connect();
  controller.refresh();
  assert.ok(identityReads <= size * 4, `Expected linear identity reads, got ${identityReads}`);
  assert.equal(observers.length, 1);
  assert.equal(observers[0].observeCalls.length, size);
  const sentinel = current.sentinels.get('0')!;
  controller.disconnect();
  controller.connect();
  observers[0].deliver(sentinel);
  assert.equal(requests.length, 0);
  observers[1].deliver(sentinel);
  assert.equal(requests[0].groupId, '0');
});
