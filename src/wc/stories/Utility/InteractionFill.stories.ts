import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/InteractionFill',
  parameters: {
    docs: {
      description: {
        component:
          'Shared hover / press / selected overlays (`src/wc/utils/interaction-fill.css`). ' +
          'Apply `.ds-interaction-fill` on the interactive element; opt into selected with ' +
          '`.ds-interaction-fill--selected`. Surface helpers remap tokens for non-default backgrounds. ' +
          'See AGENTS.md — Interaction fill.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function control(label: string, classes: string) {
  return html`
    <button type="button" class="util-demo-control ds-focus-ring-inset ${classes}">
      <span class="ds-interaction-fill__content">${label}</span>
    </button>
  `;
}

export const Overview: Story = {
  render: () => html`
    <div class="util-demo-page">
      <div class="util-demo-section">
        <h2 class="util-demo-h2">Idle / hover / press / selected</h2>
        <p class="util-demo-sub">
          Hover and press paint on <code class="util-demo-code">::after</code>; selected uses
          <code class="util-demo-code">::before</code> with the surface’s
          <code class="util-demo-code">--color-*-interaction-active</code> token. Demo controls are
          transparent so the wash composites over the parent surface (same as real chrome).
        </p>
        <div class="util-demo-row">
          ${control('Idle', 'ds-interaction-fill')}
          ${control('Selected', 'ds-interaction-fill ds-interaction-fill--selected')}
          ${control('Bordered', 'ds-interaction-fill ds-interaction-fill--bordered')}
          ${control(
            'Selected + border',
            'ds-interaction-fill ds-interaction-fill--selected ds-interaction-fill--bordered',
          )}
        </div>
      </div>

      <div class="util-demo-section">
        <h2 class="util-demo-h2">Surface context</h2>
        <p class="util-demo-sub">
          Remap with <code class="util-demo-code">.ds-interaction-fill--on-*</code> so washes match the parent surface.
        </p>
        <div class="util-demo-col">
          <div class="util-demo-surface util-demo-surface--medium">
            <span class="util-demo-label">on-medium</span>
            ${control('Hover me', 'ds-interaction-fill ds-interaction-fill--on-medium')}
            ${control('Selected', 'ds-interaction-fill ds-interaction-fill--on-medium ds-interaction-fill--selected')}
          </div>
          <div class="util-demo-surface util-demo-surface--bold">
            <span class="util-demo-label">on-bold</span>
            ${control('Hover me', 'ds-interaction-fill ds-interaction-fill--on-bold')}
            ${control('Selected', 'ds-interaction-fill ds-interaction-fill--on-bold ds-interaction-fill--selected')}
          </div>
          <div class="util-demo-surface util-demo-surface--strong">
            <span class="util-demo-label">on-strong</span>
            ${control('Hover me', 'ds-interaction-fill ds-interaction-fill--on-strong')}
            ${control('Selected', 'ds-interaction-fill ds-interaction-fill--on-strong ds-interaction-fill--selected')}
          </div>
          <div class="util-demo-surface util-demo-surface--always-dark">
            <span class="util-demo-label" style="color: var(--color-always-dark-foreground-secondary)">always-dark</span>
            ${control('Hover me', 'ds-interaction-fill ds-interaction-fill--on-always-dark')}
            ${control('Selected', 'ds-interaction-fill ds-interaction-fill--on-always-dark ds-interaction-fill--selected')}
          </div>
          <div class="util-demo-surface util-demo-surface--navigation">
            <span class="util-demo-label" style="color: var(--color-navigation-foreground-secondary)">navigation</span>
            ${control('Hover me', 'ds-interaction-fill ds-interaction-fill--on-navigation')}
            ${control('Selected', 'ds-interaction-fill ds-interaction-fill--on-navigation ds-interaction-fill--selected')}
          </div>
        </div>
      </div>
    </div>
  `,
};
