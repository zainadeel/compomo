import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-shell-app.js';
import '../../../../dist/components/ds-panel-nav.js';
import '../../../../dist/components/ds-bar-nav.js';
import '../../../../dist/components/ds-panel-tools.js';
import '../../../../dist/components/ds-tab-group.js';
import type { PanelNavGroup } from '../PanelNav/panel-nav-types';
import type { PanelNavChildSelectDetail } from '../PanelNav/panel-nav-types';
import { PANEL_TOOLS_DEFAULT_ITEMS, type PanelToolsItem } from '../PanelTools/panel-tools-types';
import type { ShellGradientPreset } from '../../shell/shell-gradient-presets';
import type { PaperTextureConfig } from '../PaperTexture/paper-texture-types';
import type {
  ShellNavigationConfig,
  ShellPageChromeConfig,
  ShellSectionNavigation,
  ShellToolsConfig,
} from './shell-app-types';

const DASHBOARD_GROUPS: PanelNavGroup[] = [
  {
    items: [
      {
        id: 'area-a',
        icon: 'MapPage',
        label: 'Fleet View',
        children: [
          { id: 'live-map', label: 'Live Map', href: '/dashboard/area-a/live-map' },
          { id: 'history', label: 'History', href: '/dashboard/area-a/history' },
        ],
      },
      {
        id: 'area-b',
        icon: 'ShieldCircle',
        label: 'Safety',
        dot: true,
        children: [
          { id: 'tab-1', label: 'Overview', href: '/dashboard/area-b/tab-1' },
          {
            id: 'tab-2',
            label: 'Events',
            href: '/dashboard/area-b/tab-2',
            dot: true,
          },
          {
            id: 'coaching',
            label: 'Coaching',
            href: '/dashboard/area-b/coaching',
          },
        ],
      },
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

const REVIEW_PAGE_CHROME: ShellPageChromeConfig = {
  ...PAGE_CHROME,
  heading: 'Safety events',
  description: 'Review safety performance and coach drivers who need attention.',
  showBack: true,
  backAriaLabel: 'Back to Safety',
  subsections: [
    { id: 'all-events', label: 'All events' },
    { id: 'needs-review', label: 'Needs review' },
  ],
  subvalue: 'all-events',
  actionItems: [
    {
      type: 'button',
      id: 'create-rule',
      label: 'Create rule',
      icon: 'Plus',
      appearance: 'filled',
    },
    {
      type: 'icon',
      id: 'refresh',
      label: 'Refresh',
      icon: 'Refresh',
      ariaLabel: 'Refresh safety events',
    },
    {
      type: 'menu',
      id: 'export',
      label: 'Export',
      menuAriaLabel: 'Export safety events',
      choices: [
        { id: 'export-csv', label: 'Export CSV' },
        { id: 'export-pdf', label: 'Export PDF' },
      ],
    },
    { type: 'divider' },
    { type: 'overflow', id: 'archive', label: 'Archive reviewed events' },
  ],
  actionsAriaLabel: 'Safety page actions',
  contentInsetBlockStartSize: 'var(--dimension-space-025)',
  scrollCompaction: false,
};

function navigationModeReview(initialMode: ShellSectionNavigation): ReturnType<typeof html> {
  let mode = initialMode;
  let activeParentId = 'area-b';
  let activeChildId = 'tab-2';
  let currentUrl = '/dashboard/area-b/tab-2';

  const updateShellRoute = (parentId: string, childId: string, href?: string) => {
    const shell = document.getElementById(
      'navigation-mode-review-shell'
    ) as HTMLDsShellAppElement | null;
    if (!shell) return;
    const parent = DASHBOARD_GROUPS.flatMap(group => group.items).find(
      item => item.id === parentId
    );
    activeParentId = parentId;
    activeChildId = childId;
    currentUrl = href ?? currentUrl;
    shell.navigation = {
      ...NAVIGATION,
      activeId: activeParentId,
      currentUrl,
    };
    shell.pageChrome = {
      ...REVIEW_PAGE_CHROME,
      heading: parent ? `${parent.label} ${childId}` : REVIEW_PAGE_CHROME.heading,
      value: activeChildId,
      currentUrl,
    };
    const route = document.getElementById('navigation-mode-review-route');
    if (route) route.textContent = currentUrl;
  };

  return html`
    <div
      style="height:100vh;display:grid;grid-template-rows:auto minmax(0,1fr);background:var(--color-background-primary);font-family:var(--typography-font-family-ui,system-ui);"
    >
      <div
        style="display:flex;align-items:center;justify-content:space-between;gap:var(--dimension-space-200);padding:var(--dimension-space-100) var(--dimension-space-200);border-bottom:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);background:var(--color-background-secondary);"
      >
        <div>
          <ds-text as="div" variant="text-body-medium" emphasis>Prototype settings</ds-text>
          <ds-text as="div" variant="text-body-small" color="secondary">
            Switch modes repeatedly, then verify the route, tools, and draft remain intact.
          </ds-text>
        </div>
        <ds-tab-group
          id="navigation-mode-review-control"
          .tabs=${[
            { id: 'bar', label: 'Bar navigation' },
            { id: 'panel', label: 'Panel navigation' },
          ]}
          value=${mode}
          aria-label="Section navigation mode"
          @dsChange=${(event: CustomEvent<ShellSectionNavigation>) => {
            mode = event.detail;
            const control = document.getElementById(
              'navigation-mode-review-control'
            ) as HTMLDsTabGroupElement | null;
            const shell = document.getElementById(
              'navigation-mode-review-shell'
            ) as HTMLDsShellAppElement | null;
            if (control) control.value = mode;
            if (shell) shell.sectionNavigation = mode;
          }}
        ></ds-tab-group>
      </div>
      <ds-shell-app
        id="navigation-mode-review-shell"
        section-navigation=${mode}
        .navigation=${{
          ...NAVIGATION,
          activeId: activeParentId,
          currentUrl,
        }}
        .pageChrome=${{
          ...REVIEW_PAGE_CHROME,
          value: activeChildId,
          currentUrl,
        }}
        .tools=${TOOLS}
        gradient-preset="neutral"
        @dsNavChildSelect=${(event: CustomEvent<PanelNavChildSelectDetail>) =>
          updateShellRoute(event.detail.parentId, event.detail.childId, event.detail.href)}
        @dsTabChange=${(event: CustomEvent<string>) => {
          const parent = DASHBOARD_GROUPS.flatMap(group => group.items).find(
            item => item.id === activeParentId
          );
          const child = parent?.children?.find(item => item.id === event.detail);
          updateShellRoute(activeParentId, event.detail, child?.href);
        }}
        style="height:100%;"
      >
        ${toolViews()}
        <section style="min-height:100%;padding:var(--dimension-space-200);box-sizing:border-box;">
          <ds-text as="p" variant="text-body-medium">
            Current route: <strong id="navigation-mode-review-route">${currentUrl}</strong>
          </ds-text>
          <label style="display:grid;gap:var(--dimension-space-050);max-width:320px;">
            <ds-text as="span" variant="text-body-small" emphasis>Persistent page draft</ds-text>
            <input
              aria-label="Persistent page draft"
              value="This value should survive mode changes"
              style="height:var(--dimension-size-500);padding-inline:var(--dimension-space-100);"
            />
          </label>
          <div style="height:720px;"></div>
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

export const NavigationModeReview: Story = {
  name: 'Navigation mode — interactive review',
  parameters: {
    docs: {
      description: {
        story:
          'Switches the same managed shell between BarNav and nested PanelNav section navigation. ' +
          'Use the tools and edit the draft before switching to verify application-owned state persists. ' +
          'The page restores its standard top gutter when BarTitle moves from the page into the shell bar.',
      },
    },
  },
  render: () => navigationModeReview('bar'),
};

export const NestedPanelTabletReview: Story = {
  name: 'Nested panel — tablet flyout',
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: {
      description: {
        story:
          'Keeps PanelNav icon-only at the tablet breakpoint. Activating a parent opens the ' +
          'child-only flyout and waits for the user to choose a route.',
      },
    },
  },
  render: () => navigationModeReview('panel'),
};

export const NestedPanelMobileCompatibility: Story = {
  name: 'Nested panel — mobile compatibility',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'The panel preference expands child routes inside MobileSheetNav. MobileHeader keeps ' +
          'the page identity and combines it with the active local subsection in one sheet trigger.',
      },
    },
  },
  render: () => navigationModeReview('panel'),
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
