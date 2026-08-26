import type { MenuSection } from './menu-types';
import { isMenuSwatchPickerSection } from './menu-types';

/** Preserve the exact menu context painted during exit motion. */
export function snapshotMenuSections(sections: readonly MenuSection[]): MenuSection[] {
  return sections.map(section => {
    if (isMenuSwatchPickerSection(section)) {
      return {
        ...section,
        ...(section.options ? { options: section.options.map(option => ({ ...option })) } : {}),
        ...(section.sections
          ? {
              sections: section.sections.map(swatchSection => ({
                ...swatchSection,
                options: swatchSection.options.map(option => ({ ...option })),
              })),
            }
          : {}),
      };
    }
    return { ...section, items: section.items.map(item => ({ ...item })) };
  });
}
