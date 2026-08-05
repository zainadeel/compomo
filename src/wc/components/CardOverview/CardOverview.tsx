import {
  Component,
  Element,
  Event,
  EventEmitter,
  forceUpdate,
  h,
  Host,
  Prop,
  State,
} from '@stencil/core';
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
  resolveOverviewGridColumns,
  resolveOverviewRovingIndex,
  resolveSafetyScoreLevel,
} from './card-overview-controller';

/**
 * Metric cells below this width drop a grid column rather than compress further.
 *
 * A literal rather than a token: this is a layout threshold for a grid cell, and
 * the dimension scale has no token for that. The 200px tokens it could borrow
 * (`menu-width-xs`, `form-width-xs`, `panel-width-2xs`) all name other
 * components, so binding to one would couple this grid to an unrelated contract.
 * Consumers override with the `metricMinWidth` prop.
 */
const DEFAULT_METRIC_MIN_WIDTH = '200px';

/** Skeleton cells rendered while loading with no metrics supplied yet. */
const DEFAULT_LOADING_METRIC_COUNT = 5;

/** Maximum number of comparable measures the summary bar presents at once. */
const MAX_METRIC_COUNT = 7;

const TREND_COLORS: Record<MetricTrend['tone'], TextColor> = {
  positive: 'var(--color-always-dark-foreground-positive)',
  negative: 'var(--color-always-dark-foreground-negative)',
  neutral: 'var(--color-always-dark-foreground-secondary)',
};

