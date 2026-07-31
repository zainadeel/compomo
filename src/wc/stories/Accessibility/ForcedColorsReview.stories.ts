import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-card-data-viz.js';
import '../../../../dist/components/ds-chart-donut.js';
import '../../../../dist/components/ds-chart-legend.js';
import '../../../../dist/components/ds-checkbox.js';
import '../../../../dist/components/ds-divider.js';
import '../../../../dist/components/ds-input.js';
import '../../../../dist/components/ds-loader.js';
import '../../../../dist/components/ds-menu.js';
import '../../../../dist/components/ds-modal.js';
import '../../../../dist/components/ds-panel-sub-nav.js';
import '../../../../dist/components/ds-radio.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-skeleton.js';
import '../../../../dist/components/ds-slider.js';
import '../../../../dist/components/ds-switch.js';
import '../../../../dist/components/ds-tab-group.js';
import '../../../../dist/components/ds-tooltip.js';

const meta: Meta = {
  title: 'Accessibility/Forced Colors Review',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Representative review surface for Windows High Contrast and browser forced-colors mode. ' +
          'Enable a system contrast theme before reviewing: boundaries, focus, checked/selected/invalid/disabled states, ' +
          'loading feedback, and chart categories must remain distinguishable without relying on normal fills or shadows.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const availability = [
  { label: 'In service', value: 100 },
  { label: 'In shop', value: 50 },
  { label: 'Missing', value: 25 },
  { label: 'Out of service', value: 25 },
];

const pageStyle =
  'box-sizing:border-box;min-height:100vh;padding:var(--dimension-space-400);' +
  'background:var(--color-background-secondary);color:var(--color-foreground-primary);' +
  'font-family:var(--typography-font-family);';
const gridStyle =
  'display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:var(--dimension-space-300);';
const sectionStyle =
  'display:flex;flex-direction:column;gap:var(--dimension-space-150);padding:var(--dimension-space-300);' +
  'background:var(--color-background-primary);border:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);' +
  'border-radius:var(--dimension-radius-050);';
const rowStyle =
  'display:flex;align-items:center;flex-wrap:wrap;gap:var(--dimension-space-150);';

export const ControlsNavigationAndLoading: Story = {
  name: 'Controls, navigation, and loading',
  render: () => html`
    <main style=${pageStyle}>
      <h1 style="margin-block-start:0">Forced-colors review</h1>
      <p>
        In a forced-colors environment, verify real boundaries, state marks, and
        keyboard focus instead of the normal theme palette.
      </p>
      <div style=${gridStyle}>
        <section style=${sectionStyle}>
          <h2 style="margin:0">Actions and editing</h2>
          <div style=${rowStyle}>
            <ds-button-filled label="Continue"></ds-button-filled>
            <ds-button-unfilled label="Secondary" has-border></ds-button-unfilled>
            <ds-button-filled label="Unavailable" is-inactive></ds-button-filled>
          </div>
          <ds-input
            value="Entered value"
            icon="MagnifyingGlass"
            aria-label="Entered value"
          ></ds-input>
          <ds-input
            value="Invalid value"
            error
            error-message="Review this value"
            aria-label="Invalid value"
          ></ds-input>
          <ds-select
            value="ca"
            aria-label="Region"
            ${ref(element => {
              if (!element) return;
              (element as HTMLDsSelectElement).options = [
                { label: 'Canada', value: 'ca' },
                { label: 'United States', value: 'us' },
              ];
            })}
          ></ds-select>
        </section>

        <section style=${sectionStyle}>
          <h2 style="margin:0">Selection</h2>
          <div style=${rowStyle}>
            <ds-checkbox label="Checked" checked></ds-checkbox>
            <ds-checkbox label="Unchecked"></ds-checkbox>
            <ds-checkbox label="Unavailable" is-inactive></ds-checkbox>
          </div>
          <ds-radio
            value="standard"
            aria-label="Plan"
            ${ref(element => {
              if (!element) return;
              (element as HTMLDsRadioElement).options = [
                { label: 'Standard', value: 'standard' },
                { label: 'Premium', value: 'premium' },
                { label: 'Unavailable', value: 'unavailable', isInactive: true },
              ];
            })}
          ></ds-radio>
          <div style=${rowStyle}>
            <ds-switch checked aria-label="Alerts on"></ds-switch>
            <ds-switch aria-label="Alerts off"></ds-switch>
            <ds-switch is-inactive aria-label="Alerts unavailable"></ds-switch>
          </div>
          <ds-slider value="40" label="Volume"></ds-slider>
        </section>

        <section style=${sectionStyle}>
          <h2 style="margin:0">Navigation</h2>
          <ds-tab-group
            value="overview"
            aria-label="Content views"
            ${ref(element => {
              if (!element) return;
              (element as HTMLDsTabGroupElement).tabs = [
                { id: 'overview', label: 'Overview', dot: true },
                { id: 'activity', label: 'Activity' },
                { id: 'settings', label: 'Settings', isInactive: true },
              ];
            })}
          ></ds-tab-group>
          <ds-panel-sub-nav
            value="summary"
            aria-label="Settings sections"
            ${ref(element => {
              if (!element) return;
              (element as HTMLDsPanelSubNavElement).items = [
                { id: 'summary', label: 'Summary', panelId: 'summary-panel' },
                {
                  id: 'history',
                  label: 'History',
                  panelId: 'history-panel',
                  isInactive: true,
                },
                { id: 'rules', label: 'Rules', panelId: 'rules-panel' },
              ];
            })}
          ></ds-panel-sub-nav>
          <div id="summary-panel" role="tabpanel">Selected panel content</div>
          <div id="history-panel" role="tabpanel" hidden></div>
          <div id="rules-panel" role="tabpanel" hidden></div>
        </section>

        <section style=${sectionStyle} aria-busy="true">
          <h2 style="margin:0">Loading</h2>
          <div style=${rowStyle}>
            <ds-loader label="Loading vehicle details"></ds-loader>
            <span>Loading vehicle details</span>
          </div>
          <ds-skeleton variant="text" text-variant="text-body-medium"></ds-skeleton>
          <ds-skeleton variant="control" control-size="md" width="200"></ds-skeleton>
          <ds-divider></ds-divider>
          <ds-tooltip label="Forced-colors boundary" delay="0">
            <ds-button-unfilled label="Focus or hover for tooltip" has-border></ds-button-unfilled>
          </ds-tooltip>
        </section>
      </div>
    </main>
  `,
};

