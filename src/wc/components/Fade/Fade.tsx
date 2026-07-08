import { Component, Prop, h, Host } from '@stencil/core';
import {
  scrollEdgeFadeClassMap,
  scrollEdgeFadeSizeStyle,
  type ScrollEdgeFadeEdge,
  type ScrollEdgeFadeSize,
  type ScrollEdgeFadeSizeToken,
} from '../../utils/scroll-edge-fade';

/** @deprecated Use `ScrollEdgeFadeEdge` from `@ds-mo/ui/utils`. */
export type FadeSide = ScrollEdgeFadeEdge;

/** @deprecated Use `ScrollEdgeFadeSizeToken` from `@ds-mo/ui/utils`. */
export type FadeSizeToken = ScrollEdgeFadeSizeToken;

/** @deprecated Use `ScrollEdgeFadeSize` from `@ds-mo/ui/utils`. */
export type FadeSize = ScrollEdgeFadeSize;

@Component({
  tag: 'ds-fade',
  styleUrl: 'Fade.css',
  scoped: true,
})
export class Fade {
  /** Edge where content fades as it approaches the scroll boundary. */
  @Prop() side: FadeSide = 'bottom';

  /** Fade depth along the fade axis. Accepts dimension size token names or any CSS length. */
  @Prop() size: FadeSize = 'size-600';

  /**
   * Deprecated alias for size. Kept for existing consumers that pass a raw CSS length.
   * Prefer `size`.
   */
  @Prop() height: string | undefined;

  /** Controls the mask without removing the scroll container from layout. */
  @Prop() visible: boolean = true;

  render() {
    return (
      <Host>
        <div
          class={{
            'fade__scroll': true,
            ...scrollEdgeFadeClassMap({
              edges: this.side,
              hidden: !this.visible,
            }),
          }}
          style={scrollEdgeFadeSizeStyle(this.size, this.height) as Record<string, string>}
        >
          <slot />
        </div>
      </Host>
    );
  }
}
