/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsBanner } from '@ds-mo/ui/components/ds-banner.js';

@ProxyCmp({
  defineCustomElementFn: defineDsBanner,
  inputs: ['contrast', 'dismissLabel', 'floating', 'header', 'intent', 'message', 'showDismiss']
})
@Component({
  selector: 'ds-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['contrast', 'dismissLabel', 'floating', 'header', 'intent', 'message', 'showDismiss'],
  outputs: ['dsDismiss'],
})
export class DsBanner {
  protected el: HTMLDsBannerElement;
  @Output() dsDismiss = new EventEmitter<DsBannerCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsBannerCustomEvent } from '@ds-mo/ui/components';

export declare interface DsBanner extends Components.DsBanner {

  dsDismiss: EventEmitter<DsBannerCustomEvent<void>>;
}


