/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import { Components } from '@ds-mo/ui';


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


