/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsAgentActivity } from '@ds-mo/ui/components/ds-agent-activity.js';

@ProxyCmp({
  defineCustomElementFn: defineDsAgentActivity,
  inputs: ['heading', 'items', 'open']
})
@Component({
  selector: 'ds-agent-activity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['heading', 'items', 'open'],
})
export class DsAgentActivity {
  protected el: HTMLDsAgentActivityElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsAgentActivity extends Components.DsAgentActivity {}


