/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsMarkdown } from '@ds-mo/ui/components/ds-markdown.js';

@ProxyCmp({
  defineCustomElementFn: defineDsMarkdown,
  inputs: ['content', 'streaming']
})
@Component({
  selector: 'ds-markdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['content', 'streaming'],
})
export class DsMarkdown {
  protected el: HTMLDsMarkdownElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsMarkdown extends Components.DsMarkdown {}


