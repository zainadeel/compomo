import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-menu.js';

const items = [
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Archive', value: 'archive', isInactive: true },
  { label: 'Delete', value: 'delete', isDestructive: true },
];

const meta: Meta = {
  title: 'Overlay/Menu',
  tags: ['autodocs'],
  argTypes: {
    side:  { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
  },
  args: { side: 'bottom', align: 'start' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="padding: 16px; height: 320px">
      <span id="menu-anchor-pg" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        .items=${items}
        side=${args['side'] ?? 'bottom'}
        align=${args['align'] ?? 'start'}
        anchor-id="menu-anchor-pg"
      ></ds-menu>
    </div>
  `,
};

export const WithSections: Story = {
  render: () => html`
    <div style="padding: 16px; height: 320px">
      <span id="menu-anchor-sec" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        .sections=${[
          { header: 'File', items: [{ label: 'New' }, { label: 'Open' }, { label: 'Save' }] },
          { header: 'Edit', items: [{ label: 'Cut' }, { label: 'Copy' }, { label: 'Paste' }] },
        ]}
        anchor-id="menu-anchor-sec"
      ></ds-menu>
    </div>
  `,
};

export const WithToggle: Story = {
  render: () => html`
    <div style="padding: 16px; height: 240px">
      <span id="menu-anchor-tog" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        .items=${[
          { label: 'Dark mode', showToggle: true, toggleValue: true },
          { label: 'Notifications', showToggle: true, toggleValue: false },
          { label: 'Auto-save', showToggle: true, toggleValue: true },
        ]}
        anchor-id="menu-anchor-tog"
      ></ds-menu>
    </div>
  `,
};
