/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsCardDataVizLine } from '@ds-mo/ui/components/ds-card-data-viz-line.js';

@ProxyCmp({
  defineCustomElementFn: defineDsCardDataVizLine,
  inputs: ['cardWidth', 'filterLabel', 'heading']
})
@Component({
  selector: 'ds-card-data-viz-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['cardWidth', 'filterLabel', { name: 'heading', required: true }],
  outputs: ['dsFilterClick'],
})
export class DsCardDataVizLine {
  protected el: HTMLDsCardDataVizLineElement;
  @Output() dsFilterClick = new EventEmitter<DsCardDataVizLineCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsCardDataVizLineCustomEvent } from '@ds-mo/ui/components';

export declare interface DsCardDataVizLine extends Components.DsCardDataVizLine {
  /**
   * Emits when the header filter control is activated.
   */
  dsFilterClick: EventEmitter<DsCardDataVizLineCustomEvent<void>>;
}


