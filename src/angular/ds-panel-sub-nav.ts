/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsPanelSubNav } from '@ds-mo/ui/components/ds-panel-sub-nav.js';

@ProxyCmp({
  defineCustomElementFn: defineDsPanelSubNav,
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'items', 'value']
})
@Component({
  selector: 'ds-panel-sub-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'items', 'value'],
  outputs: ['dsChange'],
})
export class DsPanelSubNav {
  protected el: HTMLDsPanelSubNavElement;
  @Output() dsChange = new EventEmitter<DsPanelSubNavCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsPanelSubNavCustomEvent } from '@ds-mo/ui/components';

export declare interface DsPanelSubNav extends Components.DsPanelSubNav {

  dsChange: EventEmitter<DsPanelSubNavCustomEvent<string>>;
}


