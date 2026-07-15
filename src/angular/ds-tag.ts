/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsTag } from '@ds-mo/ui/components/ds-tag.js';

@ProxyCmp({
  defineCustomElementFn: defineDsTag,
  inputs: ['ariaControls', 'contrast', 'expanded', 'icon', 'intent', 'interactive', 'isInactive', 'label', 'maxWidth', 'rounded', 'size']
})
@Component({
  selector: 'ds-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaControls', 'contrast', 'expanded', 'icon', 'intent', 'interactive', 'isInactive', { name: 'label', required: true }, 'maxWidth', 'rounded', 'size'],
  outputs: ['dsClick'],
})
export class DsTag {
  protected el: HTMLDsTagElement;
  @Output() dsClick = new EventEmitter<DsTagCustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsTagCustomEvent } from '@ds-mo/ui/components';

export declare interface DsTag extends Components.DsTag {
  /**
   * Fired when the interactive Tag button is activated.
   */
  dsClick: EventEmitter<DsTagCustomEvent<MouseEvent>>;
}


