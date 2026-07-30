/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsCardOverview } from '@ds-mo/ui/components/ds-card-overview.js';

@ProxyCmp({
  defineCustomElementFn: defineDsCardOverview,
  inputs: ['comparisonLabel', 'isLoading', 'layout', 'metricMinWidth', 'metrics', 'overviewLabel', 'periodLabel', 'score', 'scoreErrorMessage', 'scrollCollapseProgress', 'variant']
})
@Component({
  selector: 'ds-card-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['comparisonLabel', 'isLoading', 'layout', 'metricMinWidth', 'metrics', 'overviewLabel', 'periodLabel', 'score', 'scoreErrorMessage', 'scrollCollapseProgress', 'variant'],
  outputs: ['dsMetricSelect'],
})
export class DsCardOverview {
  protected el: HTMLDsCardOverviewElement;
  @Output() dsMetricSelect = new EventEmitter<DsCardOverviewCustomEvent<IDsCardOverviewOverviewMetric>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsCardOverviewCustomEvent } from '@ds-mo/ui/components';
import type { OverviewMetric as IDsCardOverviewOverviewMetric } from '@ds-mo/ui/components';

export declare interface DsCardOverview extends Components.DsCardOverview {
  /**
   * Emitted when a metric that is not inactive is activated.
   */
  dsMetricSelect: EventEmitter<DsCardOverviewCustomEvent<IDsCardOverviewOverviewMetric>>;
}


