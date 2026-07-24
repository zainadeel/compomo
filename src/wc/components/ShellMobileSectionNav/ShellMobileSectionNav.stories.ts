import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-shell-mobile-section-nav.js';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'live-map', label: 'Live Map' },
  { id: 'history', label: 'History' },
  { type: 'divider' as const },
  { id: 'settings', label: 'Settings', dot: true },
];

const meta: Meta = {
  title: 'Navigation/ShellMobileSectionNav',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
};

export default meta;
type Story = StoryObj;

export const RouteSections: Story = {
  render: () => html`
    <ds-shell-mobile-section-nav
      .tabs=${tabs}
      base-path="/dashboard/tracking"
      current-url="/dashboard/tracking/live-map"
      heading="Tracking"
    ></ds-shell-mobile-section-nav>
  `,
};

export const DetailHeading: Story = {
  render: () => html`
    <ds-shell-mobile-section-nav
      .tabs=${tabs}
      base-path="/dashboard/tracking"
      current-url="/dashboard/tracking/device/123"
      heading="Tracking"
    ></ds-shell-mobile-section-nav>
  `,
};
