/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsAgentResponse } from '@ds-mo/ui/components/ds-agent-response.js';

@ProxyCmp({
  defineCustomElementFn: defineDsAgentResponse,
  inputs: ['author', 'messageId', 'parts', 'showAuthor', 'streaming', 'timestamp']
})
@Component({
  selector: 'ds-agent-response',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['author', 'messageId', 'parts', 'showAuthor', 'streaming', 'timestamp'],
})
export class DsAgentResponse {
  protected el: HTMLDsAgentResponseElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsAgentResponse extends Components.DsAgentResponse {}


