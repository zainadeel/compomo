import type { MenuItemData, MenuSection } from '../Menu/menu-types';
import type {
  BarTitleAction,
  BarTitleActionConfigItem,
  BarTitleActionItem,
  BarTitleDivider,
  BarTitleMenuChoiceItem,
  BarTitlePrimaryAction,
  BarTitleVariant,
} from './bar-title-types';

export type BarTitleActionPresentation = BarTitleVariant | 'mobile';

export function isBarTitleActionDivider(
  item: BarTitleActionConfigItem | BarTitleMenuChoiceItem
): item is BarTitleDivider {
  return 'type' in item && item.type === 'divider';
}

export function resolveBarTitleActionItems(
  actionItems: BarTitleActionConfigItem[] | undefined,
  primaryAction: BarTitlePrimaryAction | null,
  actions: BarTitleActionItem[]
): BarTitleActionConfigItem[] {
  if (actionItems !== undefined) return actionItems;

  const resolved: BarTitleActionConfigItem[] = [];
  if (primaryAction) {
    const { type, ...primary } = primaryAction;
    resolved.push({
      ...primary,
      type: 'button',
      buttonType: type,
      appearance: 'filled',
    });
  }
  for (const action of actions) {
    resolved.push(
      'type' in action
        ? action
        : {
            ...action,
            type: 'overflow',
          }
    );
  }
  return resolved;
}

function nestedChoices(item: BarTitleActionConfigItem): BarTitleMenuChoiceItem[] | undefined {
  return item.type === 'menu' || item.type === 'split' ? item.choices : undefined;
}

export function barTitleActionIdIssues(items: BarTitleActionConfigItem[]): string[] {
  const seen = new Set<string>();
  const issues: string[] = [];
  const visit = (id: string) => {
    if (!id.trim()) {
      issues.push('Action ids must be non-empty.');
      return;
    }
    if (seen.has(id)) {
      issues.push(`Duplicate action id: ${id}`);
      return;
    }
    seen.add(id);
  };

  for (const item of items) {
    if (isBarTitleActionDivider(item)) continue;
    visit(item.id);
    for (const choice of nestedChoices(item) ?? []) {
      if (!isBarTitleActionDivider(choice)) visit(choice.id);
    }
  }
  return issues;
}

function actionCollapses(
  item: BarTitleActionConfigItem,
  presentation: BarTitleActionPresentation
): boolean {
  if (isBarTitleActionDivider(item) || item.type === 'overflow') return false;
  if (presentation === 'mobile') {
    if (item.type !== 'icon') return true;
    return (item.mobile ?? 'auto') === 'overflow';
  }
  return presentation === 'constrained' && (item.collapse ?? 'auto') === 'auto';
}

export function visibleBarTitleActions(
  items: BarTitleActionConfigItem[],
  presentation: BarTitleActionPresentation
): BarTitleActionConfigItem[] {
  const primary = items.find(
    item =>
      !isBarTitleActionDivider(item) &&
      item.type !== 'overflow' &&
      !actionCollapses(item, presentation)
  );
  return primary ? [primary] : [];
}

function menuItem(action: BarTitleAction, includeIcon: boolean = true): MenuItemData {
  return {
    label: action.label,
    value: action.id,
    icon: includeIcon ? action.icon : undefined,
    isInactive: action.isInactive,
    isDestructive: action.isDestructive,
  };
}

function appendChoices(
  output: Array<MenuItemData | BarTitleDivider>,
  choices: BarTitleMenuChoiceItem[],
  includeIcons: boolean = true
) {
  for (const choice of choices) {
    output.push(isBarTitleActionDivider(choice) ? choice : menuItem(choice, includeIcons));
  }
}

function toSections(items: Array<MenuItemData | BarTitleDivider>): MenuSection[] {
  const sections: MenuSection[] = [];
  let current: MenuItemData[] = [];
  const commit = () => {
    if (current.length > 0) sections.push({ items: current });
    current = [];
  };

  for (const item of items) {
    if ('type' in item && item.type === 'divider') commit();
    else current.push(item as MenuItemData);
  }
  commit();
  return sections;
}

export function barTitleChoiceSections(choices: BarTitleMenuChoiceItem[]): MenuSection[] {
  const rows: Array<MenuItemData | BarTitleDivider> = [];
  appendChoices(rows, choices);
  return toSections(rows);
}

export function overflowBarTitleActionSections(
  items: BarTitleActionConfigItem[],
  presentation: BarTitleActionPresentation
): MenuSection[] {
  const rows: Array<MenuItemData | BarTitleDivider> = [];
  const [visibleAction] = visibleBarTitleActions(items, presentation);

  for (const item of items) {
    if (isBarTitleActionDivider(item)) {
      rows.push(item);
      continue;
    }
    if (item.type === 'overflow') {
      rows.push(menuItem(item, false));
      continue;
    }
    if (item === visibleAction) continue;

    if (item.type === 'menu') {
      appendChoices(rows, item.choices, false);
      continue;
    }
    if (item.type === 'split') {
      rows.push(menuItem(item, false));
      appendChoices(rows, item.choices, false);
      continue;
    }
    rows.push(menuItem(item, false));
  }

  return toSections(rows);
}

export function findBarTitleAction(
  items: BarTitleActionConfigItem[],
  id: string
): BarTitleAction | undefined {
  for (const item of items) {
    if (isBarTitleActionDivider(item)) continue;
    if (item.id === id) return item;
    const choice = nestedChoices(item)?.find(
      candidate => !isBarTitleActionDivider(candidate) && candidate.id === id
    );
    if (choice && !isBarTitleActionDivider(choice)) return choice;
  }
  return undefined;
}
