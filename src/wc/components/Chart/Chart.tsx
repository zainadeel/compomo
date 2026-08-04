import {
  Component,
  Element,
  Event,
  EventEmitter,
  Prop,
  State,
  Watch,
  h,
  Host,
} from '@stencil/core';
import type {
  ChartDefinition,
  ChartPoint,
  ChartTooltipItem,
  ChartTooltipOptions,
} from '../../utils/chart-grammar';
import {
  compileChartScene,
  findChartFocus,
  type ChartScene,
  type ChartSceneNode,
} from '../../utils/chart-scene';
import { resolveChartTheme } from '../../utils/chart-theme';

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 320;

export type ChartFocusSource = 'pointer' | 'keyboard';

export interface ChartFocusChangeDetail {
  primary: ChartPoint | null;
  points: readonly ChartPoint[];
  source: ChartFocusSource;
}

interface FocusState {
  primary: ChartPoint;
  points: ChartPoint[];
  source: ChartFocusSource;
}

@Component({
  tag: 'ds-chart',
  styleUrl: 'Chart.css',
  scoped: true,
})
export class Chart {
  @Element() el!: HTMLElement;

  /** Typed chart definition. Set as a JavaScript property, not an HTML attribute. */
  @Prop() definition!: ChartDefinition;
  /** Required accessible name for the visualization. */
  @Prop() label!: string;
  /** Optional longer accessible description. */
  @Prop() description?: string;
  /** Locale used by axes and default tooltip formatters. */
  @Prop() locale?: string;
  /** Fixed surface width. Otherwise the chart observes its container. */
  @Prop() width?: number;
  /** Product-owned surface height. Wins over aspectRatio. */
  @Prop() height?: number;
  /** Derives height from the current width when height is not supplied. */
  @Prop() aspectRatio?: number;

  /** Fires whenever pointer or keyboard focus resolves to semantic chart points. */
  @Event() dsChartFocusChange!: EventEmitter<ChartFocusChangeDetail>;

  @State() private surfaceWidth = DEFAULT_WIDTH;
  @State() private scene?: ChartScene;
  @State() private focusState?: FocusState;

  private resizeObserver?: ResizeObserver;
  private resizeFrame?: number;
  private compileFrame?: number;
  private warnedConflictingHeight = false;
  private measuredLabels = new Map<string, { width: number; height: number }>();
  private descriptionId = `ds-chart-description-${Math.random().toString(36).slice(2)}`;
  private clipId = `ds-chart-clip-${Math.random().toString(36).slice(2)}`;

  componentWillLoad() {
    if (this.width && this.width > 0) this.surfaceWidth = this.width;
    this.compile();
  }

  componentDidLoad() {
    this.connectResizeObserver();
    this.waitForFonts();
  }

  componentDidRender() {
    this.measureRenderedLabels();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
    if (this.compileFrame) cancelAnimationFrame(this.compileFrame);
  }

  @Watch('definition')
  @Watch('locale')
  @Watch('height')
  @Watch('aspectRatio')
  onDefinitionInputChange() {
    this.scheduleCompile();
  }

  @Watch('width')
  onWidthChange() {
    if (this.width && this.width > 0) this.surfaceWidth = this.width;
    else this.measureHost();
    this.scheduleCompile();
  }

  private get surfaceHeight(): number {
    if (this.height && this.height > 0) {
      if (this.aspectRatio && !this.warnedConflictingHeight) {
        this.warnedConflictingHeight = true;
        console.warn('[ds-chart] height wins when both height and aspectRatio are supplied.');
      }
      return this.height;
    }
    if (this.aspectRatio && this.aspectRatio > 0) {
      return Math.max(1, this.surfaceWidth / this.aspectRatio);
    }
    return DEFAULT_HEIGHT;
  }

