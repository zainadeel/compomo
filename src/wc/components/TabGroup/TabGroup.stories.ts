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

const BACKGROUND_SURFACES = [
  {
    id: 'default-primary',
    value: '',
    label: 'default · primary',
    background: 'var(--color-background-primary)',
    labelColor: 'var(--color-foreground-secondary)',
  },
  {
    id: 'default-secondary',
    value: '',
    label: 'default · secondary',
    background: 'var(--color-background-secondary)',
    labelColor: 'var(--color-foreground-secondary)',
  },
  {
    id: 'faint',
    value: 'faint',
    label: 'faint',
    background: 'var(--color-background-faint-neutral)',
    labelColor: 'var(--color-foreground-secondary)',
  },
  {
    id: 'medium',
    value: 'medium',
    label: 'medium',
    background: 'var(--color-background-medium-neutral)',
    labelColor: 'var(--color-foreground-on-medium-background-secondary)',
  },
  {
    id: 'bold',
    value: 'bold',
    label: 'bold',
    background: 'var(--color-background-bold-neutral)',
    labelColor: 'var(--color-foreground-on-bold-background-secondary)',
  },
  {
    id: 'strong',
    value: 'strong',
    label: 'strong',
    background: 'var(--color-background-strong-neutral)',
    labelColor: 'var(--color-foreground-on-strong-background-secondary)',
  },
  {
    id: 'translucent',
    value: 'translucent',
    label: 'translucent',
    background: 'linear-gradient(var(--color-translucent-translucent), var(--color-translucent-translucent)), var(--color-background-bold-brand)',
    labelColor: 'var(--color-translucent-foreground-secondary)',
  },
  {
    id: 'inverted',
    value: 'inverted',
    label: 'inverted',
    background: 'var(--color-inverted-background)',
    labelColor: 'var(--color-inverted-foreground-secondary)',
  },
  {
    id: 'media',
    value: 'media',
    label: 'media',
    background: 'var(--color-media-background)',
    labelColor: 'var(--color-media-foreground-secondary)',
  },
  {
    id: 'always-dark',
    value: 'always-dark',
    label: 'always-dark',
    background: 'var(--color-always-dark-background)',
    labelColor: 'var(--color-always-dark-foreground-secondary)',
  },
] as const;

const meta: Meta = {
  title: 'Navigation/TabGroup',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'select', options: tabs.map(t => t.id) },
    variant: { control: 'select', options: ['label', 'icon', 'icon-label'] },
    background: {
      control: 'select',
      options: [
        '',
        'faint',
        'medium',
        'bold',
        'strong',
        'translucent',
        'inverted',
        'media',
        'always-dark',
      ],
    },
  },
  args: { value: 'overview', variant: 'label' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => {
    const variant = args['variant'] ?? 'label';
    const playgroundTabs = [
      { id: 'overview', label: 'Overview', icon: 'Bookmark', variant },
      { id: 'activity', label: 'Activity', icon: 'Bolt', variant, dot: true },
      { id: 'settings', label: 'Settings', icon: 'Bell', variant },
      { id: 'members', label: 'Members', icon: 'Avatar', variant },
    ];
    return html`
      <div style="width: 400px">
        <ds-tab-group
          .tabs=${playgroundTabs}
          value=${args['value'] ?? 'overview'}
          background=${args['background'] ?? ''}
          aria-label="Playground tabs"
        ></ds-tab-group>
      </div>
    `;
  },
};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Keep one variant consistent across every selectable item in a TabGroup. Icon-only tabs retain their required label as the accessible name.',
      },
    },
  },
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:var(--dimension-space-150);align-items:flex-start;">
      ${(['label', 'icon', 'icon-label'] as const).map(variant => {
        const variantTabs = [
          { id: `${variant}-overview`, label: 'Overview', icon: 'Bookmark', variant, dot: true },
          { id: `${variant}-activity`, label: 'Activity', icon: 'Bolt', variant },
          { id: `${variant}-settings`, label: 'Settings', icon: 'Bell', variant },
        ];
        return html`
          <div style="display:flex;flex-direction:column;gap:var(--dimension-space-100);">
            <span style="color:var(--color-foreground-tertiary);font:var(--typography-text-caption-font);">
              ${variant}
            </span>
            <ds-tab-group
              .tabs=${variantTabs}
              value=${variantTabs[0]?.id}
              aria-label="${variant} tabs"
            ></ds-tab-group>
          </div>
        `;
      })}
    </div>
  `,
};

/** Current TabGroup surface contexts shown on their actual parent backgrounds. */
export const Backgrounds: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:var(--dimension-space-150);align-items:flex-start;">
      ${BACKGROUND_SURFACES.map(
        surface => html`
          <div
            style="
              display:flex;
              flex-direction:column;
              gap:var(--dimension-space-100);
              padding:var(--dimension-space-150);
              border-radius:var(--dimension-radius-100);
              background:${surface.background};
            "
          >
            <span
              style="
                color:${surface.labelColor};
                font:var(--typography-text-caption-font);
              "
            >
              ${surface.label}
            </span>
            <ds-tab-group
              .tabs=${[
                { id: `${surface.id}-overview`, label: 'Overview', dot: true },
                { id: `${surface.id}-activity`, label: 'Activity' },
                { id: `${surface.id}-settings`, label: 'Settings' },
              ]}
              value=${`${surface.id}-overview`}
              background=${surface.value}
              aria-label="${surface.label} background tabs"
            ></ds-tab-group>
          </div>
        `,
      )}
    </div>
  `,
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
