import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-select-multi.js';

const OPTIONS = [
  { label: 'Vehicles', value: 'vehicles', subtext: '142 available' },
  { label: 'Drivers', value: 'drivers', subtext: '85 available' },
  { label: 'Assets', value: 'assets', subtext: 'Unavailable', isInactive: true },
  { label: 'Groups', value: 'groups' },
];

const SECTIONS = [
  { header: 'Entities', divider: true, options: OPTIONS.slice(0, 3) },
  { header: 'Organization', options: OPTIONS.slice(3) },
];

const meta: Meta = {
  title: 'Form/Select Multi',
  tags: ['autodocs'],
  argTypes: {
    values: { control: 'object' },
    placeholder: { control: 'text' },
    size: { control: 'select', options: ['md', 'sm', 'xs'] },
    width: { control: 'select', options: ['fill', 'hug'] },
    icon: { control: 'text' },
    searchable: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    allowClear: { control: 'boolean' },
  },
  args: {
    values: ['vehicles', 'drivers'],
    placeholder: 'Entities',
    size: 'md',
    width: 'hug',
    icon: 'Chart',
    searchable: true,
    isLoading: false,
    allowClear: true,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => {
    const [, updateArgs] = useArgs();
    return html`
      <div style="width:260px;">
        <ds-select-multi
          .options=${OPTIONS}
          .values=${Array.isArray(args['values']) ? args['values'] : []}
          placeholder=${args['placeholder']}
          size=${args['size']}
          width=${args['width']}
          icon=${args['icon']}
          ?searchable=${args['searchable']}
          ?is-loading=${args['isLoading']}
          .allowClear=${args['allowClear']}
          aria-label="Entities"
          @dsChange=${(event: CustomEvent<string[]>) => updateArgs({ values: [...event.detail] })}
        ></ds-select-multi>
      </div>
    `;
  },
};

export const OpenWithCount: Story = {
  render: () => html`
    <div style="width:280px;min-height:380px;">
      <ds-select-multi
        .sections=${SECTIONS}
        .values=${['vehicles', 'drivers']}
        placeholder="Entities"
        searchable
        open
        aria-label="Entities"
      ></ds-select-multi>
    </div>
  `,
};

export const Loading: Story = {
  render: () => html`
    <div style="display:flex;gap:var(--dimension-space-200);width:540px;">
      <ds-select-multi
        style="flex:1;"
        .options=${OPTIONS}
        .values=${['vehicles']}
        icon="Chart"
        is-loading
        placeholder="Entities"
        aria-label="Loading entities"
      ></ds-select-multi>
      <ds-select-multi
        style="flex:1;"
        .options=${OPTIONS}
        is-loading
        open
        placeholder="Entities"
        aria-label="Loading entities"
      ></ds-select-multi>
    </div>
  `,
};

export const SearchNoResults: Story = {
  render: () => html`
    <div style="width:260px;min-height:220px;">
      <ds-select-multi
        .options=${OPTIONS}
        searchable
        open
        placeholder="Entities"
        aria-label="Entities"
      ></ds-select-multi>
    </div>
  `,
  play: async ({ canvasElement }) => {
    await customElements.whenDefined('ds-select-multi');
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const select = canvasElement.querySelector<HTMLDsSelectMultiElement>('ds-select-multi');
    const search = select?.querySelector<HTMLInputElement>('input[type="search"]');
    if (!search) return;
    search.value = 'no matching entities';
    search.dispatchEvent(new Event('input', { bubbles: true }));
  },
};

export const SizesAndWidths: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:var(--dimension-space-100);width:360px;">
      ${(['md', 'sm', 'xs'] as const).map(
        size => html`
          <ds-select-multi
            .options=${OPTIONS}
            .values=${['vehicles', 'drivers']}
            size=${size}
            placeholder="${size} entities"
            aria-label="${size} entities"
          ></ds-select-multi>
        `,
      )}
      <ds-select-multi
        .options=${OPTIONS}
        .values=${['vehicles']}
        width="fill"
        placeholder="Fill entities"
        aria-label="Fill entities"
      ></ds-select-multi>
    </div>
  `,
};

export const Backgrounds: Story = {
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(3,minmax(220px,1fr));gap:var(--dimension-space-100);">
      ${[
        [undefined, 'default', 'var(--color-background-primary)'],
        ['faint', 'faint', 'var(--color-background-faint-neutral)'],
        ['medium', 'medium', 'var(--color-background-medium-neutral)'],
        ['bold', 'bold', 'var(--color-background-bold-neutral)'],
        ['strong', 'strong', 'var(--color-background-strong-neutral)'],
        ['translucent', 'translucent', 'var(--color-translucent-translucent)'],
        ['inverted', 'inverted', 'var(--color-inverted-background)'],
        ['media', 'media', 'var(--color-media-background)'],
        ['always-dark', 'always-dark', 'var(--color-always-dark-background)'],
      ].map(
        ([value, label, surface]) => html`
          <div style="padding:var(--dimension-space-200);background:${surface};">
            <ds-select-multi
              .options=${OPTIONS}
              .values=${['vehicles', 'drivers']}
              placeholder="Entities"
              background=${value}
              aria-label="${label} entities"
            ></ds-select-multi>
          </div>
        `,
      )}
    </div>
  `,
};

export const RequiredAndError: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:var(--dimension-space-100);width:280px;">
      <ds-select-multi .options=${OPTIONS} required placeholder="Required entities" aria-label="Required entities"></ds-select-multi>
      <ds-select-multi
        .options=${OPTIONS}
        error
        error-message="Choose at least one entity."
        placeholder="Invalid entities"
        aria-label="Invalid entities"
      ></ds-select-multi>
      <ds-select-multi .options=${OPTIONS} is-inactive placeholder="Inactive entities" aria-label="Inactive entities"></ds-select-multi>
    </div>
  `,
};
