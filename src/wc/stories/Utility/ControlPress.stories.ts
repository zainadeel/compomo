import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../styles/control-elevation.css';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/ControlPress',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Internal physical pointer/tap feedback (`src/wc/utils/control-press.css`). ' +
          'The `.ds-control-press-scale` class owns resting and pressed scale, motion, eligibility, ' +
          'and reduced-motion behavior. Its approved consumers are the native interactive targets ' +
          'inside ButtonFilled and ButtonUnfilled only. An elevated owner adds ' +
          '`.ds-control-elevation--press-scale` to transfer that scale to the complete wrapper; it is not coupled to interaction-fill and ' +
          'must not be added to navigation, selection, editing, popup, continuous, or drag controls.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const PolicyAndStates: Story = {
  render: () => html`
    <div class="util-demo-page">
      <section class="util-demo-section">
        <h2 class="util-demo-h2">Approved button targets</h2>
        <p class="util-demo-sub">
          Press and hold each control to compare the shared
          <code class="util-demo-code">--dimension-scale-subtle</code> feedback.
        </p>
        <div class="util-demo-row">
          <ds-button-filled label="Filled action"></ds-button-filled>
          <ds-button-unfilled label="Unfilled action"></ds-button-unfilled>
          <ds-button-unfilled
            variant="icon"
            icon="Bell"
            aria-label="Icon action"
          ></ds-button-unfilled>
        </div>
      </section>

      <section class="util-demo-section">
        <h2 class="util-demo-h2">Ineligible states</h2>
        <p class="util-demo-sub">
          Disabled, inactive, and loading controls remain at
          <code class="util-demo-code">--dimension-scale-default</code>.
        </p>
        <div class="util-demo-row">
          <ds-button-filled label="Inactive" is-inactive></ds-button-filled>
          <ds-button-unfilled label="Loading" is-loading></ds-button-unfilled>
        </div>
      </section>

      <section class="util-demo-section">
        <h2 class="util-demo-h2">Elevated and full-width</h2>
        <p class="util-demo-sub">
          The press-scale elevation modifier moves the surface, shadow, highlight, and button as one
          unit while preserving the wrapper's layout and hit area.
        </p>
        <div
          class="ds-control-elevation ds-control-elevation--md ds-control-elevation--press-scale"
          style="width:min(100%, 360px);border-radius:var(--dimension-radius-half);"
        >
          <ds-button-filled
            width="fill"
            rounded
            variant="icon-label"
            icon="Plus"
            label="Elevated full-width action"
          ></ds-button-filled>
        </div>
      </section>

      <section class="util-demo-section">
        <h2 class="util-demo-h2">Explicitly outside the policy</h2>
        <p class="util-demo-sub">
          This navigation-style row keeps its interaction wash but does not opt into press scaling.
        </p>
        <div class="util-demo-row">
          <button
            type="button"
            class="util-demo-control ds-interaction-fill ds-focus-ring-inset"
          >
            <span class="ds-interaction-fill__content">Navigation row — no scale</span>
          </button>
        </div>
      </section>
    </div>
  `,
};
