/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsShellMobileNav } from '@ds-mo/ui/components/ds-shell-mobile-nav.js';

@ProxyCmp({
  defineCustomElementFn: defineDsShellMobileNav,
  inputs: ['accountLabel', 'browseContext', 'currentUrl', 'dashboardGroups', 'dashboardLabel', 'heading', 'helpLabel', 'navigationLabel', 'open', 'settingsGroups', 'settingsLabel']
})
@Component({
  selector: 'ds-shell-mobile-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['accountLabel', 'browseContext', 'currentUrl', 'dashboardGroups', 'dashboardLabel', 'heading', 'helpLabel', 'navigationLabel', 'open', 'settingsGroups', 'settingsLabel'],
  outputs: ['dsAreaSelect', 'dsBrowseContextChange', 'dsAuxiliarySelect', 'dsClose'],
})
export class DsShellMobileNav {
  protected el: HTMLDsShellMobileNavElement;
  @Output() dsAreaSelect = new EventEmitter<DsShellMobileNavCustomEvent<string>>();
  @Output() dsBrowseContextChange = new EventEmitter<DsShellMobileNavCustomEvent<IDsShellMobileNavNavChromeStyle>>();
  @Output() dsAuxiliarySelect = new EventEmitter<DsShellMobileNavCustomEvent<IDsShellMobileNavShellMobileNavAuxiliaryDetail>>();
  @Output() dsClose = new EventEmitter<DsShellMobileNavCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsShellMobileNavCustomEvent } from '@ds-mo/ui/components';
import type { NavChromeStyle as IDsShellMobileNavNavChromeStyle } from '@ds-mo/ui/components';
import type { ShellMobileNavAuxiliaryDetail as IDsShellMobileNavShellMobileNavAuxiliaryDetail } from '@ds-mo/ui/components';

export declare interface DsShellMobileNav extends Components.DsShellMobileNav {

  dsAreaSelect: EventEmitter<DsShellMobileNavCustomEvent<string>>;

  dsBrowseContextChange: EventEmitter<DsShellMobileNavCustomEvent<IDsShellMobileNavNavChromeStyle>>;

  dsAuxiliarySelect: EventEmitter<DsShellMobileNavCustomEvent<IDsShellMobileNavShellMobileNavAuxiliaryDetail>>;

  dsClose: EventEmitter<DsShellMobileNavCustomEvent<void>>;
}
