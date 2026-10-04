import '@ds-mo/tokens/css';
import '@angular/compiler';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DsInput } from '@ds-mo/ui/angular/ds-input';
import { DsSelect } from '@ds-mo/ui/angular/ds-select';
import { DsShellApp } from '@ds-mo/ui/angular/ds-shell-app';
import { DsSlider } from '@ds-mo/ui/angular/ds-slider';
import { NumericValueAccessor, SelectValueAccessor, TextValueAccessor } from '@ds-mo/ui/angular';

class Consumer {
  mounted = signal(true);
  options = signal([{ value: 'one', label: 'First option' }]);
  form = new FormGroup({
    text: new FormControl('initial', Validators.required),
    numeric: new FormControl(12.5),
    range: new FormControl([20, 75]),
    selection: new FormControl('one'),
    blur: new FormControl('initial', { updateOn: 'blur' }),
    submit: new FormControl('initial', { updateOn: 'submit' }),
  });
  constructor() {
    window.consumer = this;
  }
  snapshot() {
    return Object.fromEntries(
      Object.entries(this.form.controls).map(([key, control]) => [
        key,
        {
          value: control.value,
          dirty: control.dirty,
          touched: control.touched,
          disabled: control.disabled,
          valid: control.valid,
        },
      ])
    );
  }
}
Component({
  selector: 'consumer-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DsShellApp,
    ReactiveFormsModule,
    DsInput,
    DsSelect,
    DsSlider,
    TextValueAccessor,
    NumericValueAccessor,
    SelectValueAccessor,
  ],
  template: `
    <ds-shell-app id="shell" composition="slotted" style="height:700px">
    <form id="owner" [formGroup]="form">
      @if (mounted()) {
        <ds-input id="text" ariaLabel="Name" name="name" formControlName="text" />
        <ds-input id="numeric" ariaLabel="Amount" type="number" formControlName="numeric" />
        <ds-slider id="range" ariaLabel="Range" formControlName="range" />
        <ds-select id="selection" ariaLabel="Choice" [options]="options()" formControlName="selection" />
        <ds-input id="blur" ariaLabel="On blur" formControlName="blur" />
        <ds-input id="submit" ariaLabel="On submit" formControlName="submit" />
      }
      <button type="submit">Submit</button>
    </form>
    <ds-input id="external" name="external" form="owner" value="external value" />
    <button id="after">After</button>
    </ds-shell-app>`,
})(Consumer);
await bootstrapApplication(Consumer);
document.documentElement.dataset.ready = 'true';
