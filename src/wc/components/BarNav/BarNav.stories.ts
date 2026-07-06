import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-bar-nav.js';
import '../../../../dist/components/ds-app-shell.js';
import type { NavChromeStyle } from '../../nav/nav-chrome';

const fleetTabs = [
  { id: 'live-map',          label: 'Live Map' },
  { id: 'location-history',  label: 'Location History' },
  { id: 'trips',             label: 'Trips' },
];

const safetyTabs = [
  { id: 'overview',  label: 'Overview' },
  { id: 'events',    label: 'Events', dot: true },
  { id: 'requests',  label: 'Requests' },
];

const meta: Meta = {
  title: 'Navigation/BarNav',
  tags: ['autodocs'],
  argTypes: {
    value:      { control: 'select', options: fleetTabs.map(t => t.id) },
    heading:    { control: 'text' },
  },
  args: {
    value: 'live-map',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width:800px" ${ref(el => {
      if (!el) return;
      const nav = el.querySelector('ds-bar-nav') as any;
      if (!nav) return;
      nav.tabs    = fleetTabs;
    })}>
      <ds-bar-nav
        value=${args['value'] ?? 'live-map'}
      ></ds-bar-nav>
    </div>
  `,
};

export const WithTabs: Story = {
  name: 'With tabs (Fleet)',
  render: () => html`
    <div style="width:900px" ${ref(el => {
      if (!el) return;
      const nav = el.querySelector('ds-bar-nav') as any;
      if (!nav) return;
      nav.tabs    = fleetTabs;
      nav.addEventListener('dsTabChange', (e: CustomEvent) => { nav.value = e.detail; });
    })}>
      <ds-bar-nav value="live-map"></ds-bar-nav>
    </div>
  `,
};

const fleetAndSafetyTabs = [
  { id: 'live-map',         label: 'Live Map' },
  { id: 'location-history', label: 'Location History' },
  { id: 'trips',            label: 'Trips' },
  { type: 'divider' as const },
  { id: 'overview',  label: 'Overview' },
  { id: 'events',    label: 'Events', dot: true },
  { id: 'requests',  label: 'Requests' },
];

export const WithTabDivider: Story = {
  name: 'Tab divider between groups',
  parameters: {
    docs: {
      description: {
        story:
          'Insert `{ type: \'divider\' }` in the `tabs` array to visually separate two tab groups ' +
          'within a single tablist. Dividers are skipped for selection, keyboard navigation, and URL matching.',
      },
    },
  },
  render: () => html`
    <div style="width:960px" ${ref(el => {
      if (!el) return;
      const nav = el.querySelector('ds-bar-nav') as HTMLElement & {
        tabs: typeof fleetAndSafetyTabs;
        value: string;
      } | null;
      if (!nav) return;
      nav.tabs = fleetAndSafetyTabs;
      nav.value = 'live-map';
      nav.addEventListener('dsTabChange', (e: Event) => {
        nav.value = (e as CustomEvent<string>).detail;
      });
    })}>
      <ds-bar-nav></ds-bar-nav>
    </div>
  `,
};

const manyTabs = [
  { id: 'live-map', label: 'Live Map' },
  { id: 'location-history', label: 'Location History' },
  { id: 'trips', label: 'Trips' },
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events', dot: true },
  { id: 'requests', label: 'Requests' },
];

export const ResponsiveTabCollapse: Story = {
  name: 'Responsive tab overflow',
  parameters: {
    docs: {
      description: {
        story:
          'When tabs overflow the header width, tabs that still fit remain visible. ' +
          'The remaining tabs move into a right-pinned Ellipses menu trigger.',
      },
    },
    layout: 'padded',
  },
  render: () => html`
    <div
      style="width: min(100%, 420px); resize: horizontal; overflow: auto; padding-bottom: 16px; border: 1px dashed var(--color-border-tertiary);"
      ${ref(el => {
        if (!el) return;
        const nav = el.querySelector('ds-bar-nav') as HTMLElement & {
          tabs: typeof manyTabs;
          value: string;
        } | null;
        if (!nav) return;
        nav.tabs = manyTabs;
        nav.value = 'events';
        nav.addEventListener('dsTabChange', (e: Event) => {
          nav.value = (e as CustomEvent<string>).detail;
        });
      })}
    >
      <p style="font-size:12px; color:var(--color-foreground-secondary); margin:0 0 12px;">
        Drag the container edge to resize — tabs that no longer fit move into the overflow menu.
        Events is selected by default to show its notification dot.
      </p>
      <ds-bar-nav></ds-bar-nav>
    </div>
  `,
};

const truncationTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events and notifications', dot: true },
  { id: 'requests', label: 'Requests' },
];

