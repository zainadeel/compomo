import { Component, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';

export type MapEntityMarkerState = 'in-motion' | 'idling' | 'stationary' | 'immobilized' | 'stale';

const normalizeHeading = (heading: number): number => {
  if (!Number.isFinite(heading)) return 0;
  return ((heading % 360) + 360) % 360;
};

const HEADING_ICONS = new Set(['MapEntityTravelGroup', 'MapEntityVehicle']);

const STALE_OUTLINE_CENTER = 8;
const STALE_OUTLINE_RADIUS = 6.5;
const STALE_OUTLINE_SEGMENT_ANGLE = 45;
const STALE_OUTLINE_HALF_GAP_ANGLE = 6;

const staleOutlinePoint = (angle: number): [number, number] => {
  const radians = (angle * Math.PI) / 180;
  return [
    STALE_OUTLINE_CENTER + STALE_OUTLINE_RADIUS * Math.cos(radians),
    STALE_OUTLINE_CENTER + STALE_OUTLINE_RADIUS * Math.sin(radians),
  ];
};

const STALE_OUTLINE_PATH = Array.from({ length: 8 }, (_, index) => {
  const segmentStart = index * STALE_OUTLINE_SEGMENT_ANGLE + STALE_OUTLINE_HALF_GAP_ANGLE;
  const segmentEnd = (index + 1) * STALE_OUTLINE_SEGMENT_ANGLE - STALE_OUTLINE_HALF_GAP_ANGLE;
  const [startX, startY] = staleOutlinePoint(segmentStart);
  const [endX, endY] = staleOutlinePoint(segmentEnd);
  return `M ${startX.toFixed(3)} ${startY.toFixed(3)} A ${STALE_OUTLINE_RADIUS} ${STALE_OUTLINE_RADIUS} 0 0 1 ${endX.toFixed(3)} ${endY.toFixed(3)}`;
}).join(' ');

@Component({
  tag: 'ds-map-entity-marker',
  styleUrl: 'MapEntityMarker.css',
  scoped: true,
})
export class MapEntityMarker {
  /** Accessible action label. Describe what activating the marker opens. */
  @Prop() label!: string;

  /** Short visible identifier revealed on hover or keyboard focus. */
  @Prop() caption: string = '';

  /** Canonical IcoMo icon name for the represented map entity. Immobilized state uses MapKey. */
  @Prop() icon: string = 'MapEntityTravelGroup';

  /** Semantic operating state that selects the marker background. */
  @Prop({ reflect: true }) state: MapEntityMarkerState = 'in-motion';

  /** Adds the stale-data outline while preserving the last known operating state. */
  @Prop({ reflect: true }) stale: boolean = false;

  /** Clockwise map heading for travel-group and vehicle icons. Values are normalized to 0–359. */
  @Prop() heading: number = 0;

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
    const markerIsStale = this.stale || this.state === 'stale';
    const markerIcon = this.state === 'immobilized' ? 'MapKey' : this.icon;
    const heading = HEADING_ICONS.has(markerIcon) ? normalizeHeading(this.heading) : 0;

    return (
      <Host
        class={{
          'map-entity-marker': true,
          'map-marker--dimmed': this.dimmed,
          'map-entity-marker--stale': markerIsStale,
        }}
      >
        <button
          ref={element => (this.buttonEl = element)}
          type="button"
          class="map-marker__button ds-focus-ring"
          aria-label={this.label}
          onClick={this.handleClick}
        >
          <span
            class="map-entity-marker__glyph"
            style={{ '--ds-map-entity-marker-heading': `${heading}deg` }}
            aria-hidden="true"
          >
            <ds-icon name={markerIcon} size="sm" color="inherit"></ds-icon>
          </span>
          {markerIsStale && (
            // eslint-disable-next-line compomo/prefer-ds-icon -- The stale ring is a component-owned geometric primitive with eight exact equal arcs.
            <svg class="map-entity-marker__stale-outline" viewBox="0 0 16 16" aria-hidden="true">
              <path d={STALE_OUTLINE_PATH}></path>
            </svg>
          )}
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
