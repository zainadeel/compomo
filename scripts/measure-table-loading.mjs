/** Controller-only timings and observation counts for unchanged grouped renders. */
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const source = process.argv[2]
  ? pathToFileURL(resolve(process.argv[2]))
  : new URL('../src/wc/components/Table/table-group-load-controller.ts', import.meta.url);
const { TableGroupLoadController } = await import(source.href);
const operations = { observers: 0, observe: 0, unobserve: 0, disconnect: 0, identityReads: 0 };
const original = globalThis.IntersectionObserver;
globalThis.IntersectionObserver = class {
  constructor() {
    operations.observers++;
  }
  observe() {
    operations.observe++;
  }
  unobserve() {
    operations.unobserve++;
  }
  disconnect() {
    operations.disconnect++;
  }
};
try {
  const size = 1000;
  const groups = Array.from({ length: size }, (_, index) => ({
    id: String(index),
    label: `Group ${index}`,
    rows: [],
    hasMore: true,
  }));
  const state = {
    enabled: true,
    loadMoreMode: 'auto',
    loadMoreThreshold: 0,
    containedScroll: true,
    groups,
    viewport: {},
    sentinels: new Map(groups.map(group => [group.id, {}])),
    loadingMoreLabel: '',
    endOfResultsLabel: '',
    rowsLoadedLabel: '',
  };
  const controller = new TableGroupLoadController({
    state: () => state,
    announce() {},
    request() {},
  });
  controller.initialize();
  controller.connect();
  for (let i = 0; i < 10; i++) controller.refresh();
  for (const key of Object.keys(operations)) operations[key] = 0;
  const samples = [];
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    controller.refresh();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  const counted = { ...operations };
  // Count identity access in a separate untimed pass so getter instrumentation
  // does not inflate the CPU comparison against ordinary application records.
  for (const group of groups) {
    const id = group.id;
    Object.defineProperty(group, 'id', {
      get() {
        counted.identityReads++;
        return id;
      },
    });
  }
  for (let i = 0; i < samples.length; i++) controller.refresh();
  console.log(
    JSON.stringify(
      {
        revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
        source: source.pathname,
        node: process.version,
        cpu: os.cpus()[0]?.model,
        platform: process.platform,
        arch: process.arch,
        groups: size,
        refreshes: samples.length,
        medianMs: +samples[50].toFixed(3),
        p95Ms: +samples[95].toFixed(3),
        operations: counted,
        boundary:
          'Controller-only CPU with a counting IntersectionObserver stub; excludes browser observer/layout/render cost.',
      },
      null,
      2
    )
  );
  controller.disconnect();
} finally {
  globalThis.IntersectionObserver = original;
}
