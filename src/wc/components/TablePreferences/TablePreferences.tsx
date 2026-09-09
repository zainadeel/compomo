import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Prop,
  State,
} from '@stencil/core';
import type {
  FilterMenuFilter,
  FilterMenuValues,
  FilterMenuMatchModes,
  FilterMenuChangeDetail,
  FilterMenuMatchModeChangeDetail,
} from '../FilterMenu/FilterMenu';
import type {
  TableColumn,
  TableSortState,
  TableSortChangeDetail,
  TableGroupingState,
  TableColumnsConfigChangeDetail,
} from '../Table/table-types';
import type { TableGroupOption } from '../TableGroup/TableGroup';
import {
  tableSortMenuSections,
  nextTableSortStateFromMenuItem,
} from '../TableSort/table-sort-menu';
import {
  tableColumnCustomizerMenuItems,
  toggleTableColumnHidden,
  resolveTableColumnOrder,
} from '../Table/table-column-customizer';
import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import { AnchoredOverlayInteractionController } from '../../utils/anchored-overlay-interaction-controller';
import { resolveCssLengthPx } from '../../utils/resolve-css-length-px';
import { TOKEN_DEFAULTS } from '../../utils/token-defaults';

type PreferencesTab = 'filters' | 'sort' | 'group' | 'customize';
let preferencesSequence = 0;

