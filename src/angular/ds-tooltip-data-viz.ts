/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsTooltipDataViz } from '@ds-mo/ui/components/ds-tooltip-data-viz.js';

@ProxyCmp({
  defineCustomElementFn: defineDsTooltipDataViz,
  inputs: ['delay', 'label', 'value', 'x', 'y']
})
@Component({
  selector: 'ds-tooltip-data-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['delay', 'label', 'value', 'x', 'y'],
})
export class DsTooltipDataViz {
  protected el: HTMLDsTooltipDataVizElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTooltipDataViz extends Components.DsTooltipDataViz {}


