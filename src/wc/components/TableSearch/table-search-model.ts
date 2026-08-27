import { isTableActionColumn } from '../Table/table-column-customizer';
import type { TableColumn } from '../Table/table-types';
import type { TableSearchField } from './table-search-types';

/** Searchable data points from the table catalog, including compound header segments. */
export function tableSearchFields(columns: readonly TableColumn[]): TableSearchField[] {
  const resolved: TableSearchField[] = [];
  const seen = new Set<string>();

  for (const column of columns) {
    if (isTableActionColumn(column) || column.searchable === false) continue;
    const segments = column.headerSegments ?? [];
    if (segments.length > 0) {
      for (const segment of segments) {
        const id = segment.sortKey.trim();
        const label = segment.dataLabel?.trim() || segment.label.trim() || id;
        if (!id || !label || segment.searchable === false || seen.has(id)) continue;
        seen.add(id);
        resolved.push({ id, label });
      }
      continue;
    }

    const id = column.id.trim();
    const label =
      column.dataLabel?.trim() || column.header.trim() || column.headerLabel?.trim() || id;
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    resolved.push({ id, label });
  }

  return resolved;
}

export function selectedTableSearchFields(
  fields: readonly TableSearchField[],
  selectedFieldIds: string[]
): TableSearchField[] {
  const byId = new Map(fields.map(field => [field.id, field]));
  const selected: TableSearchField[] = [];
  const seen = new Set<string>();

  for (const fieldId of selectedFieldIds) {
    if (seen.has(fieldId)) continue;
    const field = byId.get(fieldId);
    if (!field) continue;
    seen.add(fieldId);
    selected.push(field);
  }

  return selected;
}

export function availableTableSearchFields(
  fields: readonly TableSearchField[],
  selectedFieldIds: string[]
): TableSearchField[] {
  const selected = new Set(selectedFieldIds);
  return fields.filter(field => !selected.has(field.id));
}

/** Matches the field-picker query against the complete visible label and canonical identity. */
export function filterTableSearchFields(
  fields: readonly TableSearchField[],
  query: string
): TableSearchField[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [...fields];

  return fields.filter(field =>
    `${field.label} ${field.id}`.toLocaleLowerCase().includes(normalizedQuery)
  );
}

export function nextTableSearchActiveIndex(
  currentIndex: number,
  optionCount: number,
  direction: 1 | -1
): number {
  if (optionCount <= 0) return -1;
  const safeIndex = currentIndex >= 0 && currentIndex < optionCount ? currentIndex : 0;
  return (safeIndex + direction + optionCount) % optionCount;
}
