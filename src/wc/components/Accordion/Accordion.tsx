import { Component, Prop, State, Event, EventEmitter, Element, Watch, h, Host } from '@stencil/core';

export interface AccordionItemData {
  id: string;
  label: string;
  content?: string;
  inactive?: boolean;
}

let idCounter = 0;

@Component({
  tag: 'ds-accordion',
  styleUrl: 'Accordion.css',
  scoped: true,
})
export class Accordion {
  @Element() el!: HTMLElement;

  @Prop() items: AccordionItemData[] = [];
  @Prop() multiple: boolean = false;
  /** Comma-separated list of expanded item IDs for controlled mode. */
  @Prop({ mutable: true }) expandedIds: string = '';

  @State() private internalIds: string[] = [];
  @State() private heights: Record<string, number> = {};

  @Event() dsExpandedChange!: EventEmitter<string[]>;

  private instanceId = ++idCounter;
  private resizeObservers: Map<string, ResizeObserver> = new Map();

  private get activeIds(): string[] {
    if (this.expandedIds) return this.expandedIds.split(',').map(s => s.trim()).filter(Boolean);
    return this.internalIds;
  }

  componentDidLoad() {
    this.bindResizeObservers();
  }

  disconnectedCallback() {
    this.resizeObservers.forEach(ro => ro.disconnect());
    this.resizeObservers.clear();
  }

  @Watch('items')
  onItemsChange() {
    requestAnimationFrame(() => {
      this.bindResizeObservers();
      this.measureAll();
    });
  }

  private bindResizeObservers() {
    this.resizeObservers.forEach(ro => ro.disconnect());
    this.resizeObservers.clear();

    this.items.forEach(item => {
      const inner = this.el.querySelector(`[data-inner="${item.id}"]`) as HTMLElement | null;
      if (!inner) return;
      const ro = new ResizeObserver(() => {
        this.heights = { ...this.heights, [item.id]: inner.scrollHeight };
      });
      ro.observe(inner);
      this.resizeObservers.set(item.id, ro);
    });
  }

  private measureAll() {
    const next: Record<string, number> = { ...this.heights };
    this.items.forEach(item => {
      const inner = this.el.querySelector(`[data-inner="${item.id}"]`) as HTMLElement | null;
      if (inner) next[item.id] = inner.scrollHeight;
    });
    this.heights = next;
  }

  private toggle(id: string) {
    const current = this.activeIds;
    let next: string[];
    if (current.includes(id)) {
      next = current.filter(x => x !== id);
    } else {
      next = this.multiple ? [...current, id] : [id];
    }
    this.internalIds = next;
    this.dsExpandedChange.emit(next);
  }

  render() {
    const activeIds = this.activeIds;

    return (
      <Host class="accordion">
        {this.items.map(item => {
          const isExpanded = activeIds.includes(item.id);
          const triggerId = `ds-accordion-${this.instanceId}-trigger-${item.id}`;
          const panelId = `ds-accordion-${this.instanceId}-panel-${item.id}`;
          const bodyHeight = this.heights[item.id] ?? 0;

          return (
            <div
              key={item.id}
              class={{ item: true, 'item--inactive': !!item.inactive }}
            >
              <button
                type="button"
                id={triggerId}
                class="trigger"
                onClick={() => !item.inactive && this.toggle(item.id)}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                aria-disabled={item.inactive || undefined}
                tabIndex={item.inactive ? -1 : 0}
              >
                <span class="text-body-medium-emphasis">{item.label}</span>
                <span
                  class={{ chevron: true, 'chevron--open': isExpanded }}
                  aria-hidden="true"
                >&#x203A;</span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                class="body"
                style={{ height: isExpanded ? `${bodyHeight}px` : '0' }}
                aria-hidden={!isExpanded}
              >
                <div class="body-inner" data-inner={item.id}>
                  {item.content
                    ? <span class="text-body-medium">{item.content}</span>
                    : <slot name={item.id} />
                  }
                </div>
              </div>
            </div>
          );
        })}
      </Host>
    );
  }
}
