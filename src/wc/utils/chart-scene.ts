import { scaleBand, scaleLinear } from 'd3-scale';
import {
  arc as arcShape,
  area as areaShape,
  areaRadial,
  curveLinearClosed,
  line as lineShape,
  lineRadial,
} from 'd3-shape';
import { categoryColor } from './chart-colors';
import {
  boxStatistics,
  channelValue,
  chartValueKey,
  visualValue,
  type ChartAxisOptions,
  type ChartBarOptions,
  type ChartBoxYOptions,
  type ChartCellOptions,
  type ChartCenterOptions,
  type ChartDefinition,
  type ChartKey,
  type ChartMark,
  type ChartPoint,
  type ChartPolarContainerOptions,
  type ChartPolarCoordinate,
  type ChartRectOptions,
  type ChartScale,
  type ChartSpec,
  type ChartValue,
} from './chart-grammar';
import {
  chartIntentColor,
  defaultChartTheme,
  type ChartTheme,
} from './chart-theme';

export interface ChartTextMeasurement {
  width: number;
  height: number;
}

export type ChartTextMeasurer = (text: string) => ChartTextMeasurement;

export interface ChartBounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

interface ChartSceneStyle {
  fill?: string;
  stroke?: string;
  opacity?: number;
  fillOpacity?: number;
  strokeOpacity?: number;
  strokeWidth?: number | string;
  strokeDasharray?: string;
  radius?: number | string;
  fontFamily?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  textAnchor?: 'start' | 'middle' | 'end';
}

interface ChartSceneBaseNode {
  key: string;
  markId: string;
  style: ChartSceneStyle;
  className?: string;
}

export interface ChartScenePath extends ChartSceneBaseNode {
  type: 'path';
  d: string;
  transform?: string;
}

