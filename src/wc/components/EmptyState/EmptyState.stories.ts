import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-empty-state.js';
import '../../../../dist/components/ds-button-unfilled.js';

const meta: Meta = {
  title: 'Utility/EmptyState',
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'text' },
    heading: { control: 'text' },
    body: { control: 'text' },
  },
  args: {
    icon: 'MagnifyingGlass',
    heading: 'No results found',
    body: 'Try adjusting your search or filters.',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div
      style="padding:var(--dimension-space-200);height:240px;border:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);"
    >
      <ds-empty-state
        icon=${args['icon'] ?? ''}
        heading=${args['heading'] ?? ''}
        body=${args['body'] ?? ''}
      ></ds-empty-state>
    </div>
  `,
};

export const IconTitleBody: Story = {
  render: () => html`
    <div style="height:240px;">
      <ds-empty-state
        icon="MagnifyingGlass"
        heading="No results found"
        body="Try adjusting your search or filters."
      ></ds-empty-state>
    </div>
  `,
};

export const TitleBody: Story = {
  render: () => html`
    <div style="height:240px;">
      <ds-empty-state
        heading="Nothing here yet"
        body="Content will appear here when it becomes available."
      ></ds-empty-state>
    </div>
  `,
};

export const BodyOnly: Story = {
  render: () => html`
    <div style="height:var(--dimension-size-600);">
      <ds-empty-state body="No results found"></ds-empty-state>
    </div>
  `,
};

export const WithAction: Story = {
  render: () => html`
    <div style="height:240px;">
      <ds-empty-state
        icon="MapPage"
        heading="No entities in the visible map area"
        body="Pan or zoom out to explore entities elsewhere on the map."
      >
        <ds-button-unfilled slot="actions" label="Zoom to fit"></ds-button-unfilled>
      </ds-empty-state>
    </div>
  `,
};
