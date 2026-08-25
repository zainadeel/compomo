import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-mobile-bar-nav.js';

const meta: Meta = {
  title: 'Navigation/MobileBarNav',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const Foundation: Story = {
  render: () => html`
    <div style="max-width: 430px; margin: 0 auto;">
      <ds-mobile-bar-nav
        active-destination="area"
        .currentArea=${{ id: 'tracking', icon: 'MapPage', label: 'Tracking' }}
        activity-dot
        messages-dot
        agents-dot
      ></ds-mobile-bar-nav>
    </div>
  `,
};

export const GroupedInbox: Story = {
  render: () => html`
    <div style="max-width: 430px; margin: 0 auto;">
      <ds-mobile-bar-nav
        activity-mode="inbox"
        active-destination="inbox"
        .currentArea=${{ id: 'tracking', icon: 'MapPage', label: 'Tracking' }}
        inbox-dot
      ></ds-mobile-bar-nav>
    </div>
  `,
};
