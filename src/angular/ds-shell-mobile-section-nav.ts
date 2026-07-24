/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsShellMobileSectionNav } from '@ds-mo/ui/components/ds-shell-mobile-section-nav.js';

@ProxyCmp({
  defineCustomElementFn: defineDsShellMobileSectionNav,
  inputs: ['basePath', 'currentUrl', 'heading', 'navigationLabel', 'tabs', 'tabsJson', 'value']
})
@Component({
  selector: 'ds-shell-mobile-section-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['basePath', 'currentUrl', 'heading', 'navigationLabel', 'tabs', 'tabsJson', 'value'],
  outputs: ['dsTabChange'],
})
export class DsShellMobileSectionNav {
  protected el: HTMLDsShellMobileSectionNavElement;
  @Output() dsTabChange = new EventEmitter<DsShellMobileSectionNavCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsShellMobileSectionNavCustomEvent } from '@ds-mo/ui/components';

export declare interface DsShellMobileSectionNav extends Components.DsShellMobileSectionNav {
  /**
   * Route intent; the application owns navigation.
   */
  dsTabChange: EventEmitter<DsShellMobileSectionNavCustomEvent<string>>;
}
