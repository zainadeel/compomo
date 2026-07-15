import type { Meta, StoryObj } from '@storybook/web-components';
import { html, TemplateResult } from 'lit';

const meta: Meta = {
  title: 'Foundation/Colors Semantic',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

// ── Design tokens ─────────────────────────────────────────────────────────────

const INTENTS   = ['brand', 'neutral', 'positive', 'negative', 'warning', 'caution', 'ai', 'guide', 'walkthrough'] as const;
const CONTRASTS = ['faint', 'medium', 'bold', 'strong'] as const;
const STATES    = ['hover', 'pressed', 'focus', 'active'] as const;

// ── Shared styles (CSS strings) ───────────────────────────────────────────────

const PAGE    = 'font-family: var(--typography-font-family); padding: var(--dimension-space-300); display: flex; flex-direction: column; gap: calc(var(--dimension-space-100) * 5); background: var(--color-background-primary); color: var(--color-foreground-primary); min-height: 100vh; box-sizing: border-box;';
const SECTION = 'display: flex; flex-direction: column; gap: var(--dimension-space-150);';
const H2      = 'font-size: var(--typography-fontsize-lg); font-weight: var(--typography-weight-semibold); color: var(--color-foreground-primary); margin: 0; letter-spacing: var(--typography-letterspacing-negative-half);';
const SUB     = 'font-size: var(--typography-fontsize-sm); font-weight: var(--typography-weight-medium); color: var(--color-foreground-secondary); margin: var(--dimension-space-025) 0 0;';
const GRID    = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--dimension-space-100);';
const SWATCH  = 'display: flex; flex-direction: column; gap: var(--dimension-space-050);';
const COLOR   = 'width: 100%; height: calc(var(--dimension-size-base) * 6); border-radius: var(--dimension-radius-075); border: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);';
const LABEL   = 'font-size: var(--typography-fontsize-xs); line-height: var(--typography-lineheight-xs); color: var(--color-foreground-secondary); word-break: break-all;';

// ── Helper components ─────────────────────────────────────────────────────────

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function swatch(token: string, label?: string, extra?: string): TemplateResult {
  return html`
    <div style="${SWATCH}">
      <div style="${COLOR} background-color: var(--${token}); ${extra ?? ''}" title="--${token}"></div>
      <span style="${LABEL}">${label ?? token.replace('color-', '')}</span>
    </div>`;
}

function swatchText(token: string, label: string, bg: string, extraBox?: string): TemplateResult {
  return html`
    <div style="${SWATCH}">
      <div style="${COLOR} display: flex; align-items: center; justify-content: center; background-color: ${bg}; ${extraBox ?? ''}">
        <span style="color: var(--${token}); font-weight: 600; font-size: 16px;">Aa</span>
      </div>
      <span style="${LABEL}">${label}</span>
    </div>`;
}

function swatchBorder(token: string, label: string, bg = 'var(--color-background-primary)'): TemplateResult {
  return html`
    <div style="${SWATCH}">
      <div style="${COLOR} background-color: ${bg}; border: 3px solid var(--${token});"></div>
      <span style="${LABEL}">${label}</span>
    </div>`;
}

function section(title: string, subtitle: string | undefined, children: TemplateResult | TemplateResult[]): TemplateResult {
  return html`
    <div style="${SECTION}">
      <div>
        <h2 style="${H2}">${title}</h2>
        ${subtitle ? html`<p style="${SUB}">${subtitle}</p>` : ''}
      </div>
      ${children}
    </div>`;
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

function BackgroundColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Background — Surface', 'Primary, secondary, shade, translucent', html`
        <div style="${GRID}">
          ${swatch('color-background-primary')}
          ${swatch('color-background-secondary')}
          ${swatch('color-background-shade')}
          ${swatch('color-translucent-translucent', 'translucent-translucent', 'backdrop-filter: blur(16px);')}
          ${swatch('color-background-transparent', undefined, 'background: repeating-conic-gradient(var(--color-border-tertiary) 0% 25%, var(--color-background-primary) 0% 50%) 0 0 / 12px 12px;')}
        </div>`)}

      ${CONTRASTS.map(contrast => section(
        `Background — ${cap(contrast)}`, undefined, html`
        <div style="${GRID}">
          ${INTENTS.map(intent => swatch(`color-background-${contrast}-${intent}`, intent))}
        </div>`))}
    </div>`;
}

// ── Foregrounds ───────────────────────────────────────────────────────────────

function ForegroundColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Foreground — Base', 'Neutral hierarchy', html`
        <div style="${GRID}">
          ${(['primary', 'secondary', 'tertiary', 'quaternary'] as const).map(level =>
            swatchText(`color-foreground-${level}`, `foreground-${level}`, 'var(--color-background-primary)'))}
        </div>`)}

      ${CONTRASTS.map(contrast => section(`Foreground — ${cap(contrast)}`, undefined, html`
        <div style="${GRID}">
          ${INTENTS.map(intent => {
            const bg = contrast === 'faint'  ? 'var(--color-background-primary)'
                     : contrast === 'medium' ? `var(--color-background-strong-${intent})`
                     : contrast === 'bold'   ? `var(--color-background-faint-${intent})`
                     :                         `var(--color-background-medium-${intent})`;
            return swatchText(`color-foreground-${contrast}-${intent}`, intent, bg);
          })}
        </div>`))}

      ${section('Foreground — On Background', 'Tokens for text on colored surfaces', html`
        ${(['on-bold-background', 'on-strong-background', 'on-medium-background', 'on-translucent-background'] as const).map(ctx => {
          const bg = ctx === 'on-bold-background'        ? 'var(--color-background-bold-brand)'
                   : ctx === 'on-strong-background'      ? 'var(--color-background-strong-brand)'
                   : ctx === 'on-medium-background'      ? 'var(--color-background-medium-brand)'
                   :                                        'var(--color-translucent-translucent)';
          return html`
            <div style="margin-bottom: 16px;">
              <p style="${SUB} margin-bottom: 8px;">${ctx}</p>
              <div style="${GRID}">
                ${(['primary', 'secondary', 'tertiary', 'quaternary'] as const).map(level =>
                  swatchText(`color-foreground-${ctx}-${level}`, level, bg))}
              </div>
            </div>`;
        })}
      `)}
    </div>`;
}

// ── Borders ───────────────────────────────────────────────────────────────────

function BorderColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Border — Base', 'Neutral hierarchy', html`
        <div style="${GRID}">
          ${(['primary', 'secondary', 'tertiary'] as const).map(level =>
            swatchBorder(`color-border-${level}`, `border-${level}`))}
        </div>`)}

      ${CONTRASTS.map(contrast => section(`Border — ${cap(contrast)}`, undefined, html`
        <div style="${GRID}">
          ${INTENTS.map(intent => swatchBorder(`color-border-${contrast}-${intent}`, intent))}
        </div>`))}

      ${section('Border — On Background', 'Context-aware border hierarchy', html`
        ${(['on-bold-background', 'on-strong-background', 'on-medium-background', 'on-translucent-background'] as const).map(ctx => {
          const bg = ctx === 'on-bold-background'   ? 'var(--color-background-bold-neutral)'
                   : ctx === 'on-strong-background' ? 'var(--color-background-strong-neutral)'
                   : ctx === 'on-medium-background' ? 'var(--color-background-medium-neutral)'
                   :                                   'var(--color-translucent-translucent)';
          return html`
            <div style="margin-bottom: 16px;">
              <p style="${SUB} margin-bottom: 8px;">${ctx}</p>
              <div style="${GRID}">
                ${(['primary', 'secondary', 'tertiary'] as const).map(level =>
                  swatchBorder(`color-border-${ctx}-${level}`, level, bg))}
              </div>
            </div>`;
        })}`)}

      ${section('Divider', '--color-divider-*', html`
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <p style="${SUB} margin-bottom: 8px;">Default</p>
            <div style="background-color: var(--color-background-primary); border-radius: 8px; padding: 16px;">
              <div style="height: 1px; background-color: var(--color-divider-divider);"></div>
              <span style="${LABEL} margin-top: 4px; display: block;">color-divider-divider</span>
            </div>
          </div>
          ${(['on-bold-background', 'on-strong-background', 'on-medium-background', 'on-translucent-background'] as const).map(ctx => {
            const bg = ctx === 'on-bold-background'   ? 'var(--color-background-bold-neutral)'
                     : ctx === 'on-strong-background' ? 'var(--color-background-strong-neutral)'
                     : ctx === 'on-medium-background' ? 'var(--color-background-medium-neutral)'
                     :                                   'var(--color-translucent-translucent)';
            const labelColor = ctx.includes('bold') || ctx.includes('strong')
              ? 'var(--color-foreground-on-strong-background-secondary)' : 'var(--color-foreground-secondary)';
            return html`
              <div>
                <p style="${SUB} margin-bottom: 8px;">${ctx}</p>
                <div style="background-color: ${bg}; border-radius: 8px; padding: 16px;">
                  <div style="height: 1px; background-color: var(--color-divider-${ctx});"></div>
                  <span style="${LABEL} color: ${labelColor}; margin-top: 4px; display: block;">color-divider-${ctx}</span>
                </div>
              </div>`;
          })}
        </div>`)}
    </div>`;
}

// ── Interactions ──────────────────────────────────────────────────────────────

function InteractionColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Interaction — Default', 'Hover, pressed, focus, active on standard surfaces', html`
        <div style="${GRID}">
          ${STATES.map(state =>
            swatch(`color-interaction-${state}`, state))}
        </div>`)}

      ${(['on-bold-background', 'on-strong-background', 'on-medium-background', 'on-translucent-background'] as const).map(ctx => {
        const bg = ctx === 'on-bold-background'   ? 'var(--color-background-bold-brand)'
                 : ctx === 'on-strong-background' ? 'var(--color-background-strong-brand)'
                 : ctx === 'on-medium-background' ? 'var(--color-background-medium-brand)'
                 :                                   'var(--color-translucent-translucent)';
        return section(`Interaction — ${ctx}`, undefined, html`
          <div style="${GRID}">
            ${STATES.map(state => html`
              <div style="${SWATCH}">
                <div style="${COLOR} position: relative; background-color: ${bg}; overflow: hidden;">
                  <div style="position: absolute; inset: 0; background-color: var(--color-interaction-${ctx}-${state});"></div>
                </div>
                <span style="${LABEL}">${state}</span>
              </div>`)}
          </div>`);
      })}
    </div>`;
}

