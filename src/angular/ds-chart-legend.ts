/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsChartLegend } from '@ds-mo/ui/components/ds-chart-legend.js';

@ProxyCmp({
  defineCustomElementFn: defineDsChartLegend,
  inputs: ['activeLabel', 'direction', 'items', 'locale', 'showPercentage']
})
@Component({
  selector: 'ds-chart-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeLabel', 'direction', 'items', 'locale', 'showPercentage'],
  outputs: ['dsItemHover', 'dsItemClick'],
})
export class DsChartLegend {
  protected el: HTMLDsChartLegendElement;
  @Output() dsItemHover = new EventEmitter<DsChartLegendCustomEvent<IDsChartLegendChartLegendItem | null>>();
  @Output() dsItemClick = new EventEmitter<DsChartLegendCustomEvent<{ item: IDsChartLegendChartLegendItem; originalEvent: MouseEvent }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsChartLegendCustomEvent } from '@ds-mo/ui/components';
import type { ChartLegendItem as IDsChartLegendChartLegendItem } from '@ds-mo/ui/components';

export declare interface DsChartLegend extends Components.DsChartLegend {
  /**
   * Fires on row hover/focus with the item, or `null` on leave/blur.
   */
  dsItemHover: EventEmitter<DsChartLegendCustomEvent<IDsChartLegendChartLegendItem | null>>;
  /**
   * Fires when a deep-linkable row (`item.href` set) is activated.
   */
  dsItemClick: EventEmitter<DsChartLegendCustomEvent<{ item: IDsChartLegendChartLegendItem; originalEvent: MouseEvent }>>;
}


