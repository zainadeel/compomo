import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/Radius',
  parameters: {
    docs: {
      description: {
        component:
          'Named corner-radius roles (`src/wc/utils/radius.css`). Components consume `--ds-radius-*` instead of picking a `--dimension-radius-*` token per surface. Control density aliases `--ds-control-radius` from `--ds-radius-control`. Pill controls still override to `--dimension-radius-half`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const ROLES = [
  { role: 'control', token: '--ds-radius-control' },
  { role: 'card', token: '--ds-radius-card' },
  { role: 'modal', token: '--ds-radius-modal' },
  { role: 'menu', token: '--ds-radius-menu' },
  { role: 'tooltip-control', token: '--ds-radius-tooltip-control' },
  { role: 'tooltip-menu', token: '--ds-radius-tooltip-menu' },
  { role: 'table', token: '--ds-radius-table' },
] as const;

export const Overview: Story = {
  render: () => html`
    <div class="util-demo-page ds-radius">
      <div class="util-demo-section">
        <h2 class="util-demo-h2">Radius roles</h2>
        <p class="util-demo-sub">
          Card, modal, and table share one bounded-surface scale. Menu and chart tooltips share a
          menu-surface scale. Controls and chip tooltips share the control scale.
        </p>
        <div class="util-demo-col">
          ${ROLES.map(
            ({ role, token }) => html`
              <div class="util-demo-row">
                <span class="util-demo-label">${role}</span>
                <div class="util-demo-radius-swatch util-demo-radius-swatch--${role}"></div>
                <span class="util-demo-code">${token}</span>
              </div>
            `
          )}
        </div>
      </div>
    </div>
  `,
};