// ── Always Dark ───────────────────────────────────────────────────────────────

function AlwaysDarkColors(): TemplateResult {
  const darkLabel = 'font-size: 13px; font-weight: 500; color: var(--color-always-dark-foreground-secondary); margin: 0 0 8px;';
  const tinyLabel = `${LABEL} color: var(--color-always-dark-foreground-tertiary);`;

  return html`
    <div style="${PAGE}">
      ${section('Always Dark', 'Tokens that stay dark regardless of theme', html`
        <div style="background-color: var(--color-always-dark-background); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 24px;">

          <div>
            <p style="${darkLabel}">Background</p>
            <div style="${GRID}">
              <div style="${SWATCH}">
                <div style="${COLOR} background-color: var(--color-always-dark-background); border: 1px solid var(--color-always-dark-border-tertiary);"></div>
                <span style="${tinyLabel}">always-dark-background</span>
              </div>
            </div>
          </div>

          <div>
            <p style="${darkLabel}">Foreground — Hierarchy</p>
            <div style="${GRID}">
              ${(['primary', 'secondary', 'tertiary', 'quaternary'] as const).map(level => html`
                <div style="${SWATCH}">
                  <div style="${COLOR} display: flex; align-items: center; justify-content: center; border: none;">
                    <span style="color: var(--color-always-dark-foreground-${level}); font-weight: 600; font-size: 16px;">Aa</span>
                  </div>
                  <span style="${tinyLabel}">${level}</span>
                </div>`)}
            </div>
          </div>

          <div>
            <p style="${darkLabel}">Foreground — Intent</p>
            <div style="${GRID}">
              ${INTENTS.map(intent => html`
                <div style="${SWATCH}">
                  <div style="${COLOR} display: flex; align-items: center; justify-content: center; border: none;">
                    <span style="color: var(--color-always-dark-foreground-${intent}); font-weight: 600; font-size: 16px;">Aa</span>
                  </div>
                  <span style="${tinyLabel}">${intent}</span>
                </div>`)}
            </div>
          </div>

          <div>
            <p style="${darkLabel}">Border — Hierarchy</p>
            <div style="${GRID}">
              ${(['primary', 'secondary', 'tertiary'] as const).map(level => html`
                <div style="${SWATCH}">
                  <div style="${COLOR} border: 3px solid var(--color-always-dark-border-${level});"></div>
                  <span style="${tinyLabel}">${level}</span>
                </div>`)}
            </div>
          </div>

          ${CONTRASTS.map(contrast => html`
            <div>
              <p style="${darkLabel}">Border — ${cap(contrast)}</p>
              <div style="${GRID}">
                ${INTENTS.map(intent => html`
                  <div style="${SWATCH}">
                    <div style="${COLOR} border: 3px solid var(--color-always-dark-border-${contrast}-${intent});"></div>
                    <span style="${tinyLabel}">${intent}</span>
                  </div>`)}
              </div>
            </div>`)}

          <div>
            <p style="${darkLabel}">Divider</p>
            <div style="height: 1px; background-color: var(--color-always-dark-divider); margin: 4px 0;"></div>
            <span style="${tinyLabel}">always-dark-divider</span>
          </div>

          <div>
            <p style="${darkLabel}">Interaction</p>
            <div style="${GRID}">
              ${STATES.map(state => html`
                <div style="${SWATCH}">
                  <div style="${COLOR} position: relative; overflow: hidden; border: none;">
                    <div style="position: absolute; inset: 0; background-color: var(--color-always-dark-interaction-${state});"></div>
                  </div>
                  <span style="${tinyLabel}">${state}</span>
                </div>`)}
            </div>
          </div>

        </div>`)}
    </div>`;
}

// ── Inverted ──────────────────────────────────────────────────────────────────

