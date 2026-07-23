import { Component, Event, EventEmitter, h, Host, Prop, State, Watch } from '@stencil/core';
import type { BreadcrumbItem, BreadcrumbSelectDetail } from './breadcrumb-types';

@Component({
  tag: 'ds-breadcrumb',
  styleUrl: 'Breadcrumb.css',
  scoped: true,
})
export class Breadcrumb {
  /** Ordered path from the broadest ancestor to the nearest page. */
  @Prop() items: BreadcrumbItem[] = [];

  /** Accessible name for the breadcrumb navigation landmark. */
  @Prop() ariaLabel: string = 'Breadcrumb';

  /** Emitted when an interactive breadcrumb item is activated. Prevent to cancel native navigation. */
  @Event({ cancelable: true }) dsSelect!: EventEmitter<BreadcrumbSelectDetail>;

  @State() private labelWidths: number[] = [];
  @State() private collapsedLabels: boolean[] = [];

  private navElement?: HTMLElement;
  private listElement?: HTMLOListElement;
  private measurementElements: HTMLElement[] = [];
  private separatorElements: HTMLElement[] = [];
  private ellipsisMeasurement?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private observedElement?: HTMLElement;
  private measurementFrame?: number;

  componentDidLoad() {
    this.observeContainer();
    this.scheduleMeasurement();
    void document.fonts?.ready.then(() => this.scheduleMeasurement());
  }

  componentDidRender() {
    this.observeContainer();
    this.scheduleMeasurement();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.observedElement = undefined;
    if (this.measurementFrame !== undefined) cancelAnimationFrame(this.measurementFrame);
  }

  @Watch('items')
  handleItemsChange() {
    this.labelWidths = [];
    this.collapsedLabels = [];
    this.scheduleMeasurement();
  }

  private observeContainer() {
    if (!this.navElement || this.observedElement === this.navElement) return;
    this.resizeObserver ??= new ResizeObserver(() => this.scheduleMeasurement());
    this.resizeObserver.disconnect();
    this.resizeObserver.observe(this.navElement);
    this.observedElement = this.navElement;
  }

  private scheduleMeasurement() {
    if (this.measurementFrame !== undefined) return;
    this.measurementFrame = requestAnimationFrame(() => {
      this.measurementFrame = undefined;
      this.measureLabels();
    });
  }

  private measureLabels() {
    if (
      !this.navElement ||
      !this.listElement ||
      !this.ellipsisMeasurement ||
      this.items.length === 0
    ) return;

    const naturalWidths = this.items.map(
      (_, index) => this.measurementElements[index]?.getBoundingClientRect().width ?? 0
    );
    const ellipsisWidth = this.ellipsisMeasurement.getBoundingClientRect().width;
    if (naturalWidths.some(width => width === 0) || ellipsisWidth === 0) return;

    const separatorWidth = this.separatorElements.reduce((total, separator) => {
      const styles = getComputedStyle(separator);
      return (
        total +
        separator.getBoundingClientRect().width +
        Number.parseFloat(styles.marginInlineStart) +
        Number.parseFloat(styles.marginInlineEnd)
      );
    }, 0);
    const availableWidth = Math.max(0, this.navElement.clientWidth - separatorWidth);
    const minimumWidths = naturalWidths.map(width => Math.min(width, ellipsisWidth));
    const nextWidths = [...minimumWidths];
    let remainingWidth = Math.max(
      0,
      availableWidth - minimumWidths.reduce((total, width) => total + width, 0)
    );

    // Protect the current/newest location. Extra width is granted newest-to-oldest,
    // so ancestors collapse in path order as the available space decreases.
    for (let index = naturalWidths.length - 1; index >= 0 && remainingWidth > 0; index -= 1) {
      const extraWidth = Math.min(
        remainingWidth,
        naturalWidths[index] - minimumWidths[index]
      );
      nextWidths[index] += extraWidth;
      remainingWidth -= extraWidth;
    }

    const widthsChanged =
      nextWidths.length !== this.labelWidths.length ||
      nextWidths.some(
        (width, index) => Math.abs(width - (this.labelWidths[index] ?? 0)) > 0.25
      );
    const nextCollapsedLabels = nextWidths.map(
      (width, index) =>
        naturalWidths[index] > minimumWidths[index] &&
        Math.abs(width - minimumWidths[index]) <= 0.25
    );
    const collapsedLabelsChanged =
      nextCollapsedLabels.length !== this.collapsedLabels.length ||
      nextCollapsedLabels.some(
        (isCollapsed, index) => isCollapsed !== this.collapsedLabels[index]
      );
    if (widthsChanged) this.labelWidths = nextWidths;
    if (collapsedLabelsChanged) this.collapsedLabels = nextCollapsedLabels;
  }

