import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-slider.js';
import '../../../../dist/components/ds-text.js';

const SIZES = ['md', 'sm', 'xs'] as const;
const STACK = 'display:flex;flex-direction:column;gap:var(--dimension-space-300);width:min(100%,var(--dimension-form-width-md));';
const REVIEW_GRID = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(var(--dimension-form-width-xs),1fr));gap:var(--dimension-space-300);align-items:start;width:min(100%,var(--dimension-modal-width-2xl));';
const PANEL = 'display:flex;flex-direction:column;gap:var(--dimension-space-150);padding:var(--dimension-space-200);border:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);border-radius:var(--dimension-radius-050);';

const meta: Meta = {
  title: 'Form/Slider',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A form-associated single or two-thumb range input with native range semantics, pointer dragging, keyboard support, formatting, three densities, and horizontal or vertical orientation.',
      },
    },
  },
  argTypes: {
    value: { control: { type: 'number' } },
    min: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    step: { control: { type: 'number' } },
    label: { control: 'text' },
    showValue: { control: 'boolean' },
    size: { control: 'select', options: [...SIZES] },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    thumbAlignment: { control: 'select', options: ['edge', 'center'] },
    readOnly: { control: 'boolean' },
    isInactive: { control: 'boolean' },
  },
  args: {
    value: 40,
    min: 0,
    max: 100,
    step: 1,
    label: 'Volume',
    showValue: true,
    size: 'md',
    orientation: 'horizontal',
    thumbAlignment: 'edge',
    readOnly: false,
    isInactive: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style=${args['orientation'] === 'vertical' ? 'height:320px;' : 'width:min(100%,var(--dimension-form-width-md));'}>
      <ds-slider
        .value=${Number(args['value'] ?? 40)}
        .min=${Number(args['min'] ?? 0)}
        .max=${Number(args['max'] ?? 100)}
        .step=${Number(args['step'] ?? 1)}
        label=${args['label'] ?? 'Volume'}
        ?show-value=${args['showValue']}
        size=${args['size']}
        orientation=${args['orientation']}
        thumb-alignment=${args['thumbAlignment']}
        ?read-only=${args['readOnly']}
        ?is-inactive=${args['isInactive']}
      ></ds-slider>
    </div>
  `,
};

export const Variants: Story = {
  name: 'Values & States',
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style=${REVIEW_GRID}>
      <div style=${PANEL}>
        <ds-text as="span" variant="text-title-small">Position</ds-text>
        <ds-slider value="0" label="Minimum"></ds-slider>
        <ds-slider value="40" label="Between bounds"></ds-slider>
        <ds-slider value="100" label="Maximum"></ds-slider>
      </div>
      <div style=${PANEL}>
        <ds-text as="span" variant="text-title-small">Range math</ds-text>
        <ds-slider value="0" min="-50" max="50" step="5" label="Negative to positive"></ds-slider>
        <ds-slider value="0.35" min="0" max="1" step="0.05" label="Decimal steps"></ds-slider>
        <ds-slider value="500" min="100" max="1000" step="100" label="Non-zero origin"></ds-slider>
      </div>
      <div style=${PANEL}>
        <ds-text as="span" variant="text-title-small">Availability</ds-text>
        <ds-slider value="40" label="Interactive"></ds-slider>
        <ds-slider value="40" label="Read-only" read-only></ds-slider>
        <ds-slider value="40" label="Inactive" is-inactive></ds-slider>
      </div>
      <div style=${PANEL}>
        <ds-text as="span" variant="text-title-small">Value chrome</ds-text>
        <ds-slider value="65" label="Visible value"></ds-slider>
        <ds-slider value="65" label="Hidden value" .showValue=${false}></ds-slider>
        <ds-slider value="65" .showValue=${false} aria-label="Volume without a visible label"></ds-slider>
      </div>
    </div>
  `,
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style=${STACK}>
      ${SIZES.map(size => html`
        <ds-slider size=${size} value="40" label=${`${size} · ${size === 'md' ? '32 / 16 / 8' : size === 'sm' ? '24 / 12 / 6' : '16 / 8 / 4'}px control / thumb / track`}></ds-slider>
      `)}
    </div>
  `,
};

export const Range: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style=${STACK}>
      <ds-slider .value=${[20, 80]} label="Price range" value-prefix="$" start-label="Minimum price" end-label="Maximum price"></ds-slider>
      <ds-slider .value=${[45, 55]} label="Narrow range"></ds-slider>
      <ds-slider .value=${[30, 70]} min-steps-between-values="10" step="2" label="Minimum separation · 20"></ds-slider>
      <ds-slider .value=${[25, 75]} label="Read-only range" read-only></ds-slider>
      <ds-slider .value=${[25, 75]} label="Inactive range" is-inactive></ds-slider>
    </div>
  `,
};