function InvertedColors(): TemplateResult {
  const invLabel  = 'font-size: 13px; font-weight: 500; color: var(--color-inverted-foreground-secondary); margin: 0 0 8px;';
  const tinyLabel = `${LABEL} color: var(--color-inverted-foreground-tertiary);`;

  return html`
    <div style="${PAGE}">
      ${section('Inverted', 'Tokens for inverted / dark-surface contexts', html`
        <div style="background-color: var(--color-inverted-background); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 24px;">

          <div>
            <p style="${invLabel}">Background</p>
            <div style="${GRID}">
              <div style="${SWATCH}">
                <div style="${COLOR} background-color: var(--color-inverted-background); border: 1px solid var(--color-inverted-border-tertiary);"></div>
                <span style="${tinyLabel}">inverted-background</span>
              </div>
            </div>
          </div>

          <div>
            <p style="${invLabel}">Foreground — Hierarchy</p>
            <div style="${GRID}">
              ${(['primary', 'secondary', 'tertiary', 'quaternary'] as const).map(level => html`
                <div style="${SWATCH}">
                  <div style="${COLOR} display: flex; align-items: center; justify-content: center; border: none;">
                    <span style="color: var(--color-inverted-foreground-${level}); font-weight: 600; font-size: 16px;">Aa</span>
                  </div>
                  <span style="${tinyLabel}">${level}</span>
                </div>`)}
            </div>
          </div>

          <div>
            <p style="${invLabel}">Foreground — Intent</p>
            <div style="${GRID}">
              ${INTENTS.map(intent => html`
                <div style="${SWATCH}">
                  <div style="${COLOR} display: flex; align-items: center; justify-content: center; border: none;">
                    <span style="color: var(--color-inverted-foreground-${intent}); font-weight: 600; font-size: 16px;">Aa</span>
                  </div>
                  <span style="${tinyLabel}">${intent}</span>
                </div>`)}
            </div>
          </div>

          <div>
            <p style="${invLabel}">Border — Hierarchy</p>
            <div style="${GRID}">
              ${(['primary', 'secondary', 'tertiary'] as const).map(level => html`
                <div style="${SWATCH}">
                  <div style="${COLOR} border: 3px solid var(--color-inverted-border-${level});"></div>
                  <span style="${tinyLabel}">${level}</span>
                </div>`)}
            </div>
          </div>

          ${CONTRASTS.map(contrast => html`
            <div>
              <p style="${invLabel}">Border — ${cap(contrast)}</p>
              <div style="${GRID}">
                ${INTENTS.map(intent => html`
                  <div style="${SWATCH}">
                    <div style="${COLOR} border: 3px solid var(--color-inverted-border-${contrast}-${intent});"></div>
                    <span style="${tinyLabel}">${intent}</span>
                  </div>`)}
              </div>
            </div>`)}

          <div>
            <p style="${invLabel}">Divider</p>
            <div style="height: 1px; background-color: var(--color-inverted-divider); margin: 4px 0;"></div>
            <span style="${tinyLabel}">inverted-divider</span>
          </div>

          <div>
            <p style="${invLabel}">Interaction</p>
            <div style="${GRID}">
              ${STATES.map(state => html`
                <div style="${SWATCH}">
                  <div style="${COLOR} position: relative; overflow: hidden; border: none;">
                    <div style="position: absolute; inset: 0; background-color: var(--color-inverted-interaction-${state});"></div>
                  </div>
                  <span style="${tinyLabel}">${state}</span>
                </div>`)}
            </div>
          </div>

        </div>`)}
    </div>`;
}

// ── Color Intent ──────────────────────────────────────────────────────────────

function ColorIntentColors(): TemplateResult {
  const hues = [
    'blue', 'cyan', 'green', 'grey', 'magenta', 'olive',
    'orange', 'pink', 'purple', 'red', 'teal', 'yellow',
  ] as const;

  const intentInteractionCtx = [
    'on-faint-background', 'on-medium-background', 'on-strong-background', 'on-bold-background',
  ] as const;

  return html`
    <div style="${PAGE}">
      ${section('Color Intent', 'Hue-first palette: color-color-intent-{hue}-{contrast}-{role}', html`
        <p style="${SUB}">Each row shows faint → medium → bold → strong. Three chips per cell: background · border · foreground.</p>`)}

      ${hues.map(hue => html`
        <div style="${SECTION}">
          <h2 style="${H2}">${cap(hue)}</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            ${CONTRASTS.map(contrast => html`
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="${LABEL} font-weight: 600;">${contrast}</span>
                <div style="height: 40px; border-radius: 6px; background-color: var(--color-color-intent-${hue}-${contrast}-background); border: 1px solid var(--color-border-tertiary);" title="--color-color-intent-${hue}-${contrast}-background"></div>
                <div style="height: 40px; border-radius: 6px; background-color: var(--color-background-primary); border: 3px solid var(--color-color-intent-${hue}-${contrast}-border);" title="--color-color-intent-${hue}-${contrast}-border"></div>
                <div style="height: 40px; border-radius: 6px; background-color: var(--color-color-intent-${hue}-${contrast}-background); display: flex; align-items: center; justify-content: center; border: none;">
                  <span style="color: var(--color-color-intent-${hue}-${contrast}-foreground); font-weight: 700; font-size: 14px;" title="--color-color-intent-${hue}-${contrast}-foreground">Aa</span>
                </div>
                <span style="${LABEL}">bg · border · fg</span>
              </div>`)}
          </div>
        </div>`)}

      ${section('Color Intent — Interactions', 'Overlay states for each background context', html`
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          ${intentInteractionCtx.map(ctx => html`
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <span style="${LABEL} font-weight: 600;">${ctx}</span>
              ${(['hover', 'pressed', 'focus'] as const).map(state => html`
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <div style="height: 32px; border-radius: 6px; background-color: var(--color-color-intent-interaction-${ctx}-${state}); border: 1px solid var(--color-border-tertiary);"></div>
                  <span style="${LABEL}">${state}</span>
                </div>`)}
            </div>`)}
        </div>`)}
    </div>`;
}

