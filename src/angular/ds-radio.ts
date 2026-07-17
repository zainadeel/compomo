/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsRadio } from '@ds-mo/ui/components/ds-radio.js';

@ProxyCmp({
  defineCustomElementFn: defineDsRadio,
  inputs: ['ariaLabel', 'ariaLabelledby', 'direction', 'disabled', 'form', 'isInactive', 'name', 'options', 'required', 'requiredMessage', 'size', 'value']
})
@Component({
  selector: 'ds-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'direction', 'disabled', 'form', 'isInactive', 'name', 'options', 'required', 'requiredMessage', 'size', 'value'],
  outputs: ['dsChange'],
})
export class DsRadio {
  protected el: HTMLDsRadioElement;
  @Output() dsChange = new EventEmitter<DsRadioCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsRadioCustomEvent } from '@ds-mo/ui/components';

export declare interface DsRadio extends Components.DsRadio {
  /**
   * Emitted after user selection with the selected option value.
   */
  dsChange: EventEmitter<DsRadioCustomEvent<string>>;
}


