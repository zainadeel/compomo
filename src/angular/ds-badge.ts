/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsBadge } from '@ds-mo/ui/components/ds-badge.js';

@ProxyCmp({
  defineCustomElementFn: defineDsBadge,
  inputs: ['background', 'count', 'gradientBackground', 'isSelected', 'label', 'max', 'surface', 'variant']
})
@Component({
  selector: 'ds-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['background', 'count', 'gradientBackground', 'isSelected', 'label', 'max', 'surface', 'variant'],
})
export class DsBadge {
  protected el: HTMLDsBadgeElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsBadge extends Components.DsBadge {}


