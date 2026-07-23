/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsScrollOverlay } from '@ds-mo/ui/components/ds-scroll-overlay.js';

@ProxyCmp({
  defineCustomElementFn: defineDsScrollOverlay,
  inputs: ['scrollLabel'],
  methods: ['scrollToStart', 'scrollToEnd', 'refreshOverlay']
})
@Component({
  selector: 'ds-scroll-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['scrollLabel'],
  outputs: ['dsScroll'],
})
export class DsScrollOverlay {
  protected el: HTMLDsScrollOverlayElement;
  @Output() dsScroll = new EventEmitter<DsScrollOverlayCustomEvent<IDsScrollOverlayScrollOverlayScrollDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsScrollOverlayCustomEvent } from '@ds-mo/ui/components';
import type { ScrollOverlayScrollDetail as IDsScrollOverlayScrollOverlayScrollDetail } from '@ds-mo/ui/components';

export declare interface DsScrollOverlay extends Components.DsScrollOverlay {
  /**
   * Reports scroll position without exposing the internal scrollport element.
   */
  dsScroll: EventEmitter<DsScrollOverlayCustomEvent<IDsScrollOverlayScrollOverlayScrollDetail>>;
}


