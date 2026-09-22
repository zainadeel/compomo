import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-navigation-tab-group.js';
import '../../../../dist/components/ds-tab-group.js';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
];

const meta: Meta = {
  title: 'Navigation/NavigationTabGroup',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Roomy local-panel tabs for primary, secondary, or faint surfaces. Use TabGroup when the row must align beside ordinary controls.',
      },
    },
  },
  argTypes: {
    value: { control: 'select', options: tabs.map(tab => tab.id) },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    width: { control: 'select', options: ['hug', 'fill'] },
  },
  args: { value: 'overview', size: 'md', width: 'hug' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width:min(100%,var(--dimension-form-width-md));">
      <ds-navigation-tab-group
        .tabs=${tabs}
        value=${args['value'] ?? 'overview'}
        size=${args['size'] ?? 'md'}
        width=${args['width'] ?? 'hug'}
        aria-label="Panel sections"
      ></ds-navigation-tab-group>
    </div>
  `,
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:flex;flex-direction:column;align-items:flex-start;gap:var(--dimension-space-200);"
    >
      ${(['sm', 'md', 'lg'] as const).map(
        size => html`
          <ds-navigation-tab-group
            .tabs=${tabs}
            value="overview"
            size=${size}
            aria-label=${`${size} panel sections`}
          ></ds-navigation-tab-group>
        `
      )}
    </div>
  `,
};

export const BasicBackgrounds: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:grid;gap:var(--dimension-space-200);width:min(100%,var(--dimension-modal-width-lg));"
    >
      ${[
        ['Primary', 'var(--color-background-primary)'],
        ['Secondary', 'var(--color-background-secondary)'],
        ['Faint', 'var(--color-background-faint-neutral)'],
      ].map(
        ([label, background]) => html`
          <div
            style="display:flex;flex-direction:column;gap:var(--dimension-space-100);padding:var(--dimension-space-200);border-radius:var(--dimension-radius-050);background:${background};"
          >
            <span
              style="color:var(--color-foreground-secondary);font:var(--typography-text-caption-font);"
              >${label}</span
            >
            <ds-navigation-tab-group
              .tabs=${tabs}
              value="activity"
              aria-label=${`${label} surface sections`}
            ></ds-navigation-tab-group>
          </div>
        `
      )}
    </div>
  `,
};

export const WithPanels: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const panelTabs = tabs.map(tab => ({ ...tab, panelId: `navigation-panel-${tab.id}` }));
    return html`
      <div
        style="width:min(100%,var(--dimension-form-width-md));"
        ${ref(element => {
          if (!element) return;
          const group = element.querySelector('ds-navigation-tab-group');
          if (!group) return;
          const showPanel = (id: string) => {
            element.querySelectorAll<HTMLElement>('[role="tabpanel"]').forEach(panel => {
              panel.hidden = panel.id !== `navigation-panel-${id}`;
            });
          };
          group.addEventListener('dsChange', event =>
            showPanel((event as CustomEvent<string>).detail)
          );
          showPanel('overview');
        })}
      >
        <ds-navigation-tab-group
          .tabs=${panelTabs}
          value="overview"
          width="fill"
          aria-label="Workspace panels"
        ></ds-navigation-tab-group>
        <div style="padding:var(--dimension-space-200) 0;color:var(--color-foreground-primary);">
          ${panelTabs.map(
            tab => html`
              <div id=${tab.panelId} role="tabpanel" aria-label=${`${tab.label} panel`}>
                ${tab.label} panel content.
              </div>
            `
          )}
        </div>
      </div>
    `;
  },
};
