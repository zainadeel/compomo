import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-tooltip.js';
import '../../../../dist/components/ds-button-filled.js';
import { TOKEN_DEFAULTS } from '../../utils/token-defaults';

const SIZES = ['md', 'sm', 'xs'] as const;

const meta: Meta = {
  title: 'Overlay/Tooltip',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    size: { control: 'select', options: [...SIZES] },
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    sideOffset: { control: 'text', description: 'px number or TokoMo length' },
    delay: {
      control: 'text',
      description:
        'Hover/focus show delay. Default --effect-animation-delay-medium-3 (1000ms). Number (ms) or TokoMo time token.',
    },
    shortcutKey: { control: 'text' },
  },
  args: {
    label: 'Helpful tooltip',
    size: 'md',
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
        size=${args['size'] ?? 'md'}
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
        <ds-button-filled variant="icon" icon="Bell" intent="brand" aria-label="Hover me"></ds-button-filled>
      </ds-tooltip>
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;gap:var(--dimension-space-200);justify-content:center;padding:80px;align-items:center;">
      ${SIZES.map(
        size => html`
          <ds-tooltip label="Tooltip ${size}" size=${size} side="top">
            <ds-button-filled
              variant="icon"
              size=${size}
              icon="Bell"
              intent="brand"
              aria-label=${`Size ${size}`}
            ></ds-button-filled>
          </ds-tooltip>
        `,
      )}
    </div>
  `,
};

export const Sides: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 80px; place-items: center">
      <div></div>
      <ds-tooltip label="Top tooltip" side="top">
        <ds-button-filled variant="icon" icon="ArrowUp" intent="brand" aria-label="Top"></ds-button-filled>
      </ds-tooltip>
      <div></div>

      <ds-tooltip label="Left tooltip" side="left">
        <ds-button-filled variant="icon" icon="ArrowLeft" intent="brand" aria-label="Left"></ds-button-filled>
      </ds-tooltip>
      <div></div>
      <ds-tooltip label="Right tooltip" side="right">
        <ds-button-filled variant="icon" icon="ArrowRight" intent="brand" aria-label="Right"></ds-button-filled>
      </ds-tooltip>

      <div></div>
      <ds-tooltip label="Bottom tooltip" side="bottom">
        <ds-button-filled variant="icon" icon="ArrowDown" intent="brand" aria-label="Bottom"></ds-button-filled>
      </ds-tooltip>
      <div></div>
    </div>
  `,
};

export const WithShortcut: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 80px; gap: var(--dimension-space-200);">
      <ds-tooltip label="Save file" size="md" shortcut-key="⌘S">
        <ds-button-filled variant="icon" icon="Check" intent="brand" aria-label="Save md"></ds-button-filled>
      </ds-tooltip>
      <ds-tooltip label="Save file" size="sm" shortcut-key="⌘S">
        <ds-button-filled variant="icon" size="sm" icon="Check" intent="brand" aria-label="Save sm"></ds-button-filled>
      </ds-tooltip>
      <ds-tooltip label="Save file" size="xs" shortcut-key="⌘S">
        <ds-button-filled variant="icon" size="xs" icon="Check" intent="brand" aria-label="Save xs"></ds-button-filled>
      </ds-tooltip>
    </div>
  `,
};
