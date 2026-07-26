/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsMobileSheetNav } from '@ds-mo/ui/components/ds-mobile-sheet-nav.js';

@ProxyCmp({
  defineCustomElementFn: defineDsMobileSheetNav,
  inputs: ['accountLabel', 'browseContext', 'currentUrl', 'dashboardGroups', 'dashboardLabel', 'helpLabel', 'navigationLabel', 'open', 'settingsGroups', 'settingsLabel']
})
@Component({
  selector: 'ds-mobile-sheet-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['accountLabel', 'browseContext', 'currentUrl', 'dashboardGroups', 'dashboardLabel', 'helpLabel', 'navigationLabel', 'open', 'settingsGroups', 'settingsLabel'],
  outputs: ['dsAreaSelect', 'dsBrowseContextChange', 'dsClose'],
})
export class DsMobileSheetNav {
  protected el: HTMLDsMobileSheetNavElement;
  @Output() dsAreaSelect = new EventEmitter<DsMobileSheetNavCustomEvent<string>>();
  @Output() dsBrowseContextChange = new EventEmitter<DsMobileSheetNavCustomEvent<IDsMobileSheetNavNavChromeStyle>>();
  @Output() dsClose = new EventEmitter<DsMobileSheetNavCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsMobileSheetNavCustomEvent } from '@ds-mo/ui/components';
import type { NavChromeStyle as IDsMobileSheetNavNavChromeStyle } from '@ds-mo/ui/components';

export declare interface DsMobileSheetNav extends Components.DsMobileSheetNav {

  dsAreaSelect: EventEmitter<DsMobileSheetNavCustomEvent<string>>;

  dsBrowseContextChange: EventEmitter<DsMobileSheetNavCustomEvent<IDsMobileSheetNavNavChromeStyle>>;

  dsClose: EventEmitter<DsMobileSheetNavCustomEvent<void>>;
}


