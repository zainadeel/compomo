/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsSelect } from '@ds-mo/ui/components/ds-select.js';

@ProxyCmp({
  defineCustomElementFn: defineDsSelect,
  inputs: ['activeFill', 'ariaLabel', 'ariaLabelledby', 'disabled', 'hasBorder', 'isInactive', 'name', 'options', 'placeholder', 'required', 'requiredMessage', 'size', 'value', 'width']
})
@Component({
  selector: 'ds-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeFill', 'ariaLabel', 'ariaLabelledby', 'disabled', 'hasBorder', 'isInactive', 'name', 'options', 'placeholder', 'required', 'requiredMessage', 'size', 'value', 'width'],
  outputs: ['dsChange'],
})
export class DsSelect {
  protected el: HTMLDsSelectElement;
  @Output() dsChange = new EventEmitter<DsSelectCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsSelectCustomEvent } from '@ds-mo/ui/components';

export declare interface DsSelect extends Components.DsSelect {
  /**
   * Emits the selected value string.
   */
  dsChange: EventEmitter<DsSelectCustomEvent<string>>;
}


