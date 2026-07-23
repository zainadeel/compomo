/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsChartBarStacked } from '@ds-mo/ui/components/ds-chart-bar-stacked.js';

@ProxyCmp({
  defineCustomElementFn: defineDsChartBarStacked,
  inputs: ['categories', 'height', 'series', 'variant', 'width']
})
@Component({
  selector: 'ds-chart-bar-stacked',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['categories', 'height', 'series', 'variant', 'width'],
})
export class DsChartBarStacked {
  protected el: HTMLDsChartBarStackedElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsChartBarStacked extends Components.DsChartBarStacked {}


