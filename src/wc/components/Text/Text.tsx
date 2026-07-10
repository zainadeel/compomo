import { Component, Prop, h, Host } from '@stencil/core';
import { textDisplayClass, textVariantClass } from './text-utils';
import type {
  TextAlign,
  TextColor,
  TextDecoration,
  TextElement,
  TextFontFeature,
  TextVariant,
  LineTruncation,
  TextWrap,
} from './text-types';

@Component({
  tag: 'ds-text',
  styleUrl: 'Text.css',
  scoped: true,
})
export class Text {
  @Prop() variant: TextVariant = 'text-body-medium';
  /**
   * Heavier weight + tighter letter-spacing for the variant.
   * `false` (default): one step below emphasis (display semibold, title/body
   * medium, caption medium).
   * `true`: display bold, title/caption semibold, body medium.
   */
  @Prop() emphasis: boolean = false;
  @Prop() color: TextColor | undefined;
  @Prop() decoration: TextDecoration | undefined;
  @Prop() italic: boolean = false;
  @Prop() align: TextAlign | undefined;
  @Prop() lineTruncation: LineTruncation = 'none';
  @Prop() wrap: TextWrap | undefined;
  @Prop() fontFeature: TextFontFeature = 'normal';
  @Prop() as: TextElement = 'p';
  /** Maps to `for` attribute on <label> elements. */
  @Prop() for: string | undefined;
  /** Forwarded to the inner element (e.g. aria-labelledby targets). */
  @Prop() textId: string | undefined;

  render() {
    // Polymorphic element: TSX treats a variable tag as a component, so a
    // dynamic intrinsic element name must be cast to `any` to render.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Tag = this.as as any;
    const isCustomColor = (c: TextColor) => typeof c === 'string' && c.startsWith('var(--');

    const cls: Record<string, boolean> = {
      'ds-text': true,
      [textDisplayClass(this.as)]: true,
      [textVariantClass(this.variant)]: true,
      'ds-text--emphasis': this.emphasis,
      'ds-text--regular': !this.emphasis,
      'ds-text--nowrap': this.wrap === 'nowrap',
      'ds-text--balance': this.wrap === 'balance',
      'ds-text--pretty': this.wrap === 'pretty',
      'ds-text--truncate-1': this.lineTruncation === 1 && this.wrap !== 'nowrap',
      'ds-text--truncate-2': this.lineTruncation === 2 && this.wrap !== 'nowrap',
      'ds-text--truncate-3': this.lineTruncation === 3 && this.wrap !== 'nowrap',
      'ds-text--truncate-4': this.lineTruncation === 4 && this.wrap !== 'nowrap',
      'ds-text--truncate-5': this.lineTruncation === 5 && this.wrap !== 'nowrap',
      'ds-text--color-primary':   this.color === 'primary',
      'ds-text--color-secondary': this.color === 'secondary',
      'ds-text--color-tertiary':  this.color === 'tertiary',
      'ds-text--color-brand':     this.color === 'brand',
      'ds-text--color-negative':  this.color === 'negative',
      'ds-text--color-positive':  this.color === 'positive',
      'ds-text--color-warning':   this.color === 'warning',
      'ds-text--color-caution':   this.color === 'caution',
      'ds-text--color-ai':        this.color === 'ai',
      'ds-text--color-on-strong': this.color === 'on-strong',
      'ds-text--color-on-bold':   this.color === 'on-bold',
      'ds-text--color-inherit':   this.color === 'inherit',
      'ds-text--decoration-underline':        this.decoration === 'underline',
      'ds-text--decoration-dotted-underline': this.decoration === 'dotted-underline',
      'ds-text--italic': this.italic,
      'ds-text--align-left':   this.align === 'left',
      'ds-text--align-center': this.align === 'center',
      'ds-text--align-right':  this.align === 'right',
      'ds-text--font-feature-tabular-nums': this.fontFeature === 'tabular-nums',
    };

    const style = this.color && isCustomColor(this.color)
      ? { color: this.color as string }
      : undefined;

    const extraProps: Record<string, string> = {};
    if (this.as === 'label' && this.for) extraProps['for'] = this.for;
    if (this.textId) extraProps['id'] = this.textId;

    return (
      <Host class={cls} style={style}>
        <Tag class="ds-text__element" {...extraProps}>
          <slot />
        </Tag>
      </Host>
    );
  }
}
