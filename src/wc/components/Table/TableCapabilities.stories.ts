import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-table.js';
import '../../../../dist/components/ds-text.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-data-toolbar.js';
import '../../../../dist/components/ds-data-saved-views.js';
import '../../../../dist/components/ds-data-search.js';
import {
  REVIEW_COLUMNS,
  tableReviewRows,
  EDIT_COLUMNS,
  EDIT_ROWS,
  FIELD_COLUMNS,
  FIELD_ROWS,
  MERGE_COLUMNS,
  MERGE_ROWS,
} from './table-review-fixtures';
import type {
  TableRow,
  TableCellSpan,
  TableCellsChangeDetail,
  TableCellRange,
  DataFieldsConfigChangeDetail,
  DataSortChangeDetail,
  TableSelectionChangeDetail,
} from './table-types';

const meta: Meta = {
  title: 'Data display/Table/Capabilities',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;
const reviewRows = tableReviewRows();
let stressRows: ReturnType<typeof tableReviewRows> | undefined;
const spans: TableCellSpan[] = [
  { rowIds: ['west-am', 'west-pm'], columnIds: ['fleet'] },
  { rowIds: ['west-am'], columnIds: ['monday', 'tuesday'] },
  { rowIds: ['east'], columnIds: ['monday', 'tuesday', 'wednesday'] },
];
function selection(event: CustomEvent<TableSelectionChangeDetail>) {
  (event.currentTarget as HTMLDsTableElement).selectedRowIds = event.detail.selectedRowIds;
}
function fields(event: CustomEvent<DataFieldsConfigChangeDetail>) {
  Object.assign(event.currentTarget!, event.detail);
}
function sort(event: CustomEvent<DataSortChangeDetail>) {
  const table = event.currentTarget as HTMLDsTableElement;
  table.sort = event.detail.sort;
  const state = event.detail.sort;
  if (!state) return;
  const value = (row: TableRow) => {
    const cell = row.cells[state.fieldId];
    return String(
      cell && typeof cell === 'object' && 'primary' in cell ? cell.primary : (cell ?? '')
    );
  };
  table.rows = [...table.rows].sort(
    (a, b) =>
      value(a).localeCompare(value(b), undefined, { numeric: true }) *
      (state.direction === 'asc' ? 1 : -1)
  );
}
const description = (story: string) => ({ docs: { description: { story } } });

export const SuperHeaders: Story = {
  name: '493 · Column super-groups',
  parameters: description(
    'Location is ungrouped: compare its bottom-aligned header with the two stacked rows for Identity, Trip details and Review. The checkbox spans both rows. Use Customize to hide or reorder columns; bands split around unrelated fields and pin boundaries. Review both horizontal and vertical scrolling.'
  ),
  render: () =>
    html`<ds-table
      caption="Fleet review · grouped columns"
      caption-visibility="visible"
      .columns=${REVIEW_COLUMNS}
      .rows=${reviewRows}
      height="var(--dimension-card-height-lg)"
      sticky-header
      column-customizer
      selection-mode="multiple"
      @dsFieldsConfigChange=${fields}
      @dsSortChange=${sort}
      @dsSelectionChange=${selection}
    ></ds-table>`,
};
export const MultiplePins: Story = {
  name: '494 · Multiple pinned columns',
  parameters: description(
    'Selection, Driver and Vehicle pin at the start; Status and Actions pin at the end. Check shared cell tracks, boundary shadows, live column hiding/reorder, and the loading geometry. Resize the canvas to test crowded pins.'
  ),
  args: { loading: false },
  render: args =>
    html`<ds-table
      caption="Pinned fleet review"
      caption-visibility="visible"
      .columns=${REVIEW_COLUMNS}
      .rows=${args.loading ? [] : reviewRows}
      .loading=${args.loading}
      height="var(--dimension-card-height-lg)"
      sticky-header
      column-customizer
      selection-mode="multiple"
      @dsFieldsConfigChange=${fields}
      @dsSelectionChange=${selection}
      @dsSortChange=${sort}
    ></ds-table>`,
};
export const CellPresentation: Story = {
  name: '495 · Cell presentation and track alignment',
  parameters: description(
    'Compare the default first-track alignment against deliberately centered and bottom-aligned complete cell stacks. Left-edge intent accents have assistive explanations; trailing icons have accessible labels. The text/icon/tag/action track geometry is unchanged.'
  ),
  render: () =>
    html`<ds-table
      caption="Cell presentation"
      caption-visibility="visible"
      .columns=${REVIEW_COLUMNS.map(column => ({ ...column, sticky: undefined }))}
      .rows=${reviewRows.slice(0, 3).map((row, i) => ({
        ...row,
        cellPresentation: {
          ...row.cellPresentation,
          vehicle: { verticalAlign: (['top', 'middle', 'bottom'] as const)[i] },
          status: { verticalAlign: (['top', 'middle', 'bottom'] as const)[i] },
        },
      }))}
      selection-mode="multiple"
      @dsSelectionChange=${selection}
      @dsSortChange=${sort}
    ></ds-table>`,
};
export const MergedReport: Story = {
  name: '496 · Merged report cells',
  parameters: description(
    'An ungrouped, non-virtual report with native row and column spans. Selection remains per record. Spans name stable row and column identities; hiding a member or supplying an invalid/reordered rectangle leaves the original cells visible. Cross-row spans are intentionally rejected in virtual windows.'
  ),
  render: () =>
    html`<ds-table
      caption="Weekly fleet coverage"
      caption-visibility="visible"
      .columns=${MERGE_COLUMNS}
      .rows=${MERGE_ROWS}
      .cellSpans=${spans}
      column-customizer
      selection-mode="multiple"
      @dsFieldsConfigChange=${fields}
      @dsSelectionChange=${selection}
    ></ds-table>`,
};
export const EditableCells: Story = {
  name: '499 · Worksheet editing, ranges and clipboard',
  args: { rows: EDIT_ROWS, cellRange: null, lastChange: 'No changes yet', interactionMode: 'grid' },
  parameters: description(
    'A single click edits a worksheet cell immediately. Keyboard focus supports arrows, Home/End, Enter/F2 and typing; Shift+click or Shift+arrows extends a range without opening an editor. Enter commits and Escape cancels. Copy and paste plain TSV. Row 4 and Record ID are read-only: their content is muted but borders are unchanged, and navigation skips them. Changes are applied by this story’s application handler.'
  ),
  render: args => {
    const [, updateArgs] = useArgs();
    return html`<ds-text as="p" variant="text-body-medium"
        >${args.interactionMode === 'edit'
          ? 'Hover or tab to a pencil to edit · Enter to save · Escape to cancel'
          : 'Click to edit · Enter to save · Escape to cancel · Shift+click/arrows to extend'}</ds-text
      >
      <ds-table
        caption=${args.interactionMode === 'edit'
          ? 'Dispatch · pencil editing'
          : 'Dispatch worksheet'}
        caption-visibility="visible"
        .columns=${args.columns ?? EDIT_COLUMNS}
        .rows=${args.rows}
        .interactionMode=${args.interactionMode}
        .cellRange=${args.cellRange}
        height="var(--dimension-card-height-lg)"
        sticky-header
        @dsCellRangeChange=${(event: CustomEvent<TableCellRange>) =>
          updateArgs({ cellRange: event.detail })}
        @dsCellsChange=${(event: CustomEvent<TableCellsChangeDetail>) => {
          const patches = new Map<string, Record<string, string | number | null>>();
          for (const change of event.detail.changes)
            patches.set(change.rowId, {
              ...patches.get(change.rowId),
              [change.columnId]: change.value,
            });
          updateArgs({
            rows: (args.rows as TableRow[]).map(row =>
              patches.has(row.id)
                ? { ...row, cells: { ...row.cells, ...patches.get(row.id) } }
                : row
            ),
            lastChange: `${event.detail.reason}: ${event.detail.changes.length} cell(s)`,
          });
        }}
      ></ds-table>
      <ds-text as="p" variant="text-body-small" role="status">${args.lastChange}</ds-text>`;
  },
};
export const PencilEditing: Story = {
  ...EditableCells,
  name: '499 · Hover-to-edit cells',
  args: { ...EditableCells.args, interactionMode: 'edit' },
  parameters: description(
    'A normal table with a floating pencil at the top-right of editable cells on hover or keyboard focus. Touch devices keep pencils visible. Click the pencil to edit; Enter saves, Escape cancels, and Tab saves and moves to the next editable cell’s pencil. Row 4 and Record ID stay read-only. There is no worksheet selection or range UI in this mode.'
  ),
};
export const SharedEditors: Story = {
  ...EditableCells,
  name: '499 · Shared controls worksheet',
  args: { ...EditableCells.args, columns: FIELD_COLUMNS, rows: FIELD_ROWS },
  parameters: description(
    'Click a cell to review the shared borderless Input, number stepper, Select, InputDate, InputTime and Textarea. The cell owns the brand focus outline and interaction fill. Select choices commit immediately; other fields commit with Enter or Tab (Ctrl/Command+Enter for multiline). Escape cancels; leaving an unfinished editor cancels. Picker keys stay within their popup. Only the active cell mounts a control. Row 4 and Record ID remain read-only.'
  ),
};
export const SharedPencilEditors: Story = {
  ...SharedEditors,
  name: '499 · Shared controls with pencil',
  args: { ...SharedEditors.args, interactionMode: 'edit' },
};
export const ResponsiveCards: Story = {
  name: '501 · Responsive cards',
  args: { query: '', viewId: '__default__' },
  parameters: {
    layout: 'fullscreen',
    ...description(
      'Below 768px, each record becomes one border-tertiary card with inset field dividers, spaced labels and values, and one row hover/selection surface. Checkbox and actions sit together at the top-right with a short divider. View, Search and Configure share the edge-to-edge top bar; only the scrollable card area has 16px gutters and gaps. The footer spans the bottom edge. Resize the canvas to compare with the desktop table. Search and the Needs review view filter the example records.'
    ),
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const rows = reviewRows
      .filter(
        row =>
          (args.viewId !== 'needs-review' || row.cellPresentation?.event?.highlight) &&
          JSON.stringify(row.cells).toLowerCase().includes(String(args.query).toLowerCase())
      )
      .map(row => ({ ...row, cellPresentation: undefined }));
    return html` <ds-table
      caption="Responsive fleet review"
      caption-visibility="visible"
      .columns=${REVIEW_COLUMNS}
      .rows=${rows}
      .displayedCount=${rows.length}
      .totalCount=${rows.length}
      height="100dvh"
      column-customizer
      responsive-layout="cards"
      selection-mode="multiple"
      @dsSelectionChange=${selection}
      @dsFieldsConfigChange=${fields}
      @dsSortChange=${sort}
    >
      <ds-data-toolbar slot="header" label="Fleet review controls">
        <ds-data-saved-views
          slot="start"
          compact
          .value=${args.viewId}
          .views=${[{ id: 'needs-review', label: 'Needs review' }]}
          @dsViewChange=${(event: CustomEvent<{ viewId: string }>) =>
            updateArgs({ viewId: event.detail.viewId })}
        ></ds-data-saved-views>
        <ds-data-search
          slot="search"
          .value=${args.query}
          aria-label="Search fleet review"
          @dsChange=${(event: CustomEvent<string>) => updateArgs({ query: event.detail })}
          @dsClear=${() => updateArgs({ query: '' })}
        ></ds-data-search>
      </ds-data-toolbar>
    </ds-table>`;
  },
};
export const CombinedPerformance: Story = {
  name: 'Combined · 10,000 rows',
  tags: ['!test'],
  parameters: description(
    'Manual performance fixture: 10,000 mixed three-track rows, grouped column headers, two pins per edge, selection, decorations and responsive cards. Scroll to the end, change selection, hide/reorder columns and resize. The body must retain a bounded recycled row window; this fixture does not fetch or append data.'
  ),
  render: () =>
    html`<ds-table
      caption="10,000-row capabilities review"
      caption-visibility="visible"
      .columns=${REVIEW_COLUMNS}
      .rows=${(stressRows ??= tableReviewRows(10000))}
      data-mode="virtual"
      height="var(--dimension-card-height-lg)"
      sticky-header
      responsive-layout="cards"
      selection-mode="multiple"
      column-customizer
      @dsSelectionChange=${selection}
      @dsFieldsConfigChange=${fields}
      @dsSortChange=${sort}
    ></ds-table>`,
};
