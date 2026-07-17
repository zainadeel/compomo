/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsSwatchPicker } from '@ds-mo/ui/components/ds-swatch-picker.js';

@ProxyCmp({
  defineCustomElementFn: defineDsSwatchPicker,
  inputs: ['groupLabel', 'options', 'sections', 'value']
})
@Component({
  selector: 'ds-swatch-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['groupLabel', 'options', 'sections', 'value'],
  outputs: ['dsChange'],
})
export class DsSwatchPicker {
  protected el: HTMLDsSwatchPickerElement;
  @Output() dsChange = new EventEmitter<DsSwatchPickerCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsSwatchPickerCustomEvent } from '@ds-mo/ui/components';

export declare interface DsSwatchPicker extends Components.DsSwatchPicker {

  dsChange: EventEmitter<DsSwatchPickerCustomEvent<string>>;
}


