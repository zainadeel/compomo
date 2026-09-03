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

export const PrimaryPageSheet: Story = {
  render: () => html`
    <ds-mobile-section-switcher
      .sections=${sections}
      value="location-history"
      presentation="sheet"
    ></ds-mobile-section-switcher>
  `,
};

export const DetailPageSheet: Story = {
  render: () => html`
    <ds-mobile-section-switcher
      .sections=${[
        { id: 'summary', label: 'Summary' },
        { id: 'history', label: 'History' },
      ]}
      value="summary"
      page-label="John Smith"
      presentation="sheet"
      navigation-label="Change driver detail section"
    ></ds-mobile-section-switcher>
  `,
};
