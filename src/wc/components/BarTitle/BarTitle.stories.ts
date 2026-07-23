import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type {
  BarTitleActionItem,
  BarTitlePrimaryAction,
  BarTitleSectionItem,
  BarTitleVariant,
} from './bar-title-types';
import '../../../../dist/components/ds-bar-title.js';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';

const detailSections: BarTitleSectionItem[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'history', label: 'History' },
  { id: 'timecards', label: 'Timecards' },
  { type: 'divider' },
  { id: 'settings', label: 'Settings' },
];

const listSections: BarTitleSectionItem[] = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'invited', label: 'Invited' },
];

const detailPrimaryAction: BarTitlePrimaryAction = {
  id: 'call-driver',
  label: 'Call driver',
};

const detailActions: BarTitleActionItem[] = [
  { id: 'message-driver', label: 'Message driver' },
  { id: 'share-location', label: 'Share location' },
  { type: 'divider' },
  { id: 'remove-driver', label: 'Remove driver', isDestructive: true },
];

interface BarTitleReviewCase {
  id: string;
  label: string;
  rationale: string;
  heading: string;
  description?: string;
  showBack?: boolean;
  backAriaLabel?: string;
  backLabel?: string;
  sections?: BarTitleSectionItem[];
  value?: string;
  primaryAction?: BarTitlePrimaryAction;
  actions?: BarTitleActionItem[];
}

const pageCases: BarTitleReviewCase[] = [
  {
    id: 'top-level',
    label: 'Top-level page',
    rationale: 'No Back action and no route-level sections.',
    heading: 'Live Map',
    description: 'Monitor vehicles, drivers, and active routes across your fleet.',
  },
  {
    id: 'list-with-sections',
    label: 'Top-level list · sections',
    rationale: 'No Back action; the section selector switches list routes.',
    heading: 'Drivers',
    description: 'Manage active, inactive, and invited drivers.',
    sections: listSections,
    value: 'active',
    primaryAction: { id: 'create-driver', label: 'Create driver' },
    actions: [{ id: 'export-drivers', label: 'Export drivers' }],
  },
  {
    id: 'detail-with-sections',
    label: 'Inner detail · sections',
    rationale: 'Back returns to the collection; the selector switches detail routes.',
    heading: 'John Smith',
    description: 'View and manage driver details, activity, timecards, and settings.',
    showBack: true,
    backAriaLabel: 'Back to Drivers',
    backLabel: 'Drivers',
    sections: detailSections,
    value: 'summary',
    primaryAction: detailPrimaryAction,
    actions: detailActions,
  },
  {
    id: 'detail-without-sections',
    label: 'Inner detail · no sections',
    rationale: 'Back returns to the collection; actions remain page-level.',
    heading: 'Inspection report',
    description: 'Review inspection findings and supporting evidence.',
    showBack: true,
    backAriaLabel: 'Back to Inspections',
    backLabel: 'Inspections',
    actions: [
      { id: 'download-report', label: 'Download report' },
      { id: 'archive-report', label: 'Archive report' },
    ],
  },
];

const meta: Meta = {
  title: 'Navigation/BarTitle',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      ...isolatedOverlayDocs('560px'),
      description: {
        component:
          'BarTitle renders page identity and page-level commands. ShellPage chooses its presentation automatically from available capacity and scroll state. Story examples add a faint-neutral review canvas below BarTitle to expose its exact boundary; that framing is not part of the component.',
      },
    },
  },
  argTypes: {
    heading: { control: 'text' },
    description: { control: 'text' },
    showBack: { control: 'boolean' },
    backAriaLabel: { control: 'text' },
    backLabel: { control: 'text' },
    variant: { control: 'select', options: ['expanded', 'compact', 'constrained'] },
  },
  args: {
    heading: 'John Smith',
    description: 'View and manage driver details, activity, timecards, and settings.',
    showBack: true,
    backAriaLabel: 'Back to Drivers',
    backLabel: 'Drivers',
    variant: 'expanded',
  },
};

export default meta;
type Story = StoryObj;

