import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-map-cluster-marker.js';

const COUNTS = [1, 8, 24, 99, 999, 1000, 1200, 12840];

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
  title: 'Maps/MapClusterMarker',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    caption: { control: 'text' },
    count: { control: { type: 'number', min: 0 } },
    dimmed: { control: 'boolean' },
  },
  args: {
    label: 'Zoom to 24 vehicles',
    caption: '24 vehicles',
    count: 24,
    dimmed: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style=${REVIEW_SURFACE}>
      <ds-map-cluster-marker
        label=${args['label']}
        caption=${args['caption']}
        count=${args['count']}
        ?dimmed=${args['dimmed']}
      ></ds-map-cluster-marker>
      <ds-text as="p" variant="text-body-small" color="secondary">
        Hover the marker or focus it with Tab to review its caption and focus treatment.
      </ds-text>
    </div>
  `,
};

export const Review: Story = {
  name: 'Review · counts and compaction',
  render: () => html`
    <div style=${REVIEW_SURFACE}>
      <div
        style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--dimension-space-500)"
      >
        ${COUNTS.map(
          count => html`
            <div
              style="display: grid; justify-items: center; gap: var(--dimension-space-150); min-width: var(--dimension-size-800)"
            >
              <ds-map-cluster-marker
                label=${`Zoom to ${count} vehicles`}
                caption=${`${count} vehicles`}
                count=${count}
              ></ds-map-cluster-marker>
              <ds-text as="span" variant="text-caption" color="secondary">${count}</ds-text>
            </div>
          `
        )}
      </div>
    </div>
  `,
};

export const SelectionContext: Story = {
  name: 'Review · owner-managed selection context',
  render: () => html`
    <div style=${REVIEW_SURFACE}>
      <div style="display: flex; align-items: center; gap: var(--dimension-space-800)">
        <ds-map-cluster-marker
          label="Zoom to 24 vehicles"
          caption="24 vehicles"
          count="24"
        ></ds-map-cluster-marker>
        <ds-map-cluster-marker
          label="Zoom to 8 vehicles"
          caption="8 vehicles"
          count="8"
          dimmed
        ></ds-map-cluster-marker>
        <ds-map-cluster-marker
          label="Zoom to 1200 vehicles"
          caption="1,200 vehicles"
          count="1200"
          dimmed
        ></ds-map-cluster-marker>
      </div>
      <ds-text as="p" variant="text-body-small" color="secondary">
        Cluster membership, zooming, and peer dimming stay with the map owner. Hovered or focused
        peers return to full emphasis while their caption is visible.
      </ds-text>
    </div>
  `,
};
