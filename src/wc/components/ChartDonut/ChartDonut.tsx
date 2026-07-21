import { Component, Prop, State, Event, EventEmitter, Element, Watch, h, Host } from '@stencil/core';
import { arc, pie } from 'd3-shape';
import { categoryColor } from '../../utils/chart-colors';
import { formatCompactNumber, resolveCssLengthPx, truncateSvgTextToWidth, TOKEN_DEFAULTS } from '../../utils';
import type { ChartDatum } from '../../utils/chart-types';

const DIMMED_OPACITY = 0.25;
/** Gap between the center value and caption line boxes. */
const CENTER_GAP_PX = 0;
/** Fraction of the inner-circle diameter center text is allowed to use before truncating. */
const CENTER_TEXT_SAFE_WIDTH_RATIO = 0.82;
/** Fallback when filling before the first ResizeObserver measurement (matches fill min). */
const FILL_FALLBACK_PX = 128;

@Component({
  tag: 'ds-chart-donut',
  styleUrl: 'ChartDonut.css',
  scoped: true,
})
export class ChartDonut {
  @Prop() locale: string | undefined;
  @Prop() noDataLabel: string = 'No data';
  @Element() el!: HTMLElement;

  /** Slices to render. Set as a JS property (not an HTML attribute). */
  @Prop() data: ChartDatum[] = [];
  /**
   * Explicit diameter in px. When unset, the donut sizes to its container
   * (ResizeObserver) clamped between `--dimension-size-base * 16` (128px) and
   * `* 24` (192px), and stays centered in the leftover space. Prefer unset
   * inside card layouts.
   */
  @Prop() size: number | undefined;
  /** Ring thickness — number (px) or TokoMo length. Defaults to `--dimension-size-200` (16px). */
  @Prop() thickness: number | string = TOKEN_DEFAULTS.size200;
  /** Corner radius on each slice — number (px) or TokoMo length. Defaults to `--dimension-radius-025` (2px). */
  @Prop() cornerRadius: number | string = TOKEN_DEFAULTS.radius025;
  /** Gap between slices, in degrees. */
  @Prop() gap: number = 1;
  /**
   * Show a chart-owned value callout for genuine pointer or keyboard focus.
   * Disable when a visible legend already owns persistent label and value detail.
   */
  @Prop() showTooltip: boolean = true;
  /** Primary center value; defaults to the sum of `data` values (e.g. "187", "40.9%"). */
  @Prop() centerValue: string | undefined;
  /** Secondary caption below the center value (e.g. "Total", "Normal"). Rendered uppercase. */
  @Prop() centerCaption: string | undefined;
  /**
   * Externally controlled highlight, matched by `label` — e.g. drive this from a sibling
   * `ds-chart-legend`'s `dsItemHover` event to keep chart and legend hover in sync.
   * Falls back to this component's own pointer/focus hover when unset.
   * Slice hover dims peer slices and emits `dsSliceHover` for legend sync. External
   * highlight never opens the local tooltip.
   */
  @Prop() activeLabel: string | null = null;

  @State() private hoveredLabel: string | null = null;
  /** Center text, truncated with an ellipsis if it doesn't fit inside the inner circle. */
  @State() private displayedValueText: string = '';
  @State() private displayedCaptionText: string = '';
  /** Measured fill diameter when `size` is unset. */
  @State() private measuredSize: number = FILL_FALLBACK_PX;
  @State() private tooltipX: number = 0;
  @State() private tooltipY: number = 0;

  /** Fires with the hovered/focused slice's datum, or `null` on leave/blur. */
  @Event() dsSliceHover!: EventEmitter<ChartDatum | null>;

  private valueTextEl?: SVGTextElement;
  private captionTextEl?: SVGTextElement;
  private resizeObserver: ResizeObserver | null = null;

  private get isFillMode(): boolean {
    return this.size == null || !Number.isFinite(this.size) || this.size <= 0;
  }

