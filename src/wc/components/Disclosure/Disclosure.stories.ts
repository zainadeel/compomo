import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-disclosure.js';
import '../../../../dist/components/ds-checkbox.js';
import '../../../../dist/components/ds-switch.js';
import '../../../../dist/components/ds-tag.js';
import '../../../../dist/components/ds-text.js';

const meta: Meta = {
  title: 'Layout/Disclosure',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    description: { control: 'text' },
    variant: { control: 'inline-radio', options: ['flush', 'contained'] },
    open: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    count: { control: 'text' },
  },
  args: {
    heading: 'Engine diagnostics',
    description: '',
    variant: 'flush',
    open: true,
    isInactive: false,
    count: '',
  },
};

export default meta;
type Story = StoryObj;

const panel = (content: unknown, background = 'var(--color-background-primary)') => html`
  <div
    style="width:min(100%, var(--dimension-panel-width-sm));background:${background};padding-block:var(--dimension-space-100);"
  >
    ${content}
  </div>
`;

const body = (text: string) => html`
  <ds-text as="p" variant="text-body-small" color="secondary" wrap="wrap">${text}</ds-text>
`;

const switchRow = (label: string, checked = false) => html`
  <div
    style="display:flex;align-items:center;justify-content:space-between;gap:var(--dimension-space-100);padding-block:var(--dimension-space-050);"
  >
    <ds-text as="span" variant="text-body-medium">${label}</ds-text>
    <ds-switch ?checked=${checked} aria-label=${label}></ds-switch>
  </div>
`;

export const Playground: Story = {
  render: args =>
    panel(
      html`
        <ds-disclosure
          heading=${args['heading'] ?? ''}
          description=${args['description'] ?? ''}
          variant=${args['variant'] ?? 'flush'}
          ?open=${args['open']}
          ?is-inactive=${args['isInactive']}
          count=${args['count'] ?? ''}
        >
          ${body(
            'Fault codes reported by the vehicle gateway in the last 24 hours, with the most recent reading first.'
          )}
        </ds-disclosure>
      `,
      args['variant'] === 'contained' ? 'var(--color-background-secondary)' : undefined
    ),
};

/**
 * Stacked flush sections separated by dividers, as in a detail panel or settings column.
 * count sits before the chevron, as in Table and Live Map group rows.
 */
export const FlushStack: Story = {
  render: () =>
    panel(html`
      <ds-disclosure heading="Alerts" count="3" open>
        ${switchRow('Harsh braking', true)} ${switchRow('Speeding', true)}
        ${switchRow('Unassigned driving')}
      </ds-disclosure>
      <ds-disclosure heading="Reports" description="Weekly summaries sent every Monday" count="2">
        ${switchRow('Fuel efficiency', true)} ${switchRow('IFTA mileage')}
      </ds-disclosure>
      <ds-disclosure heading="Maintenance">
        ${switchRow('Upcoming service')} ${switchRow('Open defects', true)}
      </ds-disclosure>
    `),
};

/** Self-contained card sections on a secondary page background. */
export const Contained: Story = {
  render: () => html`
    <div
      style="display:grid;gap:var(--dimension-space-100);width:min(100%, var(--dimension-panel-width-md));padding:var(--dimension-space-200);background:var(--color-background-secondary);"
    >
      <ds-disclosure variant="contained" heading="Hours of service" open>
        ${body('Cycle: USA 70 hour / 8 day. Restart: 34-hour. Rest break required.')}
      </ds-disclosure>
      <ds-disclosure
        variant="contained"
        heading="Driver vehicle inspection"
        description="Pre-trip and post-trip inspections"
      >
        ${body('Drivers must complete a DVIR before the first trip of each day.')}
      </ds-disclosure>
      <ds-disclosure variant="contained" heading="Personal conveyance">
        ${body('Allowed for up to 45 minutes per day.')}
      </ds-disclosure>
    </div>
  `,
};

/** Trailing slot for status tags or controls that keep their own activation. */
export const WithTrailing: Story = {
  render: () =>
    panel(html`
      <ds-disclosure heading="Vehicle groups" open>
        <ds-tag slot="trailing" label="3 selected" size="sm"></ds-tag>
        <div style="display:grid;gap:var(--dimension-space-050);">
          <ds-checkbox label="North Texas · Linehaul" checked></ds-checkbox>
          <ds-checkbox label="Houston · Local" checked></ds-checkbox>
          <ds-checkbox label="Austin · Yard" checked></ds-checkbox>
          <ds-checkbox label="San Antonio · Regional"></ds-checkbox>
        </div>
      </ds-disclosure>
      <ds-disclosure heading="Driver groups">
        <ds-tag slot="trailing" label="All" size="sm"></ds-tag>
        ${body('All drivers are included.')}
      </ds-disclosure>
    `),
};

export const Inactive: Story = {
  render: () =>
    panel(html`
      <ds-disclosure heading="Advanced routing" description="Requires Fleet Pro" is-inactive>
        ${body('Inactive sections cannot be expanded.')}
      </ds-disclosure>
      <ds-disclosure heading="Geofences">${body('12 geofences configured.')}</ds-disclosure>
    `),
};
