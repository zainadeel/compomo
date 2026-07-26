/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsMobileSectionSwitcher } from '@ds-mo/ui/components/ds-mobile-section-switcher.js';

@ProxyCmp({
  defineCustomElementFn: defineDsMobileSectionSwitcher,
  inputs: ['navigationLabel', 'sections', 'sectionsJson', 'value']
})
@Component({
  selector: 'ds-mobile-section-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['navigationLabel', 'sections', 'sectionsJson', 'value'],
  outputs: ['dsChange'],
})
export class DsMobileSectionSwitcher {
  protected el: HTMLDsMobileSectionSwitcherElement;
  @Output() dsChange = new EventEmitter<DsMobileSectionSwitcherCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsMobileSectionSwitcherCustomEvent } from '@ds-mo/ui/components';

export declare interface DsMobileSectionSwitcher extends Components.DsMobileSectionSwitcher {
  /**
   * Selection intent. The route, tool, or workflow owner updates `value`.
   */
  dsChange: EventEmitter<DsMobileSectionSwitcherCustomEvent<string>>;
}


