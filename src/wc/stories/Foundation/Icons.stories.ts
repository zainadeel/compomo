import type { Meta, StoryObj } from '@storybook/web-components';
import { html, css, LitElement } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import * as SvgIcons from '@ds-mo/icons/svg';
import * as SvgFlags from '@ds-mo/icons/svg/flags';

type SvgRecord = Record<string, string>;

const ALL_ICONS: [string, string][] = Object.entries(SvgIcons as SvgRecord);
const ALL_FLAGS: [string, string][] = Object.entries(SvgFlags as SvgRecord);

class IconGallery extends LitElement {
  static properties = {
    search:   { type: String },
    iconSize: { type: Number },
    copied:   { type: String },
    dataset:  { type: String },
  };

  static styles = css`
    :host {
      display: block;
      font-family: var(--typography-font-family, system-ui);
      padding: 24px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .tabs { display: flex; gap: 4px; }
    .tab {
      height: 32px;
      padding: 0 16px;
      border: 1px solid var(--color-border-tertiary, #e0e0e0);
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      background: transparent;
      color: var(--color-foreground-secondary, #555);
    }
    .tab.active {
      background: var(--color-background-faint-brand, #eff3ff);
      color: var(--color-foreground-bold-brand, #3a5ccc);
      font-weight: 600;
      border-color: currentColor;
    }
    input[type=search] {
      flex: 1 1 240px;
      min-width: 200px;
      max-width: 400px;
      height: 36px;
      padding: 0 12px;
      border: 1px solid var(--color-border-tertiary, #e0e0e0);
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      background: var(--color-background-primary, #fff);
      color: var(--color-foreground-primary, #111);
    }
    .size-btns { display: flex; gap: 4px; }
    .size-btn {
      height: 32px;
      padding: 0 12px;
      border: 1px solid var(--color-border-tertiary, #e0e0e0);
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      background: var(--color-background-primary, #fff);
      color: var(--color-foreground-secondary, #555);
    }
    .size-btn.active {
      background: var(--color-background-faint-brand, #eff3ff);
      color: var(--color-foreground-bold-brand, #3a5ccc);
      font-weight: 600;
    }
    .count {
      font-size: 13px;
      color: var(--color-foreground-secondary, #888);
      margin-left: auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 4px;
    }
    .cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 8px;
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      background: transparent;
      text-align: center;
    }
    .cell:hover { background: var(--color-background-faint-neutral, #f5f5f5); }
    .cell.copied { background: var(--color-background-faint-brand, #eff3ff); }
    .icon-wrap { line-height: 0; color: var(--color-foreground-primary, #111); }
    .icon-wrap svg { width: var(--icon-sz); height: var(--icon-sz); }
    .name {
      font-size: 10px;
      line-height: 1.3;
      color: var(--color-foreground-secondary, #888);
      word-break: break-word;
      max-width: 100%;
    }
    .name.copied { color: var(--color-foreground-bold-brand, #3a5ccc); }
    .empty {
      color: var(--color-foreground-secondary, #888);
      font-size: 14px;
      padding: 24px 0;
    }
  `;

  search   = '';
  iconSize = 20;
  copied   = '';
  dataset  = 'system';

  private _onSearch(e: Event) {
    this.search = (e.target as HTMLInputElement).value;
  }
  private _setSize(s: number) { this.iconSize = s; }
  private _setDataset(d: string) { this.dataset = d; this.search = ''; }
  private _copy(name: string) {
    navigator.clipboard.writeText(name).catch(() => {});
    this.copied = name;
    setTimeout(() => { this.copied = ''; this.requestUpdate(); }, 1500);
  }

  render() {
    const entries  = this.dataset === 'system' ? ALL_ICONS : ALL_FLAGS;
    const q        = this.search.toLowerCase();
    const filtered = q ? entries.filter(([n]) => n.toLowerCase().includes(q)) : entries;
    const label    = this.dataset === 'system' ? 'icon' : 'flag';

    return html`
      <div class="toolbar">
        <div class="tabs">
          <button class="tab ${this.dataset === 'system' ? 'active' : ''}"
                  @click=${() => this._setDataset('system')}>
            Icons (${ALL_ICONS.length})
          </button>
          <button class="tab ${this.dataset === 'flags' ? 'active' : ''}"
                  @click=${() => this._setDataset('flags')}>
            Flags (${ALL_FLAGS.length})
          </button>
        </div>

        <input
          type="search"
          placeholder="Search ${entries.length} ${label}s…"
          .value=${this.search}
          @input=${this._onSearch}
        />

        <div class="size-btns">
          ${[12, 16, 20, 24, 32].map(s => html`
            <button
              class="size-btn ${this.iconSize === s ? 'active' : ''}"
              @click=${() => this._setSize(s)}
            >${s}</button>
          `)}
        </div>

        <span class="count">${filtered.length} ${label}${filtered.length !== 1 ? 's' : ''}</span>
      </div>

      ${filtered.length === 0
        ? html`<p class="empty">No ${label}s match "${this.search}"</p>`
        : html`
          <div class="grid" style="--icon-sz: ${this.iconSize}px">
            ${filtered.map(([name, svgStr]) => html`
              <button
                class="cell ${this.copied === name ? 'copied' : ''}"
                @click=${() => this._copy(name)}
                title="Click to copy: ${name}"
              >
                <span class="icon-wrap">${unsafeHTML(svgStr)}</span>
                <span class="name ${this.copied === name ? 'copied' : ''}">
                  ${this.copied === name ? '✓ copied' : name}
                </span>
              </button>
            `)}
          </div>
        `}
    `;
  }
}

if (!customElements.get('imo-icon-gallery')) {
  customElements.define('imo-icon-gallery', IconGallery);
}

// ── Story exports ─────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Foundation/Icons',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Gallery: Story = {
  name: 'Icon Gallery',
  render: () => html`<imo-icon-gallery></imo-icon-gallery>`,
};