  private connectResizeObserver() {
    this.resizeObserver?.disconnect();
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry || this.width) return;
      if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = undefined;
        this.applyMeasuredWidth(entry.contentRect.width);
      });
    });
    this.resizeObserver.observe(this.el);
    this.measureHost();
  }

  private measureHost() {
    if (this.width) return;
    this.applyMeasuredWidth(this.el.getBoundingClientRect().width);
  }

  private applyMeasuredWidth(width: number) {
    if (!(width > 0)) return;
    const next = Math.round(width * 100) / 100;
    if (next !== this.surfaceWidth) {
      this.surfaceWidth = next;
      this.scheduleCompile();
    }
  }

  private scheduleCompile() {
    if (this.compileFrame) cancelAnimationFrame(this.compileFrame);
    this.compileFrame = requestAnimationFrame(() => {
      this.compileFrame = undefined;
      this.compile();
    });
  }

  private compile() {
    if (!this.definition || !(this.surfaceWidth > 0) || !(this.surfaceHeight > 0)) return;
    const previousKey = this.focusState?.primary.sceneKey;
    const scene = compileChartScene(
      this.definition,
      this.surfaceWidth,
      this.surfaceHeight,
      this.locale ?? document.documentElement.lang ?? 'en',
      text => this.measuredLabels.get(text) ?? { width: text.length * 7, height: 14 },
      resolveChartTheme(this.el),
    );
    this.scene = scene;
    if (previousKey) {
      const restored = scene.points.find(point => point.sceneKey === previousKey);
      if (restored && this.focusState) {
        const grouped = findChartFocus(scene.points, scene.focus, restored.x, restored.y);
        this.focusState = grouped
          ? { ...grouped, source: this.focusState.source }
          : undefined;
      } else {
        this.focusState = undefined;
      }
    }
  }

  private waitForFonts() {
    if (!document.fonts) return;
    void document.fonts.ready.then(() => {
      this.measuredLabels.clear();
      this.scheduleCompile();
    });
  }

  private measureRenderedLabels() {
    const labels = this.el.querySelectorAll<SVGTextElement>('[data-chart-measure]');
    let changed = false;
    labels.forEach(label => {
      const text = label.textContent ?? '';
      let box: DOMRect;
      try {
        box = label.getBBox();
      } catch {
        return;
      }
      const previous = this.measuredLabels.get(text);
      if (!previous || Math.abs(previous.width - box.width) > 0.5 || Math.abs(previous.height - box.height) > 0.5) {
        this.measuredLabels.set(text, { width: box.width, height: box.height });
        changed = true;
      }
    });
    if (changed) this.scheduleCompile();
  }

  private resolveFocus(x: number, y: number, source: ChartFocusSource) {
    if (!this.scene) return;
    const result = findChartFocus(
      this.scene.points,
      this.scene.focus,
      x,
      y,
      this.scene.maxFocusDistance,
    );
    if (!result) {
      this.clearFocus(source);
      return;
    }
    if (
      this.focusState?.primary.sceneKey === result.primary.sceneKey &&
      this.focusState.source === source
    ) return;
    this.focusState = { ...result, source };
    this.dsChartFocusChange.emit({ ...result, source });
  }

  private clearFocus(source: ChartFocusSource) {
    if (!this.focusState) return;
    this.focusState = undefined;
    this.dsChartFocusChange.emit({ primary: null, points: [], source });
  }

  private onPointerMove = (event: PointerEvent) => {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    this.resolveFocus(event.clientX - rect.left, event.clientY - rect.top, 'pointer');
  };

  private keyboardPoints(): ChartPoint[] {
    if (!this.scene) return [];
    return [...this.scene.points].sort((a, b) => a.x - b.x || a.y - b.y);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const points = this.keyboardPoints();
    if (points.length === 0) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.clearFocus('keyboard');
      return;
    }
    const current = this.focusState
      ? points.findIndex(point => point.sceneKey === this.focusState?.primary.sceneKey)
      : -1;
    let next: number | undefined;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = points.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(points.length - 1, current + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(0, current < 0 ? 0 : current - 1);
    else return;
    event.preventDefault();
    const point = points[next ?? 0] ?? points[0];
    this.resolveFocus(point.x, point.y, 'keyboard');
  };

  private renderNode(node: ChartSceneNode, className = 'chart__mark') {
    const resolvedClassName = node.className ?? className;
    const presentation = {
      fill: node.style.fill,
      stroke: node.style.stroke,
      opacity: node.style.opacity,
      'fill-opacity': node.style.fillOpacity,
      'stroke-opacity': node.style.strokeOpacity,
      'stroke-width': node.style.strokeWidth,
      'stroke-dasharray': node.style.strokeDasharray || undefined,
    };
    if (node.type === 'path') return <path key={node.key} class={resolvedClassName} d={node.d} transform={node.transform} {...presentation} />;
    if (node.type === 'rect') {
      return <rect key={node.key} class={resolvedClassName} x={node.x} y={node.y} width={node.width} height={node.height} rx={node.style.radius} {...presentation} />;
    }
    if (node.type === 'circle') return <circle key={node.key} class={resolvedClassName} cx={node.x} cy={node.y} r={node.radius} {...presentation} />;
    if (node.type === 'line') return <line key={node.key} class={resolvedClassName} x1={node.x1} x2={node.x2} y1={node.y1} y2={node.y2} {...presentation} />;
    return <text key={node.key} class={node.className ?? `${className} chart__text-mark`} data-chart-measure={node.measure ? '' : undefined} x={node.x} y={node.y} dx={node.dx} dy={node.dy} text-anchor={node.style.textAnchor} font-family={node.style.fontFamily} font-size={node.style.fontSize} font-weight={node.style.fontWeight} dominant-baseline={node.dominantBaseline ?? 'middle'} transform={node.rotate ? `rotate(${node.rotate} ${node.x} ${node.y})` : undefined} {...presentation}>{node.text}</text>;
  }

  private tooltipContent(): { heading?: string; items: ChartTooltipItem[] } | undefined {
    if (!this.scene || !this.focusState || this.scene.tooltip === false) return undefined;
    const options: ChartTooltipOptions =
      typeof this.scene.tooltip === 'object' ? this.scene.tooltip : {};
    const locale = this.locale ?? document.documentElement.lang ?? 'en';
    const points = this.focusState.points;
    const formatValue = (point: ChartPoint) => {
      const value = point.value ?? point.yValue;
      return options.format?.(point, locale) ??
        (typeof value === 'number'
          ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
          : String(value));
    };
    return {
      heading:
        points.length > 1
          ? options.formatGroupHeading?.(points, locale) ?? String(this.focusState.primary.xValue)
          : undefined,
      items: points.map(point =>
        options.formatGroupItem?.(point, locale) ?? {
          label: point.groupLabel ?? point.markId,
          value: formatValue(point),
          color: point.color,
        },
      ),
    };
  }

  private statusText(): string {
    const content = this.tooltipContent();
    if (!content) return '';
    return [content.heading, ...content.items.map(item => `${item.label}: ${item.value}`)]
      .filter(Boolean)
      .join('. ');
  }

  render() {
    const scene = this.scene;
    const tooltip = this.tooltipContent();
    const focus = this.focusState?.primary;
    const center = focus && scene?.center?.focused
      ? scene.center.focused(focus, this.locale ?? document.documentElement.lang ?? 'en')
      : scene?.center;
    return (
      <Host
        class="chart"
        style={{
          '--ds-chart-width': this.width ? `${this.width}px` : '100%',
          '--ds-chart-height': `${this.surfaceHeight}px`,
        }}
      >
        {this.description && <span id={this.descriptionId} class="chart__description">{this.description}</span>}
        {scene && (
          /* eslint-disable-next-line local/prefer-ds-icon -- SVG is the chart renderer. */
          <svg
            class="chart__surface"
            width={scene.width}
            height={scene.height}
            viewBox={`0 0 ${scene.width} ${scene.height}`}
            role="img"
            aria-label={this.label || 'Chart'}
            aria-describedby={this.description ? this.descriptionId : undefined}
            tabindex={0}
            onPointerMove={this.onPointerMove}
            onPointerLeave={() => this.clearFocus('pointer')}
            onKeyDown={this.onKeyDown}
          >
            <defs aria-hidden="true">
              <clipPath id={this.clipId}>
                <rect x={scene.plot.left} y={scene.plot.top} width={scene.plot.width} height={scene.plot.height} />
              </clipPath>
            </defs>
            <g class="chart__guides" aria-hidden="true">
              {scene.guides.map(node => this.renderNode(node, 'chart__grid chart__polar-guide'))}
              {scene.yAxis.line && <line class="chart__axis-line" x1={scene.plot.left} x2={scene.plot.left} y1={scene.plot.top} y2={scene.plot.bottom} />}
              {scene.yAxis.ticks.map(tick => (
                <g key={`y-${tick.key}`}>
                  {scene.yAxis.grid && <line class="chart__grid" x1={scene.plot.left} x2={scene.plot.right} y1={tick.position} y2={tick.position} />}
                  <line class="chart__axis-line chart__tick-stub" x1={scene.plot.left - scene.yAxis.tickSize} x2={scene.plot.left} y1={tick.position} y2={tick.position} />
                  {tick.labelVisible && <text data-chart-measure class="chart__tick chart__tick--y" x={scene.plot.left - scene.yAxis.tickSize - scene.yAxis.tickPadding} y={tick.position} text-anchor="end" dominant-baseline="middle">{tick.label}</text>}
                </g>
              ))}
              {scene.xAxis.line && <line class="chart__axis-line" x1={scene.plot.left} x2={scene.plot.right} y1={scene.plot.bottom} y2={scene.plot.bottom} />}
              {scene.xAxis.ticks.map(tick => (
                <g key={`x-${tick.key}`}>
                  {scene.xAxis.grid && <line class="chart__grid" x1={tick.position} x2={tick.position} y1={scene.plot.top} y2={scene.plot.bottom} />}
                  <line class="chart__axis-line chart__tick-stub" x1={tick.position} x2={tick.position} y1={scene.plot.bottom} y2={scene.plot.bottom + scene.xAxis.tickSize} />
                  {tick.labelVisible && <text data-chart-measure class="chart__tick chart__tick--x" x={tick.position} y={scene.plot.bottom + scene.xAxis.tickSize + scene.xAxis.tickPadding} text-anchor="middle" dominant-baseline="hanging" transform={scene.xAxis.rotate ? `rotate(${scene.xAxis.rotate} ${tick.position} ${scene.plot.bottom + scene.xAxis.tickSize + scene.xAxis.tickPadding})` : undefined}>{tick.label}</text>}
                </g>
              ))}
              {scene.xAxis.label && <text class="chart__axis-title" x={(scene.plot.left + scene.plot.right) / 2} y={scene.height - 4} text-anchor="middle">{scene.xAxis.label}</text>}
              {scene.yAxis.label && <text class="chart__axis-title" x="8" y={(scene.plot.top + scene.plot.bottom) / 2} text-anchor="middle" dominant-baseline="middle" transform={`rotate(-90 8 ${(scene.plot.top + scene.plot.bottom) / 2})`}>{scene.yAxis.label}</text>}
              {scene.coordinate === 'cartesian' && (
                <g class="chart__plot-frame">
                  <line class="chart__plot-boundary chart__plot-boundary--top" x1={scene.plot.left} x2={scene.plot.right} y1={scene.plot.top} y2={scene.plot.top} />
                  <line class="chart__plot-boundary chart__plot-boundary--right" x1={scene.plot.right} x2={scene.plot.right} y1={scene.plot.top} y2={scene.plot.bottom} />
                </g>
              )}
            </g>
            <g class="chart__marks" aria-hidden="true" clip-path={scene.clip ? `url(#${this.clipId})` : undefined}>{scene.nodes.map(node => this.renderNode(node))}</g>
            {focus && <circle class="chart__focus" cx={focus.x} cy={focus.y} r="6" aria-hidden="true" />}
            {center?.value && (
              <text
                class="chart__center-value"
                x={(scene.plot.left + scene.plot.right) / 2}
                y={(scene.plot.top + scene.plot.bottom) / 2 - (center.caption ? 10 : 0)}
                text-anchor="middle"
                dominant-baseline="middle"
                aria-hidden="true"
              >
                {center.value}
              </text>
            )}
            {center?.caption && (
              <text
                class="chart__center-caption"
                x={(scene.plot.left + scene.plot.right) / 2}
                y={(scene.plot.top + scene.plot.bottom) / 2 + 14}
                text-anchor="middle"
                dominant-baseline="middle"
                aria-hidden="true"
              >
                {center.caption}
              </text>
            )}
          </svg>
        )}
        {tooltip && focus && (
          <ds-tooltip-chart
            heading={tooltip.heading}
            items={tooltip.items}
            x={focus.x}
            y={focus.y}
          />
        )}
        <span class="chart__status" aria-live="polite" aria-atomic="true">{this.statusText()}</span>
      </Host>
    );
  }
}
