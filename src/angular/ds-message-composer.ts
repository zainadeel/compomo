/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsMessageComposer } from '@ds-mo/ui/components/ds-message-composer.js';

@ProxyCmp({
  defineCustomElementFn: defineDsMessageComposer,
  inputs: ['isInactive', 'label', 'placeholder', 'status', 'submitIntent', 'value'],
  methods: ['setFocus']
})
@Component({
  selector: 'ds-message-composer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isInactive', 'label', 'placeholder', 'status', 'submitIntent', 'value'],
  outputs: ['dsInput', 'dsSubmit', 'dsStop'],
})
export class DsMessageComposer {
  protected el: HTMLDsMessageComposerElement;
  @Output() dsInput = new EventEmitter<DsMessageComposerCustomEvent<string>>();
  @Output() dsSubmit = new EventEmitter<DsMessageComposerCustomEvent<{ text: string }>>();
  @Output() dsStop = new EventEmitter<DsMessageComposerCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsMessageComposerCustomEvent } from '@ds-mo/ui/components';

export declare interface DsMessageComposer extends Components.DsMessageComposer {

  dsInput: EventEmitter<DsMessageComposerCustomEvent<string>>;

  dsSubmit: EventEmitter<DsMessageComposerCustomEvent<{ text: string }>>;

  dsStop: EventEmitter<DsMessageComposerCustomEvent<void>>;
}


