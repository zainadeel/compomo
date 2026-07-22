import { Component, Element, h, Host, Prop, State } from '@stencil/core';
import { createRafCoalescer } from '../../shell/chrome-transition';
import { resolveCssLengthPx } from '../../utils/resolve-css-length-px';
import type { BarTitleVariant } from '../BarTitle/bar-title-types';
import { resolveShellPageCapacity, resolveShellPageHeaderVariant } from './shell-page-responsive';
import type {
  ShellPageCapacity,
  ShellPageContentInset,
  ShellPageHeaderPresentation,
} from './shell-page-types';

type BarTitleElement = HTMLElement & { variant: BarTitleVariant };

@Component({
  tag: 'ds-shell-page',
  styleUrl: 'ShellPage.css',
  scoped: true,
})
export class ShellPage {
  private static readonly MAX_HEADER_REVEAL_FRAMES = 12;

  @Element() el!: HTMLElement;

  /** Automatic container/scroll behavior, or an explicit header variant override. */
  @Prop() headerPresentation: ShellPageHeaderPresentation = 'auto';

  /** Standard page gutters, or no inset for full-bleed page content. */
  @Prop() contentInset: ShellPageContentInset = 'default';

  @State() private capacity: ShellPageCapacity | null = null;
  @State() private pageTopVisible = true;

  private sentinelEl: HTMLElement | null = null;
  private spacerEl: HTMLElement | null = null;
  private headerEl: BarTitleElement | null = null;
  private expandedHeaderHeight = 0;
  private resizeObserver: ResizeObserver | null = null;
  private headerResizeObserver: ResizeObserver | null = null;
  private headerRevealFrame: number | null = null;
  private scrollRoot: HTMLElement | Window | null = null;
  private readonly layoutCoalescer = createRafCoalescer(() => this.syncCapacity());

  componentDidLoad() {
    // Resolve the already-laid-out page width before adopting a slotted header.
    // Waiting for the first ResizeObserver/RAF lets BarTitle paint its default
    // expanded variant for one frame when persistent shell chrome narrows a
    // newly navigated page.
    this.syncCapacity();
    this.observeHeader(this.findHeader());
    this.connectObservers();
    this.connectScrollRoot();
    this.layoutCoalescer.schedule();
  }

  componentDidRender() {
    this.syncHeaderVariant();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.headerResizeObserver?.disconnect();
    this.headerResizeObserver = null;
    this.cancelHeaderReveal();
    this.scrollRoot?.removeEventListener('scroll', this.handleScroll);
    this.scrollRoot = null;
    this.layoutCoalescer.cancel();
  }

  private get effectiveVariant(): BarTitleVariant {
    return resolveShellPageHeaderVariant(
      this.headerPresentation,
      this.capacity ?? 'roomy',
      this.pageTopVisible
    );
  }

  private get isScrollCompacted(): boolean {
    return this.headerPresentation === 'auto' && this.capacity === 'roomy' && !this.pageTopVisible;
  }