export const Orientation: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex;flex-wrap:wrap;gap:var(--dimension-space-600);align-items:flex-start;">
      <div style="width:var(--dimension-form-width-sm);">
        <ds-slider value="35" label="Horizontal"></ds-slider>
      </div>
      ${SIZES.map(size => html`
        <ds-slider
          size=${size}
          orientation="vertical"
          value=${size === 'md' ? '35' : size === 'sm' ? '60' : '80'}
          label=${`Vertical ${size}`}
        ></ds-slider>
      `)}
      <ds-slider orientation="vertical" .value=${[20, 75]} label="Vertical range"></ds-slider>
    </div>
  `,
};

export const ThumbAlignment: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style=${STACK}>
      <div style=${PANEL}>
        <ds-text as="span" variant="text-title-small">Edge aligned · thumb edge reaches rail endpoint</ds-text>
        <ds-slider value="0" label="Minimum"></ds-slider>
        <ds-slider value="100" label="Maximum"></ds-slider>
      </div>
      <div style=${PANEL}>
        <ds-text as="span" variant="text-title-small">Center aligned · thumb center reaches rail endpoint</ds-text>
        <ds-slider value="0" label="Minimum" thumb-alignment="center"></ds-slider>
        <ds-slider value="100" label="Maximum" thumb-alignment="center"></ds-slider>
      </div>
    </div>
  `,
};

export const LabelingAndFormatting: Story = {
  name: 'Labeling & Formatting',
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style=${STACK}>
      <ds-slider value="72" label="Visible label" value-suffix="%"></ds-slider>
      <ds-slider value="2" min="0" max="3" step="1" label="Fan speed" value-text="Medium"></ds-slider>
      <ds-slider
        value="1250"
        min="0"
        max="5000"
        step="50"
        label="Budget"
        locale="en-CA"
        .formatOptions=${{ style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }}
      ></ds-slider>
      <ds-slider .value=${[500, 2500]} min="0" max="5000" step="100" label="Budget range" value-prefix="$" start-label="Minimum budget" end-label="Maximum budget"></ds-slider>
      <ds-slider value="45" .showValue=${false} aria-label="Unlabeled volume control"></ds-slider>
    </div>
  `,
};

export const InteractionStates: Story = {
  name: 'Interaction States',
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style=${STACK}>
      <ds-slider value="30" label="Rest"></ds-slider>
      <ds-slider data-review-focus value="45" label="Keyboard focus"></ds-slider>
      <ds-slider value="60" label="Read-only" read-only></ds-slider>
      <ds-slider value="75" label="Inactive" is-inactive></ds-slider>
    </div>
  `,
};

export const Backgrounds: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style=${REVIEW_GRID}>
      ${[
        ['Primary', 'var(--color-background-primary)'],
        ['Secondary', 'var(--color-background-secondary)'],
        ['Faint', 'var(--color-background-faint-neutral)'],
      ].map(([label, background]) => html`
        <div style="${PANEL}background:${background};">
          <ds-slider value="40" label=${label}></ds-slider>
          <ds-slider .value=${[20, 70]} label=${`${label} range`}></ds-slider>
        </div>
      `)}
    </div>
  `,
};

export const Events: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const update = (kind: 'change' | 'commit', event: CustomEvent<number | number[]>) => {
      const output = (event.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>(`[data-${kind}]`);
      if (output) output.textContent = JSON.stringify(event.detail);
    };
    return html`
      <div style=${STACK}>
        <ds-slider
          .value=${[20, 80]}
          label="Drag or use the keyboard"
          @dsChange=${(event: CustomEvent<number | number[]>) => update('change', event)}
          @dsCommit=${(event: CustomEvent<number | number[]>) => update('commit', event)}
        ></ds-slider>
        <div style="display:grid;grid-template-columns:max-content 1fr;gap:var(--dimension-space-050) var(--dimension-space-100);">
          <ds-text as="span" variant="text-body-small" color="secondary">Continuous</ds-text>
          <ds-text as="span" variant="text-body-small" font-feature="tabular-nums" data-change>—</ds-text>
          <ds-text as="span" variant="text-body-small" color="secondary">Committed</ds-text>
          <ds-text as="span" variant="text-body-small" font-feature="tabular-nums" data-commit>—</ds-text>
        </div>
      </div>
    `;
  },
};

export const FormIntegration: Story = {
  name: 'Form Integration',
  parameters: { controls: { disable: true } },
  render: () => {
    const submit = (event: SubmitEvent) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      const data = new FormData(form);
      const result = Object.fromEntries([...new Set(data.keys())].map(key => [key, data.getAll(key)]));
      const output = form.querySelector<HTMLElement>('[data-form-output]');
      if (output) output.textContent = JSON.stringify(result);
    };
    return html`
      <form style=${STACK} @submit=${submit}>
        <ds-slider name="volume" value="40" label="Volume"></ds-slider>
        <ds-slider name="price" .value=${[20, 80]} label="Price range" start-label="Minimum price" end-label="Maximum price"></ds-slider>
        <div style="display:flex;gap:var(--dimension-space-100);">
          <button type="submit">Submit</button>
          <button type="reset">Reset</button>
        </div>
        <ds-text as="span" variant="text-body-small" font-feature="tabular-nums" data-form-output>Submit to inspect values.</ds-text>
      </form>
    `;
  },
};
