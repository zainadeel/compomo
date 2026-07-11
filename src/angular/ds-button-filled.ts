/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsButtonFilled } from '@ds-mo/ui/components/ds-button-filled.js';

@ProxyCmp({
  defineCustomElementFn: defineDsButtonFilled,
  inputs: ['ariaLabel', 'contrast', 'icon', 'intent', 'isInactive', 'label', 'size', 'type', 'variant', 'width'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-button-filled',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'contrast', 'icon', 'intent', 'isInactive', 'label', 'size', 'type', 'variant', 'width'],
  outputs: ['dsClick'],
})
export class DsButtonFilled {
  protected el: HTMLDsButtonFilledElement;
  @Output() dsClick = new EventEmitter<DsButtonFilledCustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsButtonFilledCustomEvent } from '@ds-mo/ui/components';

export declare interface DsButtonFilled extends Components.DsButtonFilled {

  dsClick: EventEmitter<DsButtonFilledCustomEvent<MouseEvent>>;
}


