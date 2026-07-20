/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsModal } from '@ds-mo/ui/components/ds-modal.js';

@ProxyCmp({
  defineCustomElementFn: defineDsModal,
  inputs: ['ariaDescribedby', 'closeAriaLabel', 'heading', 'modalWidth', 'open']
})
@Component({
  selector: 'ds-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaDescribedby', 'closeAriaLabel', { name: 'heading', required: true }, 'modalWidth', 'open'],
  outputs: ['dsClose', 'dsAfterClose'],
})
export class DsModal {
  protected el: HTMLDsModalElement;
  @Output() dsClose = new EventEmitter<DsModalCustomEvent<IDsModalModalCloseDetail>>();
  @Output() dsAfterClose = new EventEmitter<DsModalCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsModalCustomEvent } from '@ds-mo/ui/components';
import type { ModalCloseDetail as IDsModalModalCloseDetail } from '@ds-mo/ui/components';

export declare interface DsModal extends Components.DsModal {
  /**
   * Emitted when an internal dismissal control requests that the modal close.
   */
  dsClose: EventEmitter<DsModalCustomEvent<IDsModalModalCloseDetail>>;
  /**
   * Emitted after exit motion completes, the top layer closes, and focus is restored.
   */
  dsAfterClose: EventEmitter<DsModalCustomEvent<void>>;
}


