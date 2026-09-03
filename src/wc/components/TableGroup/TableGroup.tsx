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
  Watch,
} from '@stencil/core';
import {
  resolveChoicePopupAlignOffset,
  resolveCssLengthPx,
  resolveMotionTimeMs,
  TOKEN_CSS_LENGTHS,
  TOKEN_DEFAULTS,
} from '../../utils';
import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import { AnchoredOverlayInteractionController } from '../../utils/anchored-overlay-interaction-controller';
import { resolveAnchoredOverlayBoundaryRect } from '../../utils/anchored-overlay-boundary';
import { ChoiceListSection, ChoiceOptionRow } from '../../utils/choice-list-parts';
import type { TableGroupingState, TableSortDirection } from '../Table/table-types';

export interface TableGroupOrderOption {
  label: string;
  direction: TableSortDirection;
  /** Optional application-owned data point used to order the group sections. */
  orderBy?: string;
}

export interface TableGroupOption {
  label: string;
  value: string;
  description?: string;
  isInactive?: boolean;
  /** Product-owned order choices for this grouping data point. */
  orderOptions?: TableGroupOrderOption[];
}

const DEFAULT_ORDER_OPTIONS: TableGroupOrderOption[] = [
  { label: 'Ascending', direction: 'asc' },
  { label: 'Descending', direction: 'desc' },
];

let tableGroupSeq = 0;

@Component({
  tag: 'ds-table-group',
  styleUrl: 'TableGroup.css',
  scoped: true,
})
export class TableGroup {
  @Element() private el!: HTMLElement;

  /** Product-owned data points that may group the table. */
  @Prop() options: TableGroupOption[] = [];
  /** Controlled grouping field and the order of its group sections. */
  @Prop() grouping: TableGroupingState | null = null;
  /** Accessible name for the trigger and non-modal dialog. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Controlled popup visibility. */
  @Prop({ mutable: true }) open = false;
  /** Empty message kept in the order pane until a grouping data point is selected. */
  @Prop() emptyMessage = 'Select a group to choose its order.';
  /** Clear action label. */
  @Prop() clearLabel = 'Clear';

  /** Requests replacement of the complete controlled grouping state. */
  @Event() dsGroupChange!: EventEmitter<TableGroupingState>;
  /** Requests removal of the controlled grouping state. */
  @Event() dsClear!: EventEmitter<void>;
  /** Reports controlled popup visibility changes. */
  @Event() dsOpenChange!: EventEmitter<boolean>;

  @State() private shouldRender = false;
  @State() private closing = false;
  @State() private positionReady = false;
  @State() private pos = { x: 0, y: 0 };
  @State() private focusRingVisible = false;

  private readonly componentId = `ds-table-group-${++tableGroupSeq}`;
  private readonly triggerId = `${this.componentId}-trigger`;
  private readonly popupId = `${this.componentId}-popup`;
  private triggerElement: HTMLElement | null = null;
  private pendingInitialFocusVisible = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly position = new AnchoredPositionController({
    getAnchor: () => this.triggerElement,
    getPopup: () => this.el.querySelector<HTMLElement>('.table-group-popup'),
    getOwnerDocument: () => this.el.ownerDocument,
    measure: (anchor, popup) => {
      if (!this.open) return null;
      const sectionInsetPx = resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
      return {
        anchorRect: anchor.getBoundingClientRect(),
        popupWidth: popup.offsetWidth || this.popupFallbackWidth,
        popupHeight: popup.offsetHeight || this.popupFallbackHeight,
        side: 'bottom',
        align: 'end',
        sideOffsetPx: resolveCssLengthPx(TOKEN_CSS_LENGTHS.space050, TOKEN_DEFAULTS.space050),
        alignOffsetPx: resolveChoicePopupAlignOffset({
          align: 'end',
          alignOffsetPx: 0,
          sectionInsetPx,
        }),
        viewportPadPx: resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        collisionRect: resolveAnchoredOverlayBoundaryRect(anchor),
      };
    },
    apply: ({ x, y }) => {
      this.pos = { x, y };
    },
    onReady: () => {
      this.positionReady = true;
    },
    liveUpdate: 'double-frame',
    observeResize: true,
    topLayer: true,
  });

  private readonly interaction = new AnchoredOverlayInteractionController({
    getAnchor: () => this.triggerElement,
    getPopup: () => this.el.querySelector<HTMLElement>('.table-group-popup'),
    getOwnerDocument: () => this.el.ownerDocument,
    onOutsideActivation: () => this.close(),
  });

  componentDidLoad() {
    if (this.open) this.onOpenChange(true);
  }

