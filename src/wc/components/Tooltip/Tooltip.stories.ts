import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-tooltip.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-text.js';
import { TOKEN_DEFAULTS } from '../../utils/token-defaults';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';

const SIZES = ['md', 'sm', 'xs'] as const;

const meta: Meta = {
  title: 'Overlay/Tooltip',
  tags: ['autodocs'],
  parameters: {
    docs: isolatedOverlayDocs('520px'),
  },
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

export const ScrollAndResize: Story = {
  name: 'Scroll and Resize Tracking',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => html`
    <div style="padding:var(--dimension-space-300);display:grid;gap:var(--dimension-space-200);">
      <ds-text as="p" variant="text-body-medium" color="secondary">
        Tab to the bell, then scroll the container or resize the Storybook viewport. The open tooltip stays anchored.
      </ds-text>
      <div
        style="
          height:var(--dimension-panel-width-sm);
          overflow:auto;
          border:var(--dimension-stroke-width-012) solid var(--color-border-secondary);
          border-radius:var(--dimension-radius-025);
        "
      >
        <div
          style="
            min-height:var(--dimension-panel-width-lg);
            display:flex;
            align-items:flex-end;
            justify-content:center;
            padding:var(--dimension-space-400);
          "
        >
          <ds-tooltip label="Tracks the scrolling trigger" side="top" delay="0">
            <ds-button-filled variant="icon" icon="Bell" aria-label="Tracked action"></ds-button-filled>
          </ds-tooltip>
        </div>
      </div>
    </div>
  `,
};

export const CollisionFlip: Story = {
  name: 'Viewport Collision Flip',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: () => html`
    <div
      style="
        min-height:var(--dimension-panel-width-lg);
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        padding:var(--dimension-space-050);
      "
    >
      <ds-tooltip label="Requested top, resolved bottom" side="top" align="start" delay="0">
        <ds-button-filled variant="icon" icon="ArrowUp" aria-label="Top-edge action"></ds-button-filled>
      </ds-tooltip>
      <ds-tooltip label="Requested right, resolved left" side="right" align="end" delay="0">
        <ds-button-filled variant="icon" icon="ArrowRight" aria-label="Right-edge action"></ds-button-filled>
      </ds-tooltip>
    </div>
  `,
};

export const KeyboardAndWarmHandoff: Story = {
  name: 'Keyboard and Warm Handoff',
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:80px;display:grid;gap:var(--dimension-space-200);justify-content:center;">
      <ds-text as="p" variant="text-body-medium" color="secondary">
        Tab through the actions to open by keyboard; Escape dismisses. After one delayed tooltip opens,
        moving across the row opens adjacent tooltips immediately.
      </ds-text>
      <div style="display:flex;gap:var(--dimension-space-100);justify-content:center;">
        ${['Bell', 'Chart', 'DeviceMobile'].map((icon, index) => html`
          <ds-tooltip label=${`Action ${index + 1}`} side="bottom">
            <ds-button-filled
              variant="icon"
              icon=${icon}
              aria-label=${`Action ${index + 1}`}
            ></ds-button-filled>
          </ds-tooltip>
        `)}
      </div>
    </div>
  `,
};

export const DynamicTriggerReplacement: Story = {
  name: 'Dynamic Trigger Replacement',
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:80px;display:flex;align-items:center;gap:var(--dimension-space-200);">
      <ds-button-unfilled
        label="Replace trigger"
        @click=${(event: Event) => {
          const control = event.currentTarget as HTMLElement;
          const tooltip = control.nextElementSibling;
          if (!(tooltip instanceof HTMLElement)) return;
          const replacement = document.createElement('ds-button-filled');
          replacement.setAttribute('variant', 'icon');
          replacement.setAttribute('icon', tooltip.dataset['alternate'] === 'true' ? 'Bell' : 'Chart');
          replacement.setAttribute('aria-label', 'Replacement trigger');
          tooltip.dataset['alternate'] = tooltip.dataset['alternate'] === 'true' ? 'false' : 'true';
          tooltip.replaceChildren(replacement);
        }}
      ></ds-button-unfilled>
      <ds-tooltip label="Bound to the current slotted trigger" side="right" delay="0">
        <ds-button-filled variant="icon" icon="Bell" aria-label="Initial trigger"></ds-button-filled>
      </ds-tooltip>
    </div>
  `,
};

export const InputAndMotionPolicy: Story = {
  name: 'Touch and Reduced Motion Policy',
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:80px;display:grid;gap:var(--dimension-space-200);justify-content:center;">
      <ds-text as="p" variant="text-body-medium" color="secondary">
        Touch does not open visual-only tooltips. Mouse or hover-capable pen and keyboard focus do.
        Enable the operating system reduced-motion preference to verify that enter and exit are instant.
      </ds-text>
      <div style="display:flex;justify-content:center;">
        <ds-tooltip label="Supplementary visual label" side="bottom" delay="0">
          <ds-button-filled variant="icon" icon="Bell" aria-label="Notifications"></ds-button-filled>
        </ds-tooltip>
      </div>
    </div>
  `,
};
