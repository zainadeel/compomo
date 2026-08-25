import { Component, Element, Event, EventEmitter, h, Host, Prop, State } from '@stencil/core';
import type { MenuItemData } from '../Menu/menu-types';
import type {
  SelectOptionActionDetail,
  SelectOptionSubtextActionDetail,
  SelectValue,
} from '../Select/Select';
import type {
  TableSavedView,
  TableSavedViewChangeDetail,
  TableSavedViewCreateDetail,
  TableSavedViewDiscardDetail,
  TableSavedViewRemoveDetail,
  TableSavedViewRenameDetail,
  TableSavedViewSaveDetail,
} from './table-saved-views-types';

type SavedViewDialogMode = 'create' | 'rename';

let tableSavedViewsId = 0;

@Component({
  tag: 'ds-table-saved-views',
  styleUrl: 'TableSavedViews.css',
  scoped: true,
})
export class TableSavedViews {
  @Element() el!: HTMLElement;

  /** Application-owned custom saved views. Assign arrays through the JavaScript property. */
  @Prop() views: TableSavedView[] = [];
  /** ID of the controlled active view, including the default view ID. */
  @Prop() value: string = '__default__';
  /** Whether the current table state differs from the selected custom view. Ignored for the default view. */
  @Prop() dirty: boolean = false;
  /** ID used for the built-in default view. */
  @Prop() defaultViewId: string = '__default__';
  /** Label used for the built-in default view. */
  @Prop() defaultViewLabel: string = 'Default';
  /** Accessible name for the saved-views select. */
  @Prop() label: string = 'Saved views';
  /** Trigger label shown while the default view is selected. */
  @Prop() triggerLabel: string = 'Views';
  /** Footer action label that opens the create-view dialog. */
  @Prop() createLabel: string = 'New view';

  /** Emitted when a view selection is requested. */
  @Event() dsViewChange!: EventEmitter<TableSavedViewChangeDetail>;
  /** Emitted after a valid create-view name is submitted. */
  @Event() dsViewCreate!: EventEmitter<TableSavedViewCreateDetail>;
  /** Emitted after a valid renamed view name is submitted. */
  @Event() dsViewRename!: EventEmitter<TableSavedViewRenameDetail>;
  /** Emitted when a custom view removal is requested. */
  @Event() dsViewRemove!: EventEmitter<TableSavedViewRemoveDetail>;
  /** Emitted when changes to the active custom view should replace its stored payload. */
  @Event() dsViewSave!: EventEmitter<TableSavedViewSaveDetail>;
  /** Emitted when the active custom view's stored payload should be restored. */
  @Event() dsViewDiscard!: EventEmitter<TableSavedViewDiscardDetail>;

  @State() private actionViewId: string | null = null;
  @State() private actionAnchorId: string | undefined;
  @State() private actionMenuOpen = false;
  @State() private actionMenuInitialFocusVisible = false;
  @State() private dialogOpen = false;
  @State() private dialogMode: SavedViewDialogMode = 'create';
  @State() private dialogViewId: string | null = null;
  @State() private nameDraft = '';
  @State() private nameError = '';

  private readonly componentId = `ds-table-saved-views-${++tableSavedViewsId}`;
  private readonly selectId = `${this.componentId}-select`;
  private readonly actionMenuId = `${this.componentId}-actions`;
  private readonly fieldId = `${this.componentId}-name-field`;
  private readonly inputId = `${this.componentId}-name-input`;
  private readonly actionItems: MenuItemData[] = [
    { label: 'Rename', value: 'rename' },
    { label: 'Remove', value: 'remove', isDestructive: true },
  ];

  private get selectedCustomView(): TableSavedView | undefined {
    return this.views.find(view => view.id === this.value);
  }

  private get dialogView(): TableSavedView | undefined {
    return this.views.find(view => view.id === this.dialogViewId);
  }

  private get sections() {
    const custom = this.views.map(view => ({
      label: view.label,
      value: view.id,
      subtextActions:
        this.dirty && view.id === this.selectedCustomView?.id
          ? [
              { label: 'Save', value: 'save' },
              { label: 'Discard', value: 'discard', tone: 'negative' as const },
            ]
          : undefined,
      action: {
        label: `Options for ${view.label}`,
        controls: this.actionMenuId,
        expanded: this.actionViewId === view.id && this.actionMenuOpen,
      },
    }));
    const templates = {
      header: 'Templates',
      options: [{ label: this.defaultViewLabel, value: this.defaultViewId }],
      divider: custom.length > 0,
    };
    return custom.length > 0 ? [templates, { header: 'Custom', options: custom }] : [templates];
  }

  private handleViewChange(value: SelectValue) {
    if (typeof value === 'string') this.dsViewChange.emit({ viewId: value });
  }

  private handleSubtextAction(detail: SelectOptionSubtextActionDetail) {
    const view = this.selectedCustomView;
    if (!view || !this.dirty || detail.value !== view.id) return;
    if (detail.actionValue === 'save') this.dsViewSave.emit({ viewId: view.id });
    if (detail.actionValue === 'discard') this.dsViewDiscard.emit({ viewId: view.id });
  }

