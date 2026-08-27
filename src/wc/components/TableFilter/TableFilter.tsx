import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import type {
  FilterMenuChangeDetail,
  FilterMenuFilter,
  FilterMenuMatchModeChangeDetail,
  FilterMenuMatchModes,
  FilterMenuValues,
} from '../FilterMenu/FilterMenu';

@Component({
  tag: 'ds-table-filter',
  styleUrl: 'TableFilter.css',
  scoped: true,
})
export class TableFilter {
  /** Controlled popup visibility. */
  @Prop({ mutable: true }) open: boolean = false;
  /** Product-owned filter categories and option definitions. */
  @Prop() filters: FilterMenuFilter[] = [];
  /** Controlled values keyed by filter id. */
  @Prop() values: FilterMenuValues = {};
  /** Controlled any/all match mode keyed by multiple-choice filter id. Defaults to any. */
  @Prop() matchModes: FilterMenuMatchModes = {};
  /** Controlled category shown in the option pane. */
  @Prop() activeFilterId: string | undefined;
  /** Visible trigger label. */
  @Prop() label: string = 'Filter';
  /** Accessible name for the trigger. Defaults to Filter table. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Accessible name for the non-modal filter dialog. Defaults to the trigger name. */
  @Prop() menuLabel: string | null = null;
  /** Accessible name for the category tab list. */
  @Prop() categoriesLabel: string = 'Filter categories';
  /** Footer action and date-clear accessible label. */
  @Prop() clearLabel: string = 'Clear';

  /** Requests a controlled value replacement without closing the popup. */
  @Event() dsChange!: EventEmitter<FilterMenuChangeDetail>;
  /** Requests that the consumer clear every filter value. */
  @Event() dsClear!: EventEmitter<void>;
  /** Requests a controlled any/all mode replacement for a multiple-choice filter. */
  @Event() dsMatchModeChange!: EventEmitter<FilterMenuMatchModeChangeDetail>;
  /** Requests a controlled active-category replacement. */
  @Event() dsActiveFilterChange!: EventEmitter<string>;
  /** Requests that the controlled popup close. */
  @Event() dsClose!: EventEmitter<void>;
  /** Emitted whenever trigger activation changes popup visibility. */
  @Event() dsOpenChange!: EventEmitter<boolean>;
  /** Emitted after exit motion and rendered popup removal complete. */
  @Event() dsAfterClose!: EventEmitter<void>;

  render() {
    const name = this.ariaLabel?.trim() || 'Filter table';
    const menuName = this.menuLabel?.trim() || name;

    return (
      <Host>
        <ds-filter-menu
          open={this.open}
          triggerLabel={this.label}
          showSelectedCount={false}
          icon="Filters"
          size="md"
          width="hug"
          hasBorder={true}
          activeFill={false}
          collapseLabel={true}
          align="start"
          aria-label={name}
          filters={this.filters}
          values={this.values}
          matchModes={this.matchModes}
          activeFilterId={this.activeFilterId}
          menuLabel={menuName}
          categoriesLabel={this.categoriesLabel}
          clearLabel={this.clearLabel}
          footerLayout="categories-clear"
          onDsChange={event => this.forward(event, this.dsChange)}
          onDsClear={event => this.forward(event, this.dsClear)}
          onDsMatchModeChange={event => this.forward(event, this.dsMatchModeChange)}
          onDsActiveFilterChange={event => this.forward(event, this.dsActiveFilterChange)}
          onDsClose={event => this.forward(event, this.dsClose)}
          onDsOpenChange={event => {
            event.stopPropagation();
            this.open = event.detail;
            this.dsOpenChange.emit(event.detail);
          }}
          onDsAfterClose={event => this.forward(event, this.dsAfterClose)}
        />
      </Host>
    );
  }

  private forward<T>(event: CustomEvent<T>, emitter: EventEmitter<T>): void {
    event.stopPropagation();
    emitter.emit(event.detail);
  }
}
