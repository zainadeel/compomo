import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-map-marker.js';

const INTENTS = ['brand', 'neutral', 'positive', 'warning', 'caution', 'negative'] as const;

const REVIEW_SURFACE = `
  display: grid;
  gap: var(--dimension-space-300);
  width: min(calc(var(--dimension-size-800) * 10), 80vw);
  padding: var(--dimension-space-400);
  border-radius: var(--dimension-radius-200);
  background:
    linear-gradient(var(--color-translucent-translucent), var(--color-translucent-translucent)),
    var(--color-background-faint-neutral);
`;

const meta: Meta = {
  title: 'Maps/MapMarker',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    caption: { control: 'text' },
    icon: { control: 'text' },
    intent: { control: 'select', options: INTENTS },
    dimmed: { control: 'boolean' },
  },
  args: {
    label: 'Open harsh braking event',
    caption: 'Harsh braking',
    icon: 'MapShieldCircle',
    intent: 'negative',
    dimmed: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style=${REVIEW_SURFACE}>
      <ds-map-marker
        label=${args['label']}
        caption=${args['caption']}
        icon=${args['icon']}
        intent=${args['intent']}
        ?dimmed=${args['dimmed']}
      ></ds-map-marker>
      <ds-text as="p" variant="text-body-small" color="secondary">
        Hover the marker or focus it with Tab to review its caption and focus treatment.
      </ds-text>
    </div>
  `,
};

export const Intents: Story = {
  name: 'Review · intents',
  render: () => html`
    <div style=${REVIEW_SURFACE}>
      <div
        style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--dimension-space-600)"
      >
        ${INTENTS.map(
          intent => html`
            <div
              style="display: grid; justify-items: center; gap: var(--dimension-space-150); min-width: calc(var(--dimension-size-800) * 2)"
            >
              <ds-map-marker
                label=${`Open ${intent} safety event`}
                caption=${intent.charAt(0).toUpperCase() + intent.slice(1)}
                icon="MapShieldCircle"
                intent=${intent}
              ></ds-map-marker>
              <ds-text as="span" variant="text-caption" color="secondary">${intent}</ds-text>
            </div>
          `
        )}
      </div>
      <ds-text as="p" variant="text-body-small" color="secondary">
        The application assigns intent from the meaning of each mapped point and provides that
        meaning outside color alone.
      </ds-text>
    </div>
  `,
};

export const SelectionContext: Story = {
  name: 'Review · owner-managed selection context',
  render: () => html`
    <div style=${REVIEW_SURFACE}>
      <div style="display: flex; align-items: center; gap: var(--dimension-space-800)">
        <ds-map-marker
          label="Open selected safety event"
          caption="Selected event"
          icon="MapShieldCircle"
          intent="negative"
        ></ds-map-marker>
        <ds-map-marker
          label="Open reviewed safety event"
          caption="Reviewed event"
          icon="MapShieldCircle"
          intent="positive"
          dimmed
        ></ds-map-marker>
        <ds-map-marker
          label="Open unassigned safety event"
          caption="Unassigned event"
          icon="MapShieldCircle"
          intent="neutral"
          dimmed
        ></ds-map-marker>
      </div>
      <ds-text as="p" variant="text-body-small" color="secondary">
        The map owner decides which peer markers become dimmed when a detail surface is open.
        Hovered or focused peers return to full emphasis while their caption is visible.
      </ds-text>
    </div>
  `,
};
