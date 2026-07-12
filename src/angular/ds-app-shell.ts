/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsAppShell } from '@ds-mo/ui/components/ds-app-shell.js';

@ProxyCmp({
  defineCustomElementFn: defineDsAppShell,
  inputs: ['gradientPreset', 'navStyle', 'shortcutsEnabled']
})
@Component({
  selector: 'ds-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['gradientPreset', 'navStyle', 'shortcutsEnabled'],
})
export class DsAppShell {
  protected el: HTMLDsAppShellElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsAppShell extends Components.DsAppShell {}


