import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-panel-sub-nav.js';

const items = [
  { id: 'profile-tab', label: 'Profile', panelId: 'profile-panel' },
  { id: 'notifications-tab', label: 'Notifications', panelId: 'notifications-panel' },
  { id: 'permissions-tab', label: 'Permissions', panelId: 'permissions-panel' },
  { id: 'integrations-tab', label: 'Integrations', panelId: 'integrations-panel' },
];

const panelContent: Record<string, string> = {
  'profile-tab': 'Profile settings and account information.',
  'notifications-tab': 'Notification channels and delivery preferences.',
  'permissions-tab': 'Roles, permissions, and access policies.',
  'integrations-tab': 'Connected applications and service integrations.',
};

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
  title: 'Navigation/PanelSubNav',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'select', options: items.map(item => item.id) },
    background: {
      control: 'select',
      options: [...new Set(BACKGROUND_SURFACES.map(surface => surface.value))],
    },
  },
  args: {
    value: 'profile-tab',
    background: '',
  },
};

export default meta;
type Story = StoryObj;

function panelSubNavExample(exampleItems: typeof items, value: string, background = '') {
  const surface = BACKGROUND_SURFACES.find(option => option.value === background)
    ?? BACKGROUND_SURFACES[0];
  const subNav = html`
    <ds-panel-sub-nav
      .items=${exampleItems}
      value=${value}
      background=${background}
      aria-label="Settings sections"
    ></ds-panel-sub-nav>
  `;
  return html`
    <div
      style="
        display: grid;
        grid-template-columns: minmax(160px, 1fr) minmax(280px, 2fr);
        gap: var(--dimension-space-200);
        width: 560px;
      "
      ${ref(element => {
        if (!element) return;
        const subNav = element.querySelector('ds-panel-sub-nav') as HTMLElement & { value: string };
        if (!subNav) return;
        const showPanel = (id: string) => {
          element.querySelectorAll('[role="tabpanel"]').forEach(panel => {
            (panel as HTMLElement).hidden = panel.id !== exampleItems.find(item => item.id === id)?.panelId;
          });
        };
        subNav.addEventListener('dsChange', event => {
          showPanel((event as CustomEvent<string>).detail);
        });
        showPanel(subNav.value || value);
      })}
    >
      ${background
        ? html`
          <div
            style="
              padding:var(--dimension-space-150);
              border-radius:var(--dimension-radius-100);
              background:${surface.background};
            "
          >
            ${subNav}
          </div>
        `
        : subNav}
      <div style="color: var(--color-foreground-primary)">
        ${exampleItems.map(item => html`
          <section
            id=${item.panelId}
            role="tabpanel"
            aria-labelledby=${item.id}
            tabindex="0"
          >
            <ds-text as="h3" variant="text-heading-xs" color="primary">${item.label}</ds-text>
            <ds-text as="p" variant="text-body-medium" color="secondary">
              ${panelContent[item.id]}
            </ds-text>
          </section>
        `)}
      </div>
    </div>
  `;
}

export const Playground: Story = {
  render: args => panelSubNavExample(
    items,
    args['value'] ?? 'profile-tab',
    args['background'] ?? '',
  ),
};

export const Backgrounds: Story = {
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(3, minmax(180px, 1fr));gap:var(--dimension-space-150);">
      ${BACKGROUND_SURFACES.map(surface => {
        const prefix = surface.id;
        const surfaceItems = items.slice(0, 3).map(item => ({
          ...item,
          id: `${prefix}-${item.id}`,
          panelId: `${prefix}-${item.panelId}`,
        }));
        return html`
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
            <span style="color:${surface.labelColor};font:var(--typography-text-caption-font);">
              ${surface.label}
            </span>
            <ds-panel-sub-nav
              .items=${surfaceItems}
              value=${surfaceItems[0]?.id}
              background=${surface.value}
              aria-label="${surface.label} panel sub-navigation"
            ></ds-panel-sub-nav>
            ${surfaceItems.map(item => html`
              <div id=${item.panelId} role="tabpanel" aria-labelledby=${item.id} hidden></div>
            `)}
          </div>
        `;
      })}
    </div>
  `,
};

export const WithInactiveItem: Story = {
  render: () => panelSubNavExample(
    items.map(item => item.id === 'permissions-tab' ? { ...item, isInactive: true } : item),
    'profile-tab',
  ),
};