const demoStyles = html`
  <style>
    .bar-title-review {
      display: grid;
      gap: var(--dimension-space-500);
      min-width: 0;
    }

    .bar-title-review__case,
    .bar-title-review__variant-list {
      display: grid;
      gap: var(--dimension-space-200);
      min-width: 0;
    }

    .bar-title-review__case + .bar-title-review__case {
      padding-block-start: var(--dimension-space-500);
      border-top: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);
    }

    .bar-title-review__intro {
      display: grid;
      gap: var(--dimension-space-050);
    }

    .bar-title-review__surface {
      min-width: 0;
      border: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);
      border-radius: var(--dimension-radius-100);
      overflow: hidden;
      background: var(--color-background-faint-neutral);
    }

    .bar-title-review__canvas {
      display: flex;
      align-items: center;
      min-height: var(--dimension-size-600);
      padding-inline: var(--dimension-space-400);
      box-sizing: border-box;
      border-top: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);
      background: var(--color-background-faint-neutral);
    }

    .bar-title-review__surface--constrained {
      width: min(100%, var(--dimension-panel-width-lg));
    }

    .bar-title-review__variant {
      display: grid;
      gap: var(--dimension-space-075);
      min-width: 0;
    }

    .bar-title-review__variant-label {
      display: flex;
      align-items: center;
      gap: var(--dimension-space-100);
    }

    .bar-title-review__variant-rule {
      flex: 1 1 auto;
      height: var(--dimension-stroke-width-012);
      background: var(--color-border-tertiary);
    }

    .bar-title-review__action-grid {
      display: grid;
      grid-template-columns: repeat(
        auto-fit,
        minmax(min(100%, var(--dimension-panel-width-sm)), 1fr)
      );
      gap: var(--dimension-space-300);
    }
  </style>
`;

function updateValue(event: CustomEvent<string>) {
  (event.currentTarget as HTMLDsBarTitleElement).value = event.detail;
}

function renderHeader(reviewCase: BarTitleReviewCase, variant: BarTitleVariant = 'expanded') {
  return html`
    <ds-bar-title
      heading=${reviewCase.heading}
      description=${reviewCase.description ?? ''}
      .showBack=${reviewCase.showBack ?? false}
      back-aria-label=${reviewCase.backAriaLabel ?? 'Back'}
      back-label=${reviewCase.backLabel ?? 'Back'}
      variant=${variant}
      .sections=${reviewCase.sections ?? []}
      value=${reviewCase.value ?? ''}
      .primaryAction=${reviewCase.primaryAction ?? null}
      .actions=${reviewCase.actions ?? []}
      @dsSectionChange=${updateValue}
    ></ds-bar-title>
  `;
}

function renderCanvas() {
  return html`
    <div class="bar-title-review__canvas" aria-hidden="true">
      <ds-text as="span" variant="text-caption" color="secondary">
        Review canvas — not component
      </ds-text>
    </div>
  `;
}

function renderFocusedCase(reviewCase: BarTitleReviewCase) {
  return html`
    ${demoStyles}
    <div class="bar-title-review">
      <div class="bar-title-review__intro">
        <ds-text as="h2" variant="text-title-small" emphasis color="primary">
          ${reviewCase.label}
        </ds-text>
        <ds-text as="p" variant="text-body-medium" color="secondary">
          ${reviewCase.rationale}
        </ds-text>
      </div>
      <div class="bar-title-review__surface">
        ${renderHeader(reviewCase)} ${renderCanvas()}
      </div>
    </div>
  `;
}

function renderVariant(reviewCase: BarTitleReviewCase, variant: BarTitleVariant) {
  return html`
    <div class="bar-title-review__variant">
      <div class="bar-title-review__variant-label">
        <ds-text as="span" variant="text-caption" emphasis color="secondary"> ${variant} </ds-text>
        <div class="bar-title-review__variant-rule" aria-hidden="true"></div>
      </div>
      <div
        class="bar-title-review__surface ${
          variant === 'constrained' ? 'bar-title-review__surface--constrained' : ''
        }"
      >
        ${renderHeader(reviewCase, variant)} ${renderCanvas()}
      </div>
    </div>
  `;
}

export const Playground: Story = {
  render: args => html`
    ${demoStyles}
    <div class="bar-title-review__surface">
      <ds-bar-title
        heading=${args['heading']}
        description=${args['description']}
        .showBack=${args['showBack']}
        back-aria-label=${args['backAriaLabel']}
        back-label=${args['backLabel']}
        variant=${args['variant']}
        .sections=${detailSections}
        value="summary"
        .primaryAction=${detailPrimaryAction}
        .actions=${detailActions}
        @dsSectionChange=${updateValue}
      ></ds-bar-title>
      ${renderCanvas()}
    </div>
  `,
};

export const AllPageTypes: Story = {
  name: 'Review · All page types',
  parameters: {
    docs: {
      description: {
        story:
          'The complete review matrix. Each page hierarchy is shown in every explicit presentation; ShellPage selects these automatically in product use.',
      },
    },
  },
  render: () => html`
    ${demoStyles}
    <div class="bar-title-review">
      ${pageCases.map(
        reviewCase => html`
          <section class="bar-title-review__case" aria-label=${reviewCase.label}>
            <div class="bar-title-review__intro">
              <ds-text as="h2" variant="text-title-small" emphasis color="primary">
                ${reviewCase.label}
              </ds-text>
              <ds-text as="p" variant="text-body-medium" color="secondary">
                ${reviewCase.rationale}
              </ds-text>
            </div>
            <div class="bar-title-review__variant-list">
              ${(['expanded', 'compact', 'constrained'] as const).map(variant =>
                renderVariant(reviewCase, variant)
              )}
            </div>
          </section>
        `
      )}
    </div>
  `,
};

