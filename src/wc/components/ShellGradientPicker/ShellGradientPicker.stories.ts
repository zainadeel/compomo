import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-shell-gradient-picker.js';

const meta: Meta = {
  title: 'Navigation/ShellGradientPicker',
  tags: ['autodocs'],
  args: { value: 'neutral' },
  argTypes: {
    value: { control: 'select', options: ['cool', 'neutral', 'warm'] },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: args => html`
    <div style="padding: var(--dimension-space-200); background: var(--color-background-primary);">
      <ds-shell-gradient-picker value=${args['value']}></ds-shell-gradient-picker>
    </div>
  `,
};

export const Interactive: Story = {
  render: () => html`
    <div
      style="padding: var(--dimension-space-200); background: var(--color-background-primary);"
      ${ref(root => {
        if (!root) return;
        const picker = root.querySelector('ds-shell-gradient-picker') as HTMLElement & {
          value: string;
        } | null;
        const status = root.querySelector('#picker-status');
        if (!picker || !status) return;
        picker.addEventListener('dsChange', (e: Event) => {
          status.textContent = `Selected: ${(e as CustomEvent<string>).detail}`;
        });
      })}
    >
      <ds-shell-gradient-picker value="neutral"></ds-shell-gradient-picker>
      <p
        id="picker-status"
        style="margin: var(--dimension-space-100) 0 0; font-size: var(--typography-fontsize-xs); color: var(--color-foreground-secondary);"
      >
        Selected: neutral
      </p>
    </div>
  `,
};
