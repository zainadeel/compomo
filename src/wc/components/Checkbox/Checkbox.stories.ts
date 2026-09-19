import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-checkbox.js';
import '../../../../dist/components/ds-radio.js';
import '../../../../dist/components/ds-switch.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-text.js';

let formExampleId = 0;

const meta: Meta = {
  title: 'Form/Checkbox',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    size: { control: 'select', options: ['lg', 'md', 'sm', 'xs'] },
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    hasInteractionFill: { control: 'boolean' },
  },
  args: {
    label: 'Checkbox label',
    description: '',
    size: 'md',
    checked: false,
    indeterminate: false,
    isInactive: false,
    disabled: false,
    required: false,
    hasInteractionFill: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-checkbox
      label=${args['label']}
      description=${args['description'] || undefined}
      size=${args['size']}
      ?checked=${args['checked']}
      ?indeterminate=${args['indeterminate']}
      ?is-inactive=${args['isInactive']}
      ?disabled=${args['disabled']}
      ?required=${args['required']}
      ?has-interaction-fill=${args['hasInteractionFill']}
    ></ds-checkbox>
  `,
};

export const WithDescription: Story = {
  render: () => html`
    <div style="width:min(420px, 90vw);">
      <ds-checkbox
        label="Executive summary"
        description="Include the affected vehicles, findings, and recommended next steps."
        size="lg"
        checked
      ></ds-checkbox>
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div
      style="display:flex;flex-direction:column;align-items:flex-start;gap:var(--dimension-space-100);"
    >
      ${(['lg', 'md', 'sm', 'xs'] as const).map(
        size => html`
          <div style="display:flex;align-items:center;gap:var(--dimension-space-100);">
            <ds-checkbox size=${size} label="${size.toUpperCase()} unchecked"></ds-checkbox>
            <ds-checkbox size=${size} label="${size.toUpperCase()} checked" checked></ds-checkbox>
            <ds-checkbox
              size=${size}
              label="${size.toUpperCase()} mixed"
              indeterminate
            ></ds-checkbox>
          </div>
        `
      )}
    </div>
  `,
};

export const States: Story = {
  render: () => html`
    <div
      style="display:flex;flex-direction:column;align-items:flex-start;gap:var(--dimension-space-050);max-width:240px;"
    >
      <ds-checkbox label="Unchecked"></ds-checkbox>
      <ds-checkbox label="Checked" checked></ds-checkbox>
      <ds-checkbox label="Indeterminate" indeterminate></ds-checkbox>
      <ds-checkbox label="Disabled checked" checked disabled></ds-checkbox>
      <ds-checkbox label="Inactive unchecked" is-inactive></ds-checkbox>
      <ds-checkbox label="Inactive checked" checked is-inactive></ds-checkbox>
    </div>
  `,
};

export const ChoiceListInteraction: Story = {
  render: () => html`
    <div style="width:min(320px, 90vw);">
      <ds-checkbox
        label="Selectable option"
        description="Choice-list rows opt into hover and pressed feedback."
        has-interaction-fill
      ></ds-checkbox>
    </div>
  `,
};

export const PresentationIndicators: Story = {
  render: () => html`
    <div style="display:flex;align-items:center;gap:var(--dimension-space-200);">
      ${(['lg', 'md', 'sm', 'xs'] as const).map(
        size => html`
          <div
            style="
            display:flex;
            align-items:center;
            justify-content:center;
            width:var(--dimension-iconography-md);
            height:var(--dimension-iconography-md);
            background:var(--color-background-faint-neutral);
          "
          >
            <ds-checkbox label="" size=${size} checked presentation></ds-checkbox>
          </div>
        `
      )}
    </div>
  `,
};

export const FormLifecycle: Story = {
  name: 'Form lifecycle',
  parameters: { controls: { disable: true } },
  render: () => {
    const formId = `checkbox-form-example-${++formExampleId}`;
    let form: HTMLFormElement | undefined;
    let fieldset: HTMLFieldSetElement | undefined;
    let status: HTMLElement | undefined;
    const refresh = () => {
      if (!form || !status) return;
      const values = [...new FormData(form)].map(([name, value]) => `${name}: ${value}`);
      status.textContent = `${form.checkValidity() ? 'Ready to submit.' : 'Consent is required.'} Submitted values: ${values.join('; ') || 'none'}.`;
    };
    const setDisabled = (disabled: boolean) => {
      if (fieldset) fieldset.disabled = disabled;
      requestAnimationFrame(refresh);
    };
    return html`
      <div
        style="display:grid;gap:var(--dimension-space-200);max-width:var(--dimension-panel-width-lg);"
        @dsChange=${() => requestAnimationFrame(refresh)}
      >
        <ds-text as="p" variant="text-body-small" color="secondary">
          Change the preferences, disable and enable the fieldset, then reset. Delivery channel is
          outside the form and uses the same form owner. Reset restores every initial value,
          including the checkbox's mixed state.
        </ds-text>
        <form
          id=${formId}
          ${ref(element => {
            form = element as HTMLFormElement | undefined;
          })}
        >
          <fieldset
            style="display:grid;gap:var(--dimension-space-150);border:0;margin:0;padding:0;"
            ${ref(element => {
              fieldset = element as HTMLFieldSetElement | undefined;
            })}
          >
            <legend>
              <ds-text as="span" variant="text-body-medium" emphasis>Preferences</ds-text>
            </legend>
            <ds-checkbox
              label="I agree to receive updates"
              name="consent"
              value="accepted"
              indeterminate
              required
            ></ds-checkbox>
            <div style="display:flex;align-items:center;gap:var(--dimension-space-200);">
              <label for="${formId}-alerts"
                ><ds-text as="span" variant="text-body-medium">Instant alerts</ds-text></label
              >
              <ds-switch
                id="${formId}-alerts"
                name="alerts"
                value="on"
                unchecked-value="off"
              ></ds-switch>
            </div>
            <ds-radio
              group-label="Frequency"
              name="frequency"
              value="weekly"
              .options=${[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            ></ds-radio>
          </fieldset>
        </form>
        <div style="display:grid;gap:var(--dimension-space-050);">
          <ds-text as="span" variant="text-body-small" color="secondary"
            >Delivery channel · outside the form</ds-text
          >
          <ds-select
            .form=${formId}
            name="channel"
            aria-label="Delivery channel"
            value="email"
            .options=${[
              { value: 'email', label: 'Email' },
              { value: 'app', label: 'In app' },
            ]}
          ></ds-select>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:var(--dimension-space-100);">
          <ds-button-unfilled label="Inspect form" @dsClick=${refresh}></ds-button-unfilled>
          <ds-button-unfilled
            label="Disable fieldset"
            @dsClick=${() => setDisabled(true)}
          ></ds-button-unfilled>
          <ds-button-unfilled
            label="Enable fieldset"
            @dsClick=${() => setDisabled(false)}
          ></ds-button-unfilled>
          <ds-button-unfilled
            label="Reset form"
            @dsClick=${() => {
              form?.reset();
              requestAnimationFrame(refresh);
            }}
          ></ds-button-unfilled>
        </div>
        <ds-text
          as="p"
          variant="text-body-small"
          role="status"
          ${ref(element => {
            status = element as HTMLElement | undefined;
          })}
          >Inspect the form to see its current submission values.</ds-text
        >
      </div>
    `;
  },
};
