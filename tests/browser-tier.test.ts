import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

test('PR browser contracts cover every engine-sensitive behavior family', () => {
  const requiredSpecs = [
    'accessibility-overlays.spec.ts',
    'banner.spec.ts',
    'bar-nav-overflow.spec.ts',
    'calendar.spec.ts',
    'chart-lifecycle.spec.ts',
    'content-lifecycle.spec.ts',
    'form-contracts.spec.ts',
    'forms.spec.ts',
    'navigation-lifecycle.spec.ts',
    'reduced-motion.spec.ts',
    'scroll-overlay.spec.ts',
    'selects.spec.ts',
    'shell-app-chrome.spec.ts',
    'shell-managed.spec.ts',
    'shell-mobile.spec.ts',
    'table.spec.ts',
    'table-virtual.spec.ts',
    'toast.spec.ts',
    'tooltip.spec.ts',
  ];

  // Ask Playwright what the configured gate actually collects. Comments and
  // unused tag strings cannot stand in for runnable browser coverage.
  const report = JSON.parse(
    execFileSync(
      process.execPath,
      [
        'node_modules/@playwright/test/cli.js',
        'test',
        '--list',
        '--project=chromium',
        '--grep',
        '@(cross-browser|pr-critical)',
        '--reporter=json',
      ],
      { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }
    )
  );
  assert.deepEqual(report.errors, []);
  const files = new Set(report.suites.map((suite: { file: string }) => suite.file));
  for (const spec of requiredSpecs)
    assert.ok(
      files.has(spec),
      `engine-sensitive spec has no collected PR browser contract: ${spec}`
    );
});
