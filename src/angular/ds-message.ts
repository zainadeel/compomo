/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsMessage } from '@ds-mo/ui/components/ds-message.js';

@ProxyCmp({
  defineCustomElementFn: defineDsMessage,
  inputs: ['author', 'deliveryState', 'direction', 'groupPosition', 'messageId', 'scrollAnchor', 'showAuthor', 'streaming', 'timestamp']
})
@Component({
  selector: 'ds-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['author', 'deliveryState', 'direction', 'groupPosition', 'messageId', 'scrollAnchor', 'showAuthor', 'streaming', 'timestamp'],
})
export class DsMessage {
  protected el: HTMLDsMessageElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsMessage extends Components.DsMessage {}


