/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsToast } from '@ds-mo/ui/components/ds-toast.js';

@ProxyCmp({
  defineCustomElementFn: defineDsToast,
  inputs: ['closeLabel', 'label', 'limit', 'manager', 'swipeDirections', 'timeout']
})
@Component({
  selector: 'ds-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['closeLabel', 'label', 'limit', 'manager', 'swipeDirections', 'timeout'],
  outputs: ['dsToastClose', 'dsToastRemove', 'dsToastAction'],
})
export class DsToast {
  protected el: HTMLDsToastElement;
  @Output() dsToastClose = new EventEmitter<DsToastCustomEvent<IDsToastToastCloseEventDetail>>();
  @Output() dsToastRemove = new EventEmitter<DsToastCustomEvent<IDsToastToastEventDetail>>();
  @Output() dsToastAction = new EventEmitter<DsToastCustomEvent<IDsToastToastActionEventDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsToastCustomEvent } from '@ds-mo/ui/components';
import type { ToastCloseEventDetail as IDsToastToastCloseEventDetail } from '@ds-mo/ui/components';
import type { ToastEventDetail as IDsToastToastEventDetail } from '@ds-mo/ui/components';
import type { ToastActionEventDetail as IDsToastToastActionEventDetail } from '@ds-mo/ui/components';

export declare interface DsToast extends Components.DsToast {

  dsToastClose: EventEmitter<DsToastCustomEvent<IDsToastToastCloseEventDetail>>;

  dsToastRemove: EventEmitter<DsToastCustomEvent<IDsToastToastEventDetail>>;

  dsToastAction: EventEmitter<DsToastCustomEvent<IDsToastToastActionEventDetail>>;
}


