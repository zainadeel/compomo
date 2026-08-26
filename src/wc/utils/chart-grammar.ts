import { bin as d3Bin, deviation, extent, quantileSorted, ticks } from 'd3-array';
import type { CurveFactory } from 'd3-shape';

export type ChartValue = string | number | Date;
export type ChartKey = string | number;
export type ChartDataIntent = 'brand' | 'caution' | 'negative' | 'neutral' | 'positive' | 'warning';

export type ChartChannel<TDatum, TValue> =
  | Extract<keyof TDatum, string>
  | ((datum: TDatum, index: number, data: readonly TDatum[]) => TValue);

export type ChartVisual<TDatum, TValue> =
  | TValue
  | ((datum: TDatum, index: number, data: readonly TDatum[]) => TValue);

/** Structural boundary accepted by the chart compiler for native D3 scales. */
export type ChartScale = ((value: ChartValue) => unknown) & {
  copy?: () => ChartScale;
  domain: (...values: unknown[]) => unknown;
  range: (...values: unknown[]) => unknown;
  bandwidth?: () => number;
  ticks?: (count?: number) => ChartValue[];
  tickFormat?: (count?: number) => (value: ChartValue) => string;
  nice?: (count?: number) => unknown;
};

/** A configured D3 scale or a zero-argument D3 scale factory. */
export type ChartScaleSource = ChartScale | (() => unknown);

export interface ChartTickOptions {
  count?: number;
  values?: readonly ChartValue[];
  format?: (value: ChartValue, locale: string) => string;
  /** Minimum measured gap between adjacent tick labels, in CSS pixels. */
  spacing?: number;
  /** Length of the tick stub extending away from the plot, in CSS pixels. */
  size?: number;
  /** Gap between the end of a tick stub and its label, in CSS pixels. */
  padding?: number;
  /** Rotation in degrees. Negative values rotate counter-clockwise. */
  rotate?: number;
}

export interface ChartAxisPresentation {
  label?: string;
  /** Render the axis baseline. Defaults to true. */
  line?: boolean;
  ticks?: ChartTickOptions;
}

export interface ChartAxisOptions {
  scale: ChartScaleSource;
  nice?: boolean;
  grid?: boolean;
  axis?: false | ChartAxisPresentation;
}

export interface ChartMargin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export type ChartFocusMode = 'none' | 'nearest' | 'nearest-x' | 'nearest-y' | 'group-x' | 'group-y';

export interface ChartPoint<TDatum = unknown> {
  key: ChartKey;
  sceneKey: string;
  markId: string;
  datum: TDatum;
  datumIndex: number;
  groupValue?: ChartValue;
  groupLabel?: string;
  xValue: ChartValue;
  yValue: ChartValue;
  /** Primary semantic value for polar, heatmap, and distribution marks. */
  value?: ChartValue;
  angleValue?: ChartValue;
  radiusValue?: ChartValue;
  x: number;
  y: number;
  color: string;
}

export interface ChartTooltipItem {
  label: string;
  value: string;
  color?: string;
}

export interface ChartTooltipContext<TDatum = unknown> {
  locale: string;
  primary: ChartPoint<TDatum>;
  points: readonly ChartPoint<TDatum>[];
}

export interface ChartTooltipOptions<TDatum = unknown> {
  format?: (point: ChartPoint<TDatum>, locale: string) => string;
  formatGroupHeading?: (points: readonly ChartPoint<TDatum>[], locale: string) => string;
  formatGroupItem?: (point: ChartPoint<TDatum>, locale: string) => ChartTooltipItem;
}

export type ChartTooltip<TDatum = unknown> = boolean | ChartTooltipOptions<TDatum>;

export interface ChartColorOptions {
  domain?: readonly ChartValue[];
  range?: readonly string[];
}

export interface ChartBuildContext {
  width: number;
  height: number;
}

export interface ChartCartesianCoordinate {
  type?: 'cartesian';
}

export interface ChartPolarCoordinate {
  type: 'polar';
  /** Radians measured clockwise from twelve o'clock. */
  startAngle?: number;
  /** Radians measured clockwise from twelve o'clock. */
  endAngle?: number;
  /** Default inner radius as a fraction of the available radius. */
  innerRadius?: number;
  /** Outer radius as a fraction of the available radius. */
  outerRadius?: number;
  grid?: 'none' | 'polygon';
}

