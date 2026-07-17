import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-chart-legend.js';
import type { ChartDatum } from '../../utils/chart-types';

const MOCK_DATA: ChartDatum[] = [
  { label: 'Passed', value: 68 },
  { label: 'Needs review', value: 22 },
  { label: 'Failed', value: 10 },
];

const meta: Meta = {
  title: 'Data Viz/Chart Legend',
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['vertical', 'horizontal'] },
    percentageDecimals: { control: 'radio', options: [1, 2] },
    showPercentage: { control: 'boolean' },
  },
  args: {
    direction: 'vertical',
    percentageDecimals: 1,
    showPercentage: true,
  },
};
export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-chart-legend
      ${ref(el => {
        if (!el) return;
        (el as any).items = MOCK_DATA;
      })}
      direction=${args['direction']}
      percentage-decimals=${args['percentageDecimals']}
      ?show-percentage=${args['showPercentage']}
    ></ds-chart-legend>
  `,
};

// Round-numbers through every compact-formatting bracket: 1000 -> 1k, 1500 -> 1.5k,
// 10100 -> 10.1k, 110100 -> 110.1k, 1000000 -> 1m.
const NUMBER_FORMAT_ITEMS: ChartDatum[] = [
  { label: 'Miles driven', value: 1000 },
  { label: 'Fuel spend', value: 1500 },
  { label: 'Idle minutes', value: 10100 },
  { label: 'Total miles', value: 110100 },
  { label: 'Odometer total', value: 1000000 },
];

// Labels of increasing length: fits comfortably, then must truncate at exactly 1 line.
const TRUNCATE_ITEMS: ChartDatum[] = [
  { label: 'Online', value: 42 },
  { label: 'Needs attention this week', value: 8 },
  { label: 'Vehicles flagged for inspection and compliance review', value: 5 },
  {
    label: 'Drivers with expired qualification documents requiring immediate renewal before next dispatch',
    value: 3,
  },
];

/**
 * Label and value both stay to exactly 1 line and truncate with an ellipsis instead of wrapping.
 * Both panels are constrained to 220px to force the behavior — at comfortable widths neither
 * would ever trigger.
 */
export const TruncateAndFormat: Story = {
  render: () => html`
    <div style="display:flex;gap:var(--dimension-space-400);align-items:flex-start;font-family:var(--typography-font-family, system-ui)">
      <div style="display:flex;flex-direction:column;gap:var(--dimension-space-150);width:220px">
        <p style="color:var(--color-foreground-tertiary);font-size:var(--typography-fontsize-xs);margin:0">
          Number formatting with percentages fixed to 2 decimal places
        </p>
        <ds-chart-legend
          ${ref(el => {
            if (!el) return;
            (el as any).items = NUMBER_FORMAT_ITEMS;
            (el as any).percentageDecimals = 2;
          })}
        ></ds-chart-legend>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--dimension-space-150);width:220px">
        <p style="color:var(--color-foreground-tertiary);font-size:var(--typography-fontsize-xs);margin:0">
          Label truncate — stays 1 line and ellipsis-truncates instead of wrapping
        </p>
        <ds-chart-legend
          ${ref(el => {
            if (!el) return;
            (el as any).items = TRUNCATE_ITEMS;
          })}
        ></ds-chart-legend>
      </div>
    </div>
  `,
};
