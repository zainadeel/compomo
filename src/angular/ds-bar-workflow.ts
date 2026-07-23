/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, EventEmitter, Output } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@ds-mo/ui/components';

import { defineCustomElement as defineDsBarWorkflow } from '@ds-mo/ui/components/ds-bar-workflow.js';

@ProxyCmp({
  defineCustomElementFn: defineDsBarWorkflow,
  inputs: ['exitAriaLabel', 'exitLabel', 'heading', 'isNextInactive', 'nextLabel', 'previousLabel', 'steps', 'submitAction', 'value']
})
@Component({
  selector: 'ds-bar-workflow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['exitAriaLabel', 'exitLabel', { name: 'heading', required: true }, 'isNextInactive', 'nextLabel', 'previousLabel', 'steps', 'submitAction', 'value'],
  outputs: ['dsExit', 'dsStepChange', 'dsSubmit'],
})
export class DsBarWorkflow {
  protected el: HTMLDsBarWorkflowElement;
  @Output() dsExit = new EventEmitter<DsBarWorkflowCustomEvent<MouseEvent>>();
  @Output() dsStepChange = new EventEmitter<DsBarWorkflowCustomEvent<string>>();
  @Output() dsSubmit = new EventEmitter<DsBarWorkflowCustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { DsBarWorkflowCustomEvent } from '@ds-mo/ui/components';

export declare interface DsBarWorkflow extends Components.DsBarWorkflow {
  /**
   * Emitted when Exit is activated.
   */
  dsExit: EventEmitter<DsBarWorkflowCustomEvent<MouseEvent>>;
  /**
   * Emitted with the target previous or next step id. The component never mutates value.
   */
  dsStepChange: EventEmitter<DsBarWorkflowCustomEvent<string>>;
  /**
   * Emitted when the final Save or Submit control is activated.
   */
  dsSubmit: EventEmitter<DsBarWorkflowCustomEvent<MouseEvent>>;
}


