/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsPanelNav } from '@ds-mo/ui/components/ds-panel-nav.js';

@ProxyCmp({
  defineCustomElementFn: defineDsPanelNav,
  inputs: ['accountLabel', 'activeId', 'breakpoint', 'collapseNavigationLabel', 'collapsed', 'currentUrl', 'dashboardLabel', 'dashboardNavigationLabel', 'disableViewTransition', 'expandNavigationLabel', 'groups', 'navStyle', 'routerMode', 'settingsLabel', 'settingsNavigationLabel', 'storageKey', 'userInitial', 'userName'],
  methods: ['toggleCollapsed']
})
@Component({
  selector: 'ds-panel-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['accountLabel', 'activeId', 'breakpoint', 'collapseNavigationLabel', 'collapsed', 'currentUrl', 'dashboardLabel', 'dashboardNavigationLabel', 'disableViewTransition', 'expandNavigationLabel', 'groups', 'navStyle', 'routerMode', 'settingsLabel', 'settingsNavigationLabel', 'storageKey', 'userInitial', 'userName'],
  outputs: ['dsNavSelect', 'dsNavToggle', 'dsChromeTransitionStart', 'dsChromeTransitionEnd', 'dsNavFooterAction', 'dsNavUserAction'],
})
export class DsPanelNav {
  protected el: HTMLDsPanelNavElement;
  @Output() dsNavSelect = new EventEmitter<DsPanelNavCustomEvent<string>>();
  @Output() dsNavToggle = new EventEmitter<DsPanelNavCustomEvent<boolean>>();
  @Output() dsChromeTransitionStart = new EventEmitter<DsPanelNavCustomEvent<IDsPanelNavChromeTransitionDetail>>();
  @Output() dsChromeTransitionEnd = new EventEmitter<DsPanelNavCustomEvent<IDsPanelNavChromeTransitionDetail>>();
  @Output() dsNavFooterAction = new EventEmitter<DsPanelNavCustomEvent<void>>();
  @Output() dsNavUserAction = new EventEmitter<DsPanelNavCustomEvent<IDsPanelNavPanelNavUserActionDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsPanelNavCustomEvent } from '@ds-mo/ui/components';
import type { ChromeTransitionDetail as IDsPanelNavChromeTransitionDetail } from '@ds-mo/ui/components';
import type { PanelNavUserActionDetail as IDsPanelNavPanelNavUserActionDetail } from '@ds-mo/ui/components';

export declare interface DsPanelNav extends Components.DsPanelNav {
  /**
   * Emitted when a nav item is clicked. Detail = the item's `id`.
   */
  dsNavSelect: EventEmitter<DsPanelNavCustomEvent<string>>;
  /**
   * Emitted when the collapse toggle is clicked. Detail = new collapsed state.
   */
  dsNavToggle: EventEmitter<DsPanelNavCustomEvent<boolean>>;
  /**
   * Bubbling lifecycle — `ds-app-shell` pauses chrome metrics during width motion.
   */
  dsChromeTransitionStart: EventEmitter<DsPanelNavCustomEvent<IDsPanelNavChromeTransitionDetail>>;

  dsChromeTransitionEnd: EventEmitter<DsPanelNavCustomEvent<IDsPanelNavChromeTransitionDetail>>;
  /**
   * Emitted when the footer left button (gear / dashboard) is clicked.
   */
  dsNavFooterAction: EventEmitter<DsPanelNavCustomEvent<void>>;
  /**
   * Emitted when the footer user button is clicked. Detail includes the anchor for `ds-menu`.
   */
  dsNavUserAction: EventEmitter<DsPanelNavCustomEvent<IDsPanelNavPanelNavUserActionDetail>>;
}


