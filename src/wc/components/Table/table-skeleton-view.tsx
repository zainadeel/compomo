import { h } from '@stencil/core';
import { resolveTableCellImageTracks, tableCellImageVariant } from './table-cell-model';
import type { TableRenderModel } from './table-render-model';
import type { TableCellSkeleton, TableColumn } from './table-types';

interface TableSkeletonViewOptions {
  model: TableRenderModel;
  visibleColumns: TableColumn[];
  skeletonRows: number;
  renderStickyEdge: (sticky: TableColumn['sticky']) => unknown;
}

/** Render the loading body from the same cell recipes used by loaded rows. */
export function renderTableSkeletonBody(options: TableSkeletonViewOptions) {
  const { model, visibleColumns, renderStickyEdge } = options;
  const count = Math.min(20, Math.max(1, Math.round(options.skeletonRows) || 1));
  const beforeSpacer =
    model.elasticSpacerIndex == null
      ? visibleColumns
      : visibleColumns.slice(0, model.elasticSpacerIndex);
  const afterSpacer =
    model.elasticSpacerIndex == null ? [] : visibleColumns.slice(model.elasticSpacerIndex);
  return (
    <tbody class="ds-table__body ds-table__skeleton-body">
      {Array.from({ length: count }, (_, index) => (
        <tr class="ds-table__row ds-table__skeleton-row" key={`skeleton-${index}`}>
          {model.selectable && (
            <td
              class="ds-table__cell ds-table__selection-cell ds-table__cell--sticky-start ds-table__skeleton-cell ds-interaction-fill ds-interaction-fill--grouped"
              data-skeleton-kind="checkbox"
            >
              <span class="ds-table__skeleton-checkbox-canvas ds-interaction-fill__content">
                <ds-skeleton
                  class="ds-table__skeleton-checkbox"
                  variant="control"
                  controlSize="xs"
                  width="var(--dimension-iconography-sm)"
                />
              </span>
              {renderStickyEdge('start')}
            </td>
          )}
          {beforeSpacer.map(column => renderSkeletonCell(column, index, renderStickyEdge))}
          {model.elasticSpacerIndex != null && (
            <td
              class="ds-table__cell ds-table__elastic-spacer-cell ds-table__skeleton-cell ds-interaction-fill ds-interaction-fill--grouped"
              aria-hidden="true"
              role="presentation"
              data-elastic-spacer="true"
            />
          )}
          {afterSpacer.map(column => renderSkeletonCell(column, index, renderStickyEdge))}
        </tr>
      ))}
    </tbody>
  );
}

function renderSkeletonCell(
  column: TableColumn,
  rowIndex: number,
  renderStickyEdge: TableSkeletonViewOptions['renderStickyEdge']
) {
  const skeleton =
    column.skeleton ??
    ((column.kind === 'action'
      ? { kind: 'action', variant: 'icon' }
      : { kind: 'text', lines: 1 }) satisfies TableCellSkeleton);
  const align = column.align ?? 'start';
  const text = skeleton.kind === 'text';
  const iconText = skeleton.kind === 'icon-text';
  const scoreText = skeleton.kind === 'score-text';
  const lines = text || iconText || scoreText ? (skeleton.lines ?? 1) : 1;
  const tag = skeleton.kind === 'tag';
  const icon = skeleton.kind === 'icon';
  const image = skeleton.kind === 'image';
  const imageVariant = image
    ? tableCellImageVariant(resolveTableCellImageTracks(skeleton.tracks))
    : undefined;
  const iconTextVariant = iconText
    ? lines === 3
      ? 'triple'
      : lines === 2
        ? 'multi'
        : 'single'
    : undefined;
  const scoreTextVariant = scoreText
    ? lines === 3
      ? 'triple'
      : lines === 2
        ? 'multi'
        : 'single'
    : undefined;
  const action = skeleton.kind === 'action';
  const blank = skeleton.kind === 'blank';

  return (
    <td
      class={{
        'ds-table__cell': true,
        [`ds-table__cell--align-${align}`]: true,
        'ds-table__skeleton-cell': true,
        'ds-table__cell--text-single': text && lines === 1,
        'ds-table__cell--text-multi': text && lines === 2,
        'ds-table__cell--text-triple': text && lines === 3,
        'ds-table__cell--tag': tag,
        'ds-table__cell--tag-tag-only': tag,
        'ds-table__cell--icon': icon,
        'ds-table__cell--icon-text': iconText,
        [`ds-table__cell--icon-text-${iconTextVariant}`]: iconText,
        'ds-table__cell--score-text': scoreText,
        [`ds-table__cell--score-text-${scoreTextVariant}`]: scoreText,
        'ds-table__cell--image': image,
        [`ds-table__cell--image-${imageVariant}`]: image,
        'ds-table__cell--action': action,
        'ds-table__cell--blank': blank,
        'ds-table__cell--sticky-start': column.sticky === 'start',
        'ds-table__cell--sticky-end': column.sticky === 'end',
        'ds-interaction-fill': true,
        'ds-interaction-fill--grouped': true,
      }}
      data-column-id={column.id}
      data-skeleton-kind={skeleton.kind}
      data-cell-variant={imageVariant ?? iconTextVariant ?? scoreTextVariant}
      key={`skeleton-${rowIndex}:${column.id}`}
    >
      <span class="ds-table__cell-content ds-interaction-fill__content">
        {renderSkeletonCellContent(skeleton)}
      </span>
      {renderStickyEdge(column.sticky)}
    </td>
  );
}

