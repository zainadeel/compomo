/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsTabGroup } from '@ds-mo/ui/components/ds-tab-group.js';

@ProxyCmp({
  defineCustomElementFn: defineDsTabGroup,
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'tabs', 'value']
})
@Component({
  selector: 'ds-tab-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'ariaLabelledby', 'background', 'tabs', 'value'],
  outputs: ['dsChange'],
})
export class DsTabGroup {
  protected el: HTMLDsTabGroupElement;
  @Output() dsChange = new EventEmitter<DsTabGroupCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsTabGroupCustomEvent } from '@ds-mo/ui/components';

export declare interface DsTabGroup extends Components.DsTabGroup {

  dsChange: EventEmitter<DsTabGroupCustomEvent<string>>;
}


