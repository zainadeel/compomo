import { Component, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';

export type MapEntityMarkerState = 'moving' | 'idling' | 'stationary' | 'immobilized' | 'unknown';

const normalizeBearing = (bearing: number): number => {
  if (!Number.isFinite(bearing)) return 0;
  return ((bearing % 360) + 360) % 360;
};

const BEARING_ICONS = new Set(['MapEntityTravelGroup', 'MapEntityVehicle']);

const DASHED_OUTLINE_CENTER = 8;
const DASHED_OUTLINE_RADIUS = 6.5;
const DASHED_OUTLINE_SEGMENT_ANGLE = 45;
const DASHED_OUTLINE_HALF_GAP_ANGLE = 6;

const dashedOutlinePoint = (angle: number): [number, number] => {
  const radians = (angle * Math.PI) / 180;
  return [
    DASHED_OUTLINE_CENTER + DASHED_OUTLINE_RADIUS * Math.cos(radians),
    DASHED_OUTLINE_CENTER + DASHED_OUTLINE_RADIUS * Math.sin(radians),
  ];
};

const DASHED_OUTLINE_PATH = Array.from({ length: 8 }, (_, index) => {
  const segmentStart = index * DASHED_OUTLINE_SEGMENT_ANGLE + DASHED_OUTLINE_HALF_GAP_ANGLE;
  const segmentEnd = (index + 1) * DASHED_OUTLINE_SEGMENT_ANGLE - DASHED_OUTLINE_HALF_GAP_ANGLE;
  const [startX, startY] = dashedOutlinePoint(segmentStart);
  const [endX, endY] = dashedOutlinePoint(segmentEnd);
  return `M ${startX.toFixed(3)} ${startY.toFixed(3)} A ${DASHED_OUTLINE_RADIUS} ${DASHED_OUTLINE_RADIUS} 0 0 1 ${endX.toFixed(3)} ${endY.toFixed(3)}`;
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

  /** Canonical IcoMo icon name for the represented map entity. Immobilized vehicles use MapKey. */
  @Prop() icon: string = 'MapEntityTravelGroup';

  /** Semantic operating state that selects the marker background. */
  @Prop({ reflect: true }) state: MapEntityMarkerState = 'moving';

  /** Adds an optional dashed outline without changing the operating state. */
  @Prop({ reflect: true }) dashed: boolean = false;

  /** Clockwise map bearing for travel-group and vehicle icons. Values are normalized to 0–359. */
  @Prop() bearing: number = 0;

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
    const markerIcon =
      this.state === 'immobilized' && this.icon === 'MapEntityVehicle' ? 'MapKey' : this.icon;
    const bearing = BEARING_ICONS.has(markerIcon) ? normalizeBearing(this.bearing) : 0;

    return (
      <Host
        class={{
          'map-entity-marker': true,
          'map-marker--dimmed': this.dimmed,
          'map-entity-marker--dashed': this.dashed,
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
            style={{ '--ds-map-entity-marker-bearing': `${bearing}deg` }}
            aria-hidden="true"
          >
            <ds-icon name={markerIcon} size="sm" color="inherit"></ds-icon>
          </span>
          {this.dashed && (
            // eslint-disable-next-line compomo/prefer-ds-icon -- The dashed ring is a component-owned geometric primitive with eight exact equal arcs.
            <svg class="map-entity-marker__dashed-outline" viewBox="0 0 16 16" aria-hidden="true">
              <path d={DASHED_OUTLINE_PATH}></path>
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
