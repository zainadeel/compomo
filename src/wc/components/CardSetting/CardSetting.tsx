import { Component, Element, Event, EventEmitter, h, Host, Prop, State } from '@stencil/core';

export type CardSettingVariant = 'editable' | 'immediate';
export type CardSettingWidth = 'sm' | 'md' | 'lg';
export type CardSettingAction = 'edit' | 'save' | 'cancel';

export interface CardSettingActionDetail {
  action: CardSettingAction;
  originalEvent: MouseEvent;
}

const CARD_WIDTH_VARS: Record<CardSettingWidth, string> = {
  sm: 'var(--dimension-card-width-sm)',
  md: 'var(--dimension-card-width-md)',
  lg: 'var(--dimension-card-width-lg)',
};

const CARD_HEIGHT_VARS: Record<CardSettingWidth, string> = {
  sm: 'var(--dimension-card-height-sm)',
  md: 'var(--dimension-card-height-md)',
  lg: 'var(--dimension-card-height-lg)',
};

const FAINT_BRAND_TITLE_COLOR = 'var(--color-foreground-faint-brand)';

const isRenderableNode = (node: Node): boolean => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return (node as Element).tagName !== 'SLOT';
  }
  return node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim());
};

const slotName = (node: Node): string | null =>
  node.nodeType === Node.ELEMENT_NODE ? (node as Element).getAttribute('slot') : null;

const isDefaultSlottedNode = (node: Node): boolean => isRenderableNode(node) && !slotName(node);

const isBannerSlottedNode = (node: Node): boolean =>
  isRenderableNode(node) && slotName(node) === 'banner';

const slotHasRenderableContent = (slot: HTMLSlotElement | null): boolean =>
  Boolean(slot?.assignedNodes({ flatten: true }).some(isRenderableNode));

@Component({
  tag: 'ds-card-setting',
  styleUrl: 'CardSetting.css',
  scoped: true,
})
export class CardSetting {
  @Element() el!: HTMLElement;

  /** Section heading shown in the card header. */
  @Prop() heading!: string;

  /**
   * Card width token (`sm` / `md` / `lg`). Empty editable cards use the matching
   * minimum-height token. Cards with body content, and immediate cards, fit
   * that content.
   */
  @Prop() cardWidth: CardSettingWidth = 'md';

  /** Immediate settings omit edit actions and apply changes through their own controls. */
  @Prop() variant: CardSettingVariant = 'editable';

  /** Controlled edit state — parent owns single-edit orchestration. */
  @Prop() editing = false;
  @Prop() editLabel: string = 'Edit';
  @Prop() cancelLabel: string = 'Cancel';
  @Prop() saveLabel: string = 'Save';

  /** Emits a controlled edit, save, or cancel request. */
  @Event() dsAction!: EventEmitter<CardSettingActionDetail>;

  @State() private hasBannerContent = false;
  @State() private hasBodyContent = false;

  componentWillLoad() {
    const nodes = Array.from(this.el.childNodes);
    this.hasBannerContent = nodes.some(isBannerSlottedNode);
    this.hasBodyContent = nodes.some(isDefaultSlottedNode);
  }

  componentDidLoad() {
    this.syncBannerContent();
    this.syncBodyContent();
  }

  private emitAction(action: CardSettingAction, originalEvent: MouseEvent) {
    this.dsAction.emit({ action, originalEvent });
  }

  private readSlotContent(
    event: Event | undefined,
    slotSelector: string,
    containerSelector: string
  ): boolean {
    const slot =
      event?.target instanceof HTMLSlotElement
        ? event.target
        : this.el.querySelector<HTMLSlotElement>(slotSelector);
    if (slotHasRenderableContent(slot)) return true;
    const container = this.el.querySelector(containerSelector);
    return Array.from(container?.childNodes ?? []).some(isRenderableNode);
  }

  private syncBannerContent = (event?: Event) => {
    const hasContent = this.readSlotContent(
      event,
      ':scope > .card-setting__panel > .card-setting__banner > slot',
      ':scope > .card-setting__panel > .card-setting__banner'
    );
    if (hasContent !== this.hasBannerContent) this.hasBannerContent = hasContent;
  };

  private syncBodyContent = (event?: Event) => {
    const hasContent = this.readSlotContent(
      event,
      ':scope > .card-setting__panel > .card-setting__body > slot',
      ':scope > .card-setting__panel > .card-setting__body'
    );
    if (hasContent !== this.hasBodyContent) this.hasBodyContent = hasContent;
  };

  private get hugContent(): boolean {
    return this.variant === 'immediate' || this.hasBannerContent || this.hasBodyContent;
  }

  render() {
    const editing = this.variant === 'editable' && this.editing;

    return (
      <Host
        class={{
          'card-setting': true,
          'card-setting--editing': editing,
          'card-setting--immediate': this.variant === 'immediate',
          'card-setting--empty': !this.hugContent,
        }}
        style={{
          '--_card-setting-width': CARD_WIDTH_VARS[this.cardWidth],
          '--_card-setting-min-height': this.hugContent ? '0' : CARD_HEIGHT_VARS[this.cardWidth],
        }}
      >
        <header class="card-setting__header ds-chrome-header">
          {/* eslint-disable-next-line compomo/prefer-direct-ds-text -- Shared header copy owns the control-density geometry around the semantic heading. */}
          <div class="card-setting__copy ds-chrome-header__copy ds-control--md">
            <ds-text
              class="card-setting__title ds-chrome-header__heading"
              variant="text-title-small"
              emphasis
              color={editing ? FAINT_BRAND_TITLE_COLOR : 'primary'}
              as="h2"
            >
              {this.heading}
            </ds-text>
          </div>
          {this.variant === 'editable' && (
            <div class="card-setting__actions ds-chrome-header__trailing">
              {!editing ? (
                <ds-button-unfilled
                  variant="icon"
                  type="button"
                  icon="Pencil"
                  aria-label={this.editLabel}
                  onDsClick={(event: CustomEvent<MouseEvent>) =>
                    this.emitAction('edit', event.detail)
                  }
                />
              ) : (
                [
                  <ds-button-unfilled
                    key="cancel"
                    variant="icon"
                    type="button"
                    icon="Cross"
                    background="bold"
                    aria-label={this.cancelLabel}
                    onDsClick={(event: CustomEvent<MouseEvent>) =>
                      this.emitAction('cancel', event.detail)
                    }
                  />,
                  <ds-button-filled
                    key="save"
                    variant="icon"
                    type="button"
                    icon="Check"
                    intent="brand"
                    contrast="faint"
                    aria-label={this.saveLabel}
                    onDsClick={(event: CustomEvent<MouseEvent>) =>
                      this.emitAction('save', event.detail)
                    }
                  />,
                ]
              )}
            </div>
          )}
        </header>
        <div class="card-setting__panel">
          <div
            class={{
              'card-setting__banner': true,
              'card-setting__banner--empty': !this.hasBannerContent,
            }}
          >
            <slot name="banner" onSlotchange={this.syncBannerContent} />
          </div>
          <div class="card-setting__body">
            <slot onSlotchange={this.syncBodyContent} />
          </div>
        </div>
      </Host>
    );
  }
}
