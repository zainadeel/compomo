import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { MenuItemData } from '../Menu/menu-types';
import '../../../../dist/components/ds-panel-tool-search.js';
import '../../../../dist/components/ds-menu.js';

export default {
  title: 'Navigation/PanelToolsSearch',
  tags: ['autodocs'],
} satisfies Meta;

type Story = StoryObj;

export const Playground: Story = {
  render: () => html`
    <div style="width:var(--dimension-panel-width-xs);">
      <ds-panel-tool-search
        aria-label="Search chats"
        placeholder="Search chats"
      ></ds-panel-tool-search>
    </div>
  `,
};

export const TransparentOnShellWash: Story = {
  render: () => html`
    <div
      style="
        width:var(--dimension-panel-width-xs);
        background:
          radial-gradient(
            circle at top left,
            var(--color-background-faint-brand),
            transparent 70%
          ),
          var(--color-background-secondary);
      "
    >
      <ds-panel-tool-search
        aria-label="Search messages"
        placeholder="Search messages"
      ></ds-panel-tool-search>
    </div>
  `,
};

const agentFilterItems: MenuItemData[] = [
  { label: 'All chats', value: 'all', isSelected: true },
  { label: 'Unread', value: 'unread' },
  {
    label: 'Current page relevance',
    value: 'current-page',
  },
];

export const WithFilterMenu: Story = {
  render: () => {
    const toggleMenu = (event: CustomEvent<MouseEvent>) => {
      const search = event.currentTarget as HTMLDsPanelToolSearchElement;
      const menu = search.parentElement?.querySelector<HTMLDsMenuElement>('#agent-filter-menu');
      if (!menu) return;
      menu.open = !menu.open;
      search.filterExpanded = menu.open;
      menu.initialFocusVisible = event.detail.detail === 0;
    };
    const closeMenu = (event: Event) => {
      const menu = event.currentTarget as HTMLDsMenuElement;
      const search =
        menu.parentElement?.querySelector<HTMLDsPanelToolSearchElement>('#agent-filter-search');
      if (search) search.filterExpanded = false;
    };

    return html`
      <div style="width:var(--dimension-panel-width-xs);">
        <ds-panel-tool-search
          id="agent-filter-search"
          aria-label="Search agent chats"
          placeholder="Search chats"
          show-filter
          filter-trigger-id="agent-filter-trigger"
          filter-controls="agent-filter-menu"
          filter-aria-label="Filter agent chats"
          filter-active
          @dsFilterToggle=${toggleMenu}
        ></ds-panel-tool-search>
        <ds-menu
          id="agent-filter-menu"
          anchor-id="agent-filter-trigger"
          menu-label="Filter agent chats"
          selection-mode="single"
          side="bottom"
          align="end"
          anchor-alignment="choice-cell"
          side-offset="calc(var(--dimension-space-100) + var(--dimension-space-050))"
          .items=${agentFilterItems}
          @dsClose=${closeMenu}
        ></ds-menu>
      </div>
    `;
  },
};
