import { Component, Prop, State, Event, EventEmitter, Element, Listen, Watch, h, Host } from '@stencil/core';

export type TabBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
  /** id of the tabpanel this tab controls */
  panelId?: string;
  /** optional badge count shown as a pill next to label */
  count?: number;
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
  @Prop() orientation: 'horizontal' | 'vertical' = 'horizontal';

  @State() private indicatorOffset: number = 0;
  @State() private indicatorSize: number = 0;

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

  @Watch('orientation')
  onOrientationChange() {
    requestAnimationFrame(() => this.updateIndicator());
  }

  private updateIndicator() {
    const selected = this.el.querySelector(`[data-tab-id="${this.value}"]`) as HTMLElement | null;
    if (!selected) return;
    const list = selected.closest('.tab-list') as HTMLElement | null;
    if (!list) return;
    const listRect = list.getBoundingClientRect();
    const tabRect = selected.getBoundingClientRect();

    if (this.orientation === 'vertical') {
      this.indicatorOffset = tabRect.top - listRect.top;
      this.indicatorSize = tabRect.height;
    } else {
      this.indicatorOffset = tabRect.left - listRect.left;
      this.indicatorSize = tabRect.width;
    }
  }

  private selectTab(id: string) {
    this.value = id;
    this.dsChange.emit(id);
  }

  /**
   * Find the next non-disabled tab index relative to `from`, stepping by `step`.
   * Returns `from` unchanged if no other enabled tab exists.
   */
  private findEnabled(from: number, step: 1 | -1): number {
    const len = this.tabs.length;
    for (let n = 0; n < len; n++) {
      const i = (from + step * (n + 1) + len * (n + 1)) % len;
      if (!this.tabs[i]?.disabled) return i;
    }
    return from;
  }

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    if (!this.tabs.length) return;

    const currentIdx = this.tabs.findIndex(t => t.id === this.value);
    const isVertical = this.orientation === 'vertical';

    let nextIdx: number | null = null;

    if (!isVertical) {
      if (e.key === 'ArrowRight') {
        nextIdx = this.findEnabled(currentIdx, 1);
      } else if (e.key === 'ArrowLeft') {
        nextIdx = this.findEnabled(currentIdx, -1);
      }
    } else {
      if (e.key === 'ArrowDown') {
        nextIdx = this.findEnabled(currentIdx, 1);
      } else if (e.key === 'ArrowUp') {
        nextIdx = this.findEnabled(currentIdx, -1);
      }
    }

    if (e.key === 'Home') {
      const first = this.tabs.findIndex(t => !t.disabled);
      nextIdx = first === -1 ? null : first;
    } else if (e.key === 'End') {
      const lastEnabled = [...this.tabs].reverse().findIndex(t => !t.disabled);
      nextIdx = lastEnabled === -1 ? null : this.tabs.length - 1 - lastEnabled;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      const next = this.tabs[nextIdx];
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
    const isVertical = this.orientation === 'vertical';

    const indicatorStyle = isVertical
      ? {
          transform: `translateY(${this.indicatorOffset}px)`,
          height: `${this.indicatorSize}px`,
        }
      : {
          transform: `translateX(${this.indicatorOffset}px)`,
          width: `${this.indicatorSize}px`,
        };

    return (
      <Host class="tab-group-host">
        <div
          role="tablist"
          class={{ 'tab-list': true, 'tab-list--vertical': isVertical }}
          aria-label={this.ariaLabel}
          aria-labelledby={this.ariaLabelledby}
          aria-orientation={isVertical ? 'vertical' : undefined}
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
                aria-controls={tab.panelId ?? undefined}
                disabled={tab.disabled}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => !tab.disabled && this.selectTab(tab.id)}
              >
                <span class={isSelected ? 'text-body-medium-emphasis' : 'text-body-medium'}>
                  {tab.label}
                </span>
                {tab.count != null && tab.count > 0 && (
                  <span class={{ 'tab-count': true, 'tab-count--selected': isSelected }}>
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                )}
              </button>
            );
          })}
          <div class="indicator" style={indicatorStyle} />
        </div>
      </Host>
    );
  }
}
