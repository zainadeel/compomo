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
  Watch,
} from '@stencil/core';
import {
  choicePopupMinWidth,
  resolveChoicePopupAlignOffset,
  resolveCssLengthPx,
  TOKEN_DEFAULTS,
} from '../../utils';
import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import { AnchoredOverlayInteractionController } from '../../utils/anchored-overlay-interaction-controller';
import { resolveAnchoredOverlayBoundaryRect } from '../../utils/anchored-overlay-boundary';
import {
  availableTableSearchFields,
  nextTableSearchActiveIndex,
  selectedTableSearchFields,
  tableSearchFields,
} from './table-search-model';
import type { TableColumn } from '../Table/table-types';
import type { TableSearchField, TableSearchFieldsChangeDetail } from './table-search-types';

let tableSearchSequence = 0;

@Component({
  tag: 'ds-table-search',
  styleUrl: 'TableSearch.css',
  scoped: true,
})
export class TableSearch {
  @Element() private el!: HTMLElement;

  /** Controlled free-text query. */
  @Prop() value: string = '';
  /** Table column catalog used to derive searchable data points and their complete labels. */
  @Prop() columns: TableColumn[] = [];
  /** Controlled ordered field scopes rendered as Tags. */
  @Prop() selectedFieldIds: string[] = [];
  @Prop() placeholder: string = 'Search';
  @Prop({ attribute: 'aria-label' }) ariaLabel: string = 'Search table';
  @Prop() clearLabel: string = 'Clear search';
  @Prop() fieldMenuLabel: string = 'Choose search fields';
  @Prop() isInactive: boolean = false;

  @Event({ bubbles: false }) dsChange!: EventEmitter<string>;
  @Event({ bubbles: false }) dsFieldsChange!: EventEmitter<TableSearchFieldsChangeDetail>;
  @Event({ bubbles: false }) dsClear!: EventEmitter<void>;

  @State() private menuOpen = false;
  @State() private activeIndex = 0;
  @State() private focusRingVisible = false;
  @State() private position = { x: 0, y: 0 };
  @State() private positionReady = false;
  @State() private availableHeight: number | null = null;
  @State() private announcement = '';

  private readonly componentId = `ds-table-search-${++tableSearchSequence}`;
  private readonly inputId = `${this.componentId}-input`;
  private readonly listboxId = `${this.componentId}-listbox`;
  private readonly descriptionId = `${this.componentId}-description`;
  private inputEl: HTMLInputElement | null = null;
  private controlEl: HTMLElement | null = null;
  private popupEl: HTMLElement | null = null;

  private readonly positionController = new AnchoredPositionController({
    getAnchor: () => this.controlEl,
    getPopup: () => this.popupEl,
    getOwnerDocument: () => this.el.ownerDocument,
    measure: (anchor, popup) => {
      if (!this.menuOpen || !popup.isConnected) return null;
      const inset = resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
      popup.style.minWidth = `max(var(--ds-choice-popup-min-inline-size, ${TOKEN_DEFAULTS.menuWidthXs}), ${choicePopupMinWidth(anchor.offsetWidth, inset)}px)`;
      const anchorRect = anchor.getBoundingClientRect();
      return {
        anchorRect,
        popupWidth: popup.offsetWidth,
        popupHeight: popup.offsetHeight,
        side: 'bottom',
        align: 'start',
        sideOffsetPx: inset,
        alignOffsetPx: resolveChoicePopupAlignOffset({
          align: 'start',
          alignOffsetPx: 0,
          sectionInsetPx: inset,
        }),
        viewportPadPx: inset,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        collisionRect: resolveAnchoredOverlayBoundaryRect(anchor),
      };
    },
    apply: ({ x, y, availableHeight }) => {
      this.position = { x, y };
      this.availableHeight = availableHeight;
    },
    onReady: () => {
      this.positionReady = true;
    },
    topLayer: true,
    liveUpdate: 'frame',
    observeResize: true,
    observeAnchorMotion: true,
  });

  private readonly interactionController = new AnchoredOverlayInteractionController({
    getAnchor: () => this.controlEl,
    getPopup: () => this.popupEl,
    getOwnerDocument: () => this.el.ownerDocument,
    onOutsideActivation: () => this.closeMenu(),
  });

  disconnectedCallback(): void {
    this.closeMenu();
  }

  @Watch('columns')
  @Watch('selectedFieldIds')
  syncAvailableFields(): void {
    const count = this.availableFields.length;
    if (count === 0) {
      this.closeMenu();
      return;
    }
    if (this.activeIndex >= count) this.activeIndex = count - 1;
  }

