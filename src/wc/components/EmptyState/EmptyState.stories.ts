import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-empty-state.js';

const meta: Meta = {
  title: 'Data/EmptyState',
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['no-content', 'no-results', 'no-results-filter', 'no-access'],
    },
    message: { control: 'text' },
  },
  args: { type: 'no-results' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="padding: 16px; height: 300px; border: 1px solid var(--color-border-primary)">
      <ds-empty-state
        type=${args['type'] ?? 'no-results'}
        message=${args['message'] ?? ''}
      ></ds-empty-state>
    </div>
  `,
};

export const NoContent: Story = {
  render: () => html`<div style="height: 300px"><ds-empty-state type="no-content"></ds-empty-state></div>`,
};

export const NoAccess: Story = {
  render: () => html`<div style="height: 300px"><ds-empty-state type="no-access"></ds-empty-state></div>`,
};

export const CustomMessage: Story = {
  render: () => html`<div style="height: 300px"><ds-empty-state message="No vehicles match your search."></ds-empty-state></div>`,
};
