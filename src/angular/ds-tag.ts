/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsTag } from '@ds-mo/ui/components/ds-tag.js';

@ProxyCmp({
  defineCustomElementFn: defineDsTag,
  inputs: ['contrast', 'intent', 'label', 'maxWidth', 'rounded', 'size']
})
@Component({
  selector: 'ds-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['contrast', 'intent', { name: 'label', required: true }, 'maxWidth', 'rounded', 'size'],
})
export class DsTag {
  protected el: HTMLDsTagElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTag extends Components.DsTag {}


