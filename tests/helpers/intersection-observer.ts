import type { TestContext } from 'node:test';

export class MockIntersectionObserver {
  readonly observed = new Set<Element>();
  readonly observeCalls: Element[] = [];
  readonly unobserveCalls: Element[] = [];
  disconnected = false;

  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit
  ) {}
  observe(target: Element): void {
    this.observed.add(target);
    this.observeCalls.push(target);
  }
  unobserve(target: Element): void {
    this.observed.delete(target);
    this.unobserveCalls.push(target);
  }
  disconnect(): void {
    this.disconnected = true;
    this.observed.clear();
  }
  deliver(...targets: Element[]): void {
    // Deliberately deliver even after disconnect to model an already queued callback.
    this.callback(
      targets.map(target => ({ target, isIntersecting: true }) as IntersectionObserverEntry),
      this as unknown as IntersectionObserver
    );
  }
}

export function installIntersectionObserver(context: TestContext): MockIntersectionObserver[] {
  const original = globalThis.IntersectionObserver;
  const instances: MockIntersectionObserver[] = [];
  Object.assign(globalThis, {
    IntersectionObserver: class extends MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options);
        instances.push(this);
      }
    },
  });
  context.after(() => Object.assign(globalThis, { IntersectionObserver: original }));
  return instances;
}
