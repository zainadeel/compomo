/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsRadioGroup } from '@ds-mo/ui/components/ds-radio-group.js';

@ProxyCmp({
  defineCustomElementFn: defineDsRadioGroup,
  inputs: ['ariaLabel', 'ariaLabelledby', 'direction', 'disabled', 'isInactive', 'name', 'options', 'required', 'requiredMessage', 'value']
})
@Component({
  selector: 'ds-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'direction', 'disabled', 'isInactive', 'name', 'options', 'required', 'requiredMessage', 'value'],
  outputs: ['dsChange'],
})
export class DsRadioGroup {
  protected el: HTMLDsRadioGroupElement;
  @Output() dsChange = new EventEmitter<DsRadioGroupCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsRadioGroupCustomEvent } from '@ds-mo/ui/components';

export declare interface DsRadioGroup extends Components.DsRadioGroup {

  dsChange: EventEmitter<DsRadioGroupCustomEvent<string>>;
}


