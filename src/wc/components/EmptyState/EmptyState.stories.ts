import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-empty-state.js';

const meta: Meta = {
  title: 'Utility/Empty State',
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
    <div style="padding:var(--dimension-space-200);height:240px;border:1px solid var(--color-border-primary);">
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