export const DataVisualization: Story = {
  name: 'Data visualization',
  render: () => html`
    <main style=${pageStyle}>
      <h1 style="margin-block-start:0">Data colors in forced-colors mode</h1>
      <p>
        Authored colors remain only on literal data marks and legend swatches.
        Labels, focus, controls, and the card boundary follow the OS palette.
      </p>
      <ds-card-data-viz heading="Availability status" card-width="lg" variant="donut">
        <ds-chart-donut
          slot="chart"
          center-caption="Total vehicles"
          ${ref(element => {
            if (element) (element as HTMLDsChartDonutElement).data = availability;
          })}
        ></ds-chart-donut>
        <ds-chart-legend
          slot="legend"
          ${ref(element => {
            if (element) (element as HTMLDsChartLegendElement).items = availability;
          })}
        ></ds-chart-legend>
      </ds-card-data-viz>
    </main>
  `,
};

export const MenuBoundaryAndSelection: Story = {
  name: 'Menu boundary and selection',
  render: () => html`
    <main style="${pageStyle}min-height:360px;">
      <h1 style="margin-block-start:0">Elevated choice surface</h1>
      <span id="forced-colors-menu-anchor">Menu anchor</span>
      <ds-menu
        open
        anchor-id="forced-colors-menu-anchor"
        menu-label="Conversation filter"
        selection-mode="single"
        ${ref(element => {
          if (!element) return;
          (element as HTMLDsMenuElement).items = [
            { label: 'All chats', value: 'all', isSelected: true },
            { label: 'Unread', value: 'unread' },
            { label: 'Unavailable', value: 'unavailable', isInactive: true },
          ];
        })}
      ></ds-menu>
    </main>
  `,
};

export const ModalBoundary: Story = {
  name: 'Modal boundary',
  render: () => html`
    <ds-modal open heading="Confirm changes" aria-describedby="forced-modal-description">
      <p id="forced-modal-description">
        The dialog remains distinct from the page when elevation shadows are removed.
      </p>
      <ds-button-filled slot="footer" label="Save"></ds-button-filled>
      <ds-button-unfilled slot="footer" label="Cancel" has-border></ds-button-unfilled>
    </ds-modal>
  `,
};
