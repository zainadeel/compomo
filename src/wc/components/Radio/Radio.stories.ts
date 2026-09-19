import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-radio.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-text.js';

const defaultOptions = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
];

const meta: Meta = {
  title: 'Form/Radio',
  tags: ['autodocs'],
  argTypes: {
    groupLabel: { control: 'text' },
    value: { control: 'text' },
    size: { control: 'radio', options: ['lg', 'md', 'sm', 'xs'] },
    direction: { control: 'radio', options: ['vertical', 'horizontal'] },
    isInactive: { control: 'boolean' },
    hasInteractionFill: { control: 'boolean' },
  },
  args: {
    value: 'a',
    size: 'md',
    direction: 'vertical',
    isInactive: false,
    hasInteractionFill: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-radio
      .options=${defaultOptions}
      .groupLabel=${args['groupLabel'] ?? ''}
      value=${args['value'] ?? 'a'}
      size=${args['size'] ?? 'md'}
      direction=${args['direction'] ?? 'vertical'}
      ?is-inactive=${args['isInactive']}
      ?has-interaction-fill=${args['hasInteractionFill']}
      aria-label="Playground radio"
    ></ds-radio>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: grid; gap: var(--dimension-space-200);">
      ${(['lg', 'md', 'sm', 'xs'] as const).map(
        size => html`
          <ds-radio
            .options=${[
              { label: `${size.toUpperCase()} selected`, value: 'selected' },
              { label: `${size.toUpperCase()} unselected`, value: 'unselected' },
            ]}
            value="selected"
            size=${size}
            aria-label=${`${size} radio size`}
          ></ds-radio>
        `
      )}
    </div>
  `,
};

export const Horizontal: Story = {
  render: () => html`
    <ds-radio
      .options=${defaultOptions}
      value="a"
      direction="horizontal"
      aria-label="Horizontal example"
    ></ds-radio>
  `,
};

export const DescriptiveOptions: Story = {
  render: () => html`
    <div style="width:min(420px, 90vw);">
      <ds-radio
        .options=${[
          {
            label: 'Weekly digest',
            value: 'weekly',
            description: 'Receive one summary at the end of each week.',
          },
          {
            label: 'Immediate alerts',
            value: 'immediate',
            description: 'Receive a notification as soon as something needs attention.',
          },
        ]}
        value="weekly"
        size="lg"
        aria-label="Notification frequency"
      ></ds-radio>
    </div>
  `,
};

export const Labeled: Story = {
  render: () => html`
    <ds-radio
      .groupLabel=${'Notification frequency'}
      .options=${[
        {
          label: 'Weekly digest',
          value: 'weekly',
          description: 'Receive one summary at the end of each week.',
        },
        {
          label: 'Immediate alerts',
          value: 'immediate',
          description: 'Receive a notification as soon as something needs attention.',
        },
      ]}
      value="weekly"
    ></ds-radio>
  `,
};

export const ChoiceListInteraction: Story = {
  render: () => html`
    <div style="width:min(360px, 90vw);">
      <ds-radio
        .groupLabel=${'Choose an option'}
        .options=${[
          { label: 'First option', value: 'first' },
          { label: 'Second option', value: 'second' },
        ]}
        value="first"
        has-interaction-fill
      ></ds-radio>
    </div>
  `,
};

export const WithInactiveItem: Story = {
  render: () => html`
    <ds-radio
      .options=${[
        { label: 'Option A', value: 'a' },
        { label: 'Option B (inactive)', value: 'b', isInactive: true },
        { label: 'Option C', value: 'c' },
      ]}
      value="a"
      aria-label="With inactive item"
    ></ds-radio>
  `,
};

export const ChangingOptions: Story = {
  name: 'Changing options',
  parameters: { controls: { disable: true } },
  render: () => {
    let form: HTMLFormElement | undefined;
    let radio: HTMLDsRadioElement | undefined;
    let status: HTMLElement | undefined;
    const choices = [
      { value: 'weekly', label: 'Weekly digest' },
      { value: 'immediate', label: 'Immediate alerts' },
    ];
    const refresh = () => {
      if (!form || !status) return;
      status.textContent = form.checkValidity()
        ? `Selected frequency: ${new FormData(form).get('frequency')}.`
        : 'Choose an available frequency to continue.';
    };
    const updateOptions = (options: typeof choices) => {
      if (radio) radio.options = options;
      requestAnimationFrame(refresh);
    };
    return html`
      <div
        style="display:grid;gap:var(--dimension-space-200);max-width:var(--dimension-panel-width-lg);"
      >
        <ds-text as="p" variant="text-body-small" color="secondary">
          Make the selected option unavailable or remove it. The form requires an available
          selection. Restoring the options preserves the current value.
        </ds-text>
        <form
          ${ref(element => {
            form = element as HTMLFormElement | undefined;
          })}
        >
          <ds-radio
            group-label="Notification frequency"
            name="frequency"
            value="weekly"
            required
            .options=${choices}
            @dsChange=${refresh}
            ${ref(element => {
              radio = element as HTMLDsRadioElement | undefined;
            })}
          ></ds-radio>
        </form>
        <div style="display:flex;flex-wrap:wrap;gap:var(--dimension-space-100);">
          <ds-button-unfilled
            label="Disable weekly"
            @dsClick=${() =>
              updateOptions(
                choices.map(option => ({ ...option, isInactive: option.value === 'weekly' }))
              )}
          ></ds-button-unfilled>
          <ds-button-unfilled
            label="Remove weekly"
            @dsClick=${() => updateOptions(choices.slice(1))}
          ></ds-button-unfilled>
          <ds-button-unfilled
            label="Restore options"
            @dsClick=${() => updateOptions(choices)}
          ></ds-button-unfilled>
        </div>
        <ds-text
          as="p"
          variant="text-body-small"
          role="status"
          ${ref(element => {
            status = element as HTMLElement | undefined;
          })}
          >Selected frequency: weekly.</ds-text
        >
      </div>
    `;
  },
};