export type ChartCoordinate = ChartCartesianCoordinate | ChartPolarCoordinate;

export interface ChartPolarAxisOptions {
  domain?: readonly ChartValue[];
  label?: string;
  ticks?: ChartTickOptions;
  grid?: boolean;
}

export interface ChartCenterContent {
  value?: string;
  caption?: string;
}

export interface ChartCenterOptions extends ChartCenterContent {
  /** Optional focused content. Authored content remains the default. */
  focused?: (point: ChartPoint, locale: string) => ChartCenterContent;
}

export type ChartMarkKind =
  | 'polar'
  | 'line-y'
  | 'area-y'
  | 'bar-x'
  | 'bar-y'
  | 'box-y'
  | 'dot'
  | 'rule-x'
  | 'rule-y'
  | 'band-x'
  | 'band-y'
  | 'rect'
  | 'cell'
  | 'text'
  | 'arc'
  | 'radial-line'
  | 'radial-area'
  | 'radial-dot';

export interface ChartMark<TDatum = unknown> {
  kind: ChartMarkKind;
  data: readonly TDatum[];
  options: ChartMarkOptions<TDatum>;
}

export interface ChartPolarContainerOptions {
  id?: string;
  marks: readonly ChartMark[];
  angle?: ChartPolarAxisOptions;
  radius?: ChartAxisOptions;
  /** Radians measured clockwise from twelve o'clock. */
  startAngle?: number;
  /** Radians measured clockwise from twelve o'clock. */
  endAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  grid?: 'none' | 'polygon';
  center?: ChartCenterOptions;
}

export interface ChartBaseMarkOptions<TDatum> {
  id?: string;
  /** Exclude decorative layers from semantic focus while retaining rendering. */
  interactive?: boolean;
  key?: ChartChannel<TDatum, ChartKey>;
  z?: ChartChannel<TDatum, ChartValue | null | undefined>;
  color?: ChartChannel<TDatum, ChartValue | null | undefined>;
  value?: ChartChannel<TDatum, ChartValue | null | undefined>;
  fill?: ChartVisual<TDatum, string>;
  stroke?: ChartVisual<TDatum, string>;
  opacity?: ChartVisual<TDatum, number>;
  fillOpacity?: ChartVisual<TDatum, number>;
  strokeOpacity?: ChartVisual<TDatum, number>;
  strokeWidth?: ChartVisual<TDatum, number | string>;
  strokeDasharray?: ChartVisual<TDatum, string>;
}

export interface ChartLineYOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  x?: ChartChannel<TDatum, ChartValue | null | undefined>;
  y?: ChartChannel<TDatum, number | null | undefined>;
  curve?: CurveFactory;
}

export interface ChartAreaYOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  x?: ChartChannel<TDatum, ChartValue | null | undefined>;
  y?: ChartChannel<TDatum, number | null | undefined>;
  y1?: ChartChannel<TDatum, number | null | undefined>;
  y2?: ChartChannel<TDatum, number | null | undefined>;
  curve?: CurveFactory;
}

export type ChartBarLayout = 'single' | 'grouped' | 'stacked';

export interface ChartBarOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  x?: ChartChannel<TDatum, ChartValue | null | undefined>;
  y?: ChartChannel<TDatum, ChartValue | null | undefined>;
  x1?: ChartChannel<TDatum, number | null | undefined>;
  x2?: ChartChannel<TDatum, number | null | undefined>;
  y1?: ChartChannel<TDatum, number | null | undefined>;
  y2?: ChartChannel<TDatum, number | null | undefined>;
  layout?: ChartBarLayout;
  inset?: ChartVisual<TDatum, number>;
  radius?: ChartVisual<TDatum, number | string>;
}

export interface ChartBoxYOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  x?: ChartChannel<TDatum, ChartValue | null | undefined>;
  y?: ChartChannel<TDatum, number | null | undefined>;
  /** Tukey whisker multiplier. */
  whisker?: number;
  inset?: number;
  radius?: number | string;
}

export interface ChartDotOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  x?: ChartChannel<TDatum, ChartValue | null | undefined>;
  y?: ChartChannel<TDatum, ChartValue | null | undefined>;
  r?: ChartVisual<TDatum, number | string>;
}

