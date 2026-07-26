/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsMobileHeader } from '@ds-mo/ui/components/ds-mobile-header.js';

@ProxyCmp({
  defineCustomElementFn: defineDsMobileHeader,
  inputs: ['heading', 'headingLevel', 'sections', 'sectionsAriaLabel', 'sectionsJson', 'subsections', 'subsectionsAriaLabel', 'subsectionsJson', 'subvalue', 'tone', 'value']
})
@Component({
  selector: 'ds-mobile-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['heading', 'headingLevel', 'sections', 'sectionsAriaLabel', 'sectionsJson', 'subsections', 'subsectionsAriaLabel', 'subsectionsJson', 'subvalue', 'tone', 'value'],
  outputs: ['dsSectionChange', 'dsSubsectionChange'],
})
export class DsMobileHeader {
  protected el: HTMLDsMobileHeaderElement;
  @Output() dsSectionChange = new EventEmitter<DsMobileHeaderCustomEvent<string>>();
  @Output() dsSubsectionChange = new EventEmitter<DsMobileHeaderCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsMobileHeaderCustomEvent } from '@ds-mo/ui/components';

export declare interface DsMobileHeader extends Components.DsMobileHeader {
  /**
   * Section selection intent.
   */
  dsSectionChange: EventEmitter<DsMobileHeaderCustomEvent<string>>;
  /**
   * Child-section selection intent.
   */
  dsSubsectionChange: EventEmitter<DsMobileHeaderCustomEvent<string>>;
}


