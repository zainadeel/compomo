import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-button.js';
import '../../../../dist/components/ds-loader.js';
import '../../../../dist/components/ds-surface.js';

// Reusable placeholder icon (slot="icon")
const ICON = html`<svg slot="icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="10" cy="10" r="6"/></svg>`;
const ICON_SM = html`<svg slot="icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="10" cy="10" r="6"/></svg>`;

// Row/column layout helpers
const ROW = 'display: flex; gap: 8px; align-items: center; flex-wrap: wrap;';
const COL = 'display: flex; flex-direction: column; gap: 8px; align-items: flex-start;';
const LBL = 'font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary, #888); min-width: 96px; flex-shrink: 0;';

const INTENTS   = ['none', 'neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'] as const;
const CONTRASTS = ['strong', 'bold', 'medium', 'faint'] as const;
const SIZES     = ['lg', 'md', 'sm', 'xs'] as const;
const ELEVS     = ['elevated', 'flat', 'none', 'floating'] as const;

const meta: Meta = {
  title: 'Actions/Button',
  tags: ['autodocs'],
  argTypes: {
    variant:    { control: 'radio', options: ['primary', 'secondary'] },
    intent:     { control: 'select', options: ['none', 'neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'] },
    size:       { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    contrast:   { control: 'select', options: ['strong', 'bold', 'medium', 'faint'] },
    elevation:  { control: 'select', options: ['none', 'flat', 'elevated', 'floating'] },
    label:      { control: 'text' },
    rounded:    { control: 'boolean' },
    fullWidth:  { control: 'boolean' },
    dropdown:   { control: 'boolean' },
    loading:    { control: 'boolean' },
    inactive:   { control: 'boolean' },
  },
  args: { variant: 'primary', intent: 'brand', size: 'md', label: 'Button', rounded: false, fullWidth: false, dropdown: false, loading: false, inactive: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-button
      variant=${args['variant'] ?? 'primary'}
      intent=${args['intent'] ?? 'brand'}
      size=${args['size'] ?? 'md'}
      contrast=${args['contrast'] ?? 'bold'}
      label=${args['label'] ?? 'Button'}
      ?rounded=${args['rounded']}
      ?fullWidth=${args['fullWidth']}
      ?dropdown=${args['dropdown']}
      ?loading=${args['loading']}
      ?inactive=${args['inactive']}
    ></ds-button>
  `,
};

export const Intents: Story = {
  render: () => html`
    <div style="display: flex; flex-wrap: wrap; gap: 8px">
      <ds-button intent="brand"    label="Brand"></ds-button>
      <ds-button intent="neutral"  label="Neutral"></ds-button>
      <ds-button intent="positive" label="Positive"></ds-button>
      <ds-button intent="negative" label="Negative"></ds-button>
      <ds-button intent="warning"  label="Warning"></ds-button>
      <ds-button intent="caution"  label="Caution"></ds-button>
      <ds-button intent="ai"       label="AI"></ds-button>
      <ds-button intent="none"     label="None"></ds-button>
    </div>
  `,
};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px">
      <div style="display: flex; gap: 8px; align-items: center">
        <ds-button variant="primary" intent="brand" label="Primary"></ds-button>
        <ds-button variant="secondary" intent="brand" label="Secondary ghost"></ds-button>
        <ds-button variant="secondary" elevation="flat" intent="brand" label="Secondary flat"></ds-button>
        <ds-button variant="secondary" elevation="elevated" label="Secondary elevated"></ds-button>
      </div>
      <div style="display: flex; gap: 8px; align-items: center">
        <ds-button size="xs" label="XS"></ds-button>
        <ds-button size="sm" label="SM"></ds-button>
        <ds-button size="md" label="MD"></ds-button>
        <ds-button size="lg" label="LG"></ds-button>
      </div>
      <div style="display: flex; gap: 8px; align-items: center">
        <ds-button rounded label="Rounded"></ds-button>
        <ds-button dropdown label="Dropdown"></ds-button>
        <ds-button loading label="Loading"></ds-button>
        <ds-button inactive label="Inactive"></ds-button>
      </div>
    </div>
  `,
};

export const WithIcon: Story = {
  render: () => html`
    <div style="${ROW}">
      <ds-button label="With icon" intent="brand">
        <svg slot="icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 7v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </ds-button>
      <ds-button intent="brand" aria-label="Icon only">
        <svg slot="icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </ds-button>
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LBL}">label only</span>
        ${SIZES.map(s => html`<ds-button size=${s} label=${s.toUpperCase()}></ds-button>`)}
      </div>
      <div style="${ROW}">
        <span style="${LBL}">icon + label</span>
        ${SIZES.map(s => html`<ds-button size=${s} label=${s.toUpperCase()}>${ICON}</ds-button>`)}
      </div>
      <div style="${ROW}">
        <span style="${LBL}">icon only</span>
        ${SIZES.map(s => html`<ds-button size=${s} aria-label=${s}>${ICON}</ds-button>`)}
      </div>
    </div>
  `,
};

export const Elevation: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LBL}">primary</span>
        ${ELEVS.map(e => html`<ds-button variant="primary" intent="brand" elevation=${e} label=${e}></ds-button>`)}
      </div>
      <div style="${ROW}">
        <span style="${LBL}">secondary</span>
        ${ELEVS.map(e => html`<ds-button variant="secondary" elevation=${e} label=${e}></ds-button>`)}
      </div>
      <div style="${ROW}">
        <span style="${LBL}">p / intent none</span>
        ${ELEVS.map(e => html`<ds-button variant="primary" intent="none" elevation=${e} label=${e}></ds-button>`)}
      </div>
      <div style="${ROW}">
        <span style="${LBL}">FAB</span>
        <ds-button variant="primary" intent="brand" elevation="floating" rounded aria-label="FAB">${ICON}</ds-button>
        <ds-button variant="secondary" elevation="floating" rounded aria-label="FAB secondary">${ICON}</ds-button>
      </div>
    </div>
  `,
};

export const Contrasts: Story = {
  render: () => html`
    <div style="${COL}">
      ${INTENTS.filter(i => i !== 'none').map(intent => html`
        <div style="${ROW}">
          <span style="${LBL}">${intent}</span>
          ${CONTRASTS.map(c => html`<ds-button variant="primary" intent=${intent} contrast=${c} label=${c} elevation="flat"></ds-button>`)}
        </div>`)}
    </div>
  `,
};

export const States: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LBL}">inactive</span>
        <ds-button variant="primary" intent="brand" label="Primary" inactive></ds-button>
        <ds-button variant="secondary" elevation="flat" label="Secondary" inactive></ds-button>
        <ds-button variant="secondary" label="Ghost" inactive></ds-button>
        <ds-button variant="primary" intent="brand" aria-label="Icon" inactive>${ICON}</ds-button>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">loading</span>
        <ds-button variant="primary" intent="brand" label="Saving" loading></ds-button>
        <ds-button variant="secondary" elevation="flat" label="Saving" loading></ds-button>
        <ds-button variant="secondary" label="Saving" loading></ds-button>
        <ds-button variant="primary" intent="brand" aria-label="Saving" loading>${ICON}</ds-button>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">rounded</span>
        <ds-button variant="primary" intent="brand" label="Rounded" rounded></ds-button>
        <ds-button variant="secondary" elevation="flat" label="Rounded" rounded></ds-button>
        <ds-button variant="secondary" label="Rounded" rounded></ds-button>
        <ds-button variant="primary" intent="brand" rounded aria-label="Rounded">${ICON}</ds-button>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">dropdown</span>
        <ds-button variant="primary" intent="brand" label="Options" dropdown></ds-button>
        <ds-button variant="secondary" elevation="flat" label="Options" dropdown></ds-button>
        <ds-button variant="secondary" label="Options" dropdown></ds-button>
        <ds-button variant="primary" intent="brand" label="Options" dropdown>${ICON_SM}</ds-button>
      </div>
    </div>
  `,
};

