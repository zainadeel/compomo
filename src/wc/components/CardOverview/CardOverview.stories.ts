import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-overview.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-select.js';
import { resolveMetricTrend } from '../../utils/metric-change';
import type { OverviewMetric, OverviewScore } from './card-overview-types';

const meta: Meta = {
  title: 'Composites/CardOverview',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Structural baseline only. Layout, regions, roving focus, and the stacking grid are in place; ' +
          'surface chrome and the final type scale are intentionally unset so the visual pass can own them. ' +
          'Trend tone is always supplied by the caller — derive it with `resolveMetricTrend` so whether a rise ' +
          'reads well stays a product decision.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Mirrors the product's safety bar, with tone decided per measure. */
const SCORE: OverviewScore = {
  label: 'Score',
  value: 81,
  trend: resolveMetricTrend(81, 82, { neutral: true }) ?? undefined,
  band: 'Good (67–83)',
};

const METRICS: OverviewMetric[] = [
  {
    id: 'distance',
    label: 'Distance driven (km)',
    value: '83.6k',
    // Distance moving either way is context, not good or bad news.
    trend: resolveMetricTrend(83_600, 85_300, { neutral: true, display: 'percentage' }) ?? undefined,
  },
  {
    id: 'drivers',
    label: 'Active drivers',
    value: 55,
    trend: resolveMetricTrend(55, 59, { neutral: true }) ?? undefined,
  },
  {
    id: 'events',
    label: 'Events / 1.6k km',
    value: 91.6,
    // More events is worse, so a rise reads negative.
    trend: resolveMetricTrend(91.6, 69.4, { inverted: true, display: 'percentage' }) ?? undefined,
  },
  {
    id: 'speeding',
    // No comparison available, so no trend is rendered at all.
    label: 'Speeding over posted',
    value: '1%',
  },
  {
    id: 'collisions',
    label: 'Collisions',
    value: 6,
    // Fewer collisions is better, so a fall reads positive.
    trend: resolveMetricTrend(6, 15, { inverted: true }) ?? undefined,
  },
];

const FRAME = 'padding:var(--dimension-space-200);max-width:100%;';

export const Structure: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview
        overview-label="Safety summary"
        period-label="Jun 29, 2026 – Jul 26, 2026"
        comparison-label="vs. previous score period (Jun 22, 2026 – Jul 19, 2026)"
        .score=${SCORE}
        .metrics=${METRICS}
      >
        <!--
          The period control is slotted, so the application picks it. Select
          supports the always-dark surface directly, so no wrapper is needed.
        -->
        <ds-select
          slot="filter"
          size="md"
          background="always-dark"
          .activeFill=${false}
          aria-label="Reporting period"
          .options=${[
            { label: 'Last 4 weeks', value: '4w' },
            { label: 'Last 8 weeks', value: '8w' },
            { label: 'Last 12 weeks', value: '12w' },
          ]}
          .value=${'4w'}
        ></ds-select>
      </ds-card-overview>
    </div>
  `,
};

/** Every tone and both directions, plus the no-trend case. */
export const TrendTones: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview
        overview-label="Trend tones"
        .metrics=${[
          { id: 'up-pos', label: 'Rise reads positive', value: 120, trend: resolveMetricTrend(120, 100) },
          { id: 'down-neg', label: 'Fall reads negative', value: 80, trend: resolveMetricTrend(80, 100) },
          { id: 'up-neg', label: 'Rise reads negative', value: 120, trend: resolveMetricTrend(120, 100, { inverted: true }) },
          { id: 'down-pos', label: 'Fall reads positive', value: 80, trend: resolveMetricTrend(80, 100, { inverted: true }) },
          { id: 'neutral', label: 'Change reads neutral', value: 90, trend: resolveMetricTrend(90, 100, { neutral: true }) },
          { id: 'none', label: 'Nothing to report', value: 100 },
        ]}
      ></ds-card-overview>
    </div>
  `,
};

/** The grid reflows then stacks from the minimum measure width alone. */
export const Stacking: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Each frame is narrower than the last. Measures reflow to fewer columns and finally stack; they never ' +
          'compress past `metricMinWidth` and the bar never scrolls horizontally.',
      },
    },
  },
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:var(--dimension-space-300);${FRAME}">
      ${[960, 640, 380].map(
        width => html`
          <div style="width:${width}px;max-width:100%;">
            <ds-card-overview
              overview-label="Safety summary at ${width}px"
              period-label="Jun 29 – Jul 26, 2026"
              .score=${SCORE}
              .metrics=${METRICS}
            ></ds-card-overview>
          </div>
        `,
      )}
    </div>
  `,
};

export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview overview-label="Safety summary" is-loading></ds-card-overview>
    </div>
  `,
};

/** The score can fail independently while the measures stay readable. */
export const ScoreError: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview
        overview-label="Safety summary"
        period-label="Jun 29, 2026 – Jul 26, 2026"
        score-error-message="Score unavailable"
        .metrics=${METRICS}
      ></ds-card-overview>
    </div>
  `,
};
