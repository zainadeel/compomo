import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { BreadcrumbItem } from './breadcrumb-types';
import '../../../../dist/components/ds-breadcrumb.js';

const pagePath: BreadcrumbItem[] = [
  { id: 'page-1', label: 'Page', href: '#page-1' },
  { id: 'page-2', label: 'Page', href: '#page-2' },
  { id: 'page-3', label: 'Page', isCurrent: true },
];

const meta: Meta = {
  title: 'Navigation/Breadcrumb',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Breadcrumb shows a compact hierarchical page path. Ancestors are caption links with a secondary foreground, slash separators use tertiary foreground, and hover underlines use quaternary foreground. When space is constrained, ancestor labels collapse to an ellipsis from oldest to newest so the current location remains readable for longest. The current page is optional when a separate page title already supplies that context.',
      },
    },
  },
  argTypes: {
    ariaLabel: { control: 'text' },
  },
  args: {
    ariaLabel: 'Breadcrumb',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-breadcrumb aria-label=${args['ariaLabel']} .items=${pagePath}></ds-breadcrumb>
  `,
};

export const AncestorsOnly: Story = {
  name: 'Ancestors only',
  parameters: {
    docs: {
      description: {
        story:
          'Use an ancestor-only trail when a separate h1 immediately below the breadcrumb names the current page, as BarTitle does.',
      },
    },
  },
  render: () => html`
    <ds-breadcrumb
      .items=${[
        { id: 'workforce', label: 'Workforce', href: '#workforce' },
        { id: 'drivers', label: 'Drivers', href: '#drivers' },
      ]}
    ></ds-breadcrumb>
  `,
};

export const EventNavigation: Story = {
  name: 'Application-owned navigation',
  parameters: {
    docs: {
      description: {
        story:
          'Omit href when a client-side router owns navigation. The component emits the selected item through dsSelect.',
      },
    },
  },
  render: () => html`
    <ds-breadcrumb
      .items=${[
        { id: 'workforce', label: 'Workforce' },
        { id: 'drivers', label: 'Drivers' },
        { id: 'john-smith', label: 'John Smith', isCurrent: true },
      ]}
      @dsSelect=${(event: CustomEvent) =>
        console.log('[ds-breadcrumb] selected:', event.detail.item)}
    ></ds-breadcrumb>
  `,
};

export const LongPath: Story = {
  name: 'Long path',
  parameters: {
    docs: {
      description: {
        story:
          'Resize the canvas to see ordered truncation: the oldest ancestor reaches an ellipsis first, then the next ancestor, and only then the current location.',
      },
    },
  },
  render: () => html`
    <div style="width: var(--dimension-panel-width-sm);">
      <ds-breadcrumb
        .items=${[
          { id: 'operations', label: 'Operations and workforce management', href: '#operations' },
          { id: 'drivers', label: 'Active commercial vehicle drivers', href: '#drivers' },
          { id: 'profile', label: 'Driver profile and compliance details', isCurrent: true },
        ]}
      ></ds-breadcrumb>
    </div>
  `,
};