// ── Domain (Fleet) ────────────────────────────────────────────────────────────

const driverStatuses    = ['driving', 'on-duty', 'off-duty', 'personal-conveyance', 'yard-move'] as const;
const entityStatuses    = ['in-motion', 'idling', 'stationary', 'stale', 'immobilized'] as const;
const locationIntents   = ['brand', 'neutral', 'positive', 'negative', 'warning', 'caution'] as const;
const safetyGrades      = ['excellent', 'good', 'fair'] as const;
const markerInteraction = ['hover', 'pressed', 'focus'] as const;

function DriverStatusColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Driver Status', 'HOS duty-cycle backgrounds and foreground', html`
        <div style="${GRID}">
          ${driverStatuses.map(status => swatch(`color-driver-status-background-${status}`, status))}
          <div style="${SWATCH}">
            <div style="${COLOR} display: flex; align-items: center; justify-content: center; background-color: var(--color-driver-status-background-driving);">
              <span style="color: var(--color-driver-status-foreground); font-weight: 600; font-size: 14px;">Aa</span>
            </div>
            <span style="${LABEL}">foreground</span>
          </div>
        </div>
        <div style="${GRID} margin-top: 4px;">
          ${markerInteraction.map(state => html`
            <div style="${SWATCH}">
              <div style="${COLOR} position: relative; background-color: var(--color-driver-status-background-driving); overflow: hidden;">
                <div style="position: absolute; inset: 0; background-color: var(--color-driver-status-interaction-${state});"></div>
              </div>
              <span style="${LABEL}">interaction-${state}</span>
            </div>`)}
        </div>`)}
    </div>`;
}

function EntityMarkerColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Entity Markers', 'Map vehicle/asset markers by motion state', html`
        <div style="${GRID}">
          ${entityStatuses.map(status => swatch(`color-entity-marker-background-${status}`, status))}
          <div style="${SWATCH}">
            <div style="${COLOR} display: flex; align-items: center; justify-content: center; background-color: var(--color-entity-marker-background-in-motion);">
              <span style="color: var(--color-entity-marker-foreground); font-weight: 600; font-size: 14px;">Aa</span>
            </div>
            <span style="${LABEL}">foreground</span>
          </div>
        </div>
        <div style="${GRID} margin-top: 4px;">
          ${markerInteraction.map(state => html`
            <div style="${SWATCH}">
              <div style="${COLOR} position: relative; background-color: var(--color-entity-marker-background-in-motion); overflow: hidden;">
                <div style="position: absolute; inset: 0; background-color: var(--color-entity-marker-interaction-${state});"></div>
              </div>
              <span style="${LABEL}">interaction-${state}</span>
            </div>`)}
        </div>`)}
    </div>`;
}

function EntityClusterMarkerColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Entity Cluster Marker', 'Grouped asset cluster pin', html`
        <div style="${GRID}">
          ${swatch('color-entity-cluster-marker-background', 'background')}
          <div style="${SWATCH}">
            <div style="${COLOR} display: flex; align-items: center; justify-content: center; background-color: var(--color-entity-cluster-marker-background);">
              <span style="color: var(--color-entity-cluster-marker-foreground); font-weight: 600; font-size: 14px;">Aa</span>
            </div>
            <span style="${LABEL}">foreground</span>
          </div>
          ${markerInteraction.map(state => html`
            <div style="${SWATCH}">
              <div style="${COLOR} position: relative; background-color: var(--color-entity-cluster-marker-background); overflow: hidden;">
                <div style="position: absolute; inset: 0; background-color: var(--color-entity-cluster-marker-interaction-${state});"></div>
              </div>
              <span style="${LABEL}">interaction-${state}</span>
            </div>`)}
        </div>`)}
    </div>`;
}

function LocationMarkerColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Location Markers', 'Map location pins by intent', html`
        <div style="${GRID}">
          ${locationIntents.map(intent => swatch(`color-location-marker-background-${intent}`, intent))}
          <div style="${SWATCH}">
            <div style="${COLOR} display: flex; align-items: center; justify-content: center; background-color: var(--color-location-marker-background-brand);">
              <span style="color: var(--color-location-marker-foreground); font-weight: 600; font-size: 14px;">Aa</span>
            </div>
            <span style="${LABEL}">foreground</span>
          </div>
        </div>
        <div style="${GRID} margin-top: 4px;">
          ${markerInteraction.map(state => html`
            <div style="${SWATCH}">
              <div style="${COLOR} position: relative; background-color: var(--color-location-marker-background-brand); overflow: hidden;">
                <div style="position: absolute; inset: 0; background-color: var(--color-location-marker-interaction-${state});"></div>
              </div>
              <span style="${LABEL}">interaction-${state}</span>
            </div>`)}
        </div>`)}
    </div>`;
}

function SafetyScoreColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Safety Score', 'Driver safety grade surfaces', html`
        <div style="${GRID}">
          ${safetyGrades.map(grade => swatch(`color-safety-score-background-${grade}`, grade))}
        </div>
        <div style="${GRID}">
          ${safetyGrades.map(grade => html`
            <div style="${SWATCH}">
              <div style="${COLOR} display: flex; align-items: center; justify-content: center; background-color: var(--color-safety-score-background-${grade});">
                <span style="color: var(--color-safety-score-foreground-on-${grade}); font-weight: 600; font-size: 14px;">Aa</span>
              </div>
              <span style="${LABEL}">foreground-on-${grade}</span>
            </div>`)}
        </div>
        <div style="${GRID}">
          ${markerInteraction.map(state => html`
            <div style="${SWATCH}">
              <div style="${COLOR} position: relative; background-color: var(--color-safety-score-background-excellent); overflow: hidden;">
                <div style="position: absolute; inset: 0; background-color: var(--color-safety-score-interaction-${state});"></div>
              </div>
              <span style="${LABEL}">interaction-${state}</span>
            </div>`)}
        </div>`)}
    </div>`;
}

// ── Surfaces ──────────────────────────────────────────────────────────────────

function surfaceBlock(
  prefix: string,
  label: string,
  extraFg?: string,
): TemplateResult {
  const fgLevels = ['primary', 'secondary', 'tertiary', 'quaternary'] as const;
  const borderLevels = ['primary', 'secondary', 'tertiary'] as const;
  const bg = `var(--${prefix}-background)`;
  const subStyle = `font-size: 13px; font-weight: 500; color: var(--${prefix}-foreground-secondary); margin: 0 0 6px;`;
  const tinyLabel = `${LABEL} color: var(--${prefix}-foreground-tertiary);`;

  return html`
    <div style="background-color: ${bg}; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 20px;">
      <h2 style="${H2} color: var(--${prefix}-foreground-primary);">${label}</h2>

      <div>
        <p style="${subStyle}">Foreground</p>
        <div style="${GRID}">
          ${fgLevels.map(level => html`
            <div style="${SWATCH}">
              <div style="${COLOR} display: flex; align-items: center; justify-content: center; background-color: ${bg}; border: none;">
                <span style="color: var(--${prefix}-foreground-${level}); font-weight: 600; font-size: 16px;">Aa</span>
              </div>
              <span style="${tinyLabel}">${level}</span>
            </div>`)}
          ${extraFg ? html`
            <div style="${SWATCH}">
              <div style="${COLOR} display: flex; align-items: center; justify-content: center; background-color: ${bg}; border: none;">
                <span style="color: var(--${prefix}-foreground-${extraFg}); font-weight: 600; font-size: 16px;">Aa</span>
              </div>
              <span style="${tinyLabel}">${extraFg}</span>
            </div>` : ''}
        </div>
      </div>

      <div>
        <p style="${subStyle}">Border</p>
        <div style="${GRID}">
          ${borderLevels.map(level => html`
            <div style="${SWATCH}">
              <div style="${COLOR} background-color: ${bg}; border: 3px solid var(--${prefix}-border-${level});"></div>
              <span style="${tinyLabel}">${level}</span>
            </div>`)}
        </div>
      </div>

      <div>
        <p style="${subStyle}">Divider</p>
        <div style="height: 1px; background-color: var(--${prefix}-divider); margin: 4px 0;"></div>
        <span style="${tinyLabel}">${prefix}-divider</span>
      </div>

      <div>
        <p style="${subStyle}">Interaction</p>
        <div style="${GRID}">
          ${STATES.map(state => html`
            <div style="${SWATCH}">
              <div style="${COLOR} position: relative; background-color: ${bg}; overflow: hidden; border: none;">
                <div style="position: absolute; inset: 0; background-color: var(--${prefix}-interaction-${state});"></div>
              </div>
              <span style="${tinyLabel}">${state}</span>
            </div>`)}
        </div>
      </div>
    </div>`;
}

function NavigationColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Navigation', 'color-navigation-* — sidebar/topbar surface', html`
        ${surfaceBlock('color-navigation', 'Navigation', 'brand')}`)}
    </div>`;
}

function MediaColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Media', 'color-media-* — media player surface', html`
        ${surfaceBlock('color-media', 'Media')}`)}
    </div>`;
}

// ── Utility ───────────────────────────────────────────────────────────────────

