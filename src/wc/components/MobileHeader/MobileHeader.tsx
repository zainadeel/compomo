import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import { getSelectableTabs, type TabGroupItem, type TabItem } from '../TabGroup/tab-item-utils';
import type { TabGroupSize } from '../TabGroup/TabGroup';
import type {
  MobileHeaderHeadingLevel,
  MobileHeaderSectionsPresentation,
  MobileHeaderTone,
} from './mobile-header-types';

@Component({
  tag: 'ds-mobile-header',
  styleUrl: 'MobileHeader.css',
  scoped: true,
})
export class MobileHeader {
  /** Static title used when no peer sections are supplied. */
  @Prop() heading: string = '';
  /** Semantic heading level for the active mobile screen. */
  @Prop() headingLevel: MobileHeaderHeadingLevel = 'h1';
  /** Controlled peer sections. Their selected label replaces the static title. */
  @Prop() sections: TabGroupItem[] = [];
  /** Controlled selected section id. */
  @Prop() value: string = '';
  /** Accessible name for the section chooser. */
  @Prop() sectionsAriaLabel: string = 'Change page section';
  /** Popup switcher or an inline segmented TabGroup for peer sections. */
  @Prop() sectionsPresentation: MobileHeaderSectionsPresentation = 'switcher';
  /** Density for the segmented sections presentation. */
  @Prop() sectionsSize: TabGroupSize = 'md';
  /** Controlled child sections within the selected page or detail screen. */
  @Prop() subsections: TabItem[] = [];
  /** Controlled selected child-section id. */
  @Prop() subvalue: string = '';
  /** Accessible name for the child-section chooser. */
  @Prop() subsectionsAriaLabel: string = 'Change page subsection';
  /** Place local sections below, beside, or combined with the page title in one sheet trigger. */
  @Prop() subsectionsPlacement: 'below' | 'inline' | 'combined' = 'below';
  /** Default page chrome or bold-brand workflow chrome. */
  @Prop({ reflect: true }) tone: MobileHeaderTone = 'default';

  /** Section selection intent. */
  @Event() dsSectionChange!: EventEmitter<string>;
  /** Child-section selection intent. */
  @Event() dsSubsectionChange!: EventEmitter<string>;

  private get resolvedSections(): TabGroupItem[] {
    return this.sections ?? [];
  }

  private get resolvedSubsections(): TabItem[] {
    return this.subsections ?? [];
  }

  private get selectedLabel(): string {
    const selectable = getSelectableTabs(this.resolvedSections);
    return (
      selectable.find(section => section.id === this.value)?.label ??
      selectable[0]?.label ??
      this.heading
    );
  }

  private handleSectionChange = (event: CustomEvent<string>) => {
    event.stopPropagation();
    this.dsSectionChange.emit(event.detail);
  };

  private handleSubsectionChange = (event: CustomEvent<string>) => {
    event.stopPropagation();
    this.dsSubsectionChange.emit(event.detail);
  };

  render() {
    const Heading = this.headingLevel;
    const selectable = getSelectableTabs(this.resolvedSections);
    const hasSwitcher = selectable.length > 1;
    const hasSubsections = getSelectableTabs(this.resolvedSubsections).length > 1;
    const hasSegmentedSections = hasSwitcher && this.sectionsPresentation === 'segmented';
    const inlineSubsections =
      hasSubsections && !hasSwitcher && this.subsectionsPlacement === 'inline';
    const combinedSubsections =
      hasSubsections && !hasSwitcher && this.subsectionsPlacement === 'combined';
    const foreground = this.tone === 'brand' ? 'on-bold' : 'primary';

    return (
      <Host>
        <header class="mobile-header">
          <div
            class={{
              'mobile-header__primary': true,
              'mobile-header__primary--segmented': hasSegmentedSections,
              'mobile-header__primary--inline-subsections': inlineSubsections,
              'mobile-header__primary--combined-subsections': combinedSubsections,
              'ds-chrome-grid': true,
              'ds-chrome-space--md': true,
            }}
          >
            <div class="mobile-header__lane mobile-header__lane--leading">
              <slot name="leading" />
            </div>
            <div class="mobile-header__center">
              {combinedSubsections ? (
                [
                  <span
                    class="mobile-header__semantic-heading"
                    role="heading"
                    aria-level={this.headingLevel === 'h1' ? '1' : '2'}
                  >
                    {this.selectedLabel}
                  </span>,
                  <nav
                    class="mobile-header__combined-subsections"
                    aria-label={this.subsectionsAriaLabel}
                  >
                    <ds-mobile-section-switcher
                      presentation="sheet"
                      pageLabel={this.selectedLabel}
                      sections={this.resolvedSubsections}
                      value={this.subvalue}
                      navigationLabel={this.subsectionsAriaLabel}
                      onDsChange={this.handleSubsectionChange}
                    />
                  </nav>,
                ]
              ) : hasSwitcher ? (
                [
                  <span
                    class="mobile-header__semantic-heading"
                    role="heading"
                    aria-level={this.headingLevel === 'h1' ? '1' : '2'}
                  >
                    {this.selectedLabel}
                  </span>,
                  this.sectionsPresentation === 'segmented' ? (
                    <ds-tab-group
                      tabs={this.resolvedSections}
                      value={this.value}
                      size={this.sectionsSize}
                      width="fill"
                      ariaLabel={this.sectionsAriaLabel}
                      onDsChange={this.handleSectionChange}
                    />
                  ) : (
                    <ds-mobile-section-switcher
                      presentation={hasSubsections ? 'menu' : 'sheet'}
                      sections={this.resolvedSections}
                      value={this.value}
                      navigationLabel={this.sectionsAriaLabel}
                      onDsChange={this.handleSectionChange}
                    />
                  ),
                ]
              ) : (
                <ds-text
                  class="mobile-header__heading"
                  as={Heading}
                  variant="text-body-large"
                  emphasis
                  color={foreground}
                  lineTruncation={1}
                >
                  {this.selectedLabel}
                </ds-text>
              )}
              {inlineSubsections ? this.renderSubsections() : null}
            </div>
            <div class="mobile-header__lane mobile-header__lane--trailing">
              <slot name="trailing" />
            </div>
          </div>
          {hasSubsections && !inlineSubsections && !combinedSubsections ? (
            <nav class="mobile-header__subsections" aria-label={this.subsectionsAriaLabel}>
              <ds-mobile-section-switcher
                sections={this.resolvedSubsections}
                value={this.subvalue}
                navigationLabel={this.subsectionsAriaLabel}
                onDsChange={this.handleSubsectionChange}
              />
            </nav>
          ) : null}
        </header>
      </Host>
    );
  }

  private renderSubsections() {
    return (
      <nav class="mobile-header__inline-subsections" aria-label={this.subsectionsAriaLabel}>
        <ds-mobile-section-switcher
          sections={this.resolvedSubsections}
          value={this.subvalue}
          navigationLabel={this.subsectionsAriaLabel}
          onDsChange={this.handleSubsectionChange}
        />
      </nav>
    );
  }
}
