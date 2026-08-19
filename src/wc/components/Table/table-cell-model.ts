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
  TableCellTag,
  TableCellTagVariant,
  TableCellValue,
  TableCellLinkTarget,
  TableColumn,
} from './table-types';
import type { TextColor } from '../Text/text-types';

export interface ResolvedTableCellText {
  primary: string | number;
  secondary?: string | number;
  secondaryColor?: TextColor;
  href?: string;
  target?: TableCellLinkTarget;
  wrap?: boolean;
  fontFeature?: 'normal' | 'tabular-nums';
}

export type TableCellPresentation =
  | { kind: 'blank'; cellType: 'blank'; value: TableCellBlank }
  | { kind: 'empty'; cellType: 'empty'; value: TableCellEmpty | null | undefined }
  | { kind: 'icon'; cellType: 'icon'; value: TableCellIcon }
  | { kind: 'image'; cellType: 'image'; value: TableCellImage }
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
      variant: 'single' | 'multi' | 'primary-pair';
      wraps: boolean;
    };

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
  if (isTableCellImage(value)) return { kind: 'image', cellType: 'image', value };
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
  const text: ResolvedTableCellText = isTableCellText(value) || primaryText
    ? value
    : {
        primary: value,
        fontFeature: typeof value === 'number' ? 'tabular-nums' : 'normal',
      };
  const singleLine = !primaryText && (text.secondary === undefined || text.secondary === '');
  return {
    kind: 'text',
    cellType: primaryText ? 'primary-text' : 'text',
    value: text,
    primaryText,
    singleLine,
    variant: primaryText ? 'primary-pair' : singleLine ? 'single' : 'multi',
    wraps: text.wrap ?? column.wrap ?? false,
  };
}
