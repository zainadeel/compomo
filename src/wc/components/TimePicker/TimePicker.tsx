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
    this.optionEl('hour', this.parts().hour12)?.focus();
  }

  private parts(): ClockTimeParts {
    return splitClockTime(this.value) ?? { hour12: 12, minute: 0, period: 'AM' };
  }

  private minutes(): number[] {
    return clockMinutes(clockMinuteStep(this.step));
  }

  private isDisabledTime(iso: string): boolean {
    if (this.isInactive) return true;
    return isClockTimeOutOfRange(iso, this.min, this.max);
  }

  private isDisabledPart(next: Partial<ClockTimeParts>): boolean {
    return this.isDisabledTime(joinClockTime({ ...this.parts(), ...next }));
  }

  private commit(next: Partial<ClockTimeParts>) {
    const iso = joinClockTime({ ...this.parts(), ...next });
    if (this.isDisabledTime(iso)) return;
    this.dsChange.emit(iso);
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
      const parts = this.parts();
      const nextValue =
        nextColumn === 'hour'
          ? parts.hour12
          : nextColumn === 'minute'
            ? parts.minute
            : parts.period;
      this.focusOption(nextColumn, nextValue);
      return;
    }

    let offset: number | null = null;
    if (event.key === 'ArrowUp') offset = -1;
    else if (event.key === 'ArrowDown') offset = 1;
    else if (event.key === 'Home') offset = -values.length;
    else if (event.key === 'End') offset = values.length;
    if (offset === null) return;
    event.preventDefault();
    const index = values.indexOf(current);
    const next = values[stepBoundedIndex(index < 0 ? 0 : index, offset, values.length)];
    if (next === undefined) return;
    this.focusOption(column, next);
  };

  private renderTile(
    column: TimePickerColumn,
    value: number | ClockPeriod,
    selected: boolean,
    label: string,
    values: ReadonlyArray<number | ClockPeriod>
  ) {
    const next =
      column === 'hour'
        ? { hour12: value as number }
        : column === 'minute'
          ? { minute: value as number }
          : { period: value as ClockPeriod };
    const disabled = this.isDisabledPart(next);
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
        tabIndex={selected ? 0 : -1}
        onClick={() => this.commit(next)}
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

    return (
      <Host>
        <div class="time-picker" role="group" aria-label="Choose time">
          <div class="time-picker__column">
            <div class="time-picker__list" role="listbox" aria-label="Hour">
              {CLOCK_HOURS.map(hour =>
                this.renderTile('hour', hour, hour === parts.hour12, String(hour), CLOCK_HOURS)
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
                  String(minute).padStart(2, '0'),
                  minuteValues
                )
              )}
            </div>
          </div>
          <div class="time-picker__column">
            <div class="time-picker__list" role="listbox" aria-label="AM/PM">
              {CLOCK_PERIODS.map(period =>
                this.renderTile('period', period, period === parts.period, period, CLOCK_PERIODS)
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
