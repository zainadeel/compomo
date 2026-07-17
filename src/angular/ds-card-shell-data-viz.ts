/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsCardShellDataViz } from '@ds-mo/ui/components/ds-card-shell-data-viz.js';

@ProxyCmp({
  defineCustomElementFn: defineDsCardShellDataViz,
  inputs: ['cardWidth', 'heading']
})
@Component({
  selector: 'ds-card-shell-data-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['cardWidth', { name: 'heading', required: true }],
})
export class DsCardShellDataViz {
  protected el: HTMLDsCardShellDataVizElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsCardShellDataViz extends Components.DsCardShellDataViz {}


