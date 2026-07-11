/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsTable } from '@ds-mo/ui/components/ds-table.js';

@ProxyCmp({
  defineCustomElementFn: defineDsTable,
  inputs: ['columns', 'data', 'emptyMessage', 'loading', 'loadingLabel', 'locale', 'nextPageLabel', 'pageIndex', 'pageSize', 'pageStatusLabel', 'previousPageLabel', 'selectedRows', 'sortState']
})
@Component({
  selector: 'ds-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['columns', 'data', 'emptyMessage', 'loading', 'loadingLabel', 'locale', 'nextPageLabel', 'pageIndex', 'pageSize', 'pageStatusLabel', 'previousPageLabel', 'selectedRows', 'sortState'],
  outputs: ['dsSort', 'dsRowClick', 'dsPageChange'],
})
export class DsTable {
  protected el: HTMLDsTableElement;
  @Output() dsSort = new EventEmitter<DsTableCustomEvent<{ columnId: string }>>();
  @Output() dsRowClick = new EventEmitter<DsTableCustomEvent<{ row: unknown; rowIndex: number }>>();
  @Output() dsPageChange = new EventEmitter<DsTableCustomEvent<{ pageIndex: number }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsTableCustomEvent } from '@ds-mo/ui/components';

export declare interface DsTable extends Components.DsTable {

  dsSort: EventEmitter<DsTableCustomEvent<{ columnId: string }>>;

  dsRowClick: EventEmitter<DsTableCustomEvent<{ row: unknown; rowIndex: number }>>;

  dsPageChange: EventEmitter<DsTableCustomEvent<{ pageIndex: number }>>;
}


