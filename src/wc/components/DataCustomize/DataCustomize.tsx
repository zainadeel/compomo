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
} from '@stencil/core';
import type { DataField } from '../../utils/data-field';
import type { MenuItemData, MenuSection } from '../Menu/menu-types';
import {
  listCustomizerMenuItems,
  resolveListOrder,
  toggleListHidden,
  type ListCustomizerOptions,
} from '../../utils/list-customizer';

export interface DataCustomizeChangeDetail {
  /** Fields the viewer has hidden, in the order they were hidden. */
  hiddenFieldIds: string[];
  /** Field ids in display order. Unchanged unless the catalog reorders. */
  fieldOrder: string[];
}

let dataCustomizeSeq = 0;

/**
 * Show, hide and optionally reorder the data points a view renders.
 *
 * The table owns its own column customizer inside the caption, because a table
 * locks its last visible column and reorders columns. This control is the same
 * catalog for every other surface — a card list, a map overlay — where the
 * fields are independent and usually only show and hide.
 */
@Component({
  tag: 'ds-data-customize',
  styleUrl: 'DataCustomize.css',
  scoped: true,
})
export class DataCustomize {
  @Element() private el!: HTMLElement;

  /** Show the trigger border. */
  @Prop() hasBorder: boolean = true;
  /** Catalog of data points the view can render. */
  @Prop() fields: DataField[] = [];
  /** Controlled hidden field ids. */
  @Prop() hiddenFieldIds: string[] = [];
  /** Controlled display order. Ids missing from it keep catalog order. */
  @Prop() fieldOrder: string[] = [];
  /**
   * Drag-reorder the catalog rows. Off by default: most surfaces only show and
   * hide, and a card layout has no column order to express.
   */
  @Prop() reorderable: boolean = false;
  /**
   * Fields that must stay visible. Zero by default, so a view whose identity
   * lives outside this catalog can hide every entry in it.
   */
  @Prop() minVisible: number = 0;
  /** Section header above the catalog rows. Omitted when there is no second section. */
  @Prop() catalogHeader?: string;
  /** Extra switch rows rendered in their own Options section. */
  @Prop() options: MenuItemData[] = [];
  /** Header for the options section. */
  @Prop() optionsHeader: string = 'Options';
  /** Accessible name for the trigger and menu. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Visible trigger label. Collapses to the icon when space is tight. */
  @Prop() label: string = 'Customize';

  @Event({ bubbles: false }) dsFieldsConfigChange!: EventEmitter<DataCustomizeChangeDetail>;
  @Event({ bubbles: false }) dsOptionChange!: EventEmitter<string>;

  @State() private menuOpen = false;
  @State() private menuSurfaceOpen = false;
  @State() private initialFocusVisible = false;

  private readonly componentId = `ds-data-customize-${++dataCustomizeSeq}`;
  private readonly triggerId = `${this.componentId}-trigger`;
  private readonly menuId = `${this.componentId}-menu`;

  @Method()
  async setFocus() {
    const trigger = this.el.querySelector<HTMLElement & { setFocus?: () => Promise<void> }>(
      `#${CSS.escape(this.triggerId)}`
    );
    await trigger?.setFocus?.();
  }

  private get customizerOptions(): ListCustomizerOptions {
    return { minVisible: this.minVisible, reorderable: this.reorderable };
  }

  private get catalog(): { id: string; label: string }[] {
    return this.fields.map(field => ({
      id: field.id,
      label: field.label.trim() || field.accessibleLabel?.trim() || field.id,
    }));
  }

  private get sections(): MenuSection[] {
    const rows = listCustomizerMenuItems(
      this.catalog,
      this.hiddenFieldIds,
      this.fieldOrder,
      this.customizerOptions
    );

    return [
      ...(rows.length
        ? [
            {
              header: this.catalogHeader ?? (this.options.length ? 'Data' : undefined),
              items: rows,
            },
          ]
        : []),
      ...(this.options.length ? [{ header: this.optionsHeader, items: this.options }] : []),
    ];
  }

  render() {
    const name = this.ariaLabel?.trim() || this.label?.trim() || 'Customize';
    const empty = this.fields.length === 0 && this.options.length === 0;

    return (
      <Host hidden={empty ? true : undefined}>
        {empty ? null : (
          <ds-button-unfilled
            hasBorder={this.hasBorder}
            id={this.triggerId}
            variant="icon-label"
            size="md"
            icon="Preferences"
            label={this.label}
            labelEmphasis={false}
            pressScale={false}
            aria-label={name}
            haspopup="menu"
            collapseLabel={true}
            expanded={this.menuOpen}
            surfaceOpen={this.menuSurfaceOpen}
            controls={this.menuId}
            onDsClick={(event: CustomEvent<MouseEvent>) => {
              this.toggle(event.detail.detail === 0);
            }}
          />
        )}
        {empty ? null : (
          <ds-menu
            id={this.menuId}
            open={this.menuOpen}
            anchorId={this.triggerId}
            align="start"
            side="bottom"
            menuLabel={name}
            selectionMode="none"
            initialFocusVisible={this.initialFocusVisible}
            sections={this.sections}
            onDsClose={() => this.close()}
            onDsAfterClose={() => {
              if (!this.menuOpen) this.menuSurfaceOpen = false;
            }}
            onDsSelect={event => this.handleSelect(event.detail)}
            onDsReorder={event => this.handleReorder(event.detail.items)}
          />
        )}
      </Host>
    );
  }

  private toggle(fromKeyboard = false): void {
    if (this.menuOpen) this.close();
    else this.open(fromKeyboard);
  }

  private open(fromKeyboard = false): void {
    if (this.menuOpen) return;
    this.initialFocusVisible = fromKeyboard;
    this.menuOpen = true;
    this.menuSurfaceOpen = true;
  }

  private close(): void {
    this.menuOpen = false;
  }

  private handleSelect(item: MenuItemData): void {
    const value = item.value;
    if (!value || item.isInactive) return;

    if (this.options.some(option => option.value === value)) {
      this.dsOptionChange.emit(value);
      return;
    }

    const ids = this.catalog.map(entry => entry.id);
    this.dsFieldsConfigChange.emit({
      hiddenFieldIds: toggleListHidden(ids, this.hiddenFieldIds, value, this.customizerOptions),
      fieldOrder: resolveListOrder(ids, this.fieldOrder),
    });
  }

  private handleReorder(items: MenuItemData[]): void {
    if (!this.reorderable) return;

    // Menu reports the new order of the reorderable run. resolveListOrder
    // rebuilds the full order from it, appending anything the run omitted.
    const next = items
      .filter(item => item.reorderable && item.value)
      .map(item => item.value as string);
    if (next.length === 0) return;

    this.dsFieldsConfigChange.emit({
      hiddenFieldIds: this.hiddenFieldIds,
      fieldOrder: resolveListOrder(
        this.catalog.map(entry => entry.id),
        next
      ),
    });
  }
}
