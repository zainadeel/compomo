import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import {
  getSelectableTabs,
  type TabGroupItem,
  type TabItem,
} from '../TabGroup/tab-item-utils';
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
    return selectable.find(section => section.id === this.value)?.label ??
      selectable[0]?.label ??
      this.heading;
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
    const foreground = this.tone === 'brand' ? 'on-bold' : 'primary';

    return (
      <Host>
        <header class="mobile-header">
          <div class="mobile-header__primary ds-chrome-grid ds-chrome-space--md">
            <div class="mobile-header__lane mobile-header__lane--leading">
              <slot name="leading" />
            </div>
            <div class="mobile-header__center">
              {hasSwitcher ? (
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
                      ariaLabel={this.sectionsAriaLabel}
                      onDsChange={this.handleSectionChange}
                    />
                  ) : (
                    <ds-mobile-section-switcher
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
                  variant="text-body-medium"
                  emphasis
                  color={foreground}
                  lineTruncation={1}
                >
                  {this.selectedLabel}
                </ds-text>
              )}
            </div>
            <div class="mobile-header__lane mobile-header__lane--trailing">
              <slot name="trailing" />
            </div>
          </div>
          {hasSubsections ? (
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
}
