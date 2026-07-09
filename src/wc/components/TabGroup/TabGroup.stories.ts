import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-tab-group.js';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
  { id: 'members',  label: 'Members' },
];

const meta: Meta = {
  title: 'Navigation/TabGroup',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'select', options: tabs.map(t => t.id) },
    background: { control: 'select', options: ['', 'faint', 'medium', 'bold', 'strong', 'always-dark'] },
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
  },
  args: { value: 'overview', orientation: 'horizontal' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => {
    const playgroundTabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'activity', label: 'Activity', dot: true },
      { id: 'settings', label: 'Settings' },
      { id: 'members',  label: 'Members' },
    ];
    return html`
      <div style="width: 400px">
        <ds-tab-group
          .tabs=${playgroundTabs}
          value=${args['value'] ?? 'overview'}
          background=${args['background'] ?? ''}
          orientation=${args['orientation'] ?? 'horizontal'}
          aria-label="Playground tabs"
        ></ds-tab-group>
      </div>
    `;
  },
};

export const WithPanels: Story = {
  render: () => {
    const panelTabs = [
      { id: 'overview', label: 'Overview', panelId: 'panel-overview' },
      { id: 'activity', label: 'Activity', panelId: 'panel-activity' },
      { id: 'settings', label: 'Settings', panelId: 'panel-settings' },
      { id: 'members',  label: 'Members',  panelId: 'panel-members'  },
    ];
    const panelContent: Record<string, string> = {
      overview:  'Overview panel — summary of the item, key metrics, and recent highlights.',
      activity:  'Activity panel — timeline of recent events and changes.',
      settings:  'Settings panel — configure preferences and permissions.',
      members:   'Members panel — manage team members and roles.',
    };
    return html`
      <div style="width: 480px" ${ref(el => {
        if (!el) return;
        const tabGroup = el.querySelector('ds-tab-group') as HTMLElement & { value: string };
        if (!tabGroup) return;
        const showPanel = (id: string) => {
          el.querySelectorAll('[role="tabpanel"]').forEach(p => {
            (p as HTMLElement).hidden = (p as HTMLElement).id !== `panel-${id}`;
          });
        };
        tabGroup.addEventListener('dsChange', (e: Event) => showPanel((e as CustomEvent<string>).detail));
        showPanel(tabGroup.value || 'overview');
      })}>
        <ds-tab-group
          .tabs=${panelTabs}
          value="overview"
          aria-label="Content sections"
        ></ds-tab-group>
        <div style="padding: var(--dimension-space-150) 0; color: var(--color-foreground-primary)">
          ${panelTabs.map(t => html`
            <div
              id="panel-${t.id}"
              role="tabpanel"
              aria-labelledby="${t.id}"
            >
              ${panelContent[t.id]}
            </div>
          `)}
        </div>
      </div>
    `;
  },
};

export const WithDot: Story = {
  render: () => html`
    <ds-tab-group
      .tabs=${[
        { id: 'inbox',    label: 'Inbox',    dot: true },
        { id: 'sent',     label: 'Sent'  },
        { id: 'drafts',   label: 'Drafts', dot: true },
        { id: 'archived', label: 'Archived' },
      ]}
      value="inbox"
      aria-label="Mailbox tabs"
    ></ds-tab-group>
  `,
};

export const Vertical: Story = {
  render: () => {
    const verticalTabs = [
      { id: 'overview', label: 'Overview', panelId: 'vpanel-overview' },
      { id: 'activity', label: 'Activity', panelId: 'vpanel-activity' },
      { id: 'settings', label: 'Settings', panelId: 'vpanel-settings' },
      { id: 'members',  label: 'Members',  panelId: 'vpanel-members'  },
    ];
    const panelContent: Record<string, string> = {
      overview:  'Overview panel — summary and key metrics.',
      activity:  'Activity panel — recent timeline.',
      settings:  'Settings panel — configure preferences.',
      members:   'Members panel — team and roles.',
    };
    return html`
      <div style="display: flex; gap: var(--dimension-space-150); align-items: flex-start; width: 520px"
        ${ref(el => {
          if (!el) return;
          const tabGroup = el.querySelector('ds-tab-group') as HTMLElement & { value: string };
          if (!tabGroup) return;
          const showPanel = (id: string) => {
            el.querySelectorAll('[role="tabpanel"]').forEach(p => {
              (p as HTMLElement).hidden = (p as HTMLElement).id !== `vpanel-${id}`;
            });
          };
          tabGroup.addEventListener('dsChange', (e: Event) => showPanel((e as CustomEvent<string>).detail));
          showPanel(tabGroup.value || 'overview');
        })}>
        <ds-tab-group
          .tabs=${verticalTabs}
          value="overview"
          orientation="vertical"
          aria-label="Vertical navigation"
          style="width: 140px; flex-shrink: 0"
        ></ds-tab-group>
        <div style="flex: 1; padding: var(--dimension-space-100) 0; color: var(--color-foreground-primary)">
          ${verticalTabs.map(t => html`
            <div
              id="vpanel-${t.id}"
              role="tabpanel"
              aria-labelledby="${t.id}"
            >
              ${panelContent[t.id]}
            </div>
          `)}
        </div>
      </div>
    `;
  },
};

export const WithInactive: Story = {
  render: () => html`
    <ds-tab-group
      .tabs=${[
        { id: 'overview', label: 'Overview' },
        { id: 'activity', label: 'Activity', isInactive: true },
        { id: 'settings', label: 'Settings' },
      ]}
      value="overview"
      aria-label="Tabs with inactive item"
    ></ds-tab-group>
  `,
};

export const TwoTabs: Story = {
  render: () => html`
    <ds-tab-group
      .tabs=${[{ id: 'list', label: 'List' }, { id: 'grid', label: 'Grid' }]}
      value="list"
      aria-label="View mode"
    ></ds-tab-group>
  `,
};

export const WithDivider: Story = {
  name: 'With divider between groups',
  render: () => html`
    <ds-tab-group
      .tabs=${[
        { id: 'live-map',         label: 'Live Map' },
        { id: 'location-history', label: 'Location History' },
        { id: 'trips',            label: 'Trips' },
        { type: 'divider' },
        { id: 'overview', label: 'Overview' },
        { id: 'events',   label: 'Events', dot: true },
        { id: 'requests', label: 'Requests' },
      ]}
      value="live-map"
      aria-label="Fleet and safety sections"
    ></ds-tab-group>
  `,
};
