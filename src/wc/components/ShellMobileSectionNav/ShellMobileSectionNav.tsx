import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
} from '@stencil/core';
import type { BarNavTab } from '../BarNav/bar-nav-types';
import {
  deriveBarNavValueFromUrl,
  parseJsonArrayProp,
} from '../BarNav/bar-nav-utils';
import { getSelectableTabs, isTabDivider } from '../TabGroup/tab-item-utils';

@Component({
  tag: 'ds-shell-mobile-section-nav',
  styleUrl: 'ShellMobileSectionNav.css',
  scoped: true,
})
export class ShellMobileSectionNav {
  @Element() el!: HTMLElement;

  /** Route sections shared with the corresponding desktop BarNav. */
  @Prop() tabs: BarNavTab[] = [];
  /** JSON fallback for `tabs`. */
  @Prop({ attribute: 'tabs-json' }) tabsJson: string = '';
  /** Controlled selected tab when URL-derived selection is unavailable. */
  @Prop() value: string = '';
  /** Active primary-area label shown when the route has no section row. */
  @Prop() heading: string | undefined;
  /** Section base path used to derive the selected route tab. */
  @Prop() basePath: string = '';
  /** Current application route. */
  @Prop() currentUrl: string = '';
  @Prop() navigationLabel: string = 'Section navigation';

  /** Route intent; the application owns navigation. */
  @Event() dsTabChange!: EventEmitter<string>;

  private lastScrolledValue = '';

  private get resolvedTabs(): BarNavTab[] {
    return this.tabsJson
      ? parseJsonArrayProp<BarNavTab>(this.tabsJson, [])
      : (this.tabs ?? []);
  }

  private get urlState() {
    return deriveBarNavValueFromUrl(this.currentUrl, this.basePath, this.resolvedTabs);
  }

  private get effectiveValue(): string {
    if (this.currentUrl && this.basePath) return this.urlState.value;
    return this.value;
  }

  componentDidLoad() {
    this.scrollSelectedIntoView();
  }

  componentDidRender() {
    this.scrollSelectedIntoView();
  }

  private scrollSelectedIntoView() {
    const selectedValue = this.effectiveValue;
    if (!selectedValue || selectedValue === this.lastScrolledValue) return;
    this.lastScrolledValue = selectedValue;
    requestAnimationFrame(() => {
      this.el
        .querySelector<HTMLElement>(`[data-section-id="${CSS.escape(selectedValue)}"]`)
        ?.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
  }

  private selectTab(id: string, isInactive: boolean | undefined) {
    if (isInactive || id === this.effectiveValue) return;
    this.dsTabChange.emit(id);
  }

  render() {
    const tabs = this.resolvedTabs;
    const selectableTabs = getSelectableTabs(tabs);
    const showTabs = selectableTabs.length > 0 && !this.urlState.hideTabs;

    return (
      <Host>
        <nav class="shell-mobile-section-nav" aria-label={this.navigationLabel}>
          {showTabs ? (
            <div class="shell-mobile-section-nav__scroller ds-scrollbar-hidden">
              {tabs.map((tab, index) => {
                if (isTabDivider(tab)) {
                  return (
                    <span
                      class="shell-mobile-section-nav__divider"
                      aria-hidden="true"
                      key={`divider-${index}`}
                    />
                  );
                }

                const selected = tab.id === this.effectiveValue;
                return (
                  <button
                    type="button"
                    class={{
                      'shell-mobile-section-nav__tab': true,
                      'shell-mobile-section-nav__tab--selected': selected,
                      'ds-focus-ring-inset': true,
                      'ds-interaction-fill': true,
                    }}
                    data-section-id={tab.id}
                    disabled={tab.isInactive}
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => this.selectTab(tab.id, tab.isInactive)}
                  >
                    <ds-text
                      as="span"
                      variant="text-body-medium"
                      emphasis={selected}
                      color="inherit"
                    >
                      {tab.label}
                    </ds-text>
                    {tab.dot && (
                      <ds-badge class="shell-mobile-section-nav__dot" variant="dot" hasRing={false} label="" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <ds-text
              class="shell-mobile-section-nav__heading"
              as="span"
              variant="text-body-medium"
              emphasis
              lineTruncation={1}
            >
              {this.heading ?? ''}
            </ds-text>
          )}
        </nav>
      </Host>
    );
  }
}
