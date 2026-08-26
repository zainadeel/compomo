import { createComponent as createLitComponent } from '@lit/react';
import type { EventName, Options } from '@lit/react';
import type React from 'react';

type EventNames = Record<string, EventName | string>;
type StencilProps<I extends HTMLElement, E extends EventNames, C, R extends keyof C = never> = Omit<
  React.HTMLAttributes<I>,
  keyof E
> &
  Partial<{
    [K in keyof E]: E[K] extends EventName<infer T> ? (event: T) => void : (event: Event) => void;
  }> &
  Required<Pick<C, R>> &
  Partial<Omit<C, R>> &
  React.RefAttributes<I>;

/** React component type emitted by Stencil's React output target. */
export type StencilReactComponent<
  I extends HTMLElement,
  E extends EventNames = Record<never, never>,
  C = Omit<I, keyof HTMLElement>,
  R extends keyof C = never,
> = React.FunctionComponent<StencilProps<I, E, C, R>>;

/**
 * Defines a Stencil custom element and adapts it to React through Lit's
 * custom-element bridge. Component rendering remains owned by Stencil.
 */
export function createComponent<
  I extends HTMLElement,
  E extends EventNames = Record<never, never>,
  C = Omit<I, keyof HTMLElement>,
  R extends keyof C = never,
>({
  defineCustomElement,
  tagName,
  transformTag,
  ...options
}: Options<I, E> & {
  defineCustomElement: () => void;
  transformTag?: (tagName: string) => string;
}): StencilReactComponent<I, E, C, R> {
  defineCustomElement?.();
  const resolvedTagName = transformTag ? transformTag(tagName) : tagName;
  return createLitComponent<I, E>({
    ...options,
    tagName: resolvedTagName,
  }) as unknown as StencilReactComponent<I, E, C, R>;
}
