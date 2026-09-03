import { Component, Prop, h, Host } from '@stencil/core';
import { SCORE_VALUE_VARIANT, resolveScoreLevel } from './score-model';
import type { SafetyScoreLevel, ScoreSize } from './score-types';

@Component({
  tag: 'ds-score',
  styleUrl: 'Score.css',
  scoped: true,
})
export class Score {
  /** Display-ready headline figure. */
  @Prop() value: string | number = '';
  /**
   * Visual density matching control height: `sm` 24px, `md` 32px, `lg` 40px.
   * `lg` is the Card Overview recipe.
   */
  @Prop() size: ScoreSize = 'md';
  /**
   * Safety-score color level. Numeric values from 0–100 infer fair (0–50),
   * good (51–80), or excellent (81–100) when this is omitted.
   */
  @Prop() level: SafetyScoreLevel | undefined;
  /** Replace the figure with a skeleton while data resolves. */
  @Prop() isLoading: boolean = false;
  /** Accessible name prefix, for example “Safety score”. */
  @Prop() label: string = '';

  render() {
    const size = this.size;
    const level = resolveScoreLevel(this.value, this.level);
    const valueVariant = SCORE_VALUE_VARIANT[size];
    const accessibleName = [this.label.trim(), this.isLoading ? '' : this.value]
      .filter(Boolean)
      .join(' ');

    return (
      <Host
        class={{
          score: true,
          [`score--${size}`]: true,
          'score--loading': this.isLoading,
        }}
        role={accessibleName ? 'img' : undefined}
        aria-busy={this.isLoading ? 'true' : undefined}
        aria-label={accessibleName || undefined}
      >
        <span
          class={{
            score__badge: true,
            [`score__badge--${level}`]: Boolean(level),
            'score__badge--loading': this.isLoading,
          }}
        >
          {this.isLoading ? (
            <ds-skeleton
              class="score__value"
              variant="text"
              textVariant={valueVariant}
              background={level ? 'bold' : 'faint'}
            />
          ) : (
            <ds-text
              as="span"
              class="score__value ds-control-label-box"
              variant={valueVariant}
              emphasis={true}
              color="inherit"
              fontFeature="tabular-nums"
            >
              {this.value}
            </ds-text>
          )}
        </span>
      </Host>
    );
  }
}
