import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-shell-app.js';
import '../../../../dist/components/ds-panel-nav.js';
import '../../../../dist/components/ds-bar-nav.js';
import '../../../../dist/components/ds-panel-tools.js';
import type { PanelNavGroup } from '../PanelNav/panel-nav-types';
import { PANEL_TOOLS_DEFAULT_ITEMS, type PanelToolsItem } from '../PanelTools/panel-tools-types';
import type { ShellGradientPreset } from '../../shell/shell-gradient-presets';
import type { PaperTextureConfig } from '../PaperTexture/paper-texture-types';
import type {
  ShellNavigationConfig,
  ShellPageChromeConfig,
  ShellToolsConfig,
} from './shell-app-types';

const DASHBOARD_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'area-a', icon: 'MapPage', label: 'Area A', href: '/dashboard/area-a/tab-1' },
      { id: 'area-b', icon: 'ShieldCircle', label: 'Area B', href: '/dashboard/area-b/tab-2' },
    ],
  },
  {
    label: 'Section 1',
    items: [
      { id: 'area-c', icon: 'Chart', label: 'Area C', href: '/dashboard/area-c' },
      { id: 'area-d', icon: 'FuelPump', label: 'Area D', href: '/dashboard/area-d' },
    ],
  },
];

const SETTINGS_GROUPS: PanelNavGroup[] = [
  {
    items: [{ id: 'account', icon: 'Gear', label: 'Account', href: '/settings/account' }],
  },
];

const NAVIGATION: ShellNavigationConfig = {
  groups: DASHBOARD_GROUPS,
  dashboardGroups: DASHBOARD_GROUPS,
  settingsGroups: SETTINGS_GROUPS,
  currentUrl: '/dashboard/area-b/tab-2',
  activeId: 'area-b',
  browseContext: 'dashboard',
  routerMode: 'event',
  storageKey: 'storybook.shell.panel',
  userName: 'User Name',
  userInitial: 'U',
};

const PAGE_CHROME: ShellPageChromeConfig = {
  heading: 'Area B',
  tabs: [
    { id: 'tab-1', label: 'Tab 1' },
    { id: 'tab-2', label: 'Tab 2', dot: true },
  ],
  value: 'tab-2',
  currentUrl: '/dashboard/area-b/tab-2',
  sectionsAriaLabel: 'Change Area B page',
};

const TOOLS: ShellToolsConfig = {
  items: PANEL_TOOLS_DEFAULT_ITEMS,
  storageKey: 'storybook.shell.tool',
};

function toolViews() {
  return html`
    <div slot="search-view">Search tool</div>
    <div slot="agents-view">Agents tool</div>
    <div slot="messages-view">Messages tool</div>
    <div slot="activity-view">Activity tool</div>
    <div slot="help-view">Help &amp; Support</div>
  `;
}

const PAPER_TEXTURE: PaperTextureConfig = {
  colorFront: '#b8b8b8',
  colorBack: '#ffffff',
  contrast: 0.3,
  roughness: 0.4,
  fiber: 0.3,
  fiberSize: 0.2,
  crumples: 0.3,
  crumpleSize: 0.35,
  folds: 0.65,
  foldCount: 5,
  fade: 0,
  drops: 0.2,
  seed: 5.8,
  fit: 'cover',
  scale: 0.6,
  speed: 0,
  opacity: 0.2,
};

function shellLayout(gradientPreset: ShellGradientPreset, paperTexture?: PaperTextureConfig) {
  return html`
    <div
      style="
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family-ui, system-ui);
      "
    >
      <ds-shell-app
        .navigation=${NAVIGATION}
        .pageChrome=${PAGE_CHROME}
        .tools=${TOOLS}
        .paperTexture=${paperTexture}
        gradient-preset=${gradientPreset}
        style="height: 100%;"
      >
        ${toolViews()}
        <section
          style="min-height: 100%; padding: var(--dimension-space-200); box-sizing: border-box;"
        >
          Router-owned Area B content
        </section>
      </ds-shell-app>
    </div>
  `;
}

const meta: Meta = {
  title: 'Layout/ShellApp',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const Managed: Story = {
  name: 'Managed application',
  render: () => shellLayout('neutral'),
};

export const WithoutGradient: Story = {
  name: 'Managed without gradient',
  render: () => shellLayout('none'),
};

export const PaperTextureOverlay: Story = {
  name: 'Gradient with paper texture',
  render: () => shellLayout('neutral', PAPER_TEXTURE),
};

export const MobileManaged: Story = {
  name: 'Managed mobile',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => shellLayout('warm'),
};

export const AdvancedSlotted: Story = {
  name: 'Advanced slotted composition',
  render: () => {
    const items: PanelToolsItem[] = PANEL_TOOLS_DEFAULT_ITEMS;
    return html`
      <div style="height: 100vh;">
        <ds-shell-app composition="slotted" style="height: 100%;">
          <ds-panel-nav
            slot="panel"
            .groups=${DASHBOARD_GROUPS}
            active-id="area-b"
            user-name="User Name"
            user-initial="U"
          ></ds-panel-nav>
          <ds-bar-nav
            slot="bar"
            .tabs=${PAGE_CHROME.tabs}
            value="tab-2"
            heading="Area B"
          ></ds-bar-nav>
          <ds-panel-tools slot="tools" .items=${items} active-tool=""></ds-panel-tools>
          <section style="padding: var(--dimension-space-200);">
            Manually composed shell content
          </section>
        </ds-shell-app>
      </div>
    `;
  },
};
