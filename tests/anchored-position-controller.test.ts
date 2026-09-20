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
    const element = { isConnected: true } as HTMLElement;
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

test('old positioning frames and observer deliveries cannot run in a new connection', () => {
  const originals = {
    window: globalThis.window,
    ResizeObserver: globalThis.ResizeObserver,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  const frames: FrameRequestCallback[] = [];
  let measurements = 0;
  let ready = 0;
  Object.assign(globalThis, {
    window: { addEventListener() {}, removeEventListener() {} },
    ResizeObserver: TestResizeObserver,
    requestAnimationFrame: (callback: FrameRequestCallback) => frames.push(callback),
    // Simulate work already delivered by the browser before cancellation.
    cancelAnimationFrame() {},
  });
  try {
    const element = { isConnected: true } as HTMLElement;
    const controller = new AnchoredPositionController({
      getAnchor: () => element,
      getPopup: () => element,
      observeResize: true,
      liveUpdate: 'double-frame',
      measure: () => {
        measurements++;
        return {
          anchorRect: { x: 0, y: 0, top: 0, right: 20, bottom: 20, left: 0, width: 20, height: 20 },
          popupWidth: 100,
          popupHeight: 100,
          side: 'bottom',
          align: 'start',
          sideOffsetPx: 4,
          alignOffsetPx: 0,
          viewportPadPx: 4,
          viewportWidth: 800,
          viewportHeight: 600,
        };
      },
      apply() {},
    });
    controller.observe();
    const oldObserver = TestResizeObserver.callback!;
    controller.schedule(() => ready++);
    controller.scheduleLiveUpdate();
    const oldFrames = frames.splice(0);
    controller.unobserve();
    controller.observe();
    oldObserver([], {} as ResizeObserver);
    oldFrames.forEach(callback => callback(0));
    assert.equal(measurements, 0);
    assert.equal(ready, 0);
    assert.equal(frames.length, 0);
    controller.schedule(() => ready++);
    frames.splice(0).forEach(callback => callback(0));
    assert.equal(measurements, 1);
    assert.equal(ready, 1);
    Object.assign(element, { isConnected: false });
    assert.equal(controller.update(), false);
    assert.equal(measurements, 1);
    controller.unobserve();
  } finally {
    Object.assign(globalThis, originals);
  }
});
