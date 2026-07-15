/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsSkeleton } from '@ds-mo/ui/components/ds-skeleton.js';

@ProxyCmp({
  defineCustomElementFn: defineDsSkeleton,
  inputs: ['background', 'controlSize', 'iconSize', 'rounded', 'shimmer', 'textVariant', 'variant', 'width']
})
@Component({
  selector: 'ds-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'controlSize', 'iconSize', 'rounded', 'shimmer', 'textVariant', 'variant', 'width'],
})
export class DsSkeleton {
  protected el: HTMLDsSkeletonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsSkeleton extends Components.DsSkeleton {}


