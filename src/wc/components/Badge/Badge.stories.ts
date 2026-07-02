import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { buildShellRadialGradient } from '../../nav/shell-gradient';
import '../../../../dist/components/ds-badge.js';

const COUNTS = [1, 5, 9, 10, 99];
const VARIANTS = ['counter', 'dot'] as const;
const SURFACES = ['default', 'primary', 'secondary', 'medium', 'bold', 'strong', 'navigation', 'always-dark'] as const;

const STORY_SURFACE_BG: Record<(typeof SURFACES)[number], string> = {
  default: 'var(--color-background-secondary)',
  primary: 'var(--color-background-primary)',
  secondary: 'var(--color-background-secondary)',
  medium: 'var(--color-background-medium-neutral)',
  bold: 'var(--color-background-bold-neutral)',
  strong: 'var(--color-background-strong-neutral)',
  navigation: 'var(--color-navigation-background)',
  'always-dark': 'var(--color-always-dark-background)',
};

const STORY_SURFACE_FG: Record<(typeof SURFACES)[number], string> = {
  default: 'var(--color-foreground-secondary)',
  primary: 'var(--color-foreground-secondary)',
  secondary: 'var(--color-foreground-secondary)',
  medium: 'var(--color-foreground-strong-neutral)',
  bold: 'var(--color-foreground-on-bold-background-primary)',
  strong: 'var(--color-foreground-on-bold-background-primary)',
  navigation: 'var(--color-navigation-foreground-primary)',
  'always-dark': 'var(--color-always-dark-foreground-primary)',
};

const REVIEW_CELL = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--dimension-size-700);
  height: var(--dimension-size-700);
  border-radius: var(--dimension-radius-200);
`;

const BADGE_TARGET = `
  position: relative;
  width: var(--dimension-size-300);
  height: var(--dimension-size-300);
  border-radius: var(--dimension-radius-100);
  background: currentColor;
  opacity: 0.8;
`;

const BADGE_ANCHOR = `
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
`;

const meta: Meta = {
  title: 'Primitives/Badge',
  tags: ['autodocs'],
  argTypes: {
    variant:    { control: 'select', options: VARIANTS },
    count:      { control: 'number' },
    max:        { control: 'number' },
    surface:    { control: 'select', options: SURFACES },
    background: { control: 'text' },
    onGradientBackground: { control: 'boolean', name: 'on-gradient-background' },
    label:      { control: 'text' },
  },
  args: {
    variant: 'counter',
    count: 3,
    max: 9,
    surface: 'default',
    background: '',
    onGradientBackground: false,
    label: '',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-badge
      variant=${args['variant']}
      count=${args['count']}
      max=${args['max']}
      surface=${args['surface']}
      background=${args['background'] || undefined}
      ?on-gradient-background=${args['onGradientBackground']}
      label=${args['label'] || undefined}
    ></ds-badge>
  `,
};

export const Counters: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-200); align-items: center; flex-wrap: wrap">
      ${COUNTS.map(c => html`
        <div style="${REVIEW_CELL}; background: var(--color-background-secondary); color: var(--color-foreground-secondary);">
          <div style="${BADGE_TARGET}">
            <ds-badge
              style="${BADGE_ANCHOR}"
              count=${c}
              background="var(--color-background-secondary)"
              label="${c} notifications"
            ></ds-badge>
          </div>
        </div>
      `)}
      <div style="display: flex; gap: var(--dimension-space-200); align-items: center">
        <span style="font-size: var(--typography-fontsize-xs); color: var(--color-foreground-tertiary);">zero hides:</span>
        <ds-badge count="0"></ds-badge>
      </div>
    </div>
  `,
};

export const Dots: Story = {
  name: 'Dots',
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--dimension-space-200);">
      ${SURFACES.map(surface => html`
        <div style="display: flex; flex-direction: column; gap: var(--dimension-space-075);">
          <div style="${REVIEW_CELL}; background: ${STORY_SURFACE_BG[surface]}; color: ${STORY_SURFACE_FG[surface]};">
            <div style="${BADGE_TARGET}">
              <ds-badge
                style="${BADGE_ANCHOR}"
                variant="dot"
                background=${STORY_SURFACE_BG[surface]}
                label="${surface} notification"
              ></ds-badge>
            </div>
          </div>
          <span style="font-size: var(--typography-fontsize-xs); color: var(--color-foreground-secondary);">${surface}</span>
        </div>
      `)}
    </div>
  `,
};

