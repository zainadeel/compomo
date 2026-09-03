import type { Meta, StoryObj } from '@storybook/web-components';
import { html, nothing } from 'lit';
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

export const TruncationPlayground: Story = {
  args: {
    width: 320,
    mode: 'combined',
    heading: 'John Alexander Smith with a very long name',
    tabLabel: 'Summary',
    showBack: true,
    showActions: true,
  },
  argTypes: {
    width: { control: { type: 'range', min: 320, max: 600, step: 10 } },
    mode: {
      control: 'radio',
      options: ['static', 'page-tabs', 'combined'],
    },
    heading: { control: 'text' },
    tabLabel: { control: 'text' },
    showBack: { control: 'boolean' },
    showActions: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use Controls to change the width, labels, and action visibility. Static titles and tab labels truncate to one line. Combined titles give the active tab priority while shortening the page name; very long tab names truncate too. Full labels remain in accessible names. Open the chooser to inspect its options. The sheet attaches to the preview viewport, not this width-limited header fixture.',
      },
    },
  },
  render: args => {
    const tabs = [
      { id: 'selected', label: args.tabLabel },
      { id: 'history', label: 'Location and activity history' },
      { id: 'settings', label: 'Settings' },
    ];
    return html`
      <div style=${`width:${args.width}px;max-width:100%;`}>
        <ds-mobile-header
          heading=${args.heading}
          .sections=${args.mode === 'page-tabs' ? tabs : []}
          value="selected"
          .subsections=${args.mode === 'combined' ? tabs : []}
          subvalue="selected"
          subsections-placement="combined"
          @dsSectionChange=${(event: CustomEvent<string>) => {
            (event.currentTarget as HTMLDsMobileHeaderElement).value = event.detail;
          }}
          @dsSubsectionChange=${(event: CustomEvent<string>) => {
            (event.currentTarget as HTMLDsMobileHeaderElement).subvalue = event.detail;
          }}
        >
          ${args.showBack
            ? html`<ds-button-unfilled
                slot="leading"
                variant="icon"
                size="lg"
                icon="ChevronLeft"
                aria-label="Back"
                .activeFill=${false}
                .hasBorder=${false}
              ></ds-button-unfilled>`
            : nothing}
          ${args.showActions
            ? html`<ds-button-unfilled
                slot="trailing"
                variant="icon"
                size="lg"
                icon="Ellipses"
                aria-label="More options"
                .activeFill=${false}
                .hasBorder=${false}
              ></ds-button-unfilled>`
            : nothing}
        </ds-mobile-header>
      </div>
    `;
  },
};

export const Foundation: Story = {
  render: () => html`
    <ds-mobile-header .sections=${sections} value="location-history">
      <ds-button-unfilled
        slot="leading"
        variant="icon"
        size="lg"
        icon="ChevronLeft"
        aria-label="Back"
        .activeFill=${false}
        .hasBorder=${false}
      ></ds-button-unfilled>
      <ds-button-unfilled
        slot="trailing"
        variant="icon"
        size="lg"
        icon="Ellipses"
        aria-label="More options"
        .activeFill=${false}
        .hasBorder=${false}
      ></ds-button-unfilled>
    </ds-mobile-header>
  `,
};

export const PageWithSubtabs: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Panel navigation exposes peer pages in the menu. Local tabs share one centered page-and-tab sheet trigger, including when only trailing actions are present.',
      },
    },
  },
  render: () => html`
    <ds-mobile-header
      heading="People"
      subsections-placement="combined"
      .subsections=${[
        { id: 'drivers', label: 'Drivers' },
        { id: 'managers', label: 'Managers' },
      ]}
      subvalue="drivers"
      subsections-aria-label="Change People view"
      @dsSubsectionChange=${(event: CustomEvent<string>) => {
        (event.currentTarget as HTMLDsMobileHeaderElement).subvalue = event.detail;
      }}
    >
      <ds-button-unfilled
        slot="trailing"
        variant="icon"
        size="lg"
        icon="Ellipses"
        aria-label="More people actions"
        .activeFill=${false}
        .hasBorder=${false}
      ></ds-button-unfilled>
    </ds-mobile-header>
  `,
};

export const SegmentedToolSections: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Segmented mobile tool sections fill the centered two-thirds top-bar lane and divide that space equally between options.',
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
  name: 'Detail with subtabs',
  render: () => html`
    <ds-mobile-header
      heading="John Smith"
      subsections-placement="combined"
      .subsections=${[
        { id: 'summary', label: 'Summary' },
        { id: 'history', label: 'History' },
        { id: 'timecards', label: 'Timecards' },
        { id: 'settings', label: 'Settings' },
      ]}
      subvalue="summary"
      subsections-aria-label="Change driver detail section"
      @dsSubsectionChange=${(event: CustomEvent<string>) => {
        (event.currentTarget as HTMLDsMobileHeaderElement).subvalue = event.detail;
      }}
    >
      <ds-button-unfilled
        slot="leading"
        variant="icon"
        size="lg"
        icon="ChevronLeft"
        aria-label="Back to People"
        .activeFill=${false}
        .hasBorder=${false}
      ></ds-button-unfilled>
      <ds-button-unfilled
        slot="trailing"
        variant="icon"
        size="lg"
        icon="Ellipses"
        aria-label="More driver actions"
        .activeFill=${false}
        .hasBorder=${false}
      ></ds-button-unfilled>
    </ds-mobile-header>
  `,
};

export const PlainPageTitle: Story = {
  render: () => html`
    <div style="width:390px;max-width:100%;">
      <ds-mobile-header heading="Overview">
        <ds-button-unfilled
          slot="trailing"
          variant="icon"
          size="lg"
          icon="Ellipses"
          aria-label="More page actions"
          .activeFill=${false}
          .hasBorder=${false}
        ></ds-button-unfilled>
      </ds-mobile-header>
    </div>
  `,
};
