import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TableLoadController,
  type TableLoadControllerState,
} from '../src/wc/components/Table/table-load-controller';
import type { TableLoadMoreDetail } from '../src/wc/components/Table/table-types';

function state(): TableLoadControllerState {
  return {
    lazyLoading: true,
    loadMoreMode: 'manual',
    hasMore: true,
    loadingMore: false,
    loadMoreError: undefined,
    loadIdentity: 'drivers',
    loadMoreThreshold: 0,
    containedScroll: false,
    loadingMoreLabel: 'Loading more results',
    endOfResultsLabel: 'All results loaded',
    rowsLoadedLabel: '{count} more rows loaded. {total} rows loaded.',
    loadedRowCount: 2,
    viewport: null,
    sentinel: null,
  };
}

test('guards duplicate requests and reopens deliberate manual loading', () => {
  const current = state();
  const announcements: string[] = [];
  const requests: TableLoadMoreDetail[] = [];
  const controller = new TableLoadController({
    state: () => current,
    announce: message => announcements.push(message),
    request: detail => requests.push(detail),
  });
  controller.initialize();

  controller.request('manual');
  controller.request('manual');
  assert.deepEqual(requests, [
    {
      reason: 'manual',
      loadIdentity: 'drivers',
      loadedRowCount: 2,
    },
  ]);
  assert.deepEqual(announcements, ['Loading more results']);

  controller.loadingChanged(false);
  controller.request('manual');
  assert.equal(requests.length, 2);
});

test('announces appended rows, failures, and the terminal transition', () => {
  const current = state();
  const announcements: string[] = [];
  const controller = new TableLoadController({
    state: () => current,
    announce: message => announcements.push(message),
    request: () => undefined,
  });
  controller.initialize();

  current.loadedRowCount = 5;
  controller.dataChanged();
  controller.errorChanged('More rows failed.');
  current.hasMore = false;
  controller.hasMoreChanged(false, true);
  assert.deepEqual(announcements, [
    '3 more rows loaded. 5 rows loaded.',
    'More rows failed.',
    'All results loaded',
  ]);
});

test('does not announce global transitions while global loading is disabled', () => {
  const current = state();
  current.lazyLoading = false;
  const announcements: string[] = [];
  const controller = new TableLoadController({
    state: () => current,
    announce: message => announcements.push(message),
    request: () => undefined,
  });
  controller.initialize();

  current.loadedRowCount = 5;
  controller.dataChanged();
  controller.loadingChanged(true);
  controller.errorChanged('More rows failed.');
  controller.hasMoreChanged(false, true);

  assert.deepEqual(announcements, []);
});
