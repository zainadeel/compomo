import { h } from '@stencil/core';
import { ConnectionTasks } from '../../utils/connection-tasks';
import {
  tableGridModel,
  tableRangeBounds,
  tableEditable,
  tableEditValue,
  tablePasteChanges,
  tableNextEditable,
} from './table-grid-model';
import { renderTableCellEditor } from './table-cell-editor';
import type {
  TableCellAddress,
  TableCellRange,
  TableCellsChangeDetail,
  TableColumn,
  TableRow,
} from './table-types';

export interface TableEditingState {
  activeCell: TableCellAddress | null;
  editingCell: TableCellAddress | null;
}

interface TableEditingContext {
  rows: TableRow[];
  columns: TableColumn[];
  mode: 'table' | 'edit' | 'grid';
  loading: boolean;
  cellRange: TableCellRange | null;
}

interface TableEditingControllerOptions {
  host: () => HTMLElement;
  state: () => TableEditingContext;
  interaction: () => TableEditingState;
  change: (patch: Partial<TableEditingState>) => void;
  rangeChange: (range: TableCellRange) => void;
  cellsChange: (detail: TableCellsChangeDetail) => void;
  announce: (message: string) => void;
  focusRow: (rowId: string) => void;
  revealRow: (rowId: string) => Promise<boolean>;
  findRow: (rowId: string) => HTMLElement | null;
}

