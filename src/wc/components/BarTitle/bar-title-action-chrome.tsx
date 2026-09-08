import { h } from '@stencil/core';
import type { MenuItemData, MenuSection } from '../Menu/menu-types';
import { isBarTitleDivider } from './bar-title-types';
import type {
  BarTitleActionConfigItem,
  BarTitleMenuAction,
  BarTitlePrimaryAction,
  BarTitleSplitAction,
} from './bar-title-types';
import { barTitleChoiceSections } from './bar-title-actions';

export type FocusableBarTitleButton = HTMLElement & {
  setFocus?: (segment?: 'primary' | 'menu') => Promise<void>;
};

export function barTitleActionMenuDomId(
  classPrefix: string,
  instanceId: number,
  resolvedActionItems: BarTitleActionConfigItem[],
  id: string
): string {
  const index = resolvedActionItems.findIndex(item => !isBarTitleDivider(item) && item.id === id);
  return `${classPrefix}-action-menu-${instanceId}-${index}`;
}

export function barTitleActionMenuAnchor(
  id: string,
  overflowTrigger: FocusableBarTitleButton | null,
  actionTriggers: Map<string, FocusableBarTitleButton>
): HTMLElement | undefined {
  if (id === '__overflow') return overflowTrigger ?? undefined;
  const trigger = actionTriggers.get(id);
  if (!trigger) return undefined;
  const splitMenu = trigger.querySelector<HTMLElement>('.ds-button-split__menu');
  return splitMenu ?? trigger;
}

export async function restoreBarTitleActionFocus(options: {
  menuId: string;
  overflowTrigger: FocusableBarTitleButton | null;
  actionTriggers: Map<string, FocusableBarTitleButton>;
  resolvedActionItems: BarTitleActionConfigItem[];
}): Promise<void> {
  if (options.menuId === '__overflow') {
    await options.overflowTrigger?.setFocus?.();
    return;
  }
  const trigger = options.actionTriggers.get(options.menuId);
  if (!trigger || !('setFocus' in trigger)) return;
  const split = options.resolvedActionItems.some(
    item => !isBarTitleDivider(item) && item.id === options.menuId && item.type === 'split'
  );
  await trigger.setFocus?.(split ? 'menu' : undefined);
}

function className(prefix: string, part: string): string {
  return `${prefix}__${part}`;
}

export function renderBarTitleBack(options: {
  classPrefix: string;
  showBack: boolean;
  backAriaLabel: string;
  onBack: (event: MouseEvent) => void;
}) {
  if (!options.showBack) return null;
  return (
    <ds-tooltip label="Go back" side="bottom" size="sm">
      <ds-button-unfilled
        class={className(options.classPrefix, 'back')}
        variant="icon"
        icon="ChevronLeft"
        aria-label={options.backAriaLabel}
        size="md"
        activeFill={false}
        hasBorder={false}
        onDsClick={(event: CustomEvent<MouseEvent>) => options.onBack(event.detail)}
      />
    </ds-tooltip>
  );
}

