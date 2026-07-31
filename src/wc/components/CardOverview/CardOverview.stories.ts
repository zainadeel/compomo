import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-overview.js';
import '../../../../dist/components/ds-select.js';
import { resolveMetricTrend } from '../../utils/metric-change';
import type { OverviewMetric, OverviewScore } from './card-overview-types';

const meta: Meta = {
  title: 'Cards/CardOverview',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A page summary with a persistent 48px period bar and an equal-track grid below it. ' +
          'The optional safety score is the first, nonselectable grid cell. Applications own ' +
          'date math and compose fixed labels or Select controls through the period and filter slots.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const SCORE: OverviewScore = {
  label: 'Safety score',
  value: 87,
  trend: resolveMetricTrend(87, 83) ?? undefined,
};

const METRICS: OverviewMetric[] = [
  {
    id: 'distance',
    label: 'Distance driven',
    value: '176.4k',
    trend:
      resolveMetricTrend(176_400, 172_900, { neutral: true, display: 'percentage' }) ?? undefined,
  },
  {
    id: 'drivers',
    label: 'Active drivers',
    value: 56,
    trend: resolveMetricTrend(56, 58, { neutral: true, display: 'percentage' }) ?? undefined,
  },
  {
    id: 'events',
    label: 'Events / 1k miles',
    value: 27.3,
    trend:
      resolveMetricTrend(27.3, 28.7, { inverted: true, display: 'percentage' }) ?? undefined,
  },
  {
    id: 'speeding',
    label: 'Speeding',
    value: '53%',
    trend: resolveMetricTrend(53, 51, { inverted: true }) ?? undefined,
  },
  {
    id: 'collisions',
    label: 'Collisions',
    value: 4,
    trend: resolveMetricTrend(4, 2, { inverted: true, display: 'percentage' }) ?? undefined,
  },
];

const FRAME = 'padding:var(--dimension-space-200);max-width:100%;';
const COMPARISON_OPTIONS = [
  { label: 'Previous 1 week', value: '1w' },
  { label: 'Previous 2 weeks', value: '2w' },
  { label: 'Previous 4 weeks', value: '4w' },
];
const CURRENT_RANGE_OPTIONS = [
  { label: 'Jun 30–Jul 27', value: 'current-4w' },
  { label: 'Jun 2–Jun 29', value: 'previous-4w' },
];

const comparisonSelect = () => html`
  <ds-select
    slot="filter"
    size="md"
    background="always-dark"
    .activeFill=${false}
    .hasBorder=${false}
    aria-label="Comparison window"
    .options=${COMPARISON_OPTIONS}
    .value=${'4w'}
  ></ds-select>
`;

const currentRangeSelect = () => html`
  <ds-select
    slot="period"
    size="md"
    background="always-dark"
    .activeFill=${false}
    .hasBorder=${false}
    aria-label="Current date range"
    .options=${CURRENT_RANGE_OPTIONS}
    .value=${'current-4w'}
  ></ds-select>
`;

export const DateComparison: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview
        overview-label="Safety summary"
        period-label="Jul 27"
        comparison-label="vs."
        .score=${SCORE}
        .metrics=${METRICS}
      >
        ${comparisonSelect()}
      </ds-card-overview>
    </div>
  `,
};

export const RangeComparison: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'The current range can be application-owned Select content. The comparison Select still chooses a preceding window length, not an arbitrary date.',
      },
    },
  },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview
        overview-label="Safety summary"
        comparison-label="vs."
        .score=${SCORE}
        .metrics=${METRICS}
      >
        ${currentRangeSelect()} ${comparisonSelect()}
      </ds-card-overview>
    </div>
  `,
};

export const ScorePalette: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid;gap:var(--dimension-space-200);${FRAME}">
      ${[
        { label: 'Fair', value: 42 },
        { label: 'Good', value: 72 },
        { label: 'Excellent', value: 87 },
      ].map(
        score => html`
          <ds-card-overview
            period-label="Jul 27"
            comparison-label="vs."
            .score=${{ label: `${score.label} safety score`, value: score.value }}
          >
            ${comparisonSelect()}
          </ds-card-overview>
        `
      )}
    </div>
  `,
};

export const Compact: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Compact is only the 48px period bar. It intentionally omits both Score and metrics.',
      },
    },
  },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview
        variant="compact"
        overview-label="Compact safety summary"
        period-label="Jul 27"
        comparison-label="vs."
        .score=${SCORE}
        .metrics=${METRICS}
      >
        ${comparisonSelect()}
      </ds-card-overview>
    </div>
  `,
};

export const ScrollCollapseSurface: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="width:960px;max-width:100%;${FRAME}">
      <ds-card-overview
        period-label="Jul 27"
        comparison-label="vs."
        .score=${SCORE}
        .metrics=${METRICS}
        .scrollCollapseProgress=${0.55}
      >
        ${comparisonSelect()}
      </ds-card-overview>
    </div>
  `,
};

export const Wrapping: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="width:640px;max-width:100%;${FRAME}">
      <ds-card-overview
        period-label="Jun 30–Jul 27"
        comparison-label="vs."
        .score=${SCORE}
        .metrics=${METRICS}
      >
        ${comparisonSelect()}
      </ds-card-overview>
    </div>
  `,
};

export const Stacked: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="width:640px;max-width:100%;${FRAME}">
      <ds-card-overview
        layout="stacked"
        period-label="Jul 27"
        comparison-label="vs."
        .score=${SCORE}
        .metrics=${METRICS}
      >
        ${comparisonSelect()}
      </ds-card-overview>
    </div>
  `,
};

export const NoScore: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview
        period-label="Jul 27"
        comparison-label="vs."
        .metrics=${METRICS}
      >
        ${comparisonSelect()}
      </ds-card-overview>
    </div>
  `,
};

export const ScoreWithoutTrend: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview
        period-label="Jul 27"
        comparison-label="vs."
        .score=${{ label: 'Safety score', value: 87 }}
        .metrics=${METRICS}
      >
        ${comparisonSelect()}
      </ds-card-overview>
    </div>
  `,
};

export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview overview-label="Loading safety summary" is-loading></ds-card-overview>
    </div>
  `,
};

export const ScoreError: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${FRAME}">
      <ds-card-overview
        period-label="Jul 27"
        comparison-label="vs."
        score-error-message="Score unavailable"
        .metrics=${METRICS}
      >
        ${comparisonSelect()}
      </ds-card-overview>
    </div>
  `,
};
