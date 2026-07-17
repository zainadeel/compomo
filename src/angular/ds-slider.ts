/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsSlider } from '@ds-mo/ui/components/ds-slider.js';

@ProxyCmp({
  defineCustomElementFn: defineDsSlider,
  inputs: ['ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'disabled', 'endLabel', 'form', 'formatOptions', 'inputId', 'isInactive', 'label', 'locale', 'max', 'min', 'minStepsBetweenValues', 'name', 'orientation', 'rangeSeparator', 'readOnly', 'showValue', 'size', 'startLabel', 'step', 'thumbAlignment', 'value', 'valuePrefix', 'valueSuffix', 'valueText', 'valueTexts'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'disabled', 'endLabel', 'form', 'formatOptions', 'inputId', 'isInactive', 'label', 'locale', 'max', 'min', 'minStepsBetweenValues', 'name', 'orientation', 'rangeSeparator', 'readOnly', 'showValue', 'size', 'startLabel', 'step', 'thumbAlignment', 'value', 'valuePrefix', 'valueSuffix', 'valueText', 'valueTexts'],
  outputs: ['dsChange', 'dsCommit'],
})
export class DsSlider {
  protected el: HTMLDsSliderElement;
  @Output() dsChange = new EventEmitter<DsSliderCustomEvent<IDsSliderSliderValue>>();
  @Output() dsCommit = new EventEmitter<DsSliderCustomEvent<IDsSliderSliderValue>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsSliderCustomEvent } from '@ds-mo/ui/components';
import type { SliderValue as IDsSliderSliderValue } from '@ds-mo/ui/components';

export declare interface DsSlider extends Components.DsSlider {
  /**
   * Emitted continuously while the value changes.
   */
  dsChange: EventEmitter<DsSliderCustomEvent<IDsSliderSliderValue>>;
  /**
   * Emitted when a pointer or keyboard value change is committed.
   */
  dsCommit: EventEmitter<DsSliderCustomEvent<IDsSliderSliderValue>>;
}


