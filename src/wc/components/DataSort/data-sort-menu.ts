import type { MenuItemData, MenuSection } from '../Menu/menu-types';
import { isTableActionColumn } from '../Table/table-column-customizer';
import type { TableColumn, DataSortState } from '../Table/table-types';

export const TABLE_SORT_DIRECTION_ASC = 'direction:asc';
export const TABLE_SORT_DIRECTION_DESC = 'direction:desc';
const TABLE_SORT_FIELD_PREFIX = 'field:';

export interface TableSortField {
  id: string;
  label: string;
}

/** Sortable data fields from the catalog, including compound header segments. */
export function dataSortFields(columns: readonly TableColumn[]): TableSortField[] {
  const fields: TableSortField[] = [];
  const seen = new Set<string>();

  for (const column of columns) {
    if (isTableActionColumn(column) || !column.sortable) continue;
    const segments = column.segments?.filter(segment => segment.sortKey.trim()) ?? [];
    if (segments.length > 0) {
      for (const segment of segments) {
        if (seen.has(segment.sortKey)) continue;
        seen.add(segment.sortKey);
        fields.push({
          id: segment.sortKey,
          label: segment.dataLabel?.trim() || segment.label.trim() || segment.sortKey,
        });
      }
      continue;
    }
    if (seen.has(column.id)) continue;
    seen.add(column.id);
    fields.push({
      id: column.id,
      label:
        column.dataLabel?.trim() ||
        column.label.trim() ||
        column.accessibleLabel?.trim() ||
        column.id,
    });
  }

  return fields;
}

export function dataSortMenuSections(
  columns: readonly TableColumn[],
  sort: DataSortState | null | undefined
): MenuSection[] {
  const fields = dataSortFields(columns);
  return [
    {
      header: 'Data',
      items: fields.map(field => ({
        label: field.label,
        value: `${TABLE_SORT_FIELD_PREFIX}${encodeURIComponent(field.id)}`,
        isSelected: sort?.fieldId === field.id,
      })),
    },
    {
      header: 'Order',
      items: [
        {
          label: 'Ascending',
          value: TABLE_SORT_DIRECTION_ASC,
          isSelected: sort?.direction === 'asc',
        },
        {
          label: 'Descending',
          value: TABLE_SORT_DIRECTION_DESC,
          isSelected: sort?.direction === 'desc',
        },
      ],
    },
  ];
}

export function dataSortStatesEqual(
  left: DataSortState | null | undefined,
  right: DataSortState | null | undefined
): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  return left.fieldId === right.fieldId && left.direction === right.direction;
}

/** Next controlled sort from a Sort menu selection. Does not toggle like a header click. */
export function nextDataSortStateFromMenuItem(
  columns: readonly TableColumn[],
  current: DataSortState | null | undefined,
  item: MenuItemData
): DataSortState | null {
  const fields = dataSortFields(columns);
  if (fields.length === 0) return current ?? null;

  if (item.value === TABLE_SORT_DIRECTION_ASC || item.value === TABLE_SORT_DIRECTION_DESC) {
    const direction = item.value === TABLE_SORT_DIRECTION_ASC ? 'asc' : 'desc';
    const fieldId = fields.some(field => field.id === current?.fieldId)
      ? current!.fieldId
      : fields[0]!.id;
    return { fieldId, direction };
  }

  if (!item.value?.startsWith(TABLE_SORT_FIELD_PREFIX)) return current ?? null;
  let fieldId: string;
  try {
    fieldId = decodeURIComponent(item.value.slice(TABLE_SORT_FIELD_PREFIX.length));
  } catch {
    return current ?? null;
  }
  if (!fields.some(field => field.id === fieldId)) return current ?? null;
  if (current?.fieldId === fieldId) return current ?? null;
  return { fieldId, direction: current?.direction ?? 'asc' };
}
