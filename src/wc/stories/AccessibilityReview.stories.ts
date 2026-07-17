import type { Meta, StoryObj } from '@storybook/web-components';
import { html, type TemplateResult } from 'lit';
import '../../../dist/components/ds-button-filled.js';
import '../../../dist/components/ds-button-unfilled.js';
import '../../../dist/components/ds-checkbox.js';
import '../../../dist/components/ds-input.js';
import '../../../dist/components/ds-radio.js';
import '../../../dist/components/ds-select.js';
import '../../../dist/components/ds-slider.js';
import '../../../dist/components/ds-switch.js';

type Theme = 'light' | 'dark';

type ReviewDefinition = {
  id: string;
  title: string;
  requirement: string;
  storyId: string;
  render: (theme: Theme) => TemplateResult;
};

const THEMES: Theme[] = ['light', 'dark'];
const SELECT_OPTIONS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Cherry', value: 'cherry' },
];

const RADIO_UNCHECKED = [{ label: 'Unchecked option', value: 'unchecked' }];
const RADIO_CHECKED = [{ label: 'Checked option', value: 'checked' }];
const RADIO_FOCUSED = [{ label: 'Focused option', value: 'focused' }];
const RADIO_INACTIVE = [{ label: 'Inactive option', value: 'inactive', isInactive: true }];

function managerStoryHref(storyId: string, theme: Theme): string {
  const iframePath = '/iframe.html';
  const iframeIndex = window.location.pathname.lastIndexOf(iframePath);
  const basePath = iframeIndex >= 0
    ? window.location.pathname.slice(0, iframeIndex + 1)
    : window.location.pathname;
  return `${basePath}?path=/story/${storyId}&globals=theme:${theme}`;
}

