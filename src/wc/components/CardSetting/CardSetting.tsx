import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import type { CardWidth } from '../Card/Card';

export type CardSettingWidth = CardWidth;

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
      <Host class="card-setting">
        <ds-card
          heading={this.heading}
          cardWidth={this.cardWidth}
          appearance={editing ? 'editing' : 'default'}
        >
          {!editing ? (
            <ds-button-unfilled
              slot="actions"
              variant="icon"
              type="button"
              icon="Pencil"
              aria-label="Edit"
              onDsClick={this.enterEdit}
            />
          ) : (
            <div slot="actions" class="card-setting__actions">
              <ds-button-unfilled
                variant="icon"
                type="button"
                icon="Cross"
                backgroundContrast="bold"
                aria-label="Cancel"
                onDsClick={this.exitEdit}
              />
              <ds-button-filled
                variant="icon"
                type="button"
                icon="Check"
                intent="brand"
                contrast="faint"
                aria-label="Save"
                onDsClick={this.exitEdit}
              />
            </div>
          )}
          <slot />
        </ds-card>
      </Host>
    );
  }
}
