import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveTableViewportFitMetrics,
  TableViewportFitController,
} from '../src/wc/components/Table/table-viewport-fit-controller';

test('reserves compact-state height while exposing only the currently visible height', () => {
  assert.deepEqual(
    resolveTableViewportFitMetrics({
      scrollportBlockStart: 48,
      scrollportBlockSize: 672,
      hostBlockStart: 200,
      insetBlockStart: 80,
      insetBlockEnd: 32,
    }),
    {
      reservedBlockSize: 560,
      currentBlockSize: 488,
      settled: false,
    }
  );
});

test('fills the reserved height after surrounding page chrome has compacted', () => {
  assert.deepEqual(
    resolveTableViewportFitMetrics({
      scrollportBlockStart: 48,
      scrollportBlockSize: 672,
      hostBlockStart: 128,
      insetBlockStart: 80,
      insetBlockEnd: 32,
    }),
    {
      reservedBlockSize: 560,
      currentBlockSize: 560,
      settled: true,
    }
  );
});

test('clamps impossible inset geometry without producing negative sizes', () => {
  assert.deepEqual(
    resolveTableViewportFitMetrics({
      scrollportBlockStart: 0,
      scrollportBlockSize: 120,
      hostBlockStart: 200,
      insetBlockStart: 80,
      insetBlockEnd: 80,
    }),
    {
      reservedBlockSize: 0,
      currentBlockSize: 0,
      settled: false,
    }
  );
});

test('does not rediscover or remeasure stable fit geometry after a recycled render', () => {
  const globals = ['window', 'document', 'HTMLElement'] as const;
  const previous = new Map(
    globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
  );
  let hostRectReads = 0;
  const windowMock = {
    innerHeight: 900,
    scrollY: 0,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    scrollTo: () => undefined,
  };
  const documentElement = { scrollHeight: 900 };
  Object.defineProperties(globalThis, {
    HTMLElement: { configurable: true, value: class HTMLElementMock {} },
    window: { configurable: true, value: windowMock },
    document: {
      configurable: true,
      value: { documentElement, scrollingElement: documentElement },
    },
  });

  const properties = new Map<string, string>();
  const host = {
    parentElement: null,
    getBoundingClientRect: () => {
      hostRectReads += 1;
      return { top: 120, height: 600 };
    },
    style: {
      getPropertyValue: (name: string) => properties.get(name) ?? '',
      setProperty: (name: string, value: string) => properties.set(name, value),
      removeProperty: (name: string) => properties.delete(name),
    },
  } as unknown as HTMLElement;
  const surface = {
    style: host.style,
  } as unknown as HTMLElement;
  const controller = new TableViewportFitController({
    enabled: () => true,
    elements: () => ({ host, surface }),
    insets: () => ({ blockStart: 0, blockEnd: 0 }),
    fitChanged: () => undefined,
  });

  try {
    controller.connect();
    assert.equal(hostRectReads, 1);
    hostRectReads = 0;
    controller.refresh(false);
    assert.equal(hostRectReads, 0);
    controller.disconnect();
  } finally {
    for (const name of globals) {
      const descriptor = previous.get(name);
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});

test('reserves host geometry before the fitted surface is rendered', () => {
  const globals = ['window', 'document', 'HTMLElement'] as const;
  const previous = new Map(
    globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
  );
  const windowMock = {
    innerHeight: 900,
    scrollY: 0,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    scrollTo: () => undefined,
  };
  const documentElement = { scrollHeight: 900 };
  Object.defineProperties(globalThis, {
    HTMLElement: { configurable: true, value: class HTMLElementMock {} },
    window: { configurable: true, value: windowMock },
    document: {
      configurable: true,
      value: { documentElement, scrollingElement: documentElement },
    },
  });

  const hostProperties = new Map<string, string>();
  const surfaceProperties = new Map<string, string>();
  const host = {
    parentElement: null,
    getBoundingClientRect: () => ({ top: 120, height: 0 }),
    style: {
      getPropertyValue: (name: string) => hostProperties.get(name) ?? '',
      setProperty: (name: string, value: string) => hostProperties.set(name, value),
      removeProperty: (name: string) => hostProperties.delete(name),
    },
  } as unknown as HTMLElement;
  const surface = {
    style: {
      getPropertyValue: (name: string) => surfaceProperties.get(name) ?? '',
      setProperty: (name: string, value: string) => surfaceProperties.set(name, value),
      removeProperty: (name: string) => surfaceProperties.delete(name),
    },
  } as unknown as HTMLElement;
  let renderedSurface: HTMLElement | null = null;
  const controller = new TableViewportFitController({
    enabled: () => true,
    elements: () => ({ host, surface: renderedSurface }),
    insets: () => ({ blockStart: 100, blockEnd: 50 }),
    fitChanged: () => undefined,
  });

  try {
    controller.connect();
    assert.equal(hostProperties.get('--_table-viewport-fit-reserved-block-size'), '750px');
    assert.equal(surfaceProperties.size, 0);

    renderedSurface = surface;
    controller.refresh();
    assert.equal(surfaceProperties.get('--_table-viewport-fit-current-block-size'), '730px');
    controller.disconnect();
  } finally {
    for (const name of globals) {
      const descriptor = previous.get(name);
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
