/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsTooltip } from '@ds-mo/ui/components/ds-tooltip.js';

@ProxyCmp({
  defineCustomElementFn: defineDsTooltip,
  inputs: ['align', 'alignOffset', 'delay', 'label', 'shortcutKey', 'shortcutKeyPosition', 'side', 'sideOffset', 'size']
})
@Component({
  selector: 'ds-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['align', 'alignOffset', 'delay', { name: 'label', required: true }, 'shortcutKey', 'shortcutKeyPosition', 'side', 'sideOffset', 'size'],
})
export class DsTooltip {
  protected el: HTMLDsTooltipElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsTooltip extends Components.DsTooltip {}


