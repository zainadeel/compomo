import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-chart-donut.js';
import '../../../../dist/components/ds-chart-legend.js';
import type { ChartDatum, ChartLegendItem } from '../../utils/chart-types';

const MOCK_DATA: ChartDatum[] = [
  { label: 'Passed', value: 68 },
  { label: 'Needs review', value: 22 },
  { label: 'Failed', value: 10 },
];

// Mirrors Webapp's "Availability status" Overview widget (donut w/ center total + value/caption,
// stacked legend below w/ percentage + count columns). Values chosen so all 4 slices stay visible
// at a glance (200 total, split 100/50/25/25) rather than near-zero slivers.
const AVAILABILITY_STATUS: ChartDatum[] = [
  { label: 'In Service', value: 100 },
  { label: 'In Shop', value: 50 },
  { label: 'Missing', value: 25 },
  { label: 'Out of Service', value: 25 },
];

const NO_DATA: ChartDatum[] = [
  { label: 'In Service', value: 0 },
  { label: 'In Shop', value: 0 },
  { label: 'Missing', value: 0 },
  { label: 'Out of Service', value: 0 },
];

const meta: Meta = {
  title: 'Data Viz/Chart Donut',
  tags: ['autodocs'],
  argTypes: {
    thickness: { control: 'number', description: 'Ring thickness in px. Defaults to --dimension-size-200 (16px).' },
    cornerRadius: { control: 'number', description: 'Slice corner radius in px. Defaults to --dimension-radius-025 (2px).' },
    gap: { control: 'number', description: 'Gap between slices, in degrees.' },
    showTooltip: { control: 'boolean' },
  },
  args: {
    thickness: 16,
    cornerRadius: 2,
    gap: 1,
    showTooltip: true,
  },
};
export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-chart-donut
      ${ref(el => {
        if (!el) return;
        (el as any).data = MOCK_DATA;
      })}
      size=${175}
      thickness=${args['thickness']}
      corner-radius=${args['cornerRadius']}
      gap=${args['gap']}
      .showTooltip=${args['showTooltip']}
      center-caption="Total reviewed"
    ></ds-chart-donut>
  `,
};

export const WithLegend: Story = {
  render: () => html`
    <div style="display:flex;align-items:center;gap:var(--dimension-space-300)">
      <ds-chart-donut
        ${ref(el => {
          if (!el) return;
          (el as any).data = MOCK_DATA;
        })}
        size=${175}
        center-caption="Total reviewed"
        .showTooltip=${false}
      ></ds-chart-donut>
      <ds-chart-legend
        ${ref(el => {
          if (!el) return;
          (el as any).items = MOCK_DATA;
        })}
      ></ds-chart-legend>
    </div>
  `,
};

/** Recreates the "Availability status" Overview widget: centered donut, full-width legend below. */
export const AvailabilityStatusPattern: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;align-items:center;gap:var(--dimension-space-300);width:280px">
      <ds-chart-donut
        ${ref(el => {
          if (!el) return;
          (el as any).data = AVAILABILITY_STATUS;
        })}
        size=${175}
        center-caption="Total vehicles"
        .showTooltip=${false}
      ></ds-chart-donut>
      <ds-chart-legend
        style="width:100%"
        ${ref(el => {
          if (!el) return;
          (el as any).items = AVAILABILITY_STATUS;
        })}
      ></ds-chart-legend>
    </div>
  `,
};

