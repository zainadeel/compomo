import { Component, Prop, Event, EventEmitter, Element, Listen, Watch, h, Host } from '@stencil/core';
import {
  getSelectableTabs,
  isTabDivider,
  type TabItem,
  type TabItemTab,
} from '../TabGroup/tab-item-utils';

export type TabGroupNavBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark' | 'navigation';

@Component({
  tag: 'ds-tab-group-nav',
  styleUrl: 'TabGroupNav.css',
  scoped: true,
})
export class TabGroupNav {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) value: string = '';
  @Prop() tabs: TabItem[] = [];
  @Prop() background: TabGroupNavBackground | undefined;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | undefined;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;
  @Prop() orientation: 'horizontal' | 'vertical' = 'horizontal';

  @Event() dsChange!: EventEmitter<string>;

  private get selectableTabs(): TabItemTab[] {
    return getSelectableTabs(this.tabs);
  }

  private selectTab(id: string, options?: { focus?: boolean }) {
    this.value = id;
    this.dsChange.emit(id);
    if (options?.focus !== false) {
      this.focusTab(id);
    }
  }

  private focusTab(id: string) {
    const btn = this.el.querySelector(`[data-tab-id="${id}"]`) as HTMLElement | null;
    btn?.focus({ preventScroll: true });
  }

  /** Keep focus on the selected tab when value changes externally (e.g. BarNav menu). */
  @Watch('value')
  onValueChange(next: string, prev: string | undefined) {
    if (prev === undefined || next === prev) return;

    requestAnimationFrame(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || !this.el.contains(active)) return;

      const activeId = active.getAttribute('data-tab-id');
      if (activeId === next) return;

      const nextTab = this.el.querySelector(`[data-tab-id="${next}"]`) as HTMLElement | null;
      if (nextTab) {
        nextTab.focus({ preventScroll: true });
      } else {
        active.blur();
      }
    });
  }

  /**
   * Find the next non-disabled tab index relative to `from`, stepping by `step`.
   * Returns `from` unchanged if no other enabled tab exists.
   */
  private findEnabled(from: number, step: 1 | -1): number {
    const tabs = this.selectableTabs;
    const len = tabs.length;
    for (let n = 0; n < len; n++) {
      const i = (from + step * (n + 1) + len * (n + 1)) % len;
      if (!tabs[i]?.disabled) return i;
    }
    return from;
  }

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    const tabs = this.selectableTabs;
    if (!tabs.length) return;

    const currentIdx = tabs.findIndex(t => t.id === this.value);
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
      const first = tabs.findIndex(t => !t.disabled);
      nextIdx = first === -1 ? null : first;
    } else if (e.key === 'End') {
      const lastEnabled = [...tabs].reverse().findIndex(t => !t.disabled);
      nextIdx = lastEnabled === -1 ? null : tabs.length - 1 - lastEnabled;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      const next = tabs[nextIdx];
      this.selectTab(next.id);
    }
  }

  private getBgClass(): string {
    if (!this.background || this.background === 'faint') return '';
    if (this.background === 'always-dark') return 'on-always-dark';
    if (this.background === 'navigation') return 'on-navigation';
    return `on-${this.background}`;
  }

  render() {
    const bgClass = this.getBgClass();
    const isVertical = this.orientation === 'vertical';
    const isNavigation = this.background === 'navigation';

    return (
      <Host class="tab-group-nav-host">
        <div
          role="tablist"
          class={{
            'tab-list': true,
            'tab-list--vertical': isVertical,
            'tab-list--on-navigation': isNavigation,
          }}
          aria-label={this.ariaLabel}
          aria-labelledby={this.ariaLabelledby}
          aria-orientation={isVertical ? 'vertical' : undefined}
        >
          {this.tabs.map((tab, index) => {
            if (isTabDivider(tab)) {
              return (
                <div
                  key={`divider-${index}`}
                  class={{
                    'tab-divider': true,
                    'tab-divider--vertical': isVertical,
                  }}
                  aria-hidden="true"
                >
                  <div class="tab-divider__line" />
                </div>
              );
            }

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
                <span class={{
                  tab__label: true,
                  'tab__label--dot': !!tab.dot,
                  [isSelected ? 'text-body-medium-emphasis' : 'text-body-medium']: true,
                }}>
                  {tab.label}
                  {tab.dot && (
                    <ds-badge
                      class="tab__dot"
                      variant="dot"
                      background="var(--_dot-ring)"
                      label=""
                      aria-hidden="true"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Host>
    );
  }
}
