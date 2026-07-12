/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsPanelTools } from '@ds-mo/ui/components/ds-panel-tools.js';

@ProxyCmp({
  defineCustomElementFn: defineDsPanelTools,
  inputs: ['activeTool', 'items', 'itemsJson', 'open', 'storageKey', 'toolShortcutsLabel', 'toolsLabel'],
  methods: ['activateTool', 'closeDrawer']
})
@Component({
  selector: 'ds-panel-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeTool', 'items', 'itemsJson', 'open', 'storageKey', 'toolShortcutsLabel', 'toolsLabel'],
  outputs: ['dsToolChange', 'dsChromeTransitionStart', 'dsChromeTransitionEnd'],
})
export class DsPanelTools {
  protected el: HTMLDsPanelToolsElement;
  @Output() dsToolChange = new EventEmitter<DsPanelToolsCustomEvent<{ id: IDsPanelToolsPanelToolsToolId; selected: boolean; }>>();
  @Output() dsChromeTransitionStart = new EventEmitter<DsPanelToolsCustomEvent<IDsPanelToolsChromeTransitionDetail>>();
  @Output() dsChromeTransitionEnd = new EventEmitter<DsPanelToolsCustomEvent<IDsPanelToolsChromeTransitionDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsPanelToolsCustomEvent } from '@ds-mo/ui/components';
import type { PanelToolsToolId as IDsPanelToolsPanelToolsToolId } from '@ds-mo/ui/components';
import type { ChromeTransitionDetail as IDsPanelToolsChromeTransitionDetail } from '@ds-mo/ui/components';

export declare interface DsPanelTools extends Components.DsPanelTools {
  /**
   * Emitted when a rail button is toggled. Detail = { id, selected }.
   */
  dsToolChange: EventEmitter<DsPanelToolsCustomEvent<{ id: IDsPanelToolsPanelToolsToolId; selected: boolean; }>>;
  /**
   * Bubbling lifecycle — `ds-bar-nav` defers overflow checks during drawer motion.
   */
  dsChromeTransitionStart: EventEmitter<DsPanelToolsCustomEvent<IDsPanelToolsChromeTransitionDetail>>;

  dsChromeTransitionEnd: EventEmitter<DsPanelToolsCustomEvent<IDsPanelToolsChromeTransitionDetail>>;
}


