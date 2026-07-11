/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsSlider } from '@ds-mo/ui/components/ds-slider.js';

@ProxyCmp({
  defineCustomElementFn: defineDsSlider,
  inputs: ['inputId', 'isInactive', 'label', 'max', 'min', 'step', 'value', 'valueText']
})
@Component({
  selector: 'ds-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['inputId', 'isInactive', { name: 'label', required: true }, 'max', 'min', 'step', 'value', 'valueText'],
  outputs: ['dsChange'],
})
export class DsSlider {
  protected el: HTMLDsSliderElement;
  @Output() dsChange = new EventEmitter<DsSliderCustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsSliderCustomEvent } from '@ds-mo/ui/components';

export declare interface DsSlider extends Components.DsSlider {

  dsChange: EventEmitter<DsSliderCustomEvent<number>>;
}


