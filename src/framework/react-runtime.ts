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
  const events = Object.entries(options.events ?? {});
  const Bridge = createLitComponent<I>({
    ...options,
    // Own subscriptions so unmount releases application callbacks. Lit retains
    // ownership of custom-element properties and native React props.
    events: {},
    tagName: resolvedTagName,
  });
  if (events.length === 0) return Bridge as unknown as StencilReactComponent<I, E, C, R>;
  const React = options.react;
  const useBrowserLayoutEffect =
    typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
  const Component = React.forwardRef<I, Record<string, unknown>>((props, ref) => {
    const element = React.useRef<I | null>(null);
    const elementProps = { ...props };
    for (const [prop] of events) delete elementProps[prop];

    useBrowserLayoutEffect(() => {
      const node = element.current;
      if (!node) return;
      const subscriptions: [string, EventListener][] = [];
      for (const [prop, name] of events) {
        const handler = props[prop];
        if (typeof handler !== 'function') continue;
        const listener: EventListener = event => handler(event);
        node.addEventListener(name, listener);
        subscriptions.push([name, listener]);
      }
      return () => {
        for (const [name, listener] of subscriptions) node.removeEventListener(name, listener);
      };
    });

    const setRef = React.useCallback(
      (node: I | null) => {
        element.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );
    const bridgeProps = { ...elementProps, ref: setRef } as React.ComponentProps<typeof Bridge>;
    return React.createElement(Bridge, bridgeProps);
  });
  Component.displayName = options.displayName ?? resolvedTagName;
  return Component as unknown as StencilReactComponent<I, E, C, R>;
}