  private connectObservers() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.layoutCoalescer.schedule());
      this.resizeObserver.observe(this.el);
    }
  }

  private composedParent(element: Element): Element | null {
    return (element as HTMLElement).assignedSlot?.parentElement ?? element.parentElement;
  }

  private findScrollRoot(): HTMLElement | Window {
    let ancestor = this.composedParent(this.el);
    while (ancestor && ancestor !== document.documentElement) {
      const overflow = getComputedStyle(ancestor).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') return ancestor as HTMLElement;
      ancestor = this.composedParent(ancestor);
    }
    return window;
  }

  private connectScrollRoot() {
    this.scrollRoot?.removeEventListener('scroll', this.handleScroll);
    this.scrollRoot = this.findScrollRoot();
    this.scrollRoot.addEventListener('scroll', this.handleScroll, { passive: true });
    this.handleScroll();
  }

  private handleScroll = () => {
    if (!this.sentinelEl || !this.scrollRoot) return;
    const rootTop =
      this.scrollRoot === window ? 0 : (this.scrollRoot as HTMLElement).getBoundingClientRect().top;
    this.pageTopVisible = this.sentinelEl.getBoundingClientRect().top >= rootTop;
  };

  private findHeader(): BarTitleElement | null {
    return this.el.querySelector<BarTitleElement>('ds-bar-title');
  }

  private syncCapacity() {
    const inlineSize = this.el.getBoundingClientRect().width;
    if (inlineSize <= 0) return;

    const compactAt = resolveCssLengthPx('--dimension-panel-width-2xl', 0);
    const constrainedAt = resolveCssLengthPx('--dimension-panel-width-lg', 0);
    const hysteresis = resolveCssLengthPx('--dimension-space-100', 0);
    if (compactAt <= 0 || constrainedAt <= 0) return;

    const next = resolveShellPageCapacity({
      inlineSize,
      compactAt,
      constrainedAt,
      hysteresis,
      previous: this.capacity,
    });
    if (next !== this.capacity) this.capacity = next;
    else this.syncHeaderVariant();
  }

  private get compactHeaderHeight(): number {
    return resolveCssLengthPx('--dimension-size-600', 0);
  }

  private setSpacerHeight(height: number) {
    if (!this.spacerEl) return;
    this.spacerEl.style.setProperty('--ds-shell-page-flow-spacer', `${Math.max(0, height)}px`);
  }

  private variantClass(variant: BarTitleVariant): string {
    return `bar-title-host--${variant}`;
  }

  private cancelHeaderReveal() {
    if (this.headerRevealFrame !== null) cancelAnimationFrame(this.headerRevealFrame);
    this.headerRevealFrame = null;
    this.headerEl?.removeAttribute('data-shell-page-syncing');
  }

  private revealHeaderWhenSynced(header: BarTitleElement, variant: BarTitleVariant) {
    // Stencil re-renders within a frame or two of a prop change, but this cap
    // guarantees the header can never stay hidden indefinitely if that
    // assumption ever breaks.
    let framesRemaining = ShellPage.MAX_HEADER_REVEAL_FRAMES;
    const reveal = () => {
      if (this.headerEl !== header) {
        header.removeAttribute('data-shell-page-syncing');
        return;
      }
      framesRemaining -= 1;
      if (framesRemaining <= 0 || header.classList.contains(this.variantClass(variant))) {
        header.removeAttribute('data-shell-page-syncing');
        this.headerRevealFrame = null;
        return;
      }
      this.headerRevealFrame = requestAnimationFrame(reveal);
    };
    this.headerRevealFrame = requestAnimationFrame(reveal);
  }

  private syncHeaderVariant(concealUntilSynced = false) {
    const header = this.headerEl;
    if (!header) return;

    const next = this.effectiveVariant;
    if (header.variant === 'expanded') {
      this.expandedHeaderHeight = header.getBoundingClientRect().height;
    }

    this.setSpacerHeight(
      this.isScrollCompacted ? this.expandedHeaderHeight - this.compactHeaderHeight : 0
    );

    const renderedVariantIsStale = !header.classList.contains(this.variantClass(next));
    if (concealUntilSynced && renderedVariantIsStale) {
      header.setAttribute('data-shell-page-syncing', '');
    }
    if (header.variant !== next) header.variant = next;
    if (concealUntilSynced && renderedVariantIsStale) {
      this.revealHeaderWhenSynced(header, next);
    }
  }

  private observeHeader(header: BarTitleElement | null) {
    this.cancelHeaderReveal();
    this.headerResizeObserver?.disconnect();
    this.headerResizeObserver = null;
    this.headerEl = header;
    this.expandedHeaderHeight = 0;
    this.setSpacerHeight(0);

    if (!header) return;
    if (typeof ResizeObserver !== 'undefined') {
      this.headerResizeObserver = new ResizeObserver(() => {
        if (header.variant === 'expanded') {
          this.expandedHeaderHeight = header.getBoundingClientRect().height;
        }
      });
      this.headerResizeObserver.observe(header);
    }
    this.syncHeaderVariant(true);
  }

  private handleHeaderSlotChange = (event: Event) => {
    const slot = event.target as HTMLSlotElement;
    const header = slot
      .assignedElements({ flatten: true })
      .find(element => element.tagName.toLowerCase() === 'ds-bar-title');
    this.observeHeader((header as BarTitleElement | undefined) ?? null);
  };

  render() {
    return (
      <Host
        role="main"
        class={{
          'shell-page-host--inset-default': this.contentInset === 'default',
          'shell-page-host--inset-none': this.contentInset === 'none',
          [`shell-page-host--header-${this.effectiveVariant}`]: true,
        }}
      >
        <div
          ref={el => {
            this.sentinelEl = el ?? null;
          }}
          class="shell-page__scroll-sentinel"
          aria-hidden="true"
        />
        <div class="shell-page__sticky-header">
          <slot name="header" onSlotchange={this.handleHeaderSlotChange} />
        </div>
        <div
          ref={el => {
            this.spacerEl = el ?? null;
          }}
          class="shell-page__flow-spacer"
          aria-hidden="true"
        />
        <div class="shell-page__content">
          <slot />
        </div>
      </Host>
    );
  }
}
