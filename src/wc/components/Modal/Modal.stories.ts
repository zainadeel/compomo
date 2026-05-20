import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-modal.js';
import '../../../../dist/components/ds-button.js';

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
        <ds-button label="Cancel" variant="secondary"></ds-button>
        <ds-button label="Confirm" intent="brand"></ds-button>
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
        <ds-button label="Cancel" variant="secondary"></ds-button>
        <ds-button label="Delete" intent="negative"></ds-button>
      </div>
    </ds-modal>
  `,
};

export const SmallWidth: Story = {
  render: () => html`
    <ds-modal ?open=${true} heading="Are you sure?" modal-width="sm">
      <p>This will apply to all selected items.</p>
      <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px">
        <ds-button label="Cancel" variant="secondary" size="sm"></ds-button>
        <ds-button label="OK" intent="brand" size="sm"></ds-button>
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
        <ds-button label="Close" variant="secondary"></ds-button>
        <ds-button label="Edit" intent="brand"></ds-button>
      </div>
    </ds-modal>
  `,
};