export const CollapsedLabelTruncation: Story = {
  name: 'Overflow at narrow width',
  parameters: {
    docs: {
      description: {
        story:
          'Fixed 300px width — fitting tabs stay visible and the rest move into the Ellipses menu. ' +
          'Use this story to review overflow without resizing.',
      },
    },
    layout: 'padded',
  },
  render: () => html`
    <div
      style="width: 300px; border: 1px dashed var(--color-border-tertiary);"
      ${ref(el => {
        if (!el) return;
        const nav = el.querySelector('ds-bar-nav') as HTMLElement & {
          tabs: typeof truncationTabs;
          value: string;
        } | null;
        if (!nav) return;
        nav.tabs = truncationTabs;
        nav.value = 'events';
        nav.addEventListener('dsTabChange', (e: Event) => {
          nav.value = (e as CustomEvent<string>).detail;
        });
      })}
    >
      <ds-bar-nav></ds-bar-nav>
    </div>
  `,
};

export const WithDotOnTab: Story = {
  name: 'Tab dot (Safety)',
  render: () => html`
    <div style="width:900px" ${ref(el => {
      if (!el) return;
      const nav = el.querySelector('ds-bar-nav') as any;
      if (!nav) return;
      nav.tabs    = safetyTabs;
    })}>
      <ds-bar-nav value="overview"></ds-bar-nav>
    </div>
  `,
};

export const HeadingFallback: Story = {
  name: 'No tabs — heading fallback',
  render: () => html`
    <div style="width:900px" ${ref(el => {
      if (!el) return;
      const nav = el.querySelector('ds-bar-nav') as any;
      if (!nav) return;
    })}>
      <ds-bar-nav heading="Dashboard"></ds-bar-nav>
    </div>
  `,
};

function assignBarNavAfterUpgrade(
  navId: string,
  statusId: string,
  assign: (el: HTMLElement & Record<string, unknown>) => void,
) {
  customElements.whenDefined('ds-bar-nav').then(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById(navId) as HTMLElement & Record<string, unknown> | null;
      const status = document.getElementById(statusId);
      if (!el || !status) return;
      assign(el);
      requestAnimationFrame(() => {
        const tabs = el.querySelectorAll('ds-tab-group-nav button').length;
        status.textContent = `${tabs} tabs rendered · basePath=${String(el.basePath)} · currentUrl=${String(el.currentUrl)}`;
      });
    });
  });
}

export const AngularHostTiming: Story = {
  name: 'Angular host timing',
  parameters: {
    docs: {
      description: {
        story:
          'Mounts an empty `<ds-bar-nav>`, then assigns `tabs`, `basePath`, and `currentUrl` after ' +
          'upgrade (simulates Angular `ngAfterViewInit`). Expects the tab group to render without JSON fallbacks.',
      },
    },
  },
  render: () => {
    assignBarNavAfterUpgrade('angular-bar-nav', 'angular-bar-status', el => {
      el.tabs = safetyTabs;
      el.basePath = '/dashboard/safety';
      el.currentUrl = '/dashboard/safety/events';
      el.heading = 'Safety';
    });

    return html`
      <div style="width:900px; font-family: var(--typography-font-family, system-ui);">
        <p style="font-size:13px; color:var(--color-foreground-secondary); margin:0 0 12px;">
          Props assigned after upgrade — expect <strong>${safetyTabs.length}</strong> tabs (Events selected).
        </p>
        <p style="font-size:12px; margin:0 0 12px;" id="angular-bar-status">Waiting for host prop assignment…</p>
        <ds-bar-nav id="angular-bar-nav"></ds-bar-nav>
      </div>
    `;
  },
};

export const UrlDrivenTabs: Story = {
  name: 'URL-driven tab selection',
  render: () => {
    let currentUrl = '/dashboard/safety/events';

    const setUrl = (path: string) => {
      currentUrl = path;
      const nav = document.getElementById('url-bar-nav') as HTMLElement & { currentUrl: string } | null;
      if (nav) nav.currentUrl = path;
      const label = document.getElementById('url-bar-label');
      if (label) label.textContent = path;
    };

    return html`
      <div style="width:900px; font-family: var(--typography-font-family, system-ui);">
        <p style="font-size:13px; color:var(--color-foreground-secondary); margin:0 0 12px;">
          <code>currentUrl</code> + <code>basePath</code> derive the active tab — no manual <code>value</code> binding.
          Non-tab child routes hide tabs and show the heading.
        </p>
        <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
          ${['/dashboard/safety', '/dashboard/safety/overview', '/dashboard/safety/events', '/dashboard/safety/evt-123'].map(
            path => html`
              <button style="padding:4px 10px; font-size:12px; cursor:pointer;" @click=${() => setUrl(path)}>
                ${path}
              </button>
            `
          )}
        </div>
        <p style="font-size:12px; margin:0 0 8px;">URL: <code id="url-bar-label">${currentUrl}</code></p>
        <div ${ref(el => {
          if (!el) return;
          const nav = el.querySelector('ds-bar-nav') as HTMLElement & {
            tabs: typeof safetyTabs;
            } | null;
          if (!nav) return;
          nav.tabs = safetyTabs;
        })}>
          <ds-bar-nav
            id="url-bar-nav"
            base-path="/dashboard/safety"
            current-url=${currentUrl}
            heading="Safety"
          ></ds-bar-nav>
        </div>
      </div>
    `;
  },
};

