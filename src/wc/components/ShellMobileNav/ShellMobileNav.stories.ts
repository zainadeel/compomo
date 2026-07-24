import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-shell-mobile-nav.js';

const groups = [
  {
    items: [
      { id: 'tracking', label: 'Tracking', icon: 'MapPage', href: '/dashboard/tracking' },
      { id: 'workforce', label: 'Workforce', icon: 'Person', href: '/dashboard/workforce' },
    ],
  },
];

const meta: Meta = {
  title: 'Navigation/ShellMobileNav',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Foundation: Story = {
  render: () => html`
    <div style="height: 720px; max-width: 430px; margin: 0 auto;">
      <ds-shell-mobile-nav
        open
        current-url="/dashboard/tracking/live-map"
        .dashboardGroups=${groups}
        .settingsGroups=${[]}
      ></ds-shell-mobile-nav>
    </div>
  `,
};