  private handleSelect(item: BreadcrumbItem, originalEvent: MouseEvent) {
    const event = this.dsSelect.emit({ item, originalEvent });
    if (event.defaultPrevented) originalEvent.preventDefault();
  }

  private renderItem(item: BreadcrumbItem, index: number) {
    const allocatedWidth = this.labelWidths[index];
    const isCollapsed = this.collapsedLabels[index] ?? false;
    const label = (
      [
        <ds-text
          class="breadcrumb__label"
          as="span"
          variant="text-caption"
          color="inherit"
          lineTruncation={isCollapsed ? 'none' : 1}
          aria-hidden={isCollapsed ? 'true' : undefined}
          style={
            allocatedWidth === undefined
              ? undefined
              : { '--breadcrumb-label-width': `${allocatedWidth}px` }
          }
        >
          {isCollapsed ? '…' : item.label}
        </ds-text>,
        isCollapsed ? <span class="breadcrumb__accessible-label">{item.label}</span> : null,
      ]
    );

    if (item.isCurrent) {
      return (
        <span class="breadcrumb__current" aria-current="page" aria-label={item.ariaLabel}>
          {label}
        </span>
      );
    }

    if (item.href) {
      return (
        <a
          class="breadcrumb__link ds-focus-ring"
          href={item.href}
          aria-label={item.ariaLabel}
          onClick={(event: MouseEvent) => this.handleSelect(item, event)}
        >
          {label}
        </a>
      );
    }

    return (
      <button
        class="breadcrumb__link ds-focus-ring"
        type="button"
        aria-label={item.ariaLabel}
        onClick={(event: MouseEvent) => this.handleSelect(item, event)}
      >
        {label}
      </button>
    );
  }

  render() {
    if (this.items.length === 0) return null;

    this.measurementElements = [];
    this.separatorElements = [];

    return (
      <Host>
        <nav
          class="breadcrumb"
          aria-label={this.ariaLabel}
          ref={element => {
            this.navElement = element;
          }}
        >
          <div class="breadcrumb__measurements" aria-hidden="true">
            {this.items.map((item, index) => (
              <ds-text
                class="breadcrumb__measurement"
                as="span"
                variant="text-caption"
                color="inherit"
                ref={element => {
                  if (element) this.measurementElements[index] = element;
                }}
              >
                {item.label}
              </ds-text>
            ))}
            <ds-text
              class="breadcrumb__measurement"
              as="span"
              variant="text-caption"
              color="inherit"
              ref={element => {
                this.ellipsisMeasurement = element;
              }}
            >
              …
            </ds-text>
          </div>
          <ol
            class="breadcrumb__list"
            ref={element => {
              this.listElement = element;
            }}
          >
            {this.items.map((item, index) => (
              <li class="breadcrumb__item" key={item.id}>
                {index > 0 ? (
                  <ds-text
                    class="breadcrumb__separator"
                    as="span"
                    variant="text-caption"
                    color="tertiary"
                    aria-hidden="true"
                    ref={element => {
                      if (element) this.separatorElements[index - 1] = element;
                    }}
                  >
                    /
                  </ds-text>
                ) : null}
                {this.renderItem(item, index)}
              </li>
            ))}
          </ol>
        </nav>
      </Host>
    );
  }
}