export const AngularImperativeAssignment: Story = {
  name: 'Angular-style imperative assignment',
  parameters: {
    docs: {
      description: {
        story:
          'Angular template bindings for array props on custom elements can be unreliable. ' +
          'Assign `el.tabs` imperatively (e.g. in `ngAfterViewInit` and on route changes). ' +
          'The generated `DsBarNav` proxy uses property setters for this pattern.',
      },
    },
  },
  render: () => html`
    <div style="width:900px; font-family: var(--typography-font-family, system-ui);">
      <p style="font-size:13px; color:var(--color-foreground-secondary); margin:0 0 12px;">
        Tabs are assigned via <code>el.tabs = [...]</code> in a ref callback — mimics Angular imperative binding.
      </p>
      <div ${ref(el => {
        if (!el) return;
        const nav = el.querySelector('ds-bar-nav') as HTMLElement & {
          tabs: typeof fleetTabs;
          value: string;
        } | null;
        if (!nav) return;
        nav.tabs = fleetTabs;
        nav.value = 'live-map';
        nav.addEventListener('dsTabChange', (e: Event) => {
          nav.value = (e as CustomEvent<string>).detail;
        });
        })}>
        <ds-bar-nav></ds-bar-nav>
      </div>
    </div>
  `,
};

function wireBarNavTabs(nav: HTMLElement & { tabs: typeof safetyTabs; value: string }) {
  nav.tabs = safetyTabs;
  nav.value = 'events';
  nav.addEventListener('dsTabChange', (e: Event) => {
    nav.value = (e as CustomEvent<string>).detail;
  });
}

export const NavStyleSlots: Story = {
  name: 'Nav style slots',
  parameters: {
    docs: {
      description: {
        story:
          '`navStyle` is `dashboard` or `settings` — shared app-surface tokens with BEM hooks for future texture layers. ' +
          'Color is unified today; classes differ for host styling.',
      },
    },
    layout: 'fullscreen',
  },
  render: () => html`
    <div
      style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--dimension-space-300);
        padding: var(--dimension-space-300);
        min-height: 100vh;
        box-sizing: border-box;
        background: var(--color-background-secondary);
        font-family: var(--typography-font-family, system-ui);
      "
    >
      ${(['dashboard', 'settings'] as NavChromeStyle[]).map(style => html`
        <div style="display: flex; flex-direction: column; gap: var(--dimension-space-100); min-width: 0;">
          <span style="font-size: 12px; font-weight: 500; color: var(--color-foreground-secondary);">
            nav-style="${style}"
          </span>
          <div
            style="
              border: 1px solid var(--color-border-tertiary);
              border-radius: var(--dimension-radius-100);
              overflow: hidden;
              background: var(--color-background-primary);
            "
            ${ref(el => {
              if (!el) return;
              const nav = el.querySelector('ds-bar-nav') as HTMLElement & {
                tabs: typeof safetyTabs;
                value: string;
                navStyle: NavChromeStyle;
              } | null;
              if (!nav) return;
              nav.navStyle = style;
              wireBarNavTabs(nav);
            })}
          >
            <ds-bar-nav nav-style=${style}></ds-bar-nav>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const InGradientShell: Story = {
  name: 'In gradient shell',
  parameters: {
    docs: {
      description: {
        story:
          'Inside `ds-app-shell[gradient]`, bar-nav is transparent — the shell chrome layer paints the L-gradient wash. ' +
          'Product shells put tool shortcuts on `ds-panel-tools` — bar-nav is tabs (and optional heading) only.',
      },
    },
    layout: 'fullscreen',
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
        <div
          slot="bar"
          style="display: flex; flex-direction: column; min-width: 0; width: 100%;"
          ${ref(el => {
            if (!el) return;
            const nav = el.querySelector('ds-bar-nav') as HTMLElement & {
              tabs: typeof safetyTabs;
              value: string;
            } | null;
            if (!nav) return;
            wireBarNavTabs(nav);
          })}
        >
          <ds-bar-nav nav-style="dashboard"></ds-bar-nav>
        </div>
        <div style="padding: var(--dimension-space-400); color: var(--color-foreground-secondary);">
          Bar-nav over shell chrome — gradient is fixed to the viewport behind transparent nav surfaces.
        </div>
      </ds-app-shell>
    </div>
  `,
};
