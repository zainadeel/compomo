/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsDivider } from '@ds-mo/ui/components/ds-divider.js';

@ProxyCmp({
  defineCustomElementFn: defineDsDivider,
  inputs: ['inset', 'length', 'orientation', 'semantic', 'surface']
})
@Component({
  selector: 'ds-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['inset', 'length', 'orientation', 'semantic', 'surface'],
})
export class DsDivider {
  protected el: HTMLDsDividerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsDivider extends Components.DsDivider {}


