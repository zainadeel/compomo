import { h } from '@stencil/core';

interface TableLoadContentOptions {
  error?: string;
  loading: boolean;
  hasMore: boolean;
  manualFallback: boolean;
  retryLabel: string;
  loadingLabel: string;
  loadMoreLabel: string;
  loadMoreAriaLabel?: string;
  endOfResultsLabel?: string;
  onRetry: () => void;
  onLoadMore: () => void;
}

/** Shared visible state machine for top-level and per-group incremental loading bands. */
export function renderTableLoadContent(options: TableLoadContentOptions) {
  if (options.error) {
    return (
      <span class="ds-table__load-content ds-table__load-content--error">
        <span class="ds-table__load-copy">
          <ds-icon name="ErrorTriangle" size="md" color="secondary" aria-hidden="true" />
          <ds-text as="span" variant="text-body-medium" color="secondary">
            {options.error}
          </ds-text>
        </span>
        <ds-button-unfilled label={options.retryLabel} size="md" onDsClick={options.onRetry} />
      </span>
    );
  }

  if (options.loading) {
    return (
      <span class="ds-table__load-content">
        <ds-loader size="md" color="secondary" />
        <ds-text as="span" variant="text-body-medium" color="secondary">
          {options.loadingLabel}
        </ds-text>
      </span>
    );
  }

  if (options.hasMore && options.manualFallback) {
    return (
      <span class="ds-table__load-content">
        <ds-button-unfilled
          label={options.loadMoreLabel}
          aria-label={options.loadMoreAriaLabel}
          size="md"
          onDsClick={options.onLoadMore}
        />
      </span>
    );
  }

  if (options.hasMore) return <span class="ds-table__auto-sentinel" aria-hidden="true" />;
  if (!options.endOfResultsLabel) return null;
  return (
    <ds-text
      class="ds-table__load-content"
      as="span"
      variant="text-body-medium"
      color="secondary"
    >
      {options.endOfResultsLabel}
    </ds-text>
  );
}
