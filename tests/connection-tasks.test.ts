import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConnectionTasks } from '../src/wc/utils/connection-tasks';

test('connection tasks cancel queued frames and invalidate old microtasks and promise callbacks', async () => {
  const originalFrame = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  const frames: FrameRequestCallback[] = [];
  const canceled: number[] = [];
  globalThis.requestAnimationFrame = callback => frames.push(callback);
  globalThis.cancelAnimationFrame = frame => canceled.push(frame);
  try {
    let connected = true;
    const tasks = new ConnectionTasks(() => connected);
    const calls: string[] = [];
    tasks.frame(() => calls.push('old frame'));
    tasks.microtask(() => calls.push('old microtask'));
    const oldPromiseCallback = tasks.guard(() => calls.push('old promise'));
    connected = false;
    tasks.cancel();
    connected = true;
    tasks.frame(() => calls.push('new frame'));
    tasks.microtask(() => calls.push('new microtask'));
    oldPromiseCallback();
    // Even a frame already handed off by the browser belongs to the old connection.
    frames.forEach(callback => callback(0));
    await Promise.resolve();
    assert.deepEqual(canceled, [1]);
    assert.deepEqual(calls, ['new frame', 'new microtask']);
    tasks.cancel();
    assert.deepEqual(canceled, [1]);
  } finally {
    globalThis.requestAnimationFrame = originalFrame;
    globalThis.cancelAnimationFrame = originalCancel;
  }
});

test('connection tasks do not schedule DOM work while detached', async () => {
  let connected = false;
  const tasks = new ConnectionTasks(() => connected);
  let calls = 0;
  assert.equal(
    tasks.frame(() => calls++),
    undefined
  );
  tasks.microtask(() => calls++);
  const callback = tasks.guard(() => calls++);
  callback();
  connected = true;
  await Promise.resolve();
  assert.equal(calls, 0);
  tasks.microtask(() => calls++);
  await Promise.resolve();
  assert.equal(calls, 1);
});

test('canceling one connection frame retains unrelated scheduled work', () => {
  const originalFrame = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  const frames = new Map<number, FrameRequestCallback>();
  let next = 0;
  globalThis.requestAnimationFrame = callback => {
    frames.set(++next, callback);
    return next;
  };
  globalThis.cancelAnimationFrame = frame => {
    frames.delete(frame);
  };
  try {
    const tasks = new ConnectionTasks(() => true);
    const calls: string[] = [];
    const canceled = tasks.frame(() => calls.push('canceled'));
    tasks.frame(() => calls.push('retained'));
    tasks.cancelFrame(canceled);
    for (const callback of frames.values()) callback(0);
    assert.deepEqual(calls, ['retained']);
  } finally {
    globalThis.requestAnimationFrame = originalFrame;
    globalThis.cancelAnimationFrame = originalCancel;
  }
});