export interface ChartRuleOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  x?: ChartChannel<TDatum, ChartValue | null | undefined>;
  y?: ChartChannel<TDatum, ChartValue | null | undefined>;
}

export interface ChartBandOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  x1?: ChartChannel<TDatum, number | null | undefined>;
  x2?: ChartChannel<TDatum, number | null | undefined>;
  y1?: ChartChannel<TDatum, number | null | undefined>;
  y2?: ChartChannel<TDatum, number | null | undefined>;
}

export interface ChartRectOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  x1?: ChartChannel<TDatum, number | null | undefined>;
  x2?: ChartChannel<TDatum, number | null | undefined>;
  y1?: ChartChannel<TDatum, number | null | undefined>;
  y2?: ChartChannel<TDatum, number | null | undefined>;
  radius?: ChartVisual<TDatum, number | string>;
  inset?: ChartVisual<TDatum, number>;
}

export interface ChartCellOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  x?: ChartChannel<TDatum, ChartValue | null | undefined>;
  y?: ChartChannel<TDatum, ChartValue | null | undefined>;
  intensity?: ChartChannel<TDatum, number | null | undefined>;
  intent?: ChartDataIntent;
  minimumOpacity?: number;
  maximumOpacity?: number;
  inset?: number;
  radius?: number | string;
}

export interface ChartTextOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  x?: ChartChannel<TDatum, ChartValue | null | undefined>;
  y?: ChartChannel<TDatum, ChartValue | null | undefined>;
  text?: ChartChannel<TDatum, string | number | null | undefined>;
  fontFamily?: ChartVisual<TDatum, string>;
  fontSize?: ChartVisual<TDatum, number | string>;
  fontWeight?: ChartVisual<TDatum, number | string>;
  textAnchor?: ChartVisual<TDatum, 'start' | 'middle' | 'end'>;
  dx?: ChartVisual<TDatum, number>;
  dy?: ChartVisual<TDatum, number>;
}

export interface ChartArcOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  theta1?: ChartChannel<TDatum, number | null | undefined>;
  theta2?: ChartChannel<TDatum, number | null | undefined>;
  innerRadius?: ChartVisual<TDatum, number>;
  outerRadius?: ChartVisual<TDatum, number>;
  cornerRadius?: ChartVisual<TDatum, number>;
  padAngle?: ChartVisual<TDatum, number>;
  label?: ChartChannel<TDatum, string | null | undefined>;
}

export interface ChartRadialOptions<TDatum> extends ChartBaseMarkOptions<TDatum> {
  angle?: ChartChannel<TDatum, ChartValue | null | undefined>;
  radius?: ChartChannel<TDatum, number | null | undefined>;
  radius1?: ChartChannel<TDatum, number | null | undefined>;
  radius2?: ChartChannel<TDatum, number | null | undefined>;
  curve?: CurveFactory;
  r?: ChartVisual<TDatum, number | string>;
}

export type ChartMarkOptions<TDatum> =
  | ChartLineYOptions<TDatum>
  | ChartAreaYOptions<TDatum>
  | ChartBarOptions<TDatum>
  | ChartBoxYOptions<TDatum>
  | ChartDotOptions<TDatum>
  | ChartRuleOptions<TDatum>
  | ChartBandOptions<TDatum>
  | ChartRectOptions<TDatum>
  | ChartCellOptions<TDatum>
  | ChartTextOptions<TDatum>
  | ChartArcOptions<TDatum>
  | ChartRadialOptions<TDatum>;

export interface ChartSpec<TDatum = unknown> {
  marks: readonly ChartMark<TDatum>[] | readonly ChartMark<unknown>[];
  coordinate?: ChartCoordinate;
  x?: ChartAxisOptions;
  y?: ChartAxisOptions;
  angle?: ChartPolarAxisOptions;
  radius?: ChartAxisOptions;
  center?: ChartCenterOptions;
  margin?: number | ChartMargin;
  guides?: boolean;
  /** Clip graphical marks to the solved plot rectangle. Defaults to true. */
  clip?: boolean;
  color?: ChartColorOptions;
  focus?: ChartFocusMode;
  tooltip?: ChartTooltip<TDatum>;
  maxFocusDistance?: number;
}

export type ChartSpecBuilder<TDatum = unknown> = (context: ChartBuildContext) => ChartSpec<TDatum>;

