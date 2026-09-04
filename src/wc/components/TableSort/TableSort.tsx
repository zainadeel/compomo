import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
} from '@stencil/core';
import type { MenuItemData } from '../Menu/menu-types';
import type { TableColumn, TableSortChangeDetail, TableSortState } from '../Table/table-types';
import {
  nextTableSortStateFromMenuItem,
  tableSortFields,
  tableSortMenuSections,
  tableSortStatesEqual,
} from './table-sort-menu';

let tableSortSeq = 0;

@Component({
  tag: 'ds-table-sort',
  styleUrl: 'TableSort.css',
  scoped: true,
})
export class TableSort {
  @Element() private el!: HTMLElement;

  /** Catalog used to derive sortable fields, including compound header segments. */
  @Prop() columns: TableColumn[] = [];
  /** Controlled table sort. Header sorting and this menu share the same value. */
  @Prop() sort: TableSortState | null = null;
  /** Accessible name for the trigger and menu. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  @Event({ bubbles: false }) dsSortChange!: EventEmitter<TableSortChangeDetail>;

  @State() private menuOpen = false;
  @State() private menuSurfaceOpen = false;
  @State() private initialFocusVisible = false;

  private readonly componentId = `ds-table-sort-${++tableSortSeq}`;
  private readonly triggerId = `${this.componentId}-trigger`;
  private readonly menuId = `${this.componentId}-menu`;

  @Method()
  async setFocus() {
    const trigger = this.el.querySelector<HTMLElement & { setFocus?: () => Promise<void> }>(
      `#${CSS.escape(this.triggerId)}`
    );
    await trigger?.setFocus?.();
  }

  render() {
    const fields = tableSortFields(this.columns);
    const name = this.ariaLabel?.trim() || 'Sort table';

    return (
      <Host hidden={fields.length === 0 ? true : undefined}>
        {fields.length === 0 ? null : (
          <ds-button-unfilled
            id={this.triggerId}
            variant="icon-label"
            size="md"
            icon="ArrowsVertical"
            label="Sort"
            labelEmphasis={false}
            pressScale={false}
            aria-label={name}
            hasMenu={true}
            collapseLabel={true}
            expanded={this.menuOpen}
            surfaceOpen={this.menuSurfaceOpen}
            controls={this.menuId}
            onDsClick={(event: CustomEvent<MouseEvent>) => {
              this.toggle(event.detail.detail === 0);
            }}
          />
        )}
        {fields.length === 0 ? null : (
          <ds-menu
            id={this.menuId}
            open={this.menuOpen}
            anchorId={this.triggerId}
            align="start"
            side="bottom"
            menuLabel={name}
            selectionMode="none"
            initialFocusVisible={this.initialFocusVisible}
            sections={tableSortMenuSections(this.columns, this.sort)}
            onDsClose={() => this.close()}
            onDsAfterClose={() => {
              if (!this.menuOpen) this.menuSurfaceOpen = false;
            }}
            onDsSelect={event => this.handleSelect(event.detail)}
          />
        )}
      </Host>
    );
  }

  private toggle(fromKeyboard = false): void {
    if (this.menuOpen) this.close();
    else this.open(fromKeyboard);
  }

  private open(fromKeyboard = false): void {
    if (this.menuOpen) return;
    this.initialFocusVisible = fromKeyboard;
    this.menuOpen = true;
    this.menuSurfaceOpen = true;
  }

  private close(): void {
    this.menuOpen = false;
  }

  private handleSelect(item: MenuItemData): void {
    const next = nextTableSortStateFromMenuItem(this.columns, this.sort, item);
    if (tableSortStatesEqual(this.sort, next)) return;
    this.dsSortChange.emit({ sort: next });
  }
}
