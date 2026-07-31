import { Component, Element, Event, EventEmitter, h, Host, Prop, State } from '@stencil/core';
import { resolveCssLengthPx, TOKEN_DEFAULTS } from '../../utils';
import type { TextColor, TextVariant } from '../Text/text-types';
import type { MetricTrend } from '../../utils/metric-change';
import type {
  CardOverviewLayout,
  CardOverviewVariant,
  OverviewMetric,
  OverviewScore,
} from './card-overview-types';
import {
  findNextOverviewMetricIndex,
  resolveCardOverviewCollapseGeometry,
  resolveOverviewRovingIndex,
} from './card-overview-controller';

/** Metric cells below this width drop a grid column rather than compress further. */
const DEFAULT_METRIC_MIN_WIDTH = 'var(--dimension-menu-width-xs)';

/** Skeleton cells rendered while loading with no metrics supplied yet. */
const LOADING_PLACEHOLDER_COUNT = 4;

/** Maximum number of comparable measures the summary bar presents at once. */
const MAX_METRIC_COUNT = 6;

const TREND_COLORS: Record<MetricTrend['tone'], TextColor> = {
  positive: 'var(--color-inverted-foreground-positive)',
  negative: 'var(--color-inverted-foreground-negative)',
  neutral: 'var(--color-inverted-foreground-secondary)',
};

const INVERTED_PRIMARY: TextColor = 'var(--color-inverted-foreground-primary)';
const INVERTED_SECONDARY: TextColor = 'var(--color-inverted-foreground-secondary)';

@Component({
  tag: 'ds-card-overview',
  styleUrl: 'CardOverview.css',
  scoped: true,
})
export class CardOverview {
  @Element() el!: HTMLElement;

  /** Full summary card, or the condensed 48px summary bar. */
  @Prop() variant: CardOverviewVariant = 'default';

  /** Intrinsic responsive layout, or a page-owned single-column stack. */
  @Prop() layout: CardOverviewLayout = 'auto';

  /** Leading summary block. Omit to render the bar without a headline figure. */
  @Prop() score: OverviewScore | undefined;

  /** Current reporting period, for example `Jun 29, 2026 – Jul 26, 2026`. */
  @Prop() periodLabel: string = '';

  /** Comparison caption, for example `vs Previous period`. */
  @Prop() comparisonLabel: string = '';

  /** Measures rendered in the responsive grid. Only the first six are shown. */
  @Prop() metrics: OverviewMetric[] = [];

  /**
   * Width a metric cell may shrink to before the grid drops a column. The grid
   * reflows and then stacks from this alone, so no measurement is required.
   */
  @Prop() metricMinWidth: string = DEFAULT_METRIC_MIN_WIDTH;

  /** Replace the score and metrics with skeletons while data resolves. */
  @Prop() isLoading: boolean = false;

  /** Message shown in place of the score when its figure cannot be resolved. */
  @Prop() scoreErrorMessage: string | undefined;

  /** Accessible name for the region. */
  @Prop() overviewLabel: string = 'Overview';

  /**
   * Page-controlled visual collapse from the full card (`0`) toward its 48px
   * compact handoff height (`1`). The component preserves its expanded flow
   * height, keeps elevation on the shrinking surface, and clips translated
   * content internally. The page still owns sticky positioning and the final
   * swap to `variant="compact"`.
   */
  @Prop() scrollCollapseProgress: number = 0;

  /** Emitted when a metric that is not inactive is activated. */
  @Event() dsMetricSelect!: EventEmitter<OverviewMetric>;

  /** Roving tab stop across selectable metrics. */
  @State() private focusedMetricIndex: number = 0;
  @State() private expandedHeight: number = 0;

  private layoutEl?: HTMLElement;
  private layoutResizeObserver: ResizeObserver | null = null;

  componentDidLoad() {
    this.observeLayout();
  }

  componentDidRender() {
    // Re-bind after HMR when DidLoad's observer was dropped.
    if (!this.layoutResizeObserver) this.observeLayout();
  }

  disconnectedCallback() {
    this.layoutResizeObserver?.disconnect();
    this.layoutResizeObserver = null;
  }

  private get hasScore(): boolean {
    return this.score !== undefined || this.scoreErrorMessage !== undefined || this.isLoading;
  }