export interface ChartDefinition<TDatum = unknown> {
  chart: ChartSpec<TDatum> | ChartSpecBuilder<TDatum>;
}

export interface NormalizedStackDatum<TDatum> {
  data: TDatum;
  group: ChartKey;
  series: ChartKey;
  value: number;
  proportion: number;
}

export interface NormalizeStackOptions<TDatum> {
  group: ChartChannel<TDatum, ChartKey>;
  series: ChartChannel<TDatum, ChartKey>;
  value: ChartChannel<TDatum, number>;
}

export interface ChartPieDatum<TDatum> {
  data: TDatum;
  index: number;
  key: ChartKey;
  label: string;
  value: number;
  theta1: number;
  theta2: number;
}

export interface ChartPieOptions<TDatum> {
  value: ChartChannel<TDatum, number>;
  key?: ChartChannel<TDatum, ChartKey>;
  label?: ChartChannel<TDatum, string>;
  sort?: (a: TDatum, b: TDatum) => number;
}

export interface ChartBinDatum<TDatum> {
  key: string;
  x1: number;
  x2: number;
  x: number;
  count: number;
  cumulative: number;
  rows: readonly TDatum[];
}

export interface ChartBinOptions<TDatum> {
  value: ChartChannel<TDatum, number>;
  thresholds?: number | readonly number[];
}

export interface ChartDensityDatum {
  key: string;
  x: number;
  density: number;
}

export interface ChartDensityOptions<TDatum> {
  value: ChartChannel<TDatum, number>;
  samples?: number;
  bandwidth?: number;
}

export function defineChart<TDatum>(
  chart: ChartSpec<TDatum> | ChartSpecBuilder<TDatum>
): ChartDefinition<TDatum> {
  return { chart };
}

function createMark<TDatum, TOptions extends ChartMarkOptions<TDatum>>(
  kind: ChartMarkKind,
  data: readonly TDatum[],
  options: TOptions
): ChartMark<TDatum> {
  return { kind, data, options };
}

/** Compose polar marks and guides inside the shared chart scene. */
export function polar(options: ChartPolarContainerOptions): ChartMark {
  return { kind: 'polar', data: [], options: options as unknown as ChartMarkOptions<unknown> };
}

const identity = <TValue>(value: TValue): TValue => value;

export function lineY<TDatum>(
  data: readonly TDatum[],
  options: ChartLineYOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('line-y', data, {
    x: options.x ?? ((_, index) => index),
    y: options.y ?? (identity as ChartChannel<TDatum, number>),
    ...options,
  });
}

export function areaY<TDatum>(
  data: readonly TDatum[],
  options: ChartAreaYOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('area-y', data, {
    x: options.x ?? ((_, index) => index),
    y: options.y ?? (identity as ChartChannel<TDatum, number>),
    ...options,
  });
}

export function barY<TDatum>(
  data: readonly TDatum[],
  options: ChartBarOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('bar-y', data, {
    x: options.x ?? ((_, index) => index),
    y: options.y ?? (identity as ChartChannel<TDatum, number>),
    ...options,
  });
}

export function barX<TDatum>(
  data: readonly TDatum[],
  options: ChartBarOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('bar-x', data, {
    x: options.x ?? (identity as ChartChannel<TDatum, number>),
    y: options.y ?? ((_, index) => index),
    ...options,
  });
}

export function boxY<TDatum>(
  data: readonly TDatum[],
  options: ChartBoxYOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('box-y', data, {
    x: options.x ?? (() => 'distribution'),
    y: options.y ?? (identity as ChartChannel<TDatum, number>),
    ...options,
  });
}

export function dot<TDatum>(
  data: readonly TDatum[],
  options: ChartDotOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('dot', data, {
    x: options.x ?? ((_, index) => index),
    y: options.y ?? (identity as ChartChannel<TDatum, number>),
    ...options,
  });
}

export function ruleX<TDatum>(
  data: readonly TDatum[],
  options: ChartRuleOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('rule-x', data, {
    x: options.x ?? (identity as ChartChannel<TDatum, ChartValue>),
    ...options,
  });
}

export function ruleY<TDatum>(
  data: readonly TDatum[],
  options: ChartRuleOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('rule-y', data, {
    y: options.y ?? (identity as ChartChannel<TDatum, ChartValue>),
    ...options,
  });
}

