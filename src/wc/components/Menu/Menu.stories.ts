import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-menu.js';
import '../../../../dist/components/ds-icon.js';
import '../../../../dist/components/ds-switch.js';
import '../../../../dist/components/ds-swatch-picker.js';
import '../../../../dist/components/ds-tag.js';
import { TOKEN_CSS_LENGTHS } from '../../utils/token-defaults';
import { PANEL_NAV_USER_MENU_PLACEMENT } from './menu-placement';
import { shellGradientPickerSections } from '../../shell/shell-gradient-presets';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import type { MenuItemData, MenuReorderDetail } from './menu-types';

const items = [
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Archive', value: 'archive', isInactive: true },
  { label: 'Delete', value: 'delete', isDestructive: true },
];

const meta: Meta = {
  title: 'Overlay/Menu',
  tags: ['autodocs'],
  parameters: {
    docs: {
      ...isolatedOverlayDocs('420px'),
      description: {
        component:
          'Controlled anchored action menu. The application owns open and item state: dsSelect and dsReorder report intent ' +
          'without mutating selection or order, or closing automatically, while dsAfterClose marks the end of exit rendering. ' +
          'The requested side is preferred and flips to its opposite when collision space is better there.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ['lg', 'md', 'sm', 'xs'] },
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    anchorAlignment: { control: 'select', options: ['choice-cell', 'popup-frame'] },
    sideOffset: {
      control: 'text',
      description: 'px number or TokoMo length (e.g. var(--dimension-space-200))',
    },
  },
  args: {
    size: 'md',
    side: 'bottom',
    align: 'start',
    anchorAlignment: 'choice-cell',
    sideOffset: TOKEN_CSS_LENGTHS.space050,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="padding: 16px; height: 320px">
      <span id="menu-anchor-pg" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        .items=${items}
        size=${args['size'] ?? 'md'}
        side=${args['side'] ?? 'bottom'}
        align=${args['align'] ?? 'start'}
        anchorAlignment=${args['anchorAlignment'] ?? 'choice-cell'}
        anchor-id="menu-anchor-pg"
        ${ref(el => {
          if (!el) return;
          const menu = el as HTMLElement & { sideOffset: number | string };
          const raw = args['sideOffset'] ?? TOKEN_CSS_LENGTHS.space050;
          menu.sideOffset = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw;
        })}
      ></ds-menu>
    </div>
  `,
};

export const Empty: Story = {
  render: () => html`
    <div style="padding:var(--dimension-space-200); min-height:var(--dimension-card-height-sm)">
      <button id="empty-menu-anchor" type="button" aria-haspopup="dialog">Organization</button>
      <ds-menu
        open
        anchor-id="empty-menu-anchor"
        menu-label="Settings profiles"
        empty-message="You have no profiles to manage yet"
      ></ds-menu>
    </div>
  `,
};

export const CollisionAwarePlacement: Story = {
  name: 'Collision-aware placement',
  render: () => html`
    <div
      style="
        display:flex;
        align-items:flex-end;
        justify-content:center;
        box-sizing:border-box;
        height:320px;
        padding:var(--dimension-space-100);
      "
    >
      <button id="menu-anchor-collision" type="button">Preferred bottom placement</button>
      <ds-menu
        ?open=${true}
        side="bottom"
        align="start"
        anchor-id="menu-anchor-collision"
        menu-label="Collision-aware actions"
        .items=${items}
      ></ds-menu>
    </div>
  `,
};

export const WithSections: Story = {
  render: () => html`
    <div style="padding: 16px; height: 320px">
      <span id="menu-anchor-sec" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        .sections=${[
          { header: 'File', items: [{ label: 'New' }, { label: 'Open' }, { label: 'Save' }] },
          { header: 'Edit', items: [{ label: 'Cut' }, { label: 'Copy' }, { label: 'Paste' }] },
        ]}
        anchor-id="menu-anchor-sec"
      ></ds-menu>
    </div>
  `,
};

export const WithSwitch: Story = {
  render: () => html`
    <div style="padding: 16px; height: 240px">
      <span id="menu-anchor-tog" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        .items=${[
          { label: 'Dark mode', showSwitch: true, switchValue: true },
          { label: 'Notifications', showSwitch: true, switchValue: false },
          { label: 'Auto-save', showSwitch: true, switchValue: true },
        ]}
        anchor-id="menu-anchor-tog"
      ></ds-menu>
    </div>
  `,
};

export const WithPrefixIcons: Story = {
  name: 'With prefix icons',
  render: () => html`
    <div style="padding: 16px; height: 240px">
      <span id="menu-anchor-icons" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        menu-label="File actions"
        .items=${[
          { label: 'Edit', value: 'edit', icon: 'Pencil' },
          { label: 'Copy', value: 'copy', icon: 'Copy' },
          { label: 'Share', value: 'share' },
        ]}
        anchor-id="menu-anchor-icons"
      ></ds-menu>
    </div>
  `,
};

const reorderableItems: MenuItemData[] = [
  { label: 'Driver', value: 'driver', showSwitch: true, switchValue: true, reorderable: true },
  { label: 'Status', value: 'status', showSwitch: true, switchValue: true, reorderable: true },
  { label: 'Vehicle', value: 'vehicle', showSwitch: true, switchValue: false, reorderable: true },
  { label: 'Action', value: 'action', showSwitch: true, switchValue: true, isInactive: true },
];

export const ReorderableSwitches: Story = {
  name: 'Reorderable switch rows',
  args: {
    items: reorderableItems,
  },
  argTypes: {
    items: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Reorderable rows prefix a Drag handle. Pointer drag and Alt+Arrow Up/Down emit dsReorder without closing or mutating items. Locked rows stay last.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const items = (args['items'] as MenuItemData[]) ?? reorderableItems;
    return html`
      <div style="padding: 16px; height: 320px">
        <span
          id="menu-anchor-reorder"
          style="display: inline-block; width: 1px; height: 1px"
        ></span>
        <ds-menu
          ?open=${true}
          menu-label="Customize table"
          .items=${items}
          anchor-id="menu-anchor-reorder"
          @dsReorder=${(event: CustomEvent<MenuReorderDetail>) =>
            updateArgs({ items: event.detail.items })}
          @dsSelect=${(event: CustomEvent<MenuItemData>) =>
            updateArgs({
              items: items.map(item =>
                item.value === event.detail.value && !item.isInactive
                  ? { ...item, switchValue: !item.switchValue }
                  : item
              ),
            })}
        ></ds-menu>
      </div>
    `;
  },
};

export const SingleSelection: Story = {
  name: 'Single-selection menu',
  render: () => html`
    <div style="padding: 16px; height: 280px">
      <span id="menu-anchor-radio" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        selection-mode="single"
        .items=${[
          { label: 'All chats', value: 'all', isSelected: true },
          { label: 'Unread', value: 'unread', isSelected: false },
          { label: 'Groups only', value: 'group', isSelected: false },
        ]}
        anchor-id="menu-anchor-radio"
      ></ds-menu>
    </div>
  `,
};

export const WithNotificationDot: Story = {
  name: 'With notification dot',
  render: () => html`
    <div style="padding: 16px; height: 240px">
      <span id="menu-anchor-dot" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        .items=${[
          { label: 'Updates', value: 'updates', dot: true, isSelected: true },
          { label: 'Archive', value: 'archive' },
        ]}
        anchor-id="menu-anchor-dot"
      ></ds-menu>
    </div>
  `,
};

export const WithTrailingTags: Story = {
  name: 'With trailing tags',
  parameters: {
    docs: {
      description: {
        story:
          'Trailing tags use the inset recipe at one density smaller than the menu row, so a count or status pill nests without changing row height.',
      },
    },
  },
  render: () => html`
    <div style="padding: 16px; height: 240px">
      <span id="menu-anchor-tags" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        .items=${[
          {
            label: 'Severity',
            value: 'severity',
            tag: { label: '2', intent: 'brand', contrast: 'bold', rounded: true },
          },
          {
            label: 'Status',
            value: 'status',
            tag: { label: 'New', intent: 'neutral', contrast: 'faint' },
          },
        ]}
        anchor-id="menu-anchor-tags"
      ></ds-menu>
    </div>
  `,
};

/** Panel-nav footer row case: right-aligned menu with token side offset. */
export const TokenSideOffsetRight: Story = {
  name: 'Token side offset (right)',
  render: () => html`
    <div
      style="
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        padding: var(--dimension-space-200);
        height: 280px;
        box-sizing: border-box;
      "
    >
      <button
        id="menu-anchor-token"
        type="button"
        style="
          width: 100%;
          max-width: 168px;
          padding: var(--dimension-space-100);
          border: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);
          border-radius: var(--dimension-radius-075);
          background: var(--color-background-secondary);
          color: var(--color-foreground-primary);
          font-family: var(--typography-font-family-ui);
          text-align: left;
        "
      >
        Theme
      </button>
      <ds-menu
        ?open=${true}
        side="right"
        align="start"
        anchor-id="menu-anchor-token"
        ${ref(el => {
          if (!el) return;
          (el as HTMLElement & { sideOffset: string }).sideOffset = TOKEN_CSS_LENGTHS.space200;
        })}
        .items=${[
          { label: 'Light', value: 'light', isSelected: true },
          { label: 'Dark', value: 'dark' },
          { label: 'System', value: 'system' },
        ]}
      ></ds-menu>
    </div>
  `,
};

/** User menu pattern: theme orbs first, then appearance rows (matches lab). */
export const AppearanceAndTheme: Story = {
  name: 'Appearance and theme',
  render: () => html`
    <div style="padding: 16px; height: 360px">
      <span id="menu-anchor-user" style="display: inline-block; width: 1px; height: 1px"></span>
      <ds-menu
        ?open=${true}
        side=${PANEL_NAV_USER_MENU_PLACEMENT.side}
        align=${PANEL_NAV_USER_MENU_PLACEMENT.align}
        anchorAlignment=${PANEL_NAV_USER_MENU_PLACEMENT.anchorAlignment}
        sideOffset=${PANEL_NAV_USER_MENU_PLACEMENT.sideOffset}
        alignOffset=${PANEL_NAV_USER_MENU_PLACEMENT.alignOffset}
        anchor-id="menu-anchor-user"
        .sections=${[
          {
            header: 'Theme',
            variant: 'swatch-picker',
            value: 'neutral',
            groupLabel: 'Shell gradient theme',
            sections: shellGradientPickerSections(),
          },
          {
            header: 'Appearance',
            items: [
              { label: 'System', value: 'system' },
              { label: 'Dark', value: 'dark', isSelected: true },
              { label: 'Light', value: 'light' },
            ],
          },
        ]}
      ></ds-menu>
    </div>
  `,
};