const ALWAYS_DARK_PRIMARY: TextColor = 'var(--color-always-dark-foreground-primary)';
const ALWAYS_DARK_SECONDARY: TextColor = 'var(--color-always-dark-foreground-secondary)';

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

  /** Optional nonselectable safety score rendered as the first grid cell. */
  @Prop() score: OverviewScore | undefined;

  /** Fixed current date or range. Replaced by content in the `period` slot. */
  @Prop() periodLabel: string = '';

  /** Copy between the current period and comparison control, usually `vs.`. */
  @Prop() comparisonLabel: string = '';

  /** Measures rendered in the responsive grid. Only the first seven are shown. */
  @Prop() metrics: OverviewMetric[] = [];

  /**
   * Width a metric cell may shrink to before the grid drops a column. The grid
   * uses this threshold while choosing an evenly distributed column count.
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
   * height, keeps the period bar stationary, and moves/clips the grid beneath
   * it. The page still owns sticky positioning and the final compact handoff.
   */
  @Prop() scrollCollapseProgress: number = 0;

  /** Emitted when a metric that is not inactive is activated. */
  @Event() dsMetricSelect!: EventEmitter<OverviewMetric>;

  /** Roving tab stop across selectable metrics. */
  @State() private focusedMetricIndex: number = 0;
  @State() private expandedHeight: number = 0;
  @State() private gridColumns: number | undefined;

  private layoutEl?: HTMLElement;
  private layoutResizeObserver: ResizeObserver | null = null;
  /** The node the observer is bound to, which a later render can replace. */
  private observedLayoutEl?: HTMLElement;

  componentDidLoad() {
    this.observeLayout();
  }

  componentDidRender() {
    // Re-bind after HMR when DidLoad's observer was dropped, and whenever a
    // render swapped the layout node out from under the observer: the ref points
    // at the new node while the observer still watches the detached one, which
    // never resizes again. The grid would then keep its first measured column
    // count for the life of the component.
    if (!this.layoutResizeObserver || this.observedLayoutEl !== this.layoutEl) {
      this.observeLayout();
    } else {
      this.updateLayoutGeometry();
    }
  }

  disconnectedCallback() {
    this.layoutResizeObserver?.disconnect();
    this.layoutResizeObserver = null;
    this.observedLayoutEl = undefined;
  }

  private get visibleMetrics(): OverviewMetric[] {
    return this.metrics.slice(0, MAX_METRIC_COUNT);
  }

  private get visibleCellCount(): number {
    const metricCount = this.isLoading ? this.loadingMetricCount : this.visibleMetrics.length;
    return 1 + metricCount;
  }

  /** Preserve an authored data shape while loading, or use the standard six-cell grid. */
  private get loadingMetricCount(): number {
    return this.visibleMetrics.length || DEFAULT_LOADING_METRIC_COUNT;
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

    const bounds = layout.getBoundingClientRect();
    this.updateLayoutGeometry(bounds.width, bounds.height);
    if (typeof ResizeObserver === 'undefined') return;

    this.layoutResizeObserver?.disconnect();
    this.layoutResizeObserver = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) this.updateLayoutGeometry(rect.width, rect.height);
    });
    this.layoutResizeObserver.observe(layout);
    this.observedLayoutEl = layout;
  }

  private updateLayoutGeometry(width?: number, height?: number) {
    const layout = this.layoutEl;
    if (!layout) return;

    const bounds = width === undefined || height === undefined ? layout.getBoundingClientRect() : null;
    const resolvedWidth = width ?? bounds?.width ?? 0;
    const resolvedHeight = height ?? bounds?.height ?? 0;

    let changed = false;

    if (resolvedHeight > 0 && Math.abs(resolvedHeight - this.expandedHeight) >= 0.5) {
      this.expandedHeight = resolvedHeight;
      changed = true;
    }

    const columns = resolveOverviewGridColumns({
      cellCount: this.visibleCellCount,
      availableWidth: resolvedWidth,
      minCellWidth: resolveCssLengthPx(this.metricMinWidth, DEFAULT_METRIC_MIN_WIDTH),
    });
    if (columns !== this.gridColumns) {
      this.gridColumns = columns;
      changed = true;
    }

    // The column count is written straight to the host rather than through the
    // rendered style object. Measurement happens in `componentDidLoad` and in the
    // ResizeObserver callback, both outside a render cycle, and the host's style
    // is not patched again after the first render — so a rendered value would stay
    // pinned to whatever the first paint produced, before any width was known.
    if (this.gridColumns) {
      this.el.style.setProperty('--ds-card-overview-grid-columns', String(this.gridColumns));
    } else {
      this.el.style.removeProperty('--ds-card-overview-grid-columns');
    }

    if (changed) forceUpdate(this);
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
    const cells = this.el.querySelectorAll<HTMLElement>('.card-overview__metric-action');
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
   * permanently dark surface in both themes.
   */
  private bar(textVariant: TextVariant, width: string, className?: string) {
    return (
      <ds-skeleton
        class={className}
        variant="text"
        textVariant={textVariant}
        width={width}
        background="always-dark"
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
  private renderTrend(trend: MetricTrend | undefined, variant: TextVariant) {
    if (!trend) return null;
    return (
      <ds-text
        as="span"
        class={{
          'card-overview__trend': true,
          'ds-control-label-box': true,
          [`card-overview__trend--${trend.tone}`]: true,
        }}
        variant={variant}
        color={TREND_COLORS[trend.tone]}
        fontFeature="tabular-nums"
      >
        {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
      </ds-text>
    );
  }

  private renderScore() {
    if (this.isLoading) {
      return (
        <div class="card-overview__score" part="score">
          <div class="card-overview__score-content">
            <div class="card-overview__score-badge">
              {this.bar('text-display-medium', '56px')}
            </div>
            <div class="card-overview__score-copy">
              {this.bar('text-body-small', '64px', 'card-overview__score-label')}
              {this.bar('text-body-medium', '28px')}
            </div>
          </div>
        </div>
      );
    }

    const unavailableMessage =
      this.scoreErrorMessage || (!this.score ? 'Score unavailable' : undefined);
    if (unavailableMessage) {
      return (
        /* eslint-disable-next-line local/prefer-direct-ds-text -- The score track owns the grid divider and 8px outer inset. */
        <div class="card-overview__score" part="score">
          <ds-text
            as="span"
            class="card-overview__score-content card-overview__score-content--error"
            variant="text-body-medium"
            color="inherit"
            role="alert"
          >
            {unavailableMessage}
          </ds-text>
        </div>
      );
    }

    const score = this.score;
    if (!score) return null;
    const level = score.level ?? resolveSafetyScoreLevel(score.value);

    return (
      <div class="card-overview__score" part="score">
        <div class="card-overview__score-content">
          {/* eslint-disable-next-line local/prefer-direct-ds-text -- The fill owns its own box: it pads out to 52px and crops the display line box, which the text element cannot do to itself. */}
          <div
            class={{
              'card-overview__score-badge': true,
              [`card-overview__score-badge--${level}`]: Boolean(level),
            }}
          >
            <ds-text
              as="span"
              class="card-overview__score-value ds-control-label-box"
              variant="text-display-medium"
              emphasis
              color="inherit"
              fontFeature="tabular-nums"
            >
              {score.value}
            </ds-text>
          </div>
          <div class="card-overview__score-copy">
            <ds-text
              as="span"
              class="card-overview__score-label ds-control-label-box"
              variant="text-body-small"
              color={ALWAYS_DARK_SECONDARY}
            >
              {score.label}
            </ds-text>
            {this.renderTrend(score.trend, 'text-body-medium')}
          </div>
        </div>
      </div>
    );
  }

  private renderMetric(metric: OverviewMetric, index: number) {
    const selectable = !metric.isInactive;
    const label = (
      <ds-text
        as="span"
        class="card-overview__metric-label ds-control-label-box"
        variant="text-body-small"
        color={ALWAYS_DARK_SECONDARY}
      >
        {metric.label}
      </ds-text>
    );

    return (
      <div class="card-overview__metric" part="metric">
        <div
          class={{
            'card-overview__metric-action': true,
            'card-overview__metric-action--inactive': !selectable,
            // Selection targets get the shared wash; press scaling is not used here
            // so the grid keeps its columns aligned. See docs/control-press-policy.md.
            'ds-interaction-fill': selectable,
            'ds-interaction-fill--on-always-dark': selectable,
            'ds-focus-ring-inset': selectable,
          }}
          role={selectable ? 'button' : undefined}
          tabIndex={selectable && index === this.rovingIndex ? 0 : -1}
          onClick={() => this.selectMetric(metric, index)}
          onKeyDown={event => this.handleMetricKeyDown(event, index)}
          onFocusin={() => {
            if (selectable) this.focusedMetricIndex = index;
          }}
        >
          <div class="ds-interaction-fill__content card-overview__metric-content">
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
                class="card-overview__metric-value ds-control-label-box"
                variant="text-body-medium"
                color={ALWAYS_DARK_PRIMARY}
                fontFeature="tabular-nums"
              >
                {metric.value}
              </ds-text>
              {this.renderTrend(metric.trend, 'text-body-medium')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderMetrics() {
    if (this.isLoading) {
      return [
        this.renderScore(),
        ...Array.from({ length: this.loadingMetricCount }, (_, index) => (
          <div class="card-overview__metric" key={`loading-${index}`}>
            <div class="card-overview__metric-action card-overview__metric-action--inactive">
              <div class="card-overview__metric-content">
                {this.bar('text-body-small', '35%', 'card-overview__metric-label')}
                <div class="card-overview__metric-figure">
                  {this.bar('text-body-medium', '40px')}
                  {/* Match renderTrend's type canvas and the score trend's 28px width. */}
                  {this.bar('text-body-medium', '28px')}
                </div>
              </div>
            </div>
          </div>
        )),
      ];
    }

    return [
      this.renderScore(),
      ...this.visibleMetrics.map((metric, index) => this.renderMetric(metric, index)),
    ];
  }

  render() {
    const compact = this.variant === 'compact';
    const collapse = this.scrollCollapseGeometry;

    // Omit absent custom properties rather than handing them an undefined value.
    // Stencil serialises undefined to the string "undefined", which is invalid in
    // `repeat()` and voids the whole grid-template-columns declaration — the grid
    // then collapses to one implicit column instead of using the `auto-fit`
    // fallback baked into the stylesheet.
    const customProperties: Record<string, string> = {
      '--ds-card-overview-metric-min': this.metricMinWidth,
    };
    if (this.gridColumns) {
      customProperties['--ds-card-overview-grid-columns'] = String(this.gridColumns);
    }
    if (collapse.active) {
      customProperties['--ds-card-overview-expanded-height'] = `${collapse.expandedHeight}px`;
      customProperties['--ds-card-overview-visible-height'] = `${collapse.visibleHeight}px`;
      customProperties['--ds-card-overview-content-offset'] = `${collapse.offset}px`;
    }

    return (
      <Host
        class={{
          'card-overview': true,
          'card-overview--compact': compact,
          'card-overview--stacked': !compact && this.layout === 'stacked',
          'card-overview--scroll-collapsing': collapse.active,
        }}
        role="region"
        aria-label={this.overviewLabel}
        aria-busy={this.isLoading ? 'true' : undefined}
        style={customProperties}
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
              }}
            >
              <div class="card-overview__summary">
                <div class="card-overview__header ds-control--md">
                  <div class="card-overview__period">
                    <div class="card-overview__period-current">
                      <slot name="period">
                        {this.periodLabel && (
                          /* eslint-disable-next-line local/prefer-direct-ds-text -- Fixed copy uses the same structural frame and label inset as a slotted Select. */
                          <div class="card-overview__period-fixed ds-control-frame">
                            <ds-text
                              as="span"
                              class="ds-control-label-box"
                              variant="text-body-medium"
                              emphasis
                              color={ALWAYS_DARK_PRIMARY}
                            >
                              {this.periodLabel}
                            </ds-text>
                          </div>
                        )}
                      </slot>
                    </div>
                    {this.comparisonLabel && (
                      <ds-text
                        as="span"
                        class="card-overview__period-comparison ds-control-label-box"
                        variant="text-body-medium"
                        color={ALWAYS_DARK_SECONDARY}
                      >
                        {this.comparisonLabel}
                      </ds-text>
                    )}
                  </div>
                  <div class="card-overview__filter">
                    <slot name="filter" />
                  </div>
                </div>
              </div>

              {!compact && (
                <div class="card-overview__body">
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
