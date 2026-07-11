/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsChartLine } from '@ds-mo/ui/components/ds-chart-line.js';

@ProxyCmp({
  defineCustomElementFn: defineDsChartLine,
  inputs: ['categories', 'height', 'series', 'showPoints', 'width']
})
@Component({
  selector: 'ds-chart-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['categories', 'height', 'series', 'showPoints', 'width'],
})
export class DsChartLine {
  protected el: HTMLDsChartLineElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsChartLine extends Components.DsChartLine {}


