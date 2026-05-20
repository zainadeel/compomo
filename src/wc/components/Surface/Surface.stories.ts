import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-surface.js';

const meta: Meta = {
  title: 'Layout/Surface',
  tags: ['autodocs'],
  argTypes: {
    background: { control: 'select', options: ['transparent', 'primary', 'secondary', 'translucent'] },
    intent:     { control: 'select', options: ['', 'brand', 'positive', 'negative', 'warning', 'caution', 'ai', 'neutral'] },
    contrast:   { control: 'select', options: ['faint', 'medium', 'bold', 'strong'] },
    elevation:  { control: 'select', options: ['none', 'flat', 'elevated', 'floating', 'overlayTop', 'overlayRight', 'overlayBottom', 'overlayLeft'] },
    radius:     { control: 'select', options: ['', 'none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'] },
    interactive: { control: 'boolean' },
    selected:    { control: 'boolean' },
    inactive:    { control: 'boolean' },
  },
  args: { background: 'primary', contrast: 'faint', elevation: 'none', interactive: false, selected: false, inactive: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-surface
      background=${args['background'] ?? 'primary'}
      intent=${args['intent'] ?? ''}
      contrast=${args['contrast'] ?? 'faint'}
      elevation=${args['elevation'] ?? 'none'}
      radius=${args['radius'] ?? ''}
      ?interactive=${args['interactive']}
      ?selected=${args['selected']}
      ?inactive=${args['inactive']}
      style="padding: 24px; min-width: 200px"
    >
      Surface content
    </ds-surface>
  `,
};

export const Backgrounds: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; flex-wrap: wrap">
      <ds-surface background="transparent" radius="md" style="padding: 16px; border: 1px dashed #ccc">Transparent</ds-surface>
      <ds-surface background="primary" radius="md" style="padding: 16px">Primary</ds-surface>
      <ds-surface background="secondary" radius="md" style="padding: 16px">Secondary</ds-surface>
    </div>
  `,
};

export const Intents: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; flex-wrap: wrap">
      ${['brand', 'positive', 'negative', 'warning', 'caution', 'ai', 'neutral'].map(intent => html`
        <ds-surface intent=${intent} contrast="faint" radius="md" style="padding: 16px">${intent}</ds-surface>
      `)}
    </div>
  `,
};

export const Elevations: Story = {
  render: () => html`
    <div style="display: flex; gap: 24px; flex-wrap: wrap; background: var(--color-background-secondary); padding: 32px">
      ${['none', 'flat', 'elevated', 'floating'].map(elev => html`
        <ds-surface background="primary" elevation=${elev} radius="md" style="padding: 24px; min-width: 100px; text-align: center">${elev}</ds-surface>
      `)}
    </div>
  `,
};

export const Interactive: Story = {
  render: () => html`
    <ds-surface background="primary" elevation="elevated" radius="lg" interactive style="padding: 24px; cursor: pointer; display: inline-block">
      Click me
    </ds-surface>
  `,
};
