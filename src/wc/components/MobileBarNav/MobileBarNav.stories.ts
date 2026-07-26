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
        agents-dot
        inbox-dot
      ></ds-mobile-bar-nav>
    </div>
  `,
};
