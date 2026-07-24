/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsShellMobileBar } from '@ds-mo/ui/components/ds-shell-mobile-bar.js';

@ProxyCmp({
  defineCustomElementFn: defineDsShellMobileBar,
  inputs: ['activeDestination', 'agentsDot', 'agentsLabel', 'currentArea', 'inboxDot', 'inboxLabel', 'menuLabel', 'navigationExpanded', 'searchDot', 'searchLabel'],
  methods: ['focusDestination']
})
@Component({
  selector: 'ds-shell-mobile-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeDestination', 'agentsDot', 'agentsLabel', 'currentArea', 'inboxDot', 'inboxLabel', 'menuLabel', 'navigationExpanded', 'searchDot', 'searchLabel'],
  outputs: ['dsNavigationToggle', 'dsDestinationChange'],
})
export class DsShellMobileBar {
  protected el: HTMLDsShellMobileBarElement;
  @Output() dsNavigationToggle = new EventEmitter<DsShellMobileBarCustomEvent<boolean>>();
  @Output() dsDestinationChange = new EventEmitter<DsShellMobileBarCustomEvent<IDsShellMobileBarShellMobileBarDestinationDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsShellMobileBarCustomEvent } from '@ds-mo/ui/components';
import type { ShellMobileBarDestinationDetail as IDsShellMobileBarShellMobileBarDestinationDetail } from '@ds-mo/ui/components';

export declare interface DsShellMobileBar extends Components.DsShellMobileBar {

  dsNavigationToggle: EventEmitter<DsShellMobileBarCustomEvent<boolean>>;

  dsDestinationChange: EventEmitter<DsShellMobileBarCustomEvent<IDsShellMobileBarShellMobileBarDestinationDetail>>;
}


