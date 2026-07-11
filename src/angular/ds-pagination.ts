/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsPagination } from '@ds-mo/ui/components/ds-pagination.js';

@ProxyCmp({
  defineCustomElementFn: defineDsPagination,
  inputs: ['isInactive', 'nextPageLabel', 'page', 'paginationLabel', 'previousPageLabel', 'siblingCount', 'totalPages']
})
@Component({
  selector: 'ds-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isInactive', 'nextPageLabel', 'page', 'paginationLabel', 'previousPageLabel', 'siblingCount', 'totalPages'],
  outputs: ['dsPageChange'],
})
export class DsPagination {
  protected el: HTMLDsPaginationElement;
  @Output() dsPageChange = new EventEmitter<DsPaginationCustomEvent<number>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsPaginationCustomEvent } from '@ds-mo/ui/components';

export declare interface DsPagination extends Components.DsPagination {

  dsPageChange: EventEmitter<DsPaginationCustomEvent<number>>;
}


