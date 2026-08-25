import { Component, Element, Event, EventEmitter, h, Host, Method, Prop, State, Watch } from '@stencil/core';
import { controlWidthClass } from '../../utils';
import { beginElevatedControlPress } from '../../utils/control-press';
import { renderButtonContent } from '../../utils/button-render';
import type { ControlInsetDepth } from '../../utils/control-text';
import { observeTableCaptionCompact } from '../../utils/table-caption-compact';
import type {
  ButtonPopup,
  ButtonSize,
  ButtonVariant,
  ButtonWidth,
} from '../../utils/button-types';

export type ButtonUnfilledBackground =
  | 'faint'
  | 'medium'
  | 'bold'
  | 'strong'
  | 'translucent'
  | 'inverted'
  | 'media'
  | 'always-dark';

export type ButtonUnfilledVariant = ButtonVariant;
export type ButtonUnfilledSize = ButtonSize;
export type ButtonUnfilledWidth = ButtonWidth;
export type ButtonUnfilledPopup = ButtonPopup;

@Component({
  tag: 'ds-button-unfilled',
  styleUrl: 'ButtonUnfilled.css',
  scoped: true,
})
export class ButtonUnfilled {
  @Element() el!: HTMLElement;

  /**
   * Content layout. Default is label-only; pass `icon` for icon-only chrome
   * (nav / tool rails) or `icon-label` for leading icon + text.
   */
  @Prop() variant: ButtonUnfilledVariant = 'label';

  /** Control density (height, padding, icon, type). */
  @Prop() size: ButtonUnfilledSize = 'md';

  /** Use reduced outer geometry when nested inside a control of the same size. */
  @Prop() isInset: boolean = false;

  /** Single removes 4px overall; double removes 8px overall (xs stays single). */
  @Prop() insetDepth: ControlInsetDepth = 'single';

  /** Width fit — hug content (default) or fill the parent. */
  @Prop() width: ButtonUnfilledWidth = 'hug';

  /** Visible text for `label` / `icon-label` variants. */
  @Prop() label: string = '';

  /** Whether the visible label uses the emphasized weight. */
  @Prop() labelEmphasis: boolean = true;

  /** Icon name passed to <ds-icon> for `icon` / `icon-label` variants. */
  @Prop() icon: string = '';

  /**
   * Owner-controlled visual emphasis inside a composite. This does not add
   * toggle semantics and does not emit dsChange.
   */
  @Prop() isActive: boolean = false;

  /**
   * When active, render the selected interaction fill.
   * Default `true` for general UI. Shell chrome (nav / tool rails) should pass
   * `false` so selection is foreground-only (primary color, no fill).
   */
  @Prop() activeFill: boolean = true;

  /** Show a 1px secondary inset border. Default on; shell chrome can pass `false`. */
  @Prop() hasBorder: boolean = true;

  /** Use the half-radius treatment instead of the default control radius. */
  @Prop() rounded: boolean = false;

  /**
   * Scale down during a physical pointer press.
   * Disable when an owning composite requires fixed child or background geometry.
   */
  @Prop() pressScale: boolean = true;

  /** Show a notification dot at the top-right of the icon zone (icon variant only). */
  @Prop() dot: boolean = false;

  /** Disables interaction. */
  @Prop() isInactive: boolean = false;

  /** Shows an inline loader and prevents interaction without applying inactive opacity. */
  @Prop() isLoading: boolean = false;

  /** Native button type. */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  /** Actual parent surface context. Omit on primary and secondary surfaces. */
  @Prop() background: ButtonUnfilledBackground | undefined;

  /** Accessible name override. Required for icon-only buttons. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop() controls: string | undefined;
  /**
   * Controlled disclosure or popup state forwarded to `aria-expanded`.
   * Popup triggers hold only the pressed wash while open; their resting
   * foreground is unchanged. Ordinary disclosures remain visually neutral.
   */
  @Prop() expanded: boolean | undefined;
  @Prop() haspopup: ButtonUnfilledPopup | undefined;
  /**
   * Controlled state for a genuine toggle button. Adds aria-pressed, promotes
   * active styling, and makes activation emit dsChange with the requested state.
   */
  @Prop() pressed: boolean | undefined;

