/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsShellPage } from '@ds-mo/ui/components/ds-shell-page.js';

@ProxyCmp({
  defineCustomElementFn: defineDsShellPage,
  inputs: ['contentInset', 'headerCapacity', 'headerPresentation']
})
@Component({
  selector: 'ds-shell-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['contentInset', 'headerCapacity', 'headerPresentation'],
})
export class DsShellPage {
  protected el: HTMLDsShellPageElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsShellPage extends Components.DsShellPage {}


