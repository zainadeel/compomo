import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  dateFormatter,
  numberFormatter,
  resolveFormatLocale,
} from '../src/wc/utils/intl-formatters';
import { formatPercentage } from '../src/wc/utils/format-percentage';
import { formatCompactNumber } from '../src/wc/utils/format-compact-number';
import { resolveMetricTrend } from '../src/wc/utils/metric-change';
import { formatTableTotalSummary } from '../src/wc/components/Table/table-model';

test('English defaults remain consistent across number consumers, with explicit locale overrides', () => {
  for (const locale of [undefined, '', '  ', 'invalid_locale']) {
    assert.equal(resolveFormatLocale(locale), 'en-US');
    assert.equal(formatPercentage(12.345, 1, locale), '1,234.5%');
    assert.equal(formatTableTotalSummary(12345, '{total} items', locale), '12,345 items');
    assert.equal(
      resolveMetricTrend(12346, 1, { display: 'percentage', locale })?.value,
      '1,234,500%'
    );
  }
  assert.equal(formatPercentage(0.123, 1, 'de-DE'), '12,3\u00a0%');
  assert.equal(formatCompactNumber(12345), '12.3k');
  assert.equal(formatCompactNumber(12345, 'en-US'), '12.3K');
});

test('formatters share equivalent options but evict old entries instead of growing indefinitely', () => {
  const first = numberFormatter('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  assert.equal(
    first,
    numberFormatter('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 1 })
  );
  for (let i = 0; i < 64; i++)
    numberFormatter('en-US', {
      minimumIntegerDigits: 1 + (i % 20),
      maximumFractionDigits: Math.floor(i / 20),
    });
  assert.notEqual(
    first,
    numberFormatter('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  );
  assert.equal(
    dateFormatter(undefined, { timeZone: 'UTC' }),
    dateFormatter('en-US', { timeZone: 'UTC' })
  );
});
