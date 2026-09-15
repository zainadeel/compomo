import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-map-entity-marker.js';

const STATES = ['in-motion', 'idling', 'stationary', 'immobilized', 'stale'] as const;
const ENTITY_KINDS = [
  { icon: 'MapEntityTravelGroup', label: 'Travel group' },
  { icon: 'MapEntityVehicle', label: 'Vehicle' },
  { icon: 'MapEntityAsset', label: 'Asset' },
  { icon: 'MapEntityPerson', label: 'Person' },
] as const;

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

const REVIEW_ROW = `
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  align-items: center;
  gap: var(--dimension-space-300);
`;

const meta: Meta = {
  title: 'Maps/MapEntityMarker',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    caption: { control: 'text' },
    icon: { control: 'select', options: ENTITY_KINDS.map(kind => kind.icon) },
    state: { control: 'select', options: STATES },
    stale: { control: 'boolean' },
    heading: { control: { type: 'range', min: -360, max: 720, step: 15 } },
    dimmed: { control: 'boolean' },
  },
  args: {
    label: 'Open vehicle 412',
    caption: 'Vehicle 412',
    icon: 'MapEntityTravelGroup',
    state: 'in-motion',
    stale: false,
    heading: 45,
    dimmed: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style=${REVIEW_SURFACE}>
      <ds-map-entity-marker
        label=${args['label']}
        caption=${args['caption']}
        icon=${args['icon']}
        state=${args['state']}
        heading=${args['heading']}
        ?stale=${args['stale']}
        ?dimmed=${args['dimmed']}
      ></ds-map-entity-marker>
      <ds-text as="p" variant="text-body-small" color="secondary">
        Hover the marker or focus it with Tab to review its caption and focus treatment.
      </ds-text>
    </div>
  `,
};

export const Review: Story = {
  name: 'Review · states and stale data',
  render: () => html`
    <div style=${REVIEW_SURFACE}>
      <div style=${REVIEW_ROW}>
        <ds-text as="span" variant="text-caption" color="secondary" emphasis>State</ds-text>
        <ds-text as="span" variant="text-caption" color="secondary" emphasis>Current</ds-text>
        <ds-text as="span" variant="text-caption" color="secondary" emphasis>Stale</ds-text>
      </div>
      ${STATES.filter(state => state !== 'stale').map(
        (state, index) => html`
          <div style=${REVIEW_ROW}>
            <ds-text as="span" variant="text-body-small" color="primary">${state}</ds-text>
            <ds-map-entity-marker
              label=${`Open ${state} vehicle`}
              caption=${`Vehicle ${412 + index}`}
              state=${state}
              heading=${index * 45}
            ></ds-map-entity-marker>
            <ds-map-entity-marker
              label=${`Open stale ${state} vehicle`}
              caption=${`Vehicle ${512 + index}`}
              state=${state}
              heading=${index * 45}
              stale
            ></ds-map-entity-marker>
          </div>
        `
      )}
      <div style=${REVIEW_ROW}>
        <ds-text as="span" variant="text-body-small" color="primary">unknown stale state</ds-text>
        <ds-map-entity-marker
          label="Open stale vehicle"
          caption="Vehicle 612"
          state="stale"
          stale
        ></ds-map-entity-marker>
        <ds-text as="span" variant="text-caption" color="tertiary">
          Use only when no last-known operating state is available.
        </ds-text>
      </div>
    </div>
  `,
};

export const EntityKinds: Story = {
  name: 'Review · entity kinds and headings',
  render: () => html`
    <div style=${REVIEW_SURFACE}>
      <div
        style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--dimension-space-600)"
      >
        ${ENTITY_KINDS.map(
          (kind, index) => html`
            <div
              style="display: grid; justify-items: center; gap: var(--dimension-space-150); min-width: calc(var(--dimension-size-800) * 2)"
            >
              <ds-map-entity-marker
                label=${`Open ${kind.label.toLowerCase()}`}
                caption=${kind.label}
                icon=${kind.icon}
                state=${STATES[index]}
                heading=${index * 90 + 45}
              ></ds-map-entity-marker>
              <ds-text as="span" variant="text-caption" color="secondary">${kind.label}</ds-text>
            </div>
          `
        )}
      </div>
      <ds-text as="p" variant="text-body-small" color="secondary">
        Travel-group and vehicle glyphs consume heading. Immobilized uses MapKey; asset and person
        glyphs remain upright.
      </ds-text>
    </div>
  `,
};

export const SelectionContext: Story = {
  name: 'Review · owner-managed selection context',
  render: () => html`
    <div style=${REVIEW_SURFACE}>
      <div style="display: flex; align-items: center; gap: var(--dimension-space-800)">
        <ds-map-entity-marker
          label="Open selected vehicle 412"
          caption="Vehicle 412"
          state="in-motion"
          heading="45"
        ></ds-map-entity-marker>
        <ds-map-entity-marker
          label="Open vehicle 205"
          caption="Vehicle 205"
          state="stationary"
          heading="180"
          dimmed
        ></ds-map-entity-marker>
        <ds-map-entity-marker
          label="Open vehicle 317"
          caption="Vehicle 317"
          state="idling"
          heading="270"
          dimmed
        ></ds-map-entity-marker>
      </div>
      <ds-text as="p" variant="text-body-small" color="secondary">
        The map owner decides which peer markers become dimmed when a detail surface is open.
        Hovered or focused peers return to full emphasis while their caption is visible.
      </ds-text>
    </div>
  `,
};