  private handleOptionAction(detail: SelectOptionActionDetail) {
    if (!this.views.some(view => view.id === detail.value)) return;
    this.actionMenuInitialFocusVisible = detail.originalEvent.detail === 0;
    if (this.actionViewId === detail.value && this.actionMenuOpen) {
      this.actionMenuOpen = false;
      return;
    }
    this.actionViewId = detail.value;
    this.actionAnchorId = detail.anchorId;
    this.actionMenuOpen = true;
  }

  private handleActionSelect(event: CustomEvent<MenuItemData>) {
    const viewId = this.actionViewId;
    this.actionMenuOpen = false;
    if (!viewId) return;
    if (event.detail.value === 'rename') this.openDialog('rename', viewId);
    if (event.detail.value === 'remove') this.dsViewRemove.emit({ viewId });
  }

  private openDialog(mode: SavedViewDialogMode, viewId: string | null = null) {
    const view = mode === 'rename' ? this.views.find(item => item.id === viewId) : undefined;
    if (mode === 'rename' && !view) return;
    this.dialogMode = mode;
    this.dialogViewId = view?.id ?? null;
    this.nameDraft = view?.label ?? '';
    this.nameError = '';
    this.dialogOpen = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const input = this.el.querySelector<HTMLElement & { setFocus?: () => Promise<void> }>(
          `#${this.inputId}`
        );
        void input?.setFocus?.();
      });
    });
  }

  private validateName(): string {
    const name = this.nameDraft.trim();
    if (!name) return 'View name is required.';
    const duplicate = this.views.some(
      view =>
        view.id !== this.dialogViewId &&
        view.label.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    if (
      duplicate ||
      this.defaultViewLabel.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    ) {
      return 'A view with this name already exists.';
    }
    return '';
  }

  private submitDialog() {
    const error = this.validateName();
    if (error) {
      this.nameError = error;
      return;
    }
    const name = this.nameDraft.trim();
    if (this.dialogMode === 'rename' && this.dialogView) {
      this.dsViewRename.emit({ viewId: this.dialogView.id, name });
    } else {
      this.dsViewCreate.emit({ name });
    }
    this.dialogOpen = false;
  }

  private finishDialogClose() {
    if (this.dialogOpen) return;
    this.dialogViewId = null;
    this.nameDraft = '';
    this.nameError = '';
    const select = this.el.querySelector<HTMLElement & { setFocus?: () => Promise<void> }>(
      `#${this.selectId}`
    );
    void select?.setFocus?.();
  }

  render() {
    return (
      <Host>
        <ds-select
          id={this.selectId}
          size="md"
          width="fill"
          placeholder={this.label}
          aria-label={this.label}
          sections={this.sections}
          value={this.value}
          triggerLabel={this.selectedCustomView ? undefined : this.triggerLabel}
          triggerLabelPlaceholder={!this.selectedCustomView}
          dot={this.dirty && Boolean(this.selectedCustomView)}
          footerActionLabel={this.createLabel}
          activeFill={false}
          allowClear={false}
          onDsChange={(event: CustomEvent<SelectValue>) => this.handleViewChange(event.detail)}
          onDsFooterAction={() => this.openDialog('create')}
          onDsOptionSubtextAction={(event: CustomEvent<SelectOptionSubtextActionDetail>) =>
            this.handleSubtextAction(event.detail)
          }
          onDsOptionAction={(event: CustomEvent<SelectOptionActionDetail>) =>
            this.handleOptionAction(event.detail)
          }
        />

        <ds-menu
          id={this.actionMenuId}
          anchorId={this.actionAnchorId}
          menuLabel="Saved view options"
          side="bottom"
          align="end"
          menuWidth="max-content"
          minWidth="0"
          items={this.actionItems}
          open={this.actionMenuOpen}
          initialFocusVisible={this.actionMenuInitialFocusVisible}
          onDsClose={() => (this.actionMenuOpen = false)}
          onDsAfterClose={() => {
            if (this.actionMenuOpen) return;
            this.actionViewId = null;
            this.actionAnchorId = undefined;
          }}
          onDsSelect={(event: CustomEvent<MenuItemData>) => this.handleActionSelect(event)}
        />

        <ds-modal
          open={this.dialogOpen}
          heading={this.dialogMode === 'rename' ? 'Rename view' : 'Save as new view'}
          modalWidth="sm"
          onDsClose={() => (this.dialogOpen = false)}
          onDsAfterClose={() => this.finishDialogClose()}
        >
          <ds-field
            label="Name"
            fieldId={this.fieldId}
            error={this.nameError.length > 0}
            errorMessage={this.nameError}
          >
            <ds-input
              id={this.inputId}
              size="md"
              placeholder="Enter a unique name"
              value={this.nameDraft}
              autoFocus={true}
              onDsChange={(event: CustomEvent<string>) => {
                this.nameDraft = event.detail;
                if (this.nameError) this.nameError = '';
              }}
              onKeyDown={(event: KeyboardEvent) => {
                if (event.key === 'Enter') this.submitDialog();
              }}
            />
          </ds-field>

          <div slot="footer" class="table-saved-views__dialog-actions">
            <ds-button-filled
              label={this.dialogMode === 'rename' ? 'Rename' : 'Save'}
              size="md"
              onDsClick={() => this.submitDialog()}
            />
            <ds-button-unfilled
              label="Cancel"
              size="md"
              onDsClick={() => (this.dialogOpen = false)}
            />
          </div>
        </ds-modal>
      </Host>
    );
  }
}
