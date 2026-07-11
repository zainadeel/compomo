/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsModal } from '@ds-mo/ui/components/ds-modal.js';

@ProxyCmp({
  defineCustomElementFn: defineDsModal,
  inputs: ['heading', 'modalWidth', 'open', 'subtitle']
})
@Component({
  selector: 'ds-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [{ name: 'heading', required: true }, 'modalWidth', 'open', 'subtitle'],
  outputs: ['dsClose'],
})
export class DsModal {
  protected el: HTMLDsModalElement;
  @Output() dsClose = new EventEmitter<DsModalCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsModalCustomEvent } from '@ds-mo/ui/components';

export declare interface DsModal extends Components.DsModal {

  dsClose: EventEmitter<DsModalCustomEvent<void>>;
}


