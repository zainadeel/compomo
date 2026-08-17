import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-mobile-header.js';

const sections = [
  { id: 'live-map', label: 'Live Map' },
  { id: 'location-history', label: 'Location History' },
  { id: 'trips', label: 'Trips' },
];

const inboxSections = [
  { id: 'stacks', label: 'Stacks', variant: 'label' as const },
  { id: 'activity', label: 'Activity', variant: 'label' as const, dot: true },
];

const meta: Meta = {
  title: 'Navigation/MobileHeader',
  component: 'ds-mobile-header',
};

export default meta;
type Story = StoryObj;

export const Foundation: Story = {
  render: () => html`
    <ds-mobile-header
      .sections=${sections}
      value="location-history"
    >
      <ds-button-unfilled
        slot="leading"
        variant="icon"
        size="md"
        icon="ChevronLeft"
        aria-label="Back"
        .activeFill=${false}
        .hasBorder=${false}
      ></ds-button-unfilled>
      <ds-button-unfilled
        slot="trailing"
        variant="icon"
        size="md"
        icon="Ellipses"
        aria-label="More options"
        .activeFill=${false}
        .hasBorder=${false}
      ></ds-button-unfilled>
    </ds-mobile-header>
  `,
};

export const NestedPageSections: Story = {
  render: () => html`
    <ds-mobile-header
      .sections=${[
        { id: 'overview', label: 'Overview' },
        { id: 'people', label: 'People' },
        { id: 'timecards', label: 'Timecards' },
        { id: 'qualifications', label: 'Qualifications' },
      ]}
      value="people"
      sections-aria-label="Change Workforce page"
      .subsections=${[
        { id: 'drivers', label: 'Drivers' },
        { id: 'managers', label: 'Managers' },
      ]}
      subvalue="drivers"
      subsections-aria-label="Change People view"
    ></ds-mobile-header>
  `,
};

export const SegmentedToolSections: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Segmented mobile tool sections fill the centered two-thirds top-bar lane and divide that space equally between options.',
      },
    },
  },
  render: () => html`
    <div style="width:390px;max-width:100%;">
      <ds-mobile-header
        heading-level="h2"
        .sections=${inboxSections}
        value="activity"
        sections-presentation="segmented"
        sections-size="lg"
        sections-aria-label="Inbox sections"
      ></ds-mobile-header>
    </div>
  `,
};

export const DetailWithPageSections: Story = {
  render: () => html`
    <ds-mobile-header
      heading="John Smith"
      .subsections=${[
        { id: 'summary', label: 'Summary' },
        { id: 'history', label: 'History' },
        { id: 'timecards', label: 'Timecards' },
        { id: 'settings', label: 'Settings' },
      ]}
      subvalue="summary"
      subsections-aria-label="Change driver detail section"
    >
      <ds-button-unfilled
        slot="leading"
        variant="icon"
        size="md"
        icon="ChevronLeft"
        aria-label="Back to People"
        .activeFill=${false}
        .hasBorder=${false}
      ></ds-button-unfilled>
    </ds-mobile-header>
  `,
};
