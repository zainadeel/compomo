/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsAgentSourceList } from '@ds-mo/ui/components/ds-agent-source-list.js';

@ProxyCmp({
  defineCustomElementFn: defineDsAgentSourceList,
  inputs: ['heading', 'items', 'open']
})
@Component({
  selector: 'ds-agent-source-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['heading', 'items', 'open'],
})
export class DsAgentSourceList {
  protected el: HTMLDsAgentSourceListElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsAgentSourceList extends Components.DsAgentSourceList {}


