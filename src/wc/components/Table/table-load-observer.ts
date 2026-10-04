/** Reconciles loading sentinels without rebuilding an observer on every render. */
export class TableLoadObserver {
  private observer: IntersectionObserver | null = null;
  private targets = new Map<HTMLElement, string>();
  private root: HTMLElement | null = null;
  private margin = '';
  private revision = 0;

  constructor(private readonly intersect: (id: string, target: HTMLElement) => void) {}

  refresh(
    targets: ReadonlyMap<HTMLElement, string>,
    root: HTMLElement | null,
    threshold: number
  ): void {
    if (!targets.size) {
      this.disconnect();
      return;
    }
    const margin = `0px 0px ${Number.isFinite(threshold) ? Math.max(0, threshold) : 0}px 0px`;
    const reassigned = [...targets].some(
      ([target, id]) => this.targets.has(target) && this.targets.get(target) !== id
    );
    if (this.root !== root || this.margin !== margin || reassigned) this.disconnect();
    if (!this.observer) {
      const observer = new IntersectionObserver(
        entries => {
          const revision = this.revision;
          for (const entry of entries) {
            // Disconnect does not revoke a callback already queued by the browser.
            // Application callbacks can also invalidate the rest of this delivery.
            if (this.observer !== observer || revision !== this.revision) return;
            const target = entry.target as HTMLElement;
            const id = this.targets.get(target);
            if (entry.isIntersecting && id !== undefined) this.intersect(id, target);
          }
        },
        { root, rootMargin: margin }
      );
      this.observer = observer;
      this.root = root;
      this.margin = margin;
    }
    const previous = this.targets;
    let changed = previous.size !== targets.size;
    for (const [target, id] of previous) {
      if (targets.get(target) !== id) changed = true;
      if (!targets.has(target)) this.observer.unobserve(target);
    }
    if (changed) this.revision++;
    this.targets = new Map(targets);
    for (const target of targets.keys()) {
      if (!previous.has(target)) this.observer.observe(target);
    }
  }

  disconnect(): void {
    const observer = this.observer;
    this.observer = null;
    this.targets.clear();
    this.root = null;
    this.margin = '';
    this.revision++;
    observer?.disconnect();
  }
}