export function bandX<TDatum>(
  data: readonly TDatum[],
  options: ChartBandOptions<TDatum>
): ChartMark<TDatum> {
  return createMark('band-x', data, options);
}

export function bandY<TDatum>(
  data: readonly TDatum[],
  options: ChartBandOptions<TDatum>
): ChartMark<TDatum> {
  return createMark('band-y', data, options);
}

export function rect<TDatum>(
  data: readonly TDatum[],
  options: ChartRectOptions<TDatum>
): ChartMark<TDatum> {
  return createMark('rect', data, options);
}

export function cell<TDatum>(
  data: readonly TDatum[],
  options: ChartCellOptions<TDatum>
): ChartMark<TDatum> {
  return createMark('cell', data, options);
}

export function textMark<TDatum>(
  data: readonly TDatum[],
  options: ChartTextOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('text', data, {
    x: options.x ?? ((_, index) => index),
    y: options.y ?? ((_, index) => index),
    text: options.text ?? (identity as ChartChannel<TDatum, string>),
    ...options,
  });
}

export function arcMark<TDatum>(
  data: readonly TDatum[],
  options: ChartArcOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('arc', data, {
    theta1: options.theta1 ?? ('theta1' as ChartChannel<TDatum, number>),
    theta2: options.theta2 ?? ('theta2' as ChartChannel<TDatum, number>),
    ...options,
  });
}

export function radialLine<TDatum>(
  data: readonly TDatum[],
  options: ChartRadialOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('radial-line', data, {
    angle: options.angle ?? ((_, index) => index),
    radius: options.radius ?? (identity as ChartChannel<TDatum, number>),
    ...options,
  });
}

export function radialArea<TDatum>(
  data: readonly TDatum[],
  options: ChartRadialOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('radial-area', data, {
    angle: options.angle ?? ((_, index) => index),
    radius: options.radius ?? (identity as ChartChannel<TDatum, number>),
    ...options,
  });
}

export function radialDot<TDatum>(
  data: readonly TDatum[],
  options: ChartRadialOptions<TDatum> = {}
): ChartMark<TDatum> {
  return createMark('radial-dot', data, {
    angle: options.angle ?? ((_, index) => index),
    radius: options.radius ?? (identity as ChartChannel<TDatum, number>),
    ...options,
  });
}

export function channelValue<TDatum, TValue>(
  datum: TDatum,
  index: number,
  data: readonly TDatum[],
  channel: ChartChannel<TDatum, TValue> | undefined
): TValue | undefined {
  if (channel === undefined) return undefined;
  if (typeof channel === 'function') return channel(datum, index, data);
  if (datum == null || typeof datum !== 'object') return undefined;
  return (datum as Record<string, TValue>)[channel];
}

export function visualValue<TDatum, TValue>(
  datum: TDatum,
  index: number,
  data: readonly TDatum[],
  value: ChartVisual<TDatum, TValue> | undefined,
  fallback: TValue
): TValue {
  return typeof value === 'function'
    ? (value as (datum: TDatum, index: number, data: readonly TDatum[]) => TValue)(
        datum,
        index,
        data
      )
    : (value ?? fallback);
}

export function normalizeStack<TDatum>(
  data: readonly TDatum[],
  options: NormalizeStackOptions<TDatum>
): NormalizedStackDatum<TDatum>[] {
  const rows = data.map((datum, index) => {
    const group = channelValue(datum, index, data, options.group);
    const series = channelValue(datum, index, data, options.series);
    const value = channelValue(datum, index, data, options.value);
    if (group === undefined || series === undefined)
      throw new TypeError('normalizeStack requires a group and series key for every row.');
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
      throw new RangeError('normalizeStack values must be finite, non-negative numbers.');
    return { data: datum, group, series, value };
  });
  const totals = new Map<string, number>();
  rows.forEach(row =>
    totals.set(chartValueKey(row.group), (totals.get(chartValueKey(row.group)) ?? 0) + row.value)
  );
  return rows.map(row => ({
    ...row,
    proportion:
      (totals.get(chartValueKey(row.group)) ?? 0) > 0
        ? row.value / (totals.get(chartValueKey(row.group)) as number)
        : 0,
  }));
}

