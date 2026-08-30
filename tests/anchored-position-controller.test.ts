import assert from 'node:assert/strict';
import test from 'node:test';
import { AnchoredPositionController } from '../src/wc/utils/anchored-position-controller';

class TestResizeObserver {
  static callback: ResizeObserverCallback | undefined;

  constructor(callback: ResizeObserverCallback) {
    TestResizeObserver.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}

  static emit(): void {
    TestResizeObserver.callback?.([], {} as ResizeObserver);
  }
}

test('defers observer-driven popup positioning through the configured live scheduler', () => {
  const originalWindow = globalThis.window;
  const originalResizeObserver = globalThis.ResizeObserver;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
  const frames: FrameRequestCallback[] = [];
  let measurementCount = 0;

  Object.assign(globalThis, {
    window: {
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
    ResizeObserver: TestResizeObserver,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    },
    cancelAnimationFrame: () => undefined,
  });

  try {
    const element = {} as HTMLElement;
    const controller = new AnchoredPositionController({
      getAnchor: () => element,
      getPopup: () => element,
      measure: () => {
        measurementCount += 1;
        return null;
      },
      apply: () => undefined,
      liveUpdate: 'frame',
      observeResize: true,
    });

    controller.observe();
    TestResizeObserver.emit();

    assert.equal(measurementCount, 0);
    assert.equal(frames.length, 1);

    frames.splice(0).forEach(callback => callback(0));
    assert.equal(measurementCount, 1);
    controller.unobserve();
  } finally {
    Object.assign(globalThis, {
      window: originalWindow,
      ResizeObserver: originalResizeObserver,
      requestAnimationFrame: originalRequestAnimationFrame,
      cancelAnimationFrame: originalCancelAnimationFrame,
    });
  }
});
