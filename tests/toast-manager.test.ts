import assert from 'node:assert/strict';
import test from 'node:test';
import { createToastManager } from '../src/wc/toast';

test('toast manager adds newest-first records and upserts stable ids', () => {
  const manager = createToastManager();
  const first = manager.add({ id: 'first', title: 'First' });
  const second = manager.add({ id: 'second', description: 'Second' });

  assert.equal(first, 'first');
  assert.equal(second, 'second');
  assert.deepEqual(manager.getSnapshot().map(record => record.id), ['second', 'first']);
  assert.equal(manager.getSnapshot()[0].priority, 'low');
  assert.equal(manager.getSnapshot()[0].transitionStatus, 'starting');

  manager.activate('first');
  manager.add({ id: 'first', title: 'First updated', priority: 'high' });
  const [updated] = manager.getSnapshot();
  assert.equal(updated.id, 'first');
  assert.equal(updated.title, 'First updated');
  assert.equal(updated.priority, 'high');
  assert.equal(updated.transitionStatus, 'active');
  assert.equal(updated.updateKey, 1);
  const timerKey = updated.timerKey;
  manager.update('first', { description: 'Content-only update' });
  assert.equal(manager.getSnapshot()[0].timerKey, timerKey);
  manager.update('first', { timeout: 800 });
  assert.equal(manager.getSnapshot()[0].timerKey, timerKey + 1);
});

test('toast manager updates, closes, and removes exactly once', () => {
  const manager = createToastManager();
  const lifecycle: string[] = [];
  const snapshots: string[][] = [];
  const unsubscribe = manager.subscribe(records => {
    snapshots.push(records.map(record => `${record.id}:${record.transitionStatus}`));
  });

  manager.add({
    id: 'saved',
    title: 'Saved',
    onClose: context => lifecycle.push(`close:${context.reason}`),
    onRemove: context => lifecycle.push(`remove:${context.reason}`),
  });
  manager.activate('saved');
  manager.update('saved', { description: 'Available now' });
  manager.close('saved', 'close-button');
  manager.close('saved', 'timeout');

  assert.equal(manager.getSnapshot()[0].transitionStatus, 'ending');
  assert.equal(manager.getSnapshot()[0].description, 'Available now');
  assert.deepEqual(lifecycle, ['close:close-button']);

  const removal = manager.remove('saved');
  if (removal) manager.notifyRemove(removal);
  assert.equal(manager.remove('saved'), null);
  assert.deepEqual(lifecycle, ['close:close-button', 'remove:close-button']);
  assert.deepEqual(manager.getSnapshot(), []);
  assert.ok(snapshots.some(snapshot => snapshot.includes('saved:ending')));
  unsubscribe();
});

test('closeAll closes every active record', () => {
  const manager = createToastManager();
  manager.add({ id: 'one', title: 'One' });
  manager.add({ id: 'two', title: 'Two' });
  manager.closeAll();

  assert.deepEqual(
    manager.getSnapshot().map(record => record.transitionStatus),
    ['ending', 'ending'],
  );
});

test('promise keeps one id through loading and success', async () => {
  const manager = createToastManager();
  let resolvePromise!: (value: string) => void;
  const pending = new Promise<string>(resolve => {
    resolvePromise = resolve;
  });

  const resultPromise = manager.promise(pending, {
    loading: { title: 'Uploading' },
    success: value => ({
      title: 'Uploaded',
      description: value,
      timeout: 1200,
    }),
    error: 'Upload failed',
  });

  const loading = manager.getSnapshot()[0];
  assert.equal(loading.type, 'loading');
  assert.equal(loading.timeout, 0);

  resolvePromise('report.csv');
  assert.equal(await resultPromise, 'report.csv');
  const success = manager.getSnapshot()[0];
  assert.equal(success.id, loading.id);
  assert.equal(success.type, 'success');
  assert.equal(success.title, 'Uploaded');
  assert.equal(success.description, 'report.csv');
  assert.equal(success.timeout, 1200);
});

test('promise preserves rejection while updating the toast to error', async () => {
  const manager = createToastManager();
  const failure = new Error('offline');
  const resultPromise = manager.promise(Promise.reject(failure), {
    loading: 'Uploading',
    success: 'Uploaded',
    error: error => ({
      title: 'Upload failed',
      description: error instanceof Error ? error.message : 'Unknown error',
      timeout: 0,
    }),
  });

  await assert.rejects(resultPromise, failure);
  const errorToast = manager.getSnapshot()[0];
  assert.equal(errorToast.type, 'error');
  assert.equal(errorToast.title, 'Upload failed');
  assert.equal(errorToast.description, 'offline');
});
