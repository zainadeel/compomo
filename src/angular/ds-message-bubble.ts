/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsMessageBubble } from '@ds-mo/ui/components/ds-message-bubble.js';

@ProxyCmp({
  defineCustomElementFn: defineDsMessageBubble,
  inputs: ['variant']
})
@Component({
  selector: 'ds-message-bubble',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['variant'],
})
export class DsMessageBubble {
  protected el: HTMLDsMessageBubbleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsMessageBubble extends Components.DsMessageBubble {}


