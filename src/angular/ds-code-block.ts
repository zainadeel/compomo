/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsCodeBlock } from '@ds-mo/ui/components/ds-code-block.js';

@ProxyCmp({
  defineCustomElementFn: defineDsCodeBlock,
  inputs: ['code', 'filename', 'language']
})
@Component({
  selector: 'ds-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['code', 'filename', 'language'],
})
export class DsCodeBlock {
  protected el: HTMLDsCodeBlockElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsCodeBlock extends Components.DsCodeBlock {}


