/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsSwitch } from '@ds-mo/ui/components/ds-switch.js';

@ProxyCmp({
  defineCustomElementFn: defineDsSwitch,
  inputs: ['checked', 'disabled', 'form', 'isInactive', 'name', 'presentation', 'readOnly', 'required', 'requiredMessage', 'size', 'uncheckedValue', 'value']
})
@Component({
  selector: 'ds-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'disabled', 'form', 'isInactive', 'name', 'presentation', 'readOnly', 'required', 'requiredMessage', 'size', 'uncheckedValue', 'value'],
  outputs: ['dsChange'],
})
export class DsSwitch {
  protected el: HTMLDsSwitchElement;
  @Output() dsChange = new EventEmitter<DsSwitchCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsSwitchCustomEvent } from '@ds-mo/ui/components';

export declare interface DsSwitch extends Components.DsSwitch {

  dsChange: EventEmitter<DsSwitchCustomEvent<boolean>>;
}


