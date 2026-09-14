import {
  Component,
  Element,
  Event,
  EventEmitter,
  Method,
  Prop,
  Watch,
  h,
  Host,
} from '@stencil/core';
import {
  CLOCK_HOURS,
  CLOCK_PERIODS,
  clockMinuteStep,
  clockMinutes,
  isClockTimeStepAligned,
  isClockTimeOutOfRange,
  joinClockTime,
  splitClockTime,
  stepBoundedIndex,
  type ClockPeriod,
  type ClockTimeParts,
} from '../../utils';

type TimePickerColumn = 'hour' | 'minute' | 'period';

@Component({
  tag: 'ds-time-picker',
  styleUrl: 'TimePicker.css',
  scoped: true,
})
export class TimePicker {
  @Element() el!: HTMLElement;

  /** Clock value as `HH:MM`. */
  @Prop() value: string = '';
  @Prop() min: string | undefined;
  @Prop() max: string | undefined;
  /** Native time step in seconds. Defaults to minutes (`60`). */
  @Prop() step: string | number = 60;
  @Prop() isInactive: boolean = false;
  /** Move keyboard focus into the hour list after the picker is rendered. */
  @Prop() autoFocus: boolean = false;

  @Event() dsChange!: EventEmitter<string>;

  componentDidLoad() {
    this.scrollSelectedIntoView();
    if (this.autoFocus) void this.setFocus();
  }

  @Watch('value')
  onValueChange() {
    this.scrollSelectedIntoView();
  }

  @Method()
  async setFocus() {
    this.focusColumn('hour', CLOCK_HOURS);
  }

  private parts(): ClockTimeParts {
    return splitClockTime(this.value) ?? { hour12: 12, minute: 0, period: 'AM' };
  }

  private minutes(): number[] {
    const minimum = this.min ? splitClockTime(this.min) : null;
    return clockMinutes(clockMinuteStep(this.step), minimum?.minute ?? 0);
  }

  private isDisabledTime(iso: string): boolean {
    if (this.isInactive) return true;
    return (
      isClockTimeOutOfRange(iso, this.min, this.max) ||
      !isClockTimeStepAligned(iso, this.step, this.min)
    );
  }

  private optionParts(
    column: TimePickerColumn,
    value: number | ClockPeriod
  ): Partial<ClockTimeParts> {
    return column === 'hour'
      ? { hour12: value as number }
      : column === 'minute'
        ? { minute: value as number }
        : { period: value as ClockPeriod };
  }

  private isDisabledPart(column: TimePickerColumn, next: Partial<ClockTimeParts>): boolean {
    if (this.isInactive) return true;

    const current = { ...this.parts(), ...next };
    const hours: ReadonlyArray<number> = column === 'hour' ? [current.hour12] : CLOCK_HOURS;
    const minutes: ReadonlyArray<number> = column === 'minute' ? [current.minute] : this.minutes();
    const periods: ReadonlyArray<ClockPeriod> =
      column === 'period' ? [current.period] : CLOCK_PERIODS;

    return !hours.some(hour =>
      minutes.some(minute =>
        periods.some(
          period => !this.isDisabledTime(joinClockTime({ hour12: hour, minute, period }))
        )
      )
    );
  }

  private orderedValues<T>(current: T, values: ReadonlyArray<T>): T[] {
    return [current, ...values.filter(value => value !== current)];
  }

  private commit(column: TimePickerColumn, next: Partial<ClockTimeParts>) {
    const current = { ...this.parts(), ...next };
    const hours =
      column === 'hour' ? [current.hour12] : this.orderedValues(current.hour12, CLOCK_HOURS);
    const minutes =
      column === 'minute' ? [current.minute] : this.orderedValues(current.minute, this.minutes());
    const periods =
      column === 'period' ? [current.period] : this.orderedValues(current.period, CLOCK_PERIODS);

    for (const hour of hours) {
      for (const minute of minutes) {
        for (const period of periods) {
          const iso = joinClockTime({ hour12: hour, minute, period });
          if (!this.isDisabledTime(iso)) {
            this.dsChange.emit(iso);
            return;
          }
        }
      }
    }
  }

  private optionEl(column: TimePickerColumn, value: number | ClockPeriod): HTMLElement | null {
    return this.el.querySelector<HTMLElement>(`[data-${column}-option="${value}"]`);
  }

  private scrollSelectedIntoView() {
    const parts = this.parts();
    this.optionEl('hour', parts.hour12)?.scrollIntoView({ block: 'nearest' });
    this.optionEl('minute', parts.minute)?.scrollIntoView({ block: 'nearest' });
    this.optionEl('period', parts.period)?.scrollIntoView({ block: 'nearest' });
  }

  private focusOption(column: TimePickerColumn, value: number | ClockPeriod) {
    requestAnimationFrame(() => {
      this.optionEl(column, value)?.focus();
    });
  }

  private focusValue(
    column: TimePickerColumn,
    values: ReadonlyArray<number | ClockPeriod>
  ): number | ClockPeriod | undefined {
    const current = this.parts();
    const currentValue =
      column === 'hour' ? current.hour12 : column === 'minute' ? current.minute : current.period;
    if (!this.isDisabledPart(column, this.optionParts(column, currentValue))) return currentValue;
    return values.find(value => !this.isDisabledPart(column, this.optionParts(column, value)));
  }

