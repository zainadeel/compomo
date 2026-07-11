/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsBarNav } from '@ds-mo/ui/components/ds-bar-nav.js';

@ProxyCmp({
  defineCustomElementFn: defineDsBarNav,
  inputs: ['basePath', 'currentUrl', 'heading', 'moreTabsLabel', 'navStyle', 'tabs', 'tabsJson', 'value']
})
@Component({
  selector: 'ds-bar-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['basePath', 'currentUrl', 'heading', 'moreTabsLabel', 'navStyle', 'tabs', 'tabsJson', 'value'],
  outputs: ['dsTabChange'],
})
export class DsBarNav {
  protected el: HTMLDsBarNavElement;
  @Output() dsTabChange = new EventEmitter<DsBarNavCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsBarNavCustomEvent } from '@ds-mo/ui/components';

export declare interface DsBarNav extends Components.DsBarNav {
  /**
   * Emitted when the active tab changes. Detail = tab id.
   */
  dsTabChange: EventEmitter<DsBarNavCustomEvent<string>>;
}


