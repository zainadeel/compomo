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
  inputs: ['count', 'isSelected', 'label']
})
@Component({
  selector: 'ds-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['count', 'isSelected', 'label'],
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
  inputs: ['orientation']
})
@Component({
  selector: 'ds-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['orientation'],
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
  inputs: ['background', 'height', 'side']
})
@Component({
  selector: 'ds-fade',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'height', { name: 'side', required: true }],
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
  inputs: ['collapsed', 'mobile', 'resizable', 'width']
})
@Component({
  selector: 'ds-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['collapsed', 'mobile', 'resizable', 'width'],
  outputs: ['dsToggle', 'dsWidthChange'],
  standalone: false
})
export class DsSidebar {
  protected el: HTMLDsSidebarElement;
  @Output() dsToggle = new EventEmitter<CustomEvent<void>>();
  @Output() dsWidthChange = new EventEmitter<CustomEvent<IDsSidebarSidebarWidth>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { SidebarWidth as IDsSidebarSidebarWidth } from '@ds-mo/ui';

export declare interface DsSidebar extends Components.DsSidebar {

  dsToggle: EventEmitter<CustomEvent<void>>;

  dsWidthChange: EventEmitter<CustomEvent<IDsSidebarSidebarWidth>>;
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
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'tabs', 'value']
})
@Component({
  selector: 'ds-tab-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'tabs', 'value'],
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
  inputs: ['background', 'contrast', 'elevation', 'inactive', 'intent', 'interactive', 'label', 'maxWidth', 'pressed', 'removable', 'rounded', 'size']
})
@Component({
  selector: 'ds-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'contrast', 'elevation', 'inactive', 'intent', 'interactive', { name: 'label', required: true }, 'maxWidth', 'pressed', 'removable', 'rounded', 'size'],
  outputs: ['dsRemove', 'dsClick', 'dsPressedChange'],
  standalone: false
})
export class DsTag {
  protected el: HTMLDsTagElement;
  @Output() dsRemove = new EventEmitter<CustomEvent<void>>();
  @Output() dsClick = new EventEmitter<CustomEvent<void>>();
  @Output() dsPressedChange = new EventEmitter<CustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTag extends Components.DsTag {
  /**
   * Fired when the remove button is clicked.
   */
  dsRemove: EventEmitter<CustomEvent<void>>;
  /**
   * Fired when an interactive tag is clicked.
   */
  dsClick: EventEmitter<CustomEvent<void>>;
  /**
   * Fired when the pressed state toggles.
   */
  dsPressedChange: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['align', 'as', 'color', 'decoration', 'for', 'italic', 'lineTruncation', 'variant', 'wrap']
})
@Component({
  selector: 'ds-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['align', 'as', 'color', 'decoration', 'for', 'italic', 'lineTruncation', 'variant', 'wrap'],
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