export const TopLevelPage: Story = {
  name: 'Page type · Top level',
  render: () => renderFocusedCase(pageCases[0]),
};

export const ListWithSections: Story = {
  name: 'Page type · List with sections',
  render: () => renderFocusedCase(pageCases[1]),
};

export const DetailWithSections: Story = {
  name: 'Page type · Detail with sections',
  render: () => renderFocusedCase(pageCases[2]),
};

export const DetailWithoutSections: Story = {
  name: 'Page type · Detail without sections',
  render: () => renderFocusedCase(pageCases[3]),
};

export const Variants: Story = {
  name: 'Review · Presentations',
  parameters: {
    docs: {
      description: {
        story:
          'One inner detail page across the three explicit header presentations. Automatic selection belongs to ShellPage.',
      },
    },
  },
  render: () => html`
    ${demoStyles}
    <div class="bar-title-review__variant-list">
      ${(['expanded', 'compact', 'constrained'] as const).map(variant =>
        renderVariant(pageCases[2], variant)
      )}
    </div>
  `,
};

export const ActionConfigurations: Story = {
  name: 'Review · Action configurations',
  render: () => {
    const actionCases: BarTitleReviewCase[] = [
      {
        id: 'no-actions',
        label: 'No actions',
        rationale: 'Identity only.',
        heading: 'Live Map',
      },
      {
        id: 'primary-only',
        label: 'Primary only',
        rationale: 'One highest-emphasis command.',
        heading: 'Drivers',
        primaryAction: { id: 'create-driver', label: 'Create driver' },
      },
      {
        id: 'overflow-only',
        label: 'Overflow only',
        rationale: 'Commands are available without a dominant action.',
        heading: 'Inspection report',
        actions: [{ id: 'download', label: 'Download report' }],
      },
      {
        id: 'primary-overflow',
        label: 'Primary and overflow',
        rationale: 'One dominant command with supporting commands.',
        heading: 'John Smith',
        primaryAction: detailPrimaryAction,
        actions: detailActions,
      },
    ];

    return html`
      ${demoStyles}
      <div class="bar-title-review__action-grid">
        ${actionCases.map(
          actionCase => html`
            <section class="bar-title-review__case" aria-label=${actionCase.label}>
              <div class="bar-title-review__intro">
                <ds-text as="h2" variant="text-title-small" emphasis color="primary">
                  ${actionCase.label}
                </ds-text>
                <ds-text as="p" variant="text-body-small" color="secondary">
                  ${actionCase.rationale}
                </ds-text>
              </div>
              <div class="bar-title-review__surface">
                ${renderHeader(actionCase, 'compact')} ${renderCanvas()}
              </div>
            </section>
          `
        )}
      </div>
    `;
  },
};

export const ConstrainedPrimaryPolicies: Story = {
  name: 'Review · Constrained primary policy',
  render: () => html`
    ${demoStyles}
    <div class="bar-title-review__variant-list">
      ${renderVariant(
        {
          id: 'auto-collapse',
          label: 'Auto-collapse primary',
          rationale: 'The default primary moves into overflow.',
          heading: 'John Smith',
          primaryAction: { id: 'call', label: 'Call driver', collapse: 'auto' },
          actions: detailActions,
        },
        'constrained'
      )}
      ${renderVariant(
        {
          id: 'never-collapse',
          label: 'Always-visible primary',
          rationale: 'Use sparingly for actions whose hierarchy requires persistent visibility.',
          heading: 'Create driver',
          showBack: true,
          backAriaLabel: 'Cancel and return to Drivers',
          backLabel: 'Drivers',
          primaryAction: { id: 'save', label: 'Save driver', collapse: 'never' },
          actions: [{ id: 'draft', label: 'Save draft' }],
        },
        'constrained'
      )}
    </div>
  `,
};

export const ContentStress: Story = {
  name: 'Review · Long content',
  render: () => {
    const longContent: BarTitleReviewCase = {
      id: 'long-content',
      label: 'Long content',
      rationale:
        'Heading, section, and action labels must yield without displacing fixed controls.',
      heading:
        'A deliberately long driver name that must truncate before it crowds the page controls',
      description:
        'Supporting copy can wrap to two lines in expanded presentation without changing the page hierarchy.',
      showBack: true,
      backAriaLabel: 'Back to Drivers',
      backLabel: 'Drivers',
      sections: [
        { id: 'compliance', label: 'Compliance documents and certification history' },
        { id: 'activity', label: 'Recent activity' },
      ],
      value: 'compliance',
      primaryAction: { id: 'review', label: 'Review compliance' },
      actions: [{ id: 'download', label: 'Download all supporting documents' }],
    };

    return html`
      ${demoStyles}
      <div class="bar-title-review__variant-list">
        ${(['expanded', 'compact', 'constrained'] as const).map(variant =>
          renderVariant(longContent, variant)
        )}
      </div>
    `;
  },
};
