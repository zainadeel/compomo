import type { AnchoredOverlayInteractionController } from './anchored-overlay-interaction-controller';
import type { AnchoredPositionController } from './anchored-position-controller';
import { resolveMotionTimeMs } from './resolve-css-time-ms';
import { TOKEN_DEFAULTS } from './token-defaults';

export type PickerPopupPhase = 'closed' | 'open' | 'closing';

interface PickerPopupControllerOptions {
  position: Pick<AnchoredPositionController, 'observe' | 'unobserve' | 'schedule'>;
  interaction: Pick<AnchoredOverlayInteractionController, 'connect' | 'disconnect'>;
  getPopup: () => HTMLElement | null;
  onPhaseChange: (phase: PickerPopupPhase) => void;
}

/** Shared presence and teardown for the internally opened date/time pickers. */
export class PickerPopupController {
  private phase: PickerPopupPhase = 'closed';
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: PickerPopupControllerOptions) {}

  open(): void {
    if (this.phase === 'open') return;
    this.setPhase('open');
    this.teardown();
    this.options.interaction.connect();
    this.options.position.observe();
    this.options.position.schedule();
  }

  close(restoreFocus?: () => void): void {
    if (this.phase !== 'open') return;
    this.setPhase('closing');
    this.teardown();
    restoreFocus?.();
    const duration = resolveMotionTimeMs(
      TOKEN_DEFAULTS.motionShort2,
      TOKEN_DEFAULTS.animationDurationShort3
    );
    if (duration <= 0) {
      this.finishClose();
      return;
    }
    this.closeTimer = setTimeout(() => this.finishClose(), duration);
  }

  disconnect(): void {
    this.teardown();
    this.setPhase('closed');
  }

  private teardown(): void {
    // Unobserve also cancels positioning frames and measurement retries.
    this.options.position.unobserve();
    this.options.interaction.disconnect();
    if (this.closeTimer !== null) clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  private finishClose(): void {
    const popup = this.options.getPopup();
    if (popup?.matches(':popover-open')) popup.hidePopover();
    this.closeTimer = null;
    this.setPhase('closed');
  }

  private setPhase(phase: PickerPopupPhase): void {
    this.phase = phase;
    this.options.onPhaseChange(phase);
  }
}
