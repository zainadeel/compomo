import { h } from '@stencil/core';
import {
  resolveTableCellPresentation,
  tableCellTextOverflowProps,
  type TableCellPresentation,
} from './table-cell-model';
import {
  isRenderableTableActionMenu,
  isTableCellActionMenu,
  tableActionTriggerId,
} from './table-action-menu';
import { tableRowSelectionLabel } from './table-model';
import type { TableRenderModel } from './table-render-model';
import type { TableHighlightMatcher } from './table-highlight';
import type { TableCellActionDetail, TableCellTextRun, TableColumn, TableRow } from './table-types';
import { resolveSafeUrl } from '../../utils/safe-url';

export interface TableRowViewOptions {
  row: TableRow;
  model: TableRenderModel;
  visibleColumns: TableColumn[];
  emptyCellLabel: string;
  actionMenuElementId: string;
  actionMenu: { rowId: string; columnId: string } | null;
  highlightMatcher: TableHighlightMatcher;
  ariaRowIndex?: number;
  variableVirtualSize?: boolean;
  rowKey?: string;
  renderSelectionControl: (
    label: string,
    checked: boolean,
    indeterminate: boolean,
    disabled: boolean,
    onActivate: () => void
  ) => unknown;
  renderStickyEdge: (sticky: TableColumn['sticky']) => unknown;
  onRowActivate: (row: TableRow, event: Event) => void;
  onRowKeyDown: (row: TableRow, event: KeyboardEvent) => void;
  onRowSelection: (row: TableRow) => void;
  onCellAction: (detail: TableCellActionDetail) => void;
  onActionMenuToggle: (row: TableRow, column: TableColumn, event: MouseEvent) => void;
}

