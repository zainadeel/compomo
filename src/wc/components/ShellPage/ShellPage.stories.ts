import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type {
  BarTitleActionItem,
  BarTitlePrimaryAction,
  BarTitleSectionItem,
} from '../BarTitle/bar-title-types';
import '../../../../dist/components/ds-shell-page.js';
import '../../../../dist/components/ds-bar-title.js';

const sections: BarTitleSectionItem[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'history', label: 'History' },
  { id: 'timecards', label: 'Timecards' },
  { type: 'divider' },
  { id: 'settings', label: 'Settings' },
];

const primaryAction: BarTitlePrimaryAction = {
  id: 'call-driver',
  label: 'Call driver',
};

const actions: BarTitleActionItem[] = [
  { id: 'message-driver', label: 'Message driver' },
  { id: 'share-location', label: 'Share location' },
  { type: 'divider' },
  { id: 'remove-driver', label: 'Remove driver', isDestructive: true },
];

const meta: Meta = {
  title: 'Layout/ShellPage',
  tags: ['autodocs'],
  argTypes: {
    headerPresentation: {
      control: 'select',
      options: ['auto', 'expanded', 'compact', 'constrained'],
    },
    contentInset: { control: 'select', options: ['default', 'none'] },
  },
  args: {
    headerPresentation: 'auto',
    contentInset: 'default',
  },
};

export default meta;
type Story = StoryObj;

const demoStyles = html`
  <style>
    .shell-page-demo {
      min-width: 0;
      height: var(--dimension-panel-width-lg);
      overflow: auto;
      border: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);
      border-radius: var(--dimension-radius-100);
      background: var(--color-background-primary);
    }

    .shell-page-demo--constrained {
      width: min(100%, var(--dimension-panel-width-lg));
    }

    .shell-page-demo__content {
      display: grid;
      gap: var(--dimension-space-200);
    }

    .shell-page-demo__panel {
      display: flex;
      flex-direction: column;
      gap: var(--dimension-space-100);
      min-height: var(--dimension-panel-width-xs);
      padding: var(--dimension-space-300);
      box-sizing: border-box;
      border: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);
      border-radius: var(--dimension-radius-100);
      background: var(--color-background-secondary);
    }

    .shell-page-demo__full-bleed {
      min-height: var(--dimension-panel-width-lg);
      background: var(--color-background-secondary);
    }
  </style>
`;

const pageContent = html`
  <div class="shell-page-demo__content">
    ${['Driver information', 'Recent activity', 'Performance snapshot'].map(
      heading => html`
        <section class="shell-page-demo__panel">
          <ds-text as="h2" variant="text-title-small" emphasis color="primary">
            ${heading}
          </ds-text>
          <ds-text as="p" variant="text-body-medium" color="secondary">
            Product-owned content remains in the default ShellPage slot.
          </ds-text>
        </section>
      `
    )}
  </div>
`;

function updateValue(event: CustomEvent<string>) {
  (event.currentTarget as HTMLDsBarTitleElement).value = event.detail;
}

export const Playground: Story = {
  render: args => html`
    ${demoStyles}
    <div class="shell-page-demo">
      <ds-shell-page
        header-presentation=${args['headerPresentation']}
        content-inset=${args['contentInset']}
      >
        <ds-bar-title
          slot="header"
          heading="John Smith"
          description="View and manage driver details, activity, timecards, and settings."
          show-back
          back-aria-label="Back to Drivers"
          .sections=${sections}
          value="summary"
          .primaryAction=${primaryAction}
          .actions=${actions}
          @dsSectionChange=${updateValue}
        ></ds-bar-title>
        ${pageContent}
      </ds-shell-page>
    </div>
  `,
};

export const ListWithSections: Story = {
  render: () => html`
    ${demoStyles}
    <div class="shell-page-demo">
      <ds-shell-page>
        <ds-bar-title
          slot="header"
          heading="Drivers"
          description="Manage active, inactive, and invited drivers."
          .sections=${sections}
          value="summary"
          .primaryAction=${{ id: 'create-driver', label: 'Create driver' }}
          @dsSectionChange=${updateValue}
        ></ds-bar-title>
        ${pageContent}
      </ds-shell-page>
    </div>
  `,
};

export const DetailWithSections: Story = {
  render: () => html`
    ${demoStyles}
    <div class="shell-page-demo">
      <ds-shell-page>
        <ds-bar-title
          slot="header"
          heading="John Smith"
          description="View and manage driver details, activity, timecards, and settings."
          show-back
          back-aria-label="Back to Drivers"
          .sections=${sections}
          value="summary"
          .primaryAction=${primaryAction}
          .actions=${actions}
          @dsSectionChange=${updateValue}
        ></ds-bar-title>
        ${pageContent}
      </ds-shell-page>
    </div>
  `,
};

export const DetailWithoutSections: Story = {
  render: () => html`
    ${demoStyles}
    <div class="shell-page-demo">
      <ds-shell-page>
        <ds-bar-title
          slot="header"
          heading="Inspection report"
          description="Review inspection findings and supporting evidence."
          show-back
          back-aria-label="Back to Inspections"
          .actions=${actions}
        ></ds-bar-title>
        ${pageContent}
      </ds-shell-page>
    </div>
  `,
};

export const CreateOrEdit: Story = {
  render: () => html`
    ${demoStyles}
    <div class="shell-page-demo shell-page-demo--constrained">
      <ds-shell-page>
        <ds-bar-title
          slot="header"
          heading="Create driver"
          description="Add identity, contact, and employment details for the new driver."
          show-back
          back-aria-label="Cancel and return to Drivers"
          .primaryAction=${{
            id: 'save-driver',
            label: 'Save driver',
            type: 'submit',
            collapse: 'never',
          }}
          .actions=${[{ id: 'save-draft', label: 'Save draft' }]}
        ></ds-bar-title>
        ${pageContent}
      </ds-shell-page>
    </div>
  `,
};

export const TopLevel: Story = {
  render: () => html`
    ${demoStyles}
    <div class="shell-page-demo">
      <ds-shell-page>
        <ds-bar-title
          slot="header"
          heading="Live Map"
          description="Monitor vehicles, drivers, and active routes across your fleet."
        ></ds-bar-title>
        ${pageContent}
      </ds-shell-page>
    </div>
  `,
};

export const FullBleed: Story = {
  render: () => html`
    ${demoStyles}
    <div class="shell-page-demo">
      <ds-shell-page content-inset="none">
        <ds-bar-title slot="header" heading="Live Map"></ds-bar-title>
        <div class="shell-page-demo__full-bleed"></div>
      </ds-shell-page>
    </div>
  `,
};
