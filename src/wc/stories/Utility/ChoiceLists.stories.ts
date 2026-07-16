import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-menu.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-select-multi.js';

const ITEMS = [
  { label: 'First item', value: 'first', subtext: 'Shared secondary text' },
  { label: 'Second item', value: 'second', isInactive: true },
  { label: 'Third item', value: 'third' },
];

const meta: Meta = {
  title: 'Utility/Choice Lists',
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const SemanticParity: Story = {
  render: () => {
    let anchor: HTMLElement | undefined;
    let menu: HTMLDsMenuElement | undefined;
    const syncMenu = () => {
      if (!anchor || !menu) return;
      menu.anchor = anchor;
      menu.items = ITEMS;
      menu.open = true;
    };

    return html`
      <div style="display:flex;gap:var(--dimension-space-400);min-height:360px;">
        <div style="width:240px;">
          <ds-text as="div" variant="text-body-small" emphasis>Action menu</ds-text>
          <ds-button-unfilled
            label="Open actions"
            width="fill"
            ${ref(element => {
              anchor = element as HTMLElement;
              syncMenu();
            })}
          ></ds-button-unfilled>
          <ds-menu
            ${ref(element => {
              menu = element as HTMLDsMenuElement;
              syncMenu();
            })}
          ></ds-menu>
        </div>
        <div style="width:240px;">
          <ds-text as="div" variant="text-body-small" emphasis>Single-select listbox</ds-text>
          <ds-select
            .options=${ITEMS}
            value="first"
            open
            aria-label="Single choice"
          ></ds-select>
        </div>
        <div style="width:240px;">
          <ds-text as="div" variant="text-body-small" emphasis>Multi-select listbox</ds-text>
          <ds-select-multi
            .options=${ITEMS}
            .values=${['first', 'third']}
            placeholder="Multiple choices"
            open
            aria-label="Multiple choices"
          ></ds-select-multi>
        </div>
      </div>
    `;
  },
};
