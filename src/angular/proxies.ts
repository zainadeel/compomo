/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import { Components } from '@ds-mo/ui';


@ProxyCmp({
  inputs: ['expandedIds', 'items', 'multiple']
})
@Component({
  selector: 'ds-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['expandedIds', 'items', 'multiple'],
  outputs: ['dsExpandedChange'],
  standalone: false
})
export class DsAccordion {
  protected el: HTMLDsAccordionElement;
  @Output() dsExpandedChange = new EventEmitter<CustomEvent<string[]>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsAccordion extends Components.DsAccordion {

  dsExpandedChange: EventEmitter<CustomEvent<string[]>>;
}


@ProxyCmp({
  inputs: ['gradient', 'gradientSrc', 'navStyle']
})
@Component({
  selector: 'ds-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['gradient', 'gradientSrc', 'navStyle'],
  standalone: false
})
export class DsAppShell {
  protected el: HTMLDsAppShellElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsAppShell extends Components.DsAppShell {}


@ProxyCmp({
  inputs: ['background', 'count', 'isSelected', 'label', 'max', 'surface', 'variant']
})
@Component({
  selector: 'ds-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'count', 'isSelected', 'label', 'max', 'surface', 'variant'],
  standalone: false
})
export class DsBadge {
  protected el: HTMLDsBadgeElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsBadge extends Components.DsBadge {}


@ProxyCmp({
  inputs: ['contrast', 'dismissLabel', 'floating', 'header', 'intent', 'message', 'showDismiss']
})
@Component({
  selector: 'ds-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['contrast', 'dismissLabel', 'floating', 'header', 'intent', 'message', 'showDismiss'],
  outputs: ['dsDismiss'],
  standalone: false
})
export class DsBanner {
  protected el: HTMLDsBannerElement;
  @Output() dsDismiss = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsBanner extends Components.DsBanner {

  dsDismiss: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['actions', 'actionsJson', 'basePath', 'currentUrl', 'heading', 'navStyle', 'tabs', 'tabsJson', 'value']
})
@Component({
  selector: 'ds-bar-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['actions', 'actionsJson', 'basePath', 'currentUrl', 'heading', 'navStyle', 'tabs', 'tabsJson', 'value'],
  outputs: ['dsTabChange', 'dsActionChange'],
  standalone: false
})
export class DsBarNav {
  protected el: HTMLDsBarNavElement;
  @Output() dsTabChange = new EventEmitter<CustomEvent<string>>();
  @Output() dsActionChange = new EventEmitter<CustomEvent<{ id: string; selected: boolean }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsBarNav extends Components.DsBarNav {
  /**
   * Emitted when the active tab changes. Detail = tab id.
   */
  dsTabChange: EventEmitter<CustomEvent<string>>;
  /**
   * Emitted when an action button is toggled. Detail = { id, selected }.
   */
  dsActionChange: EventEmitter<CustomEvent<{ id: string; selected: boolean }>>;
}


@ProxyCmp({
  inputs: ['ariaLabel', 'background', 'dot', 'icon', 'inactive', 'selected']
})
@Component({
  selector: 'ds-bar-nav-action',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'background', 'dot', 'icon', 'inactive', 'selected'],
  outputs: ['dsChange'],
  standalone: false
})
export class DsBarNavAction {
  protected el: HTMLDsBarNavActionElement;
  @Output() dsChange = new EventEmitter<CustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsBarNavAction extends Components.DsBarNavAction {
  /**
   * Emits the new selected value (!selected) on click.
   */
  dsChange: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['items', 'separator']
})
@Component({
  selector: 'ds-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['items', 'separator'],
  outputs: ['dsNavigate'],
  standalone: false
})
export class DsBreadcrumb {
  protected el: HTMLDsBreadcrumbElement;
  @Output() dsNavigate = new EventEmitter<CustomEvent<{ item: IDsBreadcrumbBreadcrumbItem; index: number }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { BreadcrumbItem as IDsBreadcrumbBreadcrumbItem } from '@ds-mo/ui';

export declare interface DsBreadcrumb extends Components.DsBreadcrumb {

