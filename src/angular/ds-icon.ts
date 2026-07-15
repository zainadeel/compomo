/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsIcon } from '@ds-mo/ui/components/ds-icon.js';

@ProxyCmp({
  defineCustomElementFn: defineDsIcon,
  inputs: ['color', 'label', 'name', 'size']
})
@Component({
  selector: 'ds-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['color', 'label', 'name', 'size'],
})
export class DsIcon {
  protected el: HTMLDsIconElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsIcon extends Components.DsIcon {}