function reviewState(
  reviewId: string,
  theme: Theme,
  label: string,
  description: string,
  component: TemplateResult,
): TemplateResult {
  const checkboxId = `review-${reviewId}-${theme}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return html`
    <div class="a11y-review__state">
      <div class="a11y-review__state-heading">
        <strong>${label}</strong>
        <span>${description}</span>
      </div>
      <div class="a11y-review__fixture">${component}</div>
      <label class="a11y-review__check" for=${checkboxId}>
        <input id=${checkboxId} type="checkbox" />
        Reviewed
      </label>
    </div>
  `;
}

const REVIEWS: ReviewDefinition[] = [
  {
    id: 'checkbox',
    title: 'Checkbox',
    storyId: 'form-checkbox--states',
    requirement: 'Active outline, checkmark and focus cue: 3:1. Label text: 4.5:1. Inactive is exempt.',
    render: theme => html`
      ${reviewState('checkbox', theme, 'Unchecked', 'Outline identifies the control.', html`
        <ds-checkbox label="Unchecked"></ds-checkbox>
      `)}
      ${reviewState('checkbox', theme, 'Checked', 'Checkmark and fill communicate state.', html`
        <ds-checkbox label="Checked" checked></ds-checkbox>
      `)}
      ${reviewState('checkbox', theme, 'Focus', 'Forced visible for review.', html`
        <ds-checkbox data-review-focus label="Focused"></ds-checkbox>
      `)}
      ${reviewState('checkbox', theme, 'Inactive', 'Must be genuinely non-operable.', html`
        <ds-checkbox label="Inactive" is-inactive></ds-checkbox>
      `)}
    `,
  },
  {
    id: 'radio',
    title: 'Radio',
    storyId: 'form-radio--with-inactive-item',
    requirement: 'Active ring, selected dot and focus cue: 3:1. Label text: 4.5:1. Inactive is exempt.',
    render: theme => html`
      ${reviewState('radio', theme, 'Unchecked', 'Ring identifies the available option.', html`
        <ds-radio .options=${RADIO_UNCHECKED} aria-label="Unchecked radio"></ds-radio>
      `)}
      ${reviewState('radio', theme, 'Checked', 'Ring and dot communicate selection.', html`
        <ds-radio .options=${RADIO_CHECKED} value="checked" aria-label="Checked radio"></ds-radio>
      `)}
      ${reviewState('radio', theme, 'Focus', 'Forced visible for review.', html`
        <ds-radio data-review-focus .options=${RADIO_FOCUSED} aria-label="Focused radio"></ds-radio>
      `)}
      ${reviewState('radio', theme, 'Inactive', 'Must be genuinely non-operable.', html`
        <ds-radio .options=${RADIO_INACTIVE} aria-label="Inactive radio"></ds-radio>
      `)}
    `,
  },
  {
    id: 'input',
    title: 'Input',
    storyId: 'form-input--sizes-and-states',
    requirement: 'Required field boundary and focus cue: 3:1. Value, label and meaningful placeholder text: 4.5:1.',
    render: theme => html`
      ${reviewState('input', theme, 'Empty', 'Placeholder must not replace a persistent label.', html`
        <ds-input placeholder="Placeholder" aria-label="Empty review input"></ds-input>
      `)}
      ${reviewState('input', theme, 'Value', 'Entered text is primary content.', html`
        <ds-input value="Entered value" aria-label="Value review input"></ds-input>
      `)}
      ${reviewState('input', theme, 'Focus', 'Forced visible for review.', html`
        <ds-input data-review-focus placeholder="Focused field" aria-label="Focused review input"></ds-input>
      `)}
      ${reviewState('input', theme, 'Inactive', 'Must be genuinely non-operable.', html`
        <ds-input value="Inactive value" is-inactive aria-label="Inactive review input"></ds-input>
      `)}
    `,
  },
  {
    id: 'select',
    title: 'Select',
    storyId: 'form-select--sizes-and-states',
    requirement: 'Trigger boundary, chevron and focus cue: 3:1 when needed to identify the control. Visible text: 4.5:1.',
    render: theme => html`
      ${reviewState('select', theme, 'Empty', 'Placeholder identifies the current empty state.', html`
        <ds-select .options=${SELECT_OPTIONS} placeholder="Select fruit" aria-label="Empty review select"></ds-select>
      `)}
      ${reviewState('select', theme, 'Selected', 'Selected value becomes primary content.', html`
        <ds-select .options=${SELECT_OPTIONS} value="cherry" aria-label="Selected review select"></ds-select>
      `)}
      ${reviewState('select', theme, 'Focus', 'Forced visible for review.', html`
        <ds-select data-review-focus .options=${SELECT_OPTIONS} placeholder="Focused select" aria-label="Focused review select"></ds-select>
      `)}
      ${reviewState('select', theme, 'Inactive', 'Must be genuinely non-operable.', html`
        <ds-select .options=${SELECT_OPTIONS} is-inactive aria-label="Inactive review select"></ds-select>
      `)}
    `,
  },
  {
    id: 'button',
    title: 'Buttons',
    storyId: 'primitives-buttonunfilled--states',
    requirement: 'Label text: 4.5:1. Essential icon or boundary: 3:1. A supplemental decorative border may be subtler.',
    render: theme => html`
      ${reviewState('button', theme, 'Idle', 'Compare filled and unfilled identification.', html`
        <div class="a11y-review__pair">
          <ds-button-filled label="Confirm"></ds-button-filled>
          <ds-button-unfilled label="Action"></ds-button-unfilled>
        </div>
      `)}
      ${reviewState('button', theme, 'Selected', 'Applies only to toggle/active unfilled actions.', html`
        <ds-button-unfilled label="Selected" is-active></ds-button-unfilled>
      `)}
      ${reviewState('button', theme, 'Focus', 'Forced visible for both button treatments.', html`
        <div class="a11y-review__pair">
          <ds-button-filled data-review-focus label="Focused"></ds-button-filled>
          <ds-button-unfilled data-review-focus label="Focused"></ds-button-unfilled>
        </div>
      `)}
      ${reviewState('button', theme, 'Inactive', 'Must be genuinely non-operable.', html`
        <div class="a11y-review__pair">
          <ds-button-filled label="Inactive" is-inactive></ds-button-filled>
          <ds-button-unfilled label="Inactive" is-inactive></ds-button-unfilled>
        </div>
      `)}
    `,
  },
  {
    id: 'switch',
    title: 'Switch',
    storyId: 'form-switch--states',
    requirement: 'Track, thumb, on/off state and focus cue: 3:1 where required for identification. Do not rely on color alone.',
    render: theme => html`
      ${reviewState('switch', theme, 'Off', 'Track and thumb communicate the available control.', html`
        <ds-switch aria-label="Review switch off"></ds-switch>
      `)}
      ${reviewState('switch', theme, 'On', 'Position plus color communicate the state.', html`
        <ds-switch checked aria-label="Review switch on"></ds-switch>
      `)}
      ${reviewState('switch', theme, 'Focus', 'Forced visible for review.', html`
        <ds-switch data-review-focus aria-label="Focused review switch"></ds-switch>
      `)}
      ${reviewState('switch', theme, 'Inactive', 'Must be genuinely non-operable.', html`
        <ds-switch is-inactive aria-label="Inactive review switch"></ds-switch>
      `)}
    `,
  },
  {
    id: 'slider',
    title: 'Slider',
    storyId: 'form-slider--variants',
    requirement: 'Track, filled range, thumb and focus cue: 3:1 where each is needed to identify the control or value.',
    render: theme => html`
      ${reviewState('slider', theme, 'Minimum', 'Track and thumb remain identifiable without fill.', html`
        <ds-slider value="0" min="0" max="100" label="Minimum"></ds-slider>
      `)}
      ${reviewState('slider', theme, 'Value', 'Filled and remaining track communicate the range.', html`
        <ds-slider value="40" min="0" max="100" label="Value"></ds-slider>
      `)}
      ${reviewState('slider', theme, 'Focus', 'Forced visible for review.', html`
        <ds-slider data-review-focus value="40" min="0" max="100" label="Focused"></ds-slider>
      `)}
      ${reviewState('slider', theme, 'Inactive', 'Must be genuinely non-operable.', html`
        <ds-slider value="40" min="0" max="100" label="Inactive" is-inactive></ds-slider>
      `)}
    `,
  },
];

function themePanel(review: ReviewDefinition, theme: Theme): TemplateResult {
  return html`
    <section class="a11y-review__theme" data-theme=${theme} style=${`color-scheme:${theme};`}>
      <div class="a11y-review__theme-heading">
        <span class="a11y-review__theme-dot" aria-hidden="true"></span>
        <strong>${theme === 'light' ? 'Light' : 'Dark'}</strong>
        <a href=${managerStoryHref(review.storyId, theme)} target="_top">Open full story</a>
      </div>
      <div class="a11y-review__states">${review.render(theme)}</div>
    </section>
  `;
}

const meta: Meta = {
  title: 'Docs/Accessibility Review',
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component: 'A local, visual checklist for manual non-text contrast review across design-system controls.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ReviewMatrix: Story = {
  name: 'Review matrix',
  render: () => html`
    <style>
      .a11y-review {
        box-sizing: border-box;
        min-height: 100%;
        padding: var(--dimension-space-300);
        background: var(--color-background-secondary);
        color: var(--color-foreground-primary);
        font-family: var(--typography-font-family);
      }

      .a11y-review__intro {
        max-width: var(--dimension-panel-width-lg);
        margin-bottom: var(--dimension-space-300);
      }

      .a11y-review__intro h2,
      .a11y-review__intro p {
        margin: 0;
      }

      .a11y-review__intro p {
        margin-top: var(--dimension-space-075);
        color: var(--color-foreground-secondary);
        font-size: var(--typography-fontsize-md);
        font-weight: var(--typography-weight-regular);
        line-height: var(--typography-lineheight-md);
        letter-spacing: var(--typography-letterspacing-negative-half);
      }

      .a11y-review__component {
        margin-top: var(--dimension-space-300);
      }

      .a11y-review__component-heading {
        display: flex;
        align-items: baseline;
        gap: var(--dimension-space-100);
        margin-bottom: var(--dimension-space-100);
      }

      .a11y-review__component-heading h3,
      .a11y-review__component-heading p {
        margin: 0;
      }

      .a11y-review__component-heading h3 {
        font-size: var(--typography-fontsize-lg);
        font-weight: var(--typography-weight-semibold);
        line-height: var(--typography-lineheight-lg);
        letter-spacing: var(--typography-letterspacing-negative);
      }

      .a11y-review__component-heading p {
        color: var(--color-foreground-secondary);
        font-size: var(--typography-fontsize-sm);
        font-weight: var(--typography-weight-regular);
        line-height: var(--typography-lineheight-sm);
        letter-spacing: var(--typography-letterspacing-none);
      }

      .a11y-review__themes {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--dimension-space-100);
      }

      .a11y-review__theme {
        overflow: hidden;
        border: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);
        border-radius: var(--dimension-radius-100);
        background: var(--color-background-primary);
        color: var(--color-foreground-primary);
      }

      .a11y-review__theme-heading {
        display: flex;
        align-items: center;
        gap: var(--dimension-space-075);
        padding: var(--dimension-space-100) var(--dimension-space-150);
        border-bottom: var(--dimension-stroke-width-012) solid var(--color-divider-divider);
        background: var(--color-background-secondary);
        font-size: var(--typography-fontsize-md);
        font-weight: var(--typography-weight-regular);
        line-height: var(--typography-lineheight-md);
        letter-spacing: var(--typography-letterspacing-negative-half);
      }

      .a11y-review__theme-heading a {
        margin-left: auto;
        color: var(--color-foreground-bold-brand);
        font-size: var(--typography-fontsize-sm);
        font-weight: var(--typography-weight-regular);
        line-height: var(--typography-lineheight-sm);
        letter-spacing: var(--typography-letterspacing-none);
      }

      .a11y-review__theme-dot {
        width: var(--dimension-size-150);
        height: var(--dimension-size-150);
        border: var(--dimension-stroke-width-012) solid var(--color-border-primary);
        border-radius: var(--dimension-radius-half);
        background: var(--color-background-primary);
      }

      .a11y-review__states {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .a11y-review__state {
        display: grid;
        grid-template-rows: auto minmax(var(--dimension-size-800), auto) auto;
        gap: var(--dimension-space-075);
        min-width: 0;
        padding: var(--dimension-space-150);
        border-right: var(--dimension-stroke-width-012) solid var(--color-divider-divider);
        border-bottom: var(--dimension-stroke-width-012) solid var(--color-divider-divider);
      }

      .a11y-review__state:nth-child(even) {
        border-right: 0;
      }

      .a11y-review__state:nth-last-child(-n + 2) {
        border-bottom: 0;
      }

      .a11y-review__state-heading {
        display: flex;
        flex-direction: column;
        gap: var(--dimension-space-025);
      }

      .a11y-review__state-heading strong {
        font-size: var(--typography-fontsize-md);
        font-weight: var(--typography-weight-medium);
        line-height: var(--typography-lineheight-md);
        letter-spacing: var(--typography-letterspacing-negative);
      }

      .a11y-review__state-heading span,
      .a11y-review__check {
        color: var(--color-foreground-secondary);
        font-size: var(--typography-fontsize-xs);
        font-weight: var(--typography-weight-medium);
        line-height: var(--typography-lineheight-xs);
        letter-spacing: var(--typography-letterspacing-positive);
      }

      .a11y-review__fixture {
        display: flex;
        align-items: center;
        min-width: 0;
      }

      .a11y-review__fixture > ds-input,
      .a11y-review__fixture > ds-select,
      .a11y-review__fixture > ds-slider {
        width: 100%;
      }

      .a11y-review__pair {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--dimension-space-075);
      }

      .a11y-review__check {
        display: inline-flex;
        align-items: center;
        gap: var(--dimension-space-050);
        width: fit-content;
        cursor: pointer;
      }

      .a11y-review__check input {
        margin: 0;
      }

      ds-input[data-review-focus] .input-control::after {
        box-shadow: inset 0 0 0 var(--dimension-stroke-width-018) var(--color-border-bold-brand);
      }

      ds-radio[data-review-focus] [role='radio']:first-child {
        outline: var(--dimension-stroke-width-025) solid var(--color-interaction-focus);
        outline-offset: var(--dimension-space-025);
      }

      ds-slider[data-review-focus] .slider__thumb[data-index='0'] .slider__thumb-visual {
        outline: var(--dimension-stroke-width-025) solid var(--color-interaction-focus);
        outline-offset: var(--dimension-space-025);
      }

      @media (max-width: 1300px) {
        .a11y-review__states {
          grid-template-columns: 1fr;
        }

        .a11y-review__state,
        .a11y-review__state:nth-child(even),
        .a11y-review__state:nth-last-child(-n + 2) {
          border-right: 0;
          border-bottom: var(--dimension-stroke-width-012) solid var(--color-divider-divider);
        }

        .a11y-review__state:last-child {
          border-bottom: 0;
        }
      }

      @media (max-width: 720px) {
        .a11y-review__themes {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .a11y-review {
          padding: var(--dimension-space-150);
        }

        .a11y-review__component-heading {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    </style>

    <main class="a11y-review">
      <div class="a11y-review__intro">
        <h2>Control contrast review</h2>
        <p>
          Compare real components in both themes. Tick Reviewed after checking the boundary,
          state cue, label or icon, and focus treatment at 100% zoom.
        </p>
      </div>

      ${REVIEWS.map(review => html`
        <section class="a11y-review__component" aria-labelledby=${`review-${review.id}-title`}>
          <div class="a11y-review__component-heading">
            <h3 id=${`review-${review.id}-title`}>${review.title}</h3>
            <p>${review.requirement}</p>
          </div>
          <div class="a11y-review__themes">
            ${THEMES.map(theme => themePanel(review, theme))}
          </div>
        </section>
      `)}
    </main>
  `,
  play: async ({ canvasElement }) => {
    // TokoMo intentionally scopes theme overrides to :root. For this review-only
    // comparison, project the official root declarations onto each local panel so
    // Light and Dark remain accurate side by side, regardless of the toolbar theme.
    const stylesheetRules = Array.from(canvasElement.ownerDocument.styleSheets).flatMap(sheet => {
      try {
        return Array.from(sheet.cssRules);
      } catch {
        return [];
      }
    });
    const lightRule = stylesheetRules.find(
      (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === ':root',
    );
    const darkRule = stylesheetRules.find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule && rule.selectorText === ':root[data-theme="dark"]',
    );

    if (lightRule && darkRule) {
      const themedProperties = Array.from({ length: darkRule.style.length }, (_, index) => darkRule.style.item(index));
      canvasElement.querySelectorAll<HTMLElement>('.a11y-review__theme').forEach(panel => {
        const source = panel.dataset['theme'] === 'dark' ? darkRule.style : lightRule.style;
        themedProperties.forEach(property => {
          panel.style.setProperty(property, source.getPropertyValue(property));
        });
      });
    }

    const elements = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-review-focus]'));
    await Promise.all(elements.map(element => customElements.whenDefined(element.localName)));
    await Promise.all(elements.map(element => {
      const stencilElement = element as HTMLElement & { componentOnReady?: () => Promise<unknown> };
      return stencilElement.componentOnReady?.() ?? Promise.resolve();
    }));

    elements.forEach(element => {
      if (element.matches('ds-checkbox, ds-switch')) {
        element.classList.add('ds-focus-ring--visible');
        return;
      }

      if (element.matches('ds-button-filled, ds-button-unfilled')) {
        element.querySelector('.ds-focus-ring-inset')?.classList.add('ds-focus-ring--visible');
        return;
      }

      if (element.matches('ds-select')) {
        element.querySelector('[role="combobox"]')?.classList.add('ds-focus-ring--visible');
      }
    });
  },
};
