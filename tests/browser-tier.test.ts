import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('PR browser contracts cover every engine-sensitive behavior family', () => {
  const requiredSpecs = [
    'accessibility-overlays.spec.ts',
    'banner.spec.ts',
    'bar-nav-overflow.spec.ts',
    'forms.spec.ts',
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

  let contractCount = 0;
  for (const spec of requiredSpecs) {
    const source = fs.readFileSync(`tests/e2e/${spec}`, 'utf8');
    const matches = source.match(/@(cross-browser|pr-critical)/g) ?? [];
    contractCount += matches.length;
    assert.ok(matches.length > 0, `engine-sensitive spec has no PR browser contract: ${spec}`);
  }

  assert.ok(contractCount >= 25, `PR browser contract set is unexpectedly small: ${contractCount}`);
});
