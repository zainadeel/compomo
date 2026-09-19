/** Keeps deferred DOM work inside the connection that scheduled it. */
export class ConnectionTasks {
  private generation = 0;
  private readonly frames = new Set<number>();

  constructor(private readonly isConnected: () => boolean) {}

  guard(callback: () => void): () => void {
    const generation = this.generation;
    return () => {
      if (generation === this.generation && this.isConnected()) callback();
    };
  }

  frame(callback: () => void): number | undefined {
    if (!this.isConnected()) return undefined;
    const run = this.guard(callback);
    const frame = requestAnimationFrame(() => {
      this.frames.delete(frame);
      run();
    });
    this.frames.add(frame);
    return frame;
  }

  microtask(callback: () => void): void {
    if (this.isConnected()) queueMicrotask(this.guard(callback));
  }

  cancelFrame(frame: number | undefined | null): void {
    if (frame == null) return;
    cancelAnimationFrame(frame);
    this.frames.delete(frame);
  }

  cancel(): void {
    this.generation += 1;
    for (const frame of this.frames) cancelAnimationFrame(frame);
    this.frames.clear();
  }
}