  private focusColumn(column: TimePickerColumn, values: ReadonlyArray<number | ClockPeriod>): void {
    const value = this.focusValue(column, values);
    if (value !== undefined) this.optionEl(column, value)?.focus();
  }

  private handleColumnKeyDown = (
    event: KeyboardEvent,
    column: TimePickerColumn,
    values: ReadonlyArray<number | ClockPeriod>,
    current: number | ClockPeriod
  ) => {
    const columns: TimePickerColumn[] = ['hour', 'minute', 'period'];
    const columnIndex = columns.indexOf(column);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const nextColumn =
        columns[stepBoundedIndex(columnIndex, event.key === 'ArrowLeft' ? -1 : 1, columns.length)];
      if (!nextColumn || nextColumn === column) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      const nextValues =
        nextColumn === 'hour'
          ? CLOCK_HOURS
          : nextColumn === 'minute'
            ? this.minutes()
            : CLOCK_PERIODS;
      const nextValue = this.focusValue(nextColumn, nextValues);
      if (nextValue !== undefined) this.focusOption(nextColumn, nextValue);
      return;
    }

    let offset: number | null = null;
    if (event.key === 'ArrowUp') offset = -1;
    else if (event.key === 'ArrowDown') offset = 1;
    else if (event.key === 'Home' || event.key === 'End') offset = 0;
    if (offset === null) return;
    event.preventDefault();
    let next: number | ClockPeriod | undefined;
    if (event.key === 'Home') {
      next = values.find(value => !this.isDisabledPart(column, this.optionParts(column, value)));
    } else if (event.key === 'End') {
      for (let index = values.length - 1; index >= 0; index -= 1) {
        const value = values[index];
        if (value !== undefined && !this.isDisabledPart(column, this.optionParts(column, value))) {
          next = value;
          break;
        }
      }
    } else {
      const direction = offset;
      let index = values.indexOf(current);
      if (index < 0) index = direction > 0 ? -1 : values.length;
      for (
        let candidate = index + direction;
        candidate >= 0 && candidate < values.length;
        candidate += direction
      ) {
        const value = values[candidate];
        if (value !== undefined && !this.isDisabledPart(column, this.optionParts(column, value))) {
          next = value;
          break;
        }
      }
    }
    if (next === undefined) return;
    this.focusOption(column, next);
  };

  private renderTile(
    column: TimePickerColumn,
    value: number | ClockPeriod,
    selected: boolean,
    focused: boolean,
    label: string,
    values: ReadonlyArray<number | ClockPeriod>
  ) {
    const next = this.optionParts(column, value);
    const disabled = this.isDisabledPart(column, next);
    return (
      <button
        type="button"
        role="option"
        data-hour-option={column === 'hour' ? String(value) : undefined}
        data-minute-option={column === 'minute' ? String(value) : undefined}
        data-period-option={column === 'period' ? String(value) : undefined}
        class={{
          'time-picker-tile': true,
          'time-picker-tile--selected': selected,
          'ds-focus-ring-inset': true,
          'ds-interaction-fill': !disabled,
          'ds-interaction-fill--selected': selected && !disabled,
        }}
        disabled={disabled}
        aria-selected={selected ? 'true' : 'false'}
        tabIndex={focused ? 0 : -1}
        onClick={() => this.commit(column, next)}
        onKeyDown={event => this.handleColumnKeyDown(event, column, values, value)}
      >
        <ds-text
          class="ds-interaction-fill__content"
          as="span"
          variant="text-body-medium"
          color={selected ? 'primary' : 'secondary'}
        >
          {label}
        </ds-text>
      </button>
    );
  }

  render() {
    const parts = this.parts();
    const minutes = this.minutes();
    const minuteValues = minutes.includes(parts.minute)
      ? minutes
      : [...minutes, parts.minute].sort((a, b) => a - b);
    const hourFocus = this.focusValue('hour', CLOCK_HOURS);
    const minuteFocus = this.focusValue('minute', minuteValues);
    const periodFocus = this.focusValue('period', CLOCK_PERIODS);

    return (
      <Host>
        <div class="time-picker" role="group" aria-label="Choose time">
          <div class="time-picker__column">
            <div class="time-picker__list" role="listbox" aria-label="Hour">
              {CLOCK_HOURS.map(hour =>
                this.renderTile(
                  'hour',
                  hour,
                  hour === parts.hour12,
                  hour === hourFocus,
                  String(hour),
                  CLOCK_HOURS
                )
              )}
            </div>
          </div>
          <div class="time-picker__column">
            <div class="time-picker__list" role="listbox" aria-label="Minute">
              {minuteValues.map(minute =>
                this.renderTile(
                  'minute',
                  minute,
                  minute === parts.minute,
                  minute === minuteFocus,
                  String(minute).padStart(2, '0'),
                  minuteValues
                )
              )}
            </div>
          </div>
          <div class="time-picker__column">
            <div class="time-picker__list" role="listbox" aria-label="AM/PM">
              {CLOCK_PERIODS.map(period =>
                this.renderTile(
                  'period',
                  period,
                  period === parts.period,
                  period === periodFocus,
                  period,
                  CLOCK_PERIODS
                )
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
