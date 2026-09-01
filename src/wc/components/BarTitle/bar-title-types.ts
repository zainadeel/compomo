import type { ButtonFilledContrast, ButtonFilledIntent } from '../ButtonFilled/ButtonFilled';

export interface BarTitleSection {
  id: string;
  label: string;
  isInactive?: boolean;
}

export interface BarTitleDivider {
  type: 'divider';
}

export type BarTitleSectionItem = BarTitleSection | BarTitleDivider;

export interface BarTitleAction {
  id: string;
  label: string;
  ariaLabel?: string;
  icon?: string;
  isInactive?: boolean;
  isDestructive?: boolean;
}

export interface BarTitlePrimaryAction extends BarTitleAction {
  intent?: ButtonFilledIntent;
  contrast?: ButtonFilledContrast;
  isLoading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  collapse?: BarTitlePrimaryActionCollapse;
}

export type BarTitleActionItem = BarTitleAction | BarTitleDivider;

export type BarTitleActionAppearance = 'filled' | 'unfilled';
export type BarTitleActionCollapse = 'auto' | 'never';
export type BarTitleActionMobile = 'auto' | 'visible' | 'overflow';

interface BarTitleVisibleActionBase extends BarTitleAction {
  appearance?: BarTitleActionAppearance;
  intent?: ButtonFilledIntent;
  contrast?: ButtonFilledContrast;
  isLoading?: boolean;
  buttonType?: 'button' | 'submit' | 'reset';
  /** Auto moves the action into overflow only in constrained presentation. */
  collapse?: BarTitleActionCollapse;
  /**
   * Mobile defaults icon actions to visible and all labeled actions to overflow.
   * `visible` is supported only by icon actions.
   */
  mobile?: BarTitleActionMobile;
}

/** Visible labeled command in the authored action order. */
export interface BarTitleButtonAction extends BarTitleVisibleActionBase {
  type: 'button';
}

/** Visible icon-only command. ariaLabel is required because label is not rendered. */
export interface BarTitleIconAction extends BarTitleVisibleActionBase {
  type: 'icon';
  icon: string;
  ariaLabel: string;
}

export type BarTitleMenuChoice = BarTitleAction;
export type BarTitleMenuChoiceItem = BarTitleMenuChoice | BarTitleDivider;

/** Visible labeled menu button. Selecting a choice emits that choice's flat id. */
export interface BarTitleMenuAction extends BarTitleVisibleActionBase {
  type: 'menu';
  choices: BarTitleMenuChoiceItem[];
  menuAriaLabel?: string;
}

/** Command with a dedicated menu segment; defaults filled when appearance is omitted. */
export interface BarTitleSplitAction extends BarTitleVisibleActionBase {
  type: 'split';
  choices: BarTitleMenuChoiceItem[];
  menuAriaLabel: string;
}

/** Command that is always presented in the shared overflow menu. */
export interface BarTitleOverflowAction extends BarTitleAction {
  type: 'overflow';
}

/**
 * Ordered page-header action model. IDs must be non-empty and unique across
 * top-level actions and every nested menu choice. At most the first eligible
 * action renders beside the title; remaining actions use the text-only overflow.
 */
export type BarTitleActionConfigItem =
  | BarTitleButtonAction
  | BarTitleIconAction
  | BarTitleMenuAction
  | BarTitleSplitAction
  | BarTitleOverflowAction
  | BarTitleDivider;

export type BarTitleVariant = 'expanded' | 'compact' | 'constrained';
export type BarTitlePlacement = 'page' | 'shell-bar';

export type BarTitlePrimaryActionCollapse = 'auto' | 'never';

export function isBarTitleDivider(
  item: BarTitleSectionItem | BarTitleActionItem
): item is BarTitleDivider {
  return 'type' in item && item.type === 'divider';
}
