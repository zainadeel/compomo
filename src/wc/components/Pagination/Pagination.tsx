import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

function buildRange(start: number, end: number): (number | 'ellipsis')[] {
  const items: (number | 'ellipsis')[] = [];
  for (let i = start; i <= end; i++) items.push(i);
  return items;
}

function buildPages(page: number, totalPages: number, siblings: number): (number | 'ellipsis')[] {
  const totalSlots = siblings * 2 + 5;
  if (totalPages <= totalSlots) return buildRange(1, totalPages);

  const leftSibling = Math.max(page - siblings, 2);
  const rightSibling = Math.min(page + siblings, totalPages - 1);
  const showLeft = leftSibling > 2;
  const showRight = rightSibling < totalPages - 1;

  if (!showLeft && showRight) return [...buildRange(1, siblings * 2 + 3), 'ellipsis', totalPages];
  if (showLeft && !showRight) return [1, 'ellipsis', ...buildRange(totalPages - (siblings * 2 + 2), totalPages)];
  return [1, 'ellipsis', ...buildRange(leftSibling, rightSibling), 'ellipsis', totalPages];
}

@Component({
  tag: 'ds-pagination',
  styleUrl: 'Pagination.css',
  scoped: true,
})
export class Pagination {
  @Prop({ mutable: true }) page: number = 1;
  @Prop() totalPages: number = 1;
  @Prop() siblingCount: number = 1;
  @Prop() inactive: boolean = false;

  @Event() dsPageChange!: EventEmitter<number>;

  private go(p: number) {
    if (this.inactive) return;
    this.page = p;
    this.dsPageChange.emit(p);
  }

  render() {
    if (this.totalPages <= 1) return <Host style={{ display: 'none' }} />;

    const pages = buildPages(this.page, this.totalPages, this.siblingCount);

    return (
      <Host>
        <nav
          class={{ pagination: true, 'pagination--inactive': this.inactive }}
          aria-label="Pagination"
        >
          <button
            type="button"
            class="button button--nav"
            disabled={this.page <= 1 || this.inactive}
            onClick={() => this.go(this.page - 1)}
            aria-label="Previous page"
          >
            &#x2039;
          </button>

          {pages.map((item, i) =>
            item === 'ellipsis' ? (
              <span key={`e${i}`} class="ellipsis">
                <span class="text-body-small" style={{ color: 'var(--color-foreground-tertiary)' }}>…</span>
              </span>
            ) : (
              <button
                key={item}
                type="button"
                class={{ button: true, 'button--active': item === this.page }}
                onClick={() => this.go(item)}
                aria-current={item === this.page ? 'page' : undefined}
                disabled={this.inactive}
              >
                <span class={item === this.page ? 'text-body-small-emphasis' : 'text-body-small'}>
                  {item}
                </span>
              </button>
            )
          )}

          <button
            type="button"
            class="button button--nav"
            disabled={this.page >= this.totalPages || this.inactive}
            onClick={() => this.go(this.page + 1)}
            aria-label="Next page"
          >
            &#x203A;
          </button>
        </nav>
      </Host>
    );
  }
}
