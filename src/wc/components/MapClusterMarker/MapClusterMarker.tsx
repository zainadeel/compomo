import { Component, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';

const formatCount = (count: number): string => {
  const normalizedCount = Math.max(0, Math.round(Number.isFinite(count) ? count : 0));
  if (normalizedCount < 1000) return String(normalizedCount);
  const compactCount = Math.round(normalizedCount / 100) / 10;
  return `${Number.isInteger(compactCount) ? compactCount.toFixed(0) : compactCount.toFixed(1)}k`;
};

@Component({
  tag: 'ds-map-cluster-marker',
  styleUrl: 'MapClusterMarker.css',
  scoped: true,
})
export class MapClusterMarker {
  /** Accessible action label. Describe the cluster and what activation does. */
  @Prop() label!: string;

  /** Short visible cluster identifier revealed on hover or keyboard focus. */
  @Prop() caption: string = '';

  /** Number of represented entities, compacted at one thousand and above. */
  @Prop() count: number = 0;

  /** De-emphasizes this cluster when an owner-managed selection is active elsewhere. */
  @Prop({ reflect: true }) dimmed: boolean = false;

  /** Fired when the cluster's native button is activated. */
  @Event() dsClick!: EventEmitter<MouseEvent>;

  private buttonEl?: HTMLButtonElement;

  /** Moves keyboard focus to the cluster button. */
  @Method()
  async setFocus(): Promise<void> {
    this.buttonEl?.focus();
  }

  private handleClick = (event: MouseEvent) => {
    this.dsClick.emit(event);
  };

  render() {
    const caption = this.caption.trim();
    const countLabel = formatCount(this.count);

    return (
      <Host class={{ 'map-cluster-marker': true, 'map-marker--dimmed': this.dimmed }}>
        <button
          ref={element => (this.buttonEl = element)}
          type="button"
          class={{
            'map-marker__button': true,
            'map-cluster-marker__button--padded': countLabel.length > 1,
            'ds-focus-ring': true,
          }}
          aria-label={this.label}
          onClick={this.handleClick}
        >
          <ds-text
            class="map-cluster-marker__count"
            as="span"
            variant="text-body-medium"
            color="inherit"
            emphasis
          >
            {countLabel}
          </ds-text>
        </button>
        {caption && (
          <ds-text
            class="map-marker__caption"
            as="span"
            variant="text-caption"
            color="inherit"
            aria-hidden="true"
          >
            {caption}
          </ds-text>
        )}
      </Host>
    );
  }
}
