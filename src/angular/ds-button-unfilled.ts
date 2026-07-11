/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsButtonUnfilled } from '@ds-mo/ui/components/ds-button-unfilled.js';

@ProxyCmp({
  defineCustomElementFn: defineDsButtonUnfilled,
  inputs: ['activeFill', 'ariaLabel', 'background', 'backgroundContrast', 'controls', 'dot', 'expanded', 'focusTabIndex', 'hasBorder', 'haspopup', 'icon', 'isActive', 'isInactive', 'label', 'pressed', 'size', 'type', 'variant', 'width'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-button-unfilled',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeFill', 'ariaLabel', 'background', 'backgroundContrast', 'controls', 'dot', 'expanded', 'focusTabIndex', 'hasBorder', 'haspopup', 'icon', 'isActive', 'isInactive', 'label', 'pressed', 'size', 'type', 'variant', 'width'],
  outputs: ['dsClick', 'dsChange'],
})
export class DsButtonUnfilled {
  protected el: HTMLDsButtonUnfilledElement;
  @Output() dsClick = new EventEmitter<DsButtonUnfilledCustomEvent<MouseEvent>>();
  @Output() dsChange = new EventEmitter<DsButtonUnfilledCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsButtonUnfilledCustomEvent } from '@ds-mo/ui/components';

export declare interface DsButtonUnfilled extends Components.DsButtonUnfilled {

  dsClick: EventEmitter<DsButtonUnfilledCustomEvent<MouseEvent>>;

  dsChange: EventEmitter<DsButtonUnfilledCustomEvent<boolean>>;
}


