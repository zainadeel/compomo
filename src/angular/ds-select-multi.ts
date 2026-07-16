/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsSelectMulti } from '@ds-mo/ui/components/ds-select-multi.js';

@ProxyCmp({
  defineCustomElementFn: defineDsSelectMulti,
  inputs: ['activeFill', 'allowClear', 'ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'background', 'clearLabel', 'disabled', 'error', 'errorMessage', 'hasBorder', 'icon', 'inputId', 'isInactive', 'isLoading', 'loadingLabel', 'name', 'noResultsText', 'open', 'options', 'placeholder', 'required', 'requiredMessage', 'searchPlaceholder', 'searchable', 'sections', 'selectedLabel', 'size', 'values', 'width'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-select-multi',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeFill', 'allowClear', 'ariaDescribedby', 'ariaLabel', 'ariaLabelledby', 'background', 'clearLabel', 'disabled', 'error', 'errorMessage', 'hasBorder', 'icon', 'inputId', 'isInactive', 'isLoading', 'loadingLabel', 'name', 'noResultsText', 'open', 'options', 'placeholder', 'required', 'requiredMessage', 'searchPlaceholder', 'searchable', 'sections', 'selectedLabel', 'size', 'values', 'width'],
  outputs: ['dsChange', 'dsClear', 'dsOpenChange'],
})
export class DsSelectMulti {
  protected el: HTMLDsSelectMultiElement;
  @Output() dsChange = new EventEmitter<DsSelectMultiCustomEvent<string[]>>();
  @Output() dsClear = new EventEmitter<DsSelectMultiCustomEvent<void>>();
  @Output() dsOpenChange = new EventEmitter<DsSelectMultiCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsSelectMultiCustomEvent } from '@ds-mo/ui/components';

export declare interface DsSelectMulti extends Components.DsSelectMulti {
  /**
   * Emitted after user toggles or clearing with a new values array.
   */
  dsChange: EventEmitter<DsSelectMultiCustomEvent<string[]>>;
  /**
   * Emitted after the footer clear-all action.
   */
  dsClear: EventEmitter<DsSelectMultiCustomEvent<void>>;
  /**
   * Emitted whenever popup visibility changes.
   */
  dsOpenChange: EventEmitter<DsSelectMultiCustomEvent<boolean>>;
}


