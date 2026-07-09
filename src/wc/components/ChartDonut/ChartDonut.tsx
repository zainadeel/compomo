import { Component, Prop, State, Event, EventEmitter, h, Host } from '@stencil/core';
import { arc, pie } from 'd3-shape';
import { categoryColor } from '../../utils/chart-colors';
import { formatCompactNumber, resolveCssLengthPx, truncateSvgTextToWidth, TOKEN_DEFAULTS } from '../../utils';
import type { ChartDatum } from '../../utils/chart-types';

const DIMMED_OPACITY = 0.25;
/** Gap between the center value and caption line boxes. */
const CENTER_GAP_PX = 0;
/** Fraction of the inner-circle diameter center text is allowed to use before truncating. */
const CENTER_TEXT_SAFE_WIDTH_RATIO = 0.82;

type DonutTooltipState = {
  datum: ChartDatum;
  x: number;
  y: number;
};

@Component({
  tag: 'ds-chart-donut',
  styleUrl: 'ChartDonut.css',
  scoped: true,
})
export class ChartDonut {
  /** Slices to render. Set as a JS property (not an HTML attribute). */
  @Prop() data: ChartDatum[] = [];
  @Prop() size: number = 175;
  /** Ring thickness — number (px) or TokoMo length. Defaults to `--dimension-size-200` (16px). */
  @Prop() thickness: number | string = TOKEN_DEFAULTS.size200;
  /** Corner radius on each slice — number (px) or TokoMo length. Defaults to `--dimension-radius-025` (2px). */
  @Prop() cornerRadius: number | string = TOKEN_DEFAULTS.radius025;
  /** Gap between slices, in degrees. */
  @Prop() gap: number = 1;
  /** Primary center value; defaults to the sum of `data` values (e.g. "187", "40.9%"). */
  @Prop() centerValue: string | undefined;
  /** Secondary caption below the center value (e.g. "Total", "Normal"). Rendered uppercase. */
  @Prop() centerCaption: string | undefined;
  /**
   * Externally controlled highlight, matched by `label` — e.g. drive this from a sibling
   * `ds-chart-legend`'s `dsItemHover` event to keep chart and legend hover in sync.
   * Falls back to this component's own pointer/focus hover when unset.
   * External sync dims slices only — the data-viz tooltip is reserved for this
   * component's own pointer/keyboard interaction.
   */
  @Prop() activeLabel: string | null = null;

  @State() private hoveredLabel: string | null = null;
  /** Own-hover tooltip (cursor-following). Cleared on leave; not driven by `activeLabel`. */
  @State() private tooltip: DonutTooltipState | null = null;
  /** Center text, truncated with an ellipsis if it doesn't fit inside the inner circle. */
  @State() private displayedValueText: string = '';
  @State() private displayedCaptionText: string = '';

  /** Fires with the hovered/focused slice's datum, or `null` on leave/blur. */
  @Event() dsSliceHover!: EventEmitter<ChartDatum | null>;

  private valueTextEl?: SVGTextElement;
  private captionTextEl?: SVGTextElement;
  private wrapperEl?: HTMLDivElement;

  private handleHover(datum: ChartDatum | null, event?: MouseEvent) {
    this.hoveredLabel = datum?.label ?? null;
    this.dsSliceHover.emit(datum);
    if (!datum) {
      this.tooltip = null;
      return;
    }
    this.updateTooltip(datum, event);
  }

  private handleSliceMove(datum: ChartDatum, event: MouseEvent) {
    if (this.hoveredLabel !== datum.label) return;
    this.updateTooltip(datum, event);
  }

  private updateTooltip(datum: ChartDatum, event?: MouseEvent) {
    const wrapper = this.wrapperEl;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const x = event ? event.clientX - rect.left : this.size / 2;
    const y = event ? event.clientY - rect.top : this.size / 2;
    this.tooltip = { datum, x, y };
  }

  componentDidRender() {
    const radius = this.size / 2;
    const thicknessPx = resolveCssLengthPx(this.thickness, TOKEN_DEFAULTS.size200);
    const innerRadius = radius - thicknessPx;
    const maxWidth = innerRadius * 2 * CENTER_TEXT_SAFE_WIDTH_RATIO;
    const total = this.data.reduce((sum, d) => sum + d.value, 0);

    const fullValueText = this.centerValue ?? formatCompactNumber(total);
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
    const radius = this.size / 2;
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
    const fullValueText = this.centerValue ?? formatCompactNumber(total);
    const fullCaptionText = this.centerCaption ?? '';
    const tip = this.tooltip;

    return (
      <Host class="chart-donut">
        <div
          class="chart-donut__wrapper"
          style={{ width: `${this.size}px`, height: `${this.size}px` }}
          ref={el => {
            this.wrapperEl = (el as HTMLDivElement) ?? undefined;
          }}
        >
          <svg
            class="chart-donut__svg"
            viewBox={`0 0 ${this.size} ${this.size}`}
            width={this.size}
            height={this.size}
          >
            <g transform={`translate(${radius}, ${radius})`}>
              {isEmpty ? (
                <path d={emptyRingPath ?? undefined} fill="var(--color-background-faint-neutral)" aria-label="No data" />
              ) : (
                slices.map((slice, i) => {
                  const datum = this.data[i];
                  const isDimmed = highlightLabel != null && datum.label !== highlightLabel;
                  return (
                    <path
                      key={datum.label}
                      d={arcGenerator(slice) ?? undefined}
                      fill={datum.color ?? categoryColor(i)}
                      opacity={isDimmed ? DIMMED_OPACITY : 1}
                      tabindex={0}
                      role="img"
                      aria-label={`${datum.label}: ${datum.value}`}
                      onMouseEnter={(e: MouseEvent) => this.handleHover(datum, e)}
                      onMouseMove={(e: MouseEvent) => this.handleSliceMove(datum, e)}
                      onMouseLeave={() => this.handleHover(null)}
                      onFocus={() => this.handleHover(datum)}
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
          {tip && (
            <ds-tooltip-data-viz
              key={tip.datum.label}
              label={tip.datum.label}
              value={formatCompactNumber(tip.datum.value)}
              x={tip.x}
              y={tip.y}
            />
          )}
        </div>
      </Host>
    );
  }
}
