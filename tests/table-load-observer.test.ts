import assert from 'node:assert/strict';
import test from 'node:test';
import { TableLoadObserver } from '../src/wc/components/Table/table-load-observer';
import { installIntersectionObserver } from './helpers/intersection-observer';

test('reuses unchanged sentinels and releases removed targets', context => {
  const instances = installIntersectionObserver(context);
  const received: string[] = [];
  const owner = new TableLoadObserver(id => received.push(id));
  const first = {} as HTMLElement;
  const second = {} as HTMLElement;
  owner.refresh(
    new Map([
      [first, 'a'],
      [second, 'b'],
    ]),
    null,
    NaN
  );
  owner.refresh(
    new Map([
      [first, 'a'],
      [second, 'b'],
    ]),
    null,
    -10
  );
  assert.equal(instances.length, 1);
  assert.equal(instances[0].observeCalls.length, 2);
  owner.refresh(new Map([[second, 'b']]), null, 0);
  assert.deepEqual(instances[0].unobserveCalls, [first]);
  instances[0].deliver(first, second);
  assert.deepEqual(received, ['b']);
  owner.disconnect();
  instances[0].deliver(second);
  assert.deepEqual(received, ['b']);
});

test('replaces changed roots, margins, and recycled target identities without stale delivery', context => {
  const instances = installIntersectionObserver(context);
  const received: string[] = [];
  const owner = new TableLoadObserver(id => received.push(id));
  const target = {} as HTMLElement;
  const root = {} as HTMLElement;
  owner.refresh(new Map([[target, 'old']]), null, 0);
  owner.refresh(new Map([[target, 'old']]), root, 40);
  owner.refresh(new Map([[target, 'current']]), root, 40);
  assert.equal(instances.length, 3);
  instances[0].deliver(target);
  instances[1].deliver(target);
  assert.deepEqual(received, []);
  instances[2].deliver(target);
  assert.deepEqual(received, ['current']);
  assert.deepEqual(instances[2].options, { root, rootMargin: '0px 0px 40px 0px' });
});

test('stops a delivered batch when its first request invalidates the connection', context => {
  const instances = installIntersectionObserver(context);
  const received: string[] = [];
  const owner = new TableLoadObserver(id => {
    received.push(id);
    owner.disconnect();
  });
  const first = {} as HTMLElement;
  const second = {} as HTMLElement;
  owner.refresh(
    new Map([
      [first, 'a'],
      [second, 'b'],
    ]),
    null,
    0
  );
  instances[0].deliver(first, second);
  assert.deepEqual(received, ['a']);
});
