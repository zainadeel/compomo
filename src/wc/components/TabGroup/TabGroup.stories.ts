import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-tab-group.js';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
  { id: 'members',  label: 'Members' },
];

const meta: Meta = {
  title: 'Navigation/TabGroup',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'select', options: tabs.map(t => t.id) },
    background: { control: 'select', options: ['', 'faint', 'medium', 'bold', 'strong', 'always-dark'] },
  },
  args: { value: 'overview' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width: 400px">
      <ds-tab-group
        .tabs=${tabs}
        value=${args['value'] ?? 'overview'}
        background=${args['background'] ?? ''}
        aria-label="Playground tabs"
      ></ds-tab-group>
    </div>
  `,
};

export const WithDisabled: Story = {
  render: () => html`
    <ds-tab-group
      .tabs=${[
        { id: 'overview', label: 'Overview' },
        { id: 'activity', label: 'Activity', disabled: true },
        { id: 'settings', label: 'Settings' },
      ]}
      value="overview"
      aria-label="Tabs with disabled item"
    ></ds-tab-group>
  `,
};

export const TwoTabs: Story = {
  render: () => html`
    <ds-tab-group
      .tabs=${[{ id: 'list', label: 'List' }, { id: 'grid', label: 'Grid' }]}
      value="list"
      aria-label="View mode"
    ></ds-tab-group>
  `,
};
