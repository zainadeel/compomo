/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsShellApp } from '@ds-mo/ui/components/ds-shell-app.js';

@ProxyCmp({
  defineCustomElementFn: defineDsShellApp,
  inputs: ['gradientPreset', 'mobileDestination', 'mobileNavigationOpen', 'navStyle', 'shortcutsEnabled']
})
@Component({
  selector: 'ds-shell-app',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['gradientPreset', 'mobileDestination', 'mobileNavigationOpen', 'navStyle', 'shortcutsEnabled'],
  outputs: ['dsResponsiveModeChange'],
})
export class DsShellApp {
  protected el: HTMLDsShellAppElement;
  @Output() dsResponsiveModeChange = new EventEmitter<DsShellAppCustomEvent<{ mode: IDsShellAppShellResponsiveMode }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsShellAppCustomEvent } from '@ds-mo/ui/components';
import type { ShellResponsiveMode as IDsShellAppShellResponsiveMode } from '@ds-mo/ui/components';

export declare interface DsShellApp extends Components.DsShellApp {
  /**
   * Emitted after crossing the fixed 768px or 1200px shell boundaries.
   */
  dsResponsiveModeChange: EventEmitter<DsShellAppCustomEvent<{ mode: IDsShellAppShellResponsiveMode }>>;
}


