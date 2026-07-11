/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsField } from '@ds-mo/ui/components/ds-field.js';

@ProxyCmp({
  defineCustomElementFn: defineDsField,
  inputs: ['fieldId', 'label']
})
@Component({
  selector: 'ds-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['fieldId', { name: 'label', required: true }],
})
export class DsField {
  protected el: HTMLDsFieldElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsField extends Components.DsField {}


