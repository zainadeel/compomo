import assert from 'node:assert/strict';
import test from 'node:test';
import { createToastManager } from '../src/wc/toast';

test('toast manager adds newest-first records and upserts stable ids', () => {
  const manager = createToastManager();
  const first = manager.add({ id: 'first', title: 'First' });
  const second = manager.add({ id: 'second', description: 'Second' });

  assert.equal(first, 'first');
  assert.equal(second, 'second');
  assert.deepEqual(
    manager.getSnapshot().map(record => record.id),
    ['second', 'first']
  );
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
    ['ending', 'ending']
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test('automatic ids never overwrite an explicitly named toast', () => {
  const manager = createToastManager();
  manager.add({ id: 'ds-toast-1', title: 'Application-owned' });
  const id = manager.add({ title: 'Automatic' });
  assert.notEqual(id, 'ds-toast-1');
  assert.equal(manager.getSnapshot().length, 2);
  assert.equal(
    manager.getSnapshot().find(record => record.id === 'ds-toast-1')?.title,
    'Application-owned'
  );
});

test('only the current promise may settle a reused toast id', async () => {
  const manager = createToastManager();
  const first = deferred<string>();
  const second = deferred<string>();
  let obsoleteMappings = 0;
  const oldResult = manager.promise(first.promise, {
    loading: { id: 'upload', title: 'First' },
    success: () => {
      obsoleteMappings++;
      return 'Obsolete';
    },
    error: 'Failed',
  });
  const currentResult = manager.promise(second.promise, {
    loading: { id: 'upload', title: 'Second' },
    success: { title: 'Current' },
    error: 'Failed',
  });
  first.resolve('old value');
  assert.equal(await oldResult, 'old value');
  assert.equal(obsoleteMappings, 0);
  assert.equal(manager.getSnapshot()[0].title, 'Second');
  second.resolve('new value');
  assert.equal(await currentResult, 'new value');
  assert.equal(manager.getSnapshot()[0].title, 'Current');
});

test('explicit changes and dismissal revoke promise presentation without swallowing its outcome', async () => {
  for (const change of ['update', 'replace', 'dismiss', 'remove'] as const) {
    const manager = createToastManager();
    const pending = deferred<string>();
    const result = manager.promise(pending.promise, {
      loading: { id: 'work', title: 'Loading' },
      success: 'Done',
      error: 'Failed',
    });
    if (change === 'update') manager.update('work', { title: 'User update' });
    else if (change === 'replace') manager.add({ id: 'work', title: 'Replacement' });
    else {
      manager.close('work');
      if (change === 'remove') manager.remove('work');
    }
    const snapshot = manager.getSnapshot();
    const failure = new Error('original rejection');
    pending.reject(failure);
    await assert.rejects(result, failure);
    assert.deepEqual(manager.getSnapshot(), snapshot);
  }
});

test('promise ownership survives activation but yields to mutations during subscriber and mapper callbacks', async () => {
  const manager = createToastManager();
  const unsubscribe = manager.subscribe(records => {
    if (records[0]?.type === 'loading') manager.close(records[0].id);
  });
  await manager.promise(Promise.resolve('done'), {
    loading: 'Loading',
    success: 'Done',
    error: 'Failed',
  });
  assert.equal(manager.getSnapshot()[0].transitionStatus, 'ending');
  assert.equal(manager.getSnapshot()[0].description, 'Loading');
  unsubscribe();

  const pending = deferred<string>();
  const result = manager.promise(pending.promise, {
    loading: { id: 'active', title: 'Loading' },
    success: () => {
      manager.add({ id: 'active', title: 'New work' });
      return 'Obsolete result';
    },
    error: 'Failed',
  });
  manager.activate('active');
  pending.resolve('done');
  await result;
  assert.equal(manager.getSnapshot()[0].title, 'New work');
  assert.equal(manager.getSnapshot()[0].description, undefined);
});

test('reentrant mutations reach subscribers in order and new subscriptions are delivered once', () => {
  const manager = createToastManager();
  const seen: string[] = [];
  let adjusted = false;
  manager.subscribe(records => {
    if (!records.length || adjusted) return;
    adjusted = true;
    manager.update('work', { title: 'Updated' });
  });
  manager.subscribe(records => {
    if (records.length) seen.push(records[0].title!);
  });
  manager.add({ id: 'work', title: 'Original' });
  assert.deepEqual(seen, ['Original', 'Updated']);

  const added: string[] = [];
  let subscribed = false;
  manager.subscribe(records => {
    if (subscribed || records[0]?.title !== 'Again') return;
    subscribed = true;
    manager.subscribe(next => added.push(next[0].title!));
  });
  manager.update('work', { title: 'Again' });
  assert.deepEqual(added, ['Again']);
});
