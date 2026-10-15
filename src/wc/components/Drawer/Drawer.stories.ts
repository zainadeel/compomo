import type { Meta, StoryObj } from '@storybook/web-components';
import { html, nothing, render, type TemplateResult } from 'lit';
import '../../../../dist/components/ds-drawer.js';
import '../../../../dist/components/ds-shell-app.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-divider.js';
import '../../../../dist/components/ds-field.js';
import '../../../../dist/components/ds-input.js';
import '../../../../dist/components/ds-textarea.js';
import '../../../../dist/components/ds-switch.js';
import '../../../../dist/components/ds-tag.js';
import '../../../../dist/components/ds-text.js';
import '../../../../dist/components/ds-tooltip.js';
import { PANEL_TOOLS_DEFAULT_ITEMS } from '../PanelTools/panel-tools-types';
import type {
  ShellNavigationConfig,
  ShellPageChromeConfig,
  ShellToolsConfig,
} from '../ShellApp/shell-app-types';

const meta: Meta = {
  title: 'Overlay/Drawer',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

interface SafetyEvent {
  id: string;
  behavior: string;
  severity: 'Critical' | 'High' | 'Low';
  driver: string;
  driverId: string;
  vehicle: string;
  location: string;
  time: string;
  speed: string;
}

const BASE_EVENTS: SafetyEvent[] = [
  {
    id: 'evt-1',
    behavior: 'Close following',
    severity: 'Critical',
    driver: 'James Hartwell',
    driverId: 'DRV2515',
    vehicle: 'T6104 · Kenworth T680',
    location: 'I-90 West, Snoqualmie Pass, WA',
    time: 'Oct 15, 8:42 AM PT',
    speed: '61 mph',
  },
  {
    id: 'evt-2',
    behavior: 'Lane cutoff',
    severity: 'High',
    driver: 'Maria Delgado',
    driverId: 'DRV2652',
    vehicle: 'P3022 · Peterbilt 389',
    location: 'I-5 North, Tacoma, WA',
    time: 'Oct 15, 8:17 AM PT',
    speed: '58 mph',
  },
  {
    id: 'evt-3',
    behavior: 'Distraction',
    severity: 'High',
    driver: 'Robert Chen',
    driverId: 'DRV2789',
    vehicle: 'CA307 · Freightliner Cascadia',
    location: 'SR-520 East, Bellevue, WA',
    time: 'Oct 15, 7:55 AM PT',
    speed: '47 mph',
  },
  {
    id: 'evt-4',
    behavior: 'Stop sign violation',
    severity: 'Critical',
    driver: 'Angela Brooks',
    driverId: 'DRV2926',
    vehicle: 'V8041 · Volvo VNL 860',
    location: 'Pacific Ave, Tacoma, WA',
    time: 'Oct 15, 7:31 AM PT',
    speed: '18 mph',
  },
  {
    id: 'evt-5',
    behavior: 'Unsafe lane change',
    severity: 'Low',
    driver: 'Derek Owens',
    driverId: 'DRV3063',
    vehicle: 'LT215 · International LT',
    location: 'I-405 South, Renton, WA',
    time: 'Oct 15, 7:02 AM PT',
    speed: '55 mph',
  },
];

/** Enough rows that the page scrolls under the pinned drawer. */
const EVENTS: SafetyEvent[] = Array.from({ length: 4 }, (_, round) =>
  BASE_EVENTS.map(event => ({ ...event, id: `${event.id}-${round}` }))
).flat();

const SHELL_NAVIGATION: ShellNavigationConfig = {
  groups: [
    {
      items: [
        {
          id: 'safety',
          icon: 'ShieldCircle',
          label: 'Safety',
          children: [
            { id: 'overview', label: 'Overview', href: '/dashboard/safety/overview' },
            { id: 'events', label: 'Events', href: '/dashboard/safety/events' },
          ],
        },
      ],
    },
  ],
  currentUrl: '/dashboard/safety/events',
  activeId: 'safety',
  browseContext: 'dashboard',
  routerMode: 'event',
  storageKey: 'storybook.drawer.shell.panel',
  userName: 'User Name',
  userInitial: 'U',
};

const SHELL_PAGE_CHROME: ShellPageChromeConfig = {
  heading: 'Safety Events',
  currentUrl: '/dashboard/safety/events',
};

const SHELL_TOOLS: ShellToolsConfig = {
  items: PANEL_TOOLS_DEFAULT_ITEMS,
  storageKey: 'storybook.drawer.shell.tool',
};

/** Re-renders a small stateful example into its own root, so stories can model owner state. */
function statefulStory<State>(
  initial: State,
  view: (state: State, set: (patch: Partial<State>) => void) => TemplateResult
) {
  const root = document.createElement('div');
  root.style.display = 'contents';
  let state = initial;
  const set = (patch: Partial<State>) => {
    state = { ...state, ...patch };
    render(view(state, set), root);
  };
  render(view(state, set), root);
  return root;
}

const detailRow = (label: string, value: string) => html`
  <div
    style="display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);gap:var(--dimension-space-100);"
  >
    <ds-text as="span" variant="text-body-small" color="secondary">${label}</ds-text>
    <ds-text as="span" variant="text-body-small" color="primary">${value}</ds-text>
  </div>
`;

const severityIntent = (severity: SafetyEvent['severity']) =>
  severity === 'Critical' ? 'negative' : severity === 'High' ? 'warning' : 'neutral';

/** Record identity lives in the body, never in the drawer header. */
const eventBody = (event: SafetyEvent) => html`
  <div style="display:grid;gap:var(--dimension-space-200);min-width:0;">
    <div style="display:grid;gap:var(--dimension-space-025);">
      <ds-text as="h3" variant="text-body-large" color="primary" emphasis wrap="balance">
        ${event.behavior}
      </ds-text>
      <ds-text variant="text-body-small" color="secondary">
        ${event.driver} · ${event.time}
      </ds-text>
    </div>
    <div
      role="img"
      aria-label=${`Camera image for ${event.behavior}`}
      style="aspect-ratio:16 / 9;border-radius:var(--dimension-radius-025);background:var(--color-background-secondary);"
    ></div>
    <div>
      <ds-tag
        label=${event.severity}
        intent=${severityIntent(event.severity)}
        contrast="faint"
        size="md"
        rounded
      ></ds-tag>
    </div>
    <ds-divider></ds-divider>
    <div style="display:grid;gap:var(--dimension-space-100);">
      ${detailRow('Driver', `${event.driver} · ${event.driverId}`)}
      ${detailRow('Vehicle', event.vehicle)} ${detailRow('Location', event.location)}
      ${detailRow('Speed', event.speed)}
    </div>
  </div>
`;

const eventFooter = () => html`
  <ds-button-filled
    slot="footer"
    label="Pending review"
    intent="warning"
    contrast="bold"
    size="md"
  ></ds-button-filled>
  <ds-tooltip slot="footer" label="More event actions" side="top" size="sm">
    <ds-button-unfilled
      variant="icon"
      icon="Ellipses"
      size="md"
      aria-label="More event actions"
      has-border
    ></ds-button-unfilled>
  </ds-tooltip>
`;

const openFullPageAction = (label: string) => html`
  <ds-tooltip slot="header-actions" label=${label} side="bottom" size="sm">
    <ds-button-unfilled
      variant="icon"
      icon="ArrowTopRightSquare"
      size="md"
      aria-label=${label}
      .hasBorder=${false}
    ></ds-button-unfilled>
  </ds-tooltip>
`;

const eventRows = (selected: number | null, onSelect: (index: number) => void) => html`
  <div role="list" style="display:grid;">
    ${EVENTS.map(
      (event, index) => html`
        <button
          type="button"
          role="listitem"
          aria-current=${selected === index ? 'true' : nothing}
          data-event-row=${index}
          @click=${() => onSelect(index)}
          style="all:unset;box-sizing:border-box;display:grid;grid-template-columns:minmax(0,2fr) minmax(0,2fr) minmax(0,3fr);gap:var(--dimension-space-200);padding:var(--dimension-space-150) var(--dimension-space-200);border-block-end:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);cursor:pointer;background:${selected ===
          index
            ? 'var(--color-background-faint-neutral)'
            : 'transparent'};"
        >
          <span style="display:grid;gap:var(--dimension-space-025);">
            <ds-text as="span" variant="text-body-medium" color="primary"
              >${event.behavior}</ds-text
            >
            <ds-text as="span" variant="text-body-small" color="secondary"
              >${event.severity}</ds-text
            >
          </span>
          <span style="display:grid;gap:var(--dimension-space-025);">
            <ds-text as="span" variant="text-body-medium" color="primary">${event.driver}</ds-text>
            <ds-text as="span" variant="text-body-small" color="secondary"
              >${event.driverId}</ds-text
            >
          </span>
          <ds-text as="span" variant="text-body-small" color="secondary">${event.time}</ds-text>
        </button>
      `
    )}
  </div>
`;

