import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-mobile-section-switcher.js';

const sections = [
  { id: 'live-map', label: 'Live Map' },
  { id: 'location-history', label: 'Location History' },
  { id: 'trips', label: 'Trips' },
  { type: 'divider' as const },
  { id: 'equipment', label: 'Equipment' },
  { id: 'geofences', label: 'Geofences' },
];

const meta: Meta = {
  title: 'Navigation/MobileSectionSwitcher',
  component: 'ds-mobile-section-switcher',
};

export default meta;
type Story = StoryObj;

export const Foundation: Story = {
  render: () => html`
    <ds-mobile-section-switcher
      .sections=${sections}
      value="location-history"
    ></ds-mobile-section-switcher>
  `,
};
