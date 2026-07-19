/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsAttachmentList } from '@ds-mo/ui/components/ds-attachment-list.js';

@ProxyCmp({
  defineCustomElementFn: defineDsAttachmentList,
  inputs: ['items', 'label']
})
@Component({
  selector: 'ds-attachment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['items', 'label'],
})
export class DsAttachmentList {
  protected el: HTMLDsAttachmentListElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsAttachmentList extends Components.DsAttachmentList {}