/** Owner state for a list with a details drawer: selection, paging, and focus return. */
function eventDetailsView(
  state: { selected: number | null; open: boolean },
  set: (patch: Partial<{ selected: number | null; open: boolean }>) => void
) {
  const event = state.selected === null ? null : EVENTS[state.selected];
  const restoreRowFocus = (restore: boolean) => {
    if (restore && state.selected !== null) {
      document.querySelector<HTMLElement>(`[data-event-row="${state.selected}"]`)?.focus();
    }
    set({ selected: null });
  };
  return html`
    ${eventRows(state.open ? state.selected : null, index => set({ selected: index, open: true }))}
    <ds-drawer
      heading="Event details"
      close-aria-label="Close event details"
      navigation
      previous-aria-label="Previous event"
      next-aria-label="Next event"
      .open=${state.open}
      .previousAvailable=${(state.selected ?? 0) > 0}
      .nextAvailable=${state.selected !== null && state.selected < EVENTS.length - 1}
      @dsPrevious=${() => set({ selected: (state.selected ?? 1) - 1 })}
      @dsNext=${() => set({ selected: (state.selected ?? -1) + 1 })}
      @dsClose=${() => set({ open: false })}
      @dsAfterClose=${(afterClose: CustomEvent<{ restoreFocus: boolean }>) =>
        restoreRowFocus(afterClose.detail.restoreFocus)}
    >
      ${openFullPageAction('View event page')} ${event ? eventBody(event) : nothing}
      ${event ? eventFooter() : nothing}
    </ds-drawer>
  `;
}

