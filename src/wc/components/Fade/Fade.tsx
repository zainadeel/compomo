import { Component, Element, Prop, State, Watch, h, Host } from '@stencil/core';
import {
  isScrollAtEdge,
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
  @Element() el!: HTMLElement;

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

  @State() private atEnd = false;

  @Watch('side')
  @Watch('visible')
  protected onFadeConfigChange() {
    this.syncAtEnd();
  }

  componentDidLoad() {
    this.syncAtEnd();
  }

  private syncAtEnd() {
    this.atEnd = isScrollAtEdge(this.el, this.side);
  }

  private handleScroll(e: Event) {
    const target = e.currentTarget as HTMLElement;
    this.atEnd = isScrollAtEdge(target, this.side);
  }

  render() {
    return (
      <Host
        class={scrollEdgeFadeClassMap({
          edges: this.side,
          atEnd: { [this.side]: this.atEnd },
          hidden: !this.visible,
        })}
        style={scrollEdgeFadeSizeStyle(this.size, this.height) as Record<string, string>}
        onScroll={(e: Event) => this.handleScroll(e)}
      >
        <slot />
      </Host>
    );
  }
}