export const CounterAndDot: Story = {
  name: 'Counter + Dot',
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--dimension-space-200);">
      ${SURFACES.map(surface => html`
        <div style="display: flex; flex-direction: column; gap: var(--dimension-space-075);">
          <div style="${REVIEW_CELL}; gap: var(--dimension-space-300); background: ${STORY_SURFACE_BG[surface]}; color: ${STORY_SURFACE_FG[surface]};">
            <div style="${BADGE_TARGET}">
              <ds-badge
                style="${BADGE_ANCHOR}"
                variant="dot"
                background=${STORY_SURFACE_BG[surface]}
                label="${surface} dot notification"
              ></ds-badge>
            </div>
            <div style="${BADGE_TARGET}">
              <ds-badge
                style="${BADGE_ANCHOR}"
                count="3"
                background=${STORY_SURFACE_BG[surface]}
                label="3 notifications"
              ></ds-badge>
            </div>
          </div>
          <span style="font-size: var(--typography-fontsize-xs); color: var(--color-foreground-secondary);">${surface}</span>
        </div>
      `)}
    </div>
  `,
};

export const OnGradientBackground: Story = {
  name: 'On gradient background',
  parameters: {
    docs: {
      description: {
        story:
          'Dot rings on gradient chrome use `on-gradient-background` with `background-attachment: fixed` ' +
          'so the wash aligns with `ds-app-shell` viewport chrome.',
      },
    },
  },
  render: () => {
    const wash = buildShellRadialGradient();
    return html`
      <div
        style="
          position: relative;
          display: flex;
          gap: var(--dimension-space-400);
          align-items: center;
          padding: var(--dimension-space-400);
          border-radius: var(--dimension-radius-200);
          background-color: var(--color-background-secondary);
          --ds-shell-gradient-image: ${wash};
          --ds-shell-gradient-size: 480px 240px;
          --ds-shell-gradient-opacity: 0.1;
        "
      >
        <div
          aria-hidden="true"
          style="
            position: absolute;
            inset: 0;
            border-radius: inherit;
            pointer-events: none;
            opacity: var(--ds-shell-gradient-opacity);
            background-image: var(--ds-shell-gradient-image);
            background-size: var(--ds-shell-gradient-size);
            background-position: 0 0;
            background-repeat: no-repeat;
            background-attachment: fixed;
          "
        ></div>
        <div style="position: relative; display: flex; flex-direction: column; gap: var(--dimension-space-100); align-items: center;">
          <div style="${BADGE_TARGET}; color: var(--color-foreground-secondary);">
            <ds-badge
              style="${BADGE_ANCHOR}"
              variant="dot"
              background="var(--color-background-secondary)"
              label="flat ring"
            ></ds-badge>
          </div>
          <span style="font-size: var(--typography-fontsize-xs); color: var(--color-foreground-secondary);">flat ring</span>
        </div>
        <div style="position: relative; display: flex; flex-direction: column; gap: var(--dimension-space-100); align-items: center;">
          <div style="${BADGE_TARGET}; color: var(--color-foreground-secondary);">
            <ds-badge
              style="${BADGE_ANCHOR}; --_badge-gradient-position: 0 0;"
              variant="dot"
              background="var(--color-background-secondary)"
              on-gradient-background
              label="gradient ring"
            ></ds-badge>
          </div>
          <span style="font-size: var(--typography-fontsize-xs); color: var(--color-foreground-secondary);">on-gradient-background</span>
        </div>
      </div>
    `;
  },
};

export const CustomRing: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-200); align-items: center; flex-wrap: wrap">
      <div style="${REVIEW_CELL}; background: var(--color-background-bold-brand); color: var(--color-foreground-on-bold-background-primary);">
        <div style="${BADGE_TARGET}">
          <ds-badge
            style="${BADGE_ANCHOR}"
            variant="dot"
            background="var(--color-background-bold-brand)"
            label="custom ring dot"
          ></ds-badge>
        </div>
      </div>
      <div style="${REVIEW_CELL}; background: var(--color-background-bold-brand); color: var(--color-foreground-on-bold-background-primary);">
        <div style="${BADGE_TARGET}">
          <ds-badge
            style="${BADGE_ANCHOR}"
            count="7"
            background="var(--color-background-bold-brand)"
            label="7 notifications"
          ></ds-badge>
        </div>
      </div>
    </div>
  `,
};
