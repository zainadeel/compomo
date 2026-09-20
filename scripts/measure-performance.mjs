import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { createTableRenderModel } from '../src/wc/components/Table/table-render-model.ts';
import { compileChartScene } from '../src/wc/utils/chart-scene.ts';
import { defineChart, lineY } from '../src/wc/utils/chart-grammar.ts';
import { formatPercentage } from '../src/wc/utils/format-percentage.ts';
import { scaleLinear } from 'd3-scale';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown } from 'mdast-util-gfm';

const rows = Array.from({ length: 10000 }, (_, i) => ({
  id: `row-${i}`,
  cells: { name: `Row ${i}` },
}));
const table = {
  columns: [{ id: 'name', label: 'Name' }],
  rows: [],
  groups: Array.from({ length: 100 }, (_, i) => ({
    id: `g${i}`,
    label: `Group ${i}`,
    rows: rows.slice(i * 100, i * 100 + 100),
  })),
  grouped: true,
  selectionMode: 'multiple',
  selectedRowIds: rows.map(r => r.id),
  collapsedGroupIds: [],
};
const definition = defineChart({
  marks: [
    lineY(
      Array.from({ length: 1000 }, (_, i) => ({ id: i, x: i, y: Math.sin(i / 10) * 20 + 50 })),
      { id: 'trend', key: 'id', x: 'x', y: 'y' }
    ),
  ],
  x: { scale: scaleLinear },
  y: { scale: scaleLinear },
  focus: 'nearest-x',
});
const markdown =
  '# Fleet update\n\nA **status** with [details](https://example.com).\n\n- Ready\n- Pending\n\n| Fleet | Count |\n| --- | --- |\n| West | 42 |\n\n';
const parse = text =>
  fromMarkdown(text, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
const results = [];
function measure(name, run, iterations = 20) {
  for (let i = 0; i < 3; i++) run();
  const samples = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    run();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  results.push({
    name,
    iterations,
    medianMs: +samples[Math.floor(samples.length / 2)].toFixed(3),
    p95Ms: +samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))].toFixed(3),
  });
}
measure('table: 10,000 selected rows / 100 groups', () => createTableRenderModel(table));
measure('chart: 1,000 line points', () => compileChartScene(definition, 720, 320, 'en-US'));
measure('format: 1,000 percentages', () => {
  for (let i = 0; i < 1000; i++) formatPercentage(i / 1000);
});
for (const size of [10000, 100000]) {
  const text = markdown.repeat(Math.ceil(size / markdown.length)).slice(0, size);
  measure(`markdown: ${size} characters`, () => parse(text), 10);
}
const stream = markdown.repeat(Math.ceil(10000 / markdown.length)).slice(0, 10000);
measure(
  'markdown: 10,000 characters / 20 growing snapshots',
  () => {
    for (let end = 500; end <= stream.length; end += 500) parse(stream.slice(0, end));
  },
  5
);
console.log(
  JSON.stringify(
    {
      revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
      node: process.version,
      cpu: os.cpus()[0]?.model,
      platform: process.platform,
      arch: process.arch,
      results,
    },
    null,
    2
  )
);
