/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsCheckbox } from '@ds-mo/ui/components/ds-checkbox.js';

@ProxyCmp({
  defineCustomElementFn: defineDsCheckbox,
  inputs: ['checked', 'disabled', 'indeterminate', 'isInactive', 'label', 'name', 'required', 'requiredMessage', 'value']
})
@Component({
  selector: 'ds-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'disabled', 'indeterminate', 'isInactive', { name: 'label', required: true }, 'name', 'required', 'requiredMessage', 'value'],
  outputs: ['dsChange'],
})
export class DsCheckbox {
  protected el: HTMLDsCheckboxElement;
  @Output() dsChange = new EventEmitter<DsCheckboxCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsCheckboxCustomEvent } from '@ds-mo/ui/components';

export declare interface DsCheckbox extends Components.DsCheckbox {

  dsChange: EventEmitter<DsCheckboxCustomEvent<boolean>>;
}


