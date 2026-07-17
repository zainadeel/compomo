import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-menu.js';
import '../../../../dist/components/ds-switch.js';
import '../../../../dist/components/ds-swatch-picker.js';
import { TOKEN_DEFAULTS, TOKEN_CSS_LENGTHS } from '../../utils/token-defaults';
import { PANEL_NAV_USER_MENU_PLACEMENT } from './menu-placement';
import { shellGradientPickerSections } from '../../shell/shell-gradient-presets';

const items = [
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Archive', value: 'archive', isInactive: true },
  { label: 'Delete', value: 'delete', isDestructive: true },
];

const meta: Meta = {
  title: 'Overlay/Menu',
  tags: ['autodocs'],
  argTypes: {
    side:  { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    sideOffset: { control: 'text', description: 'px number or TokoMo length (e.g. var(--dimension-space-200))' },
  },
  args: { side: 'bottom', align: 'start', sideOffset: TOKEN_CSS_LENGTHS.space050 },
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
        side=${args['side'] ?? 'bottom'}
        align=${args['align'] ?? 'start'}
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
          font-family: var(--typography-font-family);
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
