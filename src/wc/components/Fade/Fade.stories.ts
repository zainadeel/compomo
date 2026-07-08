import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-fade.js';
import '../../../../dist/components/ds-app-shell.js';

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

const meta: Meta = {
  title: 'Utility/Fade',
  tags: ['autodocs'],
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

const FRAME =
  'width: 220px; height: 128px; border-radius: var(--dimension-radius-100); background: var(--color-background-secondary); color: var(--color-foreground-primary);';
const COPY = 'margin: 0; line-height: var(--typography-lineheight-md);';

const scrollItems = (count: number) =>
  Array.from(
    { length: count },
    (_, i) => html`
      <p style="${COPY}">
        Scroll item ${i + 1} — lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
    `,
  );

export const Playground: Story = {
  render: args => html`
    <ds-fade
      side=${args['side']}
      size=${args['size']}
      .visible=${args['visible']}
      style="${FRAME} padding: var(--dimension-space-150);"
    >
      ${scrollItems(8)}
    </ds-fade>
  `,
};

export const AllSides: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-200); flex-wrap: wrap">
      ${SIDES.map(side => {
        const isVertical = side === 'top' || side === 'bottom';
        return html`
          <div>
            <div
              style="font-size: var(--typography-fontsize-xs); color: var(--color-foreground-tertiary); margin-bottom: var(--dimension-space-075);"
            >
              ${side}
            </div>
            <ds-fade
              side=${side}
              size="size-500"
              style="${isVertical ? 'width: 180px; height: 104px;' : 'width: 200px; height: 88px;'} ${FRAME}"
            >
              ${scrollItems(isVertical ? 6 : 4)}
            </ds-fade>
          </div>
        `;
      })}
    </div>
  `,
};

export const Visibility: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-200); flex-wrap: wrap;">
      <ds-fade side="bottom" size="size-600" style="${FRAME} padding: var(--dimension-space-150);">
        ${scrollItems(8)}
      </ds-fade>
      <ds-fade
        side="bottom"
        size="size-600"
        .visible=${false}
        style="${FRAME} padding: var(--dimension-space-150);"
      >
        ${scrollItems(8)}
      </ds-fade>
    </div>
  `,
};

export const ShellGradientChrome: Story = {
  name: 'Shell gradient chrome',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Inside `ds-app-shell[gradient]`, scroll-edge masks let the fixed shell wash show through — ' +
          'no painted overlay or surface prop needed. Panel nav uses the same utility.',
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
        <ds-fade
          slot="panel"
          side="bottom"
          size="size-600"
          style="
            width: var(--dimension-size-2400);
            height: 100%;
            padding: var(--dimension-space-200);
            box-sizing: border-box;
            background: transparent;
          "
        >
          ${scrollItems(18)}
        </ds-fade>
        <div style="padding: var(--dimension-space-400); color: var(--color-foreground-secondary);">
          Scroll the panel column — bottom fade reveals shell gradient chrome through the mask.
        </div>
      </ds-app-shell>
    </div>
  `,
};
