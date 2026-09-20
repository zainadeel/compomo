import '/dist/components/ds-table.js';
import {
  REVIEW_COLUMNS,
  tableReviewRows,
  EDIT_COLUMNS,
  EDIT_ROWS,
  FIELD_COLUMNS,
  FIELD_ROWS,
  MERGE_COLUMNS,
  MERGE_ROWS,
} from '../../../src/wc/components/Table/table-review-fixtures.ts';
await customElements.whenDefined('ds-table');
const table = document.getElementById('review');
const mode = new URL(location.href).searchParams.get('mode');
table.columns = mode === 'edit' ? EDIT_COLUMNS : mode === 'merge' ? MERGE_COLUMNS : REVIEW_COLUMNS;
table.rows = mode === 'edit' ? EDIT_ROWS : mode === 'merge' ? MERGE_ROWS : tableReviewRows(10000);
if (mode === 'fields') {
  table.columns = FIELD_COLUMNS;
  table.rows = FIELD_ROWS;
  table.interactionMode = 'grid';
} else if (mode === 'edit') table.interactionMode = 'grid';
else if (mode === 'merge') {
  table.cellSpans = [
    { rowIds: ['west-am', 'west-pm'], columnIds: ['fleet'] },
    { rowIds: ['west-am'], columnIds: ['monday', 'tuesday'] },
    { rowIds: ['east'], columnIds: ['monday', 'tuesday', 'wednesday'] },
  ];
} else {
  table.dataMode = 'virtual';
  table.responsiveLayout = 'cards';
}
table.changes = [];
table.addEventListener('dsSelectionChange', event => {
  table.selectedRowIds = event.detail.selectedRowIds;
});
table.addEventListener('dsCellRangeChange', event => {
  table.cellRange = event.detail;
});
table.addEventListener('dsFieldsConfigChange', event => {
  Object.assign(table, event.detail);
});
table.addEventListener('dsCellsChange', event => {
  table.changes.push(event.detail);
  table.rows = table.rows.map(row => {
    const changes = event.detail.changes.filter(change => change.rowId === row.id);
    return changes.length
      ? {
          ...row,
          cells: {
            ...row.cells,
            ...Object.fromEntries(changes.map(change => [change.columnId, change.value])),
          },
        }
      : row;
  });
});
document.documentElement.dataset.ready = 'true';
