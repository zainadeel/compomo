import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ChromeTransitionDepth,
  ChromeTransitionGate,
  createRafCoalescer,
  readChromeTransitionSource,
  readChromeTransitionPhase,
} from '../src/wc/shell/chrome-transition';

describe('ChromeTransitionDepth', () => {
  it('tracks nested enter/exit', () => {
    const gate = new ChromeTransitionDepth();
    assert.equal(gate.isActive, false);
    gate.enter();
    assert.equal(gate.isActive, true);
    gate.enter();
    gate.exit();
    assert.equal(gate.isActive, true);
    gate.exit();
    assert.equal(gate.isActive, false);
    gate.exit();
    assert.equal(gate.isActive, false);
  });
});

describe('ChromeTransitionGate', () => {
  it('a duplicate start is released by one matching end', () => {
    const gate = new ChromeTransitionGate();
    gate.enter();
    gate.enter();
    assert.equal(gate.isActive, true);
    gate.exit();
    assert.equal(gate.isActive, false);
  });
});

describe('readChromeTransitionSource', () => {
  it('reads detail source from a custom event', () => {
    const event = new CustomEvent('dsChromeTransitionStart', {
      detail: { source: 'panel-tools' },
    });
    assert.equal(readChromeTransitionSource(event), 'panel-tools');
  });
});

describe('readChromeTransitionPhase', () => {
  it('reads panel-tools motion phase when present', () => {
    const event = new CustomEvent('dsChromeTransitionStart', {
      detail: { source: 'panel-tools', phase: 'closing' },
    });
    assert.equal(readChromeTransitionPhase(event), 'closing');
  });
});

describe('createRafCoalescer', () => {
  it('schedules at most one callback until it runs', async () => {
    const originalRaf = globalThis.requestAnimationFrame;
    const originalCancel = globalThis.cancelAnimationFrame;
    const queue: Array<() => void> = [];
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      queue.push(() => cb(0));
      return queue.length;
    };
    globalThis.cancelAnimationFrame = () => {
      queue.length = 0;
    };

    try {
      let runs = 0;
      const coalescer = createRafCoalescer(() => {
        runs += 1;
      });

      coalescer.schedule();
      coalescer.schedule();
      assert.equal(queue.length, 1);
      queue.shift()?.();
      assert.equal(runs, 1);

      coalescer.schedule();
      queue.shift()?.();
      assert.equal(runs, 2);
    } finally {
      globalThis.requestAnimationFrame = originalRaf;
      globalThis.cancelAnimationFrame = originalCancel;
    }
  });
});
