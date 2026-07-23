/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsAvatar } from '@ds-mo/ui/components/ds-avatar.js';

@ProxyCmp({
  defineCustomElementFn: defineDsAvatar,
  inputs: ['icon', 'iconColor', 'label', 'size']
})
@Component({
  selector: 'ds-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['icon', 'iconColor', 'label', 'size'],
})
export class DsAvatar {
  protected el: HTMLDsAvatarElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DsAvatar extends Components.DsAvatar {}