  private get visibleMetrics(): OverviewMetric[] {
    return this.metrics.slice(0, MAX_METRIC_COUNT);
  }

  private get resolvedScrollCollapseProgress(): number {
    if (this.variant === 'compact' || !Number.isFinite(this.scrollCollapseProgress)) return 0;
    return Math.min(1, Math.max(0, this.scrollCollapseProgress));
  }

  private get scrollCollapseGeometry() {
    const compactHeight = resolveCssLengthPx(TOKEN_DEFAULTS.size600, 48);
    return resolveCardOverviewCollapseGeometry({
      variant: this.variant,
      progress: this.resolvedScrollCollapseProgress,
      expandedHeight: this.expandedHeight,
      compactHeight,
    });
  }

  private observeLayout() {
    const layout = this.layoutEl;
    if (!layout) return;

    const updateHeight = (height: number) => {
      if (height > 0 && Math.abs(height - this.expandedHeight) >= 0.5) {
        this.expandedHeight = height;
      }
    };

    updateHeight(layout.getBoundingClientRect().height);
    if (typeof ResizeObserver === 'undefined') return;

    this.layoutResizeObserver?.disconnect();
    this.layoutResizeObserver = new ResizeObserver(entries => {
      const height = entries[0]?.contentRect.height;
      if (height !== undefined) updateHeight(height);
    });
    this.layoutResizeObserver.observe(layout);
  }

  /** Index of the roving tab stop, skipping inactive metrics. */
  private get rovingIndex(): number {
    return resolveOverviewRovingIndex(this.visibleMetrics, this.focusedMetricIndex);
  }

  private selectMetric(metric: OverviewMetric, index: number) {
    if (metric.isInactive) return;
    this.focusedMetricIndex = index;
    this.dsMetricSelect.emit(metric);
  }

  /** Move the roving tab stop, wrapping and skipping inactive metrics. */
  private moveFocus(from: number, step: number) {
    const metrics = this.visibleMetrics;
    const next = findNextOverviewMetricIndex(metrics, from, step < 0 ? -1 : 1);
    if (next < 0) return;

    this.focusedMetricIndex = next;
    const cells = this.el.querySelectorAll<HTMLElement>('.card-overview__metric');
    cells[next]?.focus();
  }

  private handleMetricKeyDown = (event: KeyboardEvent, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.moveFocus(index, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.moveFocus(index, -1);
        break;
      default:
        break;
    }
  };

  /**
   * A skeleton bar matching the type metrics of the text it stands in for, so the
   * loading state holds the same shape and rhythm as the resolved content.
   *
   * `background` is always passed so the base and shimmer follow the card's
   * inverted surface in both themes.
   */
  private bar(textVariant: TextVariant, width: string, className?: string) {
    return (
      <ds-skeleton
        class={className}
        variant="text"
        textVariant={textVariant}
        width={width}
        background="inverted"
      />
    );
  }

