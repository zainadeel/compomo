import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

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

@Component({
  tag: 'ds-card-setting',
  styleUrl: 'CardSetting.css',
  scoped: true,
})
export class CardSetting {
  /** Section heading shown in the card header. */
  @Prop() heading!: string;

  /**
   * Card width token (`sm` / `md` / `lg`). Also sets host `min-height` to the
   * matching `--dimension-card-height-*` so the body fills available space
   * even when the slot is empty.
   */
  @Prop() cardWidth: CardSettingWidth = 'md';

  /** Controlled edit state — parent owns single-edit orchestration. */
  @Prop() editing = false;
  @Prop() editLabel: string = 'Edit';
  @Prop() cancelLabel: string = 'Cancel';
  @Prop() saveLabel: string = 'Save';

  /** Emits a controlled edit, save, or cancel request. */
  @Event() dsAction!: EventEmitter<CardSettingActionDetail>;

  private emitAction(action: CardSettingAction, originalEvent: MouseEvent) {
    this.dsAction.emit({ action, originalEvent });
  }

  render() {
    const editing = this.editing;

    return (
      <Host
        class={{
          'card-setting': true,
          'card-setting--editing': editing,
        }}
        style={{
          '--_card-setting-width': CARD_WIDTH_VARS[this.cardWidth],
          '--_card-setting-min-height': CARD_HEIGHT_VARS[this.cardWidth],
        }}
      >
        <header class="card-setting__header">
          <ds-text
            class="card-setting__title"
            variant="text-title-small"
            emphasis
            color={editing ? FAINT_BRAND_TITLE_COLOR : 'primary'}
            as="h2"
          >
            {this.heading}
          </ds-text>
          <div class="card-setting__actions">
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
        </header>
        <div class="card-setting__body">
          <slot />
        </div>
      </Host>
    );
  }
}
