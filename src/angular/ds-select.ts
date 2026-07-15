/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsSelect } from '@ds-mo/ui/components/ds-select.js';

@ProxyCmp({
  defineCustomElementFn: defineDsSelect,
  inputs: ['activeFill', 'allowClear', 'ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'background', 'clearLabel', 'disabled', 'error', 'errorMessage', 'hasBorder', 'icon', 'inputId', 'isInactive', 'isLoading', 'loadingLabel', 'name', 'noResultsText', 'open', 'options', 'placeholder', 'required', 'requiredMessage', 'searchPlaceholder', 'searchable', 'sections', 'size', 'value', 'width'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeFill', 'allowClear', 'ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'background', 'clearLabel', 'disabled', 'error', 'errorMessage', 'hasBorder', 'icon', 'inputId', 'isInactive', 'isLoading', 'loadingLabel', 'name', 'noResultsText', 'open', 'options', 'placeholder', 'required', 'requiredMessage', 'searchPlaceholder', 'searchable', 'sections', 'size', 'value', 'width'],
  outputs: ['dsChange', 'dsClear', 'dsOpenChange'],
})
export class DsSelect {
  protected el: HTMLDsSelectElement;
  @Output() dsChange = new EventEmitter<DsSelectCustomEvent<string>>();
  @Output() dsClear = new EventEmitter<DsSelectCustomEvent<void>>();
  @Output() dsOpenChange = new EventEmitter<DsSelectCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsSelectCustomEvent } from '@ds-mo/ui/components';

export declare interface DsSelect extends Components.DsSelect {
  /**
   * Emitted after user selection or clearing with the next scalar value.
   */
  dsChange: EventEmitter<DsSelectCustomEvent<string>>;
  /**
   * Emitted after the footer clear action.
   */
  dsClear: EventEmitter<DsSelectCustomEvent<void>>;
  /**
   * Emitted whenever popup visibility changes.
   */
  dsOpenChange: EventEmitter<DsSelectCustomEvent<boolean>>;
}


