/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsConversationListItem } from '@ds-mo/ui/components/ds-conversation-list-item.js';

@ProxyCmp({
  defineCustomElementFn: defineDsConversationListItem,
  inputs: ['conversationId', 'conversationTitle', 'preview', 'selected', 'state', 'statusLabel', 'unreadCount', 'updatedAt']
})
@Component({
  selector: 'ds-conversation-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['conversationId', 'conversationTitle', 'preview', 'selected', 'state', 'statusLabel', 'unreadCount', 'updatedAt'],
  outputs: ['dsSelect'],
})
export class DsConversationListItem {
  protected el: HTMLDsConversationListItemElement;
  @Output() dsSelect = new EventEmitter<DsConversationListItemCustomEvent<{ id: string }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsConversationListItemCustomEvent } from '@ds-mo/ui/components';

export declare interface DsConversationListItem extends Components.DsConversationListItem {

  dsSelect: EventEmitter<DsConversationListItemCustomEvent<{ id: string }>>;
}


