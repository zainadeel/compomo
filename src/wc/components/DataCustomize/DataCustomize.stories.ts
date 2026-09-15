import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-data-customize.js';
import '../../../../dist/components/ds-data-toolbar.js';
import '../../../../dist/components/ds-data-search.js';

const CARD_FIELDS = [
  { id: 'driverId', label: 'Driver ID' },
  { id: 'vehicleMmy', label: 'Vehicle MMY' },
  { id: 'assetType', label: 'Asset Type · MMY' },
  { id: 'motion', label: 'Motion detail' },
  { id: 'lastUpdated', label: 'Last updated' },
];

const meta: Meta = { title: 'Data controls/Customize', component: 'ds-data-customize' };
export default meta;
type Story = StoryObj;

const apply = (e: CustomEvent) => {
  const el = e.currentTarget as HTMLDsDataCustomizeElement;
  el.hiddenFieldIds = e.detail.hiddenFieldIds;
  el.fieldOrder = e.detail.fieldOrder;
};

/** Default: show and hide only, nothing locked, no drag handles. */
export const ShowAndHide: Story = {
  render: () =>
    html`<div style="padding: var(--dimension-space-400);">
      <ds-data-customize
        .fields=${CARD_FIELDS}
        .hiddenFieldIds=${['assetType']}
        @dsFieldsConfigChange=${apply}
      ></ds-data-customize>
    </div>`,
};

/** An Options section sits below the catalog and emits its own event. */
export const WithOptions: Story = {
  render: () =>
    html`<div style="padding: var(--dimension-space-400);">
      <ds-data-customize
        aria-label="Customize view"
        .fields=${CARD_FIELDS}
        .options=${[{ label: 'Show applied filters', value: 'show-filters', showSwitch: true }]}
        @dsFieldsConfigChange=${apply}
        @dsOptionChange=${(e: CustomEvent) => console.info('option', e.detail)}
      ></ds-data-customize>
    </div>`,
};

/** Reorder is opt-in, for a view that has a display order to express. */
export const Reorderable: Story = {
  render: () =>
    html`<div style="padding: var(--dimension-space-400);">
      <ds-data-customize
        reorderable
        .minVisible=${1}
        .fields=${CARD_FIELDS}
        @dsFieldsConfigChange=${apply}
      ></ds-data-customize>
    </div>`,
};

/** Sitting in a toolbar as a peer of the other data controls. */
export const InToolbar: Story = {
  render: () =>
    html`<div style="padding: var(--dimension-space-400); width: 520px;">
      <ds-data-toolbar label="Map controls" borderless>
        <ds-data-search slot="search" .fields=${CARD_FIELDS}></ds-data-search>
        <ds-data-customize
          slot="trailing"
          aria-label="Customize view"
          .fields=${CARD_FIELDS}
          @dsFieldsConfigChange=${apply}
        ></ds-data-customize>
      </ds-data-toolbar>
    </div>`,
};
