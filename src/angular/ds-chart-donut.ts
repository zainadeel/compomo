/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsChartDonut } from '@ds-mo/ui/components/ds-chart-donut.js';

@ProxyCmp({
  defineCustomElementFn: defineDsChartDonut,
  inputs: ['activeLabel', 'centerCaption', 'centerValue', 'cornerRadius', 'data', 'gap', 'locale', 'noDataLabel', 'size', 'thickness']
})
@Component({
  selector: 'ds-chart-donut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeLabel', 'centerCaption', 'centerValue', 'cornerRadius', 'data', 'gap', 'locale', 'noDataLabel', 'size', 'thickness'],
  outputs: ['dsSliceHover'],
})
export class DsChartDonut {
  protected el: HTMLDsChartDonutElement;
  @Output() dsSliceHover = new EventEmitter<DsChartDonutCustomEvent<IDsChartDonutChartDatum | null>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsChartDonutCustomEvent } from '@ds-mo/ui/components';
import type { ChartDatum as IDsChartDonutChartDatum } from '@ds-mo/ui/components';

export declare interface DsChartDonut extends Components.DsChartDonut {
  /**
   * Fires with the hovered/focused slice's datum, or `null` on leave/blur.
   */
  dsSliceHover: EventEmitter<DsChartDonutCustomEvent<IDsChartDonutChartDatum | null>>;
}


