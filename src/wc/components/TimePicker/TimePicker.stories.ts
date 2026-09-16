import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-time-picker.js';

const meta: Meta = {
  title: 'Form/Time Picker',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    hourFormat: { control: 'select', options: ['12', '24'] },
    min: { control: 'text' },
    max: { control: 'text' },
    step: { control: 'text' },
    isInactive: { control: 'boolean' },
  },
  args: {
    value: '09:00',
    isInactive: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width:200px;background:var(--color-background-primary);">
      <ds-time-picker
        value=${args['value'] ?? ''}
        hour-format=${args['hourFormat'] ?? '12'}
        min=${args['min'] ?? ''}
        max=${args['max'] ?? ''}
        step=${args['step'] ?? '60'}
        ?is-inactive=${args['isInactive']}
      ></ds-time-picker>
    </div>
  `,
};

export const Bounds: Story = {
  render: () => html`
    <div style="display:grid;grid-template-columns:200px 200px;gap:var(--dimension-space-300);">
      <div>
        <ds-text variant="text-body-small" color="secondary">Open 12-hour list</ds-text>
        <ds-time-picker value="09:00"></ds-time-picker>
      </div>
      <div>
        <ds-text variant="text-body-small" color="secondary">Bounded 9:00 AM–5:00 PM</ds-text>
        <ds-time-picker value="09:00" min="09:00" max="17:00"></ds-time-picker>
      </div>
    </div>
  `,
};

export const NarrowBounds: Story = {
  render: () => html`
    <div style="width:200px;background:var(--color-background-primary);">
      <ds-text variant="text-body-small" color="secondary"> Bounded 9:30 AM–9:45 AM </ds-text>
      <ds-time-picker value="08:00" min="09:30" max="09:45"></ds-time-picker>
    </div>
  `,
};

export const TwentyFourHour: Story = {
  render: () => html`
    <div style="width:320px;display:grid;gap:var(--dimension-space-200)">
      <ds-time-picker
        @dsChange=${(event: CustomEvent<string>) => {
          (event.currentTarget as HTMLDsTimePickerElement).value = event.detail;
        }}
        hour-format="24"
        value="00:00"
        aria-label="Midnight"
      ></ds-time-picker>
      <ds-time-picker
        @dsChange=${(event: CustomEvent<string>) => {
          (event.currentTarget as HTMLDsTimePickerElement).value = event.detail;
        }}
        hour-format="24"
        value="14:30"
        min="08:30"
        max="18:00"
        aria-label="Business hours"
      ></ds-time-picker>
      <ds-time-picker
        @dsChange=${(event: CustomEvent<string>) => {
          (event.currentTarget as HTMLDsTimePickerElement).value = event.detail;
        }}
        hour-format="24"
        value="23:45"
        aria-label="Late evening"
      ></ds-time-picker>
    </div>
  `,
};
