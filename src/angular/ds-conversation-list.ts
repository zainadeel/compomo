/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsConversationList } from '@ds-mo/ui/components/ds-conversation-list.js';

@ProxyCmp({
  defineCustomElementFn: defineDsConversationList,
  inputs: ['actionLayout']
})
@Component({
  selector: 'ds-conversation-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['actionLayout'],
})
export class DsConversationList {
  protected el: HTMLDsConversationListElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsConversationList extends Components.DsConversationList {}


