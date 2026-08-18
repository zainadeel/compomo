import { Component, Element, h, Host, Prop, State, Watch } from '@stencil/core';
import type { ShellResponsiveMode } from '../../shell/shell-responsive';
import { resolveCssLengthPx } from '../../utils/resolve-css-length-px';
import type { BarTitleVariant } from '../BarTitle/bar-title-types';
import { resolveShellPageHeaderVariant } from './shell-page-responsive';
import type {
  ShellPageCapacity,
  ShellPageContentInset,
  ShellPageContentSurface,
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

  /** Preserve the responsive side/end gutters while allowing content to meet the header. */
  @Prop() contentInsetBlockStart: ShellPageContentInset = 'default';

  /** Exact block-start content inset, overriding the responsive default when provided. */
  @Prop() contentInsetBlockStartSize?: string;

  /** Exact block-start content inset while the header is compact or constrained. */
  @Prop() compactContentInsetBlockStartSize?: string;

  /** Allow roomy automatic headers to compact as the page scrolls. */
  @Prop() scrollCompaction: boolean = true;

  /** Canvas surface painted around and beneath routed page content. */
  @Prop() contentSurface: ShellPageContentSurface = 'primary';

  /** Explicit shell breakpoint presentation. Mobile uses the dedicated mobile-header slot. */
  @Prop({ attribute: 'responsive-mode', reflect: true })
  responsiveMode: ShellResponsiveMode = 'desktop';

  @State() private pageTopVisible = true;

  private sentinelEl: HTMLElement | null = null;
  private spacerEl: HTMLElement | null = null;
  private stickyHeaderEl: HTMLElement | null = null;
  private headerEl: BarTitleElement | null = null;
  private expandedHeaderHeight = 0;
  private headerTravel = 0;
  private expandedGeometryFrozen = false;
  private pageHeaderResizeObserver: ResizeObserver | null = null;
  private headerResizeObserver: ResizeObserver | null = null;
  private headerMutationObserver: MutationObserver | null = null;
  private headerRevealFrame: number | null = null;
  private headerGeometryFrame: number | null = null;
  private reconnectFrame: number | null = null;
  private scrollRoot: HTMLElement | Window | null = null;
  private hasLoaded = false;

  @Watch('headerCapacity')
  @Watch('headerPresentation')
  @Watch('scrollCompaction')
  handleHeaderContractChange() {
    this.syncHeaderVariant(true);
  }

  @Watch('responsiveMode')
  handleResponsiveModeChange() {
    this.el.style.removeProperty('--ds-shell-page-sticky-header-block-size');
    this.observeHeader(this.responsiveMode === 'mobile' ? null : this.findHeader());
  }

  componentDidLoad() {
    this.hasLoaded = true;
    this.connectRuntime();
  }

  componentDidRender() {
    this.syncHeaderVariant();
  }

  connectedCallback() {
    if (!this.hasLoaded) return;
    if (this.reconnectFrame !== null) cancelAnimationFrame(this.reconnectFrame);
    this.reconnectFrame = requestAnimationFrame(() => {
      this.reconnectFrame = null;
      if (this.el.isConnected) this.connectRuntime();
    });
  }

  disconnectedCallback() {
    if (this.reconnectFrame !== null) cancelAnimationFrame(this.reconnectFrame);
    this.reconnectFrame = null;
    this.headerResizeObserver?.disconnect();
    this.headerResizeObserver = null;
    this.pageHeaderResizeObserver?.disconnect();
    this.pageHeaderResizeObserver = null;
    this.headerMutationObserver?.disconnect();
    this.headerMutationObserver = null;
    this.cancelHeaderReveal();
    this.cancelHeaderGeometrySync();
    this.headerEl?.style.removeProperty('--ds-bar-title-divider-inset');
    this.scrollRoot?.removeEventListener('scroll', this.handleScroll);
    this.scrollRoot = null;
  }

  private connectRuntime() {
    this.observePageHeaderGeometry();
    this.observeHeader(this.responsiveMode === 'mobile' ? null : this.findHeader());
    this.connectScrollRoot();
  }

  private get effectiveVariant(): BarTitleVariant {
    return resolveShellPageHeaderVariant(
      this.headerPresentation,
      this.headerCapacity ?? 'roomy',
      this.scrollCompaction ? this.pageTopVisible : true
    );
  }

  private get headerContractResolved(): boolean {
    return this.headerPresentation !== 'auto' || this.headerCapacity !== undefined;
  }

  private get isScrollCompacted(): boolean {
    return (
      this.scrollCompaction &&
      this.headerPresentation === 'auto' &&
      this.headerCapacity === 'roomy' &&
      !this.pageTopVisible
    );
  }

  private get contentInsetStyles(): { [name: string]: string } {
    const styles: { [name: string]: string } = {};
    const expanded = this.contentInsetBlockStartSize?.trim();
    const compact = this.compactContentInsetBlockStartSize?.trim();
    if (expanded) styles['--ds-shell-page-content-block-start-inset'] = expanded;
    if (compact) styles['--ds-shell-page-compact-content-block-start-inset'] = compact;
    return styles;
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

  private get scrollRootResolved(): boolean {
    const shell = this.el.closest('ds-shell-app');
    if (!shell) return true;
    const expected = shell.querySelector<HTMLElement>('.shell-app__content');
    return expected !== null && this.scrollRoot === expected;
  }

  private handleScroll = () => {
    if (!this.sentinelEl || !this.scrollRoot) return;
    const rootTop =
      this.scrollRoot === window ? 0 : (this.scrollRoot as HTMLElement).getBoundingClientRect().top;
    this.syncHeaderDividerInset(rootTop);
    const nextPageTopVisible = this.sentinelEl.getBoundingClientRect().top >= rootTop;
    if (
      this.scrollCompaction &&
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

  private syncHeaderDividerInset(rootTop?: number) {
    const header = this.headerEl;
    if (!header) return;

    const ownsScrollTransition =
      this.scrollCompaction &&
      this.headerPresentation === 'auto' &&
      this.headerCapacity === 'roomy';
    const expandedInset = resolveCssLengthPx('--dimension-space-400', 0);
    if (
      !ownsScrollTransition ||
      !this.sentinelEl ||
      !this.scrollRoot ||
      this.headerTravel <= 0 ||
      expandedInset <= 0
    ) {
      header.style.removeProperty('--ds-bar-title-divider-inset');
      return;
    }

    const scrollRootTop =
      rootTop ??
      (this.scrollRoot === window
        ? 0
        : (this.scrollRoot as HTMLElement).getBoundingClientRect().top);
    const remainingTravel = this.sentinelEl.getBoundingClientRect().top - scrollRootTop;
    const progress = Math.min(1, Math.max(0, 1 - remainingTravel / this.headerTravel));
    header.style.setProperty('--ds-bar-title-divider-inset', `${expandedInset * (1 - progress)}px`);
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
    // Keep the largest observed expanded geometry for this header instance.
    // During a variant handoff Chromium can briefly report the compact box
    // before the child host class mutation is delivered; that transient must
    // not erase the flow reservation captured at the roomy page top.
    this.expandedHeaderHeight = Math.max(
      this.expandedHeaderHeight,
      header.getBoundingClientRect().height
    );
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
        this.scrollCompaction &&
        this.headerPresentation === 'auto' &&
        this.headerCapacity === 'roomy'
        ? `${-this.headerTravel}px`
        : '0px'
    );
  }

  private syncPageHeaderBlockSize() {
    const renderedHeight = this.stickyHeaderEl?.getBoundingClientRect().height ?? 0;
    if (renderedHeight > 0) {
      this.el.style.setProperty('--ds-shell-page-sticky-header-block-size', `${renderedHeight}px`);
    }
  }

  private observePageHeaderGeometry() {
    this.pageHeaderResizeObserver?.disconnect();
    this.pageHeaderResizeObserver = null;
    this.syncPageHeaderBlockSize();

    if (!this.stickyHeaderEl || typeof ResizeObserver === 'undefined') return;
    this.pageHeaderResizeObserver = new ResizeObserver(() => {
      this.syncPageHeaderBlockSize();
    });
    this.pageHeaderResizeObserver.observe(this.stickyHeaderEl);
  }

  private syncRenderedHeaderGeometry(header: BarTitleElement) {
    const renderedVariant = this.effectiveVariant;
    if (!header.classList.contains(this.variantClass(renderedVariant))) return;

    this.syncPageHeaderBlockSize();

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
      if (
        (geometryReady && this.scrollRootResolved && framesElapsed >= 2) ||
        framesRemaining <= 0
      ) {
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

    this.syncHeaderDividerInset();
    if (!this.headerContractResolved) {
      this.cancelHeaderReveal();
      header.setAttribute('data-shell-page-syncing', '');
      return;
    }

    const next = this.effectiveVariant;
    const renderedVariantIsStale = !header.classList.contains(this.variantClass(next));
    if (!renderedVariantIsStale) this.syncRenderedHeaderGeometry(header);
    if (renderedVariantIsStale && this.isScrollCompacted) {
      // Preserve the expanded flow before asking BarTitle to become compact.
      // This prevents the sentinel from moving back into view during the
      // parent/child render handoff and keeps the variant transition stable.
      this.setSpacerHeight(this.expandedHeaderHeight - this.compactHeaderHeight);
      this.setStickyHeaderOffset(next);
    }
    if (concealUntilSynced) {
      this.cancelHeaderReveal();
      header.setAttribute('data-shell-page-syncing', '');
    }
    if (header.variant !== next) {
      header.variant = next;
      // The child update and its MutationObserver callback can land in
      // different phases across engines. Poll the rendered class as the
      // authoritative handoff before committing sticky/spacer geometry.
      this.scheduleHeaderGeometrySync(header);
    }
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
    this.headerEl?.style.removeProperty('--ds-bar-title-divider-inset');
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
        childList: true,
        subtree: true,
      });
    }
    this.syncHeaderVariant(true);
    this.scheduleHeaderGeometrySync(header);
  }

  private handleHeaderSlotChange = (event: Event) => {
    if (this.responsiveMode === 'mobile') return;
    const slot = event.target as HTMLSlotElement;
    const header = slot
      .assignedElements()
      .find(element => element.tagName.toLowerCase() === 'ds-bar-title');
    this.observeHeader((header as BarTitleElement | undefined) ?? null);
  };

  render() {
    const mobile = this.responsiveMode === 'mobile';
    return (
      <Host
        role="main"
        style={this.contentInsetStyles}
        class={{
          'shell-page-host--inset-default': this.contentInset === 'default',
          'shell-page-host--inset-none': this.contentInset === 'none',
          'shell-page-host--block-start-inset-none': this.contentInsetBlockStart === 'none',
          'shell-page-host--surface-primary': this.contentSurface === 'primary',
          'shell-page-host--surface-secondary': this.contentSurface === 'secondary',
          'shell-page-host--mobile': mobile,
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
          <div
            class="shell-page__desktop-header"
            hidden={mobile}
            aria-hidden={mobile ? 'true' : undefined}
            inert={mobile ? true : undefined}
          >
            <slot name="header" onSlotchange={this.handleHeaderSlotChange} />
          </div>
          <div
            class="shell-page__mobile-header"
            hidden={!mobile}
            aria-hidden={!mobile ? 'true' : undefined}
            inert={!mobile ? true : undefined}
          >
            <slot name="mobile-header" />
          </div>
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
