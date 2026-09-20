import type { DataField } from '../../utils/data-field';
import type { MenuItemData, MenuSection } from '../Menu/menu-types';
import { resolveAnchoredOverlayBoundaryRect } from '../../utils/anchored-overlay-boundary';
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
  DataSortState,
  DataSortChangeDetail,
  DataGroupingState,
  DataFieldsConfigChangeDetail,
} from '../Table/table-types';
import type { DataGroupOption } from '../DataGroup/DataGroup';
import { dataSortMenuSections, nextDataSortStateFromMenuItem } from '../DataSort/data-sort-menu';
import {
  tableColumnCustomizerLabel,
  tableColumnCustomizerMenuItems,
  tableDataColumns,
  toggleTableColumnHidden,
  resolveTableColumnOrder,
} from '../Table/table-column-customizer';
import {
  listCustomizerMenuItems,
  resolveListOrder,
  toggleListHidden,
  type ListCustomizerOptions,
} from '../../utils/list-customizer';
import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import { ConnectionTasks } from '../../utils/connection-tasks';
import { AnchoredOverlayInteractionController } from '../../utils/anchored-overlay-interaction-controller';
import { resolveCssLengthPx } from '../../utils/resolve-css-length-px';
import { TOKEN_DEFAULTS } from '../../utils/token-defaults';

/** Toggle-only catalog: every entry may hide and no row carries a drag handle. */
const TOGGLE_ONLY_CATALOG: ListCustomizerOptions = { minVisible: 0, reorderable: false };

export type PreferencesTab = 'filters' | 'sort' | 'group' | 'customize';
let preferencesSequence = 0;

@Component({ tag: 'ds-data-preferences', styleUrl: 'DataPreferences.css', scoped: true })
export class DataPreferences {
  @Element() el!: HTMLElement;
  /** Show the trigger border. */
  @Prop() hasBorder: boolean = true;
  @Prop() filters: FilterMenuFilter[] = [];
  @Prop() values: FilterMenuValues = {};
  @Prop() matchModes: FilterMenuMatchModes = {};
  @Prop() activeFilterId: string | undefined;
  @Prop() fields: DataField[] = [];
  /** Additional toggle options in the column customizer. */
  @Prop() customizeOptions: MenuItemData[] = [];
  @Prop() customizeSections: MenuSection[] = [];
  /** Accessible name for the Customize menu. */
  @Prop() customizeLabel: string = 'Customize table';
  /**
   * Section header above the catalog rows. Defaults to Columns when
   * customizeOptions supply a second section, matching the table.
   */
  @Prop() catalogHeader?: string;
  /**
   * Drag-reorder the catalog rows and keep the last visible entry locked, as a
   * table requires. Pass false for a catalog that only shows and hides, where
   * every entry may be hidden and rows carry no drag handle.
   */
  @Prop() catalogReorderable: boolean = true;
  @Event() dsCustomizeOptionChange!: EventEmitter<string>;
  /** Optional sort fields when they differ from customizable content. */
  @Prop() sortColumns?: TableColumn[];
  @Prop() sort: DataSortState | null = null;
  @Prop() groupingOptions: DataGroupOption[] = [];
  @Prop() grouping: DataGroupingState | null = null;
  @Prop() hiddenFieldIds: string[] = [];
  @Prop() fieldOrder: string[] = [];
  /** Render shared content without its popup or trigger. */
  @Prop() embedded = false;
  @Prop() activeTab: PreferencesTab = 'filters';
  @Event() dsPreferencesTabChange!: EventEmitter<PreferencesTab>;
  @Prop() label = 'Configure view';
  @Event() dsFilterChange!: EventEmitter<FilterMenuChangeDetail>;
  @Event() dsFilterMatchModeChange!: EventEmitter<FilterMenuMatchModeChangeDetail>;
  @Event() dsActiveFilterChange!: EventEmitter<string>;
  @Event() dsFiltersClear!: EventEmitter<void>;
  @Event() dsSortChange!: EventEmitter<DataSortChangeDetail>;
  @Event() dsGroupChange!: EventEmitter<DataGroupingState>;
  @Event() dsGroupClear!: EventEmitter<void>;
  @Event() dsFieldsConfigChange!: EventEmitter<DataFieldsConfigChangeDetail>;

