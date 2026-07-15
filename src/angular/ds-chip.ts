/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsChip } from '@ds-mo/ui/components/ds-chip.js';

@ProxyCmp({
  defineCustomElementFn: defineDsChip,
  inputs: ['isInactive', 'label', 'maxWidth', 'removeLabel', 'rounded', 'size', 'state']
})
@Component({
  selector: 'ds-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isInactive', { name: 'label', required: true }, 'maxWidth', 'removeLabel', 'rounded', 'size', 'state'],
  outputs: ['dsRemove'],
})
export class DsChip {
  protected el: HTMLDsChipElement;
  @Output() dsRemove = new EventEmitter<DsChipCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsChipCustomEvent } from '@ds-mo/ui/components';

export declare interface DsChip extends Components.DsChip {
  /**
   * Fired when the remove button is clicked.
   */
  dsRemove: EventEmitter<DsChipCustomEvent<void>>;
}


