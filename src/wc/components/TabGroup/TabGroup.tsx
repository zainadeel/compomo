import { Component, Prop, State, Event, EventEmitter, Element, Listen, Watch, h, Host } from '@stencil/core';

export type TabBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

@Component({
  tag: 'ds-tab-group',
  styleUrl: 'TabGroup.css',
  scoped: true,
})
export class TabGroup {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) value: string = '';
  @Prop() tabs: TabItem[] = [];
  @Prop() background: TabBackground | undefined;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | undefined;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;

  @State() private indicatorLeft: number = 0;
  @State() private indicatorWidth: number = 0;

  @Event() dsChange!: EventEmitter<string>;

  private resizeObserver: ResizeObserver | null = null;

  componentDidLoad() {
    this.resizeObserver = new ResizeObserver(() => this.updateIndicator());
    const list = this.el.querySelector('[role="tablist"]') as HTMLElement;
    if (list) this.resizeObserver.observe(list);
    this.updateIndicator();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
  }

  @Watch('value')
  onValueChange() {
    this.updateIndicator();
  }

  @Watch('tabs')
  onTabsChange() {
    // Allow a render cycle before measuring
    requestAnimationFrame(() => this.updateIndicator());
  }

  private updateIndicator() {
    const selected = this.el.querySelector(`[data-tab-id="${this.value}"]`) as HTMLElement | null;
    if (!selected) return;
    const list = selected.closest('.tab-list') as HTMLElement | null;
    if (!list) return;
    const listRect = list.getBoundingClientRect();
    const tabRect = selected.getBoundingClientRect();
    this.indicatorLeft = tabRect.left - listRect.left;
    this.indicatorWidth = tabRect.width;
  }

  private selectTab(id: string) {
    this.value = id;
    this.dsChange.emit(id);
  }

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    const active = this.tabs.filter(t => !t.disabled);
    if (!active.length) return;

    const currentIdx = active.findIndex(t => t.id === this.value);

    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIdx = (currentIdx + 1) % active.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (currentIdx - 1 + active.length) % active.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = active.length - 1;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      const next = active[nextIdx];
      this.selectTab(next.id);
      const btn = this.el.querySelector(`[data-tab-id="${next.id}"]`) as HTMLElement | null;
      btn?.focus();
    }
  }

  private getBgClass(): string {
    if (!this.background || this.background === 'faint') return '';
    if (this.background === 'always-dark') return 'on-always-dark';
    return `on-${this.background}`;
  }

  render() {
    const bgClass = this.getBgClass();

    return (
      <Host class="tab-group-host">
        <div
          role="tablist"
          class="tab-list"
          aria-label={this.ariaLabel}
          aria-labelledby={this.ariaLabelledby}
        >
          {this.tabs.map(tab => {
            const isSelected = tab.id === this.value;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                data-tab-id={tab.id}
                class={{
                  tab: true,
                  'tab--selected': isSelected,
                  [bgClass]: !!bgClass,
                }}
                aria-selected={isSelected}
                aria-disabled={tab.disabled || undefined}
                disabled={tab.disabled}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => !tab.disabled && this.selectTab(tab.id)}
              >
                <span class={isSelected ? 'text-body-medium-emphasis' : 'text-body-medium'}>
                  {tab.label}
                </span>
              </button>
            );
          })}
          <div
            class="indicator"
            style={{ left: `${this.indicatorLeft}px`, width: `${this.indicatorWidth}px` }}
          />
        </div>
      </Host>
    );
  }
}
