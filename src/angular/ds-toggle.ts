/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsToggle } from '@ds-mo/ui/components/ds-toggle.js';

@ProxyCmp({
  defineCustomElementFn: defineDsToggle,
  inputs: ['checked', 'disabled', 'isInactive', 'name', 'required', 'requiredMessage', 'value']
})
@Component({
  selector: 'ds-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'disabled', 'isInactive', 'name', 'required', 'requiredMessage', 'value'],
  outputs: ['dsChange'],
})
export class DsToggle {
  protected el: HTMLDsToggleElement;
  @Output() dsChange = new EventEmitter<DsToggleCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsToggleCustomEvent } from '@ds-mo/ui/components';

export declare interface DsToggle extends Components.DsToggle {

  dsChange: EventEmitter<DsToggleCustomEvent<boolean>>;
}


