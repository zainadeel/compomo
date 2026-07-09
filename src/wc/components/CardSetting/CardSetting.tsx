import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

export type CardSettingWidth = 'sm' | 'md' | 'lg';

const CARD_WIDTH_VARS: Record<CardSettingWidth, string> = {
  sm: 'var(--dimension-card-width-sm)',
  md: 'var(--dimension-card-width-md)',
  lg: 'var(--dimension-card-width-lg)',
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

  /** Card width token. */
  @Prop() cardWidth: CardSettingWidth = 'md';

  /** Controlled edit state — parent owns single-edit orchestration. */
  @Prop() editing = false;

  /** Emits when the user enters or exits edit mode. */
  @Event() dsEditingChange!: EventEmitter<boolean>;

  private enterEdit = () => {
    this.dsEditingChange.emit(true);
  };

  private exitEdit = () => {
    this.dsEditingChange.emit(false);
  };

  render() {
    const editing = this.editing;

    return (
      <Host
        class={{
          'card-setting': true,
          'card-setting--editing': editing,
        }}
        style={{ '--_card-setting-width': CARD_WIDTH_VARS[this.cardWidth] }}
      >
        <header class="card-setting__header">
          <div class="card-setting__title-wrap">
            <ds-text
              class="card-setting__title"
              variant="text-title-small"
              color={editing ? FAINT_BRAND_TITLE_COLOR : 'primary'}
              as="h2"
            >
              {this.heading}
            </ds-text>
          </div>
          {!editing ? (
            <ds-button-unfilled variant="icon"
              type="button"
              icon="Pencil"
              aria-label="Edit"
              onDsClick={this.enterEdit}
            />
          ) : (
            <div class="card-setting__actions">
              <ds-button-unfilled variant="icon"
                type="button"
                icon="Cross"
                backgroundContrast="bold"
                aria-label="Cancel"
                onDsClick={this.exitEdit}
              />
              <ds-button-filled variant="icon"
                type="button"
                icon="Check"
                intent="brand"
                contrast="faint"
                aria-label="Save"
                onDsClick={this.exitEdit}
              />
            </div>
          )}
        </header>
        <div class="card-setting__body">
          <slot />
        </div>
      </Host>
    );
  }
}
