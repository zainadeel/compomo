import assert from 'node:assert/strict';
import test from 'node:test';
import { ScrollOverlayController } from '../src/wc/utils/scroll-overlay-controller';

test('reconnecting a scroll controller releases old observers and ignores stale deliveries', () => {
  const originalObserver = globalThis.ResizeObserver;
  const observers: { callback: ResizeObserverCallback; disconnected: boolean }[] = [];
  globalThis.ResizeObserver = class {
    readonly record: (typeof observers)[number];
    constructor(callback: ResizeObserverCallback) {
      this.record = { callback, disconnected: false };
      observers.push(this.record);
    }
    observe() {}
    unobserve() {}
    disconnect() {
      this.record.disconnected = true;
    }
  };
  try {
    let measurements = 0;
    const element = {
      isConnected: true,
      scrollTop: 0,
      clientHeight: 200,
      style: { setProperty() {} },
      querySelector: () => null,
      getBoundingClientRect: () => ({ height: 0 }),
    } as unknown as HTMLElement;
    const controller = new ScrollOverlayController({
      host: element,
      viewport: element,
      content: element,
      overlay: element,
      onGeometryChange: () => measurements++,
    });
    controller.connect();
    controller.connect();
    assert.equal(observers[0].disconnected, true);
    observers[0].callback([], {} as ResizeObserver);
    assert.equal(measurements, 0);
    observers[1].callback([], {} as ResizeObserver);
    assert.equal(measurements, 1);
    controller.disconnect();
    assert.equal(observers[1].disconnected, true);
    observers[1].callback([], {} as ResizeObserver);
    assert.equal(measurements, 1);
    controller.connect();
    observers[2].callback([], {} as ResizeObserver);
    assert.equal(measurements, 2);
    controller.disconnect();
  } finally {
    globalThis.ResizeObserver = originalObserver;
  }
});
