import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-chart-bar.js';
import type { ChartDatum } from '../../utils/chart-types';

const MOCK_DATA: ChartDatum[] = [
  { label: 'Hard brake', value: 14 },
  { label: 'Speeding', value: 22 },
  { label: 'Distraction', value: 9 },
  { label: 'Seatbelt', value: 4 },
];

const DAILY_ACTIVITY_COLOR = 'var(--color-data-category-1)';
const DAILY_ACTIVITY: ChartDatum[] = [
  { label: 'Mon', value: 118, color: DAILY_ACTIVITY_COLOR },
  { label: 'Tue', value: 136, color: DAILY_ACTIVITY_COLOR },
  { label: 'Wed', value: 124, color: DAILY_ACTIVITY_COLOR },
  { label: 'Thu', value: 151, color: DAILY_ACTIVITY_COLOR },
  { label: 'Fri', value: 143, color: DAILY_ACTIVITY_COLOR },
  { label: 'Sat', value: 82, color: DAILY_ACTIVITY_COLOR },
  { label: 'Sun', value: 67, color: DAILY_ACTIVITY_COLOR },
];

const meta: Meta = {
  title: 'Data Viz/Chart Bar',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: () => html`
    <ds-chart-bar
      ${ref(el => {
        if (!el) return;
        (el as any).data = MOCK_DATA;
      })}
      width="480"
      height="240"
    ></ds-chart-bar>
  `,
};

/** Ordered time buckets use equal band spacing; labels are preformatted by the application. */
export const TimeBuckets: Story = {
  render: () => html`
    <ds-chart-bar
      ${ref(el => {
        if (!el) return;
        (el as any).data = DAILY_ACTIVITY;
      })}
      width="560"
      height="240"
    ></ds-chart-bar>
  `,
};