  @Watch('isInactive')
  syncInactive(isInactive: boolean): void {
    if (isInactive) this.closeMenu();
  }

  @Method()
  async setFocus(): Promise<void> {
    this.inputEl?.focus();
  }

  private get selectedFields(): TableSearchField[] {
    return selectedTableSearchFields(this.searchFields, this.selectedFieldIds);
  }

  private get availableFields(): TableSearchField[] {
    return availableTableSearchFields(this.searchFields, this.selectedFieldIds);
  }

  private get searchFields(): TableSearchField[] {
    return tableSearchFields(this.columns);
  }

  private get activeOptionId(): string | undefined {
    return this.menuOpen && this.activeIndex >= 0
      ? `${this.componentId}-option-${this.activeIndex}`
      : undefined;
  }

  private openMenu(fromKeyboard: boolean): void {
    if (this.isInactive || this.menuOpen || this.availableFields.length === 0) return;
    this.activeIndex = 0;
    this.focusRingVisible = fromKeyboard;
    this.positionReady = false;
    this.menuOpen = true;
    requestAnimationFrame(() => {
      if (!this.menuOpen) return;
      this.interactionController.connect();
      this.positionController.observe();
      this.positionController.schedule();
    });
  }

  private closeMenu(): void {
    if (!this.menuOpen && !this.popupEl) return;
    if (this.popupEl?.matches(':popover-open')) this.popupEl.hidePopover();
    this.positionController.unobserve();
    this.interactionController.disconnect();
    this.popupEl = null;
    this.positionReady = false;
    this.availableHeight = null;
    this.menuOpen = false;
  }

  private selectField(field: TableSearchField): void {
    this.dsFieldsChange.emit({ selectedFieldIds: [...this.selectedFieldIds, field.id] });
    this.announcement = `${field.label} search field added.`;
    this.closeMenu();
    requestAnimationFrame(() => this.inputEl?.focus({ preventScroll: true }));
  }

  private removeLastField(): void {
    const selected = this.selectedFields;
    const removed = selected[selected.length - 1];
    if (!removed) return;
    this.dsFieldsChange.emit({
      selectedFieldIds: this.selectedFieldIds.filter(fieldId => fieldId !== removed.id),
    });
    this.announcement = `${removed.label} search field removed.`;
  }

  private clearSearch(): void {
    if (this.value) this.dsChange.emit('');
    if (this.selectedFieldIds.length) this.dsFieldsChange.emit({ selectedFieldIds: [] });
    this.dsClear.emit();
    this.announcement = 'Search cleared.';
    this.closeMenu();
    requestAnimationFrame(() => this.inputEl?.focus({ preventScroll: true }));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === '/' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.openMenu(true);
      return;
    }

    if (event.key === 'Backspace' && this.value.length === 0 && !this.menuOpen) {
      if (this.selectedFields.length) {
        event.preventDefault();
        this.removeLastField();
      }
      return;
    }

    if (!this.menuOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusRingVisible = true;
      this.activeIndex = nextTableSearchActiveIndex(
        this.activeIndex,
        this.availableFields.length,
        event.key === 'ArrowDown' ? 1 : -1
      );
      this.el
        .querySelector<HTMLElement>(`#${CSS.escape(this.activeOptionId ?? '')}`)
        ?.scrollIntoView({ block: 'nearest' });
      return;
    }

    if (event.key === 'Enter') {
      const field = this.availableFields[this.activeIndex];
      if (!field) return;
      event.preventDefault();
      this.selectField(field);
      return;
    }