export interface ChartSceneRect extends ChartSceneBaseNode {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChartSceneCircle extends ChartSceneBaseNode {
  type: 'circle';
  x: number;
  y: number;
  radius: number | string;
}

export interface ChartSceneLine extends ChartSceneBaseNode {
  type: 'line';
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface ChartSceneText extends ChartSceneBaseNode {
  type: 'text';
  x: number;
  y: number;
  text: string;
  dx?: number;
  dy?: number;
  rotate?: number;
  dominantBaseline?: 'auto' | 'middle' | 'hanging';
  measure?: boolean;
}

export type ChartSceneNode =
  | ChartScenePath
  | ChartSceneRect
  | ChartSceneCircle
  | ChartSceneLine
  | ChartSceneText;

export interface ChartSceneTick {
  key: string;
  value: ChartValue;
  label: string;
  position: number;
  boundary: boolean;
  labelVisible: boolean;
}

export interface ChartSceneAxis {
  label?: string;
  ticks: ChartSceneTick[];
  grid: boolean;
  rotate: number;
  line: boolean;
  tickSize: number;
  tickPadding: number;
}

export interface ChartScene {
  width: number;
  height: number;
  coordinate: 'cartesian' | 'polar';
  plot: ChartBounds;
  xAxis: ChartSceneAxis;
  yAxis: ChartSceneAxis;
  guides: ChartSceneNode[];
  nodes: ChartSceneNode[];
  points: ChartPoint[];
  center?: ChartCenterOptions;
  focus: NonNullable<ChartSpec['focus']>;
  maxFocusDistance?: number;
  tooltip: ChartSpec['tooltip'];
  clip: boolean;
}

interface Observation {
  datum: unknown;
  index: number;
  datumKey: ChartKey;
  sceneKey: string;
  markId: string;
  x?: ChartValue;
  y?: ChartValue;
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
  angle?: ChartValue;
  radius?: number;
  radius1?: number;
  radius2?: number;
  theta1?: number;
  theta2?: number;
  intensity?: number;
  value?: ChartValue;
  z?: ChartValue;
  color?: ChartValue;
  text?: string;
  label?: string;
  source: readonly unknown[];
}

interface ScaleResolution {
  scale: ChartScale;
  domain: ChartValue[];
}

const DEFAULT_MARGIN = { top: 16, right: 16, bottom: 32, left: 40 };
const POLAR_MARGIN = 24;
const DEFAULT_TICK_SPACING = 8;
const DEFAULT_TICK_SIZE = 4;
const DEFAULT_TICK_PADDING = 4;
const EMPTY_AXIS: ChartSceneAxis = { ticks: [], grid: false, rotate: 0, line: false, tickSize: 0, tickPadding: 0 };

const finiteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const validValue = (value: unknown): value is ChartValue =>
  value instanceof Date
    ? Number.isFinite(value.getTime())
    : typeof value === 'string' || finiteNumber(value);

const numericValue = (value: ChartValue): number =>
  value instanceof Date ? value.getTime() : Number(value);

const distinct = (values: readonly ChartValue[]): ChartValue[] => {
  const seen = new Set<string>();
  return values.filter(value => {
    const key = chartValueKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function resolveSpec(definition: ChartDefinition, width: number, height: number): ChartSpec {
  const chart = definition.chart;
  return typeof chart === 'function' ? chart({ width, height }) : chart;
}

function normalizeCoordinateContainers(spec: ChartSpec): ChartSpec {
  const container = (spec.marks as readonly ChartMark[]).find(mark => mark.kind === 'polar');
  if (!container) return spec;
  const options = container.options as unknown as ChartPolarContainerOptions;
  return {
    ...spec,
    marks: options.marks,
    coordinate: {
      type: 'polar',
      startAngle: options.startAngle,
      endAngle: options.endAngle,
      innerRadius: options.innerRadius,
      outerRadius: options.outerRadius,
      grid: options.grid,
    },
    angle: options.angle,
    radius: options.radius,
    center: spec.center ?? options.center,
  };
}

function resolveMargin(spec: ChartSpec, polar = false): typeof DEFAULT_MARGIN {
  const defaults = polar
    ? { top: POLAR_MARGIN, right: POLAR_MARGIN, bottom: POLAR_MARGIN, left: POLAR_MARGIN }
    : DEFAULT_MARGIN;
  if (typeof spec.margin === 'number') {
    return { top: spec.margin, right: spec.margin, bottom: spec.margin, left: spec.margin };
  }
  return { ...defaults, ...spec.margin };
}

function developmentWarning(message: string): void {
  const browserDevelopment =
    typeof location !== 'undefined' &&
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  const nodeProcess = (globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } }).process;
  const nodeDevelopment = nodeProcess !== undefined && nodeProcess.env?.NODE_ENV !== 'production';
  if (typeof console !== 'undefined' && (browserDevelopment || nodeDevelopment)) console.warn(message);
}

function positionalKey(observation: Omit<Observation, 'datumKey' | 'sceneKey'>): string | undefined {
  const coordinates = [
    observation.x,
    observation.y,
    observation.angle,
    observation.radius,
    observation.theta1,
    observation.theta2,
    observation.z,
  ]
    .filter(validValue)
    .map(chartValueKey);
  return coordinates.length > 0 ? coordinates.join('|') : undefined;
}

function inferDatumKey(
  observation: Omit<Observation, 'datumKey' | 'sceneKey'>,
  mark: ChartMark,
  uniqueIds: ReadonlySet<ChartKey>,
  uniquePositions: ReadonlySet<string>,
): ChartKey {
  const explicit = channelValue(observation.datum, observation.index, observation.source, mark.options.key);
  if (explicit !== undefined && explicit !== null) return explicit;
  if (observation.datum && typeof observation.datum === 'object') {
    const id = (observation.datum as { id?: unknown }).id;
    if ((typeof id === 'string' || typeof id === 'number') && uniqueIds.has(id)) return id;
  }
  const position = positionalKey(observation);
  if (position && uniquePositions.has(position)) return position;
  developmentWarning(`[ds-chart] ${observation.markId} is using row index ${observation.index} as its datum key. Author a key channel for stable focus.`);
  return observation.index;
}

function uniqueValues<TValue>(values: readonly TValue[]): Set<TValue> {
  const counts = new Map<TValue, number>();
  values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1));
  return new Set([...counts].filter(([, count]) => count === 1).map(([value]) => value));
}

function observationsForMark(mark: ChartMark, markIndex: number): Observation[] {
  const source = mark.data as readonly unknown[];
  const markId = mark.options.id ?? `${mark.kind}-${markIndex}`;
  const bases = source.map((datum, index) => {
    const options = mark.options;
    const read = <TValue>(name: string): TValue | undefined =>
      name in options
        ? channelValue(datum, index, source, (options as Record<string, unknown>)[name] as never)
        : undefined;
    const x = read<ChartValue>('x');
    const y = read<ChartValue>('y');
    const angle = read<ChartValue>('angle');
    const z = channelValue(datum, index, source, options.z);
    const color = channelValue(datum, index, source, options.color);
    const value = channelValue(datum, index, source, options.value);
    return {
      datum,
      index,
      markId,
      source,
      x: validValue(x) ? x : undefined,
      y: validValue(y) ? y : undefined,
      x1: read<number>('x1'),
      x2: read<number>('x2'),
      y1: read<number>('y1'),
      y2: read<number>('y2'),
      angle: validValue(angle) ? angle : undefined,
      radius: read<number>('radius'),
      radius1: read<number>('radius1'),
      radius2: read<number>('radius2'),
      theta1: read<number>('theta1'),
      theta2: read<number>('theta2'),
      intensity: read<number>('intensity'),
      value: validValue(value) ? value : undefined,
      z: validValue(z) ? z : undefined,
      color: validValue(color) ? color : undefined,
      text: 'text' in options ? String(read<string | number>('text') ?? '') : undefined,
      label: 'label' in options ? String(read<string>('label') ?? '') : undefined,
    };
  });
  const ids = bases
    .map(base => base.datum && typeof base.datum === 'object' ? (base.datum as { id?: unknown }).id : undefined)
    .filter((id): id is ChartKey => typeof id === 'string' || typeof id === 'number');
  const uniqueIds = uniqueValues(ids);
  const uniquePositions = uniqueValues(bases.map(positionalKey).filter((key): key is string => key !== undefined));
  return bases.map(base => {
    const datumKey = inferDatumKey(base, mark, uniqueIds, uniquePositions);
    return { ...base, datumKey, sceneKey: `${markId}:${chartValueKey(datumKey)}` };
  });
}

function configuredScale(source: ChartAxisOptions['scale']): { scale: ChartScale; configured: boolean } {
  const candidate = source as ChartScale;
  if (typeof candidate.domain === 'function' && typeof candidate.range === 'function') return { scale: candidate.copy?.() ?? candidate, configured: true };
  const scale = (source as () => unknown)() as ChartScale;
  if (!scale || typeof scale.domain !== 'function' || typeof scale.range !== 'function') throw new TypeError('Chart scales must be native D3 scale factories or configured scale instances.');
  return { scale, configured: false };
}

function inferDomain(values: readonly ChartValue[], includeZero: boolean): ChartValue[] {
  const unique = distinct(values);
  if (unique.length === 0) return [0, 1];
  if (unique.some(value => typeof value === 'string')) return unique;
  const dates = unique.every(value => value instanceof Date);
  const numeric = unique.map(numericValue);
  if (includeZero) numeric.push(0);
  let minimum = Math.min(...numeric);
  let maximum = Math.max(...numeric);
  if (minimum === maximum) {
    const padding = Math.abs(minimum) * 0.1 || 1;
    minimum -= padding;
    maximum += padding;
  }
  return dates ? [new Date(minimum), new Date(maximum)] : [minimum, maximum];
}

function resolveScale(options: ChartAxisOptions, values: readonly ChartValue[], range: [number, number], includeZero: boolean): ScaleResolution {
  const resolved = configuredScale(options.scale);
  const existingDomain = (resolved.scale.domain() as ChartValue[]) ?? [];
  const domain = resolved.configured && existingDomain.length > 0 ? existingDomain : inferDomain(values, includeZero);
  resolved.scale.domain(domain);
  if (options.nice && resolved.scale.nice) resolved.scale.nice();
  resolved.scale.range(range);
  return { scale: resolved.scale, domain: (resolved.scale.domain() as ChartValue[]) ?? domain };
}

function scalePosition(resolution: ScaleResolution, value: ChartValue): number | undefined {
  const result = resolution.scale(value);
  if (!finiteNumber(result)) return undefined;
  return result + (resolution.scale.bandwidth?.() ?? 0) / 2;
}

function formatTick(value: ChartValue, locale: string): string {
  if (value instanceof Date) return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(value);
  if (typeof value === 'number') return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  return value;
}

function tickValues(axis: ChartAxisOptions, resolution: ScaleResolution, width: number): ChartValue[] {
  const requested = axis.axis === false ? undefined : axis.axis?.ticks?.values;
  if (requested) return [...requested];
  const count = axis.axis === false ? 0 : axis.axis?.ticks?.count ?? Math.max(2, Math.floor(width / 80));
  return resolution.scale.ticks ? resolution.scale.ticks(count) : resolution.domain;
}

function thinTicks(ticks: ChartSceneTick[], horizontal: boolean, measurer: ChartTextMeasurer, spacing: number): ChartSceneTick[] {
  if (ticks.length <= 2) return ticks.map(tick => ({ ...tick, labelVisible: true }));
  const kept: ChartSceneTick[] = [];
  let previousEnd = Number.NEGATIVE_INFINITY;
  ticks.forEach((tick, index) => {
    const boundary = index === 0 || index === ticks.length - 1;
    const measurement = measurer(tick.label);
    const extent = horizontal ? measurement.width : measurement.height;
    const start = tick.position - extent / 2;
    const end = tick.position + extent / 2;
    if (boundary || start >= previousEnd + spacing) {
      kept.push({ ...tick, boundary, labelVisible: true });
      previousEnd = end;
    }
  });
  const last = ticks[ticks.length - 1];
  if (!kept.some(tick => tick.key === last.key)) {
    while (kept.length > 1) {
      const candidate = kept[kept.length - 1];
      const candidateSize = horizontal ? measurer(candidate.label).width : measurer(candidate.label).height;
      const lastSize = horizontal ? measurer(last.label).width : measurer(last.label).height;
      if (candidate.position + candidateSize / 2 + spacing <= last.position - lastSize / 2) break;
      kept.pop();
    }
    kept.push({ ...last, boundary: true, labelVisible: true });
  }
  const visible = new Set(kept.map(tick => tick.key));
  return ticks.map(tick => ({ ...tick, labelVisible: visible.has(tick.key) }));
}

function sceneAxis(axis: ChartAxisOptions, resolution: ScaleResolution, locale: string, length: number, horizontal: boolean, measurer: ChartTextMeasurer): ChartSceneAxis {
  if (axis.axis === false) return { ...EMPTY_AXIS };
  const format = axis.axis?.ticks?.format;
  const ticksForAxis = tickValues(axis, resolution, length)
    .map((value, index, all) => ({
      key: chartValueKey(value),
      value,
      label: format ? format(value, locale) : formatTick(value, locale),
      position: scalePosition(resolution, value) ?? 0,
      boundary: index === 0 || index === all.length - 1,
      labelVisible: true,
    }))
    .filter(tick => Number.isFinite(tick.position));
  return {
    label: axis.axis?.label,
    ticks: thinTicks(ticksForAxis, horizontal, measurer, axis.axis?.ticks?.spacing ?? DEFAULT_TICK_SPACING),
    grid: axis.grid ?? false,
    rotate: axis.axis?.ticks?.rotate ?? 0,
    line: axis.axis?.line ?? true,
    tickSize: axis.axis?.ticks?.size ?? DEFAULT_TICK_SIZE,
    tickPadding: axis.axis?.ticks?.padding ?? DEFAULT_TICK_PADDING,
  };
}

function rotatedMeasurement(measurement: ChartTextMeasurement, degrees: number): ChartTextMeasurement {
  if (!degrees) return measurement;
  const radians = Math.abs(degrees) * Math.PI / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  return {
    width: measurement.width * cosine + measurement.height * sine,
    height: measurement.width * sine + measurement.height * cosine,
  };
}

function plotFor(width: number, height: number, margin: typeof DEFAULT_MARGIN): ChartBounds {
  const left = Math.min(width, Math.max(0, margin.left));
  const top = Math.min(height, Math.max(0, margin.top));
  const right = Math.max(left, width - Math.max(0, margin.right));
  const bottom = Math.max(top, height - Math.max(0, margin.bottom));
  return { top, right, bottom, left, width: right - left, height: bottom - top };
}

function solveCartesianMargins(
  width: number,
  height: number,
  requested: typeof DEFAULT_MARGIN,
  xAxis: ChartSceneAxis,
  yAxis: ChartSceneAxis,
  plot: ChartBounds,
  measurer: ChartTextMeasurer,
): typeof DEFAULT_MARGIN {
  const visibleX = xAxis.ticks.filter(tick => tick.labelVisible);
  const visibleY = yAxis.ticks.filter(tick => tick.labelVisible);
  const xMeasurements = visibleX.map(tick => ({
    tick,
    measurement: rotatedMeasurement(measurer(tick.label), xAxis.rotate),
  }));
  const yMeasurements = visibleY.map(tick => ({ tick, measurement: measurer(tick.label) }));
  const widestY = Math.max(0, ...yMeasurements.map(item => item.measurement.width));
  const tallestY = Math.max(0, ...yMeasurements.map(item => item.measurement.height));
  const tallestX = Math.max(0, ...xMeasurements.map(item => item.measurement.height));
  let left = Math.max(requested.left, yAxis.ticks.length > 0 ? yAxis.tickSize + yAxis.tickPadding + widestY + (yAxis.label ? 18 : 0) : 0);
  let right = requested.right;
  let top = Math.max(requested.top, tallestY / 2);
  let bottom = Math.max(requested.bottom, xAxis.ticks.length > 0 ? xAxis.tickSize + xAxis.tickPadding + tallestX + (xAxis.label ? 18 : 0) : 0);
  xMeasurements.forEach(({ tick, measurement }) => {
    left = Math.max(left, measurement.width / 2 - (tick.position - plot.left));
    right = Math.max(right, measurement.width / 2 - (plot.right - tick.position));
  });
  yMeasurements.forEach(({ tick, measurement }) => {
    top = Math.max(top, measurement.height / 2 - (tick.position - plot.top));
    bottom = Math.max(bottom, measurement.height / 2 - (plot.bottom - tick.position));
  });
  return { top, right, bottom, left };
}

function styleFor(observation: Observation, mark: ChartMark, color: string, defaults: ChartSceneStyle): ChartSceneStyle {
  const { datum, index, source } = observation;
  const options = mark.options;
  return {
    ...defaults,
    fill: visualValue(datum, index, source, options.fill, defaults.fill ?? color),
    stroke: visualValue(datum, index, source, options.stroke, defaults.stroke ?? color),
    opacity: visualValue(datum, index, source, options.opacity, defaults.opacity ?? 1),
    fillOpacity: visualValue(datum, index, source, options.fillOpacity, defaults.fillOpacity ?? 1),
    strokeOpacity: visualValue(datum, index, source, options.strokeOpacity, defaults.strokeOpacity ?? 1),
    strokeWidth: visualValue(datum, index, source, options.strokeWidth, defaults.strokeWidth ?? defaultChartTheme.seriesStrokeWidth),
    strokeDasharray: visualValue(datum, index, source, options.strokeDasharray, defaults.strokeDasharray ?? ''),
  };
}

function dotCircleRadius(coreRadius: number | string, haloWidth: number | string): number | string {
  if (typeof coreRadius === 'number' && typeof haloWidth === 'number') {
    return coreRadius + haloWidth / 2;
  }
  return coreRadius;
}

function groupObservations(observations: Observation[]): Observation[][] {
  const groups = new Map<string, Observation[]>();
  observations.forEach(observation => {
    const key = chartValueKey(observation.z ?? observation.color ?? 'series');
    const group = groups.get(key) ?? [];
    group.push(observation);
    groups.set(key, group);
  });
  return [...groups.values()];
}

function pointFor(observation: Observation, x: number, y: number, color: string, overrides: Partial<ChartPoint> = {}): ChartPoint {
  return {
    key: observation.datumKey,
    sceneKey: observation.sceneKey,
    markId: observation.markId,
    datum: observation.datum,
    datumIndex: observation.index,
    groupValue: observation.z,
    groupLabel: observation.z === undefined ? observation.label : String(observation.z),
    xValue: observation.x ?? observation.angle ?? observation.label ?? x,
    yValue: observation.y ?? observation.radius ?? observation.value ?? y,
    value: observation.value ?? observation.y ?? observation.radius ?? observation.intensity,
    angleValue: observation.angle,
    radiusValue: observation.radius,
    x,
    y,
    color,
    ...overrides,
  };
}

function axisValues(marks: readonly ChartMark[], observations: Observation[][], axis: 'x' | 'y'): { values: ChartValue[]; includeZero: boolean } {
  const values: ChartValue[] = [];
  let includeZero = false;
  marks.forEach((mark, index) => {
    const relevant = observations[index];
    relevant.forEach(observation => {
      const value = observation[axis];
      if (validValue(value)) values.push(value);
      const start = axis === 'x' ? observation.x1 : observation.y1;
      const end = axis === 'x' ? observation.x2 : observation.y2;
      if (finiteNumber(start)) values.push(start);
      if (finiteNumber(end)) values.push(end);
    });
    if ((axis === 'y' && mark.kind === 'bar-y') || (axis === 'x' && mark.kind === 'bar-x')) {
      includeZero = true;
      if ('layout' in mark.options && mark.options.layout === 'stacked') {
        const sums = new Map<string, { positive: number; negative: number }>();
        relevant.forEach(observation => {
          const category = axis === 'y' ? observation.x : observation.y;
          const value = observation[axis];
          if (category === undefined || !finiteNumber(value)) return;
          const key = chartValueKey(category);
          const sum = sums.get(key) ?? { positive: 0, negative: 0 };
          if (value >= 0) sum.positive += value;
          else sum.negative += value;
          sums.set(key, sum);
        });
        sums.forEach(sum => values.push(sum.positive, sum.negative));
      }
    }
    if (
      axis === 'y' &&
      mark.kind === 'area-y' &&
      !('y1' in mark.options && mark.options.y1 !== undefined)
    ) {
      includeZero = true;
    }
  });
  return { values, includeZero };
}

function colorResolver(spec: ChartSpec, observations: Observation[][]) {
  const inferred = distinct(observations.flatMap(group => group.map(observation => observation.color ?? observation.z).filter(validValue)));
  const domain = distinct([...(spec.color?.domain ?? []), ...inferred]);
  const range = spec.color?.range ?? [];
  const map = new Map(domain.map((value, index) => [chartValueKey(value), range[index % Math.max(1, range.length)] ?? categoryColor(index)]));
  return (observation: Observation): string => {
    const value = observation.color ?? observation.z;
    return value === undefined ? range[0] ?? categoryColor(0) : map.get(chartValueKey(value)) ?? categoryColor(0);
  };
}

function rectNode(observation: Observation, mark: ChartMark, color: string, x1: number, x2: number, y1: number, y2: number, radius: number | string, inset = 0): ChartSceneRect {
  return {
    type: 'rect',
    key: observation.sceneKey,
    markId: observation.markId,
    x: Math.min(x1, x2) + inset,
    y: Math.min(y1, y2) + inset,
    width: Math.max(0, Math.abs(x2 - x1) - inset * 2),
    height: Math.max(0, Math.abs(y2 - y1) - inset * 2),
    style: { ...styleFor(observation, mark, color, { fill: color, stroke: 'none' }), radius },
  };
}

function buildCartesianNodes(
  marks: readonly ChartMark[],
  allObservations: Observation[][],
  xScale: ScaleResolution,
  yScale: ScaleResolution,
  plot: ChartBounds,
  colorFor: (observation: Observation) => string,
  theme: ChartTheme,
): { nodes: ChartSceneNode[]; points: ChartPoint[] } {
  const nodes: ChartSceneNode[] = [];
  const points: ChartPoint[] = [];

  marks.forEach((mark, markIndex) => {
    const observations = allObservations[markIndex];
    const groups = groupObservations(observations);

    if (mark.kind === 'line-y' || mark.kind === 'area-y') {
      groups.forEach(group => {
        const first = group[0];
        if (!first) return;
        const color = colorFor(first);
        if (mark.kind === 'line-y') {
          const line = lineShape<Observation>()
            .defined(observation => observation.x !== undefined && observation.y !== undefined && scalePosition(xScale, observation.x) !== undefined && scalePosition(yScale, observation.y) !== undefined)
            .x(observation => scalePosition(xScale, observation.x as ChartValue) ?? 0)
            .y(observation => scalePosition(yScale, observation.y as ChartValue) ?? 0);
          if ('curve' in mark.options && mark.options.curve) line.curve(mark.options.curve);
          const d = line(group);
          if (d) nodes.push({ type: 'path', key: `${first.markId}:series:${chartValueKey(first.z ?? first.color ?? 'series')}`, markId: first.markId, d, style: styleFor(first, mark, color, { fill: 'none', stroke: color, strokeWidth: theme.seriesStrokeWidth }) });
        } else {
          const area = areaShape<Observation>()
            .defined(observation => {
              const lower = observation.y1 ?? observation.y ?? 0;
              const upper = observation.y2 ?? observation.y;
              return observation.x !== undefined && finiteNumber(lower) && finiteNumber(upper) && scalePosition(xScale, observation.x) !== undefined;
            })
            .x(observation => scalePosition(xScale, observation.x as ChartValue) ?? 0)
            .y0(observation => scalePosition(yScale, observation.y1 ?? 0) ?? 0)
            .y1(observation => scalePosition(yScale, observation.y2 ?? observation.y ?? 0) ?? 0);
          if ('curve' in mark.options && mark.options.curve) area.curve(mark.options.curve);
          const d = area(group);
          if (d) nodes.push({ type: 'path', key: `${first.markId}:series:${chartValueKey(first.z ?? first.color ?? 'series')}`, markId: first.markId, d, style: styleFor(first, mark, color, { fill: color, stroke: 'none', fillOpacity: theme.areaOpacity }) });
        }
        group.forEach(observation => {
          if (observation.x === undefined || observation.y === undefined) return;
          const x = scalePosition(xScale, observation.x);
          const y = scalePosition(yScale, observation.y);
          if (mark.options.interactive !== false && x !== undefined && y !== undefined) points.push(pointFor(observation, x, y, color));
        });
      });
      return;
    }

    if (mark.kind === 'bar-y' || mark.kind === 'bar-x') {
      const barOptions = mark.options as ChartBarOptions<unknown>;
      const vertical = mark.kind === 'bar-y';
      const categoryScale = vertical ? xScale : yScale;
      const valueScale = vertical ? yScale : xScale;
      const categories = distinct(observations.map(observation => vertical ? observation.x : observation.y).filter(validValue));
      const categoryBand = categoryScale.scale.bandwidth?.() ?? Math.max(1, (vertical ? plot.width : plot.height) / Math.max(1, categories.length) * 0.75);
      const seriesValues = distinct(observations.map(observation => observation.z).filter(validValue));
      const groupedScale = scaleBand<ChartValue>().domain(seriesValues.length > 0 ? seriesValues : ['series']).range([0, categoryBand]).padding(0.08);
      const stacks = new Map<string, { positive: number; negative: number }>();
      observations.forEach(observation => {
        const category = vertical ? observation.x : observation.y;
        const rawValue = vertical ? observation.y : observation.x;
        if (category === undefined || !finiteNumber(rawValue)) return;
        const categoryCenter = scalePosition(categoryScale, category);
        if (categoryCenter === undefined) return;
        let start = vertical ? observation.y1 : observation.x1;
        let end = vertical ? observation.y2 : observation.x2;
        const layout = barOptions.layout ?? 'single';
        let hasPriorStackSegment = layout === 'stacked' && finiteNumber(start) && start !== 0;
        if (!finiteNumber(start) || !finiteNumber(end)) {
          if (layout === 'stacked') {
            const stackKey = chartValueKey(category);
            const stack = stacks.get(stackKey) ?? { positive: 0, negative: 0 };
            start = rawValue >= 0 ? stack.positive : stack.negative;
            hasPriorStackSegment = start !== 0;
            end = start + rawValue;
            if (rawValue >= 0) stack.positive = end;
            else stack.negative = end;
            stacks.set(stackKey, stack);
          } else {
            start = 0;
            end = rawValue;
          }
        }
        const startPosition = scalePosition(valueScale, start);
        const endPosition = scalePosition(valueScale, end);
        if (startPosition === undefined || endPosition === undefined) return;
        const renderedStartPosition = hasPriorStackSegment
          ? startPosition + Math.sign(endPosition - startPosition) * Math.min(theme.stackGap, Math.abs(endPosition - startPosition))
          : startPosition;
        const inset = visualValue(observation.datum, observation.index, observation.source, barOptions.inset, categoryBand * 0.1);
        let bandStart = categoryCenter - categoryBand / 2 + inset;
        let bandSize = Math.max(0, categoryBand - inset * 2);
        if (layout === 'grouped' && seriesValues.length > 0 && observation.z !== undefined) {
          bandStart = categoryCenter - categoryBand / 2 + (groupedScale(observation.z) ?? 0);
          bandSize = Math.max(0, groupedScale.bandwidth());
        }
        const color = colorFor(observation);
        const radius = visualValue(observation.datum, observation.index, observation.source, barOptions.radius, theme.barRadius);
        const node = vertical
          ? rectNode(observation, mark, color, bandStart, bandStart + bandSize, renderedStartPosition, endPosition, radius)
          : rectNode(observation, mark, color, renderedStartPosition, endPosition, bandStart, bandStart + bandSize, radius);
        nodes.push(node);
        if (mark.options.interactive !== false) points.push(pointFor(observation, vertical ? bandStart + bandSize / 2 : endPosition, vertical ? endPosition : bandStart + bandSize / 2, color));
      });
      return;
    }

    if (mark.kind === 'box-y') {
      const boxOptions = mark.options as ChartBoxYOptions<unknown>;
      const byCategory = new Map<string, Observation[]>();
      observations.forEach(observation => {
        if (observation.x === undefined || !finiteNumber(observation.y)) return;
        const key = chartValueKey(observation.x);
        const group = byCategory.get(key) ?? [];
        group.push(observation);
        byCategory.set(key, group);
      });
      byCategory.forEach(group => {
        const first = group[0];
        if (!first || first.x === undefined) return;
        const statistics = boxStatistics(group.map(observation => observation.y as number), boxOptions.whisker ?? 1.5);
        const center = scalePosition(xScale, first.x);
        if (!statistics || center === undefined) return;
        const categoryBand = xScale.scale.bandwidth?.() ?? Math.max(24, plot.width / Math.max(1, byCategory.size) * 0.6);
        const inset = boxOptions.inset ?? categoryBand * 0.2;
        const left = center - categoryBand / 2 + inset;
        const right = center + categoryBand / 2 - inset;
        const color = colorFor(first);
        const yLower = scalePosition(yScale, statistics.lower);
        const yUpper = scalePosition(yScale, statistics.upper);
        const yQ1 = scalePosition(yScale, statistics.q1);
        const yQ3 = scalePosition(yScale, statistics.q3);
        const yMedian = scalePosition(yScale, statistics.median);
        if ([yLower, yUpper, yQ1, yQ3, yMedian].some(value => value === undefined)) return;
        const lineStyle = styleFor(first, mark, color, { fill: 'none', stroke: color, strokeWidth: theme.seriesStrokeWidth });
        nodes.push(
          { type: 'line', key: `${first.sceneKey}:whisker`, markId: first.markId, x1: center, x2: center, y1: yUpper as number, y2: yLower as number, style: lineStyle },
          rectNode(first, mark, color, left, right, yQ3 as number, yQ1 as number, boxOptions.radius ?? theme.barRadius),
          { type: 'line', key: `${first.sceneKey}:median`, markId: first.markId, x1: left, x2: right, y1: yMedian as number, y2: yMedian as number, style: lineStyle },
          { type: 'line', key: `${first.sceneKey}:lower`, markId: first.markId, x1: left, x2: right, y1: yLower as number, y2: yLower as number, style: lineStyle },
          { type: 'line', key: `${first.sceneKey}:upper`, markId: first.markId, x1: left, x2: right, y1: yUpper as number, y2: yUpper as number, style: lineStyle },
        );
        statistics.outliers.forEach((value, index) => {
          const y = scalePosition(yScale, value);
          if (y !== undefined) nodes.push({ type: 'circle', key: `${first.sceneKey}:outlier:${index}`, markId: first.markId, x: center, y, radius: dotCircleRadius(theme.dotRadius, theme.dotHaloWidth), style: styleFor(first, mark, color, { fill: color, stroke: 'var(--color-background-primary)', strokeWidth: theme.dotHaloWidth }) });
        });
        const summaryObservation: Observation = { ...first, y: statistics.median, value: statistics.median, datumKey: chartValueKey(first.x), sceneKey: `${first.markId}:${chartValueKey(first.x)}` };
        if (mark.options.interactive !== false) points.push(pointFor(summaryObservation, center, yMedian as number, color));
      });
      return;
    }

    if (mark.kind === 'rect') {
      const rectOptions = mark.options as ChartRectOptions<unknown>;
      observations.forEach(observation => {
        if (![observation.x1, observation.x2, observation.y1, observation.y2].every(finiteNumber)) return;
        const x1 = scalePosition(xScale, observation.x1 as number);
        const x2 = scalePosition(xScale, observation.x2 as number);
        const y1 = scalePosition(yScale, observation.y1 as number);
        const y2 = scalePosition(yScale, observation.y2 as number);
        if ([x1, x2, y1, y2].some(value => value === undefined)) return;
        const color = colorFor(observation);
        const inset = visualValue(observation.datum, observation.index, observation.source, rectOptions.inset, 1);
        const radius = visualValue(observation.datum, observation.index, observation.source, rectOptions.radius, theme.barRadius);
        nodes.push(rectNode(observation, mark, color, x1 as number, x2 as number, y1 as number, y2 as number, radius, inset));
        if (mark.options.interactive !== false) points.push(pointFor(observation, ((x1 as number) + (x2 as number)) / 2, Math.min(y1 as number, y2 as number), color, { xValue: (observation.x1 as number + (observation.x2 as number)) / 2, yValue: observation.y2 as number }));
      });
      return;
    }

    if (mark.kind === 'cell') {
      const cellOptions = mark.options as ChartCellOptions<unknown>;
      const values = observations.map(observation => observation.intensity).filter(finiteNumber);
      const minimum = values.length > 0 ? Math.min(...values) : 0;
      const maximum = values.length > 0 ? Math.max(...values) : 1;
      observations.forEach(observation => {
        if (observation.x === undefined || observation.y === undefined || !finiteNumber(observation.intensity)) return;
        const x = scalePosition(xScale, observation.x);
        const y = scalePosition(yScale, observation.y);
        if (x === undefined || y === undefined) return;
        const width = xScale.scale.bandwidth?.() ?? plot.width / Math.max(1, distinct(observations.map(item => item.x).filter(validValue)).length);
        const height = yScale.scale.bandwidth?.() ?? plot.height / Math.max(1, distinct(observations.map(item => item.y).filter(validValue)).length);
        const options = cellOptions;
        const color = visualValue(observation.datum, observation.index, observation.source, options.fill, chartIntentColor(options.intent));
        const ratio = maximum === minimum ? 1 : (observation.intensity - minimum) / (maximum - minimum);
        const minOpacity = options.minimumOpacity ?? theme.heatmapMinimumOpacity;
        const maxOpacity = options.maximumOpacity ?? theme.heatmapMaximumOpacity;
        const inset = options.inset ?? theme.cellGap / 2;
        const radius = options.radius ?? 0;
        const node = rectNode(observation, mark, color, x - width / 2, x + width / 2, y - height / 2, y + height / 2, radius, inset);
        node.style.fillOpacity = visualValue(observation.datum, observation.index, observation.source, options.fillOpacity, minOpacity + ratio * (maxOpacity - minOpacity));
        nodes.push(node);
        if (mark.options.interactive !== false) points.push(pointFor(observation, x, y, color, { value: observation.intensity }));
      });
      return;
    }

    observations.forEach(observation => {
      const color = colorFor(observation);
      if ((mark.kind === 'rule-x' || mark.kind === 'band-x') && (observation.x !== undefined || finiteNumber(observation.x1))) {
        const x1 = scalePosition(xScale, (observation.x1 ?? observation.x) as ChartValue);
        const x2 = scalePosition(xScale, (observation.x2 ?? observation.x) as ChartValue);
        if (x1 === undefined || x2 === undefined) return;
        if (mark.kind === 'rule-x') nodes.push({ type: 'line', key: observation.sceneKey, markId: observation.markId, x1, x2: x1, y1: plot.top, y2: plot.bottom, style: styleFor(observation, mark, 'var(--color-foreground-tertiary)', { stroke: 'var(--color-foreground-tertiary)', fill: 'none', strokeWidth: theme.ruleStrokeWidth }) });
        else {
          const node = rectNode(observation, mark, 'var(--color-foreground-tertiary)', x1, x2, plot.top, plot.bottom, 0);
          node.style.fillOpacity = visualValue(observation.datum, observation.index, observation.source, mark.options.fillOpacity, theme.annotationFillOpacity);
          nodes.push(node);
        }
        return;
      }
      if ((mark.kind === 'rule-y' || mark.kind === 'band-y') && (observation.y !== undefined || finiteNumber(observation.y1))) {
        const y1 = scalePosition(yScale, (observation.y1 ?? observation.y) as ChartValue);
        const y2 = scalePosition(yScale, (observation.y2 ?? observation.y) as ChartValue);
        if (y1 === undefined || y2 === undefined) return;
        if (mark.kind === 'rule-y') nodes.push({ type: 'line', key: observation.sceneKey, markId: observation.markId, x1: plot.left, x2: plot.right, y1, y2: y1, style: styleFor(observation, mark, 'var(--color-foreground-tertiary)', { stroke: 'var(--color-foreground-tertiary)', fill: 'none', strokeWidth: theme.ruleStrokeWidth }) });
        else {
          const node = rectNode(observation, mark, 'var(--color-foreground-tertiary)', plot.left, plot.right, y1, y2, 0);
          node.style.fillOpacity = visualValue(observation.datum, observation.index, observation.source, mark.options.fillOpacity, theme.annotationFillOpacity);
          nodes.push(node);
        }
        return;
      }
      if (observation.x === undefined || observation.y === undefined) return;
      const x = scalePosition(xScale, observation.x);
      const y = scalePosition(yScale, observation.y);
      if (x === undefined || y === undefined) return;
      if (mark.kind === 'dot') {
        const radius = 'r' in mark.options ? visualValue(observation.datum, observation.index, observation.source, mark.options.r, theme.dotRadius) : theme.dotRadius;
        nodes.push({ type: 'circle', key: observation.sceneKey, markId: observation.markId, x, y, radius: dotCircleRadius(radius, theme.dotHaloWidth), style: styleFor(observation, mark, color, { fill: color, stroke: 'var(--color-background-primary)', strokeWidth: theme.dotHaloWidth }) });
      } else if (mark.kind === 'text' && observation.text) {
        const options = mark.options;
        nodes.push({
          type: 'text', key: observation.sceneKey, markId: observation.markId, x: Math.max(plot.left, Math.min(plot.right, x)), y: Math.max(plot.top, Math.min(plot.bottom, y)), text: observation.text,
          dx: 'dx' in options ? visualValue(observation.datum, observation.index, observation.source, options.dx, 0) : 0,
          dy: 'dy' in options ? visualValue(observation.datum, observation.index, observation.source, options.dy, 0) : 0,
          style: {
            ...styleFor(observation, mark, 'var(--color-foreground-primary)', { fill: 'var(--color-foreground-primary)', stroke: 'none' }),
            fontFamily: 'fontFamily' in options ? visualValue(observation.datum, observation.index, observation.source, options.fontFamily, 'var(--typography-font-family)') : undefined,
            fontSize: 'fontSize' in options ? visualValue(observation.datum, observation.index, observation.source, options.fontSize, 'var(--typography-fontsize-xs)') : undefined,
            fontWeight: 'fontWeight' in options ? visualValue(observation.datum, observation.index, observation.source, options.fontWeight, 'var(--typography-weight-medium)') : undefined,
            textAnchor: 'textAnchor' in options ? visualValue(observation.datum, observation.index, observation.source, options.textAnchor, 'middle') : 'middle',
          },
        });
      }
      if (mark.options.interactive !== false) points.push(pointFor(observation, x, y, color));
    });
  });
  return { nodes, points };
}

function polarAngle(coordinate: ChartPolarCoordinate, fraction: number): number {
  const start = coordinate.startAngle ?? 0;
  const end = coordinate.endAngle ?? Math.PI * 2;
  return start + fraction * (end - start);
}

function polarPoint(centerX: number, centerY: number, angle: number, radius: number) {
  return { x: centerX + Math.sin(angle) * radius, y: centerY - Math.cos(angle) * radius };
}

export function resolveDonutPadAngle(gap: number, innerRadius: number, outerRadius: number): number {
  return gap / Math.max(1, Math.hypot(innerRadius, outerRadius));
}

function buildPolarScene(
  spec: ChartSpec,
  marks: readonly ChartMark[],
  observations: Observation[][],
  width: number,
  height: number,
  locale: string,
  colorFor: (observation: Observation) => string,
  theme: ChartTheme,
  measurer: ChartTextMeasurer,
): Pick<ChartScene, 'plot' | 'guides' | 'nodes' | 'points'> {
  const coordinate = spec.coordinate as ChartPolarCoordinate;
  const angleDomain = distinct([...(spec.angle?.domain ?? []), ...observations.flatMap(group => group.map(observation => observation.angle).filter(validValue))]);
  const angleFor = (value: ChartValue): number => {
    const index = Math.max(0, angleDomain.findIndex(candidate => chartValueKey(candidate) === chartValueKey(value)));
    return polarAngle(coordinate, angleDomain.length > 0 ? index / angleDomain.length : 0);
  };
  const requestedMargin = resolveMargin(spec, true);
  let margin = requestedMargin;
  let plot = plotFor(width, height, margin);
  let centerX = (plot.left + plot.right) / 2;
  let centerY = (plot.top + plot.bottom) / 2;
  let availableRadius = Math.max(0, Math.min(plot.width, plot.height) / 2);
  let outerRadius = availableRadius * (coordinate.outerRadius ?? 1);
  if ((coordinate.grid ?? 'polygon') === 'polygon') {
    for (let pass = 0; pass < 8; pass += 1) {
      let overflowTop = 0;
      let overflowRight = 0;
      let overflowBottom = 0;
      let overflowLeft = 0;
      angleDomain.forEach(angleValue => {
        const angle = angleFor(angleValue);
        const localX = Math.sin(angle);
        const localY = -Math.cos(angle);
        const position = polarPoint(centerX, centerY, angle, outerRadius + theme.polarLabelGap);
        const measurement = measurer(spec.angle?.ticks?.format?.(angleValue, locale) ?? formatTick(angleValue, locale));
        const left = localX < -0.01 ? position.x - measurement.width : localX > 0.01 ? position.x : position.x - measurement.width / 2;
        const right = localX < -0.01 ? position.x : localX > 0.01 ? position.x + measurement.width : position.x + measurement.width / 2;
        const top = localY < -0.01 ? position.y - measurement.height : localY > 0.01 ? position.y : position.y - measurement.height / 2;
        const bottom = localY < -0.01 ? position.y : localY > 0.01 ? position.y + measurement.height : position.y + measurement.height / 2;
        overflowTop = Math.max(overflowTop, -top);
        overflowRight = Math.max(overflowRight, right - width);
        overflowBottom = Math.max(overflowBottom, bottom - height);
        overflowLeft = Math.max(overflowLeft, -left);
      });
      if (Math.max(overflowTop, overflowRight, overflowBottom, overflowLeft) <= 0.25) break;
      margin = {
        top: margin.top + overflowTop,
        right: margin.right + overflowRight * 2,
        bottom: margin.bottom + overflowBottom,
        left: margin.left + overflowLeft * 2,
      };
      plot = plotFor(width, height, margin);
      centerX = (plot.left + plot.right) / 2;
      centerY = (plot.top + plot.bottom) / 2;
      availableRadius = Math.max(0, Math.min(plot.width, plot.height) / 2);
      outerRadius = availableRadius * (coordinate.outerRadius ?? 1);
    }
  }
  const defaultInnerRadius = outerRadius * (coordinate.innerRadius ?? 0);
  const radiusValues = observations.flatMap(group => group.flatMap(observation => [observation.radius, observation.radius1, observation.radius2].filter(finiteNumber)));
  const radiusOptions = spec.radius ?? { scale: scaleLinear, nice: true };
  const radiusScale = resolveScale(radiusOptions, radiusValues, [0, outerRadius], true);
  const guides: ChartSceneNode[] = [];
  const nodes: ChartSceneNode[] = [];
  const points: ChartPoint[] = [];

  if ((coordinate.grid ?? 'polygon') === 'polygon' && angleDomain.length >= 3) {
    const tickValuesForRadius = radiusScale.scale.ticks?.(4) ?? radiusScale.domain;
    tickValuesForRadius.filter(value => finiteNumber(value) && value > 0).forEach((value, ringIndex) => {
      const ringRadius = scalePosition(radiusScale, value);
      if (ringRadius === undefined) return;
      const polygon = [...angleDomain, angleDomain[0]].map(angle => polarPoint(centerX, centerY, angleFor(angle), ringRadius));
      const d = lineShape<{ x: number; y: number }>().x(point => point.x).y(point => point.y)(polygon);
      if (d) guides.push({ type: 'path', key: `polar-ring:${ringIndex}`, markId: 'polar-guide', d, style: { fill: 'none', stroke: 'var(--color-foreground-quaternary)', strokeWidth: theme.gridStrokeWidth } });
    });
    angleDomain.forEach((angleValue, index) => {
      const angle = angleFor(angleValue);
      const end = polarPoint(centerX, centerY, angle, outerRadius);
      const label = polarPoint(centerX, centerY, angle, outerRadius + theme.polarLabelGap);
      const localX = Math.sin(angle);
      const localY = -Math.cos(angle);
      guides.push(
        { type: 'line', key: `polar-spoke:${index}`, markId: 'polar-guide', className: 'chart__grid chart__polar-guide', x1: centerX, y1: centerY, x2: end.x, y2: end.y, style: { fill: 'none', stroke: 'var(--color-foreground-quaternary)', strokeWidth: theme.gridStrokeWidth } },
        { type: 'text', key: `polar-label:${index}`, markId: 'polar-guide', className: 'chart__tick chart__polar-label', measure: true, x: label.x, y: label.y, text: spec.angle?.ticks?.format?.(angleValue, locale) ?? formatTick(angleValue, locale), dominantBaseline: localY < -0.01 ? 'auto' : localY > 0.01 ? 'hanging' : 'middle', style: { fill: 'var(--color-foreground-secondary)', stroke: 'none', textAnchor: localX < -0.01 ? 'end' : localX > 0.01 ? 'start' : 'middle', fontFamily: 'var(--typography-font-family)', fontSize: 'var(--typography-fontsize-xs)', fontWeight: 'var(--typography-weight-medium)' } },
      );
    });
  }

  marks.forEach((mark, markIndex) => {
    const markObservations = observations[markIndex];
    if (mark.kind === 'arc') {
      markObservations.forEach(observation => {
        if (!finiteNumber(observation.theta1) || !finiteNumber(observation.theta2)) return;
        const options = mark.options;
        const inner = 'innerRadius' in options ? visualValue(observation.datum, observation.index, observation.source, options.innerRadius, defaultInnerRadius / Math.max(1, outerRadius)) * outerRadius : defaultInnerRadius;
        const outer = 'outerRadius' in options ? visualValue(observation.datum, observation.index, observation.source, options.outerRadius, 1) * outerRadius : outerRadius;
        const corner = 'cornerRadius' in options ? visualValue(observation.datum, observation.index, observation.source, options.cornerRadius, theme.polarCornerRadius) : theme.polarCornerRadius;
        const defaultPadAngle = markObservations.length > 1 && inner > 0
          ? resolveDonutPadAngle(theme.donutGap, inner, outer)
          : 0;
        const padAngle = 'padAngle' in options ? visualValue(observation.datum, observation.index, observation.source, options.padAngle, defaultPadAngle) : defaultPadAngle;
        const generator = arcShape<{ startAngle: number; endAngle: number }>().innerRadius(Math.max(0, inner)).outerRadius(Math.max(0, outer)).cornerRadius(corner).padAngle(padAngle);
        const arcDatum = { startAngle: polarAngle(coordinate, observation.theta1), endAngle: polarAngle(coordinate, observation.theta2) };
        const d = generator(arcDatum);
        if (!d) return;
        const color = colorFor(observation);
        nodes.push({ type: 'path', key: observation.sceneKey, markId: observation.markId, d, transform: `translate(${centerX} ${centerY})`, style: styleFor(observation, mark, color, { fill: color, stroke: 'var(--color-background-primary)', strokeWidth: 0 }) });
        const [localX, localY] = generator.centroid(arcDatum);
        if (mark.options.interactive !== false) points.push(pointFor(observation, centerX + localX, centerY + localY, color, { xValue: observation.label ?? observation.datumKey, yValue: observation.value ?? observation.theta2 - observation.theta1, value: observation.value ?? observation.theta2 - observation.theta1 }));
      });
      return;
    }

    if (mark.kind === 'radial-line' || mark.kind === 'radial-area') {
      groupObservations(markObservations).forEach(group => {
        const first = group[0];
        if (!first) return;
        const valid = group.filter(observation => observation.angle !== undefined && finiteNumber(observation.radius));
        if (valid.length === 0) return;
        const color = colorFor(first);
        if (mark.kind === 'radial-line') {
          const generator = lineRadial<Observation>().angle(observation => angleFor(observation.angle as ChartValue)).radius(observation => scalePosition(radiusScale, observation.radius as number) ?? 0).curve('curve' in mark.options && mark.options.curve ? mark.options.curve : curveLinearClosed);
          const d = generator(valid);
          if (d) nodes.push({ type: 'path', key: `${first.markId}:series:${chartValueKey(first.z ?? first.color ?? 'series')}`, markId: first.markId, d, transform: `translate(${centerX} ${centerY})`, style: styleFor(first, mark, color, { fill: 'none', stroke: color, strokeWidth: theme.seriesStrokeWidth }) });
        } else {
          const generator = areaRadial<Observation>().angle(observation => angleFor(observation.angle as ChartValue)).innerRadius(observation => scalePosition(radiusScale, observation.radius1 ?? 0) ?? 0).outerRadius(observation => scalePosition(radiusScale, observation.radius2 ?? observation.radius ?? 0) ?? 0).curve('curve' in mark.options && mark.options.curve ? mark.options.curve : curveLinearClosed);
          const d = generator(valid);
          if (d) nodes.push({ type: 'path', key: `${first.markId}:series:${chartValueKey(first.z ?? first.color ?? 'series')}`, markId: first.markId, d, transform: `translate(${centerX} ${centerY})`, style: styleFor(first, mark, color, { fill: color, stroke: color, fillOpacity: theme.areaOpacity, strokeWidth: theme.seriesStrokeWidth }) });
        }
        valid.forEach(observation => {
          const radialPosition = scalePosition(radiusScale, observation.radius as number);
          if (radialPosition === undefined || observation.angle === undefined) return;
          const position = polarPoint(centerX, centerY, angleFor(observation.angle), radialPosition);
          if (mark.options.interactive !== false) points.push(pointFor(observation, position.x, position.y, color));
        });
      });
      return;
    }

    if (mark.kind === 'radial-dot') {
      markObservations.forEach(observation => {
        if (observation.angle === undefined || !finiteNumber(observation.radius)) return;
        const radialPosition = scalePosition(radiusScale, observation.radius);
        if (radialPosition === undefined) return;
        const position = polarPoint(centerX, centerY, angleFor(observation.angle), radialPosition);
        const color = colorFor(observation);
        const radius = 'r' in mark.options ? visualValue(observation.datum, observation.index, observation.source, mark.options.r, theme.dotRadius) : theme.dotRadius;
        nodes.push({ type: 'circle', key: observation.sceneKey, markId: observation.markId, x: position.x, y: position.y, radius: dotCircleRadius(radius, theme.dotHaloWidth), style: styleFor(observation, mark, color, { fill: color, stroke: 'var(--color-background-primary)', strokeWidth: theme.dotHaloWidth }) });
        if (mark.options.interactive !== false) points.push(pointFor(observation, position.x, position.y, color));
      });
    }
  });
  const arcMarkIds = new Set(
    marks
      .map((mark, index) => mark.kind === 'arc' ? mark.options.id ?? `${mark.kind}-${index}` : undefined)
      .filter((value): value is string => value !== undefined),
  );
  if (
    arcMarkIds.size > 0 &&
    defaultInnerRadius > 0 &&
    !nodes.some(node => arcMarkIds.has(node.markId))
  ) {
    const generator = arcShape<{ startAngle: number; endAngle: number }>()
      .innerRadius(defaultInnerRadius)
      .outerRadius(outerRadius);
    const d = generator({
      startAngle: coordinate.startAngle ?? 0,
      endAngle: coordinate.endAngle ?? Math.PI * 2,
    });
    if (d) {
      nodes.push({
        type: 'path',
        key: 'polar-empty-track',
        markId: 'polar-empty-track',
        d,
        transform: `translate(${centerX} ${centerY})`,
        style: { fill: 'var(--color-background-faint-neutral)', stroke: 'none' },
      });
    }
  }
  return { plot, guides, nodes, points };
}

export function compileChartScene(
  definition: ChartDefinition,
  width: number,
  height: number,
  locale = 'en',
  measurer: ChartTextMeasurer = text => ({ width: text.length * 7, height: 14 }),
  theme: ChartTheme = defaultChartTheme,
): ChartScene {
  const spec = normalizeCoordinateContainers(resolveSpec(definition, width, height));
  const marks = spec.marks as readonly ChartMark[];
  const observations = marks.map(observationsForMark);
  const colorFor = colorResolver(spec, observations);
  const polar = spec.coordinate?.type === 'polar';
  if (polar) {
    const built = buildPolarScene(spec, marks, observations, width, height, locale, colorFor, theme, measurer);
    return { width, height, coordinate: 'polar', ...built, xAxis: { ...EMPTY_AXIS }, yAxis: { ...EMPTY_AXIS }, center: spec.center, focus: spec.focus ?? 'nearest', maxFocusDistance: spec.maxFocusDistance, tooltip: spec.tooltip, clip: spec.clip ?? true };
  }

  if (!spec.x || !spec.y) throw new TypeError('Cartesian chart definitions require x and y scale options.');
  const requestedMargin = resolveMargin(spec);
  const xValues = axisValues(marks, observations, 'x');
  const yValues = axisValues(marks, observations, 'y');
  let margin = requestedMargin;
  let plot = plotFor(width, height, margin);
  let xScale = resolveScale(spec.x, xValues.values, [plot.left, plot.right], xValues.includeZero);
  let yScale = resolveScale(spec.y, yValues.values, [plot.bottom, plot.top], yValues.includeZero);
  let xAxis = sceneAxis(spec.x, xScale, locale, plot.width, true, measurer);
  let yAxis = sceneAxis(spec.y, yScale, locale, plot.height, false, measurer);
  for (let pass = 0; pass < 4; pass += 1) {
    const nextMargin = solveCartesianMargins(width, height, requestedMargin, xAxis, yAxis, plot, measurer);
    const settled = (['top', 'right', 'bottom', 'left'] as const).every(side => Math.abs(nextMargin[side] - margin[side]) <= 0.25);
    margin = nextMargin;
    plot = plotFor(width, height, margin);
    xScale = resolveScale(spec.x, xValues.values, [plot.left, plot.right], xValues.includeZero);
    yScale = resolveScale(spec.y, yValues.values, [plot.bottom, plot.top], yValues.includeZero);
    xAxis = sceneAxis(spec.x, xScale, locale, plot.width, true, measurer);
    yAxis = sceneAxis(spec.y, yScale, locale, plot.height, false, measurer);
    if (settled) break;
  }
  const built = buildCartesianNodes(marks, observations, xScale, yScale, plot, colorFor, theme);
  return { width, height, coordinate: 'cartesian', plot, xAxis, yAxis, guides: [], nodes: built.nodes, points: built.points, center: spec.center, focus: spec.focus ?? 'nearest', maxFocusDistance: spec.maxFocusDistance, tooltip: spec.tooltip, clip: spec.clip ?? true };
}

export function findChartFocus(
  points: readonly ChartPoint[],
  mode: NonNullable<ChartSpec['focus']>,
  x: number,
  y: number,
  maxDistance = Number.POSITIVE_INFINITY,
): { primary: ChartPoint; points: ChartPoint[] } | undefined {
  if (mode === 'none' || points.length === 0) return undefined;
  const distance = (point: ChartPoint): number => {
    if (mode === 'nearest-x' || mode === 'group-x') return Math.abs(point.x - x);
    if (mode === 'nearest-y' || mode === 'group-y') return Math.abs(point.y - y);
    return Math.hypot(point.x - x, point.y - y);
  };
  const primary = points.reduce((nearest, point) => distance(point) < distance(nearest) ? point : nearest);
  if (distance(primary) > maxDistance) return undefined;
  if (mode === 'group-x') return { primary, points: points.filter(point => chartValueKey(point.xValue) === chartValueKey(primary.xValue)) };
  if (mode === 'group-y') return { primary, points: points.filter(point => chartValueKey(point.yValue) === chartValueKey(primary.yValue)) };
  return { primary, points: [primary] };
}
