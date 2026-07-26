/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsMobileBarNav } from '@ds-mo/ui/components/ds-mobile-bar-nav.js';

@ProxyCmp({
  defineCustomElementFn: defineDsMobileBarNav,
  inputs: ['activeDestination', 'agentsDot', 'agentsLabel', 'currentArea', 'helpLabel', 'inboxDot', 'inboxLabel', 'menuLabel', 'searchDot', 'searchLabel', 'sheetNavExpanded'],
  methods: ['focusDestination']
})
@Component({
  selector: 'ds-mobile-bar-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeDestination', 'agentsDot', 'agentsLabel', 'currentArea', 'helpLabel', 'inboxDot', 'inboxLabel', 'menuLabel', 'searchDot', 'searchLabel', 'sheetNavExpanded'],
  outputs: ['dsSheetNavToggle', 'dsDestinationChange'],
})
export class DsMobileBarNav {
  protected el: HTMLDsMobileBarNavElement;
  @Output() dsSheetNavToggle = new EventEmitter<DsMobileBarNavCustomEvent<boolean>>();
  @Output() dsDestinationChange = new EventEmitter<DsMobileBarNavCustomEvent<IDsMobileBarNavMobileBarNavDestinationDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsMobileBarNavCustomEvent } from '@ds-mo/ui/components';
import type { MobileBarNavDestinationDetail as IDsMobileBarNavMobileBarNavDestinationDetail } from '@ds-mo/ui/components';

export declare interface DsMobileBarNav extends Components.DsMobileBarNav {

  dsSheetNavToggle: EventEmitter<DsMobileBarNavCustomEvent<boolean>>;

  dsDestinationChange: EventEmitter<DsMobileBarNavCustomEvent<IDsMobileBarNavMobileBarNavDestinationDetail>>;
}


