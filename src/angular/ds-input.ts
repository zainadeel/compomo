/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsInput } from '@ds-mo/ui/components/ds-input.js';

@ProxyCmp({
  defineCustomElementFn: defineDsInput,
  inputs: ['ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'autoComplete', 'autoFocus', 'clearLabel', 'disabled', 'enterKeyHint', 'error', 'errorMessage', 'form', 'hasBorder', 'icon', 'inputId', 'inputMode', 'isInactive', 'name', 'placeholder', 'readOnly', 'required', 'requiredMessage', 'size', 'type', 'value', 'width'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'autoComplete', 'autoFocus', 'clearLabel', 'disabled', 'enterKeyHint', 'error', 'errorMessage', 'form', 'hasBorder', 'icon', 'inputId', 'inputMode', 'isInactive', 'name', 'placeholder', 'readOnly', 'required', 'requiredMessage', 'size', 'type', 'value', 'width'],
  outputs: ['dsChange', 'dsClear'],
})
export class DsInput {
  protected el: HTMLDsInputElement;
  @Output() dsChange = new EventEmitter<DsInputCustomEvent<string>>();
  @Output() dsClear = new EventEmitter<DsInputCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsInputCustomEvent } from '@ds-mo/ui/components';

export declare interface DsInput extends Components.DsInput {

  dsChange: EventEmitter<DsInputCustomEvent<string>>;

  dsClear: EventEmitter<DsInputCustomEvent<void>>;
}


