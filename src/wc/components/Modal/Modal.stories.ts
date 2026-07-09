import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-modal.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';

const meta: Meta = {
  title: 'Overlay/Modal',
  tags: ['autodocs'],
  argTypes: {
    heading:    { control: 'text' },
    subtitle:   { control: 'text' },
    modalWidth: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: { heading: 'Confirm action', modalWidth: 'md' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-modal
      ?open=${true}
      heading=${args['heading'] ?? 'Confirm action'}
      subtitle=${args['subtitle'] ?? ''}
      modal-width=${args['modalWidth'] ?? 'md'}
    >
      <p>Modal body content goes here. You can place any content inside the default slot.</p>
      <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px">
        <ds-button-unfilled variant="icon" icon="Cross" aria-label="Cancel"></ds-button-unfilled>
        <ds-button-filled variant="icon" icon="Check" intent="brand" aria-label="Confirm"></ds-button-filled>
      </div>
    </ds-modal>
  `,
};

export const WithSubtitle: Story = {
  render: () => html`
    <ds-modal
      ?open=${true}
      heading="Delete vehicle?"
      subtitle="This action cannot be undone. All associated data will be permanently removed."
    >
      <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px">
        <ds-button-unfilled variant="icon" icon="Cross" aria-label="Cancel"></ds-button-unfilled>
        <ds-button-filled variant="icon" icon="Trash" intent="negative" aria-label="Delete"></ds-button-filled>
      </div>
    </ds-modal>
  `,
};

export const SmallWidth: Story = {
  render: () => html`
    <ds-modal ?open=${true} heading="Are you sure?" modal-width="sm">
      <p>This will apply to all selected items.</p>
      <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px">
        <ds-button-unfilled variant="icon" icon="Cross" aria-label="Cancel"></ds-button-unfilled>
        <ds-button-filled variant="icon" icon="Check" intent="brand" aria-label="OK"></ds-button-filled>
      </div>
    </ds-modal>
  `,
};

export const LargeWidth: Story = {
  render: () => html`
    <ds-modal ?open=${true} heading="Vehicle details" modal-width="lg">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
        <div><label style="font-size: 12px; color: var(--color-foreground-secondary)">VIN</label><p style="margin: 4px 0">1HGBH41JXMN109186</p></div>
        <div><label style="font-size: 12px; color: var(--color-foreground-secondary)">Make</label><p style="margin: 4px 0">Ford F-150</p></div>
        <div><label style="font-size: 12px; color: var(--color-foreground-secondary)">Year</label><p style="margin: 4px 0">2023</p></div>
        <div><label style="font-size: 12px; color: var(--color-foreground-secondary)">Status</label><p style="margin: 4px 0">Active</p></div>
      </div>
      <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px">
        <ds-button-unfilled variant="icon" icon="Cross" aria-label="Close"></ds-button-unfilled>
        <ds-button-filled variant="icon" icon="Pencil" intent="brand" aria-label="Edit"></ds-button-filled>
      </div>
    </ds-modal>
  `,
};