    if (event.key === 'Tab') this.closeMenu();
  }

  render() {
    const selected = this.selectedFields;
    const available = this.availableFields;
    const hasValue = this.value.length > 0 || selected.length > 0;
    const description = selected.length
      ? `Search limited to ${selected.map(field => field.label).join(' or ')}.`
      : 'Search includes every available table field. Type slash to choose fields.';
    const popupStyle: Record<string, string> = {
      position: 'fixed',
      left: '0',
      top: '0',
      transform: `translate(${Math.round(this.position.x)}px, ${Math.round(this.position.y)}px)`,
      zIndex: 'var(--dimension-z-index-floating)',
      visibility: this.positionReady ? 'visible' : 'hidden',
    };
    if (this.availableHeight !== null) {
      popupStyle['max-height'] = `${Math.floor(this.availableHeight)}px`;
    }

    return (
      <Host
        class={{
          'table-search-host': true,
          'ds-control--md': true,
          'ds-control-inactive': this.isInactive,
        }}
        data-filled={hasValue ? '' : undefined}
        data-expanded={this.menuOpen ? '' : undefined}
      >
        <div
          ref={element => {
            this.controlEl = element ?? null;
          }}
          class="table-search__control ds-control-frame ds-control--md ds-interaction-fill"
        >
          <span
            class="table-search__icon ds-control-icon-box ds-interaction-fill__content"
            aria-hidden="true"
          >
            <ds-icon name="MagnifyingGlass" size="md" color="inherit" />
          </span>
          <div class="table-search__editor ds-interaction-fill__content">
            {selected.map(field => (
              <ds-tag
                class="table-search__tag"
                key={field.id}
                label={field.label}
                size="md"
                intent="neutral"
                contrast="faint"
                isInset
                insetDepth="double"
              />
            ))}
            <input
              ref={element => {
                this.inputEl = element ?? null;
              }}
              id={this.inputId}
              class="table-search__input ds-text--body-medium ds-text--regular"
              type="search"
              role="combobox"
              value={this.value}
              placeholder={this.placeholder}
              disabled={this.isInactive}
              aria-label={this.ariaLabel}
              aria-describedby={this.descriptionId}
              aria-haspopup="listbox"
              aria-expanded={String(this.menuOpen)}
              aria-controls={this.menuOpen ? this.listboxId : undefined}
              aria-activedescendant={this.activeOptionId}
              aria-keyshortcuts="/"
              autoComplete="off"
              onInput={event => this.dsChange.emit((event.target as HTMLInputElement).value)}
              onKeyDown={event => this.handleKeyDown(event)}
            />
          </div>
          {available.length > 0 && (
            <button
              type="button"
              class="table-search__slash ds-control--md ds-focus-ring-inset ds-interaction-fill"
              tabIndex={-1}
              aria-label={this.fieldMenuLabel}
              onMouseDown={event => event.preventDefault()}
              onClick={() => {
                this.inputEl?.focus({ preventScroll: true });
                this.openMenu(false);
              }}
            >
              <span class="ds-text--body-medium ds-text--regular ds-interaction-fill__content">
                /
              </span>
            </button>
          )}
          {hasValue && !this.isInactive && (
            <ds-button-unfilled
              class="table-search__clear"
              variant="icon"
              size="sm"
              icon="CrossCircle"
              hasBorder={false}
              rounded
              ariaLabel={this.clearLabel}
              onDsClick={() => this.clearSearch()}
            />
          )}
        </div>
        <span id={this.descriptionId} class="ds-visually-hidden">
          {description}
        </span>
        <span class="ds-visually-hidden" aria-live="polite">
          {this.announcement}
        </span>
        {this.menuOpen && (
          <div
            popover="manual"
            ref={element => {
              this.popupEl = element ?? null;
            }}
            class="table-search__popup ds-choice-popup"
            style={popupStyle}
          >
            <div
              id={this.listboxId}
              class="table-search__list ds-choice-list"
              role="listbox"
              aria-label={this.fieldMenuLabel}
            >
              {available.map((field, index) => {
                const active = index === this.activeIndex;
                return (
                  /* eslint-disable-next-line local/prefer-direct-ds-text -- The option owns listbox semantics and pointer interaction while ds-text remains its typography child. */
                  <div
                    id={`${this.componentId}-option-${index}`}
                    key={field.id}
                    class={{
                      'table-search__option': true,
                      'ds-choice-item': true,
                      'ds-control-frame': true,
                      'ds-control--md': true,
                      'ds-focus-ring-inset': true,
                      'ds-focus-ring--visible': active && this.focusRingVisible,
                      'ds-interaction-fill': true,
                      'ds-interaction-fill--selected': active,
                    }}
                    role="option"
                    aria-selected={String(active)}
                    onMouseDown={event => event.preventDefault()}
                    onMouseMove={() => {
                      this.focusRingVisible = false;
                      this.activeIndex = index;
                    }}
                    onClick={() => this.selectField(field)}
                  >
                    <ds-text
                      class="ds-choice-item__label ds-control-label-box ds-interaction-fill__content"
                      as="span"
                      variant="text-body-medium"
                      color={active ? 'primary' : 'secondary'}
                    >
                      {field.label}
                    </ds-text>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Host>
    );
  }
}