export function pieLayout<TDatum>(
  data: readonly TDatum[],
  options: ChartPieOptions<TDatum>
): ChartPieDatum<TDatum>[] {
  const ordered = data.map((datum, index) => ({ datum, index }));
  if (options.sort) ordered.sort((a, b) => options.sort?.(a.datum, b.datum) ?? 0);
  const values = ordered.map(({ datum, index }) => {
    const value = channelValue(datum, index, data, options.value);
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
  });
  const total = values.reduce((sum, value) => sum + value, 0);
  let position = 0;
  return ordered.flatMap(({ datum, index }, orderedIndex) => {
    const value = values[orderedIndex] ?? 0;
    if (!(value > 0) || !(total > 0)) return [];
    const theta1 = position;
    position += value / total;
    const key = channelValue(datum, index, data, options.key) ?? index;
    const label = channelValue(datum, index, data, options.label) ?? String(key);
    return [{ data: datum, index, key, label, value, theta1, theta2: position }];
  });
}

export function binX<TDatum>(
  data: readonly TDatum[],
  options: ChartBinOptions<TDatum>
): ChartBinDatum<TDatum>[] {
  const generator = d3Bin<TDatum, number>().value(
    (datum, index, rows) =>
      channelValue(datum, index, Array.from(rows), options.value) ?? Number.NaN
  );
  if (typeof options.thresholds === 'number') generator.thresholds(options.thresholds);
  else if (options.thresholds !== undefined) generator.thresholds([...options.thresholds]);
  const bins = generator(data as TDatum[]);
  let cumulative = 0;
  return bins.flatMap(bin => {
    const x1 = bin.x0;
    const x2 = bin.x1;
    if (x1 === undefined || x2 === undefined) return [];
    cumulative += bin.length;
    return [
      {
        key: `bin:${x1}:${x2}`,
        x1,
        x2,
        x: (x1 + x2) / 2,
        count: bin.length,
        cumulative,
        rows: [...bin],
      },
    ];
  });
}

export function cumulativeBins<TDatum>(
  bins: readonly ChartBinDatum<TDatum>[]
): ChartBinDatum<TDatum>[] {
  let cumulative = 0;
  return bins.map(bin => ({ ...bin, cumulative: (cumulative += bin.count) }));
}

export function densityX<TDatum>(
  data: readonly TDatum[],
  options: ChartDensityOptions<TDatum>
): ChartDensityDatum[] {
  const values = data
    .map((datum, index) => channelValue(datum, index, data, options.value))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .sort((a, b) => a - b);
  if (values.length === 0) return [];
  const [minimum = 0, maximum = minimum + 1] = extent(values);
  const span = Math.max(Number.EPSILON, maximum - minimum);
  const sampleCount = Math.max(8, options.samples ?? 48);
  const sampleValues = ticks(minimum, maximum, sampleCount);
  const sigma = deviation(values) ?? span / 6;
  const bandwidth = Math.max(
    Number.EPSILON,
    options.bandwidth ?? 1.06 * sigma * Math.pow(values.length, -0.2)
  );
  const normalizer = 1 / (Math.sqrt(2 * Math.PI) * bandwidth * values.length);
  return sampleValues.map(x => ({
    key: `density:${x}`,
    x,
    density:
      values.reduce((sum, value) => {
        const u = (x - value) / bandwidth;
        return sum + Math.exp(-0.5 * u * u);
      }, 0) * normalizer,
  }));
}

export function boxStatistics(values: readonly number[], whisker = 1.5) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return undefined;
  const q1 = quantileSorted(sorted, 0.25) as number;
  const median = quantileSorted(sorted, 0.5) as number;
  const q3 = quantileSorted(sorted, 0.75) as number;
  const iqr = q3 - q1;
  const lowerFence = q1 - whisker * iqr;
  const upperFence = q3 + whisker * iqr;
  const lower = sorted.find(value => value >= lowerFence) ?? sorted[0];
  const upper =
    [...sorted].reverse().find(value => value <= upperFence) ?? sorted[sorted.length - 1];
  return {
    q1,
    median,
    q3,
    lower,
    upper,
    outliers: sorted.filter(value => value < lower || value > upper),
  };
}

export function chartValueKey(value: unknown): string {
  if (value instanceof Date) return `date:${value.getTime()}`;
  return `${typeof value}:${String(value)}`;
}