  /**
   * Collapse the visible label and chevron to an icon-only control when the
   * owning `ds-table` caption is narrower than 900px. The trigger omits those
   * parts rather than clipping them.
   */
  @Prop({ reflect: true }) collapseLabel: boolean = false;

  /**
   * Mark the button as a Menu trigger. Implies `aria-haspopup="menu"` and covers
   * both menu-button shapes:
   *
   * - `label` / `icon-label` — the action *has* a menu; a trailing chevron carries
   *   the affordance.
   * - `icon` — the button *is* a menu. No chevron is added, so the glyph must
   *   convey the menu on its own. Use `Ellipses` for generic more-options;
   *   use a specific icon when the menu has a named purpose, such as
   *   `Table` for Customize table.
   *
   * Use `haspopup` directly for non-menu popups.
   */
  @Prop() hasMenu: boolean = false;

  /**
   * Native `tabindex` for roving keyboard groups in shell chrome.
   * Omit for the default button tab stop (`0`).
   */
  @Prop({ attribute: 'tab-index' }) focusTabIndex?: number;

  @Event() dsClick!: EventEmitter<MouseEvent>;
  @Event() dsChange!: EventEmitter<boolean>;

  @State() private captionCompact = false;

  private buttonEl: HTMLButtonElement | null = null;
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

  @Watch('collapseLabel')
  onCollapseLabelChange() {
    this.syncCaptionCompactObserver();
  }

  @Method()
  async setFocus() {
    this.buttonEl?.focus();
  }

