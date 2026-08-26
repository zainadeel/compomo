import { AnchoredPositionController } from './anchored-position-controller';
import {
  enabledChoiceIndexes,
  findChoiceTypeaheadMatch,
  moveChoiceIndex,
  type ChoiceOption,
} from './choice-list';
import { choicePopupMinWidth, resolveChoicePopupAlignOffset } from './choice-popup-alignment';
import { resolveCssLengthPx } from './resolve-css-length-px';
import { resolveCssTimeMs } from './resolve-css-time-ms';
import { TOKEN_DEFAULTS } from './token-defaults';
import { eventIntersectsComposedBoundary } from './anchored-overlay-interaction-controller';
import { resolveAnchoredOverlayBoundaryRect } from './anchored-overlay-boundary';

type PopupPosition = { x: number; y: number };

export interface SelectControllerState<T extends ChoiceOption> {
  readonly host: HTMLElement;
  readonly generatedId: string;
  readonly options: T[];
  readonly searchable: boolean;
  readonly isLoading: boolean;
  readonly isDisabled: boolean;
  readonly preferredIndex: number;
  readonly popupAlign: 'start' | 'end';
  readonly boundary: HTMLElement | undefined;
  open: boolean;
  activeIndex: number;
  searchTerm: string;
  focusRingVisible: boolean;
  position: PopupPosition;
  positionReady: boolean;
  selectOption(option: T): void;
}

/**
 * Shared single/multiple Select interaction controller.
 *
 * Decorated Stencil state and scalar/array selection remain in each component;
 * this controller owns only popup lifecycle, focus, positioning, typeahead,
 * and listbox keyboard traversal. Anchored placement is delegated to
 * `AnchoredPositionController`; only the choice-cell measurement stays here.
 */
export class SelectController<T extends ChoiceOption> {
  private triggerEl: HTMLButtonElement | null = null;
  private popupEl: HTMLDivElement | null = null;
  private searchEl: HTMLInputElement | null = null;
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private readonly position: AnchoredPositionController;

  constructor(private readonly state: SelectControllerState<T>) {
    this.position = new AnchoredPositionController({
      getAnchor: () => this.triggerEl,
      getPopup: () => this.popupEl,
      measure: (trigger, popup) => {
        if (!this.state.open || !popup.isConnected || !this.state.host.contains(popup)) return null;

        const sectionPadding = resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
        popup.style.minWidth = `max(var(--ds-choice-popup-min-inline-size, ${TOKEN_DEFAULTS.menuWidthXs}), ${choicePopupMinWidth(trigger.offsetWidth, sectionPadding)}px)`;

        const align = this.state.popupAlign;
        return {
          anchorRect: trigger.getBoundingClientRect(),
          popupWidth: popup.offsetWidth,
          popupHeight: popup.offsetHeight,
          side: 'bottom',
          align,
          sideOffsetPx: sectionPadding,
          alignOffsetPx: resolveChoicePopupAlignOffset({
            align,
            alignOffsetPx: 0,
            sectionInsetPx: sectionPadding,
          }),
          viewportPadPx: sectionPadding,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          collisionRect: resolveAnchoredOverlayBoundaryRect(trigger, this.state.boundary),
        };
      },
      apply: ({ x, y }) => {
        this.state.position = { x, y };
        this.state.positionReady = true;
      },
      topLayer: true,
    });
  }

  get activeOptionId(): string | undefined {
    return !this.state.isLoading && this.state.activeIndex >= 0
      ? `${this.state.generatedId}-option-${this.state.activeIndex}`
      : undefined;
  }

  setTriggerElement = (element: HTMLButtonElement | null) => {
    this.triggerEl = element;
  };

  setPopupElement = (element: HTMLDivElement | null) => {
    this.popupEl = element;
  };

  setSearchElement = (element: HTMLInputElement | null) => {
    this.searchEl = element;
  };

  connect() {
    if (this.state.open) this.openChanged(true);
  }

  disconnect() {
    this.cancelPositionRetry();
    this.unbindPopupListeners();
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
  }

  setFocus() {
    this.triggerEl?.focus();
  }

  optionsChanged() {
    if (!this.state.open) return;
    const enabled = enabledChoiceIndexes(this.state.options);
    if (!enabled.includes(this.state.activeIndex)) this.state.activeIndex = enabled[0] ?? -1;
    requestAnimationFrame(() => this.updatePosition());
  }

  loadingChanged() {
    if (this.state.open) requestAnimationFrame(() => this.updatePosition());
  }

  positionChanged() {
    if (this.state.open) requestAnimationFrame(() => this.updatePosition());
  }

  openChanged(open: boolean) {
    if (open) {
      this.bindPopupListeners();
      this.schedulePositionUpdate(() => {
        this.scrollActiveOptionIntoView();
        if (this.state.searchable) this.searchEl?.focus();
      });
      return;
    }
    this.cancelPositionRetry();
    this.unbindPopupListeners();
    this.state.searchTerm = '';
    this.state.positionReady = false;
  }

