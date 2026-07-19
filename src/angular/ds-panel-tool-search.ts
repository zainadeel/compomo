/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsPanelToolSearch } from '@ds-mo/ui/components/ds-panel-tool-search.js';

@ProxyCmp({
  defineCustomElementFn: defineDsPanelToolSearch,
  inputs: ['ariaLabel', 'controls', 'filterActive', 'filterAriaLabel', 'filterControls', 'filterExpanded', 'filterTriggerId', 'isInactive', 'placeholder', 'showFilter', 'value'],
  methods: ['setFocus', 'focusFilterTrigger']
})
@Component({
  selector: 'ds-panel-tool-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'controls', 'filterActive', 'filterAriaLabel', 'filterControls', 'filterExpanded', 'filterTriggerId', 'isInactive', 'placeholder', 'showFilter', 'value'],
  outputs: ['dsChange', 'dsClear', 'dsFilterToggle'],
})
export class DsPanelToolSearch {
  protected el: HTMLDsPanelToolSearchElement;
  @Output() dsChange = new EventEmitter<DsPanelToolSearchCustomEvent<string>>();
  @Output() dsClear = new EventEmitter<DsPanelToolSearchCustomEvent<void>>();
  @Output() dsFilterToggle = new EventEmitter<DsPanelToolSearchCustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsPanelToolSearchCustomEvent } from '@ds-mo/ui/components';

export declare interface DsPanelToolSearch extends Components.DsPanelToolSearch {

  dsChange: EventEmitter<DsPanelToolSearchCustomEvent<string>>;

  dsClear: EventEmitter<DsPanelToolSearchCustomEvent<void>>;

  dsFilterToggle: EventEmitter<DsPanelToolSearchCustomEvent<MouseEvent>>;
}


