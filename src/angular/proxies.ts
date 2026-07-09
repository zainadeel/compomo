/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import { Components } from '@ds-mo/ui';


@ProxyCmp({
  inputs: ['gradient', 'gradientPreset', 'gradientSrc', 'navStyle', 'shortcutsEnabled']
})
@Component({
  selector: 'ds-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['gradient', 'gradientPreset', 'gradientSrc', 'navStyle', 'shortcutsEnabled'],
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
  inputs: ['background', 'count', 'gradientBackground', 'isSelected', 'label', 'max', 'surface', 'variant']
})
@Component({
  selector: 'ds-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'count', 'gradientBackground', 'isSelected', 'label', 'max', 'surface', 'variant'],
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
  inputs: ['basePath', 'currentUrl', 'heading', 'navStyle', 'tabs', 'tabsJson', 'value']
})
@Component({
  selector: 'ds-bar-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['basePath', 'currentUrl', 'heading', 'navStyle', 'tabs', 'tabsJson', 'value'],
  outputs: ['dsTabChange'],
  standalone: false
})
export class DsBarNav {
  protected el: HTMLDsBarNavElement;
  @Output() dsTabChange = new EventEmitter<CustomEvent<string>>();
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
}


@ProxyCmp({
  inputs: ['ariaLabel', 'contrast', 'icon', 'intent', 'isInactive', 'label', 'size', 'type', 'variant'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-button-filled',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'contrast', 'icon', 'intent', 'isInactive', 'label', 'size', 'type', 'variant'],
  outputs: ['dsClick'],
  standalone: false
})
export class DsButtonFilled {
  protected el: HTMLDsButtonFilledElement;
  @Output() dsClick = new EventEmitter<CustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsButtonFilled extends Components.DsButtonFilled {

  dsClick: EventEmitter<CustomEvent<MouseEvent>>;
}


@ProxyCmp({
  inputs: ['activeFill', 'ariaLabel', 'background', 'backgroundContrast', 'controls', 'dot', 'expanded', 'focusTabIndex', 'hasBorder', 'haspopup', 'icon', 'isActive', 'isInactive', 'label', 'pressed', 'size', 'type', 'variant'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-button-unfilled',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeFill', 'ariaLabel', 'background', 'backgroundContrast', 'controls', 'dot', 'expanded', 'focusTabIndex', 'hasBorder', 'haspopup', 'icon', 'isActive', 'isInactive', 'label', 'pressed', 'size', 'type', 'variant'],
  outputs: ['dsClick', 'dsChange'],
  standalone: false
})
export class DsButtonUnfilled {
  protected el: HTMLDsButtonUnfilledElement;
  @Output() dsClick = new EventEmitter<CustomEvent<MouseEvent>>();
  @Output() dsChange = new EventEmitter<CustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsButtonUnfilled extends Components.DsButtonUnfilled {

  dsClick: EventEmitter<CustomEvent<MouseEvent>>;

  dsChange: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['cardWidth', 'heading']
})
@Component({
  selector: 'ds-card-data-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['cardWidth', { name: 'heading', required: true }],
  standalone: false
})
export class DsCardDataViz {
  protected el: HTMLDsCardDataVizElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsCardDataViz extends Components.DsCardDataViz {}


@ProxyCmp({
  inputs: ['cardWidth', 'editing', 'heading']
})
@Component({
  selector: 'ds-card-setting',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['cardWidth', 'editing', { name: 'heading', required: true }],
  outputs: ['dsEditingChange'],
  standalone: false
})
export class DsCardSetting {
  protected el: HTMLDsCardSettingElement;
  @Output() dsEditingChange = new EventEmitter<CustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsCardSetting extends Components.DsCardSetting {
  /**
   * Emits when the user enters or exits edit mode.
   */
  dsEditingChange: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['data', 'height', 'width']
})
@Component({
  selector: 'ds-chart-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['data', 'height', 'width'],
  standalone: false
})
export class DsChartBar {
  protected el: HTMLDsChartBarElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsChartBar extends Components.DsChartBar {}


@ProxyCmp({
  inputs: ['activeLabel', 'centerCaption', 'centerValue', 'cornerRadius', 'data', 'gap', 'size', 'thickness']
})
@Component({
  selector: 'ds-chart-donut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeLabel', 'centerCaption', 'centerValue', 'cornerRadius', 'data', 'gap', 'size', 'thickness'],
  outputs: ['dsSliceHover'],
  standalone: false
})
export class DsChartDonut {
  protected el: HTMLDsChartDonutElement;
  @Output() dsSliceHover = new EventEmitter<CustomEvent<IDsChartDonutChartDatum | null>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { ChartDatum as IDsChartDonutChartDatum } from '@ds-mo/ui';

export declare interface DsChartDonut extends Components.DsChartDonut {
  /**
   * Fires with the hovered/focused slice's datum, or `null` on leave/blur.
   */
  dsSliceHover: EventEmitter<CustomEvent<IDsChartDonutChartDatum | null>>;
}


@ProxyCmp({
  inputs: ['activeLabel', 'direction', 'items', 'showPercentage']
})
@Component({
  selector: 'ds-chart-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeLabel', 'direction', 'items', 'showPercentage'],
  outputs: ['dsItemHover', 'dsItemClick'],
  standalone: false
})
export class DsChartLegend {
  protected el: HTMLDsChartLegendElement;
  @Output() dsItemHover = new EventEmitter<CustomEvent<IDsChartLegendChartLegendItem | null>>();
  @Output() dsItemClick = new EventEmitter<CustomEvent<{ item: IDsChartLegendChartLegendItem; originalEvent: MouseEvent }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { ChartLegendItem as IDsChartLegendChartLegendItem } from '@ds-mo/ui';

export declare interface DsChartLegend extends Components.DsChartLegend {
  /**
   * Fires on row hover/focus with the item, or `null` on leave/blur.
   */
  dsItemHover: EventEmitter<CustomEvent<IDsChartLegendChartLegendItem | null>>;
  /**
   * Fires when a deep-linkable row (`item.href` set) is activated.
   */
  dsItemClick: EventEmitter<CustomEvent<{ item: IDsChartLegendChartLegendItem; originalEvent: MouseEvent }>>;
}


@ProxyCmp({
  inputs: ['categories', 'height', 'series', 'showPoints', 'width']
})
@Component({
  selector: 'ds-chart-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['categories', 'height', 'series', 'showPoints', 'width'],
  standalone: false
})
export class DsChartLine {
  protected el: HTMLDsChartLineElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsChartLine extends Components.DsChartLine {}


@ProxyCmp({
  inputs: ['checked', 'indeterminate', 'isInactive', 'label']
})
@Component({
  selector: 'ds-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'indeterminate', 'isInactive', { name: 'label', required: true }],
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
  inputs: ['background', 'isInactive', 'label', 'maxWidth', 'removable', 'rounded', 'size', 'state']
})
@Component({
  selector: 'ds-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'isInactive', { name: 'label', required: true }, 'maxWidth', 'removable', 'rounded', 'size', 'state'],
  outputs: ['dsRemove'],
  standalone: false
})
export class DsChip {
  protected el: HTMLDsChipElement;
  @Output() dsRemove = new EventEmitter<CustomEvent<void>>();
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
  inputs: ['ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'autoFocus', 'error', 'errorMessage', 'inputId', 'isInactive', 'placeholder', 'type', 'value'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'autoFocus', 'error', 'errorMessage', 'inputId', 'isInactive', 'placeholder', 'type', 'value'],
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
  inputs: ['align', 'alignOffset', 'anchor', 'anchorId', 'initialFocusVisible', 'items', 'menuWidth', 'minWidth', 'open', 'sections', 'side', 'sideOffset']
})
@Component({
  selector: 'ds-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['align', 'alignOffset', 'anchor', 'anchorId', 'initialFocusVisible', 'items', 'menuWidth', 'minWidth', 'open', 'sections', 'side', 'sideOffset'],
  outputs: ['dsClose', 'dsSelect', 'dsGradientSelect'],
  standalone: false
})
export class DsMenu {
  protected el: HTMLDsMenuElement;
  @Output() dsClose = new EventEmitter<CustomEvent<void>>();
  @Output() dsSelect = new EventEmitter<CustomEvent<IDsMenuMenuItemData>>();
  @Output() dsGradientSelect = new EventEmitter<CustomEvent<IDsMenuShellGradientPreset>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { MenuItemData as IDsMenuMenuItemData } from '@ds-mo/ui';
import type { ShellGradientPreset as IDsMenuShellGradientPreset } from '@ds-mo/ui';

export declare interface DsMenu extends Components.DsMenu {

  dsClose: EventEmitter<CustomEvent<void>>;

  dsSelect: EventEmitter<CustomEvent<IDsMenuMenuItemData>>;
  /**
   * Emitted when a `gradient-picker` section swatch is chosen.
   */
  dsGradientSelect: EventEmitter<CustomEvent<IDsMenuShellGradientPreset>>;
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
  inputs: ['isInactive', 'page', 'siblingCount', 'totalPages']
})
@Component({
  selector: 'ds-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isInactive', 'page', 'siblingCount', 'totalPages'],
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
  inputs: ['activeId', 'breakpoint', 'collapsed', 'currentUrl', 'disableViewTransition', 'groups', 'navStyle', 'routerMode', 'storageKey', 'userInitial', 'userName'],
  methods: ['toggleCollapsed']
})
@Component({
  selector: 'ds-panel-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeId', 'breakpoint', 'collapsed', 'currentUrl', 'disableViewTransition', 'groups', 'navStyle', 'routerMode', 'storageKey', 'userInitial', 'userName'],
  outputs: ['dsNavSelect', 'dsNavToggle', 'dsChromeTransitionStart', 'dsChromeTransitionEnd', 'dsNavFooterAction', 'dsNavUserAction'],
  standalone: false
})
export class DsPanelNav {
  protected el: HTMLDsPanelNavElement;
  @Output() dsNavSelect = new EventEmitter<CustomEvent<string>>();
  @Output() dsNavToggle = new EventEmitter<CustomEvent<boolean>>();
  @Output() dsChromeTransitionStart = new EventEmitter<CustomEvent<IDsPanelNavChromeTransitionDetail>>();
  @Output() dsChromeTransitionEnd = new EventEmitter<CustomEvent<IDsPanelNavChromeTransitionDetail>>();
  @Output() dsNavFooterAction = new EventEmitter<CustomEvent<void>>();
  @Output() dsNavUserAction = new EventEmitter<CustomEvent<IDsPanelNavPanelNavUserActionDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { ChromeTransitionDetail as IDsPanelNavChromeTransitionDetail } from '@ds-mo/ui';
import type { PanelNavUserActionDetail as IDsPanelNavPanelNavUserActionDetail } from '@ds-mo/ui';

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
   * Bubbling lifecycle — `ds-app-shell` pauses chrome metrics during width motion.
   */
  dsChromeTransitionStart: EventEmitter<CustomEvent<IDsPanelNavChromeTransitionDetail>>;

  dsChromeTransitionEnd: EventEmitter<CustomEvent<IDsPanelNavChromeTransitionDetail>>;
  /**
   * Emitted when the footer left button (gear / dashboard) is clicked.
   */
  dsNavFooterAction: EventEmitter<CustomEvent<void>>;
  /**
   * Emitted when the footer user button is clicked. Detail includes the anchor for `ds-menu`.
   */
  dsNavUserAction: EventEmitter<CustomEvent<IDsPanelNavPanelNavUserActionDetail>>;
}


@ProxyCmp({
  inputs: ['activeTool', 'items', 'itemsJson', 'open'],
  methods: ['activateTool', 'closeDrawer']
})
@Component({
  selector: 'ds-panel-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeTool', 'items', 'itemsJson', 'open'],
  outputs: ['dsToolChange', 'dsChromeTransitionStart', 'dsChromeTransitionEnd'],
  standalone: false
})
export class DsPanelTools {
  protected el: HTMLDsPanelToolsElement;
  @Output() dsToolChange = new EventEmitter<CustomEvent<{ id: IDsPanelToolsPanelToolsToolId; selected: boolean; }>>();
  @Output() dsChromeTransitionStart = new EventEmitter<CustomEvent<IDsPanelToolsChromeTransitionDetail>>();
  @Output() dsChromeTransitionEnd = new EventEmitter<CustomEvent<IDsPanelToolsChromeTransitionDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { PanelToolsToolId as IDsPanelToolsPanelToolsToolId } from '@ds-mo/ui';
import type { ChromeTransitionDetail as IDsPanelToolsChromeTransitionDetail } from '@ds-mo/ui';

export declare interface DsPanelTools extends Components.DsPanelTools {
  /**
   * Emitted when a rail button is toggled. Detail = { id, selected }.
   */
  dsToolChange: EventEmitter<CustomEvent<{ id: IDsPanelToolsPanelToolsToolId; selected: boolean; }>>;
  /**
   * Bubbling lifecycle — `ds-bar-nav` defers overflow checks during drawer motion.
   */
  dsChromeTransitionStart: EventEmitter<CustomEvent<IDsPanelToolsChromeTransitionDetail>>;

  dsChromeTransitionEnd: EventEmitter<CustomEvent<IDsPanelToolsChromeTransitionDetail>>;
}


@ProxyCmp({
  inputs: ['ariaLabel', 'ariaLabelledby', 'direction', 'isInactive', 'options', 'value']
})
@Component({
  selector: 'ds-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'direction', 'isInactive', 'options', 'value'],
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
  inputs: ['ariaLabel', 'ariaLabelledby', 'isInactive', 'options', 'placeholder', 'value']
})
@Component({
  selector: 'ds-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'isInactive', 'options', 'placeholder', 'value'],
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
  inputs: ['value']
})
@Component({
  selector: 'ds-shell-gradient-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['value'],
  outputs: ['dsChange'],
  standalone: false
})
export class DsShellGradientPicker {
  protected el: HTMLDsShellGradientPickerElement;
  @Output() dsChange = new EventEmitter<CustomEvent<IDsShellGradientPickerShellGradientPreset>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { ShellGradientPreset as IDsShellGradientPickerShellGradientPreset } from '@ds-mo/ui';

export declare interface DsShellGradientPicker extends Components.DsShellGradientPicker {

  dsChange: EventEmitter<CustomEvent<IDsShellGradientPickerShellGradientPreset>>;
}


@ProxyCmp({
  inputs: ['ariaLabel', 'isInactive', 'preset', 'selected']
})
@Component({
  selector: 'ds-shell-gradient-swatch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'isInactive', 'preset', 'selected'],
  outputs: ['dsSelect'],
  standalone: false
})
export class DsShellGradientSwatch {
  protected el: HTMLDsShellGradientSwatchElement;
  @Output() dsSelect = new EventEmitter<CustomEvent<IDsShellGradientSwatchShellGradientPreset>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { ShellGradientPreset as IDsShellGradientSwatchShellGradientPreset } from '@ds-mo/ui';

export declare interface DsShellGradientSwatch extends Components.DsShellGradientSwatch {

  dsSelect: EventEmitter<CustomEvent<IDsShellGradientSwatchShellGradientPreset>>;
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
  inputs: ['inputId', 'isInactive', 'label', 'max', 'min', 'step', 'value', 'valueText']
})
@Component({
  selector: 'ds-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['inputId', 'isInactive', { name: 'label', required: true }, 'max', 'min', 'step', 'value', 'valueText'],
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
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'orientation', 'rovingEnabled', 'selectionFollowsFocus', 'tabs', 'value'],
  methods: ['focusTab', 'focusLastTab', 'focusFirstTab']
})
@Component({
  selector: 'ds-tab-group-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'orientation', 'rovingEnabled', 'selectionFollowsFocus', 'tabs', 'value'],
  outputs: ['dsChange', 'dsRovingExit'],
  standalone: false
})
export class DsTabGroupNav {
  protected el: HTMLDsTabGroupNavElement;
  @Output() dsChange = new EventEmitter<CustomEvent<string>>();
  @Output() dsRovingExit = new EventEmitter<CustomEvent<'start' | 'end'>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTabGroupNav extends Components.DsTabGroupNav {

  dsChange: EventEmitter<CustomEvent<string>>;
  /**
   * Fired when arrow navigation reaches the first/last tab in manual selection mode.
   */
  dsRovingExit: EventEmitter<CustomEvent<'start' | 'end'>>;
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
  inputs: ['contrast', 'intent', 'label', 'maxWidth', 'rounded', 'size']
})
@Component({
  selector: 'ds-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['contrast', 'intent', { name: 'label', required: true }, 'maxWidth', 'rounded', 'size'],
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
  inputs: ['checked', 'isInactive']
})
@Component({
  selector: 'ds-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'isInactive'],
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
  inputs: ['align', 'alignOffset', 'delay', 'label', 'shortcutKey', 'shortcutKeyPosition', 'side', 'sideOffset', 'size']
})
@Component({
  selector: 'ds-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['align', 'alignOffset', 'delay', { name: 'label', required: true }, 'shortcutKey', 'shortcutKeyPosition', 'side', 'sideOffset', 'size'],
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


@ProxyCmp({
  inputs: ['delay', 'label', 'value', 'x', 'y']
})
@Component({
  selector: 'ds-tooltip-data-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['delay', 'label', 'value', 'x', 'y'],
  standalone: false
})
export class DsTooltipDataViz {
  protected el: HTMLDsTooltipDataVizElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTooltipDataViz extends Components.DsTooltipDataViz {}


