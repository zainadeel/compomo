/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsBarTitle } from '@ds-mo/ui/components/ds-bar-title.js';

@ProxyCmp({
  defineCustomElementFn: defineDsBarTitle,
  inputs: ['actions', 'actionsAriaLabel', 'backAriaLabel', 'backLabel', 'description', 'heading', 'primaryAction', 'sections', 'sectionsAriaLabel', 'showBack', 'value', 'variant']
})
@Component({
  selector: 'ds-bar-title',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['actions', 'actionsAriaLabel', 'backAriaLabel', 'backLabel', 'description', { name: 'heading', required: true }, 'primaryAction', 'sections', 'sectionsAriaLabel', 'showBack', 'value', 'variant'],
  outputs: ['dsBack', 'dsSectionChange', 'dsAction'],
})
export class DsBarTitle {
  protected el: HTMLDsBarTitleElement;
  @Output() dsBack = new EventEmitter<DsBarTitleCustomEvent<MouseEvent>>();
  @Output() dsSectionChange = new EventEmitter<DsBarTitleCustomEvent<string>>();
  @Output() dsAction = new EventEmitter<DsBarTitleCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsBarTitleCustomEvent } from '@ds-mo/ui/components';

export declare interface DsBarTitle extends Components.DsBarTitle {
  /**
   * Emitted when the leading Back action is activated.
   */
  dsBack: EventEmitter<DsBarTitleCustomEvent<MouseEvent>>;
  /**
   * Emitted with the newly selected page-section id.
   */
  dsSectionChange: EventEmitter<DsBarTitleCustomEvent<string>>;
  /**
   * Emitted with the activated primary or overflow action id.
   */
  dsAction: EventEmitter<DsBarTitleCustomEvent<string>>;
}


