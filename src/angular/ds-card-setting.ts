/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsCardSetting } from '@ds-mo/ui/components/ds-card-setting.js';

@ProxyCmp({
  defineCustomElementFn: defineDsCardSetting,
  inputs: ['cancelLabel', 'cardWidth', 'editLabel', 'editing', 'heading', 'saveLabel']
})
@Component({
  selector: 'ds-card-setting',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['cancelLabel', 'cardWidth', 'editLabel', 'editing', { name: 'heading', required: true }, 'saveLabel'],
  outputs: ['dsAction'],
})
export class DsCardSetting {
  protected el: HTMLDsCardSettingElement;
  @Output() dsAction = new EventEmitter<DsCardSettingCustomEvent<IDsCardSettingCardSettingActionDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsCardSettingCustomEvent } from '@ds-mo/ui/components';
import type { CardSettingActionDetail as IDsCardSettingCardSettingActionDetail } from '@ds-mo/ui/components';

export declare interface DsCardSetting extends Components.DsCardSetting {
  /**
   * Emits a controlled edit, save, or cancel request.
   */
  dsAction: EventEmitter<DsCardSettingCustomEvent<IDsCardSettingCardSettingActionDetail>>;
}


