import { Component, Prop, Event, EventEmitter, Element, Listen, Watch, h, Host } from '@stencil/core';
import type { PanelSubNavItem } from './panel-sub-nav-types';

export type PanelSubNavBackground =
  | 'faint'
  | 'medium'
  | 'bold'
  | 'strong'
  | 'translucent'
  | 'inverted'
  | 'media'
  | 'always-dark';

@Component({
  tag: 'ds-panel-sub-nav',
  styleUrl: 'PanelSubNav.css',
  scoped: true,
})
export class PanelSubNav {
  @Element() el!: HTMLElement;

  /** Required selected item id when enabled items exist. Keep synchronized with the visible panel. */
  @Prop({ mutable: true }) value: string = '';
  /**
   * Local panel tabs. Assign this array through the JavaScript property.
   * Replace the array reference when items change.
   */
  @Prop() items: PanelSubNavItem[] = [];
  /** Actual parent surface context. Omit on primary and secondary surfaces. */
  @Prop() background: PanelSubNavBackground | undefined;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;

  @Event() dsChange!: EventEmitter<string>;

  private get enabledItems(): PanelSubNavItem[] {
    return this.items.filter(item => !item.isInactive);
  }

  private get focusableId(): string {
    return this.enabledItems.some(item => item.id === this.value)
      ? this.value
      : (this.enabledItems[0]?.id ?? '');
  }

  private selectItem(id: string) {
    this.value = id;
    this.dsChange.emit(id);
    this.focusItem(id);
  }

  private focusItem(id: string) {
    const item = this.el.querySelector(`[data-panel-sub-nav-id="${id}"]`) as HTMLElement | null;
    item?.focus({ preventScroll: true });
  }

  @Watch('value')
  onValueChange(next: string, previous: string | undefined) {
    if (previous === undefined || next === previous) return;

    requestAnimationFrame(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || !this.el.contains(active)) return;
      this.focusItem(this.enabledItems.some(item => item.id === next) ? next : this.focusableId);
    });
  }

  private findEnabled(from: number, step: 1 | -1): number {
    const length = this.items.length;
    for (let offset = 1; offset <= length; offset++) {
      const index = (from + step * offset + length * offset) % length;
      if (!this.items[index]?.isInactive) return index;
    }
    return from;
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (!this.enabledItems.length) return;

    const focusedId = (event.target as Element | null)
      ?.closest<HTMLElement>('[data-panel-sub-nav-id]')
      ?.dataset['panelSubNavId'];
    const focusedIndex = this.items.findIndex(item => item.id === focusedId);
    const selectedIndex = this.items.findIndex(item => item.id === this.value && !item.isInactive);
    const currentIndex = focusedIndex >= 0
      ? focusedIndex
      : selectedIndex >= 0
        ? selectedIndex
      : (event.key === 'ArrowUp' ? 0 : -1);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowDown') {
      nextIndex = this.findEnabled(currentIndex, 1);
    } else if (event.key === 'ArrowUp') {
      nextIndex = this.findEnabled(currentIndex, -1);
    } else if (event.key === 'Home') {
      nextIndex = this.items.findIndex(item => !item.isInactive);
    } else if (event.key === 'End') {
      const reversedIndex = [...this.items].reverse().findIndex(item => !item.isInactive);
      nextIndex = reversedIndex < 0 ? null : this.items.length - 1 - reversedIndex;
    }

    if (nextIndex === null || nextIndex < 0) return;
    const next = this.items[nextIndex];
    if (!next || next.isInactive) return;

    event.preventDefault();
    this.selectItem(next.id);
  }

  render() {
    const focusableId = this.focusableId;
    const background = this.background;

    return (
      <Host>
        <div
          class="panel-sub-nav"
          role="tablist"
          aria-orientation="vertical"
          aria-label={this.ariaLabel}
          aria-labelledby={this.ariaLabelledby}
        >
          {this.items.map(item => {
            const isSelected = item.id === this.value;
            return (
              <button
                id={item.id}
                type="button"
                role="tab"
                data-panel-sub-nav-id={item.id}
                class={{
                  'panel-sub-nav__item': true,
                  'panel-sub-nav__item--selected': isSelected,
                  'ds-control--md': true,
                  'ds-focus-ring-inset': true,
                  'ds-interaction-fill': !item.isInactive,
                  'ds-interaction-fill--selected': isSelected && !item.isInactive,
                  'ds-interaction-fill--on-faint': background === 'faint',
                  'ds-interaction-fill--on-medium': background === 'medium',
                  'ds-interaction-fill--on-bold': background === 'bold',
                  'ds-interaction-fill--on-strong': background === 'strong',
                  'ds-interaction-fill--on-translucent': background === 'translucent',
                  'ds-interaction-fill--on-inverted': background === 'inverted',
                  'ds-interaction-fill--on-media': background === 'media',
                  'ds-interaction-fill--on-always-dark': background === 'always-dark',
                  [`panel-sub-nav__item--on-${background}`]: !!background,
                  'ds-control-inactive': !!item.isInactive,
                }}
                aria-selected={isSelected ? 'true' : 'false'}
                aria-controls={item.panelId}
                aria-disabled={item.isInactive ? 'true' : undefined}
                disabled={item.isInactive}
                tabIndex={item.id === focusableId ? 0 : -1}
                onClick={() => !item.isInactive && this.selectItem(item.id)}
              >
                <ds-text
                  class="panel-sub-nav__label ds-interaction-fill__content"
                  as="span"
                  variant="text-body-medium"
                  color="inherit"
                >
                  {item.label}
                </ds-text>
              </button>
            );
          })}
        </div>
      </Host>
    );
  }
}
