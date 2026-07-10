import { Component, Prop, Event, EventEmitter, Element, Listen, Watch, Method, State, h, Host } from '@stencil/core';
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

  /**
   * When `false`, arrow keys move focus only — Space/Enter (or click) commits selection.
   * Used by bar nav where each tab is a full page transition.
   */
  @Prop() selectionFollowsFocus: boolean = true;

  /** When `false`, every tab uses `tabindex="-1"` (another chrome control owns the tab stop). */
  @Prop() rovingEnabled: boolean = true;

  @Event() dsChange!: EventEmitter<string>;

  /** Fired when arrow navigation reaches the first/last tab in manual selection mode. */
  @Event() dsRovingExit!: EventEmitter<'start' | 'end'>;

  @State() private focusedTabId: string = '';

  private get selectableTabs(): TabItemTab[] {
    return getSelectableTabs(this.tabs);
  }

  componentWillLoad() {
    this.syncFocusedTabId(this.value);
  }

  @Watch('value')
  onValueChange(next: string, prev: string | undefined) {
    if (!this.selectionFollowsFocus) {
      if (prev === undefined || next !== this.focusedTabId) {
        this.syncFocusedTabId(next);
      }
      return;
    }

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

  @Watch('tabs')
  onTabsChange() {
    if (!this.selectableTabs.some(tab => tab.id === this.focusedTabId)) {
      this.syncFocusedTabId(this.value);
    }
  }

  @Method()
  async focusTab(id: string) {
    this.focusedTabId = id;
    const btn = this.el.querySelector(`[data-tab-id="${id}"]`) as HTMLElement | null;
    btn?.focus({ preventScroll: true });
  }

  @Method()
  async focusLastTab() {
    const tabs = this.selectableTabs;
    const last = [...tabs].reverse().find(tab => !tab.isInactive);
    if (last) await this.focusTab(last.id);
  }

  @Method()
  async focusFirstTab() {
    const first = this.selectableTabs.find(tab => !tab.isInactive);
    if (first) await this.focusTab(first.id);
  }

  private syncFocusedTabId(preferred: string) {
    const tabs = this.selectableTabs;
    if (tabs.some(tab => tab.id === preferred && !tab.isInactive)) {
      this.focusedTabId = preferred;
      return;
    }
    const first = tabs.find(tab => !tab.isInactive);
    this.focusedTabId = first?.id ?? '';
  }

  private selectTab(id: string, options?: { focus?: boolean }) {
    this.value = id;
    this.focusedTabId = id;
    this.dsChange.emit(id);
    if (options?.focus !== false) {
      void this.focusTab(id);
    }
  }

  private getFocusedIndex(): number {
    return this.selectableTabs.findIndex(tab => tab.id === this.focusedTabId);
  }

  private findEnabledLinear(from: number, step: 1 | -1): number | null {
    const tabs = this.selectableTabs;
    for (let i = from + step; i >= 0 && i < tabs.length; i += step) {
      if (!tabs[i]?.isInactive) return i;
    }
    return null;
  }

  /**
   * Find the next non-inactive tab index relative to `from`, stepping by `step`.
   * Returns `from` unchanged if no other enabled tab exists.
   */
  private findEnabled(from: number, step: 1 | -1): number {
    const tabs = this.selectableTabs;
    const len = tabs.length;
    for (let n = 0; n < len; n++) {
      const i = (from + step * (n + 1) + len * (n + 1)) % len;
      if (!tabs[i]?.isInactive) return i;
    }
    return from;
  }

  private moveFocusToIndex(nextIdx: number) {
    const next = this.selectableTabs[nextIdx];
    if (!next) return;
    this.focusedTabId = next.id;
    void this.focusTab(next.id);
  }

  private activateFocusedTab(e: KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tab = this.selectableTabs.find(item => item.id === this.focusedTabId);
    if (!tab || tab.isInactive) return;
    e.preventDefault();
    this.selectTab(tab.id, { focus: true });
  }

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    const tabs = this.selectableTabs;
    if (!tabs.length) return;

    if (!this.selectionFollowsFocus) {
      if (e.key === 'Enter' || e.key === ' ') {
        this.activateFocusedTab(e);
        return;
      }
    }

    const currentIdx = this.selectionFollowsFocus
      ? tabs.findIndex(t => t.id === this.value)
      : this.getFocusedIndex();
    if (currentIdx < 0) return;

    const isVertical = this.orientation === 'vertical';
    let nextIdx: number | null = null;
    let exit: 'start' | 'end' | null = null;

    if (!isVertical) {
      if (e.key === 'ArrowRight') {
        if (this.selectionFollowsFocus) {
          nextIdx = this.findEnabled(currentIdx, 1);
        } else {
          const candidate = this.findEnabledLinear(currentIdx, 1);
          if (candidate === null) exit = 'end';
          else nextIdx = candidate;
        }
      } else if (e.key === 'ArrowLeft') {
        if (this.selectionFollowsFocus) {
          nextIdx = this.findEnabled(currentIdx, -1);
        } else {
          const candidate = this.findEnabledLinear(currentIdx, -1);
          if (candidate === null) exit = 'start';
          else nextIdx = candidate;
        }
      }
    } else {
      if (e.key === 'ArrowDown') {
        if (this.selectionFollowsFocus) {
          nextIdx = this.findEnabled(currentIdx, 1);
        } else {
          const candidate = this.findEnabledLinear(currentIdx, 1);
          if (candidate === null) exit = 'end';
          else nextIdx = candidate;
        }
      } else if (e.key === 'ArrowUp') {
        if (this.selectionFollowsFocus) {
          nextIdx = this.findEnabled(currentIdx, -1);
        } else {
          const candidate = this.findEnabledLinear(currentIdx, -1);
          if (candidate === null) exit = 'start';
          else nextIdx = candidate;
        }
      }
    }

    if (e.key === 'Home') {
      const first = tabs.findIndex(t => !t.isInactive);
      nextIdx = first === -1 ? null : first;
    } else if (e.key === 'End') {
      const lastEnabled = [...tabs].reverse().findIndex(t => !t.isInactive);
      nextIdx = lastEnabled === -1 ? null : tabs.length - 1 - lastEnabled;
    }

    if (exit) {
      e.preventDefault();
      this.dsRovingExit.emit(exit);
      return;
    }

    if (nextIdx !== null && nextIdx !== currentIdx) {
      e.preventDefault();
      const next = tabs[nextIdx];
      if (this.selectionFollowsFocus) {
        this.selectTab(next.id);
      } else {
        this.moveFocusToIndex(nextIdx);
      }
    }
  }

  private getBgClass(): string {
    if (!this.background || this.background === 'faint') return '';
    if (this.background === 'always-dark') return 'on-always-dark';
    if (this.background === 'navigation') return 'on-navigation';
    return `on-${this.background}`;
  }

  private tabIndexForTab(tab: TabItemTab): number {
    if (!this.rovingEnabled) return -1;
    if (this.selectionFollowsFocus) {
      return tab.id === this.value ? 0 : -1;
    }
    return tab.id === this.focusedTabId ? 0 : -1;
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
                  'ds-focus-ring-inset': true,
                  'ds-control-inactive': !!tab.isInactive,
                  [bgClass]: !!bgClass,
                }}
                aria-selected={isSelected}
                aria-disabled={tab.isInactive || undefined}
                aria-controls={tab.panelId ?? undefined}
                disabled={tab.isInactive}
                tabIndex={this.tabIndexForTab(tab)}
                onClick={() => !tab.isInactive && this.selectTab(tab.id)}
                onFocus={() => {
                  if (!this.selectionFollowsFocus) {
                    this.focusedTabId = tab.id;
                  }
                }}
              >
                <span class={{
                  tab__label: true,
                  'tab__label--dot': !!tab.dot,
                }}>
                  <ds-text as="span" variant="text-body-medium" emphasis={isSelected} color="inherit">
                    {tab.label}
                  </ds-text>
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