export const WithBadge: Story = {
  render: () => html`
    <div style="${ROW}">
      <ds-button variant="secondary" label="Messages"      badge-count="3"></ds-button>
      <ds-button variant="secondary" label="Notifications" badge-count="9"></ds-button>
      <ds-button variant="secondary" label="Alerts"        badge-count="12"></ds-button>
    </div>
  `,
};

export const FullWidth: Story = {
  render: () => html`
    <div style="${COL} width: 320px;">
      <ds-button variant="primary" intent="brand" label="Full Width" fullWidth></ds-button>
      <ds-button variant="secondary" elevation="flat" label="Full Width" fullWidth>${ICON_SM}</ds-button>
      <ds-button variant="primary" intent="brand" label="Long label that should truncate gracefully" fullWidth></ds-button>
    </div>
  `,
};

export const AsLink: Story = {
  render: () => html`
    <div style="${ROW}">
      <ds-button variant="primary" intent="brand" href="#" label="Link button"></ds-button>
      <ds-button variant="secondary" elevation="flat" href="#" label="Link button"></ds-button>
      <ds-button variant="secondary" href="#" label="Ghost link"></ds-button>
    </div>
  `,
};

// ── Matrix ────────────────────────────────────────────────────────────────────

export const Matrix: Story = {
  parameters: { layout: 'padded' },
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 32px; font-family: var(--typography-font-family, sans-serif);">

      <!-- Variants × Intent -->
      <div>
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--color-foreground-tertiary); margin-bottom: 12px;">
          Variants × Intent — md, bold contrast
        </div>
        <div style="${COL}">
          <div style="${ROW}">
            <span style="${LBL}"></span>
            <span style="font-size: 10px; font-family: monospace; min-width: 100px; text-align: center; color: var(--color-foreground-tertiary);">primary</span>
            <span style="font-size: 10px; font-family: monospace; min-width: 100px; text-align: center; color: var(--color-foreground-tertiary);">secondary flat</span>
            <span style="font-size: 10px; font-family: monospace; min-width: 100px; text-align: center; color: var(--color-foreground-tertiary);">secondary ghost</span>
          </div>
          ${INTENTS.map(intent => html`
            <div style="${ROW}">
              <span style="${LBL}">${intent}</span>
              <div style="min-width: 100px; display: flex; justify-content: center;">
                <ds-button variant="primary" intent=${intent} label="Label"></ds-button>
              </div>
              <div style="min-width: 100px; display: flex; justify-content: center;">
                <ds-button variant="secondary" elevation="flat" intent=${intent} label="Label"></ds-button>
              </div>
              <div style="min-width: 100px; display: flex; justify-content: center;">
                <ds-button variant="secondary" intent=${intent} label="Label"></ds-button>
              </div>
            </div>`)}
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid var(--color-border-tertiary); margin: 0;" />

      <!-- Elevation levels -->
      <div>
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--color-foreground-tertiary); margin-bottom: 12px;">
          Elevation levels
        </div>
        <div style="${COL}">
          ${ELEVS.map(elev => html`
            <div style="${ROW}">
              <span style="${LBL}">${elev}</span>
              <ds-button variant="secondary" elevation=${elev} label="Label"></ds-button>
              <ds-button variant="secondary" elevation=${elev} label="Label">${ICON_SM}</ds-button>
              <ds-button variant="secondary" elevation=${elev} aria-label="action">${ICON}</ds-button>
              <ds-button variant="primary" intent="brand" elevation=${elev} label="Brand"></ds-button>
              <ds-button variant="primary" intent="none" elevation=${elev} label="None"></ds-button>
            </div>`)}
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid var(--color-border-tertiary); margin: 0;" />

      <!-- Primary × Contrast × Intent -->
      <div>
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--color-foreground-tertiary); margin-bottom: 12px;">
          Primary × Contrast × Intent
        </div>
        <div style="${COL}">
          <div style="${ROW}">
            <span style="${LBL}"></span>
            ${CONTRASTS.map(c => html`<span style="font-size: 10px; font-family: monospace; min-width: 90px; text-align: center; color: var(--color-foreground-tertiary);">${c}</span>`)}
          </div>
          ${INTENTS.filter(i => i !== 'none').map(intent => html`
            <div style="${ROW}">
              <span style="${LBL}">${intent}</span>
              ${CONTRASTS.map(c => html`
                <div style="min-width: 90px; display: flex; justify-content: center;">
                  <ds-button variant="primary" intent=${intent} contrast=${c} label="Label" elevation="flat"></ds-button>
                </div>`)}
            </div>`)}
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid var(--color-border-tertiary); margin: 0;" />

      <!-- Sizes × Variants -->
      <div>
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--color-foreground-tertiary); margin-bottom: 12px;">
          Sizes × Variants
        </div>
        <div style="${COL}">
          ${SIZES.flatMap(size => [
            { key: `${size}-label`,     showIcon: false, showLabel: true  },
            { key: `${size}-icon`,      showIcon: true,  showLabel: false },
            { key: `${size}-iconlabel`, showIcon: true,  showLabel: true  },
          ]).map(({ key, showIcon, showLabel }) => html`
            <div style="${ROW}">
              <span style="${LBL}">${key}</span>
              <ds-button variant="primary" size=${key.split('-')[0]}
                label=${showLabel ? 'Label' : ''}
                aria-label="action">
                ${showIcon ? html`<svg slot="icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="6"/></svg>` : ''}
              </ds-button>
              <ds-button variant="secondary" elevation="flat" size=${key.split('-')[0]}
                label=${showLabel ? 'Label' : ''}
                aria-label="action">
                ${showIcon ? html`<svg slot="icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="6"/></svg>` : ''}
              </ds-button>
              <ds-button variant="secondary" size=${key.split('-')[0]}
                label=${showLabel ? 'Label' : ''}
                aria-label="action">
                ${showIcon ? html`<svg slot="icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="6"/></svg>` : ''}
              </ds-button>
            </div>`)}
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid var(--color-border-tertiary); margin: 0;" />

      <!-- States -->
      <div>
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--color-foreground-tertiary); margin-bottom: 12px;">
          States
        </div>
        <div style="${COL}">
          ${[
            { lbl: 'default',  inactive: false, loading: false, rounded: false },
            { lbl: 'inactive', inactive: true,  loading: false, rounded: false },
            { lbl: 'loading',  inactive: false, loading: true,  rounded: false },
            { lbl: 'rounded',  inactive: false, loading: false, rounded: true  },
          ].map(({ lbl, inactive, loading, rounded }) => html`
            <div style="${ROW}">
              <span style="${LBL}">${lbl}</span>
              <ds-button variant="primary"   intent="brand" label="Label"
                ?inactive=${inactive} ?loading=${loading} ?rounded=${rounded}></ds-button>
              <ds-button variant="secondary" elevation="flat" label="Label"
                ?inactive=${inactive} ?loading=${loading} ?rounded=${rounded}></ds-button>
              <ds-button variant="secondary" label="Label"
                ?inactive=${inactive} ?loading=${loading} ?rounded=${rounded}></ds-button>
            </div>`)}
        </div>
      </div>

    </div>
  `,
};

// ── Background Context ────────────────────────────────────────────────────────

const BG_SURFACES = [
  { bg: 'faint',  intent: 'brand',    contrast: 'faint'  },
  { bg: 'medium', intent: 'brand',    contrast: 'medium' },
  { bg: 'bold',   intent: 'brand',    contrast: 'bold'   },
  { bg: 'strong', intent: 'brand',    contrast: 'strong' },
  { bg: 'faint',  intent: 'neutral',  contrast: 'faint'  },
  { bg: 'bold',   intent: 'neutral',  contrast: 'bold'   },
  { bg: 'bold',   intent: 'negative', contrast: 'bold'   },
  { bg: 'bold',   intent: 'ai',       contrast: 'bold'   },
  { bg: 'bold',   intent: 'positive', contrast: 'bold'   },
  { bg: 'bold',   intent: 'warning',  contrast: 'bold'   },
] as const;

export const BackgroundContext: Story = {
  parameters: { layout: 'padded' },
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px; font-family: var(--typography-font-family, sans-serif);">

      ${BG_SURFACES.map(({ bg, intent, contrast }) => html`
        <ds-surface intent=${intent} contrast=${contrast} radius="md" style="display: block; padding: 20px;">
          <div style="${COL}">
            <span style="font-size: 10px; font-family: monospace; opacity: 0.7; margin-bottom: 4px;">
              background="${bg}" — ${contrast} ${intent}
            </span>
            <div style="${ROW}">
              <span style="${LBL} opacity: 0.7;">primary</span>
              ${(['brand', 'neutral', 'negative', 'positive', 'ai', 'none'] as const).map(i => html`
                <ds-button variant="primary" intent=${i} label=${i} background=${bg}></ds-button>`)}
            </div>
            <div style="${ROW}">
              <span style="${LBL} opacity: 0.7;">p + icon</span>
              ${(['brand', 'neutral', 'negative', 'none'] as const).map(i => html`
                <ds-button variant="primary" intent=${i} label=${i} background=${bg}>${ICON_SM}</ds-button>`)}
            </div>
            <div style="${ROW}">
              <span style="${LBL} opacity: 0.7;">secondary flat</span>
              ${(['brand', 'neutral', 'negative', 'ai'] as const).map(i => html`
                <ds-button variant="secondary" elevation="flat" intent=${i} label=${i} background=${bg}></ds-button>`)}
              <ds-button variant="secondary" elevation="flat" label="icon" background=${bg}>${ICON_SM}</ds-button>
            </div>
            <div style="${ROW}">
              <span style="${LBL} opacity: 0.7;">states</span>
              <ds-button variant="primary"   intent="brand" label="Inactive" inactive background=${bg}></ds-button>
              <ds-button variant="secondary" elevation="flat" label="Inactive" inactive background=${bg}></ds-button>
              <ds-button variant="primary"   intent="brand" label="Loading"  loading  background=${bg}></ds-button>
              <ds-button variant="primary"   intent="brand" label="Rounded"  rounded  background=${bg}></ds-button>
            </div>
          </div>
        </ds-surface>`)}

      <!-- Always-dark surface -->
      <div style="background-color: var(--color-always-dark-background); border-radius: 8px; padding: 20px;">
        <div style="${COL}">
          <span style="font-size: 10px; font-family: monospace; color: rgba(255,255,255,0.5); margin-bottom: 4px;">
            background="always-dark"
          </span>
          <div style="${ROW}">
            <span style="${LBL} color: rgba(255,255,255,0.4);">primary</span>
            ${(['brand', 'neutral', 'negative', 'positive', 'ai', 'none'] as const).map(i => html`
              <ds-button variant="primary" intent=${i} label=${i} background="always-dark"></ds-button>`)}
          </div>
          <div style="${ROW}">
            <span style="${LBL} color: rgba(255,255,255,0.4);">secondary flat</span>
            ${(['brand', 'neutral', 'negative', 'ai'] as const).map(i => html`
              <ds-button variant="secondary" elevation="flat" intent=${i} label=${i} background="always-dark"></ds-button>`)}
          </div>
          <div style="${ROW}">
            <span style="${LBL} color: rgba(255,255,255,0.4);">states</span>
            <ds-button variant="primary"   intent="brand" label="Inactive" inactive background="always-dark"></ds-button>
            <ds-button variant="primary"   intent="brand" label="Loading"  loading  background="always-dark"></ds-button>
            <ds-button variant="primary"   intent="brand" label="Rounded"  rounded  background="always-dark"></ds-button>
          </div>
        </div>
      </div>
    </div>
  `,
};
