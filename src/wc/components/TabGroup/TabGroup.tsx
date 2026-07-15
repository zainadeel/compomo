import { Component, Prop, Event, EventEmitter, Element, Listen, Watch, h, Host } from '@stencil/core';
import {
  getSelectableTabs,
  isTabDivider,
  type TabGroupItem,
  type TabItemTab,
} from './tab-item-utils';

export type TabBackground =
  | 'faint'
  | 'medium'
  | 'bold'
  | 'strong'
  | 'translucent'
  | 'inverted'
  | 'media'
  | 'always-dark';

@Component({
  tag: 'ds-tab-group',
  styleUrl: 'TabGroup.css',
  scoped: true,
})
export class TabGroup {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) value: string = '';
  @Prop() tabs: TabGroupItem[] = [];
  @Prop() background: TabBackground | undefined;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;

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

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    const tabs = this.selectableTabs;
    if (!tabs.length) return;

    const currentIdx = tabs.findIndex(t => t.id === this.value);

    let nextIdx: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIdx = this.findEnabled(currentIdx, 1);
    } else if (e.key === 'ArrowLeft') {
      nextIdx = this.findEnabled(currentIdx, -1);
    }

    if (e.key === 'Home') {
      const first = tabs.findIndex(t => !t.isInactive);
      nextIdx = first === -1 ? null : first;
    } else if (e.key === 'End') {
      const lastEnabled = [...tabs].reverse().findIndex(t => !t.isInactive);
      nextIdx = lastEnabled === -1 ? null : tabs.length - 1 - lastEnabled;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      const next = tabs[nextIdx];
      this.selectTab(next.id);
    }
  }

  private getBgClass(): string {
    if (!this.background) return '';
    if (this.background === 'always-dark') return 'on-always-dark';
    return `on-${this.background}`;
  }

  render() {
    const bgClass = this.getBgClass();

    return (
      <Host
        class={{
          'tab-group-host': true,
          'tab-group-host--surface': !!bgClass,
          [`tab-group-host--${bgClass}`]: !!bgClass,
        }}
      >
        <div
          role="tablist"
          class="tab-list"
          aria-label={this.ariaLabel}
          aria-labelledby={this.ariaLabelledby}
        >
          {this.tabs.map((tab, index) => {
            if (isTabDivider(tab)) {
              return (
                <div
                  key={`divider-${index}`}
                  class="tab-divider"
                  aria-hidden="true"
                >
                  <div class="tab-divider__line" />
                </div>
              );
            }

            const isSelected = tab.id === this.value;
            const variant = tab.variant ?? 'label';
            const showIcon = variant === 'icon' || variant === 'icon-label';
            const showLabel = variant === 'label' || variant === 'icon-label';
            const emphasizeLabel = isSelected && !bgClass;
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
                  'ds-interaction-fill': !tab.isInactive,
                  'ds-interaction-fill--on-faint': bgClass === 'on-faint',
                  'ds-interaction-fill--on-medium': bgClass === 'on-medium',
                  'ds-interaction-fill--on-bold': bgClass === 'on-bold',
                  'ds-interaction-fill--on-strong': bgClass === 'on-strong',
                  'ds-interaction-fill--on-translucent': bgClass === 'on-translucent',
                  'ds-interaction-fill--on-inverted': bgClass === 'on-inverted',
                  'ds-interaction-fill--on-media': bgClass === 'on-media',
                  'ds-interaction-fill--on-always-dark': bgClass === 'on-always-dark',
                  'ds-control-inactive': !!tab.isInactive,
                  [bgClass]: !!bgClass,
                }}
                aria-label={variant === 'icon' ? tab.label : undefined}
                aria-selected={isSelected}
                aria-disabled={tab.isInactive ? 'true' : undefined}
                aria-controls={tab.panelId ?? undefined}
                disabled={tab.isInactive}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => !tab.isInactive && this.selectTab(tab.id)}
              >
                <span class={{
                  tab__content: true,
                  [`tab__content--${variant}`]: true,
                  'tab__content--dot': !!tab.dot,
                }}>
                  {showIcon && (
                    <ds-icon
                      class="tab__icon"
                      name={tab.icon}
                      size="sm"
                      color="inherit"
                    />
                  )}
                  {showLabel && (
                    <ds-text
                      class="tab__label"
                      as="span"
                      variant="text-body-small"
                      emphasis={emphasizeLabel}
                      color="inherit"
                    >
                      {tab.label}
                    </ds-text>
                  )}
                  {tab.dot && (
                    <ds-badge
                      class="tab__dot"
                      variant="dot"
                      style={{ '--_badge-ring-width': '0' }}
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