/**
 * Canonical details drawer rendered by the page inside ShellApp: it covers the
 * content lane only and stays put while the page scrolls, the list stays
 * interactive, and the footer pages records (also with Left and Right while
 * focus is outside text and choice controls).
 */
export const EventDetails: Story = {
  render: () =>
    statefulStory({ selected: 0 as number | null, open: true }, (state, set) => {
      const page = eventDetailsView(state, set);
      return html`
        <div style="height:100vh;">
          <ds-shell-app
            .navigation=${SHELL_NAVIGATION}
            .pageChrome=${SHELL_PAGE_CHROME}
            .tools=${SHELL_TOOLS}
            gradient-preset="neutral"
            style="height:100%;"
          >
            <section style="min-height:100%;box-sizing:border-box;">${page}</section>
          </ds-shell-app>
        </div>
      `;
    }),
};

/** Outside a shell the drawer attaches to the viewport edge. */
export const Standalone: Story = {
  render: () =>
    statefulStory(
      { selected: 1 as number | null, open: true },
      (state, set) => html`
        <div
          style="min-height:100vh;box-sizing:border-box;background:var(--color-background-primary);"
        >
          ${eventDetailsView(state, set)}
        </div>
      `
    ),
};

interface VehicleState {
  open: boolean;
  depth: 'vehicle' | 'driver';
}

