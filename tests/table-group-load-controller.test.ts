import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TableGroupLoadController,
  type TableGroupLoadControllerState,
} from '../src/wc/components/Table/table-group-load-controller';
import type { TableGroupLoadMoreDetail } from '../src/wc/components/Table/table-types';

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
  assert.deepEqual(announcements, [
    'Loading more Critical results',
    'Loading more High results',
  ]);
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
