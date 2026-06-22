import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-bar-nav.js';

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

const defaultActions = [
  { id: 'search',    icon: 'MagnifyingGlass', ariaLabel: 'Go to / Search' },
  { id: 'inbox',     icon: 'Inbox',           ariaLabel: 'Inbox',         dot: true  },
  { id: 'assistant', icon: 'AI',              ariaLabel: 'AI Assistant',  dot: true  },
];

const meta: Meta = {
  title: 'Navigation/BarNav',
  tags: ['autodocs'],
  argTypes: {
    value:      { control: 'select', options: fleetTabs.map(t => t.id) },
    navStyle:   { control: 'select', options: ['navigation', 'default'] },
    heading:    { control: 'text' },
  },
  args: {
    value: 'live-map',
    navStyle: 'default',
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
      nav.actions = defaultActions;
    })}>
      <ds-bar-nav
        value=${args['value'] ?? 'live-map'}
        nav-style=${args['navStyle'] ?? 'default'}
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
      nav.actions = defaultActions;
      nav.addEventListener('dsTabChange', (e: CustomEvent) => { nav.value = e.detail; });
      nav.addEventListener('dsActionChange', (e: CustomEvent) => {
        const updated = nav.actions.map((a: any) =>
          a.id === e.detail.id ? { ...a, selected: e.detail.selected } : a
        );
        nav.actions = updated;
      });
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
        actions: typeof defaultActions;
        value: string;
      } | null;
      if (!nav) return;
      nav.tabs = fleetAndSafetyTabs;
      nav.actions = defaultActions;
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
  name: 'Responsive tab collapse',
  parameters: {
    docs: {
      description: {
        story:
          'When tabs overflow the left zone (actions stay pinned on the right), all tabs collapse ' +
          'into a single tab-styled trigger with the active label and ChevronDown. Opens `ds-menu` for selection.',
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
          actions: typeof defaultActions;
          value: string;
        } | null;
        if (!nav) return;
        nav.tabs = manyTabs;
        nav.actions = defaultActions;
        nav.value = 'events';
        nav.addEventListener('dsTabChange', (e: Event) => {
          nav.value = (e as CustomEvent<string>).detail;
        });
      })}
    >
      <p style="font-size:12px; color:var(--color-foreground-secondary); margin:0 0 12px;">
        Drag the container edge to resize — narrow widths collapse tabs into a menu trigger.
        Events is selected by default to show its notification dot (also on action icons).
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
  name: 'Collapsed tab label truncation',
  parameters: {
    docs: {
      description: {
        story:
          'Fixed 300px width — tabs collapse and the active label truncates with a right-edge fade ' +
          'before the chevron. Use this story to review truncation without resizing.',
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
          actions: typeof defaultActions;
          value: string;
        } | null;
        if (!nav) return;
        nav.tabs = truncationTabs;
        nav.actions = defaultActions;
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
  name: 'Tab dot + action dots (Safety)',
  render: () => html`
    <div style="width:900px" ${ref(el => {
      if (!el) return;
      const nav = el.querySelector('ds-bar-nav') as any;
      if (!nav) return;
      nav.tabs    = safetyTabs;
      nav.actions = defaultActions;
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
      nav.actions = defaultActions;
    })}>
      <ds-bar-nav heading="Dashboard"></ds-bar-nav>
    </div>
  `,
};

export const ActionsOnly: Story = {
  render: () => html`
    <div style="width:600px" ${ref(el => {
      if (!el) return;
      const nav = el.querySelector('ds-bar-nav') as any;
      if (!nav) return;
      nav.actions = defaultActions;
    })}>
      <ds-bar-nav></ds-bar-nav>
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
      el.actions = defaultActions;
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
            actions: typeof defaultActions;
          } | null;
          if (!nav) return;
          nav.tabs = safetyTabs;
          nav.actions = defaultActions;
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
          'Assign `el.tabs` and `el.actions` imperatively (e.g. in `ngAfterViewInit` and on route changes). ' +
          'The generated `DsBarNav` proxy uses property setters for this pattern.',
      },
    },
  },
  render: () => html`
    <div style="width:900px; font-family: var(--typography-font-family, system-ui);">
      <p style="font-size:13px; color:var(--color-foreground-secondary); margin:0 0 12px;">
        Tabs and actions are assigned via <code>el.tabs = [...]</code> in a ref callback — mimics Angular imperative binding.
      </p>
      <div ${ref(el => {
        if (!el) return;
        const nav = el.querySelector('ds-bar-nav') as HTMLElement & {
          tabs: typeof fleetTabs;
          actions: typeof defaultActions;
          value: string;
        } | null;
        if (!nav) return;
        nav.tabs = fleetTabs;
        nav.actions = defaultActions;
        nav.value = 'live-map';
        nav.addEventListener('dsTabChange', (e: Event) => {
          nav.value = (e as CustomEvent<string>).detail;
        });
        nav.addEventListener('dsActionChange', (e: Event) => {
          const { id, selected } = (e as CustomEvent<{ id: string; selected: boolean }>).detail;
          nav.actions = nav.actions.map(a =>
            a.id === id ? { ...a, selected } : a,
          );
        });
      })}>
        <ds-bar-nav></ds-bar-nav>
      </div>
    </div>
  `,
};
