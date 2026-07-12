import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-shell-gradient-picker.js';
import {
  buildShellRadialGradientFromStops,
  type ShellGradientStop,
} from '../../nav/shell-gradient-presets';

const WORKSHOP_STOP_INDEXES = [1, 2, 3, 4, 5] as const;
const INTENT_HUES = [
  'blue',
  'cyan',
  'green',
  'grey',
  'magenta',
  'olive',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
] as const;
const INTENT_STRENGTHS = ['faint', 'medium', 'bold', 'strong'] as const;
const WORKSHOP_COLOR_TOKENS = [
  '--color-background-transparent',
  ...INTENT_HUES.flatMap(hue =>
    INTENT_STRENGTHS.map(strength => `--color-color-intent-${hue}-${strength}-background`),
  ),
];

const colorTokenControl = (category: string) => ({
  control: { type: 'select' as const },
  options: WORKSHOP_COLOR_TOKENS,
  table: { category },
});

const meta: Meta = {
  title: 'Navigation/ShellGradientPicker',
  tags: ['autodocs'],
  args: { value: 'neutral' },
  argTypes: {
    value: { control: 'select', options: ['none', 'cool', 'neutral', 'warm', 'fresh'] },
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

export const RecipeWorkshop: Story = {
  name: 'Recipe workshop',
  args: {
    color1: '--color-background-transparent',
    position1: 0,
    color2: '--color-color-intent-blue-strong-background',
    position2: 35,
    color3: '--color-color-intent-purple-strong-background',
    position3: 60,
    color4: '--color-color-intent-magenta-strong-background',
    position4: 80,
    color5: '--color-color-intent-yellow-strong-background',
    position5: 100,
    opacity: 1,
  },
  argTypes: {
    color1: colorTokenControl('Stop 1'),
    position1: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: { category: 'Stop 1' },
    },
    color2: colorTokenControl('Stop 2'),
    position2: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: { category: 'Stop 2' },
    },
    color3: colorTokenControl('Stop 3'),
    position3: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: { category: 'Stop 3' },
    },
    color4: colorTokenControl('Stop 4'),
    position4: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: { category: 'Stop 4' },
    },
    color5: colorTokenControl('Stop 5'),
    position5: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      table: { category: 'Stop 5' },
    },
    opacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      table: { category: 'Layer' },
    },
  },
  render: args => {
    const stops: ShellGradientStop[] = WORKSHOP_STOP_INDEXES.map(index => ({
      color: `var(${String(args[`color${index}`])})`,
      position: Number(args[`position${index}`]),
    }));
    const gradient = buildShellRadialGradientFromStops(stops);
    const opacity = Number(args['opacity']);

    return html`
      <div
        style="position: relative; display: grid; grid-template-columns: 180px 1fr 48px; grid-template-rows: 48px 360px; overflow: hidden; background: var(--color-background-secondary); color: var(--color-foreground-primary);"
      >
        <div
          aria-hidden="true"
          style=${`position: absolute; inset: 0; background-image: ${gradient}; background-size: 100% 100%; opacity: ${opacity};`}
        ></div>
        <div style="position: relative; grid-row: 1 / 3; border-right: var(--dimension-stroke-width-012) solid var(--color-border-tertiary); padding: var(--dimension-space-200);">
          Panel navigation
        </div>
        <div style="position: relative; grid-column: 2; border-bottom: var(--dimension-stroke-width-012) solid var(--color-border-tertiary); padding: var(--dimension-space-150);">
          Bar navigation
        </div>
        <div style="position: relative; grid-column: 3; grid-row: 1 / 3; border-left: var(--dimension-stroke-width-012) solid var(--color-border-tertiary); padding: var(--dimension-space-100); writing-mode: vertical-rl;">
          Tools
        </div>
        <div style="position: relative; grid-column: 2; grid-row: 2; margin: 0; padding: var(--dimension-space-300); background: var(--color-background-primary);">
          Page content
        </div>
      </div>
    `;
  },
};
