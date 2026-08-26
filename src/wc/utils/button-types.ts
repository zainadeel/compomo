import type { ControlWidth } from './control-width';

export type ButtonVariant = 'icon' | 'label' | 'icon-label';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';
export type ButtonWidth = ControlWidth;
export type ButtonPopup = 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
export type ButtonNativeType = 'button' | 'submit' | 'reset';

export const BUTTON_ICON_SIZE: Record<ButtonSize, ButtonSize> = {
  lg: 'lg',
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

export function buttonShowsIcon(variant: ButtonVariant): boolean {
  return variant === 'icon' || variant === 'icon-label';
}

export function buttonShowsLabel(variant: ButtonVariant): boolean {
  return variant === 'label' || variant === 'icon-label';
}

export function buttonShowsChevron(variant: ButtonVariant, hasMenu: boolean): boolean {
  return hasMenu && variant !== 'icon';
}
