import { Component, Element, h, Host, Prop, State, Watch } from '@stencil/core';
import { resolveCssLengthPx } from '../../utils/resolve-css-length-px';
import type { BarTitleVariant } from '../BarTitle/bar-title-types';
import { resolveShellPageHeaderVariant } from './shell-page-responsive';
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
  private static readonly MAX_HEADER_GEOMETRY_FRAMES = 12;

  @Element() el!: HTMLElement;

  /** Automatic capacity/scroll behavior, or an explicit header variant override. */
  @Prop() headerPresentation: ShellPageHeaderPresentation = 'auto';

  /** Available page-header capacity supplied by the owning application shell. */
  @Prop() headerCapacity?: ShellPageCapacity;

  /** Standard page gutters, or no inset for full-bleed page content. */
  @Prop() contentInset: ShellPageContentInset = 'default';

  @State() private pageTopVisible = true;

  private sentinelEl: HTMLElement | null = null;
  private spacerEl: HTMLElement | null = null;
  private stickyHeaderEl: HTMLElement | null = null;
  private headerEl: BarTitleElement | null = null;
  private expandedHeaderHeight = 0;
  private headerTravel = 0;
  private expandedGeometryFrozen = false;
  private headerResizeObserver: ResizeObserver | null = null;
  private headerMutationObserver: MutationObserver | null = null;
  private headerRevealFrame: number | null = null;
  private headerGeometryFrame: number | null = null;
  private scrollRoot: HTMLElement | Window | null = null;

  @Watch('headerCapacity')
  @Watch('headerPresentation')
  handleHeaderContractChange() {
    this.syncHeaderVariant(true);
  }

  componentDidLoad() {
    this.observeHeader(this.findHeader());
    this.connectScrollRoot();
  }

  componentDidRender() {
    this.syncHeaderVariant();
  }

  disconnectedCallback() {
    this.headerResizeObserver?.disconnect();
    this.headerResizeObserver = null;
    this.headerMutationObserver?.disconnect();
    this.headerMutationObserver = null;
    this.cancelHeaderReveal();
    this.cancelHeaderGeometrySync();
    this.scrollRoot?.removeEventListener('scroll', this.handleScroll);
    this.scrollRoot = null;
  }

  private get effectiveVariant(): BarTitleVariant {
    return resolveShellPageHeaderVariant(
      this.headerPresentation,
      this.headerCapacity ?? 'roomy',
      this.pageTopVisible
    );
  }

  private get headerContractResolved(): boolean {
    return this.headerPresentation !== 'auto' || this.headerCapacity !== undefined;
  }

  private get isScrollCompacted(): boolean {
    return (
      this.headerPresentation === 'auto' && this.headerCapacity === 'roomy' && !this.pageTopVisible
    );
  }

  private composedParent(element: Element): Element | null {
    return (element as HTMLElement).assignedSlot?.parentElement ?? element.parentElement;
  }

  private findScrollRoot(): HTMLElement | Window {
    let ancestor = this.composedParent(this.el);
    while (ancestor && ancestor !== document.documentElement) {
      const overflow = getComputedStyle(ancestor).overflowY;
      if (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') {
        return ancestor as HTMLElement;
      }
      ancestor = this.composedParent(ancestor);
    }
    return window;
  }

  private connectScrollRoot() {
    const next = this.findScrollRoot();
    if (next === this.scrollRoot) return;
    this.scrollRoot?.removeEventListener('scroll', this.handleScroll);
    this.scrollRoot = next;
    this.scrollRoot.addEventListener('scroll', this.handleScroll, { passive: true });
    this.handleScroll();
  }

  private handleScroll = () => {
    if (!this.sentinelEl || !this.scrollRoot) return;
    const rootTop =
      this.scrollRoot === window ? 0 : (this.scrollRoot as HTMLElement).getBoundingClientRect().top;
    const nextPageTopVisible = this.sentinelEl.getBoundingClientRect().top >= rootTop;
    if (
      !nextPageTopVisible &&
      this.pageTopVisible &&
      this.headerEl?.classList.contains(this.variantClass('expanded'))
    ) {
      this.captureExpandedHeaderGeometry(this.headerEl);
      this.expandedGeometryFrozen = true;
    }
    if (
      nextPageTopVisible &&
      this.expandedGeometryFrozen &&
      this.el.getBoundingClientRect().top >= rootTop
    ) {
      this.expandedGeometryFrozen = false;
      if (this.headerEl?.classList.contains(this.variantClass('expanded'))) {
        this.captureExpandedHeaderGeometry(this.headerEl);
      }
    }
    this.pageTopVisible = nextPageTopVisible;
  };

  private findHeader(): BarTitleElement | null {
    return this.el.querySelector<BarTitleElement>('ds-bar-title');
  }

  private get compactHeaderHeight(): number {
    return resolveCssLengthPx('--dimension-size-600', 0);
  }

  private setHeaderTravel(distance: number) {
    const next = Math.max(0, distance);
    if (Math.abs(next - this.headerTravel) < 0.5) return;
    this.headerTravel = next;
    this.el.style.setProperty('--ds-shell-page-header-travel', `${next}px`);
    this.handleScroll();
  }

  private measureHeaderTravel(header: BarTitleElement) {
    const anchor = header.querySelector<HTMLElement>('[data-shell-page-header-anchor]');
    const compactHeight = this.compactHeaderHeight;
    if (!anchor || compactHeight <= 0) return;

    const headerRect = header.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    if (headerRect.height <= 0 || anchorRect.height <= 0) return;

    const expandedAnchorTop = anchorRect.top - headerRect.top;
    const compactAnchorTop = Math.max(0, (compactHeight - anchorRect.height) / 2);
    this.setHeaderTravel(expandedAnchorTop - compactAnchorTop);
  }

  private captureExpandedHeaderGeometry(header: BarTitleElement) {
    this.expandedHeaderHeight = header.getBoundingClientRect().height;
    this.measureHeaderTravel(header);
  }

  private setSpacerHeight(height: number) {
    if (!this.spacerEl) return;
    this.spacerEl.style.setProperty('--ds-shell-page-flow-spacer', `${Math.max(0, height)}px`);
  }

  private variantClass(variant: BarTitleVariant): string {
    return `bar-title-host--${variant}`;
  }

  private setStickyHeaderOffset(renderedVariant: BarTitleVariant) {
    this.stickyHeaderEl?.style.setProperty(
      '--ds-shell-page-sticky-offset',
      renderedVariant === 'expanded' &&
        this.headerPresentation === 'auto' &&
        this.headerCapacity === 'roomy'
        ? `${-this.headerTravel}px`
        : '0px'
    );
  }

  private syncRenderedHeaderGeometry(header: BarTitleElement) {
    const renderedVariant = this.effectiveVariant;
    if (!header.classList.contains(this.variantClass(renderedVariant))) return;

    // Update both flow-preservation pieces before reading layout. Otherwise a
    // reverse compact → expanded render can briefly contain the tall header and
    // the compact spacer together, giving browser scroll anchoring a transient
    // height change to compensate.
    this.setSpacerHeight(
      this.isScrollCompacted ? this.expandedHeaderHeight - this.compactHeaderHeight : 0
    );
    this.setStickyHeaderOffset(renderedVariant);

    if (renderedVariant === 'expanded' && !this.expandedGeometryFrozen) {
      this.captureExpandedHeaderGeometry(header);
      this.setStickyHeaderOffset(renderedVariant);
    }
  }

  private cancelHeaderGeometrySync() {
    if (this.headerGeometryFrame !== null) cancelAnimationFrame(this.headerGeometryFrame);
    this.headerGeometryFrame = null;
  }

  private scheduleHeaderGeometrySync(header: BarTitleElement) {
    this.cancelHeaderGeometrySync();
    let framesRemaining = ShellPage.MAX_HEADER_GEOMETRY_FRAMES;
    let framesElapsed = 0;
    const sync = () => {
      if (this.headerEl !== header) return;
      framesRemaining -= 1;
      framesElapsed += 1;
      // In WebKit a child's componentDidLoad can precede its assignment into
      // the parent's rendered slot. Revalidate after ShellApp has had a frame
      // to expose the actual content scroller.
      this.connectScrollRoot();
      this.syncRenderedHeaderGeometry(header);
      const geometryReady =
        this.effectiveVariant !== 'expanded' ||
        (this.expandedHeaderHeight > 0 && this.headerTravel > 0);
      if ((geometryReady && framesElapsed >= 2) || framesRemaining <= 0) {
        this.headerGeometryFrame = null;
        return;
      }
      this.headerGeometryFrame = requestAnimationFrame(sync);
    };
    this.headerGeometryFrame = requestAnimationFrame(sync);
  }

  private cancelHeaderReveal() {
    if (this.headerRevealFrame !== null) cancelAnimationFrame(this.headerRevealFrame);
    this.headerRevealFrame = null;
    this.headerEl?.removeAttribute('data-shell-page-syncing');
  }

  private revealHeaderWhenSynced(header: BarTitleElement, variant: BarTitleVariant) {
    // Stencil normally re-renders within a frame or two of a prop change. Stop
    // polling at the cap, but fail closed: a stale variant must never paint.
    let framesRemaining = ShellPage.MAX_HEADER_REVEAL_FRAMES;
    const reveal = () => {
      if (this.headerEl !== header) {
        header.removeAttribute('data-shell-page-syncing');
        return;
      }
      framesRemaining -= 1;
      if (header.classList.contains(this.variantClass(variant))) {
        header.removeAttribute('data-shell-page-syncing');
        this.headerRevealFrame = null;
        return;
      }
      if (framesRemaining <= 0) {
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

    if (!this.headerContractResolved) {
      this.cancelHeaderReveal();
      header.setAttribute('data-shell-page-syncing', '');
      return;
    }

    const next = this.effectiveVariant;
    const renderedVariantIsStale = !header.classList.contains(this.variantClass(next));
    if (!renderedVariantIsStale) this.syncRenderedHeaderGeometry(header);
    if (concealUntilSynced) {
      this.cancelHeaderReveal();
      header.setAttribute('data-shell-page-syncing', '');
    }
    if (header.variant !== next) header.variant = next;
    if (concealUntilSynced) {
      this.revealHeaderWhenSynced(header, next);
    }
  }

  private observeHeader(header: BarTitleElement | null) {
    this.cancelHeaderReveal();
    this.cancelHeaderGeometrySync();
    this.headerResizeObserver?.disconnect();
    this.headerResizeObserver = null;
    this.headerMutationObserver?.disconnect();
    this.headerMutationObserver = null;
    this.headerEl = header;
    this.expandedHeaderHeight = 0;
    this.expandedGeometryFrozen = false;
    this.setHeaderTravel(0);
    this.setSpacerHeight(0);
    this.stickyHeaderEl?.style.setProperty('--ds-shell-page-sticky-offset', '0px');

    if (!header) return;
    if (header.classList.contains(this.variantClass('expanded'))) {
      this.captureExpandedHeaderGeometry(header);
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.headerResizeObserver = new ResizeObserver(() => {
        this.syncRenderedHeaderGeometry(header);
      });
      this.headerResizeObserver.observe(header);
    }
    if (typeof MutationObserver !== 'undefined') {
      this.headerMutationObserver = new MutationObserver(() => {
        this.syncRenderedHeaderGeometry(header);
      });
      this.headerMutationObserver.observe(header, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }
    this.syncHeaderVariant(true);
    this.scheduleHeaderGeometrySync(header);
  }

  private handleHeaderSlotChange = (event: Event) => {
    const slot = event.target as HTMLSlotElement;
    const header = slot
      .assignedElements()
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
        <div
          ref={el => {
            this.stickyHeaderEl = el ?? null;
          }}
          class="shell-page__sticky-header"
        >
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
