import type { Meta, StoryObj } from '@storybook/web-components';
import { html, TemplateResult } from 'lit';

const meta: Meta = {
  title: 'Foundation/Colors Data',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const PAGE = 'font-family: var(--typography-font-family); padding: var(--dimension-space-300); display: flex; flex-direction: column; gap: calc(var(--dimension-space-100) * 5); background: var(--color-background-primary); color: var(--color-foreground-primary); min-height: 100vh; box-sizing: border-box;';
const SECTION = 'display: flex; flex-direction: column; gap: var(--dimension-space-150);';
const H2 = 'font-size: var(--typography-fontsize-lg); font-weight: var(--typography-weight-semibold); color: var(--color-foreground-primary); margin: 0; letter-spacing: var(--typography-letterspacing-negative-half);';
const SUB = 'font-size: var(--typography-fontsize-sm); font-weight: var(--typography-weight-medium); color: var(--color-foreground-secondary); margin: var(--dimension-space-025) 0 0;';
const GRID = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--dimension-space-100);';
const SWATCH = 'display: flex; flex-direction: column; gap: var(--dimension-space-050);';
const COLOR = 'width: 100%; height: calc(var(--dimension-size-base) * 6); border-radius: var(--dimension-radius-075); border: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);';
const LABEL = 'font-size: var(--typography-fontsize-xs); line-height: var(--typography-lineheight-xs); color: var(--color-foreground-secondary); word-break: break-all;';

function swatch(token: string, label?: string): TemplateResult {
  return html`
    <div style="${SWATCH}">
      <div style="${COLOR} background-color: var(--${token});" title="--${token}"></div>
      <span style="${LABEL}">${label ?? token.replace('color-data-', '')}</span>
    </div>`;
}

function section(
  title: string,
  subtitle: string | undefined,
  children: TemplateResult | TemplateResult[],
): TemplateResult {
  return html`
    <div style="${SECTION}">
      <div>
        <h2 style="${H2}">${title}</h2>
        ${subtitle ? html`<p style="${SUB}">${subtitle}</p>` : ''}
      </div>
      ${children}
    </div>`;
}

function CategoryColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Category (12)', 'Categorical palette for charts and graphs', html`
        <div style="${GRID} grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));">
          ${Array.from({ length: 12 }, (_, i) => i + 1).map(n =>
            swatch(`color-data-category-${n}`, `${n}`))}
        </div>`)}
    </div>`;
}

function SequentialColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Sequential Blue', '2, 3, and 4-step blue sequences', html`
        ${[2, 3, 4].map(steps => html`
          <div style="margin-bottom: 12px;">
            <p style="${SUB} margin-bottom: 6px;">${steps}-step</p>
            <div style="display: flex; gap: 8px;">
              ${Array.from({ length: steps }, (_, i) => i + 1).map(n => html`
                <div style="flex: 1;">${swatch(`color-data-sequence-blue-${steps}-${n}`, `${n}`)}</div>`)}
            </div>
          </div>`)}
      `)}
    </div>`;
}

function DivergingColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Diverging Blue-Orange', '5, 7, and 9-step diverging palettes', html`
        ${[5, 7, 9].map(steps => html`
          <div style="margin-bottom: 12px;">
            <p style="${SUB} margin-bottom: 6px;">${steps}-step</p>
            <div style="display: flex; gap: 4px;">
              ${Array.from({ length: steps }, (_, i) => i + 1).map(n => html`
                <div style="flex: 1;">${swatch(`color-data-diverging-blue-orange-${steps}-${n}`, `${n}`)}</div>`)}
            </div>
          </div>`)}
      `)}
    </div>`;
}

function WinLossColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Win/Loss', undefined, html`
        <div style="display: flex; gap: 8px; max-width: 400px;">
          <div style="flex: 1;">${swatch('color-data-win-loss-win', 'win')}</div>
          <div style="flex: 1;">${swatch('color-data-win-loss-win-alt', 'win-alt')}</div>
          <div style="flex: 1;">${swatch('color-data-win-loss-loss', 'loss')}</div>
        </div>`)}
    </div>`;
}

function MiscColors(): TemplateResult {
  const steps = ['strong', 'bold', 'medium', 'faint'] as const;
  return html`
    <div style="${PAGE}">
      ${section('Misc', 'Semantic intensity steps (strong → faint)', html`
        <div style="display: flex; gap: 8px; max-width: 400px;">
          ${steps.map(step => html`
            <div style="flex: 1;">${swatch(`color-data-misc-${step}`, step)}</div>`)}
        </div>`)}
    </div>`;
}

function IntentColors(): TemplateResult {
  const intents = ['neutral', 'brand', 'negative', 'warning', 'caution', 'positive'] as const;
  return html`
    <div style="${PAGE}">
      ${section('Intent', 'Semantic intent colors for data visualization', html`
        <div style="${GRID}">
          ${intents.map(intent => swatch(`color-data-intent-${intent}`, intent))}
        </div>`)}
    </div>`;
}

function StatusDeviceColors(): TemplateResult {
  const statuses = [
    'normal',
    'powered-off',
    'other-issue',
    'install-issue',
    'return-device',
    'signal-issue',
  ] as const;
  return html`
    <div style="${PAGE}">
      ${section('Status Device', 'Device status colors for fleet / hardware charts', html`
        <div style="${GRID}">
          ${statuses.map(status => swatch(`color-data-status-device-${status}`, status))}
        </div>`)}
    </div>`;
}

function ScoreSafetyColors(): TemplateResult {
  const scores = ['excellent', 'good', 'fair'] as const;
  return html`
    <div style="${PAGE}">
      ${section('Score Safety', 'Safety score bands', html`
        <div style="display: flex; gap: 8px; max-width: 400px;">
          ${scores.map(score => html`
            <div style="flex: 1;">${swatch(`color-data-score-safety-${score}`, score)}</div>`)}
        </div>`)}
    </div>`;
}

export const Category: Story = { name: 'Category', render: () => CategoryColors() };
export const Sequential: Story = { name: 'Sequential', render: () => SequentialColors() };
export const Diverging: Story = { name: 'Diverging', render: () => DivergingColors() };
export const WinLoss: Story = { name: 'Win/Loss', render: () => WinLossColors() };
export const Misc: Story = { name: 'Misc', render: () => MiscColors() };
export const Intent: Story = { name: 'Intent', render: () => IntentColors() };
export const StatusDevice: Story = { name: 'Status Device', render: () => StatusDeviceColors() };
export const ScoreSafety: Story = { name: 'Score Safety', render: () => ScoreSafetyColors() };
