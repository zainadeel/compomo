import { Component, Prop, Element, Watch, h, Host } from '@stencil/core';
import * as SvgIcons from '@ds-mo/icons/svg';
import * as SvgFlags from '@ds-mo/icons/svg/flags';

type SvgRecord = Record<string, string>;

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

  /** Name of the system icon (e.g. `"Gear"`, `"ArrowRight"`) or flag (e.g. `"US"`) */
  @Prop() name: string = '';
  /** Iconography size token. Maps to `--dimension-iconography-{size}`. Default `md` = 20 px. */
  @Prop() size: IconSize = 'md';
  /** Semantic foreground color token, or a raw CSS var reference. */
  @Prop() color: IconColor | undefined;
  /** Accessible label. Sets `role="img"` and `aria-label`. Omit for decorative icons. */
  @Prop() label: string | undefined;
  /** Set `true` to look up from the flag icon set instead of the system icon set. */
  @Prop() flag: boolean = false;

  private get svgString(): string {
    const source = this.flag ? (SvgFlags as SvgRecord) : (SvgIcons as SvgRecord);
    return source[this.name] ?? '';
  }

  private updateSvg() {
    const container = this.el.querySelector<HTMLElement>('.icon__svg');
    if (!container) return;
    container.innerHTML = this.svgString;
    // Stencil's scoped CSS cannot reach innerHTML-injected elements (no sc-* class).
    // Apply width/height as inline styles so sizing works regardless of scope class.
    const svg = container.querySelector<SVGElement>('svg');
    if (svg) {
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
    }
  }

  @Watch('name')
  @Watch('flag')
  onIconChange() {
    this.updateSvg();
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