  private handleClick = (event: MouseEvent) => {
    if (this.isInactive || this.isLoading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.dsClick.emit(event);
    if (this.pressed !== undefined) this.dsChange.emit(!this.pressed);
  };

  private get captionIconOnly(): boolean {
    return (
      this.collapseLabel &&
      this.captionCompact &&
      this.variant === 'icon-label' &&
      Boolean(this.icon)
    );
  }

  private get visualVariant(): ButtonUnfilledVariant {
    return this.captionIconOnly ? 'icon' : this.variant;
  }

  private get showDot(): boolean {
    return this.variant === 'icon' && this.dot && !this.isLoading;
  }

  private syncCaptionCompactObserver(): void {
    this.disconnectCaptionCompactObserver();
    if (!this.collapseLabel) {
      if (this.captionCompact) this.captionCompact = false;
      return;
    }
    this.captionCompactDisconnect = observeTableCaptionCompact(this.el, compact => {
      if (this.captionCompact !== compact) this.captionCompact = compact;
    });
  }

  private disconnectCaptionCompactObserver(): void {
    this.captionCompactDisconnect?.();
    this.captionCompactDisconnect = undefined;
  }

  private get resolvedHaspopup(): ButtonUnfilledPopup | undefined {
    return this.haspopup ?? (this.hasMenu ? 'menu' : undefined);
  }

  private get doubleInset(): boolean {
    return this.isInset && this.insetDepth === 'double' && this.size !== 'xs';
  }

  /** Only popup triggers hold a pressed visual while expanded. */
  private get expandedPopup(): boolean {
    return this.expanded === true && this.resolvedHaspopup !== undefined && !this.isInactive;
  }

  private get visuallyActive(): boolean {
    return this.isActive || this.pressed === true;
  }

  /** Knock-out ring: selected fill → active wash; otherwise surface token. */
  private get dotRing(): string {
    if ((this.isActive || this.pressed === true) && this.activeFill) {
      return 'var(--ds-interaction-active)';
    }
    return 'var(--ds-button-unfilled-dot-ring)';
  }

  private get accessibleName(): string | undefined {
    if (this.ariaLabel) return this.ariaLabel;
    if (this.isLoading && this.variant === 'label' && this.label) return this.label;
    return undefined;
  }

  render() {
    const bg = this.background;
    const cls: Record<string, boolean> = {
      'button-unfilled': true,
      'ds-button': true,
      'ds-focus-ring-inset': true,
      'ds-control-press-scale': this.pressScale,
      'ds-interaction-fill': true,
      'ds-interaction-fill--selected':
        (this.isActive || this.pressed === true) &&
        this.activeFill &&
        !this.isInactive,
      'ds-interaction-fill--on-faint': bg === 'faint',
      'ds-interaction-fill--on-medium': bg === 'medium',
      'ds-interaction-fill--on-bold': bg === 'bold',
      'ds-interaction-fill--on-strong': bg === 'strong',
      'ds-interaction-fill--on-translucent': bg === 'translucent',
      'ds-interaction-fill--on-inverted': bg === 'inverted',
      'ds-interaction-fill--on-media': bg === 'media',
      'ds-interaction-fill--on-always-dark': bg === 'always-dark',
      'button-unfilled--active': this.visuallyActive,
      'button-unfilled--expanded': this.expandedPopup,
      'ds-button--expanded': this.expandedPopup,
      'button-unfilled--bordered': this.hasBorder,
      'ds-button--bordered': this.hasBorder,
      'button-unfilled--rounded': this.rounded,
      'ds-button--rounded': this.rounded,
      'ds-control-inactive': this.isInactive,
      'ds-control--lg': this.size === 'lg',
      'ds-control--md': this.size === 'md',
      'ds-control--sm': this.size === 'sm',
      'ds-control--xs': this.size === 'xs',
      'ds-control--inset': this.isInset && !this.doubleInset,
      'ds-control--inset-double': this.doubleInset,
      'ds-control-frame': true,
      'button-unfilled--icon': this.visualVariant === 'icon',
      'ds-button--icon': this.visualVariant === 'icon',
      'button-unfilled--label': this.visualVariant === 'label',
      'button-unfilled--icon-label': this.visualVariant === 'icon-label',
      'button-unfilled--background-faint': bg === 'faint',
      'button-unfilled--background-medium': bg === 'medium',
      'button-unfilled--background-bold': bg === 'bold',
      'button-unfilled--background-strong': bg === 'strong',
      'button-unfilled--background-translucent': bg === 'translucent',
      'button-unfilled--background-inverted': bg === 'inverted',
      'button-unfilled--background-media': bg === 'media',
      'button-unfilled--on-always-dark': bg === 'always-dark',
    };

    return (
      <Host
        class={{
          'button-unfilled-host': true,
          'button-unfilled-host--icon': this.visualVariant === 'icon',
          'ds-button-host--icon': this.visualVariant === 'icon',
          'ds-control--lg': this.size === 'lg',
          'ds-control--md': this.size === 'md',
          'ds-control--sm': this.size === 'sm',
          'ds-control--xs': this.size === 'xs',
          'ds-control--inset': this.isInset && !this.doubleInset,
          'ds-control--inset-double': this.doubleInset,
          'ds-table-caption-control': this.collapseLabel,
          'ds-table-caption-control--compact': this.captionIconOnly,
          ...controlWidthClass(this.width),
        }}
        tabIndex={-1}
      >
        <button
          ref={el => {
            this.buttonEl = el ?? null;
          }}
          type={this.type}
          class={cls}
          disabled={this.isInactive}
          tabIndex={this.focusTabIndex ?? 0}
          aria-label={this.accessibleName}
          aria-busy={this.isLoading ? 'true' : undefined}
          aria-disabled={this.isLoading ? 'true' : undefined}
          aria-controls={this.controls}
          aria-expanded={this.expanded === undefined ? undefined : String(this.expanded)}
          aria-haspopup={this.resolvedHaspopup}
          aria-pressed={this.pressed === undefined ? undefined : String(this.pressed)}
          onPointerDown={event =>
            beginElevatedControlPress(
              event,
              this.pressScale && !this.isInactive && !this.isLoading,
            )
          }
          onClick={this.handleClick}
        >
          {renderButtonContent({
            namespace: 'button-unfilled',
            variant: this.visualVariant,
            size: this.size,
            label: this.label,
            labelEmphasis: this.labelEmphasis,
            icon: this.icon,
            hasMenu: this.hasMenu,
            isLoading: this.isLoading,
            dot: {
              visible: this.showDot,
              background: this.dotRing,
            },
          })}
        </button>
      </Host>
    );
  }
}
