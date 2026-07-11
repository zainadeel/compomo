/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsCard } from '@ds-mo/ui/components/ds-card.js';

@ProxyCmp({
  defineCustomElementFn: defineDsCard,
  inputs: ['appearance', 'cardWidth', 'heading']
})
@Component({
  selector: 'ds-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['appearance', 'cardWidth', { name: 'heading', required: true }],
})
export class DsCard {
  protected el: HTMLDsCardElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsCard extends Components.DsCard {}


