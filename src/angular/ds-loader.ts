/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsLoader } from '@ds-mo/ui/components/ds-loader.js';

@ProxyCmp({
  defineCustomElementFn: defineDsLoader,
  inputs: ['color', 'label', 'size']
})
@Component({
  selector: 'ds-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['color', 'label', 'size'],
})
export class DsLoader {
  protected el: HTMLDsLoaderElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsLoader extends Components.DsLoader {}


