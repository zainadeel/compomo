/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsAgentToolCall } from '@ds-mo/ui/components/ds-agent-tool-call.js';

@ProxyCmp({
  defineCustomElementFn: defineDsAgentToolCall,
  inputs: ['error', 'input', 'label', 'name', 'open', 'output', 'state']
})
@Component({
  selector: 'ds-agent-tool-call',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['error', 'input', 'label', 'name', 'open', 'output', 'state'],
})
export class DsAgentToolCall {
  protected el: HTMLDsAgentToolCallElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsAgentToolCall extends Components.DsAgentToolCall {}


