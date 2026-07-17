/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsMenu } from '@ds-mo/ui/components/ds-menu.js';

@ProxyCmp({
  defineCustomElementFn: defineDsMenu,
  inputs: ['align', 'alignOffset', 'anchor', 'anchorAlignment', 'anchorId', 'initialFocusVisible', 'items', 'menuLabel', 'menuWidth', 'minWidth', 'open', 'sections', 'side', 'sideOffset']
})
@Component({
  selector: 'ds-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['align', 'alignOffset', 'anchor', 'anchorAlignment', 'anchorId', 'initialFocusVisible', 'items', 'menuLabel', 'menuWidth', 'minWidth', 'open', 'sections', 'side', 'sideOffset'],
  outputs: ['dsClose', 'dsSelect', 'dsGradientSelect', 'dsSwatchSelect'],
})
export class DsMenu {
  protected el: HTMLDsMenuElement;
  @Output() dsClose = new EventEmitter<DsMenuCustomEvent<void>>();
  @Output() dsSelect = new EventEmitter<DsMenuCustomEvent<IDsMenuMenuItemData>>();
  @Output() dsGradientSelect = new EventEmitter<DsMenuCustomEvent<IDsMenuShellGradientPreset>>();
  @Output() dsSwatchSelect = new EventEmitter<DsMenuCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsMenuCustomEvent } from '@ds-mo/ui/components';
import type { MenuItemData as IDsMenuMenuItemData } from '@ds-mo/ui/components';
import type { ShellGradientPreset as IDsMenuShellGradientPreset } from '@ds-mo/ui/components';

export declare interface DsMenu extends Components.DsMenu {

  dsClose: EventEmitter<DsMenuCustomEvent<void>>;

  dsSelect: EventEmitter<DsMenuCustomEvent<IDsMenuMenuItemData>>;
  /**
   * Emitted when a `gradient-picker` section swatch is chosen.
   */
  dsGradientSelect: EventEmitter<DsMenuCustomEvent<IDsMenuShellGradientPreset>>;
  /**
   * Emitted when a generic `swatch-picker` section option is chosen.
   */
  dsSwatchSelect: EventEmitter<DsMenuCustomEvent<string>>;
}


