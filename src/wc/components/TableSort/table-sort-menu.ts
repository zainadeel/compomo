import type { MenuItemData, MenuSection } from '../Menu/menu-types';
import { isTableActionColumn } from '../Table/table-column-customizer';
import type { TableColumn, TableSortState } from '../Table/table-types';

export const TABLE_SORT_DIRECTION_ASC = 'direction:asc';
export const TABLE_SORT_DIRECTION_DESC = 'direction:desc';
const TABLE_SORT_FIELD_PREFIX = 'field:';

export interface TableSortField {
  id: string;
  label: string;
}

/** Sortable data fields from the catalog, including compound header segments. */
export function tableSortFields(columns: readonly TableColumn[]): TableSortField[] {
  const fields: TableSortField[] = [];
  const seen = new Set<string>();

  for (const column of columns) {
    if (isTableActionColumn(column) || !column.sortable) continue;
    const segments = column.headerSegments?.filter(segment => segment.sortKey.trim()) ?? [];
    if (segments.length > 0) {
      for (const segment of segments) {
        if (seen.has(segment.sortKey)) continue;
        seen.add(segment.sortKey);
        fields.push({
          id: segment.sortKey,
          label: segment.label.trim() || segment.sortKey,
        });
      }
      continue;
    }
    if (seen.has(column.id)) continue;
    seen.add(column.id);
    fields.push({
      id: column.id,
      label: column.header.trim() || column.headerLabel?.trim() || column.id,
    });
  }

  return fields;
}

export function tableSortMenuSections(
  columns: readonly TableColumn[],
  sort: TableSortState | null | undefined
): MenuSection[] {
  const fields = tableSortFields(columns);
  return [
    {
      header: 'Data',
      items: fields.map(field => ({
        label: field.label,
        value: `${TABLE_SORT_FIELD_PREFIX}${encodeURIComponent(field.id)}`,
        isSelected: sort?.columnId === field.id,
      })),
    },
    {
      header: 'Direction',
      items: [
        {
          label: 'Ascending',
          value: TABLE_SORT_DIRECTION_ASC,
          icon: 'ArrowUp',
          isSelected: sort?.direction === 'asc',
        },
        {
          label: 'Descending',
          value: TABLE_SORT_DIRECTION_DESC,
          icon: 'ArrowDown',
          isSelected: sort?.direction === 'desc',
        },
      ],
    },
  ];
}

export function tableSortStatesEqual(
  left: TableSortState | null | undefined,
  right: TableSortState | null | undefined
): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  return left.columnId === right.columnId && left.direction === right.direction;
}

/** Next controlled sort from a Sort menu selection. Does not toggle like a header click. */
export function nextTableSortStateFromMenuItem(
  columns: readonly TableColumn[],
  current: TableSortState | null | undefined,
  item: MenuItemData
): TableSortState | null {
  const fields = tableSortFields(columns);
  if (fields.length === 0) return current ?? null;

  if (item.value === TABLE_SORT_DIRECTION_ASC || item.value === TABLE_SORT_DIRECTION_DESC) {
    const direction = item.value === TABLE_SORT_DIRECTION_ASC ? 'asc' : 'desc';
    const columnId = fields.some(field => field.id === current?.columnId)
      ? current!.columnId
      : fields[0]!.id;
    return { columnId, direction };
  }

  if (!item.value?.startsWith(TABLE_SORT_FIELD_PREFIX)) return current ?? null;
  let columnId: string;
  try {
    columnId = decodeURIComponent(item.value.slice(TABLE_SORT_FIELD_PREFIX.length));
  } catch {
    return current ?? null;
  }
  if (!fields.some(field => field.id === columnId)) return current ?? null;
  if (current?.columnId === columnId) return current ?? null;
  return { columnId, direction: current?.direction ?? 'asc' };
}
