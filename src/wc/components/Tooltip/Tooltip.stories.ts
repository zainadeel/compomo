import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-tooltip.js';
import '../../../../dist/components/ds-button-filled.js';
import { TOKEN_DEFAULTS } from '../../utils/token-defaults';

const meta: Meta = {
  title: 'Overlay/Tooltip',
  tags: ['autodocs'],
  argTypes: {
    label:      { control: 'text' },
    side:       { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align:      { control: 'select', options: ['start', 'center', 'end'] },
    sideOffset: { control: 'text', description: 'px number or TokoMo length' },
    shortcutKey: { control: 'text' },
  },
  args: {
    label: 'Helpful tooltip',
    side: 'top',
    align: 'center',
    sideOffset: TOKEN_DEFAULTS.space050,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="display: flex; justify-content: center; padding: 80px">
      <ds-tooltip
        label=${args['label'] ?? 'Helpful tooltip'}
        side=${args['side'] ?? 'top'}
        align=${args['align'] ?? 'center'}
        shortcut-key=${args['shortcutKey'] ?? ''}
        ${ref(el => {
          if (!el) return;
          const tip = el as HTMLElement & { sideOffset: number | string };
          const raw = args['sideOffset'] ?? TOKEN_DEFAULTS.space050;
          tip.sideOffset = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw;
        })}
      >
        <ds-button-filled icon="Bell" intent="brand" aria-label="Hover me"></ds-button-filled>
      </ds-tooltip>
    </div>
  `,
};

export const Sides: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 80px; place-items: center">
      <div></div>
      <ds-tooltip label="Top tooltip" side="top">
        <ds-button-filled icon="ArrowUp" intent="brand" aria-label="Top"></ds-button-filled>
      </ds-tooltip>
      <div></div>

      <ds-tooltip label="Left tooltip" side="left">
        <ds-button-filled icon="ArrowLeft" intent="brand" aria-label="Left"></ds-button-filled>
      </ds-tooltip>
      <div></div>
      <ds-tooltip label="Right tooltip" side="right">
        <ds-button-filled icon="ArrowRight" intent="brand" aria-label="Right"></ds-button-filled>
      </ds-tooltip>

      <div></div>
      <ds-tooltip label="Bottom tooltip" side="bottom">
        <ds-button-filled icon="ArrowDown" intent="brand" aria-label="Bottom"></ds-button-filled>
      </ds-tooltip>
      <div></div>
    </div>
  `,
};

export const WithShortcut: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 80px">
      <ds-tooltip label="Save file" shortcut-key="⌘S">
        <ds-button-filled icon="Check" intent="brand" aria-label="Save"></ds-button-filled>
      </ds-tooltip>
    </div>
  `,
};