@Component({ tag: 'ds-table-preferences', styleUrl: 'TablePreferences.css', scoped: true })
export class TablePreferences {
  @Element() el!: HTMLElement;
  /** Show the trigger border. */
  @Prop() hasBorder: boolean = true;
  @Prop() filters: FilterMenuFilter[] = [];
  @Prop() values: FilterMenuValues = {};
  @Prop() matchModes: FilterMenuMatchModes = {};
  @Prop() activeFilterId: string | undefined;
  @Prop() columns: TableColumn[] = [];
  @Prop() sort: TableSortState | null = null;
  @Prop() groupingOptions: TableGroupOption[] = [];
  @Prop() grouping: TableGroupingState | null = null;
  @Prop() hiddenColumnIds: string[] = [];
  @Prop() columnOrder: string[] = [];
  @Prop() label = 'Table preferences';
  @Event() dsFilterChange!: EventEmitter<FilterMenuChangeDetail>;
  @Event() dsFilterMatchModeChange!: EventEmitter<FilterMenuMatchModeChangeDetail>;
  @Event() dsActiveFilterChange!: EventEmitter<string>;
  @Event() dsFiltersClear!: EventEmitter<void>;
  @Event() dsSortChange!: EventEmitter<TableSortChangeDetail>;
  @Event() dsGroupChange!: EventEmitter<TableGroupingState>;
  @Event() dsGroupClear!: EventEmitter<void>;
  @Event() dsColumnsConfigChange!: EventEmitter<TableColumnsConfigChangeDetail>;
  @State() private open = false;
  @State() private tab: PreferencesTab = 'filters';
  @State() private pos = { x: 0, y: 0 };
  @State() private ready = false;
  private readonly popupId = `ds-table-preferences-${++preferencesSequence}`;
  private trigger?: HTMLDsButtonUnfilledElement;
  private popup?: HTMLElement;
  private readonly position = new AnchoredPositionController({
    getAnchor: () => this.trigger ?? null,
    getPopup: () => this.popup ?? null,
    getOwnerDocument: () => this.el.ownerDocument,
    measure: (anchor, popup) => ({
      anchorRect: anchor.getBoundingClientRect(),
      popupWidth: popup.offsetWidth,
      popupHeight: popup.offsetHeight,
      side: 'bottom',
      align: 'end',
      sideOffsetPx: resolveCssLengthPx(TOKEN_DEFAULTS.space050, 4),
      alignOffsetPx: 0,
      viewportPadPx: resolveCssLengthPx(TOKEN_DEFAULTS.space100, 8),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }),
    apply: ({ x, y }) => {
      this.pos = { x, y };
    },
    onReady: () => {
      this.ready = true;
    },
    topLayer: true,
    observeResize: true,
    observeAnchorMotion: true,
    liveUpdate: 'double-frame',
  });
  private readonly interaction = new AnchoredOverlayInteractionController({
    getAnchor: () => this.trigger ?? null,
    getPopup: () => this.popup ?? null,
    getOwnerDocument: () => this.el.ownerDocument,
    onOutsideActivation: () => this.close(),
  });
  disconnectedCallback() {
    this.position.unobserve();
    this.interaction.disconnect();
  }
  private close() {
    this.position.unobserve();
    this.interaction.disconnect();
    if (this.popup?.matches(':popover-open')) this.popup.hidePopover();
    this.open = false;
    void this.trigger?.setFocus();
  }
  private toggle() {
    if (this.open) {
      this.close();
      return;
    }
    this.open = true;
    this.ready = false;
    this.position.observe();
    this.interaction.connect();
    this.position.schedule(async () => {
      await this.popup?.querySelector('ds-tab-group')?.componentOnReady?.();
      requestAnimationFrame(() => {
        if (this.open)
          this.popup?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
      });
    });
  }
  @Listen('keydown')
  onKeydown(event: KeyboardEvent) {
    if (!this.open || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    } else if (event.key === 'Tab' && this.interaction.tabLeavesPopup(event)) {
      event.preventDefault();
      this.close();
      this.interaction.moveFocusAfterTab(event.shiftKey);
    }
  }
  private forward<T>(event: CustomEvent<T>, emitter: EventEmitter<T>) {
    event.stopPropagation();
    emitter.emit(event.detail);
  }
  render() {
    const tabs = ['filters', 'sort', 'group', 'customize'].map(id => ({
      id,
      label: id === 'filters' ? 'Filters' : id[0].toUpperCase() + id.slice(1),
      panelId: `${this.popupId}-${id}`,
    }));
    return (
      <Host>
        <ds-tooltip label={this.label} side="bottom" size="sm">
          <ds-button-unfilled
            hasBorder={this.hasBorder}
            ref={el => {
              this.trigger = el;
            }}
            variant="icon"
            icon="Preferences"
            size="md"
            ariaLabel={this.label}
            haspopup="dialog"
            expanded={this.open}
            surfaceOpen={this.open}
            controls={this.popupId}
            onDsClick={() => this.toggle()}
          />
        </ds-tooltip>
        {this.open && (
          <div
            ref={el => {
              this.popup = el;
            }}
            id={this.popupId}
            popover="manual"
            role="dialog"
            aria-label={this.label}
            class="table-preferences"
            style={{
              left: `${this.pos.x}px`,
              top: `${this.pos.y}px`,
              visibility: this.ready ? 'visible' : 'hidden',
            }}
          >
            <div class="table-preferences__tabs">
              <ds-tab-group
                ariaLabel="Table preference sections"
                size="md"
                presentation="tabs"
                width="hug"
                tabs={tabs}
                value={this.tab}
                onDsChange={event => {
                  event.stopPropagation();
                  this.tab = event.detail as PreferencesTab;
                }}
              />
            </div>
            <div
              class="table-preferences__body"
              id={`${this.popupId}-${this.tab}`}
              role="tabpanel"
              aria-label={tabs.find(tab => tab.id === this.tab)?.label}
            >
              {this.tab === 'filters' && (
                <ds-filter-menu
                  embedded
                  filters={this.filters}
                  values={this.values}
                  matchModes={this.matchModes}
                  activeFilterId={this.activeFilterId}
                  footerLayout="categories-clear"
                  onDsChange={e => this.forward(e, this.dsFilterChange)}
                  onDsMatchModeChange={e => this.forward(e, this.dsFilterMatchModeChange)}
                  onDsActiveFilterChange={e => this.forward(e, this.dsActiveFilterChange)}
                  onDsClear={e => this.forward(e, this.dsFiltersClear)}
                />
              )}
              {this.tab === 'sort' && (
                <ds-menu
                  embedded
                  menuLabel="Sort table"
                  sections={tableSortMenuSections(this.columns, this.sort)}
                  onDsSelect={e => {
                    e.stopPropagation();
                    this.dsSortChange.emit({
                      sort: nextTableSortStateFromMenuItem(this.columns, this.sort, e.detail),
                    });
                  }}
                />
              )}
              {this.tab === 'group' && (
                <ds-table-group
                  embedded
                  options={this.groupingOptions}
                  grouping={this.grouping}
                  onDsGroupChange={e => this.forward(e, this.dsGroupChange)}
                  onDsClear={e => this.forward(e, this.dsGroupClear)}
                />
              )}
              {this.tab === 'customize' && (
                <ds-menu
                  embedded
                  menuLabel="Customize table"
                  items={tableColumnCustomizerMenuItems(
                    this.columns,
                    this.hiddenColumnIds,
                    this.columnOrder
                  )}
                  onDsSelect={e => {
                    e.stopPropagation();
                    if (!e.detail.value || e.detail.isInactive) return;
                    this.dsColumnsConfigChange.emit({
                      hiddenColumnIds: toggleTableColumnHidden(
                        this.columns,
                        this.hiddenColumnIds,
                        e.detail.value
                      ),
                      columnOrder: resolveTableColumnOrder(this.columns, this.columnOrder),
                    });
                  }}
                  onDsReorder={e => {
                    e.stopPropagation();
                    this.dsColumnsConfigChange.emit({
                      hiddenColumnIds: this.hiddenColumnIds,
                      columnOrder: e.detail.items
                        .filter(item => item.reorderable)
                        .map(item => item.value!)
                        .filter(Boolean),
                    });
                  }}
                />
              )}
            </div>
          </div>
        )}
      </Host>
    );
  }
}
