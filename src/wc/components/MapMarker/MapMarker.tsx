import { Component, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';

export type MapMarkerIntent = 'brand' | 'neutral' | 'positive' | 'warning' | 'caution' | 'negative';

@Component({
  tag: 'ds-map-marker',
  styleUrl: 'MapMarker.css',
  scoped: true,
})
export class MapMarker {
  /** Accessible action label. Describe what activating the marker opens. */
  @Prop() label!: string;

  /** Short visible identifier revealed on hover or keyboard focus. */
  @Prop() caption: string = '';

  /** Canonical IcoMo icon name for the represented map point. */
  @Prop() icon: string = 'MapTarget';

  /** Semantic intent that selects the marker color. */
  @Prop({ reflect: true }) intent: MapMarkerIntent = 'neutral';

  /** De-emphasizes this marker when an owner-managed selection is active elsewhere. */
  @Prop({ reflect: true }) dimmed: boolean = false;

  /** Fired when the marker's native button is activated. */
  @Event() dsClick!: EventEmitter<MouseEvent>;

  private buttonEl?: HTMLButtonElement;

  /** Moves keyboard focus to the marker button. */
  @Method()
  async setFocus(): Promise<void> {
    this.buttonEl?.focus();
  }

  private handleClick = (event: MouseEvent) => {
    this.dsClick.emit(event);
  };

  render() {
    const caption = this.caption.trim();

    return (
      <Host class={{ 'map-marker': true, 'map-marker--dimmed': this.dimmed }}>
        <button
          ref={element => (this.buttonEl = element)}
          type="button"
          class="map-marker__button ds-focus-ring"
          aria-label={this.label}
          onClick={this.handleClick}
        >
          <span class="map-marker__glyph" aria-hidden="true">
            <ds-icon name={this.icon} size="sm" color="inherit"></ds-icon>
          </span>
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
