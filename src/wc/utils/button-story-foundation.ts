export const BUTTON_STORY_VARIANTS = ['label', 'icon', 'icon-label'] as const;
export const BUTTON_STORY_SIZES = ['lg', 'md', 'sm', 'xs'] as const;
export const BUTTON_STORY_WIDTHS = ['hug', 'fill'] as const;

export const BUTTON_STORY_ROW =
  'display:flex;gap:var(--dimension-space-100);align-items:center;flex-wrap:wrap;';
export const BUTTON_STORY_COLUMN =
  'display:flex;flex-direction:column;gap:var(--dimension-space-150);align-items:flex-start;';
export const BUTTON_STORY_SURFACE =
  'display:flex;gap:var(--dimension-space-100);align-items:center;padding:var(--dimension-space-150);border-radius:var(--dimension-radius-100);';

type MenuTriggerElement = HTMLElement & {
  expanded: boolean;
  setFocus: (segment?: 'primary' | 'menu') => void;
};

type MenuElement = HTMLElement & {
  anchor?: HTMLElement;
  open: boolean;
  initialFocusVisible: boolean;
};

/** Shared Storybook wiring for the two semantic menu-button components. */
export function wireButtonStoryMenuTriggers(root: Element | undefined) {
  if (!root) return;
  root.querySelectorAll('[data-menu-trigger]').forEach(node => {
    const trigger = node as MenuTriggerElement & { dataset: DOMStringMap };
    if (trigger.dataset['wired'] === 'true') return;
    trigger.dataset['wired'] = 'true';

    const menu = root.querySelector<MenuElement>(`#${trigger.dataset['menuTrigger']}`);
    if (!menu) return;

    const setOpen = (open: boolean) => {
      trigger.expanded = open;
      menu.open = open;
    };

    trigger.addEventListener('dsClick', event => {
      menu.initialFocusVisible = (event as CustomEvent<MouseEvent>).detail.detail === 0;
      setOpen(!menu.open);
    });
    menu.addEventListener('dsClose', () => setOpen(false));
    menu.addEventListener('dsSelect', () => {
      setOpen(false);
      requestAnimationFrame(() => trigger.setFocus());
    });
  });
}

/** Shared Storybook wiring for native split mode on either button family. */
export function wireButtonStorySplitTriggers(root: Element | undefined) {
  if (!root) return;
  root.querySelectorAll('[data-split-menu-trigger]').forEach(node => {
    const trigger = node as MenuTriggerElement & { dataset: DOMStringMap };
    if (trigger.dataset['splitWired'] === 'true') return;
    trigger.dataset['splitWired'] = 'true';

    const menu = root.querySelector<MenuElement>(`#${trigger.dataset['splitMenuTrigger']}`);
    if (!menu) return;

    const setOpen = (open: boolean) => {
      trigger.expanded = open;
      menu.anchor = trigger.querySelector<HTMLElement>('.ds-button-split__menu') ?? undefined;
      menu.open = open;
    };

    trigger.addEventListener('dsMenuClick', event => {
      menu.initialFocusVisible = (event as CustomEvent<MouseEvent>).detail.detail === 0;
      setOpen(!menu.open);
    });
    menu.addEventListener('dsClose', () => setOpen(false));
    menu.addEventListener('dsSelect', () => {
      setOpen(false);
      requestAnimationFrame(() => trigger.setFocus('menu'));
    });
  });
}
