/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsTabGroupNav } from '@ds-mo/ui/components/ds-tab-group-nav.js';

@ProxyCmp({
  defineCustomElementFn: defineDsTabGroupNav,
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'orientation', 'rovingEnabled', 'selectionFollowsFocus', 'tabs', 'value'],
  methods: ['focusTab', 'focusLastTab', 'focusFirstTab']
})
@Component({
  selector: 'ds-tab-group-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'orientation', 'rovingEnabled', 'selectionFollowsFocus', 'tabs', 'value'],
  outputs: ['dsChange', 'dsRovingExit'],
})
export class DsTabGroupNav {
  protected el: HTMLDsTabGroupNavElement;
  @Output() dsChange = new EventEmitter<DsTabGroupNavCustomEvent<string>>();
  @Output() dsRovingExit = new EventEmitter<DsTabGroupNavCustomEvent<'start' | 'end'>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsTabGroupNavCustomEvent } from '@ds-mo/ui/components';

export declare interface DsTabGroupNav extends Components.DsTabGroupNav {

  dsChange: EventEmitter<DsTabGroupNavCustomEvent<string>>;
  /**
   * Fired when arrow navigation reaches the first/last tab in manual selection mode.
   */
  dsRovingExit: EventEmitter<DsTabGroupNavCustomEvent<'start' | 'end'>>;
}


