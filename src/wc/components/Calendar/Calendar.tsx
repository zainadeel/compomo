import {
  Component,
  Element,
  Event,
  EventEmitter,
  Method,
  Prop,
  State,
  Watch,
  h,
  Host,
} from '@stencil/core';
import {
  dateFilterRangeValue,
  isIsoCalendarDate,
  parseDateFilterValue,
  shiftIsoCalendarDate,
} from '../../utils';
import {
  CALENDAR_WEEKDAYS,
  calendarDays,
  calendarMonth,
  calendarMonthLabel,
  calendarPaintedRange,
  calendarToday,
  shiftCalendarMonth,
  type CalendarDateRange,
} from './calendar-grid';

export type CalendarSelectionMode = 'single' | 'range';

@Component({
  tag: 'ds-calendar',
  styleUrl: 'Calendar.css',
  scoped: true,
})
export class Calendar {
  @Element() el!: HTMLElement;

  /** Single date emits YYYY-MM-DD. Range emits the shared `range:start/end` string. */
  @Prop() selectionMode: CalendarSelectionMode = 'single';
  @Prop() value: string = '';
  @Prop() min: string | undefined;
  @Prop() max: string | undefined;
  @Prop() isInactive: boolean = false;
  /** Move keyboard focus into the grid after the calendar is rendered. */
  @Prop() autoFocus: boolean = false;

  @Event() dsChange!: EventEmitter<string>;

  @State() private month = calendarMonth(calendarToday());
  @State() private pendingStart = '';
  @State() private previewEnd = '';
  @State() private heldRange: CalendarDateRange | null = null;

  componentWillLoad() {
    this.month = calendarMonth(this.anchorDate());
  }

  componentDidLoad() {
    if (this.autoFocus) void this.setFocus();
  }

  @Watch('value')
  onValueChange() {
    this.month = calendarMonth(this.anchorDate());
  }

  @Method()
  async setFocus() {
    this.el.querySelector<HTMLElement>('.calendar-day[tabindex="0"]')?.focus();
  }

  private anchorDate(): string {
    if (this.selectionMode === 'range') {
      const parsed = parseDateFilterValue(this.value);
      if (parsed?.kind === 'range') return parsed.start;
      return calendarToday();
    }
    return isIsoCalendarDate(this.value) ? this.value : calendarToday();
  }

  private isDisabled(day: string): boolean {
    if (this.isInactive) return true;
    if (this.min && isIsoCalendarDate(this.min) && day < this.min) return true;
    if (this.max && isIsoCalendarDate(this.max) && day > this.max) return true;
    return false;
  }

  private moveMonth = (offset: number) => {
    this.previewEnd = '';
    this.month = shiftCalendarMonth(this.month, offset);
  };

  private selectDate = (day: string) => {
    if (this.isDisabled(day)) return;
    this.previewEnd = '';
    if (this.selectionMode === 'single') {
      this.pendingStart = '';
      this.heldRange = null;
      this.dsChange.emit(day);
      return;
    }
    const pending = this.pendingStart;
    if (pending) {
      this.pendingStart = '';
      this.heldRange = null;
      this.dsChange.emit(dateFilterRangeValue(pending, day));
      return;
    }
    const current = parseDateFilterValue(this.value);
    this.heldRange = current?.kind === 'range' ? { start: current.start, end: current.end } : null;
    this.pendingStart = day;
    this.dsChange.emit(dateFilterRangeValue(day, day));
  };

  private previewRange = (day: string) => {
    if (!this.pendingStart || this.previewEnd === day) return;
    this.previewEnd = day;
  };

  private clearPreview = () => {
    if (!this.previewEnd) return;
    this.previewEnd = '';
  };

  private focusDate(day: string) {
    this.previewRange(day);
    const targetMonth = calendarMonth(day);
    if (this.month !== targetMonth) this.month = targetMonth;
    requestAnimationFrame(() => {
      this.el.querySelector<HTMLElement>(`[data-date-option="${day}"]`)?.focus();
    });
  }

  private handleDayKeyDown = (event: KeyboardEvent, day: string) => {
    let offset: number | null = null;
    if (event.key === 'ArrowLeft') offset = -1;
    else if (event.key === 'ArrowRight') offset = 1;
    else if (event.key === 'ArrowUp') offset = -7;
    else if (event.key === 'ArrowDown') offset = 7;
    else if (event.key === 'Home') {
      offset = -new Date(`${day}T00:00:00Z`).getUTCDay();
    } else if (event.key === 'End') {
      offset = 6 - new Date(`${day}T00:00:00Z`).getUTCDay();
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const month = shiftCalendarMonth(calendarMonth(day), event.key === 'PageUp' ? -1 : 1);
      const candidate = `${month}-${day.slice(8, 10)}`;
      event.preventDefault();
      this.focusDate(isIsoCalendarDate(candidate) ? candidate : `${month}-01`);
      return;
    }
    if (offset === null) return;
    event.preventDefault();
    this.focusDate(shiftIsoCalendarDate(day, offset));
  };

