import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import * as SvgIcons from '@ds-mo/icons/svg';
import * as SvgFlags from '@ds-mo/icons/svg/flags';
import '../../../../dist/components/ds-icon.js';

type SvgRecord = Record<string, string>;

const ALL_ICONS: string[] = Object.keys(SvgIcons as SvgRecord).sort();
const ALL_FLAGS: string[] = Object.keys(SvgFlags as SvgRecord).sort();

const PAGE = 'font-family: var(--typography-font-family); padding: var(--dimension-space-300); background: var(--color-background-primary); color: var(--color-foreground-primary); min-height: 100vh; box-sizing: border-box;';
const GRID = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: var(--dimension-space-050);';
const CELL = 'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--dimension-space-100); padding: var(--dimension-space-150) var(--dimension-space-100); border-radius: var(--dimension-radius-100); text-align: center;';
const NAME = 'font-size: var(--typography-fontsize-xs); line-height: var(--typography-lineheight-xs); color: var(--color-foreground-secondary); word-break: break-word; max-width: 100%;';

function gallery(names: string[]): TemplateResult {
  return html`
    <div style="${PAGE}">
      <div style="${GRID}">
        ${names.map(name => html`
          <div style="${CELL}">
            <ds-icon name=${name} size="md"></ds-icon>
            <span style="${NAME}">${name}</span>
          </div>`)}
      </div>
    </div>`;
}

// ── Story exports ──────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Foundation/Iconography',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const System: Story = {
  name: 'System',
  render: () => gallery(ALL_ICONS),
};

export const Flag: Story = {
  name: 'Flag',
  render: () => gallery(ALL_FLAGS),
};
