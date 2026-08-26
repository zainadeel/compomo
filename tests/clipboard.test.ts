import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ClipboardFeedbackController,
  type ClipboardFeedbackScheduler,
  writeClipboardText,
} from '../src/wc/utils/clipboard';

function deferredWrite() {
  let resolve!: () => void;
  const promise = new Promise<void>(next => {
    resolve = next;
  });
  return {
    resolve,
    writer: { writeText: () => promise },
  };
}

describe('writeClipboardText', () => {
  it('writes non-empty text through the supplied browser clipboard', async () => {
    const writes: string[] = [];
    const result = await writeClipboardText('Message content', {
      writeText: text => {
        writes.push(text);
        return Promise.resolve();
      },
    });

    assert.equal(result, true);
    assert.deepEqual(writes, ['Message content']);
  });

  it('reports unavailable, empty, and rejected writes without throwing', async () => {
    assert.equal(await writeClipboardText('Message content', undefined), false);
    assert.equal(await writeClipboardText('', { writeText: () => Promise.resolve() }), false);
    assert.equal(
      await writeClipboardText('Message content', {
        writeText: () => Promise.reject(new Error('Clipboard denied')),
      }),
      false
    );
  });
});

describe('ClipboardFeedbackController', () => {
  it('owns copied feedback and clears its scheduled reset on disconnect', async () => {
    const changes: boolean[] = [];
    const cleared: unknown[] = [];
    let scheduled: (() => void) | undefined;
    const timerHandle = Symbol('copied timer');
    const scheduler: ClipboardFeedbackScheduler = {
      setTimeout: callback => {
        scheduled = callback;
        return timerHandle;
      },
      clearTimeout: handle => {
        cleared.push(handle);
      },
    };
    const controller = new ClipboardFeedbackController(
      copied => changes.push(copied),
      2000,
      scheduler
    );

    controller.connect();
    assert.equal(
      await controller.copy('Message content', {
        writeText: () => Promise.resolve(),
      }),
      true
    );
    assert.deepEqual(changes, [true]);

    controller.disconnect();
    assert.deepEqual(changes, [true, false]);
    assert.deepEqual(cleared, [timerHandle]);

    scheduled?.();
    assert.deepEqual(changes, [true, false]);
  });

  it('ignores a clipboard result that resolves after disconnect', async () => {
    const changes: boolean[] = [];
    const pendingWrite = deferredWrite();
    const controller = new ClipboardFeedbackController(copied => changes.push(copied));

    controller.connect();
    const result = controller.copy('Message content', pendingWrite.writer);
    controller.disconnect();
    pendingWrite.resolve();

    assert.equal(await result, undefined);
    assert.deepEqual(changes, []);
  });

  it('ignores stale content and older overlapping clipboard requests', async () => {
    const changes: boolean[] = [];
    const staleWrite = deferredWrite();
    const latestWrite = deferredWrite();
    const controller = new ClipboardFeedbackController(copied => changes.push(copied));

    controller.connect();
    const staleResult = controller.copy('Old content', staleWrite.writer);
    controller.reset();
    staleWrite.resolve();
    assert.equal(await staleResult, undefined);

    const olderResult = controller.copy('Older request', staleWrite.writer);
    const latestResult = controller.copy('Latest request', latestWrite.writer);
    latestWrite.resolve();
    assert.equal(await latestResult, true);
    staleWrite.resolve();
    assert.equal(await olderResult, undefined);
    assert.deepEqual(changes, [true]);

    controller.disconnect();
  });
});