  /**
   * Arrow and change in one text node.
   *
   * The arrow is a typeface glyph rather than an icon so it inherits the exact
   * size, weight, and baseline of the value beside it; an icon would need its
   * own size scale and would drift whenever the type scale changed.
   *
   * Tone is supplied by the caller and never inferred here.
   */
  private renderTrend(trend: MetricTrend | undefined, variant: TextVariant, emphasis = false) {
    if (!trend) return null;
    return (
      <ds-text
        as="span"
        class={{
          'card-overview__trend': true,
          [`card-overview__trend--${trend.tone}`]: true,
        }}
        variant={variant}
        emphasis={emphasis}
        color={TREND_COLORS[trend.tone]}
        fontFeature="tabular-nums"
      >
        {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
      </ds-text>
    );
  }

  private renderScore(compact: boolean) {
    if (this.isLoading) {
      if (compact) {
        return (
          <div class="card-overview__score ds-control--md" part="score">
            {this.bar('text-body-medium', '40px', 'card-overview__score-label')}
            <div class="card-overview__score-figure">
              {this.bar('text-body-medium', '24px')}
              {this.bar('text-body-medium', '32px')}
            </div>
          </div>
        );
      }

      return (
        <div class="card-overview__score ds-control--md" part="score">
          {/*
           * The label row is kept but left empty. It carries the control-height
           * box that aligns the score block with the period control, so dropping
           * it would shift the whole block up; a bar inside it would collide with
           * the figure, which sits under the label by design.
           */}
          <div class="card-overview__score-label-row" />
          <div class="card-overview__score-figure">
            {this.bar('text-display-medium', '56px')}
            {this.bar('text-body-small', '24px', 'card-overview__skeleton-baseline')}
          </div>
          {/*
           * Class goes on the skeleton itself, matching the resolved band. In a
           * wrapper the bar picks up inline leading and drops below the resolved
           * band position.
           */}
          {this.bar(
            'text-caption',
            '80px',
            'card-overview__score-band card-overview__score-band--loading'
          )}
        </div>
      );
    }

    if (this.scoreErrorMessage) {
      return (
        <div class="card-overview__score card-overview__score--error" part="score" role="alert">
          <ds-icon name="CircleExclamation" size="sm" color="inherit" aria-hidden="true" />
          <ds-text as="span" variant="text-body-medium" color="inherit">
            {this.scoreErrorMessage}
          </ds-text>
        </div>
      );
    }

    const score = this.score;
    if (!score) return null;

    return (
      <div class="card-overview__score card-overview__score--resolved ds-control--md" part="score">
        {/* The row owns cross-layout baseline geometry and becomes display: contents in compact mode. */}
        {/* eslint-disable-next-line local/prefer-direct-ds-text */}
        <div class="card-overview__score-label-row">
          <ds-text
            as="span"
            class="card-overview__score-label"
            variant="text-body-medium"
            emphasis={!compact}
            color={INVERTED_SECONDARY}
          >
            {score.label}
          </ds-text>
        </div>
        <div class="card-overview__score-figure">
          <ds-text
            as="span"
            class="card-overview__score-value"
            variant={compact ? 'text-body-medium' : 'text-display-medium'}
            emphasis
            color={INVERTED_PRIMARY}
            fontFeature="tabular-nums"
          >
            {score.value}
          </ds-text>
          {this.renderTrend(
            score.trend,
            compact ? 'text-body-medium' : 'text-body-small',
            !compact
          )}
        </div>
        {score.band && !compact && (
          <ds-text
            as="span"
            class="card-overview__score-band"
            variant="text-caption"
            color={INVERTED_SECONDARY}
          >
            {score.band}
          </ds-text>
        )}
      </div>
    );
  }

  private renderMetric(metric: OverviewMetric, index: number) {
    const selectable = !metric.isInactive;
    const label = (
      <ds-text
        as="span"
        class="card-overview__metric-label"
        variant="text-body-small"
        color={INVERTED_SECONDARY}
      >
        {metric.label}
      </ds-text>
    );

    return (
      <div
        class={{
          'card-overview__metric': true,
          'card-overview__metric--inactive': !selectable,
          // Selection targets get the shared wash; press scaling is not used here
          // so the grid keeps its columns aligned. See docs/control-press-policy.md.
          'ds-interaction-fill': selectable,
          'ds-interaction-fill--on-inverted': selectable,
          'ds-focus-ring-inset': selectable,
        }}
        part="metric"
        role={selectable ? 'button' : undefined}
        tabIndex={selectable && index === this.rovingIndex ? 0 : -1}
        onClick={() => this.selectMetric(metric, index)}
        onKeyDown={event => this.handleMetricKeyDown(event, index)}
        onFocusin={() => {
          if (selectable) this.focusedMetricIndex = index;
        }}
      >
        {metric.labelTooltip ? (
          <ds-tooltip label={metric.labelTooltip} side="top" size="sm">
            {label}
          </ds-tooltip>
        ) : (
          label
        )}
        <div class="card-overview__metric-figure">
          <ds-text
            as="span"
            class="card-overview__metric-value"
            variant="text-body-medium"
            color={INVERTED_PRIMARY}
            fontFeature="tabular-nums"
          >
            {metric.value}
          </ds-text>
          {this.renderTrend(metric.trend, 'text-body-medium')}
        </div>
      </div>
    );
  }

  private renderMetrics() {
    if (this.isLoading && this.metrics.length === 0) {
      return Array.from({ length: LOADING_PLACEHOLDER_COUNT }, (_, index) => (
        <div class="card-overview__metric" key={`loading-${index}`}>
          {this.bar('text-body-small', '70%', 'card-overview__metric-label')}
          <div class="card-overview__metric-figure">
            {this.bar('text-body-medium', '36px')}
            {/* text-body-medium, matching renderTrend for a metric — a smaller
             * variant here leaves the trend bar short of the value beside it. */}
            {this.bar('text-body-medium', '40px')}
          </div>
        </div>
      ));
    }

    return this.visibleMetrics.map((metric, index) => this.renderMetric(metric, index));
  }

  render() {
    const hasHeader = Boolean(this.periodLabel || this.comparisonLabel);
    const compact = this.variant === 'compact';
    const collapse = this.scrollCollapseGeometry;

    return (
      <Host
        class={{
          'card-overview': true,
          'card-overview--has-score': this.hasScore,
          'card-overview--compact': compact,
          'card-overview--stacked': !compact && this.layout === 'stacked',
          'card-overview--scroll-collapsing': collapse.active,
        }}
        role="region"
        aria-label={this.overviewLabel}
        aria-busy={this.isLoading ? 'true' : undefined}
        style={{
          '--ds-card-overview-metric-min': this.metricMinWidth,
          '--ds-card-overview-expanded-height': collapse.active
            ? `${collapse.expandedHeight}px`
            : undefined,
          '--ds-card-overview-visible-height': collapse.active
            ? `${collapse.visibleHeight}px`
            : undefined,
          '--ds-card-overview-content-offset': collapse.active
            ? `${collapse.offset}px`
            : undefined,
        }}
      >
        <div
          class={{
            'card-overview__surface': true,
            // Split shadow and inset highlight, so the opaque surface cannot cover
            // the highlight the way a combined elevation shadow would.
            'ds-control-elevation': true,
            'ds-control-elevation--sm': !compact,
            'ds-control-elevation--floating': compact,
          }}
        >
          <div class="card-overview__clip">
            <div
              ref={element => {
                this.layoutEl = (element as HTMLElement) ?? undefined;
              }}
              class={{
                'card-overview__layout': true,
                'card-overview__layout--has-score': this.hasScore,
              }}
            >
              <div class="card-overview__summary">
                {this.hasScore && this.renderScore(compact)}

                {/* `ds-control--md` supplies the 32px height and the label inset below. */}
                <div
                  class={{
                    'card-overview__header': true,
                    'card-overview__header--has-score': this.hasScore,
                    'ds-control--md': true,
                  }}
                >
                  {this.isLoading ? (
                    <div class="card-overview__period ds-control-label-box">
                      {this.bar('text-body-medium', '184px')}
                      {this.bar('text-body-medium', '248px')}
                    </div>
                  ) : (
                    hasHeader && (
                      <div class="card-overview__period ds-control-label-box">
                        {this.periodLabel && (
                          <ds-text
                            as="span"
                            class="card-overview__period-current ds-control-label-box"
                            variant="text-body-medium"
                            emphasis
                            color={INVERTED_PRIMARY}
                          >
                            {this.periodLabel}
                          </ds-text>
                        )}
                        {this.comparisonLabel && (
                          <ds-text
                            as="span"
                            class="card-overview__period-comparison ds-control-label-box"
                            variant="text-body-medium"
                            color={INVERTED_SECONDARY}
                          >
                            {this.comparisonLabel}
                          </ds-text>
                        )}
                      </div>
                    )
                  )}
                  <div class="card-overview__filter">
                    {/*
                      Period control is application owned: it varies by product surface.
                      While loading it is stood in for by a control-shaped skeleton so the
                      header keeps its resolved proportions.
                    */}
                    {this.isLoading ? (
                      <ds-skeleton
                        variant="control"
                        controlSize="md"
                        width="128px"
                        background="inverted"
                      />
                    ) : (
                      <slot name="filter" />
                    )}
                  </div>
                </div>
              </div>

              {!compact && (
                <div
                  class={{
                    'card-overview__body': true,
                    'card-overview__body--has-score': this.hasScore,
                  }}
                >
                  <div class="card-overview__metrics" part="metrics">
                    {this.renderMetrics()}
                  </div>

                  <slot name="footer" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
