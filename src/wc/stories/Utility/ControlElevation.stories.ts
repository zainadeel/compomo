import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../styles/control-elevation.css';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-input.js';
import './utility-demo.css';
import './ControlElevation.stories.css';

const meta: Meta = {
  title: 'Utility/ControlElevation',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Shared elevation chrome for a wrapper around a separate control surface. Import ' +
          '`@ds-mo/ui/control-elevation.css`, apply `.ds-control-elevation` plus `--sm`, `--md`, ' +
          'or `--floating`, and keep the wrapped control borderless. The wrapper receives the split ' +
          'outer shadow while a pointer-transparent top overlay keeps TokoMo’s inset highlight visible ' +
          'over opaque children. The owner still supplies layout, radius, background, and optional blur. ' +
          'A wrapped Input uses `hasBorder=false` at rest; its focus and error strokes remain control-owned beneath the topmost highlight.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const elevationLevel = (
  level: 'sm' | 'md' | 'floating',
  label: string,
) => html`
  <div class="control-elevation-demo__example">
    <p class="control-elevation-demo__label">${label}</p>
    <div
      class="control-elevation-demo__wrapper ds-control-elevation ds-control-elevation--${level}"
    >
      <ds-button-filled
        data-a11y-fixture
        variant="icon-label"
        icon="Plus"
        label=${label}
        rounded
        .hasBorder=${false}
      ></ds-button-filled>
    </div>
  </div>
`;

const themeExamples = (theme: 'light' | 'dark') => html`
  <section class="control-elevation-demo__theme" data-theme=${theme}>
    <h2 class="util-demo-h2">${theme === 'light' ? 'Light theme' : 'Dark theme'}</h2>
    <div class="control-elevation-demo__examples">
      ${elevationLevel('sm', 'Small')}
      ${elevationLevel('md', 'Medium')}
      ${elevationLevel('floating', 'Floating')}
    </div>
    <div class="control-elevation-demo__example">
      <p class="control-elevation-demo__label">Transparent blurred child</p>
      <div
        class="control-elevation-demo__wrapper control-elevation-demo__wrapper--transparent ds-control-elevation ds-control-elevation--md"
      >
        <ds-button-unfilled
          data-a11y-fixture
          variant="icon"
          icon="ChevronDown"
          rounded
          .hasBorder=${false}
          aria-label="Scroll to latest"
        ></ds-button-unfilled>
      </div>
    </div>
  </section>
`;

export const LevelsAndSurfaces: Story = {
  render: () => html`
    <div class="control-elevation-demo">
      <div class="control-elevation-demo__themes">
        ${themeExamples('light')}
        ${themeExamples('dark')}
      </div>
    </div>
  `,
};

export const WrappedInputStates: Story = {
  render: () => html`
    <div class="util-demo-page control-elevation-demo">
      <div class="control-elevation-demo__examples">
        <div class="control-elevation-demo__example">
          <p class="control-elevation-demo__label">Borderless rest</p>
          <div
            class="control-elevation-demo__input-wrapper ds-control-elevation ds-control-elevation--md"
          >
            <ds-input
              data-a11y-fixture
              placeholder="Resting input"
              .hasBorder=${false}
              aria-label="Resting wrapped input"
            ></ds-input>
          </div>
        </div>
        <div class="control-elevation-demo__example">
          <p class="control-elevation-demo__label">Active focus stroke</p>
          <div
            class="control-elevation-demo__input-wrapper ds-control-elevation ds-control-elevation--md"
          >
            <ds-input
              data-a11y-fixture
              placeholder="Focused input"
              .hasBorder=${false}
              .autoFocus=${true}
              aria-label="Focused wrapped input"
            ></ds-input>
          </div>
        </div>
        <div class="control-elevation-demo__example">
          <p class="control-elevation-demo__label">Negative error stroke</p>
          <div
            class="control-elevation-demo__input-wrapper ds-control-elevation ds-control-elevation--md"
          >
            <ds-input
              data-a11y-fixture
              placeholder="Error input"
              .hasBorder=${false}
              .error=${true}
              aria-label="Invalid wrapped input"
            ></ds-input>
          </div>
        </div>
      </div>
    </div>
  `,
};