/** Multi-depth content: Back returns one level while Close dismisses the whole drawer. */
export const MultiDepth: Story = {
  render: () =>
    statefulStory<VehicleState>(
      { open: true, depth: 'vehicle' },
      (state, set) => html`
        <div
          style="min-height:100vh;padding:var(--dimension-space-300);box-sizing:border-box;background:var(--color-background-primary);"
        >
          <ds-button-unfilled
            label="Open vehicle details"
            has-border
            @dsClick=${() => set({ open: true, depth: 'vehicle' })}
          ></ds-button-unfilled>
          <ds-drawer
            heading=${state.depth === 'vehicle' ? 'Vehicle details' : 'Driver details'}
            back-label=${state.depth === 'driver' ? 'Back to vehicle' : nothing}
            close-aria-label="Close details"
            .open=${state.open}
            @dsBack=${() => set({ depth: 'vehicle' })}
            @dsClose=${() => set({ open: false })}
          >
            ${openFullPageAction(
              state.depth === 'vehicle' ? 'View vehicle page' : 'View driver page'
            )}
            ${state.depth === 'vehicle'
              ? html`
                  <div style="display:grid;gap:var(--dimension-space-200);">
                    <div style="display:grid;gap:var(--dimension-space-025);">
                      <ds-text as="h3" variant="text-body-large" color="primary" emphasis>
                        CA251
                      </ds-text>
                      <ds-text variant="text-body-small" color="secondary">WA WA74851</ds-text>
                    </div>
                    <ds-divider></ds-divider>
                    <div style="display:grid;gap:var(--dimension-space-050);">
                      <ds-text variant="text-caption" color="secondary">Current driver</ds-text>
                      <div style="display:flex;align-items:center;justify-content:space-between;">
                        <ds-text variant="text-body-medium" color="primary"
                          >George Mitchell</ds-text
                        >
                        <ds-button-unfilled
                          label="View driver"
                          size="sm"
                          has-border
                          @dsClick=${() => set({ depth: 'driver' })}
                        ></ds-button-unfilled>
                      </div>
                    </div>
                    <ds-divider></ds-divider>
                    ${detailRow('Status', 'Moving · 38 mph')}
                    ${detailRow('Location', 'I-10 East, Phoenix, AZ')}
                    ${detailRow('Odometer', '28,900 mi')}
                  </div>
                `
              : html`
                  <div style="display:grid;gap:var(--dimension-space-200);">
                    <div style="display:grid;gap:var(--dimension-space-025);">
                      <ds-text as="h3" variant="text-body-large" color="primary" emphasis>
                        George Mitchell
                      </ds-text>
                      <ds-text variant="text-body-small" color="secondary">DRV4159</ds-text>
                    </div>
                    <ds-divider></ds-divider>
                    ${detailRow('Duty status', 'Driving · 6h 12m left')}
                    ${detailRow('Phone', '(555) 010-4471')}
                    ${detailRow('Home terminal', 'Phoenix, AZ')}
                  </div>
                `}
            <ds-button-filled slot="footer" label="Message driver" size="md"></ds-button-filled>
            <ds-button-unfilled
              slot="footer"
              label="Call vehicle"
              size="md"
              has-border
            ></ds-button-unfilled>
          </ds-drawer>
        </div>
      `
    ),
};

/** The same drawer as a modal: shade, contained focus, and dismissal by Close, Escape, or the shade. */
export const Modal: Story = {
  render: () =>
    statefulStory(
      { open: true },
      (state, set) => html`
        <div
          style="min-height:100vh;padding:var(--dimension-space-300);box-sizing:border-box;background:var(--color-background-primary);"
        >
          <ds-button-unfilled
            label="Edit task"
            has-border
            @dsClick=${() => set({ open: true })}
          ></ds-button-unfilled>
          <ds-drawer
            heading="Edit task"
            modal
            close-aria-label="Close edit task"
            .open=${state.open}
            @dsClose=${() => set({ open: false })}
          >
            <div style="display:grid;gap:var(--dimension-space-200);">
              <ds-field label="Title">
                <ds-input value="Replace NOx sensor"></ds-input>
              </ds-field>
              <ds-field label="Notes">
                <ds-textarea value="Parts on order. Schedule for Thursday."></ds-textarea>
              </ds-field>
              <div style="display:flex;align-items:center;gap:var(--dimension-space-100);">
                <ds-switch checked aria-label="Notify driver"></ds-switch>
                <ds-text as="span" variant="text-body-medium">Notify driver</ds-text>
              </div>
            </div>
            <ds-button-filled
              slot="footer"
              label="Save"
              @dsClick=${() => set({ open: false })}
            ></ds-button-filled>
            <ds-button-unfilled
              slot="footer"
              label="Cancel"
              has-border
              @dsClick=${() => set({ open: false })}
            ></ds-button-unfilled>
          </ds-drawer>
        </div>
      `
    ),
};

/** body-inset="none" for content that owns its own edges, such as embedded configuration. */
export const FlushBody: Story = {
  render: () => html`
    <div style="min-height:100vh;background:var(--color-background-primary);">
      <ds-drawer heading="View configuration" body-inset="none" open>
        <div style="display:grid;">
          ${['Columns', 'Filters', 'Sort', 'Grouping'].map(
            label => html`
              <div
                style="display:flex;align-items:center;justify-content:space-between;padding:var(--dimension-space-150) var(--dimension-space-200);border-block-end:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);"
              >
                <ds-text variant="text-body-medium" color="primary">${label}</ds-text>
                <ds-text variant="text-body-small" color="secondary">Default</ds-text>
              </div>
            `
          )}
        </div>
        <ds-button-filled slot="footer" label="Apply"></ds-button-filled>
        <ds-button-unfilled slot="footer" label="Reset" has-border></ds-button-unfilled>
      </ds-drawer>
    </div>
  `,
};
