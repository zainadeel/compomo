import { Component, Prop, h, Host } from '@stencil/core';

export type TextVariant =
  | 'text-display-medium'
  | 'text-display-small'
  | 'text-title-large'
  | 'text-title-medium'
  | 'text-title-small'
  | 'text-body-large'
  | 'text-body-large-emphasis'
  | 'text-body-medium'
  | 'text-body-medium-emphasis'
  | 'text-body-small'
  | 'text-body-small-emphasis'
  | 'text-caption'
  | 'text-caption-emphasis';

export type TextColorToken =
  | 'primary' | 'secondary' | 'tertiary'
  | 'brand' | 'negative' | 'positive' | 'warning' | 'caution' | 'ai'
  | 'on-strong' | 'on-bold' | 'inherit';

export type TextColor = TextColorToken | `var(--${string})`;
export type TextDecoration = 'none' | 'underline' | 'dotted-underline';
export type TextAlign = 'left' | 'center' | 'right';
export type LineTruncation = 1 | 2 | 3 | 4 | 5 | 'none';
export type TextWrap = 'wrap' | 'nowrap' | 'balance' | 'pretty';
export type TextElement = 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

@Component({
  tag: 'ds-text',
  styleUrl: 'Text.css',
  scoped: true,
})
export class Text {
  @Prop() variant: TextVariant = 'text-body-medium';
  @Prop() color: TextColor | undefined;
  @Prop() decoration: TextDecoration | undefined;
  @Prop() italic: boolean = false;
  @Prop() align: TextAlign | undefined;
  @Prop() lineTruncation: LineTruncation = 'none';
  @Prop() wrap: TextWrap | undefined;
  @Prop() as: TextElement = 'p';
  /** Maps to `for` attribute on <label> elements. */
  @Prop() for: string | undefined;

  render() {
    const Tag = this.as as any;
    const isCustomColor = (c: TextColor) => typeof c === 'string' && c.startsWith('var(--');

    const cls: Record<string, boolean> = {
      [this.variant]: true,
      'text': true,
      'text--nowrap': this.wrap === 'nowrap',
      'text--balance': this.wrap === 'balance',
      'text--pretty': this.wrap === 'pretty',
      'text--truncate-1': this.lineTruncation === 1 && this.wrap !== 'nowrap',
      'text--truncate-2': this.lineTruncation === 2 && this.wrap !== 'nowrap',
      'text--truncate-3': this.lineTruncation === 3 && this.wrap !== 'nowrap',
      'text--truncate-4': this.lineTruncation === 4 && this.wrap !== 'nowrap',
      'text--truncate-5': this.lineTruncation === 5 && this.wrap !== 'nowrap',
      'text--color-primary':   this.color === 'primary',
      'text--color-secondary': this.color === 'secondary',
      'text--color-tertiary':  this.color === 'tertiary',
      'text--color-brand':     this.color === 'brand',
      'text--color-negative':  this.color === 'negative',
      'text--color-positive':  this.color === 'positive',
      'text--color-warning':   this.color === 'warning',
      'text--color-caution':   this.color === 'caution',
      'text--color-ai':        this.color === 'ai',
      'text--color-on-strong': this.color === 'on-strong',
      'text--color-on-bold':   this.color === 'on-bold',
      'text--color-inherit':   this.color === 'inherit',
      'text--decoration-underline':        this.decoration === 'underline',
      'text--decoration-dotted-underline': this.decoration === 'dotted-underline',
      'text--italic': this.italic,
      'text--align-left':   this.align === 'left',
      'text--align-center': this.align === 'center',
      'text--align-right':  this.align === 'right',
    };

    const style = this.color && isCustomColor(this.color)
      ? { color: this.color as string }
      : undefined;

    const extraProps: Record<string, string> = {};
    if (this.as === 'label' && this.for) extraProps['for'] = this.for;

    return (
      <Host style={{ display: 'contents' }}>
        <Tag class={cls} style={style} {...extraProps}>
          <slot />
        </Tag>
      </Host>
    );
  }
}