  disconnectedCallback() {
    this.position.unobserve();
    this.interaction.disconnect();
    if (this.closeTimer) clearTimeout(this.closeTimer);
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.teardown();
      this.shouldRender = true;
      this.closing = false;
      this.positionReady = false;
      this.focusRingVisible = this.pendingInitialFocusVisible;
      this.interaction.connect();
      this.position.observe();
      this.position.schedule(() => this.focusInitialDataPoint());
      return;
    }
    if (!this.shouldRender) return;
    this.position.cancel();
    this.closing = true;
    this.interaction.disconnect();
    this.position.unobserve();
    const duration = resolveMotionTimeMs(
      TOKEN_DEFAULTS.motionShort2,
      TOKEN_DEFAULTS.animationDurationShort3
    );
    if (duration <= 0) this.finishClose();
    else this.closeTimer = setTimeout(() => this.finishClose(), duration);
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (!this.shouldRender || this.closing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab' || !this.interaction.tabLeavesPopup(event)) return;
    event.preventDefault();
    this.close(false);
    this.interaction.moveFocusAfterTab(event.shiftKey);
  }

  private get popupFallbackWidth(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.menuWidthLg, TOKEN_DEFAULTS.menuWidthLg);
  }

  private get popupFallbackHeight(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.menuFallbackHeight, TOKEN_DEFAULTS.menuFallbackHeight);
  }

  private teardown() {
    this.position.unobserve();
    this.interaction.disconnect();
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private toggle(fromKeyboard = false) {
    if (this.open) {
      this.close();
      return;
    }
    this.pendingInitialFocusVisible = fromKeyboard;
    this.open = true;
    this.dsOpenChange.emit(true);
    this.onOpenChange(true);
  }

  private close(restoreFocus = true) {
    if (restoreFocus) this.interaction.focusAnchor();
    this.open = false;
    this.dsOpenChange.emit(false);
    this.onOpenChange(false);
  }

  private finishClose() {
    const popup = this.el.querySelector<HTMLElement>('.table-group-popup');
    if (popup?.matches(':popover-open')) popup.hidePopover();
    this.shouldRender = false;
    this.closing = false;
    this.closeTimer = null;
  }

  private focusInitialDataPoint() {
    requestAnimationFrame(() => {
      const selected = this.grouping
        ? this.el.querySelector<HTMLElement>(
            `[data-group-value="${CSS.escape(this.grouping.columnId)}"] [role="option"]`
          )
        : null;
      const initial =
        selected ??
        this.el.querySelector<HTMLElement>(
          '[data-group-value] [role="option"]:not([aria-disabled="true"])'
        );
      initial?.focus();
      this.pendingInitialFocusVisible = false;
    });
  }

  private selectData(option: TableGroupOption) {
    if (option.isInactive) return;
    if (this.grouping?.columnId === option.value) {
      this.dsGroupChange.emit({ ...this.grouping });
      return;
    }
    const initialOrder = option.orderOptions?.[0];
    this.dsGroupChange.emit({
      columnId: option.value,
      direction: initialOrder?.direction ?? 'asc',
      ...(initialOrder?.orderBy ? { orderBy: initialOrder.orderBy } : {}),
    });
  }

  private get activeOrderOptions(): TableGroupOrderOption[] {
    const configured = this.options.find(
      option => option.value === this.grouping?.columnId
    )?.orderOptions;
    return configured?.length ? configured : DEFAULT_ORDER_OPTIONS;
  }

  private get selectedOrderIndex(): number {
    if (!this.grouping) return -1;
    const exact = this.activeOrderOptions.findIndex(
      option =>
        option.direction === this.grouping?.direction && option.orderBy === this.grouping?.orderBy
    );
    if (exact >= 0) return exact;
    if (this.grouping.orderBy === undefined) {
      return this.activeOrderOptions.findIndex(
        option => option.direction === this.grouping?.direction
      );
    }
    return -1;
  }

  private selectOrder(option: TableGroupOrderOption, index: number) {
    if (!this.grouping || this.selectedOrderIndex === index) return;
    const grouping: TableGroupingState = {
      columnId: this.grouping.columnId,
      direction: option.direction,
    };
    if (option.orderBy) grouping.orderBy = option.orderBy;
    this.dsGroupChange.emit(grouping);
  }

  private moveFocus(
    event: KeyboardEvent,
    selector: string,
    currentIndex: number,
    oppositeSelector?: string
  ) {
    if (oppositeSelector && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      this.focusRingVisible = true;
      this.el.querySelector<HTMLElement>(oppositeSelector)?.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(this.el.querySelectorAll<HTMLElement>(selector)).filter(
      item => item.getAttribute('aria-disabled') !== 'true'
    );
    if (!items.length) return;
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else next = (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    this.focusRingVisible = true;
    items[next]?.focus();
  }

  private renderDataOption(option: TableGroupOption, index: number) {
    const selected = option.value === this.grouping?.columnId;
    return (
      <ChoiceOptionRow
        id={`${this.componentId}-data-${index}`}
        option={{ ...option }}
        selected={selected}
        active={selected}
        focusRingVisible={this.focusRingVisible}
        usesSubtext={Boolean(option.description)}
        tabIndex={selected || (!this.grouping && index === 0) ? 0 : -1}
        onHover={() => {
          this.focusRingVisible = false;
        }}
        onSelect={() => this.selectData(option)}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.selectData(option);
            return;
          }
          this.moveFocus(
            event,
            '[data-group-value] [role="option"]',
            this.options
              .filter(candidate => !candidate.isInactive)
              .findIndex(candidate => candidate.value === option.value),
            this.grouping
              ? `[data-group-order-index="${this.selectedOrderIndex}"] [role="option"]`
              : undefined
          );
        }}
      />
    );
  }

  private renderOrder(option: TableGroupOrderOption, index: number) {
    const selected = index === this.selectedOrderIndex;
    return (
      <ChoiceOptionRow
        id={`${this.componentId}-order-${index}`}
        option={{ label: option.label, value: String(index) }}
        selected={selected}
        active={selected}
        focusRingVisible={this.focusRingVisible}
        usesSubtext={false}
        tabIndex={selected ? 0 : -1}
        onHover={() => {
          this.focusRingVisible = false;
        }}
        onSelect={() => this.selectOrder(option, index)}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.selectOrder(option, index);
            return;
          }
          this.moveFocus(
            event,
            '[data-group-order-index] [role="option"]',
            index,
            `[data-group-value="${CSS.escape(this.grouping?.columnId ?? '')}"] [role="option"]`
          );
        }}
      />
    );
  }

  render() {
    const name = this.ariaLabel?.trim() || 'Group table';
    const popupStyle: Record<string, string> = {
      position: 'fixed',
      left: '0',
      top: '0',
      transform: `translate(${Math.round(this.pos.x)}px, ${Math.round(this.pos.y)}px)`,
      zIndex: '9998',
      visibility: this.positionReady ? 'visible' : 'hidden',
    };

    return (
      <Host hidden={this.options.length === 0 ? true : undefined}>
        {this.options.length ? (
          <ds-button-unfilled
            ref={element => {
              this.triggerElement = (element as HTMLElement) ?? null;
            }}
            id={this.triggerId}
            variant="icon-label"
            size="md"
            icon="SectionList"
            label="Group"
            labelEmphasis={false}
            pressScale={false}
            aria-label={name}
            hasMenu={true}
            collapseLabel={true}
            expanded={this.open}
            controls={this.popupId}
            onDsClick={(event: CustomEvent<MouseEvent>) => this.toggle(event.detail.detail === 0)}
          />
        ) : null}

        {this.shouldRender ? (
          <div
            id={this.popupId}
            popover="manual"
            class={{
              'table-group-popup': true,
              'ds-choice-popup': true,
              'ds-choice-popup--closing': this.closing,
            }}
            style={popupStyle}
            role="dialog"
            aria-label={name}
          >
            <div class="table-group__body">
              <div class="table-group__data-pane">
                <ChoiceListSection
                  heading="Data"
                  ariaLabel="Group data"
                  className="table-group__list"
                >
                  {this.options.map((option, index) => (
                    <div data-group-value={option.value}>
                      {this.renderDataOption(option, index)}
                    </div>
                  ))}
                </ChoiceListSection>
                <div
                  class="table-group__footer ds-choice-footer"
                  aria-hidden={!this.grouping ? 'true' : undefined}
                >
                  <div class="ds-choice-footer__content ds-control--md">
                    {this.grouping ? (
                      <button
                        class="ds-choice-footer__clear ds-text-action ds-focus-ring"
                        type="button"
                        onClick={() => this.dsClear.emit()}
                      >
                        <ds-text as="span" variant="text-body-medium" color="inherit">
                          {this.clearLabel}
                        </ds-text>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div class="table-group__order-pane">
                {this.grouping ? (
                  <ChoiceListSection
                    heading="Order"
                    ariaLabel="Group order"
                    className="table-group__list"
                  >
                    {this.activeOrderOptions.map((option, index) => (
                      <div data-group-order-index={index}>{this.renderOrder(option, index)}</div>
                    ))}
                  </ChoiceListSection>
                ) : (
                  <div class="table-group__empty ds-choice-empty ds-empty-region">
                    <ds-empty-state body={this.emptyMessage} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Host>
    );
  }
}
