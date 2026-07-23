/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsBreadcrumb } from '@ds-mo/ui/components/ds-breadcrumb.js';

@ProxyCmp({
  defineCustomElementFn: defineDsBreadcrumb,
  inputs: ['ariaLabel', 'items']
})
@Component({
  selector: 'ds-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'items'],
  outputs: ['dsSelect'],
})
export class DsBreadcrumb {
  protected el: HTMLDsBreadcrumbElement;
  @Output() dsSelect = new EventEmitter<DsBreadcrumbCustomEvent<IDsBreadcrumbBreadcrumbSelectDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsBreadcrumbCustomEvent } from '@ds-mo/ui/components';
import type { BreadcrumbSelectDetail as IDsBreadcrumbBreadcrumbSelectDetail } from '@ds-mo/ui/components';

export declare interface DsBreadcrumb extends Components.DsBreadcrumb {
  /**
   * Emitted when an interactive breadcrumb item is activated. Prevent to cancel native navigation.
   */
  dsSelect: EventEmitter<DsBreadcrumbCustomEvent<IDsBreadcrumbBreadcrumbSelectDetail>>;
}


