import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
} from '@stencil/core';
import { ChoiceSearch } from '../../utils/choice-list-parts';

@Component({
  tag: 'ds-panel-tool-search',
  styleUrl: 'PanelToolSearch.css',
  scoped: true,
})
export class PanelToolSearch {
  @Element() el!: HTMLElement;

  /** Current search query. */
  @Prop({ mutable: true }) value: string = '';
  /** Search guidance shown while the query is empty. */
  @Prop() placeholder: string = 'Search';
  /** Accessible name for the search field. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string = 'Search';
  /** Optional ID of the results region filtered by this search. */
  @Prop() controls: string | undefined;
  /** Prevents search interaction while keeping the row visible. */
  @Prop() isInactive: boolean = false;
  /** Show the optional trailing filter-menu trigger. */
  @Prop() showFilter: boolean = false;
  /** Accessible name for the filter-menu trigger. */
  @Prop() filterAriaLabel: string = 'Filter';
  /** Stable id placed on the filter trigger for ds-menu anchoring. */
  @Prop() filterTriggerId: string = '';
  /** Id of the menu controlled by the filter trigger. */
  @Prop() filterControls: string | undefined;
  /** Whether the controlled filter menu is open. */
  @Prop() filterExpanded: boolean = false;
  /** Promote the trigger foreground when one or more filters are applied. */
  @Prop() filterActive: boolean = false;

  @Event() dsChange!: EventEmitter<string>;
  @Event() dsClear!: EventEmitter<void>;
  @Event() dsFilterToggle!: EventEmitter<MouseEvent>;

  componentDidRender() {
    const input = this.el.querySelector('input');
    if (input && input.value !== this.value) input.value = this.value;
  }

  @Method()
  async setFocus() {
    this.el.querySelector('input')?.focus();
  }

  @Method()
  async focusFilterTrigger() {
    const trigger = this.el.querySelector('ds-button-unfilled.panel-tool-search__filter') as
      | (HTMLElement & { setFocus?: () => Promise<void> })
      | null;
    await trigger?.setFocus?.();
  }

  private handleChange = (value: string) => {
    this.value = value;
    this.dsChange.emit(value);
  };

  render() {
    return (
      <Host>
        <div class="panel-tool-search">
          <ChoiceSearch
            value={this.value}
            placeholder={this.placeholder}
            ariaLabel={this.ariaLabel}
            controls={this.controls}
            disabled={this.isInactive}
            inputRef={() => undefined}
            clearLabel="Clear"
            onValueChange={this.handleChange}
            onClear={() => this.dsClear.emit()}
            onKeyDown={() => undefined}
          />
          {this.showFilter ? (
            <div class="panel-tool-search__filter-group">
              <ds-divider
                class="panel-tool-search__divider"
                orientation="vertical"
                length="var(--dimension-size-200)"
              />
              <ds-button-unfilled
                id={this.filterTriggerId || undefined}
                class="panel-tool-search__filter"
                variant="icon"
                icon="Filters"
                size="md"
                aria-label={this.filterAriaLabel}
                haspopup="menu"
                controls={this.filterControls}
                expanded={this.filterExpanded}
                isActive={this.filterActive}
                isInactive={this.isInactive}
                activeFill={false}
                hasBorder={false}
                onDsChange={(event: CustomEvent<boolean>) => {
                  event.stopPropagation();
                }}
                onDsClick={(event: CustomEvent<MouseEvent>) => {
                  event.stopPropagation();
                  this.dsFilterToggle.emit(event.detail);
                }}
              />
            </div>
          ) : null}
        </div>
      </Host>
    );
  }
}
