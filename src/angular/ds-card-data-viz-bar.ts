/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsCardDataVizBar } from '@ds-mo/ui/components/ds-card-data-viz-bar.js';

@ProxyCmp({
  defineCustomElementFn: defineDsCardDataVizBar,
  inputs: ['cardWidth', 'filterLabel', 'heading']
})
@Component({
  selector: 'ds-card-data-viz-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['cardWidth', 'filterLabel', { name: 'heading', required: true }],
  outputs: ['dsFilterClick'],
})
export class DsCardDataVizBar {
  protected el: HTMLDsCardDataVizBarElement;
  @Output() dsFilterClick = new EventEmitter<DsCardDataVizBarCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsCardDataVizBarCustomEvent } from '@ds-mo/ui/components';

export declare interface DsCardDataVizBar extends Components.DsCardDataVizBar {
  /**
   * Emits when the header filter control is activated.
   */
  dsFilterClick: EventEmitter<DsCardDataVizBarCustomEvent<void>>;
}