  render() {
    const liveRange = this.selectionMode === 'range' ? parseDateFilterValue(this.value) : null;
    const liveRangeValue = liveRange?.kind === 'range' ? liveRange : null;
    const rangeValue = calendarPaintedRange(this.pendingStart, this.heldRange, liveRangeValue);
    const days = calendarDays(this.month);
    const today = calendarToday();
    const previewStart =
      this.pendingStart && this.previewEnd ? [this.pendingStart, this.previewEnd].sort()[0] : null;
    const previewFinish =
      this.pendingStart && this.previewEnd ? [this.pendingStart, this.previewEnd].sort()[1] : null;
    const selectedSingle =
      this.selectionMode === 'single' && isIsoCalendarDate(this.value) ? this.value : '';
    const preferredFocus =
      this.pendingStart ||
      selectedSingle ||
      rangeValue?.end ||
      (this.month === today.slice(0, 7) ? today : '');
    const focusDate = days.some(day => day.value === preferredFocus)
      ? preferredFocus
      : (days.find(day => day.inMonth)?.value ?? days[0]?.value);

    return (
      <Host>
        <div class="calendar">
          <div class="calendar-heading ds-control--md">
            <ds-button-unfilled
              class="calendar-nav calendar-nav--previous"
              variant="icon"
              icon="ChevronLeft"
              size="md"
              hasBorder={false}
              isInactive={this.isInactive}
              ariaLabel="Previous month"
              onDsClick={() => this.moveMonth(-1)}
            />
            <ds-text as="span" variant="text-body-medium" emphasis color="primary">
              {calendarMonthLabel(this.month)}
            </ds-text>
            <ds-button-unfilled
              class="calendar-nav calendar-nav--next"
              variant="icon"
              icon="ChevronRight"
              size="md"
              hasBorder={false}
              isInactive={this.isInactive}
              ariaLabel="Next month"
              onDsClick={() => this.moveMonth(1)}
            />
          </div>
          <div class="calendar-weekdays" aria-hidden="true">
            {CALENDAR_WEEKDAYS.map(day => (
              <ds-text as="span" variant="text-body-small" color="secondary">
                {day}
              </ds-text>
            ))}
          </div>
          <div
            class="calendar-grid"
            role="grid"
            aria-label={calendarMonthLabel(this.month)}
            onMouseLeave={this.clearPreview}
          >
            {days.map(day => {
              const selectedInRange = Boolean(
                liveRangeValue &&
                day.value >= liveRangeValue.start &&
                day.value <= liveRangeValue.end
              );
              const paintedInRange = Boolean(
                rangeValue && day.value >= rangeValue.start && day.value <= rangeValue.end
              );
              const pendingStartDay =
                this.selectionMode === 'range' &&
                Boolean(this.pendingStart) &&
                day.value === this.pendingStart;
              const previewInRange = Boolean(
                this.pendingStart &&
                previewStart &&
                previewFinish &&
                day.value >= previewStart &&
                day.value <= previewFinish &&
                day.value !== this.pendingStart
              );
              const inRange = this.selectionMode === 'range' && paintedInRange;
              const rangeEdge = Boolean(
                this.selectionMode === 'range' &&
                rangeValue &&
                (day.value === rangeValue.start || day.value === rangeValue.end)
              );
              const selected = this.selectionMode === 'single' && day.value === selectedSingle;
              const textColor = rangeEdge
                ? 'on-bold'
                : selected || inRange || pendingStartDay || previewInRange || day.value === today
                  ? 'primary'
                  : day.inMonth
                    ? 'secondary'
                    : 'tertiary';
              return (
                <button
                  type="button"
                  role="gridcell"
                  data-date-option={day.value}
                  class={{
                    'calendar-day': true,
                    'calendar-day--outside': !day.inMonth,
                    'calendar-day--today': day.value === today,
                    'calendar-day--in-range': inRange,
                    'calendar-day--range-preview': previewInRange,
                    'calendar-day--range-edge': rangeEdge,
                    'calendar-day--selected': selected,
                    'ds-focus-ring-inset': true,
                    'ds-interaction-fill': true,
                    'ds-interaction-fill--on-bold': rangeEdge,
                    'ds-interaction-fill--surface-open':
                      pendingStartDay && !this.isDisabled(day.value),
                    'ds-interaction-fill--selected': selected && !this.isDisabled(day.value),
                  }}
                  disabled={this.isDisabled(day.value)}
                  aria-label={day.label}
                  aria-selected={selectedInRange || selected ? 'true' : 'false'}
                  tabIndex={day.value === focusDate ? 0 : -1}
                  onMouseEnter={() => this.previewRange(day.value)}
                  onFocus={() => this.previewRange(day.value)}
                  onClick={() => this.selectDate(day.value)}
                  onKeyDown={event => this.handleDayKeyDown(event, day.value)}
                >
                  <ds-text
                    class="ds-interaction-fill__content"
                    as="span"
                    variant="text-body-medium"
                    color={textColor}
                    emphasis={day.value === today}
                  >
                    {day.day}
                  </ds-text>
                </button>
              );
            })}
          </div>
        </div>
      </Host>
    );
  }
}
