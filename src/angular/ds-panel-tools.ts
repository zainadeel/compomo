/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsPanelTools } from '@ds-mo/ui/components/ds-panel-tools.js';

@ProxyCmp({
  defineCustomElementFn: defineDsPanelTools,
  inputs: ['activeTool', 'headers', 'headersJson', 'items', 'itemsJson', 'open', 'presentation', 'storageKey', 'toolShortcutsLabel', 'toolsLabel'],
  methods: ['activateTool', 'closeDrawer', 'focusHeaderAction']
})
@Component({
  selector: 'ds-panel-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeTool', 'headers', 'headersJson', 'items', 'itemsJson', 'open', 'presentation', 'storageKey', 'toolShortcutsLabel', 'toolsLabel'],
  outputs: ['dsToolChange', 'dsPresentationChange', 'dsHeaderBack', 'dsHeaderAction', 'dsChromeTransitionStart', 'dsChromeTransitionEnd'],
})
export class DsPanelTools {
  protected el: HTMLDsPanelToolsElement;
  @Output() dsToolChange = new EventEmitter<DsPanelToolsCustomEvent<{ id: IDsPanelToolsPanelToolsToolId; selected: boolean; }>>();
  @Output() dsPresentationChange = new EventEmitter<DsPanelToolsCustomEvent<{ presentation: 'drawer' | 'fullscreen'; }>>();
  @Output() dsHeaderBack = new EventEmitter<DsPanelToolsCustomEvent<{ tool: IDsPanelToolsPanelToolsToolId; }>>();
  @Output() dsHeaderAction = new EventEmitter<DsPanelToolsCustomEvent<{ tool: IDsPanelToolsPanelToolsToolId; id: string; }>>();
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
   * Emitted when fullscreen changes, including Escape-initiated exits.
   */
  dsPresentationChange: EventEmitter<DsPanelToolsCustomEvent<{ presentation: 'drawer' | 'fullscreen'; }>>;
  /**
   * Requests navigation to the active tool's parent view.
   */
  dsHeaderBack: EventEmitter<DsPanelToolsCustomEvent<{ tool: IDsPanelToolsPanelToolsToolId; }>>;
  /**
   * Requests one application-owned action from the active tool header.
   */
  dsHeaderAction: EventEmitter<DsPanelToolsCustomEvent<{ tool: IDsPanelToolsPanelToolsToolId; id: string; }>>;
  /**
   * Bubbling lifecycle — `ds-bar-nav` defers overflow checks during drawer motion.
   */
  dsChromeTransitionStart: EventEmitter<DsPanelToolsCustomEvent<IDsPanelToolsChromeTransitionDetail>>;

  dsChromeTransitionEnd: EventEmitter<DsPanelToolsCustomEvent<IDsPanelToolsChromeTransitionDetail>>;
}