  private get fillMinPx(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.donutFillMin, FILL_FALLBACK_PX);
  }

  private get fillMaxPx(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.donutFillMax, 192);
  }

  /** Clamp available square side into the fill min/max band. */
  private clampFillSize(availablePx: number): number {
    const minPx = this.fillMinPx;
    const maxPx = this.fillMaxPx;
    if (!(availablePx > 0)) return minPx;
    return Math.round(Math.min(maxPx, Math.max(minPx, availablePx)));
  }

  private get resolvedSize(): number {
    if (!this.isFillMode) return this.size as number;
    return this.clampFillSize(this.measuredSize);
  }

  componentDidLoad() {
    this.syncResizeObserver();
  }

  @Watch('size')
  onSizePropChange() {
    this.syncResizeObserver();
  }

  disconnectedCallback() {
    this.teardownResizeObserver();
  }

  private syncResizeObserver() {
    this.teardownResizeObserver();
    if (!this.isFillMode) return;
    // Observe the host (which fills its parent), not the wrapper — the wrapper
    // only wraps the SVG and would collapse to the clamped size, locking fill at min.
    const target = this.el;
    if (!target || typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      this.applyAvailableSize(entry.contentRect.width, entry.contentRect.height);
    });
    this.resizeObserver.observe(target);
    this.measureHost();
  }

  private measureHost() {
    const rect = this.el.getBoundingClientRect();
    this.applyAvailableSize(rect.width, rect.height);
  }

  private applyAvailableSize(width: number, height: number) {
    const available = Math.floor(Math.min(width, height));
    if (available > 0 && available !== this.measuredSize) {
      this.measuredSize = available;
    }
  }

  private teardownResizeObserver() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private handleHover(datum: ChartDatum | null) {
    this.hoveredLabel = datum?.label ?? null;
    this.dsSliceHover.emit(datum);
  }

  private get tooltipDatum(): ChartDatum | null {
    if (!this.showTooltip || this.hoveredLabel == null) return null;
    return this.data.find(datum => datum.label === this.hoveredLabel) ?? null;
  }

  private updateTooltipFromPointer(event: MouseEvent) {
    if (!this.showTooltip) return;
    const wrapper = this.el.querySelector<HTMLElement>('.chart-donut__wrapper');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    this.tooltipX = event.clientX - rect.left;
    this.tooltipY = event.clientY - rect.top;
  }

  private updateTooltipFromSvgPoint(
    path: SVGPathElement,
    svgX: number,
    svgY: number,
    viewBoxSize: number,
  ) {
    if (!this.showTooltip) return;
    const wrapper = this.el.querySelector<HTMLElement>('.chart-donut__wrapper');
    const svg = path.ownerSVGElement;
    if (!wrapper || !svg) return;
    const wrapperRect = wrapper.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    this.tooltipX = svgRect.left - wrapperRect.left + svgX * (svgRect.width / viewBoxSize);
    this.tooltipY = svgRect.top - wrapperRect.top + svgY * (svgRect.height / viewBoxSize);
  }

  componentDidRender() {
    // Re-bind after HMR when DidLoad's observer was dropped.
    if (this.isFillMode && !this.resizeObserver) {
      this.syncResizeObserver();
    }

    const size = this.resolvedSize;
    const radius = size / 2;
    const thicknessPx = resolveCssLengthPx(this.thickness, TOKEN_DEFAULTS.size200);
    const innerRadius = radius - thicknessPx;
    const maxWidth = innerRadius * 2 * CENTER_TEXT_SAFE_WIDTH_RATIO;
    const total = this.data.reduce((sum, d) => sum + d.value, 0);

    const fullValueText = this.centerValue ?? formatCompactNumber(total, this.locale);
    if (this.valueTextEl) {
      const truncated = truncateSvgTextToWidth(this.valueTextEl, fullValueText, maxWidth);
      if (truncated !== this.displayedValueText) this.displayedValueText = truncated;
      else this.valueTextEl.textContent = truncated;
    }

    const fullCaptionText = this.centerCaption ?? '';
    if (this.captionTextEl && fullCaptionText) {
      const truncated = truncateSvgTextToWidth(this.captionTextEl, fullCaptionText, maxWidth);
      if (truncated !== this.displayedCaptionText) this.displayedCaptionText = truncated;
      else this.captionTextEl.textContent = truncated;
    }
  }

  render() {
    const size = this.resolvedSize;
    const radius = size / 2;
    const thicknessPx = resolveCssLengthPx(this.thickness, TOKEN_DEFAULTS.size200);
    const cornerRadiusPx = resolveCssLengthPx(this.cornerRadius, TOKEN_DEFAULTS.radius025);
    const innerRadius = radius - thicknessPx;
    const total = this.data.reduce((sum, d) => sum + d.value, 0);
    // d3's pie() divides each value by the total to get an angle — with an all-zero total
    // that's 0/0, producing NaN angles and broken paths. Render a flat neutral ring instead.
    const isEmpty = total <= 0;
    // Highlight/dim from either this component's own hover or an externally-synced label
    // (e.g. a sibling ds-chart-legend row).
    const highlightLabel = this.activeLabel ?? this.hoveredLabel;

    const arcGenerator = arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(cornerRadiusPx)
      .padAngle((this.gap * Math.PI) / 180);

    const slices = isEmpty
      ? []
      : pie<ChartDatum>()
          .value(d => d.value)
          .sort(null)(this.data);

    const emptyRingPath = isEmpty
      ? arc<{ startAngle: number; endAngle: number }>()
          .innerRadius(innerRadius)
          .outerRadius(radius)({ startAngle: 0, endAngle: Math.PI * 2 })
      : null;

    // Precise vertical centering for the two-line center text, using the real line-height of
    // text-title-large (value) and text-body-medium (caption) rather than eyeballed em offsets.
    const valueLineHeight = resolveCssLengthPx(TOKEN_DEFAULTS.lineheightXl, 32);
    const captionLineHeight = resolveCssLengthPx(TOKEN_DEFAULTS.lineheightMd, 20);
    const centerValueY = this.centerCaption ? radius - (CENTER_GAP_PX + captionLineHeight) / 2 : radius;
    const centerCaptionY = radius + (valueLineHeight + CENTER_GAP_PX) / 2;

    // Show the full text before the post-render truncation pass has measured it (avoids a blank first paint).
    const fullValueText = this.centerValue ?? formatCompactNumber(total, this.locale);
    const fullCaptionText = this.centerCaption ?? '';
    const fill = this.isFillMode;

    return (
      <Host
        class={{
          'chart-donut': true,
          'chart-donut--fill': fill,
          'chart-donut--fixed': !fill,
        }}
        style={!fill ? { width: `${size}px`, height: `${size}px` } : undefined}
      >
        <div
          class="chart-donut__wrapper"
          style={!fill ? { width: `${size}px`, height: `${size}px` } : undefined}
        >
          <svg
            class="chart-donut__svg"
            viewBox={`0 0 ${size} ${size}`}
            width={size}
            height={size}
            role={isEmpty ? 'img' : undefined}
            aria-label={isEmpty ? this.noDataLabel : undefined}
          >
            <g transform={`translate(${radius}, ${radius})`}>
              {isEmpty ? (
                <path d={emptyRingPath ?? undefined} fill="var(--color-background-faint-neutral)" aria-hidden="true" />
              ) : (
                slices.map((slice, i) => {
                  const datum = this.data[i];
                  const isDimmed = highlightLabel != null && datum.label !== highlightLabel;
                  const [centroidX, centroidY] = arcGenerator.centroid(slice);
                  return (
                    <path
                      key={datum.label}
                      d={arcGenerator(slice) ?? undefined}
                      fill={datum.color ?? categoryColor(i)}
                      opacity={isDimmed ? DIMMED_OPACITY : 1}
                      tabindex={0}
                      role="img"
                      aria-label={`${datum.label}: ${datum.value}`}
                      onMouseEnter={(event: MouseEvent) => {
                        this.updateTooltipFromPointer(event);
                        this.handleHover(datum);
                      }}
                      onMouseMove={(event: MouseEvent) => this.updateTooltipFromPointer(event)}
                      onMouseLeave={() => this.handleHover(null)}
                      onFocus={(event: FocusEvent) => {
                        this.updateTooltipFromSvgPoint(
                          event.currentTarget as SVGPathElement,
                          radius + centroidX,
                          radius + centroidY,
                          size,
                        );
                        this.handleHover(datum);
                      }}
                      onBlur={() => this.handleHover(null)}
                    />
                  );
                })
              )}
            </g>
            <text
              class="chart-donut__center-value"
              x={radius}
              y={centerValueY}
              text-anchor="middle"
              dominant-baseline="central"
              ref={el => {
                this.valueTextEl = (el as SVGTextElement) ?? undefined;
              }}
            >
              {this.displayedValueText || fullValueText}
            </text>
            {fullCaptionText && (
              <text
                class="chart-donut__center-caption"
                x={radius}
                y={centerCaptionY}
                text-anchor="middle"
                dominant-baseline="central"
                ref={el => {
                  this.captionTextEl = (el as SVGTextElement) ?? undefined;
                }}
              >
                {this.displayedCaptionText || fullCaptionText}
              </text>
            )}
          </svg>
          {this.tooltipDatum && (
            <ds-tooltip-data-viz
              label={this.tooltipDatum.label}
              value={formatCompactNumber(this.tooltipDatum.value, this.locale)}
              x={this.tooltipX}
              y={this.tooltipY}
            />
          )}
        </div>
      </Host>
    );
  }
}