function UtilityColors(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Elevation', 'Shadow and highlight for layered surfaces', html`
        <div style="${GRID}">
          ${swatch('color-elevation-shadow', 'shadow')}
          ${swatch('color-elevation-highlight', 'highlight')}
        </div>`)}

      ${section('Shimmer', 'Surface-aware loading animation colors', html`
        <div style="${GRID}">
          ${swatch('color-shimmer-shimmer', 'default')}
          ${swatch('color-shimmer-shimmer-on-medium-background', 'on-medium-background')}
          ${swatch('color-shimmer-shimmer-on-bold-background', 'on-bold-background')}
          ${swatch('color-shimmer-shimmer-on-strong-background', 'on-strong-background')}
          ${swatch('color-translucent-shimmer', 'on-translucent-background')}
          ${swatch('color-inverted-shimmer', 'inverted')}
          ${swatch('color-media-shimmer', 'media')}
          ${swatch('color-always-dark-shimmer', 'always-dark')}
          ${swatch('color-navigation-shimmer', 'navigation')}
        </div>`)}

      ${section('Settings Profile', 'Avatar / profile-page accent surface', html`
        <div style="${GRID}">
          ${swatch('color-settings-profile-background', 'background')}
          <div style="${SWATCH}">
            <div style="${COLOR} display: flex; align-items: center; justify-content: center; background-color: var(--color-settings-profile-background);">
              <span style="color: var(--color-settings-profile-foreground); font-weight: 600; font-size: 16px;">Aa</span>
            </div>
            <span style="${LABEL}">foreground</span>
          </div>
          <div style="${SWATCH}">
            <div style="${COLOR} background-color: var(--color-settings-profile-background); border: 3px solid var(--color-settings-profile-border);"></div>
            <span style="${LABEL}">border</span>
          </div>
        </div>`)}
    </div>`;
}

// ── Reference Palette ─────────────────────────────────────────────────────────

function ReferenceColors(): TemplateResult {
  const alphaSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

  const greys = [
    'grey-l18', 'grey-l20', 'grey-l27-dark-faint', 'grey-l30-light-strong',
    'grey-l50-dark-medium', 'grey-l51-light-bold', 'grey-l65-dark-bold',
    'grey-l75-light-medium', 'grey-l91-dark-strong', 'grey-l93-light-faint', 'grey-l98',
  ];

  const hues = [
    { name: 'Blue (250)',     light: ['light-blue-250-l92-c04-faint','light-blue-250-l70-c18-medium','light-blue-250-l50-c18-bold','light-blue-250-l33-c09-strong'],    dark: ['dark-blue-250-l27-c05-faint','dark-blue-250-l50-c17-medium','dark-blue-250-l65-c20-bold','dark-blue-250-l91-c05-strong'] },
    { name: 'Purple (290)',   light: ['light-purple-290-l92-c04-faint','light-purple-290-l75-c15-medium','light-purple-290-l52-c20-bold','light-purple-290-l35-c13-strong'], dark: ['dark-purple-290-l28-c05-faint','dark-purple-290-l52-c17-medium','dark-purple-290-l67-c20-bold','dark-purple-290-l92-c05-strong'] },
    { name: 'Magenta (325)',  light: ['light-magenta-325-l94-c05-faint','light-magenta-325-l70-c23-medium','light-magenta-325-l54-c20-bold','light-magenta-325-l30-c13-strong'], dark: ['dark-magenta-325-l28-c05-faint','dark-magenta-325-l51-c17-medium','dark-magenta-325-l67-c20-bold','dark-magenta-325-l90-c08-strong'] },
    { name: 'Pink (0)',       light: ['light-pink-0-l93-c05-faint','light-pink-0-l70-c22-medium','light-pink-0-l53-c20-bold','light-pink-0-l29-c10-strong'],           dark: ['dark-pink-0-l28-c05-faint','dark-pink-0-l52-c17-medium','dark-pink-0-l68-c20-bold','dark-pink-0-l92-c05-strong'] },
    { name: 'Red (30)',       light: ['light-red-30-l93-c04-faint','light-red-30-l70-c20-medium','light-red-30-l53-c20-bold','light-red-30-l30-c11-strong'],            dark: ['dark-red-30-l28-c05-faint','dark-red-30-l51-c17-medium','dark-red-30-l70-c20-bold','dark-red-30-l91-c06-strong'] },
    { name: 'Orange (60)',    light: ['light-orange-60-l93-c05-faint','light-orange-60-l75-c20-medium','light-orange-60-l52-c13-bold','light-orange-60-l35-c09-strong'], dark: ['dark-orange-60-l28-c05-faint','dark-orange-60-l51-c13-medium','dark-orange-60-l75-c20-bold','dark-orange-60-l92-c06-strong'] },
    { name: 'Yellow (85)',    light: ['light-yellow-85-l93-c08-faint','light-yellow-85-l85-c20-medium','light-yellow-85-l51-c12-bold','light-yellow-85-l40-c09-strong'], dark: ['dark-yellow-85-l28-c05-faint','dark-yellow-85-l51-c12-medium','dark-yellow-85-l80-c18-bold','dark-yellow-85-l93-c05-strong'] },
    { name: 'Olive (115)',    light: ['light-olive-115-l93-c05-faint','light-olive-115-l85-c22-medium','light-olive-115-l51-c13-bold','light-olive-115-l35-c09-strong'], dark: ['dark-olive-115-l27-c05-faint','dark-olive-115-l51-c13-medium','dark-olive-115-l75-c19-bold','dark-olive-115-l93-c05-strong'] },
    { name: 'Green (145)',    light: ['light-green-145-l94-c05-faint','light-green-145-l75-c22-medium','light-green-145-l50-c19-bold','light-green-145-l35-c13-strong'], dark: ['dark-green-145-l27-c05-faint','dark-green-145-l50-c17-medium','dark-green-145-l70-c19-bold','dark-green-145-l93-c06-strong'] },
    { name: 'Teal (180)',     light: ['light-teal-180-l94-c05-faint','light-teal-180-l75-c17-medium','light-teal-180-l50-c12-bold','light-teal-180-l35-c09-strong'],   dark: ['dark-teal-180-l27-c05-faint','dark-teal-180-l50-c12-medium','dark-teal-180-l70-c15-bold','dark-teal-180-l93-c08-strong'] },
    { name: 'Cyan (215)',     light: ['light-cyan-215-l94-c04-faint','light-cyan-215-l75-c17-medium','light-cyan-215-l51-c11-bold','light-cyan-215-l30-c07-strong'],   dark: ['dark-cyan-215-l27-c05-faint','dark-cyan-215-l50-c11-medium','dark-cyan-215-l70-c15-bold','dark-cyan-215-l92-c07-strong'] },
  ];

  return html`
    <div style="${PAGE}">
      ${section('Reference — Black', '--color-reference-black-{opacity}', html`
        <div style="display: flex; gap: 2px;">
          ${alphaSteps.map(step => html`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="width: 100%; height: 40px; background-color: var(--color-reference-black-${step}); border-radius: 4px; border: 1px solid var(--color-border-tertiary);"></div>
              <span style="font-size: 9px; color: var(--color-foreground-tertiary);">${step}</span>
            </div>`)}
        </div>`)}

      ${section('Reference — White', '--color-reference-white-{opacity}', html`
        <div style="display: flex; gap: 2px; background-color: var(--color-reference-black-100); border-radius: 8px; padding: 8px;">
          ${alphaSteps.map(step => html`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="width: 100%; height: 40px; background-color: var(--color-reference-white-${step}); border-radius: 4px;"></div>
              <span style="font-size: 9px; color: var(--color-reference-white-55);">${step}</span>
            </div>`)}
        </div>`)}

      ${section('Reference — Grey', '--color-reference-grey-*', html`
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          ${greys.map(g => html`
            <div style="flex: 1 0 70px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="width: 100%; height: 40px; background-color: var(--color-reference-${g}); border-radius: 4px; border: 1px solid var(--color-border-tertiary);"></div>
              <span style="font-size: 8px; color: var(--color-foreground-tertiary); text-align: center; word-break: break-all;">${g}</span>
            </div>`)}
        </div>`)}

      ${hues.map(hue => section(
        `Reference — ${hue.name}`, 'Light (faint → strong) | Dark (faint → strong)',
        html`
          <div style="display: flex; gap: 4px;">
            ${hue.light.map(token => html`
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <div style="width: 100%; height: 40px; background-color: var(--color-reference-${token}); border-radius: 4px; border: 1px solid var(--color-border-tertiary);"></div>
                <span style="font-size: 8px; color: var(--color-foreground-tertiary); text-align: center; word-break: break-all;">${token}</span>
              </div>`)}
            <div style="width: 1px; background-color: var(--color-border-tertiary); margin: 0 4px; flex-shrink: 0;"></div>
            ${hue.dark.map(token => html`
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <div style="width: 100%; height: 40px; background-color: var(--color-reference-${token}); border-radius: 4px; border: 1px solid var(--color-border-tertiary);"></div>
                <span style="font-size: 8px; color: var(--color-foreground-tertiary); text-align: center; word-break: break-all;">${token}</span>
              </div>`)}
          </div>`))}
    </div>`;
}

