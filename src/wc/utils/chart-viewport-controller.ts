export interface ChartViewportSize {
  width: number;
  height: number;
}

const normalizeSize = (value: number): number => Math.max(1, Math.round(value * 100) / 100);

/**
 * Keeps SVG chart geometry matched to the rendered SVG viewport.
 *
 * Cartesian charts intentionally render without a viewBox: changing the host
 * reflows plot geometry instead of scaling its strokes, text, radii, or points.
 */
export class ChartViewportController {
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private readonly target: Element,
    private readonly onResize: (size: ChartViewportSize) => void
  ) {}

  connect(): void {
    this.disconnect();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        if (!entry) return;
        this.update(entry.contentRect.width, entry.contentRect.height);
      });
      this.resizeObserver.observe(this.target);
    }

    this.measure();
  }

  measure(): void {
    const rect = this.target.getBoundingClientRect();
    this.update(rect.width, rect.height);
  }

  disconnect(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private update(width: number, height: number): void {
    if (!(width > 0) || !(height > 0)) return;
    this.onResize({
      width: normalizeSize(width),
      height: normalizeSize(height),
    });
  }
}
