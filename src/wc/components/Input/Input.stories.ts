import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-input.js';
import '../../../../dist/components/ds-field.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-divider.js';

const meta: Meta = {
  title: 'Form/Input',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    minLength: { control: 'number' },
    maxLength: { control: 'number' },
    lengthBehavior: { control: 'select', options: ['error', 'restrict'] },
    showCharacterCount: { control: 'boolean' },
    placeholder: { control: 'text' },
    type: {
      control: 'select',
      options: ['text', 'email', 'tel', 'url', 'search', 'password', 'number'],
    },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    showStepper: { control: 'boolean' },
    textAlign: { control: 'select', options: ['start', 'end'] },
    size: { control: 'select', options: ['lg', 'md', 'sm', 'xs'] },
    width: { control: 'select', options: ['fill', 'hug'] },
    icon: { control: 'text' },
    hasBorder: { control: 'boolean' },
    hasInteractionFill: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    error: { control: 'boolean' },
    errorMessage: { control: 'text' },
  },
  args: {
    value: '',
    placeholder: 'Placeholder text',
    type: 'text',
    showStepper: true,
    size: 'md',
    textAlign: 'start',
    width: 'fill',
    icon: 'MagnifyingGlass',
    hasBorder: true,
    hasInteractionFill: true,
    isInactive: false,
    readOnly: false,
    error: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width:320px;">
      <ds-input
        .minLength=${args['minLength']}
        .maxLength=${args['maxLength']}
        length-behavior=${args['lengthBehavior'] ?? 'error'}
        .showCharacterCount=${args['showCharacterCount'] ?? true}
        value=${args['value'] ?? ''}
        placeholder=${args['placeholder'] ?? ''}
        type=${args['type'] ?? 'text'}
        .min=${args['min']}
        .max=${args['max']}
        .step=${args['step']}
        .showStepper=${args['showStepper']}
        text-align=${args['textAlign'] ?? 'start'}
        size=${args['size'] ?? 'md'}
        width=${args['width'] ?? 'fill'}
        icon=${args['icon'] ?? ''}
        .hasBorder=${args['hasBorder']}
        .hasInteractionFill=${args['hasInteractionFill']}
        ?is-inactive=${args['isInactive']}
        ?read-only=${args['readOnly']}
        ?error=${args['error']}
        errorMessage=${args['errorMessage'] ?? ''}
        aria-label="Playground input"
      ></ds-input>
    </div>
  `,
};

export const SizesAndStates: Story = {
  render: () => html`
    <div
      style="display:grid;grid-template-columns:max-content 320px;align-items:center;gap:var(--dimension-space-100) var(--dimension-space-200);"
    >
      <ds-text variant="text-body-small" color="secondary">Large</ds-text>
      <ds-input size="lg" placeholder="Large input" aria-label="Large input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Medium</ds-text>
      <ds-input size="md" placeholder="Medium input" aria-label="Medium input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Small</ds-text>
      <ds-input size="sm" placeholder="Small input" aria-label="Small input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Extra small</ds-text>
      <ds-input size="xs" placeholder="Extra-small input" aria-label="Extra-small input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Value</ds-text>
      <ds-input
        value="Entered value"
        icon="MagnifyingGlass"
        aria-label="Input with value"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Search</ds-text>
      <ds-input
        type="search"
        value="Search query"
        icon="MagnifyingGlass"
        aria-label="Search input"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Number</ds-text>
      <ds-input
        type="number"
        value="1200"
        min="0"
        max="4000"
        step="100"
        aria-label="Number input"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Prefix</ds-text>
      <ds-input value="1,200.00" aria-label="Amount in USD">
        <ds-text slot="prefix" as="span" variant="text-body-medium" color="inherit">USD</ds-text>
      </ds-input>
      <ds-text variant="text-body-small" color="secondary">Suffix</ds-text>
      <ds-input value="48" aria-label="Input with suffix">
        <ds-text slot="suffix" as="span" variant="text-body-medium" color="inherit">%</ds-text>
      </ds-input>
      <ds-text variant="text-body-small" color="secondary">Password</ds-text>
      <ds-input type="password" value="secret-value" aria-label="Password input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Error</ds-text>
      <ds-input
        error
        error-message="This field is required"
        placeholder="Required field"
        aria-label="Error input"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Inactive</ds-text>
      <ds-input value="Inactive value" is-inactive aria-label="Inactive input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Read-only</ds-text>
      <ds-input value="Read-only value" read-only aria-label="Read-only input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Borderless</ds-text>
      <ds-input
        value="Borderless value"
        .hasBorder=${false}
        aria-label="Borderless input"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Embedded search</ds-text>
      <ds-input
        type="search"
        icon="MagnifyingGlass"
        placeholder="Search"
        .hasBorder=${false}
        .hasInteractionFill=${false}
        aria-label="Embedded search input"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Borderless error</ds-text>
      <ds-input
        value="Invalid borderless value"
        .hasBorder=${false}
        error
        error-message="This field is invalid"
        aria-label="Invalid borderless input"
      ></ds-input>
    </div>
  `,
};

export const SearchClearAlignment: Story = {
  name: 'Search clear alignment',
  render: () => html`
    <div
      style="display:grid;grid-template-columns:max-content var(--dimension-panel-width-xs);align-items:center;gap:var(--dimension-space-100) var(--dimension-space-200);"
    >
      <ds-text variant="text-body-small" color="secondary">Large</ds-text>
      <ds-input
        type="search"
        size="lg"
        value="Search query"
        icon="MagnifyingGlass"
        aria-label="Large search input"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Medium</ds-text>
      <ds-input
        type="search"
        size="md"
        value="Search query"
        icon="MagnifyingGlass"
        aria-label="Medium search input"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Small</ds-text>
      <ds-input
        type="search"
        size="sm"
        value="Search query"
        icon="MagnifyingGlass"
        aria-label="Small search input"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Extra small</ds-text>
      <ds-input
        type="search"
        size="xs"
        value="Search query"
        icon="MagnifyingGlass"
        aria-label="Extra-small search input"
      ></ds-input>
    </div>
  `,
};

export const NumberSteppers: Story = {
  name: 'Number steppers',
  parameters: { controls: { include: ['showStepper'] } },
  args: { showStepper: true },
  render: args => html`
    <div
      style="display:grid;grid-template-columns:max-content var(--dimension-panel-width-xs);align-items:center;gap:var(--dimension-space-100) var(--dimension-space-200);"
    >
      <ds-text variant="text-body-small" color="secondary">Start aligned</ds-text>
      <ds-input
        type="number"
        value="1200"
        min="0"
        max="4000"
        step="100"
        text-align="start"
        .showStepper=${args['showStepper']}
        aria-label="Start-aligned number"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">End aligned</ds-text>
      <ds-input
        type="number"
        value="1200"
        min="0"
        max="4000"
        step="100"
        text-align="end"
        .showStepper=${args['showStepper']}
        aria-label="End-aligned number"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Without buttons</ds-text>
      <ds-input
        type="number"
        value="1200"
        min="0"
        max="4000"
        step="100"
        .showStepper=${false}
        aria-label="Number without stepper buttons"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Large</ds-text>
      <ds-input
        type="number"
        size="lg"
        value="12"
        min="0"
        max="20"
        text-align="end"
        aria-label="Large number"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Small</ds-text>
      <ds-input
        type="number"
        size="sm"
        value="12"
        min="0"
        max="20"
        text-align="end"
        aria-label="Small number"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Extra small</ds-text>
      <ds-input
        type="number"
        size="xs"
        value="12"
        min="0"
        max="20"
        text-align="end"
        aria-label="Extra-small number"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">At maximum</ds-text>
      <ds-input
        type="number"
        value="20"
        min="0"
        max="20"
        text-align="end"
        aria-label="Maximum number"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Read-only</ds-text>
      <ds-input
        type="number"
        value="12"
        min="0"
        max="20"
        text-align="end"
        read-only
        aria-label="Read-only number"
      ></ds-input>
      <ds-text variant="text-body-small" color="secondary">Inactive</ds-text>
      <ds-input type="number" value="12" is-inactive aria-label="Inactive number"></ds-input>
    </div>
  `,
};

const CURRENCY_OPTIONS = [
  { label: 'USD', value: 'usd' },
  { label: 'EUR', value: 'eur' },
  { label: 'GBP', value: 'gbp' },
];

const UNIT_OPTIONS = [
  { label: 'px', value: 'px' },
  { label: '%', value: 'percent' },
  { label: 'em', value: 'em' },
];

const INPUT_SIZES = ['lg', 'md', 'sm', 'xs'] as const;

export const PrefixAndSuffixSelects: Story = {
  name: 'Prefix and suffix selects',
  render: () => html`
    <div
      style="display:grid;grid-template-columns:max-content minmax(12rem,20rem);align-items:center;gap:var(--dimension-space-100) var(--dimension-space-200);"
    >
      ${INPUT_SIZES.map(
        size => html`
          <ds-text variant="text-body-small" color="secondary">${size} prefix</ds-text>
          <ds-input size=${size} value="1,200.00" aria-label="${size} amount">
            <ds-select
              slot="prefix"
              size=${size}
              width="hug"
              is-inset
              indicator="up-down"
              .hasBorder=${false}
              .allowClear=${false}
              .neutralTrigger=${true}
              value="usd"
              .options=${CURRENCY_OPTIONS}
              aria-label="${size} currency"
            ></ds-select>
          </ds-input>
          <ds-text variant="text-body-small" color="secondary">${size} suffix</ds-text>
          <ds-input size=${size} value="48" aria-label="${size} measure">
            <ds-select
              slot="suffix"
              size=${size}
              width="hug"
              is-inset
              indicator="up-down"
              .hasBorder=${false}
              .allowClear=${false}
              .neutralTrigger=${true}
              value="px"
              .options=${UNIT_OPTIONS}
              aria-label="${size} unit"
            ></ds-select>
          </ds-input>
        `
      )}
      <ds-text variant="text-body-small" color="secondary">Both</ds-text>
      <ds-input value="24" aria-label="Token size">
        <ds-select
          slot="prefix"
          size="md"
          width="hug"
          is-inset
          indicator="up-down"
          .hasBorder=${false}
          .allowClear=${false}
          .neutralTrigger=${true}
          value="usd"
          .options=${CURRENCY_OPTIONS}
          aria-label="Token currency"
        ></ds-select>
        <ds-select
          slot="suffix"
          size="md"
          width="hug"
          is-inset
          indicator="up-down"
          .hasBorder=${false}
          .allowClear=${false}
          .neutralTrigger=${true}
          value="px"
          .options=${UNIT_OPTIONS}
          aria-label="Token unit"
        ></ds-select>
      </ds-input>
    </div>
  `,
};

export const LengthConstraints: Story = {
  render: () => html`
    <div style="width:360px;display:grid;gap:var(--dimension-space-300)">
      <ds-field label="With guidance" description="Use between 5 and 25 characters.">
        <ds-input min-length="5" max-length="25" value="A short note"></ds-input>
      </ds-field>
      <ds-field label="Counter without guidance">
        <ds-input max-length="25" value="Exactly twenty-five chars"></ds-input>
      </ds-field>
      <ds-field label="Preserve extra text" description="Extra text is kept so you can edit it.">
        <ds-input max-length="25" value="This text is longer than the allowed limit."></ds-input>
      </ds-field>
      <ds-field label="Hard limit" description="Typing and paste stop at 25 characters.">
        <ds-input max-length="25" length-behavior="restrict"></ds-input>
      </ds-field>
    </div>
  `,
};

export const PatternValidation: Story = {
  render: () =>
    html`<div style="width:320px">
      <ds-field label="Reference" description="Three capital letters, a dash, and four digits."
        ><ds-input
          pattern="[A-Z]{3}-[0-9]{4}"
          pattern-message="Use a reference such as ABC-1234."
          placeholder="ABC-1234"
          required
        ></ds-input
      ></ds-field>
    </div>`,
};

export const Suggestions: Story = {
  render: () =>
    html`<div style="width:360px">
      <ds-field label="City" description="Choose a suggestion or enter any city."
        ><ds-input
          type="search"
          .suggestions=${['Vancouver', 'Victoria', 'Seattle', 'Portland', 'San Francisco']}
          placeholder="Start typing a city"
        ></ds-input
      ></ds-field>
    </div>`,
};
export const Tokens: Story = {
  render: () =>
    html`<div style="width:360px;display:grid;gap:var(--dimension-space-300)">
      <ds-field label="Empty token input"
        ><ds-input tokenized placeholder="Add keyword"></ds-input
      ></ds-field>
      <ds-field label="Keywords" description="Press Enter or comma to add a keyword."
        ><ds-input tokenized .tokens=${['Fleet', 'Safety']} placeholder="Add keyword"></ds-input
      ></ds-field>
      <ds-field label="Tags with suggestions"
        ><ds-input
          tokenized
          .suggestions=${['Operations', 'Safety', 'Maintenance']}
          .tokens=${['Operations']}
        ></ds-input
      ></ds-field>
      <ds-field label="Restricted token lengths" description="Up to 12 characters per token."
        ><ds-input
          tokenized
          max-length="12"
          .tokens=${['North', 'An overlong token']}
          placeholder="Add region"
        ></ds-input
      ></ds-field>
      <ds-field label="Read-only"
        ><ds-input tokenized read-only .tokens=${['Fleet', 'Safety']}></ds-input
      ></ds-field>
    </div>`,
};