// ── Story exports ─────────────────────────────────────────────────────────────

export const Backgrounds:  Story = { name: 'Backgrounds',          render: () => BackgroundColors() };
export const Foregrounds:  Story = { name: 'Foregrounds',          render: () => ForegroundColors() };
export const Borders:      Story = { name: 'Borders & Dividers',   render: () => BorderColors() };
export const Interactions: Story = { name: 'Interactions',         render: () => InteractionColors() };
export const AlwaysDark:   Story = { name: 'Always Dark',          render: () => AlwaysDarkColors() };
export const Inverted:     Story = { name: 'Inverted',             render: () => InvertedColors() };
export const ColorIntent:  Story = { name: 'Color Intent',         render: () => ColorIntentColors() };
export const DriverStatus: Story = { name: 'Driver Status',        render: () => DriverStatusColors() };
export const EntityMarker: Story = { name: 'Entity Markers',       render: () => EntityMarkerColors() };
export const EntityClusterMarker: Story = {
  name: 'Entity Cluster Marker',
  render: () => EntityClusterMarkerColors(),
};
export const LocationMarker: Story = { name: 'Location Markers',    render: () => LocationMarkerColors() };
export const SafetyScore:  Story = { name: 'Safety Score',         render: () => SafetyScoreColors() };
export const Navigation:   Story = { name: 'Navigation',           render: () => NavigationColors() };
export const Media:        Story = { name: 'Media',                render: () => MediaColors() };
export const Utility:      Story = { name: 'Utility',              render: () => UtilityColors() };
export const References:   Story = { name: 'References',           render: () => ReferenceColors() };