  /** Catalog rows as domain-neutral items, so a non-table catalog needs no column shape. */
  private catalogItems(): { id: string; label: string }[] {
    return tableDataColumns(this.fields).map(column => ({
      id: column.id,
      label: tableColumnCustomizerLabel(column),
    }));
  }
  @State() private open = false;
  @State() private tab: PreferencesTab = 'filters';
  @State() private pos = { x: 0, y: 0 };
  @State() private ready = false;
  private readonly popupId = `ds-data-preferences-${++preferencesSequence}`;
  private trigger?: HTMLDsButtonUnfilledElement;
  private popup?: HTMLElement;
  private readonly tasks = new ConnectionTasks(() => this.el.isConnected);
  private readonly position = new AnchoredPositionController({
    getAnchor: () => this.trigger ?? null,
    getPopup: () => this.popup ?? null,
    getOwnerDocument: () => this.el.ownerDocument,
    measure: (anchor, popup) => {
      const collisionRect = resolveAnchoredOverlayBoundaryRect(anchor);
      const pad = resolveCssLengthPx(TOKEN_DEFAULTS.space100, 8);
      popup.style.maxWidth = `${Math.max(0, Math.min(window.innerWidth, collisionRect?.width ?? window.innerWidth) - pad * 2)}px`;
      popup.style.maxHeight = `${Math.max(0, Math.min(window.innerHeight, collisionRect?.height ?? window.innerHeight) - pad * 2)}px`;
      return {
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
        collisionRect,
      };
    },
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
    this.close(false);
  }
  private close(restoreFocus = true) {
    this.tasks.cancel();
    this.position.unobserve();
    this.interaction.disconnect();
    if (this.popup?.matches(':popover-open')) this.popup.hidePopover();
    this.open = false;
    this.ready = false;
    if (restoreFocus) void this.trigger?.setFocus();
  }
  private toggle() {
    if (!this.el.isConnected) return;
    if (this.open) {
      this.close();
      return;
    }
    this.open = true;
    this.ready = false;
    this.position.observe();
    this.interaction.connect();
    this.position.schedule(async () => {
      const focus = this.tasks.guard(() => {
        this.tasks.frame(() => {
          if (this.open)
            this.popup?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
        });
      });
      await this.popup?.querySelector('ds-tab-group')?.componentOnReady?.();
      focus();
    });
  }
  @Listen('keydown')
  onKeydown(event: KeyboardEvent) {
    if (this.embedded || !this.open || event.defaultPrevented) return;
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
    const currentTab = this.embedded ? this.activeTab : this.tab;
    const tabs = ['filters', 'sort', 'group', 'customize'].map(id => ({
      id,
      label: id === 'filters' ? 'Filters' : id[0].toUpperCase() + id.slice(1),
      panelId: `${this.popupId}-${id}`,
    }));
    return (
      <Host>
        {!this.embedded && (
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
        )}
        {(this.open || this.embedded) && (
          <div
            ref={el => {
              this.popup = el;
            }}
            id={this.popupId}
            popover={this.embedded ? undefined : 'manual'}
            role={this.embedded ? undefined : 'dialog'}
            aria-label={this.label}
            class={{
              'data-preferences': !this.embedded,
              'data-preferences-panel': this.embedded,
            }}
            style={
              this.embedded
                ? undefined
                : {
                    left: `${this.pos.x}px`,
                    top: `${this.pos.y}px`,
                    visibility: this.ready ? 'visible' : 'hidden',
                  }
            }
          >
            <div class="data-preferences__tabs">
              <ds-tab-group
                ariaLabel="Table preference sections"
                size="md"
                presentation={this.embedded ? 'segmented' : 'tabs'}
                width={this.embedded ? 'fill' : 'hug'}
                tabs={tabs}
                value={currentTab}
                onDsChange={event => {
                  event.stopPropagation();
                  this.tab = event.detail as PreferencesTab;
                  this.dsPreferencesTabChange.emit(this.tab);
                }}
              />
            </div>
            <div
              class="data-preferences__body"
              id={`${this.popupId}-${currentTab}`}
              role="tabpanel"
              aria-label={tabs.find(tab => tab.id === currentTab)?.label}
            >
              <div hidden={currentTab !== 'filters'}>
                <ds-filter-menu
                  embedded
                  vertical={this.embedded}
                  applyRequired={!this.embedded}
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
              </div>
              {currentTab === 'sort' && (
                <ds-menu
                  embedded
                  menuLabel="Sort table"
                  sections={dataSortMenuSections(this.sortColumns ?? this.fields, this.sort)}
                  onDsSelect={e => {
                    e.stopPropagation();
                    this.dsSortChange.emit({
                      sort: nextDataSortStateFromMenuItem(
                        this.sortColumns ?? this.fields,
                        this.sort,
                        e.detail
                      ),
                    });
                  }}
                />
              )}
              {currentTab === 'group' && (
                <ds-data-group
                  embedded
                  vertical={this.embedded}
                  options={this.groupingOptions}
                  grouping={this.grouping}
                  onDsGroupChange={e => this.forward(e, this.dsGroupChange)}
                  onDsClear={e => this.forward(e, this.dsGroupClear)}
                />
              )}
              {currentTab === 'customize' && (
                <ds-menu
                  embedded
                  menuLabel={this.customizeLabel}
                  sections={[
                    ...(this.fields.length
                      ? [
                          {
                            header:
                              this.catalogHeader ??
                              (this.customizeOptions.length ? 'Columns' : undefined),
                            items: this.catalogReorderable
                              ? tableColumnCustomizerMenuItems(
                                  this.fields,
                                  this.hiddenFieldIds,
                                  this.fieldOrder
                                )
                              : listCustomizerMenuItems(
                                  this.catalogItems(),
                                  this.hiddenFieldIds,
                                  this.fieldOrder,
                                  TOGGLE_ONLY_CATALOG
                                ),
                          },
                        ]
                      : []),
                    ...this.customizeSections,
                    ...(this.customizeOptions.length
                      ? [{ header: 'Options', items: this.customizeOptions }]
                      : []),
                  ]}
                  onDsSelect={e => {
                    e.stopPropagation();
                    if (!e.detail.value || e.detail.isInactive) return;
                    if (
                      [
                        ...this.customizeOptions,
                        ...this.customizeSections.flatMap(section =>
                          'items' in section ? section.items : []
                        ),
                      ].some(option => option.value === e.detail.value)
                    ) {
                      this.dsCustomizeOptionChange.emit(e.detail.value);
                      return;
                    }
                    if (!this.catalogReorderable) {
                      const ids = this.catalogItems().map(item => item.id);
                      this.dsFieldsConfigChange.emit({
                        hiddenFieldIds: toggleListHidden(
                          ids,
                          this.hiddenFieldIds,
                          e.detail.value,
                          TOGGLE_ONLY_CATALOG
                        ),
                        fieldOrder: resolveListOrder(ids, this.fieldOrder),
                      });
                      return;
                    }
                    this.dsFieldsConfigChange.emit({
                      hiddenFieldIds: toggleTableColumnHidden(
                        this.fields,
                        this.hiddenFieldIds,
                        e.detail.value
                      ),
                      fieldOrder: resolveTableColumnOrder(this.fields, this.fieldOrder),
                    });
                  }}
                  onDsReorder={e => {
                    e.stopPropagation();
                    if (!this.catalogReorderable) return;
                    this.dsFieldsConfigChange.emit({
                      hiddenFieldIds: this.hiddenFieldIds,
                      fieldOrder: e.detail.items
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
