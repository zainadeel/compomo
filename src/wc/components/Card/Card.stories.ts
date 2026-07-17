import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card.js';
import '../../../../dist/components/ds-text.js';

const WIDTHS = ['sm', 'md', 'lg'] as const;
const APPEARANCES = ['default', 'editing'] as const;

const meta: Meta = {
  title: 'Layout/Card',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    cardWidth: { control: 'select', options: [...WIDTHS] },
    appearance: { control: 'select', options: [...APPEARANCES] },
  },
  args: {
    heading: 'Card shell',
    cardWidth: 'md',
    appearance: 'default',
  },
};

export default meta;
type Story = StoryObj;

const renderCard = (heading: string, cardWidth: string, appearance: string) => html`
  <ds-card heading=${heading} card-width=${cardWidth} appearance=${appearance}>
    <div style="padding:var(--dimension-space-400);box-sizing:border-box;">
      <ds-text variant="text-body-medium" color="secondary">
        General and settings-compatible chrome — width + matching min-height,
        header, and flex body. Data-visualization cards use CardShellDataViz.
      </ds-text>
    </div>
  </ds-card>
`;

export const View: Story = {
  render: args => renderCard(args['heading'], args['cardWidth'], args['appearance']),
};

export const Empty: Story = {
  name: 'Empty body',
  render: args => html`
    <ds-card
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      appearance=${args['appearance']}
    ></ds-card>
  `,
};

export const Editing: Story = {
  args: { appearance: 'editing' },
  render: args => renderCard(args['heading'], args['cardWidth'], 'editing'),
};

/** Side-by-side sm / md / lg — check matching min-height at each width. */
export const Widths: Story = {
  parameters: { controls: { exclude: ['cardWidth'] } },
  render: args => html`
    <div
      style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--dimension-space-300);"
    >
      ${WIDTHS.map(width =>
        renderCard(`${args['heading']} (${width})`, width, args['appearance']),
      )}
    </div>
  `,
};
