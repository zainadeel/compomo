import {
  isTableCellAction,
  isTableCellBlank,
  isTableCellEmpty,
  isTableCellIcon,
  isTableCellIconText,
  isTableCellImage,
  isTableCellPrimaryText,
  isTableCellTag,
  isTableCellTags,
  isTableCellText,
} from './table-model';
import type {
  TableCellAction,
  TableCellBlank,
  TableCellEmpty,
  TableCellIcon,
  TableCellImage,
  TableCellImageTracks,
  TableCellTag,
  TableCellTags,
  TableCellTagVariant,
  TableCellTextRun,
  TableCellTextTrack,
  TableCellValue,
  TableCellLinkTarget,
  TableCellLineClamp,
  TableCellMaxLines,
  TableColumn,
} from './table-types';
import type { IconColor } from '../Icon/Icon';
import type { TextColor } from '../Text/text-types';

/** Maximum independently colored runs on one secondary or tertiary track. */
export const TABLE_CELL_TEXT_RUN_LIMIT = 3;

export interface ResolvedTableCellText {
  primary: string | number;
  secondary?: TableCellTextRun[];
  tertiary?: TableCellTextRun[];
  secondaryColor?: TextColor;
  tertiaryColor?: TextColor;
  href?: string;
  target?: TableCellLinkTarget;
  wrap?: boolean;
  fontFeature?: 'normal' | 'tabular-nums';
}

export type TableCellPresentation =
  | { kind: 'blank'; cellType: 'blank'; value: TableCellBlank }
  | { kind: 'empty'; cellType: 'empty'; value: TableCellEmpty | null | undefined }
  | { kind: 'icon'; cellType: 'icon'; value: TableCellIcon }
  | {
      kind: 'icon-text';
      cellType: 'icon-text';
      icon: string;
      iconColor?: IconColor;
      iconLabel?: string;
      value: ResolvedTableCellText;
      variant: 'single' | 'multi' | 'triple';
      wraps: boolean;
      lineClamp: TableCellLineClamp;
    }
  | {
      kind: 'image';
      cellType: 'image';
      value: TableCellImage;
      variant: 'single' | 'multi' | 'triple';
    }
  | { kind: 'action'; cellType: 'action'; value: TableCellAction }
  | {
      kind: 'tag';
      cellType: 'tag';
      value: TableCellTag;
      variant: TableCellTagVariant;
    }
  | {
      kind: 'tags';
      cellType: 'tags';
      value: TableCellTags;
      tracks: number;
      variant: `${number}-track`;
    }
  | {
      kind: 'text';
      cellType: 'text' | 'primary-text';
      value: ResolvedTableCellText;
      primaryText: boolean;
      singleLine: boolean;
      variant: 'single' | 'multi' | 'triple' | 'primary-pair';
      wraps: boolean;
      lineClamp: TableCellLineClamp;
    };

function trackText(value: string | number | TableCellTextRun): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value);
    return text.trim() === '' ? undefined : text;
  }
  const text = value.text?.trim();
  return text ? value.text : undefined;
}

/** Resolve an image cell's track stack; unknown values fall back to one track. */
export function resolveTableCellImageTracks(
  tracks: TableCellImage['tracks']
): TableCellImageTracks {
  return tracks === 2 || tracks === 3 ? tracks : 1;
}

/** Map an image track stack onto the shared single/multi/triple cell variant. */
export function tableCellImageVariant(tracks: TableCellImageTracks): 'single' | 'multi' | 'triple' {
  return tracks === 3 ? 'triple' : tracks === 2 ? 'multi' : 'single';
}

/** Normalize the declared line count used by wrapping multiple-Tag cells. */
export function resolveTableCellTagsTracks(tracks: number): number {
  return Number.isFinite(tracks) && tracks > 0 ? Math.floor(tracks) : 1;
}

/** Token-backed content height for any named number of body-row tracks. */
export function tableCellTrackStackBlockSize(tracks: number): string {
  const laterTracks = Math.max(0, resolveTableCellTagsTracks(tracks) - 1);
  return `calc(var(--_table-cell-track-min-block-size)${' + var(--dimension-space-025) + var(--dimension-size-250)'.repeat(laterTracks)})`;
}

/** Collapse a consumer track into at most three non-empty runs. */
export function normalizeTableCellTextTrack(
  track: TableCellTextTrack | number | undefined
): TableCellTextRun[] | undefined {
  if (track == null) return undefined;
  const items = Array.isArray(track) ? track : [track];
  const runs: TableCellTextRun[] = [];
  for (const item of items) {
    if (runs.length >= TABLE_CELL_TEXT_RUN_LIMIT) break;
    const text = trackText(item);
    if (text === undefined) continue;
    runs.push(
      typeof item === 'object' && item !== null && 'color' in item && item.color
        ? { text, color: item.color }
        : { text }
    );
  }
  return runs.length ? runs : undefined;
}

/** Map wrap / maxLines onto wrap-to-track geometry and a line clamp. */
export function resolveTableCellTextOverflow(
  source: { wrap?: boolean; maxLines?: TableCellMaxLines },
  column: TableColumn
): { wraps: boolean; lineClamp: TableCellLineClamp } {
  const wrap = source.wrap ?? column.wrap ?? false;
  const maxLines = source.maxLines ?? (source.wrap === true ? undefined : column.maxLines);
  if (maxLines != null) {
    return { wraps: maxLines > 1, lineClamp: maxLines };
  }
  if (wrap) return { wraps: true, lineClamp: 'none' };
  return { wraps: false, lineClamp: 1 };
}

