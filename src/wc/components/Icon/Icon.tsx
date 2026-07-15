import { Component, Prop, Element, State, Watch, h, Host } from '@stencil/core';
import { flagIconLoaders } from './flag-icon-catalog';
import { systemIconLoaders } from './system-icon-catalog';
import { iconCache, iconCacheKey } from './icon-cache';
import { parseIconSvg } from './icon-svg';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type IconColorToken =
  // Hierarchy
  | 'primary' | 'secondary' | 'tertiary' | 'quaternary'
  // Intent — bold contrast (default)
  | 'brand' | 'negative' | 'positive' | 'warning' | 'caution' | 'ai' | 'guide' | 'neutral'
  // Intent — faint
  | 'faint-brand' | 'faint-negative' | 'faint-positive' | 'faint-warning'
  | 'faint-caution' | 'faint-ai' | 'faint-neutral'
  // Intent — medium
  | 'medium-brand' | 'medium-negative' | 'medium-positive' | 'medium-warning'
  | 'medium-caution' | 'medium-ai' | 'medium-neutral'
  // Intent — bold (explicit)
  | 'bold-brand' | 'bold-negative' | 'bold-positive' | 'bold-warning'
  | 'bold-caution' | 'bold-ai' | 'bold-neutral'
  // Intent — strong
  | 'strong-brand' | 'strong-negative' | 'strong-positive' | 'strong-warning'
  | 'strong-caution' | 'strong-ai' | 'strong-neutral'
  // Contextual
  | 'on-strong' | 'on-bold'
  // Pass-through
  | 'inherit';

export type IconColor = IconColorToken | `var(--${string})`;

@Component({
  tag: 'ds-icon',
  styleUrl: 'Icon.css',
  scoped: true,
})
export class Icon {
  @Element() el!: HTMLElement;

  /** Exact canonical IcoMo export name, including the `Flag` prefix for flags. */
  @Prop() name: string = '';
  /** Iconography size token. Maps to `--dimension-iconography-{size}`. Default `md` = 20 px. */
  @Prop() size: IconSize = 'md';
  /** Semantic foreground color token, or a raw CSS var reference. */
  @Prop() color: IconColor = 'inherit';
  /** Accessible label. Sets `role="img"` and `aria-label`. Omit for decorative icons. */
  @Prop() label: string | undefined;

  /** Resolved SVG markup — set synchronously on cache hit, async after a lazy load. */
  @State() private svg: string = '';

  /** Guards against out-of-order async resolutions when `name`/`flag` change quickly. */
  private loadToken = 0;

  /**
   * Cache hit → render synchronously (pre-registered via `registerIcons` or
   * previously loaded). Miss → fire the per-icon lazy loader; the glyph pops in
   * when the (tiny, per-icon) chunk resolves and stays cached for every other
   * ds-icon instance.
   */
  private resolveSvg() {
    const flag = this.name.startsWith('Flag');
    const key = iconCacheKey(this.name, flag);
    const token = ++this.loadToken;

    const cached = iconCache().get(key);
    if (cached !== undefined) {
      this.svg = cached;
      return;
    }

    // Own-key lookup only: names resolve by exact canonical IcoMo export key —
    // never meta.json aliases (not in the maps) and never inherited prototype
    // keys ('constructor', 'toString', …) that a bare index access would hit.
    const loaders = flag ? flagIconLoaders : systemIconLoaders;
    const loader = Object.prototype.hasOwnProperty.call(loaders, this.name)
      ? loaders[this.name]
      : undefined;
    if (!loader) {
      this.svg = '';
      return;
    }

    loader()
      .then(svg => {
        iconCache().set(key, svg);
        if (token === this.loadToken) this.svg = svg;
      })
      .catch(() => {
        if (token === this.loadToken) this.svg = '';
      });
  }

  componentWillLoad() {
    // Fire-and-forget: do not return the promise — a cache miss must not block
    // the parent render tree on a network fetch.
    this.resolveSvg();
  }

  /** Last markup injected into the DOM — skips redundant re-parse on unrelated re-renders. */
  private renderedSvg: string | null = null;

  private updateSvg() {
    const container = this.el.querySelector<HTMLElement>('.icon__svg');
    if (!container) return;
    if (this.svg === this.renderedSvg) return;
    this.renderedSvg = this.svg;

    // Validate + inject as parsed DOM nodes — never innerHTML. Keeps ds-icon
    // Trusted-Types compatible and rejects executable/foreign content in
    // glyph strings (registerIcons accepts app-provided markup).
    const svg = this.svg ? parseIconSvg(this.svg) : null;
    if (!svg) {
      container.replaceChildren();
      return;
    }

    // Stencil's scoped CSS cannot reach injected elements (no sc-* class).
    // Apply width/height as inline styles so sizing works regardless of scope class.
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    // Prevent SVG from being natively focusable (Firefox/IE default) while
    // sitting inside an aria-hidden parent — fixes aria-hidden-focus violation.
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.display = 'block';
    svg.style.flexShrink = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    container.replaceChildren(svg);
  }

  @Watch('name')
  onIconChange() {
    this.resolveSvg();
  }

  componentDidRender() {
    this.updateSvg();
  }

  render() {
    const isCustomColor = typeof this.color === 'string' && this.color.startsWith('var(--');

    const cls: Record<string, boolean> = {
      icon: true,
      [`icon--size-${this.size}`]: true,
      [`icon--color-${this.color}`]: !!this.color && !isCustomColor && this.color !== 'inherit',
      'icon--color-inherit': this.color === 'inherit',
    };

    const style = isCustomColor ? { color: this.color as string } : undefined;

    return (
      <Host style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <span
          class={cls}
          style={style}
          role={this.label ? 'img' : 'presentation'}
          aria-label={this.label}
          aria-hidden={!this.label ? 'true' : undefined}
        >
          <span class="icon__svg" />
        </span>
      </Host>
    );
  }
}
