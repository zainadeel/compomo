import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-avatar.js';

const ICONS = ['Person', 'PersonGroup', 'SpeakerPhone'] as const;

const meta: Meta = {
  title: 'Primitives/Avatar',
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'select', options: ICONS },
    iconColor: { control: 'select', options: ['primary', 'secondary'] },
    size: { control: 'select', options: ['md', 'sm', 'xs'] },
    label: { control: 'text' },
  },
  args: {
    icon: 'Person',
    iconColor: 'secondary',
    size: 'md',
    label: '',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-avatar
      icon=${args['icon']}
      icon-color=${args['iconColor']}
      size=${args['size']}
      label=${args['label'] || undefined}
    ></ds-avatar>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;align-items:center;gap:var(--dimension-space-100)">
      <ds-avatar size="md" icon="Person" label="Medium avatar"></ds-avatar>
      <ds-avatar size="sm" icon="Person" label="Small avatar"></ds-avatar>
      <ds-avatar size="xs" icon="Person" label="Extra-small avatar"></ds-avatar>
    </div>
  `,
};

export const ConversationTypes: Story = {
  render: () => html`
    <div style="display:flex;align-items:center;gap:var(--dimension-space-100)">
      <ds-avatar icon="Person" label="Direct chat"></ds-avatar>
      <ds-avatar icon="PersonGroup" label="Group chat"></ds-avatar>
      <ds-avatar icon="SpeakerPhone" label="Broadcast"></ds-avatar>
    </div>
  `,
};

export const IconHierarchy: Story = {
  render: () => html`
    <div style="display:flex;align-items:center;gap:var(--dimension-space-100)">
      <ds-avatar icon="Person" icon-color="primary" label="Prominent identity"></ds-avatar>
      <ds-avatar icon="Person" icon-color="secondary" label="Default identity"></ds-avatar>
    </div>
  `,
};
