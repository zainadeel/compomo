/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsMessageScroller } from '@ds-mo/ui/components/ds-message-scroller.js';

@ProxyCmp({
  defineCustomElementFn: defineDsMessageScroller,
  inputs: ['autoFollow', 'busy', 'defaultPosition', 'messagesLabel'],
  methods: ['scrollToMessage', 'scrollToStart', 'scrollToEnd']
})
@Component({
  selector: 'ds-message-scroller',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['autoFollow', 'busy', 'defaultPosition', 'messagesLabel'],
  outputs: ['dsReachStart'],
})
export class DsMessageScroller {
  protected el: HTMLDsMessageScrollerElement;
  @Output() dsReachStart = new EventEmitter<DsMessageScrollerCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsMessageScrollerCustomEvent } from '@ds-mo/ui/components';

export declare interface DsMessageScroller extends Components.DsMessageScroller {

  dsReachStart: EventEmitter<DsMessageScrollerCustomEvent<void>>;
}


