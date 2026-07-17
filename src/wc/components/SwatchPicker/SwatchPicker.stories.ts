import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-swatch-picker.js';
import { shellGradientPickerSections } from '../../shell/shell-gradient-presets';
import type { SwatchPickerOption } from './swatch-picker-types';

const FLAT_OPTIONS: SwatchPickerOption[] = [
  {
    value: 'blue',
    label: 'Blue',
    preview: { backgroundColor: 'var(--color-color-intent-blue-bold-background)' },
  },
  {
    value: 'green',
    label: 'Green',
    preview: { backgroundColor: 'var(--color-color-intent-green-bold-background)' },
  },
  {
    value: 'orange',
    label: 'Orange',
    preview: { backgroundColor: 'var(--color-color-intent-orange-bold-background)' },
  },
  {
    value: 'purple',
    label: 'Purple',
    preview: { backgroundColor: 'var(--color-color-intent-purple-bold-background)' },
  },
];

const GRADIENT_OPTIONS: SwatchPickerOption[] = [
  {
    value: 'sunset',
    label: 'Sunset',
    preview: {
      backgroundImage: 'linear-gradient(135deg, var(--color-color-intent-orange-bold-background), var(--color-color-intent-pink-bold-background))',
    },
  },
  {
    value: 'ocean',
    label: 'Ocean',
    preview: {
      backgroundImage: 'linear-gradient(135deg, var(--color-color-intent-blue-bold-background), var(--color-color-intent-cyan-bold-background))',
    },
  },
  {
    value: 'aurora',
    label: 'Aurora',
    preview: {
      backgroundImage: 'linear-gradient(135deg, var(--color-color-intent-green-bold-background), var(--color-color-intent-purple-bold-background))',
    },
  },
];

const MIXED_OPTIONS: SwatchPickerOption[] = [
  ...FLAT_OPTIONS.slice(0, 2),
  ...GRADIENT_OPTIONS,
];

const meta: Meta = {
  title: 'Primitives/SwatchPicker',
  tags: ['autodocs'],
  args: {
    value: 'blue',
    groupLabel: 'Visual treatment',
  },
  argTypes: {
    value: {
      control: 'select',
      options: MIXED_OPTIONS.map(option => option.value),
    },
    groupLabel: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => {
    const [, updateArgs] = useArgs();
    return html`
      <div style="width: 320px; background: var(--color-background-primary)">
        <ds-swatch-picker
          value=${args['value']}
          group-label=${args['groupLabel']}
          .options=${MIXED_OPTIONS}
          @dsChange=${(event: CustomEvent<string>) => updateArgs({ value: event.detail })}
        ></ds-swatch-picker>
      </div>
    `;
  },
};

export const FlatColors: Story = {
  name: 'Flat colors',
  render: () => html`
    <div style="width: 320px; background: var(--color-background-primary)">
      <ds-swatch-picker
        value="blue"
        group-label="Accent color"
        .options=${FLAT_OPTIONS}
      ></ds-swatch-picker>
    </div>
  `,
};

export const Gradients: Story = {
  render: () => html`
    <div style="width: 320px; background: var(--color-background-primary)">
      <ds-swatch-picker
        value="ocean"
        group-label="Background gradient"
        .options=${GRADIENT_OPTIONS}
      ></ds-swatch-picker>
    </div>
  `,
};

export const GroupedShellPresets: Story = {
  name: 'Grouped shell presets',
  render: () => html`
    <div style="width: 320px; background: var(--color-background-primary)">
      <ds-swatch-picker
        value="neutral"
        group-label="Shell gradient theme"
        .sections=${shellGradientPickerSections()}
      ></ds-swatch-picker>
    </div>
  `,
};

export const InactiveOption: Story = {
  name: 'Inactive option',
  render: () => html`
    <div style="width: 320px; background: var(--color-background-primary)">
      <ds-swatch-picker
        value="blue"
        group-label="Accent color"
        .options=${FLAT_OPTIONS.map((option, index) => ({
          ...option,
          isInactive: index === 1,
        }))}
      ></ds-swatch-picker>
    </div>
  `,
};
