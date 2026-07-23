import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-select.js';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';

const OPTIONS = [
  { label: 'Apple', value: 'apple', icon: 'Chart' },
  { label: 'Banana', value: 'banana', icon: 'Bell', subtext: 'Unavailable for this account', isInactive: true },
  { label: 'Cherry', value: 'cherry', icon: 'Bell' },
  { label: 'Date', value: 'date', icon: 'Chart', subtext: 'A longer secondary description' },
];

const SECTIONS = [
  {
    header: 'Recommended',
    divider: true,
    options: OPTIONS.slice(0, 2),
  },
  {
    header: 'More fruit',
    options: OPTIONS.slice(2),
  },
];

const BACKGROUNDS = [
  { value: undefined, label: 'default', surface: 'var(--color-background-primary)' },
  { value: 'faint', label: 'faint', surface: 'var(--color-background-faint-neutral)' },
  { value: 'medium', label: 'medium', surface: 'var(--color-background-medium-neutral)' },
  { value: 'bold', label: 'bold', surface: 'var(--color-background-bold-neutral)' },
  { value: 'strong', label: 'strong', surface: 'var(--color-background-strong-neutral)' },
  { value: 'translucent', label: 'translucent', surface: 'var(--color-translucent-translucent)' },
  { value: 'inverted', label: 'inverted', surface: 'var(--color-inverted-background)' },
  { value: 'media', label: 'media', surface: 'var(--color-media-background)' },
  { value: 'always-dark', label: 'always-dark', surface: 'var(--color-always-dark-background)' },
] as const;

const meta: Meta = {
  title: 'Form/Select',
  tags: ['autodocs'],
  parameters: {
    docs: isolatedOverlayDocs('420px'),
  },
  argTypes: {
    value: { control: 'select', options: ['', 'apple', 'cherry', 'date'] },
    placeholder: { control: 'text' },
    size: { control: 'select', options: ['md', 'sm', 'xs'] },
    width: { control: 'select', options: ['fill', 'hug'] },
    icon: { control: 'text' },
    searchable: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    background: {
      control: 'select',
      options: [undefined, 'faint', 'medium', 'bold', 'strong', 'translucent', 'inverted', 'media', 'always-dark'],
    },
  },
  args: {
    value: '',
    placeholder: 'Select fruit',
    size: 'md',
    width: 'hug',
    icon: 'Chart',
    searchable: false,
    isLoading: false,
    allowClear: true,
    isInactive: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => {
    const [, updateArgs] = useArgs();
    return html`
      <div style="width:240px;">
        <ds-select
          .options=${OPTIONS}
          value=${args['value']}
          placeholder=${args['placeholder']}
          size=${args['size']}
          width=${args['width']}
          icon=${args['icon']}
          background=${args['background']}
          ?searchable=${args['searchable']}
          ?is-loading=${args['isLoading']}
          .allowClear=${args['allowClear']}
          ?is-inactive=${args['isInactive']}
          aria-label="Fruit"
          @dsChange=${(event: CustomEvent<string>) => updateArgs({ value: event.detail })}
        ></ds-select>
      </div>
    `;
  },
};

export const RichOptions: Story = {
  render: () => html`
    <div style="width:280px;min-height:360px;">
      <ds-select
        .sections=${SECTIONS}
        value="cherry"
        searchable
        open
        placeholder="Select fruit"
        aria-label="Fruit"
      ></ds-select>
    </div>
  `,
};

export const Loading: Story = {
  render: () => html`
    <div style="display:flex;gap:var(--dimension-space-200);width:520px;">
      <ds-select
        style="flex:1;"
        .options=${OPTIONS}
        icon="Chart"
        is-loading
        placeholder="Loading with icon"
        aria-label="Loading fruit"
      ></ds-select>
      <ds-select
        style="flex:1;"
        .options=${OPTIONS}
        is-loading
        open
        placeholder="Loading without icon"
        aria-label="Loading fruit"
      ></ds-select>
    </div>
  `,
};

export const ClearFooter: Story = {
  render: () => html`
    <div style="width:240px;min-height:260px;">
      <ds-select
        .options=${OPTIONS}
        value="cherry"
        open
        placeholder="Select fruit"
        aria-label="Fruit"
      ></ds-select>
    </div>
  `,
};

export const NoResults: Story = {
  render: () => html`
    <div style="width:240px;min-height:220px;">
      <ds-select
        .options=${OPTIONS}
        searchable
        open
        placeholder="Select fruit"
        aria-label="Fruit"
      ></ds-select>
    </div>
  `,
  play: async ({ canvasElement }) => {
    await customElements.whenDefined('ds-select');
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const select = canvasElement.querySelector<HTMLDsSelectElement>('ds-select');
    const search = select?.querySelector<HTMLInputElement>('input[type="search"]');
    if (!search) return;
    search.value = 'no matching fruit';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  },
};

export const KeyboardNavigation: Story = {
  render: () => html`
    <div style="width:240px;min-height:300px;">
      <ds-select .options=${OPTIONS} value="cherry" aria-label="Fruit"></ds-select>
    </div>
  `,
  play: async ({ canvasElement }) => {
    await customElements.whenDefined('ds-select');
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const select = canvasElement.querySelector<HTMLDsSelectElement>('ds-select');
    const trigger = select?.querySelector<HTMLButtonElement>('[role="combobox"]');
    trigger?.focus();
    trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  },
};

export const Backgrounds: Story = {
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(3,minmax(220px,1fr));gap:var(--dimension-space-100);">
      ${BACKGROUNDS.map(
        background => html`
          <div style="padding:var(--dimension-space-200);background:${background.surface};">
            <ds-text as="div" variant="text-body-small" color="inherit">${background.label}</ds-text>
            <ds-select
              data-a11y-fixture
              style="margin-top:var(--dimension-space-100);"
              .options=${OPTIONS}
              value="cherry"
              background=${background.value}
              aria-label="${background.label} fruit"
            ></ds-select>
          </div>
        `,
      )}
    </div>
  `,
};

export const SizesAndStates: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:var(--dimension-space-100);width:260px;">
      ${(['md', 'sm', 'xs'] as const).map(
        size => html`<ds-select .options=${OPTIONS} value="cherry" size=${size} aria-label="${size} fruit"></ds-select>`,
      )}
      <ds-select .options=${OPTIONS} is-inactive aria-label="Inactive fruit"></ds-select>
      <ds-select
        .options=${OPTIONS}
        error
        error-message="Choose a valid fruit."
        aria-label="Invalid fruit"
      ></ds-select>
    </div>
  `,
};
