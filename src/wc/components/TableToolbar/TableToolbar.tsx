import { Component, Element, h, Host, Prop, State } from '@stencil/core';

const TABLE_TOOLBAR_SLOT_START = 1 << 0;
const TABLE_TOOLBAR_SLOT_SEARCH = 1 << 1;
const TABLE_TOOLBAR_SLOT_LEADING = 1 << 2;
const TABLE_TOOLBAR_SLOT_TRAILING = 1 << 3;

@Component({
  tag: 'ds-table-toolbar',
  styleUrl: 'TableToolbar.css',
  scoped: true,
})
export class TableToolbar {
  @Element() el!: HTMLElement;

  /** Accessible name for the grouped table controls. */
  @Prop() label: string = 'Table controls';

  @State() private slotPresence = 0;

  componentWillLoad(): void {
    this.syncSlotPresence();
  }

  private hasOwnedSlot(name: string): boolean {
    return Array.from(this.el.querySelectorAll<HTMLElement>(`[slot="${name}"]`)).some(
      element => element.closest('ds-table-toolbar') === this.el
    );
  }

  private syncSlotPresence = () => {
    let presence = 0;
    if (this.hasOwnedSlot('start')) presence |= TABLE_TOOLBAR_SLOT_START;
    if (this.hasOwnedSlot('search')) presence |= TABLE_TOOLBAR_SLOT_SEARCH;
    if (this.hasOwnedSlot('leading')) presence |= TABLE_TOOLBAR_SLOT_LEADING;
    if (this.hasOwnedSlot('trailing')) presence |= TABLE_TOOLBAR_SLOT_TRAILING;
    if (presence !== this.slotPresence) this.slotPresence = presence;
  };

  render() {
    const hasStart = (this.slotPresence & TABLE_TOOLBAR_SLOT_START) !== 0;
    const hasSearch = (this.slotPresence & TABLE_TOOLBAR_SLOT_SEARCH) !== 0;
    const hasLeading = (this.slotPresence & TABLE_TOOLBAR_SLOT_LEADING) !== 0;
    const hasTrailing = (this.slotPresence & TABLE_TOOLBAR_SLOT_TRAILING) !== 0;

    return (
      <Host>
        <div class="table-toolbar" role="toolbar" aria-label={this.label}>
          <div
            class={{
              'table-toolbar__start': true,
              'table-toolbar__slot--empty': !hasStart,
            }}
          >
            <slot name="start" onSlotchange={this.syncSlotPresence} />
          </div>
          <ds-divider
            class={{
              'table-toolbar__rule': true,
              'table-toolbar__slot--empty': !hasStart,
            }}
            orientation="vertical"
            length="32px"
          />
          <div
            class={{
              'table-toolbar__search': true,
              'table-toolbar__slot--empty': !hasSearch,
            }}
          >
            <slot name="search" onSlotchange={this.syncSlotPresence} />
          </div>
          <div
            class={{
              'table-toolbar__leading': true,
              'table-toolbar__slot--empty': !hasLeading,
            }}
          >
            <slot name="leading" onSlotchange={this.syncSlotPresence} />
          </div>
          <div
            class={{
              'table-toolbar__trailing': true,
              'table-toolbar__slot--empty': !hasTrailing,
            }}
          >
            <slot name="trailing" onSlotchange={this.syncSlotPresence} />
          </div>
        </div>
      </Host>
    );
  }
}
