/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsChartBar } from '@ds-mo/ui/components/ds-chart-bar.js';

@ProxyCmp({
  defineCustomElementFn: defineDsChartBar,
  inputs: ['data', 'height', 'width']
})
@Component({
  selector: 'ds-chart-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['data', 'height', 'width'],
})
export class DsChartBar {
  protected el: HTMLDsChartBarElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsChartBar extends Components.DsChartBar {}


