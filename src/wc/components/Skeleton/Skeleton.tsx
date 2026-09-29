import { Component, Element, Prop, State, Watch, h, Host } from '@stencil/core';
import type { IconSize } from '../Icon/Icon';
import type { TextVariant } from '../Text/text-types';
import { CONTROL_TEXT_VARIANT, type ControlSize } from '../../utils/control-text';
import { observeTableCaptionCompact } from '../../utils/table-caption-compact';

export type SkeletonVariant = 'text' | 'icon' | 'control';
export type SkeletonControlAppearance = 'filled' | 'outlined' | 'borderless';
export type SkeletonControlContent =
  | 'label'
  | 'icon'
  | 'icon-label'
  | 'label-icon'
  | 'icon-label-icon';
export type SkeletonBackground =
  | 'faint'
  | 'medium'
  | 'bold'
  | 'strong'
  | 'translucent'
  | 'inverted'
  | 'media'
  | 'navigation'
  | 'always-dark';

/** @slot - Real text or a control whose footprint is retained with preserveLayout. */
@Component({
  tag: 'ds-skeleton',
  styleUrl: 'Skeleton.css',
  shadow: true,
})
export class Skeleton {
  @Element() el!: HTMLElement;
  @Prop() variant: SkeletonVariant = 'text';
  /** Text metric recipe whose line-height defines the text canvas. */
  @Prop() textVariant: TextVariant = 'text-body-medium';
  /** Iconography token whose square canvas defines the icon canvas. */
  @Prop() iconSize: IconSize = 'md';
  /** Shared control-density size whose height defines the control canvas. */
  @Prop() controlSize: ControlSize = 'md';
  /** Filled controls replace the entire shape; other appearances retain the frame and mask its contents. */
  @Prop() controlAppearance: SkeletonControlAppearance = 'filled';
  /** Content anatomy for outlined and borderless control placeholders. */
  @Prop() controlContent: SkeletonControlContent = 'label';
  /** Follow the owning table or data toolbar's compact icon-only control presentation. */
  @Prop() collapseLabel: boolean = false;
  /** Width of text and control skeleton canvases. Numbers resolve to px. Ignored for icons. */
  @Prop() width: string | number | undefined;
  /** Round icon skeletons into circles and control skeletons into pills. Ignored for text. */
  @Prop() rounded: boolean = false;
  /** Whether to show the shimmer animation. */
  @Prop() shimmer: boolean = true;
  /** Derive geometry from a projected control or text instead of estimating its footprint. */
  @Prop() preserveLayout: boolean = false;
  /** With preserveLayout, reveal the same projected content when loading completes. */
  @Prop() isLoading: boolean = true;
  /** Actual parent surface context. Omit on primary and secondary surfaces. */
  @Prop() background: SkeletonBackground | undefined;

  @State() private captionCompact = false;
  private captionCompactDisconnect: (() => void) | undefined;
  private hasLoaded = false;

  componentDidLoad(): void {
    this.hasLoaded = true;
    this.syncCaptionCompactObserver();
  }

  connectedCallback(): void {
    if (this.hasLoaded) this.syncCaptionCompactObserver();
  }

  disconnectedCallback(): void {
    this.disconnectCaptionCompactObserver();
  }

  private disconnectCaptionCompactObserver(): void {
    this.captionCompactDisconnect?.();
    this.captionCompactDisconnect = undefined;
  }

  @Watch('collapseLabel')
  syncCaptionCompactObserver(): void {
    this.disconnectCaptionCompactObserver();
    if (!this.collapseLabel) {
      this.captionCompact = false;
      return;
    }
    this.captionCompactDisconnect = observeTableCaptionCompact(this.el, compact => {
      this.captionCompact = compact;
    });
  }

  private get widthCss() {
    const v = this.width;
    if (v == null) return undefined;
    return typeof v === 'number' ? `${v}px` : v;
  }

  private renderControl() {
    const iconOnly =
      this.controlContent === 'icon' ||
      (this.collapseLabel && this.captionCompact && this.controlContent.includes('icon'));
    const icon = () => (
      <ds-skeleton
        variant="icon"
        iconSize={this.controlSize}
        background={this.background}
        shimmer={this.shimmer}
      />
    );
    return (
      <span
        class={{
          skeleton__control: true,
          'ds-control-frame': true,
          'skeleton__control--icon': iconOnly,
        }}
      >
        {(iconOnly || this.controlContent.startsWith('icon-')) && icon()}
        {!iconOnly && (
          <span class="skeleton__control-label ds-control-label-box">
            <ds-skeleton
              textVariant={CONTROL_TEXT_VARIANT[this.controlSize]}
              background={this.background}
              shimmer={this.shimmer}
            />
          </span>
        )}
        {!iconOnly && this.controlContent.endsWith('-icon') && icon()}
      </span>
    );
  }

  render() {
    return (
      <Host
        aria-hidden={this.isLoading ? 'true' : undefined}
        class={{
          skeleton: true,
          [`skeleton--${this.variant}`]: true,
          [`skeleton--text-${this.textVariant}`]: this.variant === 'text',
          [`skeleton--icon-${this.iconSize}`]: this.variant === 'icon',
          [`ds-control--${this.controlSize}`]: this.variant === 'control',
          [`skeleton--control-${this.controlAppearance}`]: this.variant === 'control',
          [`skeleton--background-${this.background}`]: !!this.background,
          'skeleton--rounded': this.variant !== 'text' && this.rounded,
          'skeleton--preserve-layout': this.preserveLayout,
          'skeleton--content-ready': this.preserveLayout && !this.isLoading,
        }}
        style={this.variant === 'icon' ? undefined : { width: this.widthCss }}
      >
        {this.preserveLayout && (
          <span class="skeleton__source" inert={this.isLoading}>
            <slot />
          </span>
        )}
        {this.isLoading &&
          (this.variant === 'control' && this.controlAppearance !== 'filled' ? (
            this.renderControl()
          ) : (
            <span
              class={{
                skeleton__shape: true,
                'ds-shimmer-surface': this.shimmer,
              }}
            />
          ))}
      </Host>
    );
  }
}
