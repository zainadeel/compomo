/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsShellGradientPicker } from '@ds-mo/ui/components/ds-shell-gradient-picker.js';

@ProxyCmp({
  defineCustomElementFn: defineDsShellGradientPicker,
  inputs: ['groupLabel', 'value']
})
@Component({
  selector: 'ds-shell-gradient-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['groupLabel', 'value'],
  outputs: ['dsChange'],
})
export class DsShellGradientPicker {
  protected el: HTMLDsShellGradientPickerElement;
  @Output() dsChange = new EventEmitter<DsShellGradientPickerCustomEvent<IDsShellGradientPickerShellGradientPreset>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsShellGradientPickerCustomEvent } from '@ds-mo/ui/components';
import type { ShellGradientPreset as IDsShellGradientPickerShellGradientPreset } from '@ds-mo/ui/components';

export declare interface DsShellGradientPicker extends Components.DsShellGradientPicker {

  dsChange: EventEmitter<DsShellGradientPickerCustomEvent<IDsShellGradientPickerShellGradientPreset>>;
}