  dsNavigate: EventEmitter<CustomEvent<{ item: IDsBreadcrumbBreadcrumbItem; index: number }>>;
}


@ProxyCmp({
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'badgeCount', 'contrast', 'dropdown', 'elevation', 'fullWidth', 'href', 'inactive', 'intent', 'label', 'loading', 'rounded', 'size', 'target', 'type', 'variant', 'width']
})
@Component({
  selector: 'ds-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'badgeCount', 'contrast', 'dropdown', 'elevation', 'fullWidth', 'href', 'inactive', 'intent', 'label', 'loading', 'rounded', 'size', 'target', 'type', 'variant', 'width'],
  outputs: ['dsClick', 'dsMouseEnter', 'dsMouseLeave'],
  standalone: false
})
export class DsButton {
  protected el: HTMLDsButtonElement;
  @Output() dsClick = new EventEmitter<CustomEvent<MouseEvent>>();
  @Output() dsMouseEnter = new EventEmitter<CustomEvent<MouseEvent>>();
  @Output() dsMouseLeave = new EventEmitter<CustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsButton extends Components.DsButton {

  dsClick: EventEmitter<CustomEvent<MouseEvent>>;

  dsMouseEnter: EventEmitter<CustomEvent<MouseEvent>>;

  dsMouseLeave: EventEmitter<CustomEvent<MouseEvent>>;
}


@ProxyCmp({
  inputs: ['elevation', 'items', 'rounded', 'size']
})
@Component({
  selector: 'ds-button-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['elevation', 'items', 'rounded', 'size'],
  outputs: ['dsClick'],
  standalone: false
})
export class DsButtonGroup {
  protected el: HTMLDsButtonGroupElement;
  @Output() dsClick = new EventEmitter<CustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsButtonGroup extends Components.DsButtonGroup {
  /**
   * Emits the index of the clicked item.
   */
  dsClick: EventEmitter<CustomEvent<number>>;
}


@ProxyCmp({
  inputs: ['elevation', 'radius']
})
@Component({
  selector: 'ds-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['elevation', 'radius'],
  standalone: false
})
export class DsCard {
  protected el: HTMLDsCardElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsCard extends Components.DsCard {}


@ProxyCmp({
  inputs: ['checked', 'inactive', 'indeterminate', 'label']
})
@Component({
  selector: 'ds-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'inactive', 'indeterminate', { name: 'label', required: true }],
  outputs: ['dsChange'],
  standalone: false
})
export class DsCheckbox {
  protected el: HTMLDsCheckboxElement;
  @Output() dsChange = new EventEmitter<CustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsCheckbox extends Components.DsCheckbox {

  dsChange: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['background', 'contrast', 'elevation', 'inactive', 'intent', 'label', 'maxWidth', 'pressed', 'removable', 'rounded', 'size']
})
@Component({
  selector: 'ds-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'contrast', 'elevation', 'inactive', 'intent', { name: 'label', required: true }, 'maxWidth', 'pressed', 'removable', 'rounded', 'size'],
  outputs: ['dsRemove', 'dsClick', 'dsPressedChange'],
  standalone: false
})
export class DsChip {
  protected el: HTMLDsChipElement;
  @Output() dsRemove = new EventEmitter<CustomEvent<void>>();
  @Output() dsClick = new EventEmitter<CustomEvent<void>>();
  @Output() dsPressedChange = new EventEmitter<CustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsChip extends Components.DsChip {
  /**
   * Fired when the remove button is clicked.
   */
  dsRemove: EventEmitter<CustomEvent<void>>;
  /**
   * Fired when an interactive chip is clicked.
   */
  dsClick: EventEmitter<CustomEvent<void>>;
  /**
   * Fired when the pressed state toggles.
   */
  dsPressedChange: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['inset', 'length', 'orientation', 'semantic', 'surface']
})
@Component({
  selector: 'ds-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['inset', 'length', 'orientation', 'semantic', 'surface'],
  standalone: false
})
export class DsDivider {
  protected el: HTMLDsDividerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsDivider extends Components.DsDivider {}


@ProxyCmp({
  inputs: ['message', 'type']
})
@Component({
  selector: 'ds-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['message', 'type'],
  standalone: false
})
export class DsEmptyState {
  protected el: HTMLDsEmptyStateElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsEmptyState extends Components.DsEmptyState {}


@ProxyCmp({
  inputs: ['background', 'height', 'side', 'size', 'surface', 'visible']
})
@Component({
  selector: 'ds-fade',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'height', 'side', 'size', 'surface', 'visible'],
  standalone: false
})
export class DsFade {
  protected el: HTMLDsFadeElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsFade extends Components.DsFade {}


@ProxyCmp({
  inputs: ['fieldId', 'label']
})
@Component({
  selector: 'ds-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['fieldId', { name: 'label', required: true }],
  standalone: false
})
export class DsField {
  protected el: HTMLDsFieldElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsField extends Components.DsField {}


@ProxyCmp({
  inputs: ['background', 'heading']
})
@Component({
  selector: 'ds-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'heading'],
  standalone: false
})
export class DsHeader {
  protected el: HTMLDsHeaderElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsHeader extends Components.DsHeader {}


@ProxyCmp({
  inputs: ['color', 'flag', 'label', 'name', 'size']
})
@Component({
  selector: 'ds-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['color', 'flag', 'label', 'name', 'size'],
  standalone: false
})
export class DsIcon {
  protected el: HTMLDsIconElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsIcon extends Components.DsIcon {}


@ProxyCmp({
  inputs: ['ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'autoFocus', 'error', 'errorMessage', 'inactive', 'inputId', 'placeholder', 'type', 'value'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'autoFocus', 'error', 'errorMessage', 'inactive', 'inputId', 'placeholder', 'type', 'value'],
  outputs: ['dsChange', 'dsClear'],
  standalone: false
})
export class DsInput {
  protected el: HTMLDsInputElement;
  @Output() dsChange = new EventEmitter<CustomEvent<string>>();
  @Output() dsClear = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsInput extends Components.DsInput {

  dsChange: EventEmitter<CustomEvent<string>>;

  dsClear: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['label', 'size']
})
@Component({
  selector: 'ds-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['label', 'size'],
  standalone: false
})
export class DsLoader {
  protected el: HTMLDsLoaderElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsLoader extends Components.DsLoader {}


@ProxyCmp({
  inputs: ['align', 'alignOffset', 'anchor', 'anchorId', 'items', 'menuWidth', 'minWidth', 'open', 'sections', 'side', 'sideOffset']
})
@Component({
  selector: 'ds-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['align', 'alignOffset', 'anchor', 'anchorId', 'items', 'menuWidth', 'minWidth', 'open', 'sections', 'side', 'sideOffset'],
  outputs: ['dsClose', 'dsSelect'],
  standalone: false
})
export class DsMenu {
  protected el: HTMLDsMenuElement;
  @Output() dsClose = new EventEmitter<CustomEvent<void>>();
  @Output() dsSelect = new EventEmitter<CustomEvent<IDsMenuMenuItemData>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { MenuItemData as IDsMenuMenuItemData } from '@ds-mo/ui';

export declare interface DsMenu extends Components.DsMenu {

  dsClose: EventEmitter<CustomEvent<void>>;

  dsSelect: EventEmitter<CustomEvent<IDsMenuMenuItemData>>;
}


@ProxyCmp({
  inputs: ['heading', 'modalWidth', 'open', 'subtitle']
})
@Component({
  selector: 'ds-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [{ name: 'heading', required: true }, 'modalWidth', 'open', 'subtitle'],
  outputs: ['dsClose'],
  standalone: false
})
export class DsModal {
  protected el: HTMLDsModalElement;
  @Output() dsClose = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsModal extends Components.DsModal {

  dsClose: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['inactive', 'page', 'siblingCount', 'totalPages']
})
@Component({
  selector: 'ds-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['inactive', 'page', 'siblingCount', 'totalPages'],
  outputs: ['dsPageChange'],
  standalone: false
})
export class DsPagination {
  protected el: HTMLDsPaginationElement;
  @Output() dsPageChange = new EventEmitter<CustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsPagination extends Components.DsPagination {

  dsPageChange: EventEmitter<CustomEvent<number>>;
}


@ProxyCmp({
  inputs: ['activeId', 'breakpoint', 'collapsed', 'currentUrl', 'disableViewTransition', 'groups', 'navStyle', 'routerMode', 'storageKey', 'userInitial', 'userName']
})
@Component({
  selector: 'ds-panel-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeId', 'breakpoint', 'collapsed', 'currentUrl', 'disableViewTransition', 'groups', 'navStyle', 'routerMode', 'storageKey', 'userInitial', 'userName'],
  outputs: ['dsNavSelect', 'dsNavToggle', 'dsNavFooterAction', 'dsNavUserAction'],
  standalone: false
})
export class DsPanelNav {
  protected el: HTMLDsPanelNavElement;
  @Output() dsNavSelect = new EventEmitter<CustomEvent<string>>();
  @Output() dsNavToggle = new EventEmitter<CustomEvent<boolean>>();
  @Output() dsNavFooterAction = new EventEmitter<CustomEvent<void>>();
  @Output() dsNavUserAction = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsPanelNav extends Components.DsPanelNav {
  /**
   * Emitted when a nav item is clicked. Detail = the item's `id`.
   */
  dsNavSelect: EventEmitter<CustomEvent<string>>;
  /**
   * Emitted when the collapse toggle is clicked. Detail = new collapsed state.
   */
  dsNavToggle: EventEmitter<CustomEvent<boolean>>;
  /**
   * Emitted when the footer left button (gear / dashboard) is clicked.
   */
  dsNavFooterAction: EventEmitter<CustomEvent<void>>;
  /**
   * Emitted when the footer user button is clicked.
   */
  dsNavUserAction: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['ariaLabel', 'ariaLabelledby', 'direction', 'inactive', 'options', 'value']
})
@Component({
  selector: 'ds-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'direction', 'inactive', 'options', 'value'],
  outputs: ['dsChange'],
  standalone: false
})
export class DsRadioGroup {
  protected el: HTMLDsRadioGroupElement;
  @Output() dsChange = new EventEmitter<CustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsRadioGroup extends Components.DsRadioGroup {

  dsChange: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['showTrackOnHover', 'variant']
})
@Component({
  selector: 'ds-scrollbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['showTrackOnHover', 'variant'],
  standalone: false
})
export class DsScrollbar {
  protected el: HTMLDsScrollbarElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsScrollbar extends Components.DsScrollbar {}


@ProxyCmp({
  inputs: ['ariaLabel', 'ariaLabelledby', 'inactive', 'options', 'placeholder', 'value']
})
@Component({
  selector: 'ds-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'inactive', 'options', 'placeholder', 'value'],
  outputs: ['dsChange'],
  standalone: false
})
export class DsSelect {
  protected el: HTMLDsSelectElement;
  @Output() dsChange = new EventEmitter<CustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsSelect extends Components.DsSelect {
  /**
   * Emits the selected value string.
   */
  dsChange: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['height', 'lines', 'shimmer', 'variant', 'width']
})
@Component({
  selector: 'ds-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['height', 'lines', 'shimmer', 'variant', 'width'],
  standalone: false
})
export class DsSkeleton {
  protected el: HTMLDsSkeletonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsSkeleton extends Components.DsSkeleton {}


@ProxyCmp({
  inputs: ['inactive', 'inputId', 'label', 'max', 'min', 'step', 'value', 'valueText']
})
@Component({
  selector: 'ds-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['inactive', 'inputId', { name: 'label', required: true }, 'max', 'min', 'step', 'value', 'valueText'],
  outputs: ['dsChange'],
  standalone: false
})
export class DsSlider {
  protected el: HTMLDsSliderElement;
  @Output() dsChange = new EventEmitter<CustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsSlider extends Components.DsSlider {

  dsChange: EventEmitter<CustomEvent<number>>;
}


@ProxyCmp({
  inputs: ['as', 'background', 'contrast', 'edge', 'elevation', 'inactive', 'intent', 'interactive', 'radius', 'selected']
})
@Component({
  selector: 'ds-surface',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['as', 'background', 'contrast', 'edge', 'elevation', 'inactive', 'intent', 'interactive', 'radius', 'selected'],
  standalone: false
})
export class DsSurface {
  protected el: HTMLDsSurfaceElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsSurface extends Components.DsSurface {}


@ProxyCmp({
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'orientation', 'tabs', 'value']
})
@Component({
  selector: 'ds-tab-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'orientation', 'tabs', 'value'],
  outputs: ['dsChange'],
  standalone: false
})
export class DsTabGroup {
  protected el: HTMLDsTabGroupElement;
  @Output() dsChange = new EventEmitter<CustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTabGroup extends Components.DsTabGroup {

  dsChange: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'orientation', 'tabs', 'value']
})
@Component({
  selector: 'ds-tab-group-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'orientation', 'tabs', 'value'],
  outputs: ['dsChange'],
  standalone: false
})
export class DsTabGroupNav {
  protected el: HTMLDsTabGroupNavElement;
  @Output() dsChange = new EventEmitter<CustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTabGroupNav extends Components.DsTabGroupNav {

  dsChange: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['columns', 'data', 'emptyMessage', 'loading', 'pageIndex', 'pageSize', 'selectedRows', 'sortState']
})
@Component({
  selector: 'ds-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['columns', 'data', 'emptyMessage', 'loading', 'pageIndex', 'pageSize', 'selectedRows', 'sortState'],
  outputs: ['dsSort', 'dsRowClick', 'dsPageChange'],
  standalone: false
})
export class DsTable {
  protected el: HTMLDsTableElement;
  @Output() dsSort = new EventEmitter<CustomEvent<{ columnId: string }>>();
  @Output() dsRowClick = new EventEmitter<CustomEvent<{ row: unknown; rowIndex: number }>>();
  @Output() dsPageChange = new EventEmitter<CustomEvent<{ pageIndex: number }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTable extends Components.DsTable {

  dsSort: EventEmitter<CustomEvent<{ columnId: string }>>;

  dsRowClick: EventEmitter<CustomEvent<{ row: unknown; rowIndex: number }>>;

  dsPageChange: EventEmitter<CustomEvent<{ pageIndex: number }>>;
}


@ProxyCmp({
  inputs: ['contrast', 'elevation', 'intent', 'label', 'maxWidth', 'rounded', 'size']
})
@Component({
  selector: 'ds-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['contrast', 'elevation', 'intent', { name: 'label', required: true }, 'maxWidth', 'rounded', 'size'],
  standalone: false
})
export class DsTag {
  protected el: HTMLDsTagElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTag extends Components.DsTag {}


@ProxyCmp({
  inputs: ['align', 'as', 'color', 'decoration', 'fontFeature', 'for', 'italic', 'lineTruncation', 'variant', 'wrap']
})
@Component({
  selector: 'ds-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['align', 'as', 'color', 'decoration', 'fontFeature', 'for', 'italic', 'lineTruncation', 'variant', 'wrap'],
  standalone: false
})
export class DsText {
  protected el: HTMLDsTextElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsText extends Components.DsText {}


@ProxyCmp({
  inputs: ['position']
})
@Component({
  selector: 'ds-toast-provider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['position'],
  standalone: false
})
export class DsToastProvider {
  protected el: HTMLDsToastProviderElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsToastProvider extends Components.DsToastProvider {}


@ProxyCmp({
  inputs: ['checked', 'inactive']
})
@Component({
  selector: 'ds-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'inactive'],
  outputs: ['dsChange'],
  standalone: false
})
export class DsToggle {
  protected el: HTMLDsToggleElement;
  @Output() dsChange = new EventEmitter<CustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsToggle extends Components.DsToggle {

  dsChange: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['ariaLabel', 'background', 'elevation', 'icon', 'inactive', 'label', 'pressed', 'rounded', 'size']
})
@Component({
  selector: 'ds-toggle-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'background', 'elevation', 'icon', 'inactive', 'label', 'pressed', 'rounded', 'size'],
  outputs: ['dsChange'],
  standalone: false
})
export class DsToggleButton {
  protected el: HTMLDsToggleButtonElement;
  @Output() dsChange = new EventEmitter<CustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsToggleButton extends Components.DsToggleButton {
  /**
   * Emits the new pressed value (!pressed) on click.
   */
  dsChange: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['background', 'elevation', 'items', 'rounded', 'size', 'value']
})
@Component({
  selector: 'ds-toggle-button-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'elevation', 'items', 'rounded', 'size', 'value'],
  outputs: ['dsChange'],
  standalone: false
})
export class DsToggleButtonGroup {
  protected el: HTMLDsToggleButtonGroupElement;
  @Output() dsChange = new EventEmitter<CustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsToggleButtonGroup extends Components.DsToggleButtonGroup {
  /**
   * Emits the id of the newly selected item.
   */
  dsChange: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['align', 'alignOffset', 'delay', 'label', 'shortcutKey', 'shortcutKeyPosition', 'side', 'sideOffset']
})
@Component({
  selector: 'ds-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['align', 'alignOffset', 'delay', { name: 'label', required: true }, 'shortcutKey', 'shortcutKeyPosition', 'side', 'sideOffset'],
  standalone: false
})
export class DsTooltip {
  protected el: HTMLDsTooltipElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTooltip extends Components.DsTooltip {}


