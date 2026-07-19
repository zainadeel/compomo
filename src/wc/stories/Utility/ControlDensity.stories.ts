import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-icon.js';
import '../../../../dist/components/ds-text.js';
import './utility-demo.css';

const meta: Meta = {
  title: 'Utility/ControlDensity',
  parameters: {
    docs: {
      description: {
        component:
          'Single source of truth for shared md / sm / xs control metrics (`src/wc/utils/control-density.css`). ' +
          'Apply `.ds-control--md|sm|xs` to set `--ds-control-*` vars (height, padding, gap, icon, radius). ' +
          'Components consume these vars instead of defining per-component optical-sizing classes. ' +
          'See AGENTS.md — Control density recipes for the maintained metric table.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const SIZES = [
  { cls: 'ds-control--md', label: 'md', text: 'text-body-medium', icon: 'md' },
  { cls: 'ds-control--sm', label: 'sm', text: 'text-body-small', icon: 'sm' },
  { cls: 'ds-control--xs', label: 'xs', text: 'text-caption', icon: 'xs' },
] as const;

export const Overview: Story = {
  render: () => html`
    <div class="util-demo-page">
      <div class="util-demo-section">
        <h2 class="util-demo-h2">Density scale</h2>
        <p class="util-demo-sub">
          Fixed height from <code class="util-demo-code">--ds-control-height</code> + horizontal padding only.
        </p>
        <div class="util-demo-col">
          ${SIZES.map(
            ({ cls, label, text }) => html`
              <div class="util-demo-row">
                <span class="util-demo-label">${label}</span>
                <button
                  type="button"
                  class="util-demo-control ${cls} ds-interaction-fill ds-focus-ring-inset"
                >
                  <ds-text
                    class="util-demo-control__label ds-interaction-fill__content"
                    as="span"
                    variant=${text}
                    color="inherit"
                  >Label</ds-text>
                </button>
                <span class="util-demo-code">.${cls}</span>
              </div>
            `,
          )}
        </div>
      </div>
    </div>
  `,
};

export const Compositions: Story = {
  render: () => html`
    <div class="util-demo-page">
      <div class="util-demo-section">
        <h2 class="util-demo-h2">One recipe, every composition</h2>
        <p class="util-demo-sub">
          Every row below resolves height, outer inset, label inset, icon box, and gap from the same size class.
        </p>
        <div class="util-demo-density-compositions">
          ${SIZES.map(
            ({ cls, label, text, icon }) => html`
              <div class="util-demo-density-composition-row">
                <span class="util-demo-label">${label}</span>

                <button type="button" class="util-demo-control ${cls}">
                  <ds-text class="util-demo-control__label" as="span" variant=${text} color="inherit">Text</ds-text>
                </button>

                <button type="button" class="util-demo-control ${cls}">
                  <ds-icon class="util-demo-control__icon" name="Bookmark" size=${icon} color="inherit"></ds-icon>
                  <ds-text class="util-demo-control__label" as="span" variant=${text} color="inherit">Icon + text</ds-text>
                </button>

                <button type="button" class="util-demo-control ${cls}">
                  <ds-text class="util-demo-control__label" as="span" variant=${text} color="inherit">Text + icon</ds-text>
                  <ds-icon class="util-demo-control__icon" name="ChevronDown" size=${icon} color="inherit"></ds-icon>
                </button>

                <button type="button" class="util-demo-control ${cls}">
                  <ds-icon class="util-demo-control__icon" name="Bookmark" size=${icon} color="inherit"></ds-icon>
                  <ds-text class="util-demo-control__label" as="span" variant=${text} color="inherit">Both icons</ds-text>
                  <ds-icon class="util-demo-control__icon" name="ChevronDown" size=${icon} color="inherit"></ds-icon>
                </button>
              </div>
            `,
          )}
        </div>
      </div>

      <div class="util-demo-section">
        <h2 class="util-demo-h2">Read-only row inside structural chrome</h2>
        <p class="util-demo-sub">
          The header owns its 8px structural inset. Its title and action both use md density even though only the action is interactive.
        </p>
        <div class="util-demo-density-header">
          <ds-text
            class="util-demo-density-header__title ds-control--md"
            as="span"
            variant="text-body-medium"
            emphasis
            color="primary"
          >Panel title</ds-text>
          <ds-button-unfilled
            variant="icon"
            icon="Ellipses"
            size="md"
            aria-label="Panel options"
            .activeFill=${false}
            .hasBorder=${false}
          ></ds-button-unfilled>
        </div>
      </div>
    </div>
  `,
};
