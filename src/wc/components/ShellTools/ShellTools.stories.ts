import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-shell-tools.js';

const items = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents' },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
  { id: 'stacks', icon: 'ViewMenu', ariaLabel: 'Stacks' },
  { id: 'activity', icon: 'Bell', ariaLabel: 'Activity', dot: true },
  { id: 'help', icon: 'CircleQuestion', ariaLabel: 'Help & Support' },
];

const meta: Meta = {
  title: 'Navigation/ShellTools',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const MobileInbox: Story = {
  render: () => html`
    <div style="height: 720px; max-width: 430px; margin: 0 auto;">
      <ds-shell-tools
        responsive-mode="mobile"
        open
        active-tool="messages"
        .items=${items}
      >
        <div slot="messages-view">Persistent Messages product view</div>
        <div slot="stacks-view">Persistent Stacks product view</div>
        <div slot="activity-view">Persistent Activity product view</div>
      </ds-shell-tools>
    </div>
  `,
};

export const DesktopAdapter: Story = {
  render: () => html`
    <div style="height: 720px;">
      <ds-shell-tools open active-tool="search" .items=${items}>
        <div slot="search-view">Persistent Search product view</div>
      </ds-shell-tools>
    </div>
  `,
};
