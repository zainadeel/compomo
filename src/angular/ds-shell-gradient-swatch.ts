/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsShellGradientSwatch } from '@ds-mo/ui/components/ds-shell-gradient-swatch.js';

@ProxyCmp({
  defineCustomElementFn: defineDsShellGradientSwatch,
  inputs: ['ariaLabel', 'isInactive', 'preset', 'selected']
})
@Component({
  selector: 'ds-shell-gradient-swatch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'isInactive', 'preset', 'selected'],
  outputs: ['dsSelect'],
})
export class DsShellGradientSwatch {
  protected el: HTMLDsShellGradientSwatchElement;
  @Output() dsSelect = new EventEmitter<DsShellGradientSwatchCustomEvent<IDsShellGradientSwatchShellGradientPreset>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsShellGradientSwatchCustomEvent } from '@ds-mo/ui/components';
import type { ShellGradientPreset as IDsShellGradientSwatchShellGradientPreset } from '@ds-mo/ui/components';

export declare interface DsShellGradientSwatch extends Components.DsShellGradientSwatch {

  dsSelect: EventEmitter<DsShellGradientSwatchCustomEvent<IDsShellGradientSwatchShellGradientPreset>>;
}


