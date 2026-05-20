import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

@Component({
  tag: 'ds-breadcrumb',
  styleUrl: 'Breadcrumb.css',
  scoped: true,
})
export class Breadcrumb {
  @Prop() items: BreadcrumbItem[] = [];
  @Prop() separator: string = '/';

  @Event() dsNavigate!: EventEmitter<{ item: BreadcrumbItem; index: number }>;

  private handleClick(item: BreadcrumbItem, index: number, e: MouseEvent) {
    if (!item.href) {
      e.preventDefault();
    }
    this.dsNavigate.emit({ item, index });
  }

  render() {
    return (
      <Host>
        <nav aria-label="Breadcrumb" class="breadcrumb">
          <ol class="list">
            {this.items.map((item, i) => {
              const isLast = i === this.items.length - 1;
              return (
                <li class="item" key={i}>
                  {isLast ? (
                    <span class="text-body-medium-emphasis current" aria-current="page">
                      {item.label}
                    </span>
                  ) : (
                    <span class="item-inner">
                      <a
                        href={item.href ?? '#'}
                        class="link text-body-medium"
                        onClick={e => this.handleClick(item, i, e)}
                      >
                        {item.label}
                      </a>
                      <span class="separator text-body-small" aria-hidden="true">
                        {this.separator}
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </Host>
    );
  }
}
