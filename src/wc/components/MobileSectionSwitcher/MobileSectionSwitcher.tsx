import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import type { MenuItemData, MenuSection } from '../Menu/menu-types';
import {
  getSelectableTabs,
  isTabDivider,
  type TabItem,
  type TabItemTab,
} from '../TabGroup/tab-item-utils';
import { resolveMobileSectionPosition } from './mobile-section-switcher-utils';

let nextMobileSectionSwitcherId = 0;

@Component({
  tag: 'ds-mobile-section-switcher',
  styleUrl: 'MobileSectionSwitcher.css',
  scoped: true,
})
export class MobileSectionSwitcher {
  @Element() el!: HTMLElement;

  /** Ordered controlled sections. Divider entries group the popup menu. */
  @Prop() sections: TabItem[] = [];
  /** Controlled selected section id. */
  @Prop() value: string = '';
  /** Accessible name for the section chooser. */
  @Prop() navigationLabel: string = 'Change page section';

  /** Selection intent. The route, tool, or workflow owner updates `value`. */
  @Event() dsChange!: EventEmitter<string>;

  @State() private menuOpen = false;
  @State() private initialFocusVisible = false;

  private readonly instanceId = nextMobileSectionSwitcherId++;
  private readonly triggerId = `ds-mobile-section-switcher-trigger-${this.instanceId}`;
  private readonly menuId = `ds-mobile-section-switcher-menu-${this.instanceId}`;
  private triggerEl: HTMLButtonElement | null = null;

  private get resolvedSections(): TabItem[] {
    return this.sections ?? [];
  }

  private get selectableSections(): TabItemTab[] {
    return getSelectableTabs(this.resolvedSections);
  }

  private get selectedIndex(): number {
    return resolveMobileSectionPosition(this.resolvedSections, this.value).selectedIndex;
  }

  private get selectedSection(): TabItemTab | undefined {
    return this.selectableSections[this.selectedIndex];
  }

  private get hasPrevious(): boolean {
    return resolveMobileSectionPosition(this.resolvedSections, this.value).hasPrevious;
  }

  private get hasNext(): boolean {
    return resolveMobileSectionPosition(this.resolvedSections, this.value).hasNext;
  }

  private get triggerAriaLabel(): string {
    return `${this.navigationLabel}. Current section: ${this.selectedSection?.label ?? ''}`;
  }

  private get menuSections(): MenuSection[] {
    const groups: MenuSection[] = [];
    let items: MenuItemData[] = [];
    const commit = () => {
      if (items.length) groups.push({ items });
      items = [];
    };

    for (const section of this.resolvedSections) {
      if (isTabDivider(section)) {
        commit();
        continue;
      }
      items.push({
        label: section.label,
        value: section.id,
        dot: section.dot,
        isSelected: section.id === this.selectedSection?.id,
        isInactive: section.isInactive,
      });
    }
    commit();
    return groups;
  }

  @Watch('sections')
  handleSectionsChange() {
    if (this.selectableSections.length <= 1) this.closeMenu();
  }

  private toggleMenu = (event: MouseEvent) => {
    if (this.selectableSections.length <= 1) return;
    this.initialFocusVisible = event.detail === 0;
    this.menuOpen = !this.menuOpen;
  };

  private closeMenu = () => {
    this.menuOpen = false;
  };

  private handleSelect = (event: CustomEvent<MenuItemData>) => {
    const id = String(event.detail.value ?? '');
    const section = this.selectableSections.find(candidate => candidate.id === id);
    if (!section || section.isInactive) return;
    this.closeMenu();
    if (id !== this.selectedSection?.id) this.dsChange.emit(id);
    requestAnimationFrame(() => this.triggerEl?.focus());
  };

  render() {
    const selected = this.selectedSection;
    if (!selected) return <Host />;

    return (
      <Host>
        <button
          ref={element => {
            this.triggerEl = element ?? null;
          }}
          id={this.triggerId}
          class={{
            'mobile-section-switcher': true,
            'mobile-section-switcher--expanded': this.menuOpen,
            'ds-focus-ring-inset': true,
            'ds-interaction-fill': true,
          }}
          type="button"
          aria-haspopup="menu"
          aria-controls={this.menuId}
          aria-expanded={String(this.menuOpen)}
          aria-label={this.triggerAriaLabel}
          onClick={this.toggleMenu}
        >
          <span
            class={{
              'mobile-section-switcher__position': true,
              'mobile-section-switcher__position--visible': this.hasPrevious,
              'ds-interaction-fill__content': true,
            }}
            aria-hidden="true"
          />
          <ds-text
            class="mobile-section-switcher__label ds-interaction-fill__content"
            as="span"
            variant="text-body-medium"
            emphasis
            color="inherit"
            lineTruncation={1}
          >
            {selected.label}
          </ds-text>
          <span
            class={{
              'mobile-section-switcher__position': true,
              'mobile-section-switcher__position--visible': this.hasNext,
              'ds-interaction-fill__content': true,
            }}
            aria-hidden="true"
          />
        </button>

        {this.selectableSections.length > 1 ? (
          <ds-menu
            id={this.menuId}
            anchorId={this.triggerId}
            align="center"
            menuLabel={this.navigationLabel}
            open={this.menuOpen}
            initialFocusVisible={this.initialFocusVisible}
            sections={this.menuSections}
            onDsClose={this.closeMenu}
            onDsSelect={this.handleSelect}
          />
        ) : null}
      </Host>
    );
  }
}
