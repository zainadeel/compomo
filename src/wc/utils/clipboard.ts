export interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

export interface ClipboardFeedbackScheduler {
  setTimeout(callback: () => void, delay: number): unknown;
  clearTimeout(handle: unknown): void;
}

const browserScheduler: ClipboardFeedbackScheduler = {
  setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimeout: handle => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

function browserClipboard(): ClipboardWriter | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.clipboard;
}

export async function writeClipboardText(
  text: string,
  clipboard: ClipboardWriter | undefined = browserClipboard()
): Promise<boolean> {
  if (!text || !clipboard) return false;

  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Owns temporary copied feedback for controls that execute browser clipboard writes.
 *
 * A monotonically increasing request id prevents a late clipboard promise from
 * mutating a disconnected owner, stale content, or a newer copy request.
 */
export class ClipboardFeedbackController {
  private active = false;
  private copied = false;
  private requestId = 0;
  private timer: unknown;

  constructor(
    private readonly onCopiedChange: (copied: boolean) => void,
    private readonly copiedDuration = 2000,
    private readonly scheduler: ClipboardFeedbackScheduler = browserScheduler
  ) {}

  connect() {
    this.active = true;
  }

  disconnect() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.requestId += 1;
    this.clearTimer();
    this.setCopied(false);
  }

  async copy(
    text: string,
    clipboard: ClipboardWriter | undefined = browserClipboard()
  ): Promise<boolean | undefined> {
    const requestId = ++this.requestId;
    this.clearTimer();
    this.setCopied(false);

    const success = await writeClipboardText(text, clipboard);
    if (!this.active || requestId !== this.requestId) return undefined;
    if (!success) return false;

    this.setCopied(true);
    this.timer = this.scheduler.setTimeout(() => {
      if (!this.active || requestId !== this.requestId) return;
      this.timer = undefined;
      this.setCopied(false);
    }, this.copiedDuration);
    return true;
  }

  private clearTimer() {
    if (this.timer === undefined) return;
    this.scheduler.clearTimeout(this.timer);
    this.timer = undefined;
  }

  private setCopied(copied: boolean) {
    if (this.copied === copied) return;
    this.copied = copied;
    this.onCopiedChange(copied);
  }
}
