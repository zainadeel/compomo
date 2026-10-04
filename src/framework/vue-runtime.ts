import { defineContainer as createStencilContainer } from '@stencil/vue-output-target/runtime';
export { defineStencilSSRComponent } from '@stencil/vue-output-target/runtime';
export type { StencilVueComponent } from '@stencil/vue-output-target/runtime';

/** Preserve omitted ARIA values while retaining Stencil's generated Vue bridge. */
export function defineContainer<Props, VModelType = string | number | boolean>(
  ...args: Parameters<typeof createStencilContainer>
) {
  const component = createStencilContainer<Props, VModelType>(...args);
  // Vue's setup-function overload hides the runtime component options object.
  const { props } = component as unknown as { props: Record<string, { default?: unknown }> };
  for (const name of args[2] ?? []) {
    // The upstream bridge forwards ARIA props even when they contain its private
    // empty sentinel. Stencil would stringify that sentinel as "Symbol()",
    // replacing an accessible name or creating an invalid ARIA reference.
    if (name.startsWith('aria') && typeof props[name]?.default === 'symbol') {
      props[name] = { ...props[name], default: undefined };
    }
  }
  return component;
}