/** Owns cell drafts, grid interaction and deferred focus; controlled data stays with Table. */
// Keep JSX in functions so Stencil includes these component dependencies in its metadata.
export function createTableEditingController(options: TableEditingControllerOptions) {
  const tasks = new ConnectionTasks(() => options.host().isConnected);
  let editDraft = '';
  let gridModelCache: ReturnType<typeof tableGridModel> | undefined;

  function state() {
    return options.state();
  }

  function interaction() {
    return options.interaction();
  }

  function disconnect(): void {
    tasks.cancel();
    editDraft = '';
    options.change({ editingCell: null });
  }

  function gridEnabled(): boolean {
    return state().mode === 'grid';
  }
  function enabled(): boolean {
    return state().mode !== 'table';
  }
  function gridModel() {
    const { rows, columns } = state();
    if (!gridModelCache || gridModelCache.rows !== rows || gridModelCache.columns !== columns) {
      gridModelCache = tableGridModel(rows, columns);
    }
    return gridModelCache;
  }
  function gridAddress(event: Event): TableCellAddress | null {
    if (
      !gridEnabled() ||
      !(event.target instanceof HTMLElement) ||
      !event.target.matches('td[role="gridcell"][data-cell-editable="true"]')
    )
      return null;
    const rowId = event.target.closest<HTMLElement>('[data-row-id]')?.dataset.rowId;
    const columnId = event.target.dataset.columnId;
    return rowId && columnId ? { rowId, columnId } : null;
  }
  function selectCell(address: TableCellAddress, extend = false): void {
    if (!isEditableAddress(address)) return;
    options.change({ activeCell: address });
    options.rangeChange({
      anchor: extend ? (state().cellRange?.anchor ?? address) : address,
      focus: address,
    });
  }
  async function focusCell(address: TableCellAddress): Promise<void> {
    if (!isEditableAddress(address)) return;
    options.change({ activeCell: address });
    options.focusRow(address.rowId);
    const focusAfterReveal = tasks.guard(() => {
      tasks.frame(() => {
        if (
          interaction().activeCell !== address ||
          interaction().editingCell ||
          !isEditableAddress(address)
        )
          return;
        const cell = options
          .findRow(address.rowId)
          ?.querySelector<HTMLElement>(`[data-column-id="${CSS.escape(address.columnId)}"]`);
        if (gridEnabled()) cell?.focus();
        else
          void cell
            ?.querySelector<HTMLDsButtonUnfilledElement>(
              '.ds-table__edit-trigger ds-button-unfilled'
            )
            ?.setFocus();
      });
    });
    await options.revealRow(address.rowId);
    focusAfterReveal();
  }
  function isEditableAddress(address: TableCellAddress): boolean {
    const model = gridModel();
    const row = model.rows[model.rowIndices.get(address.rowId) ?? -1];
    const column = model.columns[model.columnIndices.get(address.columnId) ?? -1];
    return enabled() && !state().loading && !!row && !!column && tableEditable(row, column);
  }
  function beginCellEdit(address: TableCellAddress, initial?: string): void {
    const model = gridModel();
    const row = model.rows[model.rowIndices.get(address.rowId) ?? -1];
    const column = model.columns[model.columnIndices.get(address.columnId) ?? -1];
    if (!enabled() || state().loading || !row || !column || !tableEditable(row, column)) return;
    editDraft = initial ?? String(row.cells[column.id] ?? '');
    options.change({ activeCell: address, editingCell: address });
    options.focusRow(address.rowId);
    tasks.frame(async () => {
      const control = options
        .host()
        .querySelector<HTMLDsInputElement>('.ds-table__cell-editor > *');
      const focus = tasks.guard(() => {
        if (interaction().editingCell !== address || !control?.isConnected) return;
        void control.setFocus().then(
          tasks.guard(() => {
            if (interaction().editingCell !== address || !control.isConnected) return;
            const input = control.querySelector<HTMLInputElement | HTMLTextAreaElement>(
              'input,textarea'
            );
            if (initial == null && input?.type !== 'number') input?.select();
          })
        );
      });
      await control?.componentOnReady?.();
      focus();
    });
  }
  function handleKeyDown(event: KeyboardEvent): void {
    const address = gridAddress(event);
    if (!address || event.altKey || event.metaKey || event.ctrlKey || event.isComposing) return;
    if (event.key === 'Enter' || event.key === 'F2' || event.key.length === 1) {
      event.preventDefault();
      beginCellEdit(address, event.key.length === 1 ? event.key : undefined);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key))
      return;
    event.preventDefault();
    const next = tableNextEditable(gridModel(), address, event.key);
    if (!next) return;
    selectCell(next, event.shiftKey);
    void focusCell(next);
  }
  function handleClipboard(event: ClipboardEvent): void {
    const address = gridAddress(event);
    if (!address || !event.clipboardData) return;
    if (event.type === 'paste') {
      event.preventDefault();
      if (state().loading) return;
      const changes = tablePasteChanges(
        gridModel(),
        address,
        event.clipboardData.getData('text/plain')
      );
      if (!changes) {
        options.announce(
          'Paste rejected. Use a rectangular set of valid values in editable cells.'
        );
        return;
      }
      options.cellsChange({ changes, reason: 'paste' });
      options.announce(`${changes.length} cell changes proposed.`);
    } else {
      const model = gridModel();
      const bounds = tableRangeBounds(
        model,
        state().cellRange ?? { anchor: address, focus: address }
      );
      if (
        !bounds ||
        (bounds.lastRow - bounds.firstRow + 1) * (bounds.lastColumn - bounds.firstColumn + 1) >
          10000
      )
        return;
      const text = model.rows
        .slice(bounds.firstRow, bounds.lastRow + 1)
        .map(row =>
          model.columns
            .slice(bounds.firstColumn, bounds.lastColumn + 1)
            .map(column => {
              if (!tableEditable(row, column)) return '';
              const value = row.cells[column.id];
              return typeof value === 'object' ? '' : String(value ?? '').replace(/[\t\r\n]/g, ' ');
            })
            .join('\t')
        )
        .join('\n');
      event.preventDefault();
      event.clipboardData.setData('text/plain', text);
    }
  }
  function renderEditor(row: TableRow, column: TableColumn) {
    const { editingCell } = interaction();
    if (
      editingCell?.rowId !== row.id ||
      editingCell.columnId !== column.id ||
      !tableEditable(row, column) ||
      state().loading
    )
      return null;
    const address = editingCell;
    const editor = column.editor!;
    const cell = options
      .findRow(row.id)
      ?.querySelector<HTMLElement>(`[data-column-id="${CSS.escape(column.id)}"]`);
    const commit = (text: string, next = address) => {
      if (interaction().editingCell !== address || !isEditableAddress(address)) return false;
      const value = tableEditValue(text, column);
      if (value === undefined) {
        options.announce(`Enter a valid value for ${column.label}.`);
        return false;
      }
      options.change({ editingCell: null });
      options.cellsChange({ changes: [{ ...address, value }], reason: 'edit' });
      void focusCell(next);
      return true;
    };
    return (
      <div
        class="ds-table__cell-editor"
        key={`${row.id}:${column.id}`}
        onClick={event => event.stopPropagation()}
        onFocusout={event => {
          const wrapper = event.currentTarget as HTMLElement;
          tasks.frame(() => {
            const root = wrapper.getRootNode() as Document | ShadowRoot;
            if (interaction().editingCell === address && !wrapper.contains(root.activeElement))
              options.change({ editingCell: null });
          });
        }}
        onKeyDown={event => {
          event.stopPropagation();
          if (event.isComposing || event.defaultPrevented) return;
          const wrapper = event.currentTarget as HTMLElement;
          if (event.key === 'Escape') {
            event.preventDefault();
            options.change({ editingCell: null });
            void focusCell(address);
            return;
          }
          if (event.key !== 'Enter' && event.key !== 'Tab') return;
          // Picker keyboard interactions belong to the picker, including its internal Tab stops.
          if ((event.target as HTMLElement).closest('[popover]')) return;
          if (
            event.key === 'Enter' &&
            editor.type === 'textarea' &&
            !event.ctrlKey &&
            !event.metaKey
          )
            return;
          event.preventDefault();
          const input =
            editor.type === 'select'
              ? null
              : wrapper.querySelector<HTMLInputElement | HTMLTextAreaElement>('input,textarea');
          // Unconstrained numeric columns retain decimal support; explicit steps use the
          // shared control's native step validity as well as the paste validator.
          if (
            input &&
            !input.checkValidity() &&
            !(editor.type === 'number' && editor.step == null && input.validity.stepMismatch)
          ) {
            input.reportValidity();
            return;
          }
          const next =
            event.key === 'Tab'
              ? (tableNextEditable(gridModel(), address, 'Tab', event.shiftKey) ?? address)
              : address;
          commit(input?.value ?? editDraft, next);
        }}
      >
        {renderTableCellEditor(
          editor,
          editDraft,
          `Edit ${column.label} for ${row.selectionLabel ?? row.id}`,
          cell ?? undefined,
          value => {
            editDraft = value;
            // A single-select choice is a complete edit; let its selection handler finish first.
            if (editor.type === 'select') tasks.microtask(() => commit(value));
          }
        )}
      </div>
    );
  }

  function renderEditTrigger(row: TableRow, column: TableColumn) {
    const { mode, loading } = state();
    const { editingCell } = interaction();
    if (
      mode !== 'edit' ||
      !tableEditable(row, column) ||
      loading ||
      (editingCell?.rowId === row.id && editingCell.columnId === column.id)
    )
      return null;
    return (
      <span class="ds-table__edit-trigger">
        <ds-button-unfilled
          variant="icon"
          icon="Pencil"
          size="sm"
          aria-label={`Edit ${column.label} for ${row.selectionLabel ?? row.id}`}
          pressScale={false}
          onDsClick={event => {
            event.stopPropagation();
            beginCellEdit({ rowId: row.id, columnId: column.id });
          }}
        />
      </span>
    );
  }

  function cellAttributes(row: TableRow, column: TableColumn): Record<string, unknown> {
    const { mode, loading, cellRange } = state();
    const { activeCell, editingCell } = interaction();
    const model = gridModel();
    const bounds = tableRangeBounds(model, cellRange);
    const ri = model.rowIndices.get(row.id)!,
      ci = model.columnIndices.get(column.id)!;
    const editable = tableEditable(row, column) && !loading;
    const editing = editable && editingCell?.rowId === row.id && editingCell.columnId === column.id;
    const active = activeCell && isEditableAddress(activeCell) ? activeCell : model.firstEditable;
    if (mode !== 'grid')
      return {
        'data-cell-editable': String(editable),
        'data-cell-editing': String(editing),
        'aria-disabled': editable ? undefined : 'true',
      };
    return {
      role: 'gridcell',
      tabIndex: editable
        ? active?.rowId === row.id && active.columnId === column.id
          ? 0
          : -1
        : undefined,
      'data-cell-editable': String(editable),
      'data-cell-editing': String(editing),
      'aria-readonly': String(!editable),
      'aria-disabled': editable ? undefined : 'true',
      'aria-selected': String(
        editable &&
          !!bounds &&
          ri >= bounds.firstRow &&
          ri <= bounds.lastRow &&
          ci >= bounds.firstColumn &&
          ci <= bounds.lastColumn
      ),
      onClick: (event: MouseEvent) => {
        if (
          event.target !== event.currentTarget &&
          (event.target as HTMLElement).closest(
            'button,a,input,textarea,ds-button-unfilled,.ds-table__cell-editor'
          )
        )
          return;
        event.stopPropagation();
        if (!editable) return;
        selectCell({ rowId: row.id, columnId: column.id }, event.shiftKey);
        (event.currentTarget as HTMLElement).focus();
        if (!event.shiftKey) beginCellEdit({ rowId: row.id, columnId: column.id });
      },
    };
  }
  return {
    get gridEnabled() {
      return gridEnabled();
    },
    get enabled() {
      return enabled();
    },
    disconnect,
    handleKeyDown,
    handleClipboard,
    renderEditor,
    renderEditTrigger,
    cellAttributes,
  };
}
