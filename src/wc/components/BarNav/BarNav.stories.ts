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
  { id: 'search',        icon: 'MagnifyingGlass', ariaLabel: 'Go to / Search' },
  { id: 'messages',      icon: 'MessageBubble',   ariaLabel: 'Messages',      dot: true  },
  { id: 'notifications', icon: 'Bell',            ariaLabel: 'Notifications', dot: true  },
  { id: 'assistant',     icon: 'AI',              ariaLabel: 'Assistant' },
];

const meta: Meta = {
  title: 'Navigation/BarNav',
  tags: ['autodocs'],
  argTypes: {
    value:      { control: 'select', options: fleetTabs.map(t => t.id) },
    background: { control: 'select', options: ['primary', 'secondary', 'transparent', 'translucent'] },
    heading:    { control: 'text' },
  },
  args: {
    value: 'live-map',
    background: 'secondary',
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
        background=${args['background'] ?? 'secondary'}
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
