/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsCardDataVizDonut } from '@ds-mo/ui/components/ds-card-data-viz-donut.js';

@ProxyCmp({
  defineCustomElementFn: defineDsCardDataVizDonut,
  inputs: ['cardWidth', 'filterLabel', 'heading']
})
@Component({
  selector: 'ds-card-data-viz-donut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['cardWidth', 'filterLabel', { name: 'heading', required: true }],
  outputs: ['dsFilterClick'],
})
export class DsCardDataVizDonut {
  protected el: HTMLDsCardDataVizDonutElement;
  @Output() dsFilterClick = new EventEmitter<DsCardDataVizDonutCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsCardDataVizDonutCustomEvent } from '@ds-mo/ui/components';

export declare interface DsCardDataVizDonut extends Components.DsCardDataVizDonut {
  /**
   * Emits when the header filter control is activated.
   */
  dsFilterClick: EventEmitter<DsCardDataVizDonutCustomEvent<void>>;
}