function renderSkeletonCellContent(skeleton: TableCellSkeleton) {
  if (skeleton.kind === 'blank') return null;

  if (skeleton.kind === 'image') {
    return (
      <span class="ds-table__cell-image ds-table__skeleton-image">
        <ds-skeleton
          class="ds-table__skeleton-image-shape"
          variant="control"
          controlSize="md"
          width="100%"
        />
      </span>
    );
  }

  if (skeleton.kind === 'icon') {
    return <ds-skeleton variant="icon" iconSize="md" rounded={skeleton.rounded ?? false} />;
  }

  if (skeleton.kind === 'tag') {
    return <ds-skeleton variant="control" controlSize="sm" width={skeleton.width ?? '64%'} />;
  }

  if (skeleton.kind === 'action') {
    const iconOnly = (skeleton.variant ?? 'icon') === 'icon';
    return (
      <ds-skeleton
        variant="control"
        controlSize="sm"
        width={skeleton.width ?? (iconOnly ? '24px' : '72%')}
      />
    );
  }

  const lines = skeleton.lines ?? 1;
  const copy = (
    <span class="ds-table__cell-copy">
      <span class="ds-table__cell-primary ds-table__cell-track ds-table__cell-track--text">
        <ds-skeleton
          variant="text"
          textVariant="text-body-medium"
          width={skeleton.primaryWidth ?? '100%'}
        />
      </span>
      {lines >= 2 && (
        <span class="ds-table__cell-secondary ds-table__cell-track ds-table__cell-track--text">
          <ds-skeleton
            variant="text"
            textVariant="text-body-small"
            width={skeleton.secondaryWidth ?? '72%'}
          />
        </span>
      )}
      {lines === 3 && (
        <span class="ds-table__cell-tertiary ds-table__cell-track ds-table__cell-track--text">
          <ds-skeleton
            variant="text"
            textVariant="text-body-small"
            width={skeleton.tertiaryWidth ?? '56%'}
          />
        </span>
      )}
    </span>
  );
  if (skeleton.kind === 'icon-text') {
    return (
      <span class="ds-table__cell-icon-text">
        <span class="ds-table__cell-icon-text-icon">
          <ds-skeleton variant="icon" iconSize="md" />
        </span>
        {copy}
      </span>
    );
  }
  if (skeleton.kind === 'score-text') {
    return (
      <span class="ds-table__cell-score-text">
        {copy}
        <span class="ds-table__cell-score-text-score">
          <ds-score size="sm" isLoading={true} label="Safety score" />
        </span>
      </span>
    );
  }
  return copy;
}
