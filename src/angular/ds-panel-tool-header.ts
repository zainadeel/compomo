/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsPanelToolHeader } from '@ds-mo/ui/components/ds-panel-tool-header.js';

@ProxyCmp({
  defineCustomElementFn: defineDsPanelToolHeader,
  inputs: ['actions', 'backAriaLabel', 'backIcon', 'heading', 'menuAriaLabel', 'menuControls', 'menuExpanded', 'menuTriggerId', 'showBack', 'showMenu'],
  methods: ['focusMenuTrigger']
})
@Component({
  selector: 'ds-panel-tool-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['actions', 'backAriaLabel', 'backIcon', 'heading', 'menuAriaLabel', 'menuControls', 'menuExpanded', 'menuTriggerId', 'showBack', 'showMenu'],
  outputs: ['dsBack', 'dsMenuToggle', 'dsAction'],
})
export class DsPanelToolHeader {
  protected el: HTMLDsPanelToolHeaderElement;
  @Output() dsBack = new EventEmitter<DsPanelToolHeaderCustomEvent<MouseEvent>>();
  @Output() dsMenuToggle = new EventEmitter<DsPanelToolHeaderCustomEvent<MouseEvent>>();
  @Output() dsAction = new EventEmitter<DsPanelToolHeaderCustomEvent<{ id: string; originalEvent: MouseEvent }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsPanelToolHeaderCustomEvent } from '@ds-mo/ui/components';

export declare interface DsPanelToolHeader extends Components.DsPanelToolHeader {

  dsBack: EventEmitter<DsPanelToolHeaderCustomEvent<MouseEvent>>;

  dsMenuToggle: EventEmitter<DsPanelToolHeaderCustomEvent<MouseEvent>>;

  dsAction: EventEmitter<DsPanelToolHeaderCustomEvent<{ id: string; originalEvent: MouseEvent }>>;
}