export function renderBarTitleSectionTrigger(options: {
  classPrefix: string;
  triggerId: string;
  menuId: string;
  open: boolean;
  surfaceOpen: boolean;
  ariaLabel: string;
  selectedLabel: string;
  setTriggerEl: (el: HTMLButtonElement | null) => void;
  onToggle: (event: MouseEvent) => void;
}) {
  const prefix = options.classPrefix;
  return (
    <div class={className(prefix, 'section-selector')}>
      <button
        ref={el => {
          options.setTriggerEl((el as HTMLButtonElement | null) ?? null);
        }}
        id={options.triggerId}
        class={{
          [className(prefix, 'section-trigger')]: true,
          [`${className(prefix, 'section-trigger')}--expanded`]: options.open,
          'ds-interaction-fill--surface-open': options.surfaceOpen,
          'ds-control--md': true,
          'ds-focus-ring-inset': true,
          'ds-interaction-fill': true,
        }}
        type="button"
        aria-haspopup="menu"
        aria-controls={options.menuId}
        aria-expanded={String(options.open)}
        aria-label={options.ariaLabel}
        onClick={options.onToggle}
      >
        <ds-text
          class={`${className(prefix, 'section-label')} ds-interaction-fill__content`}
          as="span"
          variant="text-body-medium"
          emphasis
          color="primary"
          lineTruncation={1}
        >
          {options.selectedLabel}
        </ds-text>
        <ds-icon
          class={`${className(prefix, 'section-chevron')} ds-interaction-fill__content`}
          name="ChevronUpDown"
          size="md"
          color="inherit"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function renderVisibleAction(
  action: BarTitleActionConfigItem,
  options: {
    classPrefix: string;
    compact: boolean;
    actionItems: BarTitleActionConfigItem[] | undefined;
    primaryAction: BarTitlePrimaryAction | null;
    resolvedActionItems: BarTitleActionConfigItem[];
    instanceId: number;
    openActionMenuId: string;
    surfaceActionMenuId: string;
    actionTriggers: Map<string, FocusableBarTitleButton>;
    toggleActionMenu: (id: string, event: MouseEvent) => void;
    emitAction: (id: string) => void;
  }
) {
  if (isBarTitleDivider(action) || action.type === 'overflow') return null;
  const appearance = action.appearance ?? (action.type === 'split' ? 'filled' : 'unfilled');
  const variant: 'icon' | 'icon-label' | 'label' =
    action.type === 'icon' ? 'icon' : action.icon ? 'icon-label' : 'label';
  const menu = action.type === 'menu';
  const menuId = menu
    ? barTitleActionMenuDomId(
        options.classPrefix,
        options.instanceId,
        options.resolvedActionItems,
        action.id
      )
    : undefined;
  const prefix = options.classPrefix;

  if (action.type === 'split') {
    const splitMenuId = barTitleActionMenuDomId(
      options.classPrefix,
      options.instanceId,
      options.resolvedActionItems,
      action.id
    );
    const splitProps = {
      key: action.id,
      ref: (el: FocusableBarTitleButton | undefined) => {
        if (el) options.actionTriggers.set(action.id, el);
        else options.actionTriggers.delete(action.id);
      },
      class: `${className(prefix, 'action')} ${className(prefix, 'split-action')}`,
      split: true,
      variant,
      label: action.label,
      icon: action.icon ?? '',
      menuAriaLabel: action.menuAriaLabel,
      controls: splitMenuId,
      expanded: options.openActionMenuId === action.id,
      surfaceOpen: options.surfaceActionMenuId === action.id,
      size: 'md' as const,
      type: action.buttonType ?? 'button',
      isInactive: action.isInactive,
      isLoading: action.isLoading,
      onDsClick: () => options.emitAction(action.id),
      onDsMenuClick: (event: CustomEvent<MouseEvent>) =>
        options.toggleActionMenu(action.id, event.detail),
    };
    return appearance === 'filled' ? (
      <ds-button-filled
        {...splitProps}
        intent={action.intent ?? 'brand'}
        contrast={action.contrast ?? 'bold'}
      />
    ) : (
      <ds-button-unfilled {...splitProps} />
    );
  }

  const buttonProps = {
    key: action.id,
    ref: (el: FocusableBarTitleButton | undefined) => {
      if (el) options.actionTriggers.set(action.id, el);
      else options.actionTriggers.delete(action.id);
    },
    class: `${className(prefix, 'action')} ${className(prefix, 'action')}--${action.type}${
      options.actionItems === undefined && action.id === options.primaryAction?.id
        ? ` ${className(prefix, 'primary-action')}`
        : ''
    }`,
    variant,
    icon: action.icon ?? '',
    label: action.label,
    ariaLabel: action.ariaLabel ?? (action.type === 'icon' ? action.label : undefined),
    size: 'md' as const,
    type: action.buttonType ?? 'button',
    isInactive: action.isInactive,
    isLoading: action.isLoading,
    controls: menuId,
    expanded: menu ? options.openActionMenuId === action.id : undefined,
    surfaceOpen: menu && options.surfaceActionMenuId === action.id,
    hasMenu: menu,
    onDsClick: (event: CustomEvent<MouseEvent>) => {
      if (menu) options.toggleActionMenu(action.id, event.detail);
      else options.emitAction(action.id);
    },
  };

  const button =
    appearance === 'filled' ? (
      <ds-button-filled
        {...buttonProps}
        intent={action.intent ?? 'brand'}
        contrast={action.contrast ?? 'bold'}
      />
    ) : (
      <ds-button-unfilled {...buttonProps} />
    );

  return action.type === 'icon' ? (
    <ds-tooltip key={action.id} label={action.label} side="bottom" size="sm">
      {button}
    </ds-tooltip>
  ) : (
    button
  );
}

export function renderBarTitleActions(options: {
  classPrefix: string;
  compact: boolean;
  visibleActions: BarTitleActionConfigItem[];
  showOverflowTrigger: boolean;
  actionItems: BarTitleActionConfigItem[] | undefined;
  primaryAction: BarTitlePrimaryAction | null;
  resolvedActionItems: BarTitleActionConfigItem[];
  instanceId: number;
  openActionMenuId: string;
  surfaceActionMenuId: string;
  actionsAriaLabel: string;
  actionMenuTriggerId: string;
  actionMenuId: string;
  actionTriggers: Map<string, FocusableBarTitleButton>;
  setOverflowTriggerEl: (el: FocusableBarTitleButton | null) => void;
  toggleActionMenu: (id: string, event: MouseEvent) => void;
  emitAction: (id: string) => void;
}) {
  if (options.visibleActions.length === 0 && !options.showOverflowTrigger) return null;
  const prefix = options.classPrefix;

  return (
    <div class={className(prefix, 'actions')}>
      {options.visibleActions.map(action => renderVisibleAction(action, options))}
      {options.showOverflowTrigger ? (
        <ds-tooltip label="Page options" side="bottom" size="sm">
          <ds-button-unfilled
            ref={el => {
              options.setOverflowTriggerEl((el as FocusableBarTitleButton | null) ?? null);
            }}
            id={options.actionMenuTriggerId}
            class={className(prefix, 'more-actions')}
            variant="icon"
            icon="Ellipses"
            aria-label={options.actionsAriaLabel}
            size="md"
            activeFill={!options.compact}
            hasBorder={options.visibleActions.length > 0}
            haspopup="menu"
            controls={options.actionMenuId}
            expanded={options.openActionMenuId === '__overflow'}
            surfaceOpen={options.surfaceActionMenuId === '__overflow'}
            onDsClick={(event: CustomEvent<MouseEvent>) =>
              options.toggleActionMenu('__overflow', event.detail)
            }
          />
        </ds-tooltip>
      ) : null}
    </div>
  );
}

export function renderBarTitleActionMenus(options: {
  classPrefix: string;
  visibleActions: BarTitleActionConfigItem[];
  instanceId: number;
  resolvedActionItems: BarTitleActionConfigItem[];
  openActionMenuId: string;
  actionMenuInitialFocusVisible: boolean;
  overflowTrigger: FocusableBarTitleButton | null;
  actionTriggers: Map<string, FocusableBarTitleButton>;
  closeActionMenu: () => void;
  finishActionMenuClose: (event: CustomEvent<void>) => void;
  handleActionSelect: (event: CustomEvent<MenuItemData>) => void;
}) {
  const prefix = options.classPrefix;
  return options.visibleActions.flatMap(action => {
    if (isBarTitleDivider(action) || (action.type !== 'menu' && action.type !== 'split')) {
      return [];
    }
    const menuAction = action as BarTitleMenuAction | BarTitleSplitAction;
    const menuLabel = menuAction.menuAriaLabel ?? menuAction.ariaLabel ?? menuAction.label;
    return [
      <ds-menu
        key={action.id}
        id={barTitleActionMenuDomId(
          options.classPrefix,
          options.instanceId,
          options.resolvedActionItems,
          action.id
        )}
        class={className(prefix, 'action-menu')}
        anchor={barTitleActionMenuAnchor(
          action.id,
          options.overflowTrigger,
          options.actionTriggers
        )}
        align="end"
        menuLabel={menuLabel}
        open={options.openActionMenuId === action.id}
        initialFocusVisible={options.actionMenuInitialFocusVisible}
        sections={barTitleChoiceSections(menuAction.choices)}
        onDsClose={options.closeActionMenu}
        onDsAfterClose={options.finishActionMenuClose}
        onDsSelect={options.handleActionSelect}
      />,
    ];
  });
}

export function renderBarTitleOverflowMenu(options: {
  classPrefix: string;
  showOverflowTrigger: boolean;
  actionMenuId: string;
  actionMenuTriggerId: string;
  actionsAriaLabel: string;
  open: boolean;
  actionMenuInitialFocusVisible: boolean;
  actionMenuSections: MenuSection[];
  closeActionMenu: () => void;
  finishActionMenuClose: (event: CustomEvent<void>) => void;
  handleActionSelect: (event: CustomEvent<MenuItemData>) => void;
}) {
  if (!options.showOverflowTrigger) return null;
  return (
    <ds-menu
      id={options.actionMenuId}
      class={className(options.classPrefix, 'action-menu')}
      anchorId={options.actionMenuTriggerId}
      align="end"
      menuLabel={options.actionsAriaLabel}
      open={options.open}
      initialFocusVisible={options.actionMenuInitialFocusVisible}
      sections={options.actionMenuSections}
      onDsClose={options.closeActionMenu}
      onDsAfterClose={options.finishActionMenuClose}
      onDsSelect={options.handleActionSelect}
    />
  );
}