/** All values zero (or no data) — renders a flat `--color-background-faint-neutral` ring instead of NaN-angle slices. */
export const Empty: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;align-items:center;gap:var(--dimension-space-300);width:280px">
      <ds-chart-donut
        ${ref(el => {
          if (!el) return;
          (el as any).data = NO_DATA;
        })}
        size=${175}
        center-caption="Total vehicles"
        .showTooltip=${false}
      ></ds-chart-donut>
      <ds-chart-legend
        style="width:100%"
        ${ref(el => {
          if (!el) return;
          (el as any).items = NO_DATA;
        })}
      ></ds-chart-legend>
    </div>
  `,
};

/**
 * Center value/caption truncate with an ellipsis (via SVG `getComputedTextLength()`, measured
 * after render) when they don't fit inside the inner circle — shown here at decreasing sizes with
 * the same long text, so the smaller donuts truncate progressively harder while the biggest doesn't.
 */
export const CenterTextTruncation: Story = {
  render: () => html`
    <div style="display:flex;gap:var(--dimension-space-400);align-items:flex-end">
      ${[220, 128, 88].map(
        size => html`
          <div style="display:flex;flex-direction:column;align-items:center;gap:var(--dimension-space-100)">
            <ds-chart-donut
              ${ref(el => {
                if (!el) return;
                (el as any).data = MOCK_DATA;
              })}
              size=${size}
              center-value="1,234,567"
              center-caption="Needs attention this week"
            ></ds-chart-donut>
            <span style="color:var(--color-foreground-tertiary);font-size:var(--typography-fontsize-xs)">size=${size}</span>
          </div>
        `,
      )}
    </div>
  `,
};

/**
 * Demonstrates bidirectional chart↔legend hover sync (via `dsSliceHover` / `dsItemHover`, matched
 * by `label`) plus a deep-linkable legend row (`item.href`) — "Out of Service" navigates via a
 * real `<a>`; click is intercepted here only so the demo doesn't leave Storybook.
 *
 * Both directions only dim opacity — neither shows a hover-fill on the other side.
 * The donut tooltip is disabled because the legend already surfaces label/value.
 * Legend rows keep their own hover-fill (`:hover`/`:focus-visible` in CSS) for real pointer/
 * keyboard interaction, since that's a "you can click here" affordance that shouldn't appear just
 * because the donut was hovered.
 */
export const SyncedWithLegend: Story = {
  render: () => {
    let donutEl: (HTMLElement & { activeLabel: string | null }) | null = null;
    let legendEl: (HTMLElement & { activeLabel: string | null }) | null = null;

    const items: ChartLegendItem[] = AVAILABILITY_STATUS.map(d => ({
      ...d,
      href: d.label === 'Out of Service' ? '#out-of-service' : undefined,
    }));

    return html`
      <div style="display:flex;flex-direction:column;align-items:center;gap:var(--dimension-space-200);width:280px">
        <ds-chart-donut
          ${ref(el => {
            if (!el) return;
            donutEl = el as any;
            (el as any).data = AVAILABILITY_STATUS;
            el.addEventListener('dsSliceHover', ((e: CustomEvent<ChartDatum | null>) => {
              if (legendEl) legendEl.activeLabel = e.detail?.label ?? null;
            }) as EventListener);
          })}
          size=${175}
          center-caption="Total vehicles"
          .showTooltip=${false}
        ></ds-chart-donut>
        <ds-chart-legend
          style="width:100%"
          ${ref(el => {
            if (!el) return;
            legendEl = el as any;
            (el as any).items = items;
            el.addEventListener('dsItemHover', ((e: CustomEvent<ChartLegendItem | null>) => {
              if (donutEl) donutEl.activeLabel = e.detail?.label ?? null;
            }) as EventListener);
            el.addEventListener('dsItemClick', ((e: CustomEvent<{ item: ChartLegendItem; originalEvent: MouseEvent }>) => {
              e.detail.originalEvent.preventDefault();
              console.log('[ds-chart-legend] deep link clicked:', e.detail.item);
            }) as EventListener);
          })}
        ></ds-chart-legend>
        <p style="color:var(--color-foreground-tertiary);font-size:var(--typography-fontsize-xs);text-align:center;margin:0">
          Hover the donut or a legend row — highlight stays in sync both ways.<br />
          "Out of Service" is a deep link (click logs to console instead of navigating, demo only).
        </p>
      </div>
    `;
  },
};