/** ds-text overflow props for a resolved clamp. */
export function tableCellTextOverflowProps(lineClamp: TableCellLineClamp): {
  lineTruncation: TableCellLineClamp;
  wrap: 'wrap' | 'nowrap';
} {
  if (lineClamp === 'none') return { lineTruncation: 'none', wrap: 'wrap' };
  if (lineClamp === 1) return { lineTruncation: 1, wrap: 'nowrap' };
  return { lineTruncation: lineClamp, wrap: 'wrap' };
}

function resolveTextPresentation(
  source: {
    primary: string | number;
    secondary?: TableCellTextTrack | number;
    tertiary?: TableCellTextTrack;
    secondaryColor?: TextColor;
    tertiaryColor?: TextColor;
    href?: string;
    target?: TableCellLinkTarget;
    wrap?: boolean;
    maxLines?: TableCellMaxLines;
    fontFeature?: 'normal' | 'tabular-nums';
  },
  column: TableColumn,
  options: { primaryText: boolean; allowTertiary: boolean }
): {
  value: ResolvedTableCellText;
  singleLine: boolean;
  variant: 'single' | 'multi' | 'triple' | 'primary-pair';
  wraps: boolean;
  lineClamp: TableCellLineClamp;
} {
  const secondary = normalizeTableCellTextTrack(source.secondary);
  const tertiary = options.allowTertiary ? normalizeTableCellTextTrack(source.tertiary) : undefined;
  const value: ResolvedTableCellText = {
    primary: source.primary,
    ...(secondary ? { secondary } : {}),
    ...(tertiary ? { tertiary } : {}),
    ...(source.secondaryColor ? { secondaryColor: source.secondaryColor } : {}),
    ...(source.tertiaryColor ? { tertiaryColor: source.tertiaryColor } : {}),
    ...(source.href ? { href: source.href } : {}),
    ...(source.target ? { target: source.target } : {}),
    ...(source.wrap ? { wrap: source.wrap } : {}),
    ...(source.fontFeature ? { fontFeature: source.fontFeature } : {}),
  };
  const singleLine = !options.primaryText && !secondary && !tertiary;
  const overflow = resolveTableCellTextOverflow(source, column);
  return {
    value,
    singleLine,
    variant: options.primaryText
      ? 'primary-pair'
      : tertiary
        ? 'triple'
        : singleLine
          ? 'single'
          : 'multi',
    wraps: overflow.wraps,
    lineClamp: overflow.lineClamp,
  };
}

/** Resolve a cell's semantic and visual recipe once for both markup and classes. */
export function resolveTableCellPresentation(
  value: TableCellValue,
  column: TableColumn
): TableCellPresentation {
  if (isTableCellBlank(value)) return { kind: 'blank', cellType: 'blank', value };
  if (value == null || isTableCellEmpty(value)) {
    return { kind: 'empty', cellType: 'empty', value };
  }
  if (isTableCellIcon(value)) return { kind: 'icon', cellType: 'icon', value };
  if (isTableCellIconText(value)) {
    const text = resolveTextPresentation(value, column, {
      primaryText: false,
      allowTertiary: true,
    });
    return {
      kind: 'icon-text',
      cellType: 'icon-text',
      icon: value.icon,
      ...(value.iconColor ? { iconColor: value.iconColor } : {}),
      ...(value.iconLabel ? { iconLabel: value.iconLabel } : {}),
      value: text.value,
      variant: text.variant === 'primary-pair' ? 'single' : text.variant,
      wraps: text.wraps,
      lineClamp: text.lineClamp,
    };
  }
  if (isTableCellImage(value)) {
    return {
      kind: 'image',
      cellType: 'image',
      value,
      variant: tableCellImageVariant(resolveTableCellImageTracks(value.tracks)),
    };
  }
  if (isTableCellAction(value)) return { kind: 'action', cellType: 'action', value };
  if (isTableCellTag(value)) {
    return {
      kind: 'tag',
      cellType: 'tag',
      value,
      variant: value.variant ?? 'tag-only',
    };
  }
  if (isTableCellTags(value)) {
    const tracks = resolveTableCellTagsTracks(value.tracks);
    return {
      kind: 'tags',
      cellType: 'tags',
      value,
      tracks,
      variant: `${tracks}-track`,
    };
  }

  const primaryText = isTableCellPrimaryText(value);
  const source =
    isTableCellText(value) || primaryText
      ? value
      : {
          primary: value,
          fontFeature: typeof value === 'number' ? ('tabular-nums' as const) : ('normal' as const),
        };
  const text = resolveTextPresentation(isTableCellText(value) ? value : source, column, {
    primaryText,
    allowTertiary: isTableCellText(value),
  });
  return {
    kind: 'text',
    cellType: primaryText ? 'primary-text' : 'text',
    value: text.value,
    primaryText,
    singleLine: text.singleLine,
    variant: text.variant,
    wraps: text.wraps,
    lineClamp: text.lineClamp,
  };
}
