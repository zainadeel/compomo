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
import { resolveMotionTimeMs, TOKEN_DEFAULTS } from '../../utils';

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
  /** Anchored local-view menu or viewport-edge sheet for primary page sections. */
  @Prop() presentation: 'menu' | 'sheet' = 'menu';
  /** Stable page identity shown before the selected section in a sheet trigger. */
  @Prop() pageLabel: string = '';

  /** Selection intent. The route, tool, or workflow owner updates `value`. */
  @Event() dsChange!: EventEmitter<string>;

  @State() private menuOpen = false;
  @State() private menuSurfaceOpen = false;
  @State() private initialFocusVisible = false;
  @State() private pointerFocus = false;
  @State() private sheetClosing = false;
  @State() private focusedSection = '';

  private readonly instanceId = nextMobileSectionSwitcherId++;
  private readonly triggerId = `ds-mobile-section-switcher-trigger-${this.instanceId}`;
  private readonly menuId = `ds-mobile-section-switcher-menu-${this.instanceId}`;
  private triggerEl: HTMLButtonElement | null = null;
  private dialogEl: HTMLDialogElement | null = null;
  private browserEdgeEl: HTMLDivElement | null = null;
  private browserEdgeColors = '';
  private themeObserver?: MutationObserver;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private visibilityObserver?: ResizeObserver;

  private readonly handleDocumentKeyDown = (event: KeyboardEvent) => {
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;
    this.pointerFocus = false;
  };

  componentDidLoad() {
    this.el.ownerDocument.addEventListener('keydown', this.handleDocumentKeyDown, true);
    this.visibilityObserver = new ResizeObserver(() => {
      if (this.dialogEl?.open && !this.triggerEl?.getClientRects().length) {
        this.finishSheetClose(false);
      }
    });
    this.visibilityObserver.observe(this.el);
  }

  componentDidRender() {
    if (!this.dialogEl) return;
    if (this.presentation === 'sheet' && this.menuOpen && !this.dialogEl.open) {
      const initialSection = this.focusedSection;
      this.updateBrowserEdgeColor();
      this.observeBrowserEdgeTheme();
      this.dialogEl.showModal();
      this.focusSheetItem(initialSection);
    }
    if (this.sheetClosing && this.dialogEl.open && !this.closeTimer) {
      const duration = resolveMotionTimeMs(
        TOKEN_DEFAULTS.motionShort2,
        TOKEN_DEFAULTS.animationDurationShort3
      );
      if (!duration) this.finishSheetClose();
      else this.closeTimer = setTimeout(() => this.finishSheetClose(), duration);
    }
  }

  disconnectedCallback() {
    this.el.ownerDocument.removeEventListener('keydown', this.handleDocumentKeyDown, true);
    this.visibilityObserver?.disconnect();
    this.menuSurfaceOpen = false;
    this.finishSheetClose(false);
  }

  @Watch('presentation')
  handlePresentationChange() {
    this.menuSurfaceOpen = false;
    this.closeMenu();
  }

  @Watch('value')
  @Watch('pageLabel')
  handleContextChange() {
    this.closeMenu();
  }

  private finishSheetClose(restoreFocus = true) {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
    const wasOpen = this.dialogEl?.open;
    this.dialogEl?.close();
    this.themeObserver?.disconnect();
    this.menuOpen = false;
    this.sheetClosing = false;
    if (wasOpen && restoreFocus && this.triggerEl?.getClientRects().length) this.triggerEl.focus();
  }

  private updateBrowserEdgeColor = () => {
    if (!this.browserEdgeEl || !this.dialogEl) return;
    const base = getComputedStyle(this.browserEdgeEl).color;
    const shade = getComputedStyle(this.dialogEl, '::backdrop').backgroundColor;
    const colors = `${base}|${shade}`;
    if (colors === this.browserEdgeColors) return;
    // Let the browser resolve token colors, including alpha and non-sRGB syntax,
    // then flatten the shade over the bar into the opaque color Safari samples.
    const canvas = this.el.ownerDocument.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = base;
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = shade;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    this.browserEdgeEl.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
    this.browserEdgeColors = colors;
  };

  private observeBrowserEdgeTheme() {
    this.themeObserver ??= new MutationObserver(this.updateBrowserEdgeColor);
    // Token themes are inherited from the page or a containing theme scope.
    for (let ancestor: HTMLElement | null = this.el; ancestor; ancestor = ancestor.parentElement) {
      this.themeObserver.observe(ancestor, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme'],
      });
    }
  }

  private focusSheetItem(id: string) {
    const buttons = Array.from(this.dialogEl?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const button =
      buttons.find(item => item.value === id && !item.disabled) ??
      buttons.find(item => !item.disabled);
    if (button) {
      this.focusedSection = button.value;
      button.focus();
    } else this.dialogEl?.focus();
  }

  private handleSheetKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeMenu();
      return;
    }
    const sections = this.selectableSections.filter(section => !section.isInactive);
    if (!sections.length) return;
    const index = Math.max(
      0,
      sections.findIndex(section => section.id === this.focusedSection)
    );
    let next: number;
    if (event.key === 'ArrowDown') next = (index + 1) % sections.length;
    else if (event.key === 'ArrowUp') next = (index + sections.length - 1) % sections.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = sections.length - 1;
    else if (event.key === 'Tab') next = index;
    else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      event.key !== ' '
    ) {
      const match = sections.findIndex((_, offset) =>
        sections[(index + offset + 1) % sections.length].label
          .toLowerCase()
          .startsWith(event.key.toLowerCase())
      );
      if (match < 0) return;
      next = (index + match + 1) % sections.length;
    } else return;
    event.preventDefault();
    this.initialFocusVisible = true;
    this.focusSheetItem(sections[next].id);
  };

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
    return `${this.presentation === 'sheet' && this.pageLabel ? `${this.pageLabel}. ` : ''}${this.navigationLabel}. Current section: ${this.selectedSection?.label ?? ''}`;
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
    if (this.selectableSections.length <= 1) {
      this.closeMenu();
      this.menuSurfaceOpen = false;
    } else if (this.dialogEl?.open && !this.sheetClosing) this.focusSheetItem(this.focusedSection);
  }

  private toggleMenu = (event: MouseEvent) => {
    if (this.selectableSections.length <= 1) return;
    this.initialFocusVisible = event.detail === 0;
    if (this.presentation === 'sheet') {
      if (this.menuOpen) this.closeMenu();
      else {
        this.focusedSection = this.selectedSection?.id ?? '';
        this.menuOpen = true;
      }
      return;
    }
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.menuSurfaceOpen = true;
  };

  private closeMenu = () => {
    this.menuOpen = false;
    if (this.dialogEl?.open) this.sheetClosing = true;
  };

  private renderSheet() {
    return (
      <dialog
        id={this.menuId}
        ref={element => {
          this.dialogEl = element ?? null;
        }}
        class={{ 'mobile-section-sheet': true, 'mobile-section-sheet--closing': this.sheetClosing }}
        aria-label={this.navigationLabel}
        tabIndex={-1}
        onCancel={event => {
          event.preventDefault();
          this.closeMenu();
        }}
        onKeyDown={this.handleSheetKeyDown}
        onClick={event => {
          if (!this.dialogEl || event.target !== this.dialogEl) return;
          const rect = this.dialogEl.getBoundingClientRect();
          if (
            event.clientY < rect.top ||
            event.clientY > rect.bottom ||
            event.clientX < rect.left ||
            event.clientX > rect.right
          )
            this.closeMenu();
        }}
      >
        <div class="mobile-section-sheet__items" role="menu" aria-label={this.navigationLabel}>
          {this.resolvedSections.map(section =>
            isTabDivider(section) ? (
              <div class="mobile-section-sheet__divider" role="separator" />
            ) : (
              <button
                type="button"
                role="menuitem"
                value={section.id}
                disabled={section.isInactive}
                aria-current={section.id === this.selectedSection?.id ? 'page' : undefined}
                tabIndex={section.id === this.focusedSection ? 0 : -1}
                class={{
                  'mobile-section-sheet__item': true,
                  'ds-control--lg': true,
                  'ds-interaction-fill': true,
                  'ds-focus-ring-inset': true,
                  'ds-focus-ring--visible':
                    this.initialFocusVisible && section.id === this.focusedSection,
                }}
                onFocus={() => {
                  this.focusedSection = section.id;
                }}
                onClick={() => {
                  if (this.sheetClosing || section.isInactive) return;
                  this.closeMenu();
                  if (section.id !== this.selectedSection?.id) this.dsChange.emit(section.id);
                }}
              >
                <ds-text
                  class="mobile-section-sheet__label ds-interaction-fill__content"
                  as="span"
                  variant="text-body-large"
                  color="inherit"
                  emphasis={section.id === this.selectedSection?.id}
                  lineTruncation={1}
                >
                  {section.label}
                </ds-text>
              </button>
            )
          )}
        </div>
        <div
          ref={element => {
            if (this.browserEdgeEl !== element) this.browserEdgeColors = '';
            this.browserEdgeEl = element ?? null;
          }}
          class="mobile-section-sheet__browser-edge"
          aria-hidden="true"
        />
      </dialog>
    );
  }

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
    const combined = this.presentation === 'sheet' && !!this.pageLabel;

    return (
      <Host
        class={{ 'mobile-section-switcher--pointer-focus': this.pointerFocus }}
        onPointerDown={() => {
          this.pointerFocus = true;
          this.initialFocusVisible = false;
        }}
      >
        <button
          ref={element => {
            this.triggerEl = element ?? null;
          }}
          id={this.triggerId}
          class={{
            'mobile-section-switcher': true,
            'mobile-section-switcher--expanded': this.menuOpen,
            'ds-interaction-fill--surface-open':
              this.menuSurfaceOpen || this.menuOpen || this.sheetClosing,
            'mobile-section-switcher--sheet': this.presentation === 'sheet',
            'mobile-section-switcher--combined': combined,
            'ds-focus-ring-inset': true,
            'ds-interaction-fill': true,
          }}
          type="button"
          aria-haspopup={this.presentation === 'sheet' ? 'dialog' : 'menu'}
          aria-controls={this.menuId}
          aria-expanded={String(this.menuOpen)}
          aria-label={this.triggerAriaLabel}
          onClick={this.toggleMenu}
        >
          {this.presentation === 'menu' ? (
            <span
              class={{
                'mobile-section-switcher__position': true,
                'mobile-section-switcher__position--visible': this.hasPrevious,
                'ds-interaction-fill__content': true,
              }}
              aria-hidden="true"
            />
          ) : null}
          {combined
            ? [
                <ds-text
                  class="mobile-section-switcher__page-label ds-interaction-fill__content"
                  as="span"
                  variant="text-body-large"
                  emphasis
                  color="inherit"
                  lineTruncation={1}
                >
                  {this.pageLabel}
                </ds-text>,
                <ds-text
                  class="mobile-section-switcher__separator ds-interaction-fill__content"
                  as="span"
                  variant="text-body-large"
                  color="inherit"
                  aria-hidden="true"
                >
                  ·
                </ds-text>,
              ]
            : null}
          <ds-text
            class="mobile-section-switcher__label ds-interaction-fill__content"
            as="span"
            variant={this.presentation === 'sheet' ? 'text-body-large' : 'text-body-medium'}
            emphasis
            color="inherit"
            lineTruncation={1}
          >
            {selected.label}
          </ds-text>
          {this.presentation === 'menu' ? (
            <span
              class={{
                'mobile-section-switcher__position': true,
                'mobile-section-switcher__position--visible': this.hasNext,
                'ds-interaction-fill__content': true,
              }}
              aria-hidden="true"
            />
          ) : null}
        </button>

        {this.presentation === 'sheet' || this.sheetClosing ? (
          this.renderSheet()
        ) : this.selectableSections.length > 1 ? (
          <ds-menu
            id={this.menuId}
            anchorId={this.triggerId}
            align="center"
            menuLabel={this.navigationLabel}
            open={this.menuOpen}
            initialFocusVisible={this.initialFocusVisible}
            sections={this.menuSections}
            onDsClose={this.closeMenu}
            onDsAfterClose={() => {
              if (!this.menuOpen) this.menuSurfaceOpen = false;
            }}
            onDsSelect={this.handleSelect}
          />
        ) : null}
      </Host>
    );
  }
}