  searchChanged() {
    this.state.activeIndex = enabledChoiceIndexes(this.state.options)[0] ?? -1;
    requestAnimationFrame(() => {
      this.updatePosition();
      this.scrollActiveOptionIntoView();
    });
  }

  activeIndexChanged() {
    requestAnimationFrame(() => this.scrollActiveOptionIntoView());
  }

  openPopup(focusVisible: boolean, edge?: 'first' | 'last') {
    if (this.state.isDisabled || (!this.state.options.length && !this.state.isLoading)) return;
    const enabled = enabledChoiceIndexes(this.state.options);
    this.state.activeIndex =
      edge === 'last'
        ? (enabled[enabled.length - 1] ?? -1)
        : this.state.preferredIndex >= 0
          ? this.state.preferredIndex
          : (enabled[0] ?? -1);
    this.state.focusRingVisible = focusVisible;
    this.state.open = true;
  }

  closePopup(restoreFocus = false) {
    if (!this.state.open) return;
    this.state.open = false;
    if (restoreFocus) requestAnimationFrame(() => this.triggerEl?.focus());
  }

  focusSearchOrTrigger() {
    requestAnimationFrame(() =>
      this.state.searchable ? this.searchEl?.focus() : this.triggerEl?.focus()
    );
  }

  handleTriggerKeyDown = (event: KeyboardEvent) => {
    if (!this.state.open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.openPopup(true, event.key === 'ArrowUp' ? 'last' : 'first');
      } else if (this.isTypeaheadKey(event)) {
        event.preventDefault();
        this.openPopup(true);
        if (this.state.searchable) this.state.searchTerm = event.key;
        else this.handleTypeahead(event.key);
      }
      return;
    }
    this.handleListKeyDown(event);
  };

  handleListKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.state.focusRingVisible = true;
        this.state.activeIndex = moveChoiceIndex(this.state.options, this.state.activeIndex, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.state.focusRingVisible = true;
        this.state.activeIndex = moveChoiceIndex(this.state.options, this.state.activeIndex, -1);
        break;
      case 'Home':
        event.preventDefault();
        this.state.focusRingVisible = true;
        this.state.activeIndex = enabledChoiceIndexes(this.state.options)[0] ?? -1;
        break;
      case 'End': {
        event.preventDefault();
        this.state.focusRingVisible = true;
        const enabled = enabledChoiceIndexes(this.state.options);
        this.state.activeIndex = enabled[enabled.length - 1] ?? -1;
        break;
      }
      case 'Enter':
      case ' ': {
        if (event.key === ' ' && this.state.searchable && event.target === this.searchEl) break;
        event.preventDefault();
        const option = this.state.options[this.state.activeIndex];
        if (option) this.state.selectOption(option);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.closePopup(true);
        break;
      case 'Tab':
        this.closePopup();
        break;
      default:
        if (!this.state.searchable && this.isTypeaheadKey(event)) {
          this.handleTypeahead(event.key);
        }
    }
  };

  private isTypeaheadKey(event: KeyboardEvent) {
    return event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;
  }

  private handleTypeahead(key: string) {
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.state.focusRingVisible = true;
    const normalized = key.toLocaleLowerCase();
    const repeatedCharacter =
      this.typeahead.length > 0 && [...this.typeahead].every(character => character === normalized);
    this.typeahead = repeatedCharacter ? normalized : `${this.typeahead}${normalized}`;
    const match = findChoiceTypeaheadMatch(
      this.state.options,
      this.typeahead,
      this.state.activeIndex
    );
    if (match >= 0) this.state.activeIndex = match;
    const resetMs = resolveCssTimeMs(
      TOKEN_DEFAULTS.animationDurationMedium1,
      TOKEN_DEFAULTS.animationDurationMedium1
    );
    this.typeaheadTimer = setTimeout(() => {
      this.typeahead = '';
      this.typeaheadTimer = null;
    }, resetMs);
  }

  private scrollActiveOptionIntoView() {
    if (!this.state.open || !this.activeOptionId) return;
    this.state.host
      .querySelector<HTMLElement>(`#${this.activeOptionId}`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  private bindPopupListeners() {
    this.unbindPopupListeners();
    this.outsideHandler = event => {
      if (eventIntersectsComposedBoundary(event, this.state.host)) return;
      this.closePopup();
    };
    document.addEventListener('mousedown', this.outsideHandler, true);
    this.position.observe();
  }

  private unbindPopupListeners() {
    if (this.outsideHandler) {
      document.removeEventListener('mousedown', this.outsideHandler, true);
      this.outsideHandler = null;
    }
    this.position.unobserve();
  }

  private cancelPositionRetry() {
    this.position.cancel();
  }

  private schedulePositionUpdate(onReady?: () => void) {
    if (!this.state.open) return;
    this.state.positionReady = false;
    this.position.schedule(onReady);
  }

  private updatePosition(): boolean {
    return this.position.update();
  }
}
