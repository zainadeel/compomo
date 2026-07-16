/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsEmptyState } from '@ds-mo/ui/components/ds-empty-state.js';

@ProxyCmp({
  defineCustomElementFn: defineDsEmptyState,
  inputs: ['body', 'heading', 'icon']
})
@Component({
  selector: 'ds-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['body', 'heading', 'icon'],
})
export class DsEmptyState {
  protected el: HTMLDsEmptyStateElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsEmptyState extends Components.DsEmptyState {}


