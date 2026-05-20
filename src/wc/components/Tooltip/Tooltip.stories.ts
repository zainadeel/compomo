import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-tooltip.js';
import '../../../../dist/components/ds-button.js';

const meta: Meta = {
  title: 'Overlay/Tooltip',
  tags: ['autodocs'],
  argTypes: {
    label:      { control: 'text' },
    side:       { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align:      { control: 'select', options: ['start', 'center', 'end'] },
    sideOffset: { control: 'number' },
    shortcutKey: { control: 'text' },
  },
  args: { label: 'Helpful tooltip', side: 'top', align: 'center', sideOffset: 4 },
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
        side-offset=${args['sideOffset'] ?? 4}
        shortcut-key=${args['shortcutKey'] ?? ''}
      >
        <ds-button label="Hover me" intent="brand"></ds-button>
      </ds-tooltip>
    </div>
  `,
};

export const Sides: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 80px; place-items: center">
      <div></div>
      <ds-tooltip label="Top tooltip" side="top">
        <ds-button label="Top" size="sm"></ds-button>
      </ds-tooltip>
      <div></div>

      <ds-tooltip label="Left tooltip" side="left">
        <ds-button label="Left" size="sm"></ds-button>
      </ds-tooltip>
      <div></div>
      <ds-tooltip label="Right tooltip" side="right">
        <ds-button label="Right" size="sm"></ds-button>
      </ds-tooltip>

      <div></div>
      <ds-tooltip label="Bottom tooltip" side="bottom">
        <ds-button label="Bottom" size="sm"></ds-button>
      </ds-tooltip>
      <div></div>
    </div>
  `,
};

export const WithShortcut: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 80px">
      <ds-tooltip label="Save file" shortcut-key="⌘S">
        <ds-button label="Save" intent="brand"></ds-button>
      </ds-tooltip>
    </div>
  `,
};
