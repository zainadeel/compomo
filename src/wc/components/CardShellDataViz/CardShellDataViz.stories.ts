import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-shell-data-viz.js';
import '../../../../dist/components/ds-button-unfilled.js';

const WIDTHS = ['sm', 'md', 'lg'] as const;

const meta: Meta = {
  title: 'Data Viz/CardShellDataViz',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    cardWidth: { control: 'select', options: [...WIDTHS] },
  },
  args: {
    heading: 'Data visualization',
    cardWidth: 'md',
  },
};

export default meta;
type Story = StoryObj;

const renderShell = (heading: string, cardWidth: string) => html`
  <ds-card-shell-data-viz heading=${heading} card-width=${cardWidth}>
    <ds-button-unfilled
      slot="actions"
      variant="icon"
      icon="Filters"
      aria-label="Filter data"
    ></ds-button-unfilled>
    <div style="padding:var(--dimension-space-400);box-sizing:border-box;">
      <ds-text variant="text-body-medium" color="secondary">
        Dedicated data-visualization chrome. Composing cards own chart layout,
        legends, interaction, and empty states.
      </ds-text>
    </div>
  </ds-card-shell-data-viz>
`;

export const View: Story = {
  render: args => renderShell(args['heading'], args['cardWidth']),
};

export const Empty: Story = {
  name: 'Empty body',
  render: args => html`
    <ds-card-shell-data-viz
      heading=${args['heading']}
      card-width=${args['cardWidth']}
    ></ds-card-shell-data-viz>
  `,
};

export const Widths: Story = {
  parameters: { controls: { exclude: ['cardWidth'] } },
  render: args => html`
    <div style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--dimension-space-300);">
      ${WIDTHS.map(width => renderShell(`${args['heading']} (${width})`, width))}
    </div>
  `,
};
