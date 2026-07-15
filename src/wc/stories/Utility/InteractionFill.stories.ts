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

const SURFACE_CONTEXTS = [
  {
    label: 'Faint parent surface',
    className: 'faint',
    helper: 'on-faint',
    backgroundToken: '--color-background-faint-neutral',
  },
  {
    label: 'Medium parent surface',
    className: 'medium',
    helper: 'on-medium',
    backgroundToken: '--color-background-medium-neutral',
  },
  {
    label: 'Bold parent surface',
    className: 'bold',
    helper: 'on-bold',
    backgroundToken: '--color-background-bold-neutral',
  },
  {
    label: 'Strong parent surface',
    className: 'strong',
    helper: 'on-strong',
    backgroundToken: '--color-background-strong-neutral',
  },
  {
    label: 'Translucent parent surface over a brand backdrop',
    className: 'translucent',
    helper: 'on-translucent',
    backgroundToken: '--color-translucent-translucent',
  },
  {
    label: 'Inverted parent surface',
    className: 'inverted',
    helper: 'on-inverted',
    backgroundToken: '--color-inverted-background',
  },
  {
    label: 'Media parent surface',
    className: 'media',
    helper: 'on-media',
    backgroundToken: '--color-media-background',
  },
  {
    label: 'Always-dark parent surface',
    className: 'always-dark',
    helper: 'on-always-dark',
    backgroundToken: '--color-always-dark-background',
  },
  {
    label: 'Navigation parent surface',
    className: 'navigation',
    helper: 'on-navigation',
    backgroundToken: '--color-navigation-background',
  },
] as const;

function control(label: string, classes: string) {
  return html`
    <button type="button" class="util-demo-control ds-focus-ring-inset ${classes}">
      <span class="ds-interaction-fill__content">${label}</span>
    </button>
  `;
}

function surfaceContext(context: (typeof SURFACE_CONTEXTS)[number]) {
  const interactionClasses = `ds-interaction-fill ds-interaction-fill--${context.helper}`;

  return html`
    <div class=${`util-demo-surface util-demo-surface--${context.className}`}>
      <div class="util-demo-surface__description">
        <span class="util-demo-label">${context.label}</span>
        <code class="util-demo-surface__token">${context.backgroundToken}</code>
      </div>
      <div class="util-demo-row">
        ${control('Hover / press', interactionClasses)}
        ${control('Selected fill', `${interactionClasses} ds-interaction-fill--selected`)}
      </div>
    </div>
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
          <code class="util-demo-code">--color-*-interaction-active</code> token. Default primary and
          secondary surfaces use <code class="util-demo-code">--color-interaction-active-brand</code>;
          explicit faint surfaces use <code class="util-demo-code">--color-interaction-active</code>.
          Demo controls are transparent so the wash composites over the parent surface.
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
        <h2 class="util-demo-h2">Same control on different parent surfaces</h2>
        <p class="util-demo-sub">
          The full row is the parent surface. Both controls remain transparent; only
          <strong>Selected fill</strong> paints the surface-aware active overlay.
          <code class="util-demo-code">.ds-interaction-fill--on-*</code> remaps hover, pressed,
          selected, and focus tokens for the contrast underneath.
        </p>
        <div class="util-demo-col">
          ${SURFACE_CONTEXTS.map(surfaceContext)}
        </div>
      </div>
    </div>
  `,
};
