import { Directive, ElementRef, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { ValueAccessor } from '../angular/value-accessor';

@Directive({
  selector: 'ds-select-multi',
  host: {
    '(dsChange)': 'handleChangeEvent($event.target?.["values"])',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectMultiValueAccessor),
      multi: true,
    },
  ],
})
export class SelectMultiValueAccessor extends ValueAccessor {
  constructor(el: ElementRef<HTMLDsSelectMultiElement>) {
    super(el);
  }

  writeValue(value: unknown) {
    const values = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
    (this.el.nativeElement as HTMLDsSelectMultiElement).values = values;
    this.lastValue = values;
  }
}
