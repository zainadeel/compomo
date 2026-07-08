import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-fade.js';
import '../../../../dist/components/ds-app-shell.js';
import '../../../../dist/components/ds-panel-nav.js';
import type { PanelNavGroup } from '../PanelNav/panel-nav-types';

const SIDES = ['top', 'bottom', 'left', 'right'] as const;
const SIZES = [
  'size-000',
  'size-050',
  'size-075',
  'size-100',
  'size-150',
  'size-200',
  'size-250',
  'size-300',
  'size-400',
  'size-500',
  'size-600',
  'size-800',
] as const;

/** Enough nav items to scroll — mirrors panel-nav story data. */
const SCROLL_DEMO_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'area-a', icon: 'MapPage', label: 'Area A' },
      { id: 'area-b', icon: 'ShieldCircle', label: 'Area B' },
      { id: 'area-c', icon: 'Chart', label: 'Area C' },
      { id: 'area-d', icon: 'FuelPump', label: 'Area D' },
      { id: 'area-e', icon: 'Card', label: 'Area E' },
      { id: 'area-f', icon: 'Wrench', label: 'Area F' },
      { id: 'area-g', icon: 'Person', label: 'Area G' },
    ],
  },
  {
    label: 'Section 1',
    items: [
      { id: 'area-h', icon: 'Whistle', label: 'Area H' },
      { id: 'area-i', icon: 'ShieldLock', label: 'Area I' },
      { id: 'area-j', icon: 'WorkflowA', label: 'Area J' },
      { id: 'area-k', icon: 'LocationPinArrows', label: 'Area K' },
      { id: 'area-l', icon: 'Devices', label: 'Area L' },
    ],
  },
  {
    label: 'Section 2',
    items: [
      { id: 'area-m', icon: 'AI', label: 'Area M' },
      { id: 'area-n', icon: 'MessageBubbleStack', label: 'Area N', dot: true },
      { id: 'area-o', icon: 'Document', label: 'Area O' },
      { id: 'area-p', icon: 'GraphArrow', label: 'Area P' },
      { id: 'area-q', icon: 'ShoppingBag', label: 'Area Q' },
      { id: 'area-r', icon: 'Beaker', label: 'Area R' },
    ],
  },
];

const meta: Meta = {
  title: 'Utility/Fade',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Scroll-edge alpha mask — content fades to transparent so the surface behind the ' +
          'scroll region shows through. Use a contrasting backdrop (or shell gradient) so the ' +
          'fade is visible; same-color fill behind the scroll area hides the effect.',
      },
    },
  },
  argTypes: {
    side: { control: 'select', options: SIDES },
    size: { control: 'select', options: SIZES },
    visible: { control: 'boolean' },
  },
  args: {
    side: 'bottom',
    size: 'size-600',
    visible: true,
  },
};

export default meta;
type Story = StoryObj;

const COPY = 'margin: 0 0 var(--dimension-space-150); line-height: var(--typography-lineheight-md);';

const scrollItems = (count: number) =>
  Array.from(
    { length: count },
    (_, i) => html`
      <p style="${COPY}">
        Scroll item ${i + 1} — lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
    `,
  );

const BACKDROP_FRAME = `
  padding: var(--dimension-space-100);
  box-sizing: border-box;
  border-radius: var(--dimension-radius-100);
  background: var(--color-background-primary);
`;

const SCROLL_SURFACE = `
  height: 100%;
  background: var(--color-background-secondary);
  border-radius: var(--dimension-radius-075);
  padding: var(--dimension-space-150);
  box-sizing: border-box;
  color: var(--color-foreground-primary);
`;

export const Playground: Story = {
  render: args => html`
    <div style="width: 240px; height: 200px; ${BACKDROP_FRAME}">
      <ds-fade
        side=${args['side']}
        size=${args['size']}
        .visible=${args['visible']}
        style="${SCROLL_SURFACE}"
      >
        ${scrollItems(10)}
      </ds-fade>
    </div>
  `,
};

export const AllSides: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-200); flex-wrap: wrap;">
      ${SIDES.map(side => {
        const isVertical = side === 'top' || side === 'bottom';
        const frameHeight = isVertical ? '180px' : '140px';
        const frameWidth = isVertical ? '220px' : '260px';
        return html`
          <div>
            <div
              style="
                font-size: var(--typography-fontsize-xs);
                color: var(--color-foreground-tertiary);
                margin-bottom: var(--dimension-space-075);
              "
            >
              ${side}
            </div>
            <div style="width: ${frameWidth}; height: ${frameHeight}; ${BACKDROP_FRAME}">
              <ds-fade side=${side} size="size-500" style="${SCROLL_SURFACE}">
                ${scrollItems(isVertical ? 10 : 6)}
              </ds-fade>
            </div>
          </div>
        `;
      })}
    </div>
  `,
};

export const Visibility: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-300); flex-wrap: wrap;">
      ${[true, false].map(visible => html`
        <div>
          <p
            style="
              margin: 0 0 var(--dimension-space-100);
              font-size: var(--typography-fontsize-xs);
              color: var(--color-foreground-tertiary);
            "
          >
            ${visible ? 'visible' : 'hidden'}
          </p>
          <div style="width: 240px; height: 200px; ${BACKDROP_FRAME}">
            <ds-fade side="bottom" size="size-600" .visible=${visible} style="${SCROLL_SURFACE}">
              ${scrollItems(10)}
            </ds-fade>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const ShellGradientChrome: Story = {
  name: 'Shell gradient (panel nav)',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Production usage: `ds-panel-nav` masks its scroll body so shell gradient chrome shows ' +
          'through the bottom edge. Same `scroll-edge-fade` utility as `<ds-fade>`.',
      },
    },
  },
  render: () => html`
    <div
      style="
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      "
    >
      <ds-app-shell nav-style="dashboard" gradient style="height: 100%;">
        <ds-panel-nav
          slot="panel"
          nav-style="dashboard"
          .groups=${SCROLL_DEMO_GROUPS}
          active-id="area-a"
          user-name="Zain Adeel"
          user-initial="Z"
        ></ds-panel-nav>
        <div style="padding: var(--dimension-space-400); color: var(--color-foreground-secondary);">
          Scroll the panel nav — bottom edge fades into the shell wash.
        </div>
      </ds-app-shell>
    </div>
  `,
};
