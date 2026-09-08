import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type {
  BarTitleActionConfigItem,
  BarTitlePrimaryAction,
  BarTitleSectionItem,
} from '../BarTitle/bar-title-types';
import '../../../../dist/components/ds-bar-page-title.js';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';

const peopleSections: BarTitleSectionItem[] = [
  { id: 'drivers', label: 'Drivers' },
  { id: 'managers', label: 'Managers' },
  { id: 'contractors', label: 'Contractors' },
];

const manySections: BarTitleSectionItem[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'history', label: 'History' },
  { id: 'timecards', label: 'Timecards' },
  { id: 'documents', label: 'Documents' },
  { id: 'performance', label: 'Performance' },
  { type: 'divider' },
  { id: 'settings', label: 'Settings' },
];

const createAction: BarTitlePrimaryAction = {
  id: 'create-person',
  label: 'Create person',
};

const orderedActions: BarTitleActionConfigItem[] = [
  {
    type: 'button',
    id: 'create-person',
    label: 'Create person',
    appearance: 'filled',
  },
  { type: 'overflow', id: 'export-people', label: 'Export people' },
];

function updateValue(event: CustomEvent<string>) {
  (event.currentTarget as HTMLElement & { value: string }).value = event.detail;
}

const meta: Meta = {
  title: 'Navigation/BarPageTitle',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      ...isolatedOverlayDocs('120px'),
      description: {
        component:
          'Compact shell-bar page chrome for panel-mode navigation. Page sections render as a complete tab row after the title divider, and collapse to the BarTitle section button when that row cannot fit beside the heading and trailing actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const TitleAndTabs: Story = {
  name: 'Title and tabs',
  render: () => html`
    <div style="background: var(--color-background-secondary);">
      <ds-bar-page-title
        heading="People"
        .sections=${peopleSections}
        value="drivers"
        sections-aria-label="Change People view"
        @dsSectionChange=${updateValue}
      ></ds-bar-page-title>
    </div>
  `,
};

export const TitleTabsAndActions: Story = {
  name: 'Title, tabs, and actions',
  render: () => html`
    <div style="background: var(--color-background-secondary);">
      <ds-bar-page-title
        heading="People"
        .sections=${peopleSections}
        value="drivers"
        sections-aria-label="Change People view"
        .primaryAction=${createAction}
        .actions=${[{ id: 'export-people', label: 'Export people' }]}
        @dsSectionChange=${updateValue}
      ></ds-bar-page-title>
    </div>
  `,
};

export const ForcedNarrow: Story = {
  name: 'Too many tabs',
  parameters: {
    docs: {
      description: {
        story:
          'When the complete tab row cannot sit beside the title and trailing actions, BarPageTitle replaces every tab with the compact section button and menu.',
      },
    },
  },
  render: () => html`
    <div
      style="
        width: min(100%, 280px);
        background: var(--color-background-secondary);
        outline: var(--dimension-stroke-width-012) dashed var(--color-border-tertiary);
      "
    >
      <ds-bar-page-title
        heading="John Smith"
        show-back
        back-aria-label="Back to Drivers"
        .sections=${manySections}
        value="summary"
        sections-aria-label="Change driver section"
        .actionItems=${orderedActions}
        @dsSectionChange=${updateValue}
      ></ds-bar-page-title>
    </div>
  `,
};

export const TitleOnly: Story = {
  name: 'Title only',
  render: () => html`
    <div style="background: var(--color-background-secondary);">
      <ds-bar-page-title heading="Live Map"></ds-bar-page-title>
    </div>
  `,
};
