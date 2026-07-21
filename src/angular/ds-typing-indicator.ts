/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsTypingIndicator } from '@ds-mo/ui/components/ds-typing-indicator.js';

@ProxyCmp({
  defineCustomElementFn: defineDsTypingIndicator,
  inputs: ['label']
})
@Component({
  selector: 'ds-typing-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['label'],
})
export class DsTypingIndicator {
  protected el: HTMLDsTypingIndicatorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTypingIndicator extends Components.DsTypingIndicator {}


