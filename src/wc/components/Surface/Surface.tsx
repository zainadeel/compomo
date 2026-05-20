import { Component, Prop, h, Host } from '@stencil/core';

export type SurfaceIntent =
  | 'brand' | 'positive' | 'negative' | 'warning' | 'caution'
  | 'ai' | 'neutral' | 'walkthrough' | 'guide';
export type SurfaceBackground = 'primary' | 'secondary' | 'transparent' | 'translucent';
export type SurfaceContrast = 'faint' | 'medium' | 'bold' | 'strong';
export type SurfaceElevation =
  | 'none' | 'depressed' | 'depressed-md' | 'flat' | 'elevated' | 'floating'
  | 'overlayTop' | 'overlayRight' | 'overlayBottom' | 'overlayLeft';
export type SurfaceEdge = 'top' | 'right' | 'bottom' | 'left';
export type SurfaceRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | (string & {});
export type SurfaceElement = 'div' | 'section' | 'aside' | 'article' | 'header' | 'footer' | 'main' | 'nav' | 'span';

const RADIUS_PRESETS = new Set(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full']);

@Component({
  tag: 'ds-surface',
  styleUrl: 'Surface.css',
  scoped: true,
})
export class Surface {
  @Prop() background: SurfaceBackground = 'transparent';
  @Prop() intent: SurfaceIntent | undefined;
  @Prop() contrast: SurfaceContrast = 'faint';
  @Prop() elevation: SurfaceElevation = 'none';
  /** Space-separated list of edges: "top bottom" etc. Only applies when elevation='none'. */
  @Prop() edge: string | undefined;
  @Prop() radius: SurfaceRadius | undefined;
  @Prop() interactive: boolean = false;
  @Prop() selected: boolean = false;
  @Prop() inactive: boolean = false;
  @Prop() as: SurfaceElement = 'div';

  render() {
    const Tag = this.as as any;

    const intentClass = this.intent
      ? `intent-${this.intent}-${this.contrast}`
      : `bg-${this.background}`;

    const elevClass = `elevation-${this.elevation}`;

    const edgeClasses = this.edge && this.elevation === 'none'
      ? this.edge.trim().split(/\s+/).map(e => `edge-${e}`)
      : [];

    const radiusClass = this.radius && RADIUS_PRESETS.has(this.radius)
      ? `radius-${this.radius}`
      : '';

    const customRadius = this.radius && !RADIUS_PRESETS.has(this.radius)
      ? this.radius
      : undefined;

    const cls = [
      'surface',
      intentClass,
      elevClass,
      ...edgeClasses,
      radiusClass,
      this.interactive ? 'interactive' : '',
      this.selected ? 'selected' : '',
      this.inactive ? 'inactive' : '',
    ].filter(Boolean).join(' ');

    return (
      <Host style={{ display: 'contents' }}>
        <Tag
          class={cls}
          style={customRadius ? { borderRadius: customRadius } : undefined}
        >
          <slot />
        </Tag>
      </Host>
    );
  }
}