/** Render one semantic body row and the complete declarative table-cell vocabulary. */
export function renderTableRow({
  row,
  model,
  visibleColumns,
  emptyCellLabel,
  actionMenuElementId,
  actionMenu,
  highlightMatcher,
  ariaRowIndex,
  variableVirtualSize = false,
  rowKey = row.id,
  renderSelectionControl,
  renderStickyEdge,
  onRowActivate,
  onRowKeyDown,
  onRowSelection,
  onCellAction,
  onActionMenuToggle,
}: TableRowViewOptions) {
  const selected = model.selectedRowIds.has(row.id);
  const rowSelectable = row.selectable !== false && !row.disabled;
  const beforeSpacer =
    model.elasticSpacerIndex == null
      ? visibleColumns
      : visibleColumns.slice(0, model.elasticSpacerIndex);
  const afterSpacer =
    model.elasticSpacerIndex == null ? [] : visibleColumns.slice(model.elasticSpacerIndex);
  const renderColumn = (column: TableColumn) =>
    renderTableCell({
      row,
      column,
      selected,
      emptyCellLabel,
      actionMenuElementId,
      actionMenu,
      highlightMatcher,
      renderStickyEdge,
      onCellAction,
      onActionMenuToggle,
    });

  return (
    <tr
      key={rowKey}
      class={{
        'ds-table__row': true,
        'ds-table__row--selected': selected,
        'ds-table__row--disabled': !!row.disabled,
        'ds-table__row--interactive': !!row.interactive && !row.disabled,
        'ds-focus-ring': !!row.interactive && !row.disabled,
      }}
      data-row-id={row.id}
      data-virtual-id={ariaRowIndex != null ? `row:${row.id}` : undefined}
      data-virtual-pool-key={ariaRowIndex != null ? rowKey : undefined}
      data-virtual-measure={ariaRowIndex != null && variableVirtualSize ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      aria-rowindex={ariaRowIndex}
      aria-disabled={row.disabled ? 'true' : undefined}
      tabIndex={row.interactive && !row.disabled ? 0 : undefined}
      onClick={event => onRowActivate(row, event)}
      onKeyDown={event => onRowKeyDown(row, event)}
    >
      {model.selectable && (
        <td
          class={{
            'ds-table__cell': true,
            'ds-table__selection-cell': true,
            'ds-table__cell--sticky-start': true,
            'ds-interaction-fill': true,
            'ds-interaction-fill--grouped': true,
            'ds-interaction-fill--selected': selected,
          }}
        >
          {renderSelectionControl(
            `${selected ? 'Deselect' : 'Select'} ${tableRowSelectionLabel(row, visibleColumns)}`,
            selected,
            false,
            !rowSelectable,
            () => onRowSelection(row)
          )}
          {renderStickyEdge('start')}
        </td>
      )}
      {beforeSpacer.map(renderColumn)}
      {model.elasticSpacerIndex != null && (
        <td
          class={{
            'ds-table__cell': true,
            'ds-table__elastic-spacer-cell': true,
            'ds-interaction-fill': true,
            'ds-interaction-fill--grouped': true,
            'ds-interaction-fill--selected': selected,
          }}
          aria-hidden="true"
          role="presentation"
          data-elastic-spacer="true"
        />
      )}
      {afterSpacer.map(renderColumn)}
    </tr>
  );
}

interface TableCellViewOptions {
  row: TableRow;
  column: TableColumn;
  selected: boolean;
  emptyCellLabel: string;
  actionMenuElementId: string;
  actionMenu: { rowId: string; columnId: string } | null;
  highlightMatcher: TableHighlightMatcher;
  renderStickyEdge: (sticky: TableColumn['sticky']) => unknown;
  onCellAction: (detail: TableCellActionDetail) => void;
  onActionMenuToggle: (row: TableRow, column: TableColumn, event: MouseEvent) => void;
}

function renderTableCell(options: TableCellViewOptions) {
  const { row, column, selected, renderStickyEdge } = options;
  const align = column.align ?? 'start';
  const cell = resolveTableCellPresentation(row.cells[column.id], column);
  const tagCell = cell.kind === 'tag';
  const iconCell = cell.kind === 'icon';
  const iconTextCell = cell.kind === 'icon-text';
  const imageCell = cell.kind === 'image';
  const actionCell = cell.kind === 'action';
  const actionMenuCell = actionCell && isRenderableTableActionMenu(cell.value);
  const textCell = cell.kind === 'text';
  const primaryTextCell = textCell && cell.primaryText;
  const singleTextCell = textCell && cell.singleLine;
  const emptyCell = cell.kind === 'empty';
  const blankCell = cell.kind === 'blank';
  const tagVariant = tagCell ? cell.variant : undefined;
  const textVariant = textCell ? cell.variant : undefined;
  const imageVariant = imageCell ? cell.variant : undefined;
  const iconTextVariant = iconTextCell ? cell.variant : undefined;
  const wraps = (textCell || iconTextCell) && cell.wraps;

  return (
    <td
      key={`${row.id}:${column.id}`}
      class={{
        'ds-table__cell': true,
        [`ds-table__cell--align-${align}`]: true,
        'ds-table__cell--tag': tagCell,
        [`ds-table__cell--tag-${tagVariant}`]: tagCell,
        'ds-table__cell--icon': iconCell,
        'ds-table__cell--icon-text': iconTextCell,
        [`ds-table__cell--icon-text-${iconTextVariant}`]: iconTextCell,
        'ds-table__cell--icon-text-wrap': iconTextCell && wraps,
        'ds-table__cell--image': imageCell,
        [`ds-table__cell--image-${imageVariant}`]: imageCell,
        'ds-table__cell--action': actionCell,
        'ds-table__cell--action-menu': actionMenuCell,
        'ds-table__cell--primary-text': primaryTextCell,
        'ds-table__cell--text-single': singleTextCell,
        'ds-table__cell--text-multi': textCell && !singleTextCell && textVariant !== 'triple',
        'ds-table__cell--text-triple': textVariant === 'triple',
        'ds-table__cell--text-wrap': textCell && wraps,
        'ds-table__cell--empty': emptyCell,
        'ds-table__cell--blank': blankCell,
        'ds-table__cell--sticky-start': column.sticky === 'start',
        'ds-table__cell--sticky-end': column.sticky === 'end',
        'ds-interaction-fill': true,
        'ds-interaction-fill--grouped': true,
        'ds-interaction-fill--selected': selected,
      }}
      data-column-id={column.id}
      data-cell-type={cell.cellType}
      data-cell-variant={tagVariant ?? textVariant ?? imageVariant ?? iconTextVariant}
    >
      <span class="ds-table__cell-content ds-interaction-fill__content">
        {renderTableCellValue(cell, options)}
      </span>
      {renderStickyEdge(column.sticky)}
    </td>
  );
}

function renderTableCellValue(cell: TableCellPresentation, options: TableCellViewOptions) {
  const {
    row,
    column,
    emptyCellLabel,
    actionMenuElementId,
    actionMenu,
    onCellAction,
    onActionMenuToggle,
  } = options;
  if (cell.kind === 'blank') return null;

  if (cell.kind === 'empty') {
    return (
      <ds-text
        class="ds-table__cell-track ds-table__cell-track--text"
        as="span"
        variant="text-body-medium"
        color="tertiary"
      >
        <span aria-hidden="true">—</span>
        <span class="ds-visually-hidden">{emptyCellLabel}</span>
      </ds-text>
    );
  }

  if (cell.kind === 'icon') {
    const value = cell.value;
    return (
      <ds-icon name={value.icon} size="md" color={value.color ?? 'secondary'} label={value.label} />
    );
  }

  if (cell.kind === 'icon-text') {
    return (
      <span class="ds-table__cell-icon-text">
        <span class="ds-table__cell-icon-text-icon">
          <ds-icon
            name={cell.icon}
            size="md"
            color={cell.iconColor ?? 'secondary'}
            label={cell.iconLabel}
          />
        </span>
        {renderTextCopy(cell, options.highlightMatcher)}
      </span>
    );
  }

  if (cell.kind === 'image') {
    const value = cell.value;
    return (
      <span class="ds-table__cell-image">
        {value.src ? (
          <img
            class="ds-table__cell-image-content"
            src={value.src}
            alt={value.alt}
            loading="lazy"
          />
        ) : (
          <span class="ds-table__cell-image-placeholder" role="img" aria-label={value.alt} />
        )}
      </span>
    );
  }

  if (cell.kind === 'action') {
    const value = cell.value;
    const menu = isRenderableTableActionMenu(value);
    const triggerId = tableActionTriggerId(actionMenuElementId, row.id, column.id);
    const expanded = menu && actionMenu?.rowId === row.id && actionMenu?.columnId === column.id;
    return (
      <ds-button-unfilled
        id={menu ? triggerId : undefined}
        variant={menu ? 'icon' : (value.variant ?? 'label')}
        size="md"
        isInset={true}
        insetDepth="double"
        label={value.label ?? ''}
        icon={value.icon ?? (menu ? 'Ellipses' : '')}
        aria-label={value.ariaLabel ?? null}
        hasBorder={value.hasBorder ?? false}
        isInactive={value.isInactive ?? false}
        isLoading={value.isLoading ?? false}
        hasMenu={menu}
        expanded={menu ? expanded : undefined}
        controls={menu ? actionMenuElementId : undefined}
        onDsClick={event => {
          event.stopPropagation();
          if (menu) {
            onActionMenuToggle(row, column, event.detail);
            return;
          }
          if (isTableCellActionMenu(value)) return;
          onCellAction({ actionId: value.actionId, rowId: row.id, columnId: column.id });
        }}
      />
    );
  }

  if (cell.kind === 'tag') {
    const value = cell.value;
    const variant = cell.variant;
    const tag = (
      <ds-tag
        label={value.label}
        intent={value.intent ?? 'neutral'}
        contrast={value.contrast ?? 'faint'}
        size={variant === 'text-with-tag' ? 'sm' : 'md'}
        icon={value.icon ?? ''}
        rounded={value.rounded ?? false}
        isInset
        insetDepth={variant === 'text-with-tag' ? 'single' : 'double'}
      />
    );
    if (variant === 'tag-only') return tag;
    return (
      <span class={`ds-table__cell-tag-stack ds-table__cell-tag-stack--${variant}`}>
        {variant === 'tag-with-text' && tag}
        <ds-text
          class="ds-table__cell-tag-text ds-table__cell-track"
          as="span"
          variant={variant === 'tag-with-text' ? 'text-body-small' : 'text-body-medium'}
          color="secondary"
          lineTruncation={1}
          data-table-truncate=""
        >
          {renderHighlightedText(value.text, options.highlightMatcher)}
        </ds-text>
        {variant === 'text-with-tag' && <span class="ds-table__cell-tag-control-track">{tag}</span>}
      </span>
    );
  }

  if (cell.kind !== 'text') return null;
  return renderTextCopy(cell, options.highlightMatcher);
}

function renderTextCopy(
  cell: Extract<TableCellPresentation, { kind: 'text' | 'icon-text' }>,
  highlightMatcher: TableHighlightMatcher
) {
  const text = cell.value;
  const overflow = tableCellTextOverflowProps(cell.lineClamp);
  const primaryText = cell.kind === 'text' && cell.primaryText;
  const href = resolveSafeUrl(text.href);
  const primary = (
    <ds-text
      class="ds-table__cell-primary ds-table__cell-track ds-table__cell-track--text"
      as="span"
      variant="text-body-medium"
      color={href ? 'inherit' : 'primary'}
      lineTruncation={overflow.lineTruncation}
      wrap={overflow.wrap}
      fontFeature={text.fontFeature ?? 'normal'}
      data-table-truncate={truncateAttr(cell.lineClamp)}
    >
      {renderHighlightedText(text.primary, highlightMatcher)}
    </ds-text>
  );

  return (
    <span class={{ 'ds-table__cell-copy': true, 'ds-table__cell-copy--wrap': cell.wraps }}>
      {href ? (
        <a
          class="ds-table__cell-link ds-text-action ds-focus-ring"
          href={href}
          target={text.target === '_blank' ? '_blank' : undefined}
          rel={text.target === '_blank' ? 'noopener noreferrer' : undefined}
        >
          {primary}
        </a>
      ) : (
        primary
      )}
      {renderTextTrack(text.secondary, {
        track: 'secondary',
        variant: primaryText ? 'text-body-medium' : 'text-body-small',
        defaultColor: primaryText ? 'primary' : 'secondary',
        wholeColor: text.secondaryColor,
        lineClamp: cell.lineClamp,
        highlightMatcher,
      })}
      {renderTextTrack(text.tertiary, {
        track: 'tertiary',
        variant: 'text-body-small',
        defaultColor: 'secondary',
        wholeColor: text.tertiaryColor,
        lineClamp: cell.lineClamp,
        highlightMatcher,
      })}
    </span>
  );
}

function renderTextTrack(
  runs: TableCellTextRun[] | undefined,
  options: {
    track: 'secondary' | 'tertiary';
    variant: 'text-body-medium' | 'text-body-small';
    defaultColor: 'primary' | 'secondary';
    wholeColor?: TableCellTextRun['color'];
    lineClamp: Extract<TableCellPresentation, { kind: 'text' | 'icon-text' }>['lineClamp'];
    highlightMatcher: TableHighlightMatcher;
  }
) {
  if (!runs?.length) return null;
  const trackClass = `ds-table__cell-${options.track} ds-table__cell-track ds-table__cell-track--text`;
  const overflow = tableCellTextOverflowProps(options.lineClamp);
  const colorFor = (run: TableCellTextRun) =>
    run.color ?? options.wholeColor ?? options.defaultColor;
  if (runs.length === 1) {
    return (
      <ds-text
        class={trackClass}
        as="span"
        variant={options.variant}
        color={colorFor(runs[0])}
        lineTruncation={overflow.lineTruncation}
        wrap={overflow.wrap}
        data-table-truncate={truncateAttr(options.lineClamp)}
      >
        {renderHighlightedText(runs[0].text, options.highlightMatcher)}
      </ds-text>
    );
  }

  return (
    <span class={`${trackClass} ds-table__cell-track--runs`}>
      {runs.map((run, index) => [
        index > 0 && (
          <ds-text
            key={`${options.track}-sep-${index}`}
            class="ds-table__cell-run-separator"
            as="span"
            variant={options.variant}
            color="secondary"
            aria-hidden="true"
          >
            ·
          </ds-text>
        ),
        <ds-text
          key={`${options.track}-run-${index}`}
          class="ds-table__cell-run"
          as="span"
          variant={options.variant}
          color={colorFor(run)}
          lineTruncation={overflow.lineTruncation}
          wrap={overflow.wrap}
          data-table-truncate={truncateAttr(options.lineClamp)}
        >
          {renderHighlightedText(run.text, options.highlightMatcher)}
        </ds-text>,
      ])}
    </span>
  );
}

function renderHighlightedText(value: string | number | undefined, matcher: TableHighlightMatcher) {
  if (value === undefined) return null;
  return matcher(value).map((segment, index) =>
    segment.match ? (
      <mark class="ds-table__match" key={`match-${index}`}>
        {segment.text}
      </mark>
    ) : (
      segment.text
    )
  );
}

function truncateAttr(
  lineClamp: Extract<TableCellPresentation, { kind: 'text' | 'icon-text' }>['lineClamp']
) {
  return lineClamp === 'none' ? undefined : '';
}
