/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsShellTools } from '@ds-mo/ui/components/ds-shell-tools.js';

@ProxyCmp({
  defineCustomElementFn: defineDsShellTools,
  inputs: ['activeTool', 'fullscreenHeaderMode', 'headers', 'headersJson', 'inboxLabel', 'inboxNavigationLabel', 'items', 'itemsJson', 'open', 'presentation', 'responsiveMode', 'storageKey', 'toolShortcutsLabel', 'toolsLabel'],
  methods: ['activateTool', 'closeDrawer', 'focusHeaderAction']
})
@Component({
  selector: 'ds-shell-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeTool', 'fullscreenHeaderMode', 'headers', 'headersJson', 'inboxLabel', 'inboxNavigationLabel', 'items', 'itemsJson', 'open', 'presentation', 'responsiveMode', 'storageKey', 'toolShortcutsLabel', 'toolsLabel'],
  outputs: ['dsToolChange', 'dsPresentationChange', 'dsHeaderBack', 'dsHeaderAction'],
})
export class DsShellTools {
  protected el: HTMLDsShellToolsElement;
  @Output() dsToolChange = new EventEmitter<DsShellToolsCustomEvent<{ id: IDsShellToolsPanelToolsToolId; selected: boolean; }>>();
  @Output() dsPresentationChange = new EventEmitter<DsShellToolsCustomEvent<{ presentation: 'drawer' | 'fullscreen'; }>>();
  @Output() dsHeaderBack = new EventEmitter<DsShellToolsCustomEvent<{ tool: IDsShellToolsPanelToolsToolId; }>>();
  @Output() dsHeaderAction = new EventEmitter<DsShellToolsCustomEvent<{ tool: IDsShellToolsPanelToolsToolId; id: string; }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsShellToolsCustomEvent } from '@ds-mo/ui/components';
import type { PanelToolsToolId as IDsShellToolsPanelToolsToolId } from '@ds-mo/ui/components';

export declare interface DsShellTools extends Components.DsShellTools {

  dsToolChange: EventEmitter<DsShellToolsCustomEvent<{ id: IDsShellToolsPanelToolsToolId; selected: boolean; }>>;

  dsPresentationChange: EventEmitter<DsShellToolsCustomEvent<{ presentation: 'drawer' | 'fullscreen'; }>>;

  dsHeaderBack: EventEmitter<DsShellToolsCustomEvent<{ tool: IDsShellToolsPanelToolsToolId; }>>;

  dsHeaderAction: EventEmitter<DsShellToolsCustomEvent<{ tool: IDsShellToolsPanelToolsToolId; id: string; }>>;
}
