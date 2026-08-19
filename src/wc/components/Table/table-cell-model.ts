import {
  isTableCellAction,
  isTableCellBlank,
  isTableCellEmpty,
  isTableCellIcon,
  isTableCellImage,
  isTableCellPrimaryText,
  isTableCellTag,
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
  TableCellTagVariant,
  TableCellTextRun,
  TableCellTextTrack,
  TableCellValue,
  TableCellLinkTarget,
  TableColumn,
} from './table-types';
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
      kind: 'text';
      cellType: 'text' | 'primary-text';
      value: ResolvedTableCellText;
      primaryText: boolean;
      singleLine: boolean;
      variant: 'single' | 'multi' | 'triple' | 'primary-pair';
      wraps: boolean;
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
  tracks: TableCellImage['tracks'],
): TableCellImageTracks {
  return tracks === 2 || tracks === 3 ? tracks : 1;
}

/** Map an image track stack onto the shared single/multi/triple cell variant. */
export function tableCellImageVariant(
  tracks: TableCellImageTracks,
): 'single' | 'multi' | 'triple' {
  return tracks === 3 ? 'triple' : tracks === 2 ? 'multi' : 'single';
}

/** Collapse a consumer track into at most three non-empty runs. */
export function normalizeTableCellTextTrack(
  track: TableCellTextTrack | number | undefined,
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
        : { text },
    );
  }
  return runs.length ? runs : undefined;
}

/** Resolve a cell's semantic and visual recipe once for both markup and classes. */
export function resolveTableCellPresentation(
  value: TableCellValue,
  column: TableColumn,
): TableCellPresentation {
  if (isTableCellBlank(value)) return { kind: 'blank', cellType: 'blank', value };
  if (value == null || isTableCellEmpty(value)) {
    return { kind: 'empty', cellType: 'empty', value };
  }
  if (isTableCellIcon(value)) return { kind: 'icon', cellType: 'icon', value };
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

  const primaryText = isTableCellPrimaryText(value);
  const source: {
    primary: string | number;
    secondary?: TableCellTextTrack | number;
    wrap?: boolean;
    href?: string;
    target?: TableCellLinkTarget;
    fontFeature?: 'normal' | 'tabular-nums';
  } = isTableCellText(value) || primaryText
    ? value
    : {
        primary: value,
        fontFeature: typeof value === 'number' ? 'tabular-nums' : 'normal',
      };
  const secondary = normalizeTableCellTextTrack(source.secondary);
  const tertiary = primaryText || !isTableCellText(value)
    ? undefined
    : normalizeTableCellTextTrack(value.tertiary);
  const text: ResolvedTableCellText = {
    primary: source.primary,
    ...(secondary ? { secondary } : {}),
    ...(tertiary ? { tertiary } : {}),
    ...(isTableCellText(value) && value.secondaryColor
      ? { secondaryColor: value.secondaryColor }
      : {}),
    ...(isTableCellText(value) && value.tertiaryColor
      ? { tertiaryColor: value.tertiaryColor }
      : {}),
    ...('href' in source && source.href ? { href: source.href } : {}),
    ...('target' in source && source.target ? { target: source.target } : {}),
    ...(source.wrap ? { wrap: source.wrap } : {}),
    ...(source.fontFeature ? { fontFeature: source.fontFeature } : {}),
  };
  const singleLine = !primaryText && !secondary && !tertiary;
  return {
    kind: 'text',
    cellType: primaryText ? 'primary-text' : 'text',
    value: text,
    primaryText,
    singleLine,
    variant: primaryText ? 'primary-pair' : tertiary ? 'triple' : singleLine ? 'single' : 'multi',
    wraps: text.wrap ?? column.wrap ?? false,
  };
}
