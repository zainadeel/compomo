import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-sidebar.js';
import '../../../../dist/components/ds-button.js';

const meta: Meta = {
  title: 'Layout/Sidebar',
  tags: ['autodocs'],
  argTypes: {
    width:     { control: 'select', options: ['mini', 'default', 240, 320, 400] },
    collapsed: { control: 'boolean' },
    resizable: { control: 'boolean' },
    mobile:    { control: 'boolean' },
  },
  args: { width: 'default', collapsed: false, resizable: true, mobile: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="display: flex; height: 400px; border: 1px solid var(--color-border-primary, #e5e7eb); border-radius: 8px; overflow: hidden">
      <ds-sidebar
        .width=${args['width'] ?? 'default'}
        ?collapsed=${args['collapsed']}
        ?resizable=${args['resizable']}
        ?mobile=${args['mobile']}
        style="height: 100%"
      >
        <div style="display: flex; flex-direction: column; gap: 4px">
          <button style="display: flex; align-items: center; gap: 8px; padding: 8px; border: none; background: none; border-radius: 6px; cursor: pointer; width: 100%; text-align: left">
            <span>Dashboard</span>
          </button>
          <button style="display: flex; align-items: center; gap: 8px; padding: 8px; border: none; background: none; border-radius: 6px; cursor: pointer; width: 100%; text-align: left">
            <span>Fleet</span>
          </button>
          <button style="display: flex; align-items: center; gap: 8px; padding: 8px; border: none; background: none; border-radius: 6px; cursor: pointer; width: 100%; text-align: left">
            <span>Reports</span>
          </button>
        </div>
        <div slot="footer" style="padding: 8px; font-size: 12px; color: var(--color-foreground-secondary)">Footer</div>
      </ds-sidebar>
      <main style="flex: 1; padding: 24px; background: var(--color-background-primary)">
        Main content area
      </main>
    </div>
  `,
};

export const MiniWidth: Story = {
  render: () => html`
    <div style="display: flex; height: 300px; border: 1px solid var(--color-border-primary, #e5e7eb); border-radius: 8px; overflow: hidden">
      <ds-sidebar .width=${'mini'} ?resizable=${false} style="height: 100%">
        <div style="display: flex; flex-direction: column; gap: 4px; align-items: center">
          <button style="padding: 8px; border: none; background: none; border-radius: 6px; cursor: pointer" aria-label="Dashboard">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
              <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
              <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
              <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>
      </ds-sidebar>
      <main style="flex: 1; padding: 24px; background: var(--color-background-primary)">Main content</main>
    </div>
  `,
};
