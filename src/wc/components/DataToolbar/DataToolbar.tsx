import { Component, Element, h, Host, Prop, State } from '@stencil/core';

const TOOLBAR_SLOT_START = 1 << 0;
const TOOLBAR_SLOT_SEARCH = 1 << 1;
const TOOLBAR_SLOT_LEADING = 1 << 2;
const TOOLBAR_SLOT_TRAILING = 1 << 3;

@Component({
  tag: 'ds-data-toolbar',
  styleUrl: 'DataToolbar.css',
  scoped: true,
})
export class DataToolbar {
  @Element() el!: HTMLElement;

  /** Accessible name for the grouped controls. Pass a contextual name such as Table controls or Map controls. */
  @Prop() label: string = 'Controls';

  /** Use separators between regions when composing borderless controls. */
  @Prop() borderless: boolean = false;

  @State() private slotPresence = 0;

  componentWillLoad(): void {
    this.syncSlotPresence();
  }

  private hasOwnedSlot(name: string): boolean {
    return Array.from(this.el.querySelectorAll<HTMLElement>(`[slot="${name}"]`)).some(
      element => element.closest('ds-data-toolbar') === this.el
    );
  }

  private syncSlotPresence = () => {
    let presence = 0;
    if (this.hasOwnedSlot('start')) presence |= TOOLBAR_SLOT_START;
    if (this.hasOwnedSlot('search')) presence |= TOOLBAR_SLOT_SEARCH;
    if (this.hasOwnedSlot('leading')) presence |= TOOLBAR_SLOT_LEADING;
    if (this.hasOwnedSlot('trailing')) presence |= TOOLBAR_SLOT_TRAILING;
    if (presence !== this.slotPresence) this.slotPresence = presence;
  };

  render() {
    const hasStart = (this.slotPresence & TOOLBAR_SLOT_START) !== 0;
    const hasSearch = (this.slotPresence & TOOLBAR_SLOT_SEARCH) !== 0;
    const hasLeading = (this.slotPresence & TOOLBAR_SLOT_LEADING) !== 0;
    const hasTrailing = (this.slotPresence & TOOLBAR_SLOT_TRAILING) !== 0;

    return (
      <Host>
        <div class="data-toolbar" role="toolbar" aria-label={this.label}>
          <div
            class={{
              'data-toolbar__start': true,
              'data-toolbar__slot--empty': !hasStart,
            }}
          >
            <slot name="start" onSlotchange={this.syncSlotPresence} />
          </div>
          <ds-divider
            class={{
              'data-toolbar__rule': true,
              'data-toolbar__slot--empty':
                !this.borderless || !hasStart || !(hasSearch || hasLeading || hasTrailing),
            }}
            orientation="vertical"
            length="var(--dimension-space-250)"
          />
          <div
            class={{
              'data-toolbar__search': true,
              'data-toolbar__slot--empty': !hasSearch,
            }}
          >
            <slot name="search" onSlotchange={this.syncSlotPresence} />
          </div>
          <ds-divider
            class={{
              'data-toolbar__rule': true,
              'data-toolbar__slot--empty':
                !this.borderless || !hasSearch || !(hasLeading || hasTrailing),
            }}
            orientation="vertical"
            length="var(--dimension-space-250)"
          />
          <div
            class={{
              'data-toolbar__leading': true,
              'data-toolbar__slot--empty': !hasLeading,
            }}
          >
            <slot name="leading" onSlotchange={this.syncSlotPresence} />
          </div>
          <div
            class={{
              'data-toolbar__trailing': true,
              'data-toolbar__slot--empty': !hasTrailing,
            }}
          >
            <slot name="trailing" onSlotchange={this.syncSlotPresence} />
          </div>
        </div>
      </Host>
    );
  }
}
